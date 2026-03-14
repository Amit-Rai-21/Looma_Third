import paramiko
import asyncio
import json

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect

from app.core.deps import admin_only_ws
from app.core.config import settings
from app.services.schools import school_exists_by_looma

router = APIRouter()

@router.websocket("/terminal/{looma_id}")
async def terminal_ws(ws: WebSocket, looma_id: str, _ = Depends(admin_only_ws)):
    await ws.accept()
    
    if not school_exists_by_looma(looma_id):
        await ws.close(code=4404)
        return

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    client.connect(hostname=settings.SSH_HOSTNAME, username=settings.SSH_USERNAME, password=settings.SSH_PASSWORD)

    remote_command = f"looma access {looma_id} && clear && echo 'could not connect to device' && exit\n"

    channel = client.invoke_shell(term="xterm", width=80, height=24)
    channel.send(remote_command.encode())

    async def ssh_to_ws():
        while True:
            if channel.recv_ready():
                data = channel.recv(4096)
                await ws.send_bytes(data)
            await asyncio.sleep(0.01)

    async def ws_to_ssh():
        while True:
            data = await ws.receive_text()

            if data.startswith("{"):
                msg = json.loads(data)
                if msg["type"] == "resize":
                    channel.resize_pty(width=msg["cols"], height=msg["rows"])
            else:
                channel.send(data.encode())

    try:
        await asyncio.gather(ssh_to_ws(), ws_to_ssh())
    except WebSocketDisconnect:
        pass
    finally:
        channel.close()
        client.close()
