import { cn } from "@/lib/utils";

export function ResultBadge({ result }: { result: string }) {
  const map: Record<string, string> = {
    conforme: "bg-emerald-100 text-emerald-800 border-emerald-200",
    non_conforme: "bg-red-100 text-red-800 border-red-200",
    non_applicable: "bg-muted text-muted-foreground border-border",
    "": "bg-muted text-muted-foreground border-border",
  };
  const label: Record<string, string> = {
    conforme: "Conforme",
    non_conforme: "Non conforme",
    non_applicable: "N/A",
    "": "—",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", map[result])}>
      {label[result] ?? result}
    </span>
  );
}

export function StageBadge({ stage }: { stage: string }) {
  const map: Record<string, string> = {
    brouillon: "bg-slate-100 text-slate-700 border-slate-200",
    rempli: "bg-amber-100 text-amber-800 border-amber-200",
    signe: "bg-blue-100 text-blue-800 border-blue-200",
    classe: "bg-indigo-100 text-indigo-800 border-indigo-200",
    partage: "bg-emerald-100 text-emerald-800 border-emerald-200",
  };
  const label: Record<string, string> = {
    brouillon: "Brouillon",
    rempli: "Rempli",
    signe: "Signé",
    classe: "Classé",
    partage: "Partagé",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", map[stage])}>
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
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        isOpen ? "bg-red-100 text-red-800 border-red-200" : "bg-emerald-100 text-emerald-800 border-emerald-200",
      )}
    >
      NC {isOpen ? "ouverte" : "fermée"}
    </span>
  );
}
