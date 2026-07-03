import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Download, Plus } from "lucide-react";
import { PageHeader } from "@/components/app-layout";
import { NCBadge, ResultBadge, StageBadge } from "@/components/status-badge";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { exportInspectionsCSV } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/projets/$projectId")({
  component: ProjectDetail,
});

function ProjectDetail() {
  const { projectId } = Route.useParams();
  const { data } = useStore();
  const project = data.projects.find((p) => p.id === projectId);
  if (!project) return <Navigate to="/projets" />;
  const inspections = data.inspections
    .filter((i) => i.projectId === project.id)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div>
      <PageHeader
        title={`${project.code} — ${project.name}`}
        description={`Client : ${project.client}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportInspectionsCSV(project, inspections)}>
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
            <Button asChild>
              <Link to="/inspections/nouvelle" search={{ projectId: project.id }}>
                <Plus className="mr-2 h-4 w-4" /> Inspection
              </Link>
            </Button>
          </div>
        }
      />
      <div className="p-4 md:p-8 space-y-6">
        <section className="rounded-lg border border-border bg-card p-4">
          <div className="text-sm font-semibold mb-2">Plan de contrôle</div>
          <div className="text-sm text-muted-foreground">
            {project.controlPlan?.name} ({project.controlPlan?.ref})
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {(project.controlPlan?.controlTypes ?? []).map((t) => (
              <span key={t} className="text-xs rounded bg-secondary text-secondary-foreground px-2 py-0.5">{t}</span>
            ))}
          </div>
        </section>

        <section>
          <div className="text-sm font-semibold mb-3">Inspections ({inspections.length})</div>
          <div className="rounded-lg border border-border bg-card divide-y divide-border">
            {inspections.map((i) => (
              <Link
                key={i.id}
                to="/inspections/$inspectionId"
                params={{ inspectionId: i.id }}
                className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 p-3 hover:bg-accent/40 md:grid-cols-[110px_minmax(0,2fr)_auto_auto]"
              >
                <div className="text-xs text-muted-foreground md:text-sm md:text-foreground md:font-medium">
                  {i.number}
                </div>
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
            {inspections.length === 0 && (
              <div className="p-6 text-sm text-muted-foreground text-center">Aucune inspection pour ce projet.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
