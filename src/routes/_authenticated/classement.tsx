import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, FolderOpen, FileText, CheckCircle2, Circle, Search, Share2, Download, Folder } from "lucide-react";
import { PageHeader } from "@/components/app-layout";
import { NCBadge, ResultBadge } from "@/components/status-badge";
import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/classement")({
  component: Classement,
});

function Classement() {
  const { data, setInspections } = useStore();
  const [openProjects, setOpenProjects] = useState<Record<string, boolean>>({});
  const [openTypes, setOpenTypes] = useState<Record<string, boolean>>({});
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const toggleP = (id: string) => setOpenProjects({ ...openProjects, [id]: !(openProjects[id] ?? true) });
  const toggleT = (k: string) => setOpenTypes({ ...openTypes, [k]: !(openTypes[k] ?? true) });

  const controlTypes = useMemo(
    () => Array.from(new Set(data.inspections.map((i) => i.controlType))),
    [data.inspections],
  );

  const matches = (text: string) => (q ? text.toLowerCase().includes(q.toLowerCase()) : true);

  const toggleShare = (id: string, val: boolean) => {
    setInspections(data.inspections.map((i) => (i.id === id ? { ...i, sharedWithClient: val } : i)));
    toast.success(val ? "Marqué comme partagé" : "Marqué comme non partagé");
  };

  const shareAll = (projectId: string) => {
    setInspections(data.inspections.map((i) => (i.projectId === projectId ? { ...i, sharedWithClient: true } : i)));
    toast.success("Dossier partagé avec le client");
  };

  return (
    <div>
      <PageHeader
        title="Classement documentaire"
        description="Arborescence Projet → Type de contrôle → Inspection. Remplace le rangement manuel."
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
                  <Button variant="ghost" size="sm" onClick={() => shareAll(p.id)} title="Partager tout le dossier avec le client">
                    <Share2 className="mr-1 h-4 w-4" /> Partager
                  </Button>
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
                                      <div className="mono text-[10px] text-muted-foreground uppercase tracking-widest">{i.date}</div>
                                    </Link>
                                    <div className="flex items-center gap-2">
                                      <ResultBadge result={i.result} />
                                      <NCBadge status={i.ncStatus} />
                                      <button
                                        onClick={() => toggleShare(i.id, !i.sharedWithClient)}
                                        className={cn(
                                          "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider transition-colors",
                                          i.sharedWithClient
                                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                                            : "bg-white/[0.04] text-muted-foreground border-border hover:text-foreground",
                                        )}
                                        title="Basculer le statut de partage"
                                      >
                                        {i.sharedWithClient ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                                        {i.sharedWithClient ? "Partagé" : "Privé"}
                                      </button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toast.info("Téléchargement simulé (démo)")}
                                        title="Télécharger"
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
    </div>
  );
}
