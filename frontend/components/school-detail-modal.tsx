"use client";

import { useState, useRef, useEffect } from "react";
import type { School } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { schoolsAPI } from "@/lib/api-client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MapPin,
  Monitor,
  Mail,
  Phone,
  User,
  Terminal,
  Building,
  X,
  School as SchoolIcon,
  Pencil,
  Loader2,
  Check,
  Camera,
  ExternalLink,
} from "lucide-react";
import Image from "next/image";
import dynamic from "next/dynamic";

const TerminalComponent = dynamic(() => import("@/components/terminal"), {
  ssr: false,
});

interface SchoolDetailModalProps {
  school: School | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: (updated: School) => void;
}

const schoolImages = [
  "/schools/school-1.jpg",
  "/schools/school-2.jpg",
  "/schools/school-3.jpg",
  "/schools/school-4.jpg",
  "/schools/school-5.jpg",
];

function DefaultSchoolImage({ schoolName }: { schoolName: string }) {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-[#1a2c5b] via-[#2d4278] to-[#1a2c5b] flex items-center justify-center">
      <div className="text-center">
        <SchoolIcon className="h-24 w-24 text-white/20 mx-auto" />
      </div>
    </div>
  );
}

function getSchoolImage(schoolId: string): string {
  const hash = schoolId
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return schoolImages[hash % schoolImages.length];
}

function formatCoordinate(
  value: number | null | undefined,
  decimals: number = 2,
): string {
  if (value === null || value === undefined || isNaN(value)) return "N/A";
  return value.toFixed(decimals);
}

// ─── Edit Form State ────────────────────────────────────────────────────────
interface EditFormState {
  name: string;
  province: string;
  district: string;
  palika: string;
  latitude: string;
  longitude: string;
  headmaster: string;
  email: string;
  phone: string;
  loomaId: string;
  serialNumber: string;
  version: string;
}

// Image preview state (base64 or existing URL)
type ImagePreview = { src: string; file: File } | null;

function buildFormState(school: School): EditFormState {
  return {
    name: school.name ?? "",
    province: school.province ?? "",
    district: school.district ?? "",
    palika: school.palika ?? "",
    latitude:
      school.latitude != null && !isNaN(school.latitude)
        ? String(school.latitude)
        : "",
    longitude:
      school.longitude != null && !isNaN(school.longitude)
        ? String(school.longitude)
        : "",
    headmaster: school.contact?.headmaster ?? "",
    email: school.contact?.email ?? "",
    phone: school.contact?.phone ?? "",
    loomaId: school.loomaId ?? "",
    serialNumber: school.looma?.serialNumber ?? "",
    version: school.looma?.version ?? "",
  };
}

