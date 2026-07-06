import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Download, Plus, ClipboardList, ClipboardCheck, AlertOctagon, Layers, FileSignature, MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/app-layout";
import { NCBadge, ResultBadge, StageBadge } from "@/components/status-badge";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { exportInspectionsCSV } from "@/lib/export";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/projets/$projectId")({
  component: ProjectDetail,
});

function ProjectDetail() {
  const { projectId } = Route.useParams();
  const { data } = useStore();
  const project = data.projects.find((p) => p.id === projectId);
  const [openTypes, setOpenTypes] = useState<Record<string, boolean>>({});

  const inspections = useMemo(
    () =>
      data.inspections
        .filter((i) => i.projectId === projectId)
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [data.inspections, projectId],
  );

  const ncOpen = inspections.filter((i) => i.ncStatus === "ouvert");
  const conf = inspections.filter((i) => i.result === "conforme").length;
  const nc = inspections.filter((i) => i.result === "non_conforme").length;
  const rate = conf + nc ? Math.round((conf / (conf + nc)) * 100) : 0;

  if (!project) return <Navigate to="/projets" />;

  const types = project.controlPlan?.controlTypes ?? [];
  const toggle = (t: string) => setOpenTypes((o) => ({ ...o, [t]: !(o[t] ?? true) }));

  const checklistsFor = (t: string) => data.checklists.filter((c) => c.controlType === t);
  const inspFor = (t: string, clId?: string) =>
    inspections.filter((i) => i.controlType === t && (!clId || i.checklistTemplateId === clId));

  return (
    <div>
      <PageHeader
        title={project.name}
        description={`Client · ${project.client}`}
        breadcrumb={<>
          <Link to="/projets" className="hover:text-foreground">Projets</Link>
          <span className="mx-1.5 opacity-50">/</span>
          <span className="text-foreground">{project.code}</span>
        </>}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportInspectionsCSV(project, inspections)}>
              <Download className="mr-2 h-4 w-4" /> CSV
            </Button>
            <Button asChild className="glow-primary">
              <Link to="/inspections/nouvelle" search={{ projectId: project.id }}>
                <Plus className="mr-2 h-4 w-4" /> Inspection
              </Link>
            </Button>
          </div>
        }
      />

      <div className="p-4 md:p-8 space-y-6">
        {/* Project meta strip */}
        <div className="panel-elevated p-5">
          <div className="grid gap-4 md:grid-cols-4">
            <Meta label="Code" value={project.code} mono />
            <Meta label="Statut" value={project.status.replace("_", " ")} pill={project.status} />
            <Meta label="Début" value={project.startDate} mono />
            <Meta label="Groupe WhatsApp" value={project.whatsappGroup || "—"} icon={<MessageSquare className="h-3.5 w-3.5 text-emerald-400" />} />
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <MiniStat icon={<Layers className="h-4 w-4" />} label="Types de contrôle" value={types.length} />
            <MiniStat icon={<ClipboardCheck className="h-4 w-4" />} label="Inspections" value={inspections.length} />
            <MiniStat icon={<AlertOctagon className="h-4 w-4" />} label="NC ouvertes" value={ncOpen.length} tone={ncOpen.length ? "danger" : "ok"} />
            <MiniStat icon={<FileSignature className="h-4 w-4" />} label="Conformité" value={rate} suffix="%" tone={rate >= 80 ? "ok" : "warn"} />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {/* Hierarchical Control Plan Tree */}
          <section className="panel-elevated overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <div className="mono text-[10px] uppercase tracking-widest text-muted-foreground">Plan de contrôle</div>
                <div className="text-sm font-semibold mt-0.5">
                  {project.controlPlan?.name ?? "—"}
                  {project.controlPlan?.ref && (
                    <span className="mono ml-2 text-xs text-muted-foreground">· {project.controlPlan.ref}</span>
                  )}
                </div>
              </div>
              <div className="mono text-[10px] uppercase tracking-widest text-primary/70">
                {types.length} type{types.length > 1 ? "s" : ""}
              </div>
            </div>

            <div className="p-4 space-y-2">
              {types.map((t, idx) => {
                const open = openTypes[t] ?? idx === 0;
                const cls = checklistsFor(t);
                const total = inspFor(t).length;
                const typeNc = inspFor(t).filter((i) => i.ncStatus === "ouvert").length;
                return (
                  <div key={t} className="rounded-xl border border-border overflow-hidden bg-white/[0.015]">
                    <button
                      onClick={() => toggle(t)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors text-left"
                    >
                      <span className={cn("mono text-[10px] font-bold tabular-nums text-muted-foreground/70 w-6", open && "text-primary")}>
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      {open ? (
                        <ChevronDown className="h-4 w-4 text-primary" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Layers className="h-4 w-4 text-primary/80" />
                      <span className="text-sm font-semibold text-foreground">{t}</span>
                      <span className="ml-auto flex items-center gap-2">
                        {typeNc > 0 && (
                          <span className="mono rounded-md bg-red-500/15 text-red-400 border border-red-500/30 px-1.5 py-0.5 text-[10px] font-bold">
                            {typeNc} NC
                          </span>
                        )}
                        <span className="mono text-[10px] text-muted-foreground uppercase tracking-widest">
                          {total} insp.
                        </span>
                      </span>
                    </button>
                    {open && (
                      <div className="border-t border-border bg-black/20">
                        {cls.length === 0 && (
                          <div className="px-6 py-3 text-xs text-muted-foreground italic">
                            Aucune checklist pour ce type — <Link to="/checklists" className="text-primary hover:underline">en créer une →</Link>
                          </div>
                        )}
                        {cls.map((c) => {
                          const list = inspFor(t, c.id);
                          return (
                            <div key={c.id} className="border-b border-border last:border-0">
                              <div className="flex items-center gap-3 px-6 py-2.5 bg-white/[0.015]">
                                <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs font-medium text-foreground">{c.name}</span>
                                <span className="mono text-[10px] text-muted-foreground">
                                  {c.items.length} pt.
                                </span>
                                <span className="ml-auto flex items-center gap-3 text-[11px] text-muted-foreground mono">
                                  {list.length} inspection{list.length > 1 ? "s" : ""}
                                </span>
                              </div>
                              {list.length > 0 && (
                                <ul className="divide-y divide-border">
                                  {list.slice(0, 4).map((i) => (
                                    <li key={i.id}>
                                      <Link
                                        to="/inspections/$inspectionId"
                                        params={{ inspectionId: i.id }}
                                        className="flex items-center gap-3 pl-12 pr-4 py-2 hover:bg-white/[0.03] transition-colors group"
                                      >
                                        <span className="mono text-[11px] text-muted-foreground w-28 truncate">{i.number}</span>
                                        <span className="text-xs truncate flex-1 group-hover:text-foreground">{i.zone || "—"}</span>
                                        <span className="mono text-[10px] text-muted-foreground hidden md:inline">{i.date}</span>
                                        <ResultBadge result={i.result} />
                                        <NCBadge status={i.ncStatus} />
                                      </Link>
                                    </li>
                                  ))}
                                  {list.length > 4 && (
                                    <li className="pl-12 py-1.5">
                                      <span className="mono text-[10px] text-muted-foreground uppercase tracking-widest">
                                        + {list.length - 4} de plus
                                      </span>
                                    </li>
                                  )}
                                </ul>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              {types.length === 0 && (
                <div className="text-sm text-muted-foreground p-6 text-center">
                  Aucun type de contrôle défini. Modifiez le projet pour ajouter le plan.
                </div>
              )}
            </div>
          </section>

          {/* NC panel */}
          <section className="panel-elevated overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <div className="mono text-[10px] uppercase tracking-widest text-muted-foreground">Non-conformités</div>
                <div className="text-sm font-semibold mt-0.5">Ouvertes sur ce projet</div>
              </div>
              <span className={cn(
                "mono rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase",
                ncOpen.length ? "border-red-500/40 text-red-400 bg-red-500/10" : "border-emerald-500/40 text-emerald-400 bg-emerald-500/10",
              )}>
                {ncOpen.length}
              </span>
            </div>
            <div className="p-3 space-y-2 max-h-[520px] overflow-y-auto">
              {ncOpen.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-8">
                  Aucune non-conformité ouverte. 
                </div>
              )}
              {ncOpen.map((i) => (
                <Link
                  key={i.id}
                  to="/inspections/$inspectionId"
                  params={{ inspectionId: i.id }}
                  className="block p-3 rounded-lg border border-red-500/20 bg-red-500/[0.04] hover:bg-red-500/[0.08] hover:border-red-500/40 transition-all group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="mono text-[10px] uppercase tracking-wider text-red-400">{i.number}</span>
                    <span className="text-[10px] text-muted-foreground">{i.date}</span>
                  </div>
                  <div className="text-xs font-medium text-foreground line-clamp-2">
                    {i.ncDescription || i.zone}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <StageBadge stage={i.controlType.toLowerCase() as never} />
                    <span className="mono text-[10px] text-muted-foreground">{i.zone}</span>
                  </div>
                  {i.ncActionPlan && (
                    <div className="mt-2 text-[11px] text-muted-foreground italic border-l-2 border-red-500/40 pl-2 line-clamp-2">
                      {i.ncActionPlan}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value, mono, pill, icon }: { label: string; value: string; mono?: boolean; pill?: string; icon?: React.ReactNode }) {
  const pillMap: Record<string, string> = {
    actif: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    termine: "bg-slate-500/10 text-slate-400 border-slate-500/30",
    en_pause: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  };
  return (
    <div>
      <div className="mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-sm flex items-center gap-2", mono && "mono")}>
        {icon}
        {pill ? (
          <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide", pillMap[pill])}>
            {value}
          </span>
        ) : (
          <span className="text-foreground truncate">{value}</span>
        )}
      </div>
    </div>
  );
}

function MiniStat({ icon, label, value, suffix, tone = "neutral" }: { icon: React.ReactNode; label: string; value: number; suffix?: string; tone?: "neutral" | "danger" | "ok" | "warn" }) {
  const map = {
    neutral: "text-foreground",
    danger: "text-red-400",
    ok: "text-emerald-400",
    warn: "text-amber-400",
  } as const;
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-white/[0.02] p-3">
      <div className={cn("grid h-9 w-9 place-items-center rounded-md border border-border bg-black/20", map[tone])}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className={cn("mono text-lg font-bold tabular-nums", map[tone])}>
          {value}{suffix ?? ""}
        </div>
      </div>
    </div>
  );
}
