import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardCheck, FolderKanban, Plus, Search, Download } from "lucide-react";
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
  { key: "7", label: "7 jours", days: 7 },
  { key: "30", label: "30 jours", days: 30 },
  { key: "90", label: "3 mois", days: 90 },
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
        description="Vue d'ensemble de vos chantiers, inspections et non-conformités."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { exportInspectionsCSV(null, scoped); toast.success("Export généré"); }}>
              <Download className="mr-2 h-4 w-4" /> Exporter
            </Button>
            <Button asChild>
              <Link to="/inspections/nouvelle">
                <Plus className="mr-2 h-4 w-4" /> Nouvelle inspection
              </Link>
            </Button>
          </div>
        }
      />

      <div className="p-4 md:p-8 space-y-6">
        {/* Period filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-muted-foreground mr-1">Période :</span>
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                period === p.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<FolderKanban className="h-5 w-5" />} label="Projets actifs" value={cProjects} tone="primary" />
          <StatCard icon={<ClipboardCheck className="h-5 w-5" />} label="Inspections" value={cInsp} tone="neutral" />
          <StatCard icon={<AlertTriangle className="h-5 w-5" />} label="NC ouvertes" value={cNC} tone={ncOpen > 0 ? "danger" : "neutral"} />
          <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Taux de conformité" value={cRate} suffix="%" tone={rate >= 80 ? "ok" : "warn"} />
        </div>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Donut */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="text-sm font-semibold">Conformité globale</div>
            <div className="text-xs text-muted-foreground">Sur la période sélectionnée</div>
            <div className="mt-4 flex items-center gap-6">
              <svg viewBox="0 0 100 100" className="h-32 w-32 -rotate-90">
                <circle cx="50" cy="50" r={R} fill="none" stroke="oklch(0.94 0.02 258)" strokeWidth="12" />
                <circle
                  cx="50" cy="50" r={R} fill="none"
                  stroke="oklch(0.62 0.18 148)" strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={`${dashConf} ${C - dashConf}`}
                  style={{ transition: "stroke-dasharray 800ms ease" }}
                />
              </svg>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <span className="font-medium">{conf}</span>
                  <span className="text-muted-foreground">conformes</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <span className="font-medium">{nc}</span>
                  <span className="text-muted-foreground">non-conformes</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="font-medium">{drafts}</span>
                  <span className="text-muted-foreground">brouillons</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bars per project */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Conforme vs non-conforme par projet</div>
                <div className="text-xs text-muted-foreground">Répartition sur la période</div>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {perProject.map((s) => {
                const w = (s.total / maxTotal) * 100;
                const cw = s.total ? (s.conf / s.total) * w : 0;
                return (
                  <div key={s.project.id}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium truncate">{s.project.code} — {s.project.name}</span>
                      <span className="text-muted-foreground">{s.conf}/{s.total}</span>
                    </div>
                    <div className="relative h-3 rounded-full bg-muted overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-red-400"
                        style={{ width: `${w}%`, transition: "width 800ms ease" }}
                      />
                      <div
                        className="absolute inset-y-0 left-0 bg-emerald-500"
                        style={{ width: `${cw}%`, transition: "width 800ms ease" }}
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
              <h2 className="text-sm font-semibold text-foreground">À faire</h2>
              <p className="text-xs text-muted-foreground">Brouillons à finaliser et non-conformités à traiter.</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/inspections">Voir tout</Link>
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
                    "rounded-xl border p-4 bg-card hover:shadow-md transition-all",
                    isNC ? "border-red-200 hover:border-red-300" : "border-amber-200 hover:border-amber-300",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground">{i.number} · {projectName(i.projectId)}</div>
                      <div className="font-medium truncate">{i.zone || i.controlType}</div>
                    </div>
                    {isNC ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 text-xs font-medium">
                        <AlertTriangle className="h-3 w-3" /> NC ouverte
                      </span>
                    ) : (
                      <StageBadge stage={i.stage} />
                    )}
                  </div>
                  {i.ncDescription && (
                    <div className="mt-2 text-xs text-muted-foreground line-clamp-2">{i.ncDescription}</div>
                  )}
                  <div className="mt-3 flex justify-end">
                    <span className="text-xs text-primary font-medium">Voir le détail →</span>
                  </div>
                </Link>
              );
            })}
            {todo.length === 0 && (
              <div className="text-sm text-muted-foreground rounded-xl border border-border bg-card p-6 text-center md:col-span-2">
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
              <Link to="/inspections">Voir tout</Link>
            </Button>
          </div>
          <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="flex flex-col gap-2 border-b border-border p-3 md:flex-row md:items-center">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher n° / zone / type..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="pl-8"
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
              {filtered.slice(0, 10).map((i, idx) => (
                <Link
                  key={i.id}
                  to="/inspections/$inspectionId"
                  params={{ inspectionId: i.id }}
                  className={cn(
                    "grid grid-cols-[minmax(0,1fr)_auto] gap-3 p-3 hover:bg-accent/40 transition-colors md:grid-cols-[110px_minmax(0,2fr)_minmax(0,1fr)_auto]",
                    idx % 2 === 1 && "bg-muted/30",
                  )}
                >
                  <div className="text-xs text-muted-foreground md:text-sm md:text-foreground md:font-medium">
                    {i.number}
                  </div>
                  <div className="min-w-0 col-span-2 md:col-span-1">
                    <div className="truncate text-sm font-medium">{i.zone || "—"}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {projectName(i.projectId)} · {i.controlType} · {i.date}
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

function StatCard({
  icon, label, value, suffix, tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  tone: "neutral" | "danger" | "warn" | "ok" | "primary";
}) {
  const toneMap = {
    neutral: { bg: "bg-card border-border", icon: "bg-muted text-muted-foreground" },
    primary: { bg: "bg-card border-border", icon: "bg-primary/10 text-primary" },
    danger: { bg: "bg-red-50 border-red-200", icon: "bg-red-100 text-red-700" },
    warn: { bg: "bg-amber-50 border-amber-200", icon: "bg-amber-100 text-amber-700" },
    ok: { bg: "bg-emerald-50 border-emerald-200", icon: "bg-emerald-100 text-emerald-700" },
  } as const;
  const t = toneMap[tone];
  return (
    <div className={cn("rounded-xl border p-5 shadow-sm transition-all hover:shadow-md", t.bg)}>
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className={cn("grid h-9 w-9 place-items-center rounded-lg", t.icon)}>{icon}</span>
      </div>
      <div className="mt-3 text-3xl font-semibold tabular-nums">
        {value}{suffix ?? ""}
      </div>
    </div>
  );
}
