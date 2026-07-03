import { createFileRoute, Link, Outlet, useMatches } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/app-layout";
import { NCBadge, ResultBadge, StageBadge } from "@/components/status-badge";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/inspections")({
  component: InspectionsLayout,
});

function InspectionsLayout() {
  const matches = useMatches();
  const isChild = matches.some((m) => m.routeId !== "/_authenticated/inspections" && m.routeId.startsWith("/_authenticated/inspections"));
  if (isChild) return <Outlet />;
  return <InspectionsList />;
}

function InspectionsList() {
  const { data } = useStore();
  const [q, setQ] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");

  const controlTypes = useMemo(
    () => Array.from(new Set(data.inspections.map((i) => i.controlType).concat(data.checklists.map((c) => c.controlType)))),
    [data],
  );

  const list = data.inspections
    .filter((i) => (projectFilter === "all" ? true : i.projectId === projectFilter))
    .filter((i) => (typeFilter === "all" ? true : i.controlType === typeFilter))
    .filter((i) => (stageFilter === "all" ? true : i.stage === stageFilter))
    .filter((i) => {
      if (!q) return true;
      const s = q.toLowerCase();
      return i.number.toLowerCase().includes(s) || i.zone.toLowerCase().includes(s);
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const projectName = (id: string) => data.projects.find((p) => p.id === id)?.code ?? "—";

  return (
    <div>
      <PageHeader
        title="Inspections"
        description="Toutes les inspections, filtrables par projet, type ou statut."
        action={
          <Button asChild>
            <Link to="/inspections/nouvelle">
              <Plus className="mr-2 h-4 w-4" /> Nouvelle inspection
            </Link>
          </Button>
        }
      />
      <div className="p-4 md:p-8 space-y-4">
        <div className="rounded-lg border border-border bg-card">
          <div className="flex flex-col gap-2 border-b border-border p-3 md:flex-row md:items-center">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" />
            </div>
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="md:w-44"><SelectValue placeholder="Projet" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous projets</SelectItem>
                {data.projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.code}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="md:w-44"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous types</SelectItem>
                {controlTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="md:w-40"><SelectValue placeholder="Étape" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes étapes</SelectItem>
                <SelectItem value="brouillon">Brouillon</SelectItem>
                <SelectItem value="rempli">Rempli</SelectItem>
                <SelectItem value="signe">Signé</SelectItem>
                <SelectItem value="classe">Classé</SelectItem>
                <SelectItem value="partage">Partagé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="divide-y divide-border">
            {list.map((i) => (
              <Link
                key={i.id}
                to="/inspections/$inspectionId"
                params={{ inspectionId: i.id }}
                className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 p-3 hover:bg-accent/40 md:grid-cols-[110px_80px_minmax(0,2fr)_auto_auto]"
              >
                <div className="text-xs text-muted-foreground md:text-sm md:text-foreground md:font-medium">{i.number}</div>
                <div className="hidden md:block text-xs text-muted-foreground">{projectName(i.projectId)}</div>
                <div className="min-w-0 col-span-2 md:col-span-1">
                  <div className="truncate text-sm font-medium">{i.zone || "—"}</div>
                  <div className="truncate text-xs text-muted-foreground">{i.controlType} · {i.date}</div>
                </div>
                <StageBadge stage={i.stage} />
                <div className="flex items-center gap-2 justify-end">
                  <ResultBadge result={i.result} />
                  <NCBadge status={i.ncStatus} />
                </div>
              </Link>
            ))}
            {list.length === 0 && <div className="p-6 text-sm text-muted-foreground text-center">Aucune inspection.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
