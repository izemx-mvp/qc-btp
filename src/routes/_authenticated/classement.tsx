import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FolderOpen,
  FileText,
  CheckCircle2,
  Circle,
  Search,
  Share2,
  Download,
  Folder,
  Upload,
  FileSignature,
  ExternalLink,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/app-layout";
import { NCBadge, ResultBadge } from "@/components/status-badge";
import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { exportInspectionPDF } from "@/lib/pdf";
import type { ClientPlatform, Inspection, Project } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/classement")({
  component: Classement,
});

function Classement() {
  const { data, setInspections } = useStore();
  const [openProjects, setOpenProjects] = useState<Record<string, boolean>>({});
  const [openTypes, setOpenTypes] = useState<Record<string, boolean>>({});
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [shareTarget, setShareTarget] = useState<Inspection | null>(null);

  const toggleP = (id: string) => setOpenProjects({ ...openProjects, [id]: !(openProjects[id] ?? true) });
  const toggleT = (k: string) => setOpenTypes({ ...openTypes, [k]: !(openTypes[k] ?? true) });

  const controlTypes = useMemo(
    () => Array.from(new Set(data.inspections.map((i) => i.controlType))),
    [data.inspections],
  );

  const matches = (text: string) => (q ? text.toLowerCase().includes(q.toLowerCase()) : true);

  const unshare = (id: string) => {
    setInspections(
      data.inspections.map((i) =>
        i.id === id
          ? {
              ...i,
              sharedWithClient: false,
              sharedDestination: undefined,
              sharedAt: undefined,
              sharedLink: undefined,
              signedPdfName: undefined,
              signedPdfUploadedAt: undefined,
            }
          : i,
      ),
    );
    toast.success("Retiré du partage client");
  };

  return (
    <div>
      <PageHeader
        title="Classement documentaire"
        description="Arborescence Projet → Type de contrôle → Inspection. Partage vers Google Drive ou SharePoint du client."
        breadcrumb="Référentiel · Archives"
      />
      <div className="p-4 md:p-8 space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="relative flex-1 min-w-0 max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher un dossier / projet…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="md:w-56"><SelectValue placeholder="Type de contrôle" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {controlTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="panel-elevated overflow-hidden">
          {data.projects.map((p) => {
            if (!matches(`${p.code} ${p.name} ${p.client}`)) return null;
            const insps = data.inspections
              .filter((i) => i.projectId === p.id)
              .filter((i) => typeFilter === "all" || i.controlType === typeFilter);
            const types = Array.from(new Set(insps.map((i) => i.controlType)));
            const pOpen = openProjects[p.id] ?? true;
            const sharedCount = insps.filter((i) => i.sharedWithClient).length;
            return (
              <div key={p.id} className="border-b border-border last:border-0">
                <div className="flex items-center gap-2 pr-3 hover:bg-white/[0.02] transition-colors">
                  <button onClick={() => toggleP(p.id)} className="flex flex-1 items-center gap-2 px-4 py-3 text-left">
                    {pOpen ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    <FolderOpen className={cn("h-4 w-4", pOpen ? "text-primary" : "text-muted-foreground")} />
                    <span className="mono text-[11px] text-muted-foreground">{p.code}</span>
                    <span className="font-semibold text-foreground">{p.name}</span>
                    <span className="ml-2 mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {insps.length} insp. · {sharedCount} partagée{sharedCount > 1 ? "s" : ""}
                    </span>
                  </button>
                  <PlatformBadge platform={p.clientPlatform} folder={p.clientFolderPath} />
                </div>
                {pOpen && (
                  <div className="pl-6 bg-black/20">
                    {types.map((t) => {
                      const key = `${p.id}::${t}`;
                      const tOpen = openTypes[key] ?? true;
                      const forType = insps.filter((i) => i.controlType === t);
                      return (
                        <div key={key} className="border-t border-border">
                          <button
                            onClick={() => toggleT(key)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-white/[0.03] transition-colors"
                          >
                            {tOpen ? <ChevronDown className="h-4 w-4 text-primary/80" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                            <Folder className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{t}</span>
                            <span className="ml-auto mono text-[10px] uppercase tracking-widest text-muted-foreground">{forType.length}</span>
                          </button>
                          {tOpen && (
                            <ul className="pl-6 bg-white/[0.015]">
                              {forType.map((i) => (
                                <li key={i.id} className="border-t border-border">
                                  <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2 hover:bg-white/[0.03] transition-colors">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <Link
                                      to="/inspections/$inspectionId"
                                      params={{ inspectionId: i.id }}
                                      className="min-w-0"
                                    >
                                      <div className="text-sm truncate hover:text-primary transition-colors">
                                        <span className="mono text-muted-foreground text-xs mr-2">{i.number}</span>
                                        {i.zone || "—"}
                                      </div>
                                      <div className="mono text-[10px] text-muted-foreground uppercase tracking-widest">
                                        {i.date}
                                        {i.signedPdfName && (
                                          <> · <FileSignature className="inline h-3 w-3 -mt-0.5" /> signé</>
                                        )}
                                      </div>
                                    </Link>
                                    <div className="flex items-center gap-2">
                                      <ResultBadge result={i.result} />
                                      <NCBadge status={i.ncStatus} />
                                      {i.sharedWithClient ? (
                                        <SharedChip inspection={i} onUnshare={() => unshare(i.id)} />
                                      ) : (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => setShareTarget(i)}
                                          className="h-7 gap-1.5"
                                        >
                                          <Share2 className="h-3.5 w-3.5" /> Partager
                                        </Button>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={async () => {
                                          try {
                                            await exportInspectionPDF(i, p);
                                          } catch {
                                            toast.error("Export impossible");
                                          }
                                        }}
                                        title="Télécharger le PDF"
                                      >
                                        <Download className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                    {types.length === 0 && (
                      <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground italic">
                        Aucune inspection classée.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {data.projects.length === 0 && (
            <div className="p-6 text-sm text-muted-foreground text-center">Aucun projet.</div>
          )}
        </div>
      </div>

      <ShareDialog
        inspection={shareTarget}
        project={shareTarget ? data.projects.find((p) => p.id === shareTarget.projectId) ?? null : null}
        onClose={() => setShareTarget(null)}
        onConfirm={(patch) => {
          if (!shareTarget) return;
          setInspections(
            data.inspections.map((x) =>
              x.id === shareTarget.id ? { ...x, ...patch, sharedWithClient: true, stage: "partage" } : x,
            ),
          );
          setShareTarget(null);
          toast.success(
            patch.sharedDestination === "gdrive"
              ? "Partagé sur Google Drive du client"
              : "Partagé sur SharePoint du client",
          );
        }}
      />
    </div>
  );
}

function PlatformBadge({ platform, folder }: { platform?: ClientPlatform; folder?: string }) {
  if (!platform) return null;
  const label = platform === "gdrive" ? "Google Drive" : "SharePoint";
  return (
    <span
      title={folder}
      className="hidden md:inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/5 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-primary/90"
    >
      {platform === "gdrive" ? <GDriveIcon /> : <SharepointIcon />}
      {label}
    </span>
  );
}

function SharedChip({ inspection, onUnshare }: { inspection: Inspection; onUnshare: () => void }) {
  const dest = inspection.sharedDestination;
  return (
    <div className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 pl-1.5 pr-0.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-400">
      <CheckCircle2 className="h-3 w-3" />
      <span>Partagé</span>
      {dest && (
        <a
          href={inspection.sharedLink ?? "#"}
          target="_blank"
          rel="noreferrer"
          className="ml-1 inline-flex items-center gap-1 rounded bg-black/30 px-1.5 py-0.5 text-emerald-300 hover:text-white"
          title={inspection.sharedLink}
        >
          {dest === "gdrive" ? <GDriveIcon /> : <SharepointIcon />}
          <ExternalLink className="h-2.5 w-2.5" />
        </a>
      )}
      <button
        onClick={onUnshare}
        className="ml-0.5 rounded px-1 py-0.5 text-emerald-300/70 hover:bg-black/30 hover:text-white"
        title="Retirer le partage"
      >
        <Circle className="h-3 w-3" />
      </button>
    </div>
  );
}

function ShareDialog({
  inspection,
  project,
  onClose,
  onConfirm,
}: {
  inspection: Inspection | null;
  project: Project | null;
  onClose: () => void;
  onConfirm: (patch: Partial<Inspection>) => void;
}) {
  const [step, setStep] = useState<"upload" | "destination" | "confirm">("upload");
  const [signedName, setSignedName] = useState<string>("");
  const [dest, setDest] = useState<ClientPlatform>("gdrive");
  const [busy, setBusy] = useState(false);

  const open = !!inspection;

  const reset = () => {
    setStep("upload");
    setSignedName("");
    setDest("gdrive");
    setBusy(false);
  };

  if (!inspection) return null;

  const currentDest = project?.clientPlatform ?? dest;

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Merci d'importer un PDF");
      return;
    }
    setSignedName(f.name);
    setDest(project?.clientPlatform ?? "gdrive");
    setStep("destination");
  };

  const doShare = () => {
    setBusy(true);
    setTimeout(() => {
      const folder = project?.clientFolderPath ?? "";
      const link =
        currentDest === "gdrive"
          ? `https://drive.google.com/file/d/mock-${inspection.id}/view`
          : `https://${(project?.client ?? "client").toLowerCase().replace(/\s+/g, "-")}.sharepoint.com${folder}/${signedName}`;
      onConfirm({
        signedPdfName: signedName,
        signedPdfUploadedAt: new Date().toISOString().slice(0, 10),
        sharedDestination: currentDest,
        sharedAt: new Date().toISOString().slice(0, 10),
        sharedLink: link,
      });
      reset();
    }, 700);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          onClose();
          reset();
        }
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-primary" /> Partager avec le client
          </DialogTitle>
          <DialogDescription>
            <span className="mono text-xs">{inspection.number}</span> · {inspection.zone} —{" "}
            {project?.client ?? "Client"}
          </DialogDescription>
        </DialogHeader>

        <Stepper step={step} />

        {step === "upload" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Importez le PDF de l'inspection <strong className="text-foreground">signé</strong> (contrôleur + responsable
              chantier). Le partage client n'est possible qu'après signature.
            </p>
            <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 px-6 py-8 text-center cursor-pointer hover:bg-primary/10 transition-colors">
              <Upload className="h-6 w-6 text-primary" />
              <div className="text-sm font-medium">Cliquez pour importer le PDF signé</div>
              <div className="mono text-[10px] uppercase tracking-widest text-muted-foreground">
                PDF · max 20 Mo
              </div>
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        )}

        {step === "destination" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm">
              <FileSignature className="h-4 w-4 text-emerald-400" />
              <span className="mono text-xs">{signedName}</span>
              <span className="ml-auto mono text-[10px] uppercase text-emerald-400">signé</span>
            </div>
            <p className="text-sm text-muted-foreground">Choisissez la destination du dossier client :</p>
            <div className="grid grid-cols-2 gap-2">
              <DestinationCard
                active={currentDest === "gdrive"}
                onClick={() => setDest("gdrive")}
                icon={<GDriveIcon large />}
                title="Google Drive"
                subtitle="Dossier partagé client"
                recommended={project?.clientPlatform === "gdrive"}
              />
              <DestinationCard
                active={currentDest === "sharepoint"}
                onClick={() => setDest("sharepoint")}
                icon={<SharepointIcon large />}
                title="SharePoint"
                subtitle="Site Microsoft 365 du client"
                recommended={project?.clientPlatform === "sharepoint"}
              />
            </div>
            {project?.clientFolderPath && (
              <div className="rounded-md border border-border bg-black/30 p-2 mono text-[11px] text-muted-foreground">
                <span className="text-primary/80">Destination :</span> {project.clientFolderPath}/{signedName}
              </div>
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setStep("upload")}>
                Retour
              </Button>
              <Button onClick={() => setStep("confirm")}>Continuer</Button>
            </DialogFooter>
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-3">
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>Prêt à publier vers</span>
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  {currentDest === "gdrive" ? <GDriveIcon /> : <SharepointIcon />}
                  {currentDest === "gdrive" ? "Google Drive" : "SharePoint"}
                </span>
              </div>
              <ul className="space-y-1 pl-6 text-xs text-muted-foreground list-disc">
                <li>Fichier : <span className="mono text-foreground">{signedName}</span></li>
                <li>Dossier client : <span className="mono">{project?.clientFolderPath ?? "—"}</span></li>
                <li>Notification WhatsApp envoyée au groupe {project?.whatsappGroup ?? "—"}</li>
              </ul>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setStep("destination")} disabled={busy}>
                Retour
              </Button>
              <Button onClick={doShare} disabled={busy}>
                {busy ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi…</>
                ) : (
                  <><Share2 className="mr-2 h-4 w-4" /> Partager avec le client</>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Stepper({ step }: { step: "upload" | "destination" | "confirm" }) {
  const items = [
    { key: "upload", label: "1. PDF signé" },
    { key: "destination", label: "2. Destination" },
    { key: "confirm", label: "3. Partager" },
  ] as const;
  const idx = items.findIndex((i) => i.key === step);
  return (
    <div className="flex items-center gap-2">
      {items.map((it, i) => (
        <div key={it.key} className="flex items-center gap-2 flex-1">
          <div
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1 text-[10px] uppercase tracking-widest mono border transition-colors",
              i <= idx
                ? "bg-primary/15 text-primary border-primary/30"
                : "bg-white/[0.03] text-muted-foreground border-border",
            )}
          >
            {it.label}
          </div>
          {i < items.length - 1 && <div className={cn("h-px flex-1", i < idx ? "bg-primary/40" : "bg-border")} />}
        </div>
      ))}
    </div>
  );
}

function DestinationCard({
  active,
  onClick,
  icon,
  title,
  subtitle,
  recommended,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  recommended?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-all",
        active
          ? "border-primary/60 bg-primary/10 shadow-[0_0_0_1px_rgba(59,130,246,0.4)]"
          : "border-border bg-white/[0.02] hover:bg-white/[0.05]",
      )}
    >
      {recommended && (
        <span className="absolute right-2 top-2 mono text-[9px] uppercase tracking-widest text-emerald-400">
          conseillé
        </span>
      )}
      {icon}
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      </div>
    </button>
  );
}

function GDriveIcon({ large = false }: { large?: boolean }) {
  const s = large ? 28 : 12;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M8 3h8l6 10.5-4 6.5H2l4-6.5L8 3z" fill="#FBBC04" />
      <path d="M8 3L2 13.5 6 20l6-10.5L8 3z" fill="#4285F4" />
      <path d="M22 13.5L16 3l-4 6.5L18 20l4-6.5z" fill="#34A853" />
    </svg>
  );
}

function SharepointIcon({ large = false }: { large?: boolean }) {
  const s = large ? 28 : 12;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="9" r="6" fill="#036C70" />
      <circle cx="15" cy="14" r="5" fill="#1A9BA1" />
      <circle cx="18" cy="18" r="3.5" fill="#37C6D0" />
      <text x="9" y="12" textAnchor="middle" fontSize="7" fontWeight="700" fill="white" fontFamily="Arial">S</text>
    </svg>
  );
}
