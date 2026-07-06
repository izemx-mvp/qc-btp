import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertOctagon, CheckCircle2, Filter, Search, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/app-layout";
import { NCBadge } from "@/components/status-badge";
import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/non-conformites")({
  component: NonConformities,
});

function NonConformities() {
  const { data, setInspections } = useStore();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("ouvert");
  const [projectFilter, setProjectFilter] = useState("all");

  const ncList = useMemo(
    () =>
      data.inspections
        .filter((i) => i.ncStatus)
        .filter((i) => (statusFilter === "all" ? true : i.ncStatus === statusFilter))
        .filter((i) => (projectFilter === "all" ? true : i.projectId === projectFilter))
        .filter((i) => {
          if (!q) return true;
          const s = q.toLowerCase();
          return (
            i.number.toLowerCase().includes(s) ||
            (i.ncDescription ?? "").toLowerCase().includes(s) ||
            i.zone.toLowerCase().includes(s)
          );
        })
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [data.inspections, statusFilter, projectFilter, q],
  );

  const open = data.inspections.filter((i) => i.ncStatus === "ouvert").length;
  const closed = data.inspections.filter((i) => i.ncStatus === "ferme").length;

  const projectOf = (id: string) => data.projects.find((p) => p.id === id);

  const close = (id: string) => {
    setInspections(
      data.inspections.map((i) =>
        i.id === id
          ? { ...i, ncStatus: "ferme" as const, ncClosedDate: new Date().toISOString().slice(0, 10) }
          : i,
      ),
    );
    toast.success("Non-conformité fermée");
  };

  return (
    <div>
      <PageHeader
        title="Non-conformités"
        description="Suivi centralisé de toutes les fiches non-conformité et de leur plan d'action."
        breadcrumb="Terrain · NC"
      />
      <div className="p-4 md:p-8 space-y-6">
        {/* KPI band */}
        <div className="grid gap-4 md:grid-cols-3">
          <KPI label="Ouvertes" value={open} tone="danger" icon={<AlertOctagon className="h-4 w-4" />} />
          <KPI label="Fermées" value={closed} tone="ok" icon={<CheckCircle2 className="h-4 w-4" />} />
          <KPI label="Taux de résolution" value={open + closed ? Math.round((closed / (open + closed)) * 100) : 0} suffix="%" tone="primary" />
        </div>

        {/* Filters */}
        <div className="panel-elevated p-3 flex flex-col md:flex-row md:items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher n° / description / zone…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8 bg-transparent" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="md:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ouvert">Ouvertes</SelectItem>
              <SelectItem value="ferme">Fermées</SelectItem>
              <SelectItem value="all">Toutes</SelectItem>
            </SelectContent>
          </Select>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="md:w-52"><SelectValue placeholder="Projet" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous projets</SelectItem>
              {data.projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.code} — {p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="md:ml-2">
            <Filter className="mr-1.5 h-4 w-4" /> Filtres
          </Button>
        </div>

        {/* Cards list */}
        <div className="grid gap-3">
          {ncList.map((i) => {
            const p = projectOf(i.projectId);
            const isOpen = i.ncStatus === "ouvert";
            return (
              <div
                key={i.id}
                className={cn(
                  "panel-elevated p-5 transition-all hover:border-border-strong",
                  isOpen ? "border-red-500/25" : "border-emerald-500/20",
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-lg border",
                    isOpen ? "bg-red-500/10 text-red-400 border-red-500/30" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
                  )}>
                    {isOpen ? <AlertOctagon className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="mono text-[11px] uppercase tracking-widest text-muted-foreground">{i.number}</span>
                      <span className="text-sm font-semibold text-foreground">{p?.code}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-sm text-muted-foreground">{i.controlType}</span>
                      <NCBadge status={i.ncStatus} />
                      <span className="ml-auto mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        {i.date}
                      </span>
                    </div>
                    <div className="mt-1.5 text-sm font-medium text-foreground">
                      {i.ncDescription || "Écart constaté"}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Zone : <span className="text-foreground">{i.zone}</span>
                    </div>
                    {i.ncActionPlan && (
                      <div className="mt-3 rounded-md border-l-2 border-primary/40 bg-white/[0.02] px-3 py-2 text-xs text-muted-foreground">
                        <span className="mono text-[10px] uppercase tracking-widest text-primary/80 block mb-1">Plan d'action</span>
                        {i.ncActionPlan}
                      </div>
                    )}
                    <div className="mt-4 flex items-center gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link to="/inspections/$inspectionId" params={{ inspectionId: i.id }}>
                          Voir l'inspection <ArrowUpRight className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                      {isOpen && (
                        <Button size="sm" onClick={() => close(i.id)} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Fermer la NC
                        </Button>
                      )}
                      {!isOpen && i.ncClosedDate && (
                        <span className="mono text-[10px] uppercase tracking-widest text-emerald-400">
                          Fermée le {i.ncClosedDate}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {ncList.length === 0 && (
            <div className="panel-elevated p-10 text-center text-sm text-muted-foreground">
              Aucune non-conformité correspondant aux filtres.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value, suffix, tone, icon }: { label: string; value: number; suffix?: string; tone: "danger" | "ok" | "primary"; icon?: React.ReactNode }) {
  const map = {
    danger: { border: "border-red-500/25", text: "text-red-400", icon: "bg-red-500/10 text-red-400" },
    ok: { border: "border-emerald-500/25", text: "text-emerald-400", icon: "bg-emerald-500/10 text-emerald-400" },
    primary: { border: "border-primary/25", text: "text-primary", icon: "bg-primary/10 text-primary" },
  } as const;
  const t = map[tone];
  return (
    <div className={cn("panel-elevated p-5", t.border)}>
      <div className="flex items-center justify-between">
        <span className="mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
        {icon && <span className={cn("grid h-8 w-8 place-items-center rounded-lg border border-border", t.icon)}>{icon}</span>}
      </div>
      <div className={cn("mt-2 mono text-3xl font-bold tabular-nums", t.text)}>
        {value}{suffix ?? ""}
      </div>
    </div>
  );
}
