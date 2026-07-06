import { cn } from "@/lib/utils";

export function ResultBadge({ result }: { result: string }) {
  const map: Record<string, string> = {
    conforme: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    non_conforme: "bg-red-500/10 text-red-400 border-red-500/30",
    non_applicable: "bg-white/[0.04] text-muted-foreground border-border",
    "": "bg-white/[0.04] text-muted-foreground border-border",
  };
  const label: Record<string, string> = {
    conforme: "Conforme",
    non_conforme: "Non conforme",
    non_applicable: "N/A",
    "": "—",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium", map[result])}>
      {result === "conforme" && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
      {result === "non_conforme" && <span className="h-1.5 w-1.5 rounded-full bg-red-400 pulse-dot" />}
      {label[result] ?? result}
    </span>
  );
}

export function StageBadge({ stage }: { stage: string }) {
  const map: Record<string, string> = {
    brouillon: "bg-white/[0.04] text-slate-300 border-white/10",
    rempli: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    signe: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    classe: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    partage: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  };
  const label: Record<string, string> = {
    brouillon: "Brouillon",
    rempli: "Rempli",
    signe: "Signé",
    classe: "Classé",
    partage: "Partagé",
  };
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide", map[stage])}>
      {label[stage] ?? stage}
    </span>
  );
}

export function NCBadge({ status }: { status?: string }) {
  if (!status) return null;
  const isOpen = status === "ouvert";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium",
        isOpen
          ? "bg-red-500/10 text-red-400 border-red-500/30 glow-danger"
          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", isOpen ? "bg-red-400 pulse-dot" : "bg-emerald-400")} />
      NC {isOpen ? "ouverte" : "fermée"}
    </span>
  );
}