// ─── Reusable Field Row ──────────────────────────────────────────────────────
function FieldRow({
  label,
  value,
  editMode,
  name,
  formState,
  onChange,
  type = "text",
  href,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  editMode: boolean;
  name: keyof EditFormState;
  formState: EditFormState;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  href?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4 items-start">
      <span className="text-muted-foreground shrink-0">{label}</span>
      {editMode ? (
        <Input
          name={name}
          type={type}
          value={formState[name]}
          onChange={onChange}
          className={`h-7 text-xs text-right w-40 ${mono ? "font-mono" : ""}`}
        />
      ) : (
        <span
          className={`text-right break-words flex-1 ${mono ? "font-mono text-xs" : ""}`}
        >
          {href ? (
            <a href={href} className="text-primary hover:underline break-all">
              {value}
            </a>
          ) : (
            value || "N/A"
          )}
        </span>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function SchoolDetailModal({
  school,
  isOpen,
  onClose,
  onUpdated,
}: SchoolDetailModalProps) {
  const { user } = useAuth();
  const isViewer = user?.role === "viewer";
  const canAccessSSH = user?.role === "admin";
  const canEdit = user?.role === "admin" || user?.role === "staff";

  const [terminalOpen, setTerminalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  // ── Edit state ──
  const [editMode, setEditMode] = useState(false);
  const [formState, setFormState] = useState<EditFormState>(() =>
    school ? buildFormState(school) : ({} as EditFormState),
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState<ImagePreview>(null);
  const [localImage, setLocalImage] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);

  const schoolImage: string | null = (school as any)?.image ?? null;

  useEffect(() => {
    setImageError(false);
    if (school) {
      setFormState(buildFormState(school));
      setEditMode(false);
      setError(null);
      setSaveSuccess(false);
      setImagePreview(null);
      setLocalImage(schoolImage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [school?.id, schoolImage, isOpen]);

  // ── Handlers ──
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
    setSaveSuccess(false);
  };

  const handleCancelEdit = () => {
    if (school) setFormState(buildFormState(school));
    setEditMode(false);
    setError(null);
    setSaveSuccess(false);
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be smaller than 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview({ src: reader.result as string, file });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!school) return;
    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    const lat = parseFloat(formState.latitude);
    const lng = parseFloat(formState.longitude);

    const payload: Partial<School> = {
      name: formState.name || undefined,
      province: formState.province || undefined,
      district: formState.district || undefined,
      palika: formState.palika || undefined,
      latitude: !isNaN(lat) ? lat : undefined,
      longitude: !isNaN(lng) ? lng : undefined,
      loomaId: formState.loomaId || undefined,
      contact: {
        headmaster: formState.headmaster,
        email: formState.email,
        phone: formState.phone,
      },
      looma: {
        ...school.looma,
        serialNumber: formState.serialNumber,
        version: formState.version,
      },
      ...(imagePreview?.src ? { image: imagePreview.src } : {}),
    };

    try {
      await schoolsAPI.update(school.id, payload);
      setSaveSuccess(true);
      setEditMode(false);

      const savedImage = imagePreview?.src ?? schoolImage ?? null;
      setLocalImage(savedImage);
      setImagePreview(null);

      const updatedSchool: School = {
        ...school,
        name: formState.name || school.name,
        province: formState.province || school.province,
        district: formState.district || school.district,
        palika: formState.palika || school.palika,
        loomaId: formState.loomaId || school.loomaId,
        latitude: !isNaN(parseFloat(formState.latitude))
          ? parseFloat(formState.latitude)
          : school.latitude,
        longitude: !isNaN(parseFloat(formState.longitude))
          ? parseFloat(formState.longitude)
          : school.longitude,
        contact: {
          headmaster: formState.headmaster,
          email: formState.email,
          phone: formState.phone,
        },
        looma: {
          ...school.looma,
          serialNumber: formState.serialNumber,
          version: formState.version,
        },
        ...(savedImage ? { image: savedImage } : {}),
      } as School;

      if (onUpdated) onUpdated(updatedSchool);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.message ?? "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  // ── Terminal logic ──
  const openTerminal = () => {
    setTerminalOpen(true);
  };

  const closeTerminal = () => {
    setTerminalOpen(false);
  };

  if (!school) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* ── Hero Image ── */}
        <div className="relative h-40 w-full overflow-hidden">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
            onClick={(e) => {
              (e.target as HTMLInputElement).value = "";
            }}
          />

          {imagePreview ? (
            <Image
              src={imagePreview.src}
              alt="Preview"
              fill
              className="object-cover"
            />
          ) : localImage ? (
            <Image
              src={localImage}
              alt={school.name}
              fill
              className="object-cover"
              onError={() => setLocalImage(null)}
            />
          ) : (school as any).image ? (
            <Image
              src={(school as any).image}
              alt={school.name}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
            />
          ) : !imageError ? (
            <Image
              src={getSchoolImage(school.id)}
              alt={school.name}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <DefaultSchoolImage schoolName={school.name} />
          )}

          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60" />

          {editMode && (
            <>
              <div className="absolute inset-0 bg-black/40 z-10 pointer-events-none" />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                aria-label="Change school image"
                className="absolute z-20 pointer-events-auto
                           flex flex-col items-center justify-center gap-2 cursor-pointer
                           w-36 h-24
                           left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                           rounded-xl
                           bg-black/20 hover:bg-black/50
                           transition-all duration-200 group"
              >
                <Camera className="h-7 w-7 text-white drop-shadow-lg group-hover:scale-110 transition-transform duration-200" />
                <span className="text-white text-xs font-semibold drop-shadow-lg">
                  {imagePreview ? "Change Image" : "Upload Image"}
                </span>
                {imagePreview && (
                  <span className="text-green-300 text-[10px] font-medium">
                    ✓ Selected
                  </span>
                )}
              </button>
            </>
          )}

          <div className="absolute bottom-4 left-6 right-6 z-10">
            <div className="flex items-end justify-between gap-4">
              <div>
                <DialogTitle
                  className="text-xl text-white font-semibold tracking-tight"
                  style={{
                    textShadow:
                      "0 2px 4px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,1)",
                  }}
                >
                  {school.name}
                </DialogTitle>
                <DialogDescription
                  className="text-sm text-white mt-1.5 flex items-center gap-2 font-medium"
                  style={{
                    textShadow:
                      "0 2px 4px rgba(0,0,0,0.9), 0 1px 2px rgba(0,0,0,1)",
                  }}
                >
                  <MapPin className="h-4 w-4 drop-shadow-lg" />
                  {school.palika || "N/A"}, {school.district || "N/A"},{" "}
                  {school.province || "N/A"}
                </DialogDescription>
              </div>

              {canEdit && (
                <div className="flex items-center gap-2">
                  {editMode ? (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancelEdit}
                        disabled={saving}
                        className="h-8 text-white hover:text-white hover:bg-white/20 border border-white/30"
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={saving}
                        className="h-8 bg-white text-[#1a2c5b] hover:bg-white/90 font-semibold"
                      >
                        {saving ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5 mr-1" />
                        )}
                        {saving ? "Saving…" : "Save"}
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditMode(true)}
                      className="h-8 text-white hover:text-white hover:bg-white/20 border border-white/30"
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 pt-4 flex-1 overflow-hidden flex flex-col">
          <DialogHeader className="sr-only">
            <DialogTitle>{school.name}</DialogTitle>
            <DialogDescription>
              School details for {school.name}
            </DialogDescription>
          </DialogHeader>

          {saveError && (
            <div className="mb-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
              {saveError}
            </div>
          )}
          {saveSuccess && (
            <div className="mb-3 text-xs text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2 flex items-center gap-2">
              <Check className="h-3.5 w-3.5" />
              School information updated successfully.
            </div>
          )}

          <Tabs defaultValue="info" className="flex-1 flex flex-col min-h-0">
            <TabsList className={`grid w-full ${canAccessSSH ? "grid-cols-2" : "grid-cols-1"}`}>
              <TabsTrigger value="info">Info</TabsTrigger>
              {canAccessSSH && (
                <TabsTrigger value="remote">Remote</TabsTrigger>
              )}
            </TabsList>

            <div className="flex-1 mt-4 min-h-0 overflow-auto pr-2 space-y-4">
              {/* ══════════════ INFO TAB ══════════════ */}
              <TabsContent
                value="info"
                className="mt-0 space-y-4 focus-visible:outline-none"
              >
                <div className="grid md:grid-cols-2 gap-4">
                  {/* ── School Information ── */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        School Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {editMode && (
                        <div className="flex justify-between gap-4 items-center">
                          <span className="text-muted-foreground shrink-0">
                            Name
                          </span>
                          <Input
                            name="name"
                            value={formState.name}
                            onChange={handleFormChange}
                            className="h-7 text-xs text-right w-40"
                          />
                        </div>
                      )}
                      <FieldRow
                        label="Province"
                        value={school.province || "N/A"}
                        editMode={editMode}
                        name="province"
                        formState={formState}
                        onChange={handleFormChange}
                      />
                      <FieldRow
                        label="District"
                        value={school.district || "N/A"}
                        editMode={editMode}
                        name="district"
                        formState={formState}
                        onChange={handleFormChange}
                      />
                      <FieldRow
                        label="Palika"
                        value={school.palika || "N/A"}
                        editMode={editMode}
                        name="palika"
                        formState={formState}
                        onChange={handleFormChange}
                      />
                      {editMode ? (
                        <>
                          <div className="flex justify-between gap-4 items-center">
                            <span className="text-muted-foreground shrink-0">
                              Latitude
                            </span>
                            <Input
                              name="latitude"
                              type="number"
                              value={formState.latitude}
                              onChange={handleFormChange}
                              className="h-7 text-xs text-right w-40 font-mono"
                            />
                          </div>
                          <div className="flex justify-between gap-4 items-center">
                            <span className="text-muted-foreground shrink-0">
                              Longitude
                            </span>
                            <Input
                              name="longitude"
                              type="number"
                              value={formState.longitude}
                              onChange={handleFormChange}
                              className="h-7 text-xs text-right w-40 font-mono"
                            />
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between gap-4 items-center">
                          <span className="text-muted-foreground shrink-0">Coordinates</span>
                          <code className="font-mono text-xs text-right">
                            [{school.latitude != null ? school.latitude.toFixed(2) : "N/A"}, {school.longitude != null ? school.longitude.toFixed(2) : "N/A"}]
                          </code>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* ── Contact Information ── */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Contact Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {editMode ? (
                        <>
                          <div className="flex justify-between gap-4 items-center">
                            <span className="text-muted-foreground shrink-0 flex items-center gap-1">
                              <User className="h-4 w-4" /> Headmaster
                            </span>
                            <Input
                              name="headmaster"
                              value={formState.headmaster}
                              onChange={handleFormChange}
                              className="h-7 text-xs text-right w-40"
                            />
                          </div>
                          <div className="flex justify-between gap-4 items-center">
                            <span className="text-muted-foreground shrink-0 flex items-center gap-1">
                              <Mail className="h-4 w-4" /> Email
                            </span>
                            <Input
                              name="email"
                              type="email"
                              value={formState.email}
                              onChange={handleFormChange}
                              className="h-7 text-xs text-right w-40"
                            />
                          </div>
                          <div className="flex justify-between gap-4 items-center">
                            <span className="text-muted-foreground shrink-0 flex items-center gap-1">
                              <Phone className="h-4 w-4" /> Phone
                            </span>
                            <Input
                              name="phone"
                              type="tel"
                              value={formState.phone}
                              onChange={handleFormChange}
                              className="h-7 text-xs text-right w-40"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-start gap-2">
                            <User className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <span className="break-words flex-1">
                              {school.contact?.headmaster || "N/A"}
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            {school.contact?.email ? (
                              <a
                                href={`mailto:${school.contact.email}`}
                                className="text-primary hover:underline break-all flex-1"
                              >
                                {school.contact.email}
                              </a>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </div>
                          <div className="flex items-start gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            {school.contact?.phone ? (
                              <a
                                href={`tel:${school.contact.phone}`}
                                className="text-primary hover:underline break-all flex-1"
                              >
                                {school.contact.phone}
                              </a>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* ── Looma Device — hidden for viewer ── */}
                  {!isViewer && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Monitor className="h-4 w-4" />
                          Looma Device
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <FieldRow
                          label="Device ID"
                          value={school.loomaId || "N/A"}
                          editMode={editMode}
                          name="loomaId"
                          formState={formState}
                          onChange={handleFormChange}
                          mono
                        />
                        <FieldRow
                          label="Serial Number"
                          value={school.looma?.serialNumber || "N/A"}
                          editMode={editMode}
                          name="serialNumber"
                          formState={formState}
                          onChange={handleFormChange}
                          mono
                        />
                        <FieldRow
                          label="Version"
                          value={school.looma?.version || "N/A"}
                          editMode={editMode}
                          name="version"
                          formState={formState}
                          onChange={handleFormChange}
                          mono
                        />
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* ══════════════ REMOTE TAB ══════════════ */}
              <TabsContent
                value="remote"
                className="mt-0 focus-visible:outline-none"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Terminal className="h-4 w-4" />
                      Remote Shell Access
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {terminalOpen ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-muted-foreground font-mono">
                            SSH: looma@
                            {school.loomaId?.toLowerCase() ?? "device"}
                            .looma.local
                          </span>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(`/terminal/${school.loomaId}`, "_blank")}
                              className="h-6 w-6 p-0"
                              title="Open in new tab"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={closeTerminal}
                              className="h-6 w-6 p-0"
                              title="Close terminal"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="rounded-lg overflow-hidden h-64">
                          <TerminalComponent
                            socketUrl={`${typeof window !== "undefined" ? (window.location.protocol === "https:" ? "wss" : "ws") : "ws"}://${typeof window !== "undefined" ? window.location.host : "localhost"}/api/ws/terminal/${school.loomaId}`}
                            className="h-full"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Open a secure SSH connection to remotely access and
                          manage this Looma device.
                        </p>
                        <div className="bg-sidebar text-sidebar-foreground rounded-lg p-4 font-mono text-sm">
                          <p className="text-muted-foreground mb-2">
                            $ ssh looma@
                            {school.loomaId?.toLowerCase() ?? "unknown"}
                            .looma.local
                          </p>
                          <p className="text-green-400">
                            Ready to connect to{" "}
                            {school.loomaId ?? "Unknown Device"}
                          </p>
                        </div>
                        <Button className="w-full gap-2" onClick={openTerminal}>
                          <Terminal className="h-4 w-4" />
                          Open Remote Shell
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
