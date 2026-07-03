import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardCheck, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/app-layout";
import { NCBadge, ResultBadge, StageBadge } from "@/components/status-badge";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { data } = useStore();
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [q, setQ] = useState("");

  const stats = useMemo(() => {
    return data.projects.map((p) => {
      const insps = data.inspections.filter((i) => i.projectId === p.id);
      const conf = insps.filter((i) => i.result === "conforme").length;
      const nc = insps.filter((i) => i.result === "non_conforme").length;
      const ncOpen = insps.filter((i) => i.ncStatus === "ouvert").length;
      return { project: p, total: insps.length, conf, nc, ncOpen };
    });
  }, [data]);

  const totalOpenNC = data.inspections.filter((i) => i.ncStatus === "ouvert").length;
  const totalDrafts = data.inspections.filter((i) => i.stage === "brouillon").length;
  const totalInspections = data.inspections.length;

  const controlTypes = useMemo(
    () => Array.from(new Set(data.inspections.map((i) => i.controlType))),
    [data.inspections],
  );

  const filtered = data.inspections
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

  const projectName = (id: string) => data.projects.find((p) => p.id === id)?.name ?? "—";

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de vos chantiers et inspections."
        action={
          <Button asChild>
            <Link to="/inspections/nouvelle">
              <Plus className="mr-2 h-4 w-4" /> Nouvelle inspection
            </Link>
          </Button>
        }
      />

      <div className="p-4 md:p-8 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon={<ClipboardCheck className="h-5 w-5" />}
            label="Inspections totales"
            value={totalInspections}
            tone="neutral"
          />
          <StatCard
            icon={<AlertTriangle className="h-5 w-5" />}
            label="Non-conformités ouvertes"
            value={totalOpenNC}
            tone={totalOpenNC > 0 ? "danger" : "neutral"}
          />
          <StatCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            label="À traiter (brouillons)"
            value={totalDrafts}
            tone={totalDrafts > 0 ? "warn" : "neutral"}
          />
        </div>

        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Vue par projet
          </h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {stats.map((s) => (
              <Link
                key={s.project.id}
                to="/projets/$projectId"
                params={{ projectId: s.project.id }}
                className="rounded-lg border border-border bg-card p-4 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">{s.project.code}</div>
                    <div className="font-medium truncate">{s.project.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{s.project.client}</div>
                  </div>
                  {s.ncOpen > 0 && (
                    <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 text-xs font-medium">
                      <AlertTriangle className="h-3 w-3" /> {s.ncOpen}
                    </span>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <Mini label="Total" value={s.total} />
                  <Mini label="Conf." value={s.conf} tone="ok" />
                  <Mini label="NC" value={s.nc} tone={s.nc > 0 ? "danger" : "neutral"} />
                </div>
              </Link>
            ))}
            {stats.length === 0 && (
              <div className="text-sm text-muted-foreground">Aucun projet. Créez-en un depuis la page Projets.</div>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Inspections récentes
            </h2>
          </div>
          <div className="rounded-lg border border-border bg-card">
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
              {filtered.slice(0, 20).map((i) => (
                <Link
                  key={i.id}
                  to="/inspections/$inspectionId"
                  params={{ inspectionId: i.id }}
                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 p-3 hover:bg-accent/40 transition-colors md:grid-cols-[110px_minmax(0,2fr)_minmax(0,1fr)_auto]"
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
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "neutral" | "danger" | "warn" | "ok";
}) {
  const toneMap = {
    neutral: "bg-card border-border",
    danger: "bg-red-50 border-red-200",
    warn: "bg-amber-50 border-amber-200",
    ok: "bg-emerald-50 border-emerald-200",
  } as const;
  return (
    <div className={`rounded-lg border p-4 ${toneMap[tone]}`}>
      <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
    </div>
  );
}

function Mini({ label, value, tone = "neutral" }: { label: string; value: number; tone?: "neutral" | "ok" | "danger" }) {
  const toneMap = {
    neutral: "text-foreground",
    ok: "text-emerald-700",
    danger: "text-red-700",
  } as const;
  return (
    <div className="rounded-md bg-muted/50 py-1.5">
      <div className={`text-base font-semibold ${toneMap[tone]}`}>{value}</div>
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
    </div>
  );
}
