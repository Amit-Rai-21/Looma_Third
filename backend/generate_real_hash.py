from passlib.context import CryptContext

# Use the EXACT same configuration as your system
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
BCRYPT_MAX_LENGTH = 72

def get_password_hash(password: str) -> str:
    safe_password = password[:BCRYPT_MAX_LENGTH]
    return pwd_context.hash(safe_password)

# Generate hashes for your passwords
passwords = {
    "admin123": None,
    "user123": None,
    "staff123": None
}

print("="*70)
print("GENERATING PASSWORD HASHES")
print("="*70)

for password in passwords.keys():
    hashed = get_password_hash(password)
    passwords[password] = hashed
    print(f"\nPassword: {password}")
    print(f"Hash: {hashed}")

print("\n" + "="*70)
print("COPY THESE HASHES TO MONGODB")
print("="*70)
print("\nFor admin user, use:")
print(passwords["admin123"])
print("\nFor staff user, use:")
print(passwords["staff123"])
print("\nFor regular user, use:")
print(passwords["user123"])
print("="*70)