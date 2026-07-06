import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AlertOctagon, CheckCircle2, ClipboardCheck, FolderKanban, Plus, Search, Download, ArrowUpRight, Activity } from "lucide-react";
import { PageHeader } from "@/components/app-layout";
import { NCBadge, ResultBadge, StageBadge } from "@/components/status-badge";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { exportInspectionsCSV } from "@/lib/export";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function useCountUp(target: number, duration = 900) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return n;
}

const PERIODS = [
  { key: "7", label: "7j", days: 7 },
  { key: "30", label: "30j", days: 30 },
  { key: "90", label: "3M", days: 90 },
  { key: "all", label: "Tout", days: null as number | null },
];

function Dashboard() {
  const { data } = useStore();
  const [period, setPeriod] = useState("30");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [q, setQ] = useState("");

  const periodDays = PERIODS.find((p) => p.key === period)?.days ?? null;
  const cutoff = useMemo(() => {
    if (!periodDays) return null;
    const d = new Date();
    d.setDate(d.getDate() - periodDays);
    return d.toISOString().slice(0, 10);
  }, [periodDays]);

  const scoped = useMemo(
    () => data.inspections.filter((i) => (cutoff ? i.date >= cutoff : true)),
    [data.inspections, cutoff],
  );

  const totalProjects = data.projects.filter((p) => p.status === "actif").length;
  const totalInspections = scoped.length;
  const conf = scoped.filter((i) => i.result === "conforme").length;
  const nc = scoped.filter((i) => i.result === "non_conforme").length;
  const ncOpen = scoped.filter((i) => i.ncStatus === "ouvert").length;
  const drafts = scoped.filter((i) => i.stage === "brouillon").length;
  const evaluated = conf + nc;
  const rate = evaluated ? Math.round((conf / evaluated) * 100) : 0;

  const cProjects = useCountUp(totalProjects);
  const cInsp = useCountUp(totalInspections);
  const cNC = useCountUp(ncOpen);
  const cRate = useCountUp(rate);

  const perProject = data.projects.map((p) => {
    const list = scoped.filter((i) => i.projectId === p.id);
    return {
      project: p,
      conf: list.filter((i) => i.result === "conforme").length,
      nc: list.filter((i) => i.result === "non_conforme").length,
      total: list.length,
    };
  }).filter((s) => s.total > 0);

  const maxTotal = Math.max(1, ...perProject.map((s) => s.total));

  // Donut
  const totalDonut = conf + nc;
  const confPct = totalDonut ? conf / totalDonut : 0;
  const R = 42;
  const C = 2 * Math.PI * R;
  const dashConf = C * confPct;

  const controlTypes = useMemo(
    () => Array.from(new Set(data.inspections.map((i) => i.controlType))),
    [data.inspections],
  );

  const filtered = scoped
    .filter((i) => (projectFilter === "all" ? true : i.projectId === projectFilter))
    .filter((i) => (typeFilter === "all" ? true : i.controlType === typeFilter))
    .filter((i) => {
      if (!q) return true;
      const s = q.toLowerCase();
      return (
        i.number.toLowerCase().includes(s) ||
        i.zone.toLowerCase().includes(s) ||
        i.controlType.toLowerCase().includes(s)
      );
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const todo = data.inspections
    .filter((i) => i.stage === "brouillon" || (i.ncStatus === "ouvert"))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 5);

  const projectName = (id: string) => data.projects.find((p) => p.id === id)?.name ?? "—";

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble des chantiers, inspections et non-conformités."
        breadcrumb="QC · Overview"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { exportInspectionsCSV(null, scoped); toast.success("Export généré"); }}>
              <Download className="mr-2 h-4 w-4" /> Exporter
            </Button>
            <Button asChild className="glow-primary">
              <Link to="/inspections/nouvelle">
                <Plus className="mr-2 h-4 w-4" /> Nouvelle inspection
              </Link>
            </Button>
          </div>
        }
      />

      <div className="p-4 md:p-8 space-y-6">
        {/* Period pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mono text-[10px] uppercase tracking-widest text-muted-foreground mr-2">Période</span>
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={cn(
                "mono rounded-md border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition-all",
                period === p.key
                  ? "bg-primary/15 text-primary border-primary/40"
                  : "border-border bg-surface text-muted-foreground hover:text-foreground hover:border-border-strong",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<FolderKanban className="h-4 w-4" />} label="Projets actifs" value={cProjects} tone="primary" />
          <StatCard icon={<ClipboardCheck className="h-4 w-4" />} label="Inspections" value={cInsp} tone="neutral" trend={`${drafts} en brouillon`} />
          <StatCard icon={<AlertOctagon className="h-4 w-4" />} label="NC ouvertes" value={cNC} tone={ncOpen > 0 ? "danger" : "ok"} />
          <StatCard icon={<CheckCircle2 className="h-4 w-4" />} label="Conformité" value={cRate} suffix="%" tone={rate >= 80 ? "ok" : "warn"} progress={cRate} />
        </div>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="panel-elevated p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="mono text-[10px] uppercase tracking-widest text-muted-foreground">Conformité globale</div>
                <div className="text-sm font-semibold mt-0.5">Sur la période</div>
              </div>
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-4 flex items-center gap-6">
              <div className="relative">
                <svg viewBox="0 0 100 100" className="h-32 w-32 -rotate-90">
                  <circle cx="50" cy="50" r={R} fill="none" stroke="oklch(1 0 0 / 6%)" strokeWidth="10" />
                  <circle
                    cx="50" cy="50" r={R} fill="none"
                    stroke="oklch(0.72 0.18 155)" strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={`${dashConf} ${C - dashConf}`}
                    style={{ transition: "stroke-dasharray 800ms ease", filter: "drop-shadow(0 0 6px oklch(0.72 0.18 155 / 60%))" }}
                  />
                </svg>
                <div className="absolute inset-0 grid place-items-center">
                  <div className="text-center">
                    <div className="mono text-2xl font-bold tabular-nums text-shine">{Math.round(confPct * 100)}%</div>
                    <div className="mono text-[9px] uppercase tracking-widest text-muted-foreground">OK</div>
                  </div>
                </div>
              </div>
              <div className="space-y-2 mono text-xs">
                <Legend color="bg-emerald-400" n={conf} label="conformes" />
                <Legend color="bg-red-400" n={nc} label="non-conformes" />
                <Legend color="bg-amber-400" n={drafts} label="brouillons" />
              </div>
            </div>
          </div>

          <div className="panel-elevated p-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="mono text-[10px] uppercase tracking-widest text-muted-foreground">Répartition</div>
                <div className="text-sm font-semibold mt-0.5">Conforme vs non-conforme · par projet</div>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {perProject.map((s) => {
                const w = (s.total / maxTotal) * 100;
                const cw = s.total ? (s.conf / s.total) * w : 0;
                return (
                  <div key={s.project.id}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium truncate"><span className="mono text-muted-foreground">{s.project.code}</span> · {s.project.name}</span>
                      <span className="mono text-muted-foreground tabular-nums">{s.conf}/{s.total}</span>
                    </div>
                    <div className="relative h-2 rounded-full bg-white/[0.04] overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-red-500/70"
                        style={{ width: `${w}%`, transition: "width 800ms ease" }}
                      />
                      <div
                        className="absolute inset-y-0 left-0 bg-emerald-500"
                        style={{ width: `${cw}%`, transition: "width 800ms ease", boxShadow: "0 0 8px oklch(0.72 0.18 155 / 60%)" }}
                      />
                    </div>
                  </div>
                );
              })}
              {perProject.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-6">Pas de données sur cette période.</div>
              )}
            </div>
          </div>
        </div>

        {/* À faire */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">À traiter</h2>
              <p className="text-xs text-muted-foreground">Brouillons à finaliser et non-conformités ouvertes.</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/inspections">Voir tout →</Link>
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {todo.map((i) => {
              const isNC = i.ncStatus === "ouvert";
              return (
                <Link
                  key={i.id}
                  to="/inspections/$inspectionId"
                  params={{ inspectionId: i.id }}
                  className={cn(
                    "group panel p-4 hover:border-border-strong transition-all",
                    isNC && "border-red-500/30 hover:border-red-500/50",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {i.number} · {projectName(i.projectId)}
                      </div>
                      <div className="font-medium truncate mt-0.5">{i.zone || i.controlType}</div>
                    </div>
                    {isNC ? (
                      <NCBadge status="ouvert" />
                    ) : (
                      <StageBadge stage={i.stage} />
                    )}
                  </div>
                  {i.ncDescription && (
                    <div className="mt-2 text-xs text-muted-foreground line-clamp-2">{i.ncDescription}</div>
                  )}
                  <div className="mt-3 flex justify-end items-center gap-1 text-xs text-primary opacity-70 group-hover:opacity-100 transition-opacity">
                    Voir le détail <ArrowUpRight className="h-3 w-3" />
                  </div>
                </Link>
              );
            })}
            {todo.length === 0 && (
              <div className="text-sm text-muted-foreground panel p-6 text-center md:col-span-2">
                Rien à traiter. Bon boulot.
              </div>
            )}
          </div>
        </section>

        {/* Recent */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Inspections récentes</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/inspections">Voir tout →</Link>
            </Button>
          </div>
          <div className="panel-elevated overflow-hidden">
            <div className="flex flex-col gap-2 border-b border-border p-3 md:flex-row md:items-center bg-white/[0.02]">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher n° / zone / type…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="pl-8 bg-transparent"
                />
              </div>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="md:w-48"><SelectValue placeholder="Projet" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les projets</SelectItem>
                  {data.projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.code} — {p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="md:w-48"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {controlTypes.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="divide-y divide-border">
              {filtered.slice(0, 10).map((i) => (
                <Link
                  key={i.id}
                  to="/inspections/$inspectionId"
                  params={{ inspectionId: i.id }}
                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 p-3 hover:bg-white/[0.02] transition-colors md:grid-cols-[130px_minmax(0,2fr)_minmax(0,1fr)_auto]"
                >
                  <div className="mono text-[11px] text-muted-foreground tracking-tight">
                    {i.number}
                  </div>
                  <div className="min-w-0 col-span-2 md:col-span-1">
                    <div className="truncate text-sm font-medium">{i.zone || "—"}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {projectName(i.projectId)} · {i.controlType} · <span className="mono">{i.date}</span>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center gap-2">
                    <StageBadge stage={i.stage} />
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    <ResultBadge result={i.result} />
                    <NCBadge status={i.ncStatus} />
                  </div>
                </Link>
              ))}
              {filtered.length === 0 && (
                <div className="p-6 text-sm text-muted-foreground text-center">Aucune inspection.</div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Legend({ color, n, label }: { color: string; n: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("h-1.5 w-1.5 rounded-full", color)} />
      <span className="tabular-nums font-semibold text-foreground">{n}</span>
      <span className="text-muted-foreground text-[11px] uppercase tracking-wider">{label}</span>
    </div>
  );
}

function StatCard({
  icon, label, value, suffix, tone, trend, progress,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  tone: "neutral" | "danger" | "warn" | "ok" | "primary";
  trend?: string;
  progress?: number;
}) {
  const toneMap = {
    neutral: { border: "border-border", icon: "bg-white/[0.04] text-muted-foreground", bar: "bg-slate-400" },
    primary: { border: "border-primary/20", icon: "bg-primary/10 text-primary", bar: "bg-primary" },
    danger: { border: "border-red-500/25", icon: "bg-red-500/10 text-red-400", bar: "bg-red-500" },
    warn: { border: "border-amber-500/25", icon: "bg-amber-500/10 text-amber-400", bar: "bg-amber-400" },
    ok: { border: "border-emerald-500/25", icon: "bg-emerald-500/10 text-emerald-400", bar: "bg-emerald-500" },
  } as const;
  const t = toneMap[tone];
  return (
    <div className={cn("panel-elevated p-5 transition-all hover:border-border-strong", t.border)}>
      <div className="flex items-center justify-between">
        <span className="mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
        <span className={cn("grid h-8 w-8 place-items-center rounded-lg border border-border", t.icon)}>{icon}</span>
      </div>
      <div className="mt-3 mono text-3xl font-bold tabular-nums text-shine">
        {value}{suffix ?? ""}
      </div>
      {trend && <div className="mt-1 text-[11px] text-muted-foreground">{trend}</div>}
      {typeof progress === "number" && (
        <div className="mt-3 h-1 rounded-full bg-white/[0.05] overflow-hidden">
          <div
            className={cn("h-full transition-all duration-700", t.bar)}
            style={{ width: `${progress}%`, boxShadow: "0 0 8px currentColor" }}
          />
        </div>
      )}
    </div>
  );
}
