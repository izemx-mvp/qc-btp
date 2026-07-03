import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, ChevronRight, FolderOpen, FileText, CheckCircle2, Circle } from "lucide-react";
import { PageHeader } from "@/components/app-layout";
import { NCBadge, ResultBadge } from "@/components/status-badge";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/classement")({
  component: Classement,
});

function Classement() {
  const { data } = useStore();
  const [openProjects, setOpenProjects] = useState<Record<string, boolean>>({});
  const [openTypes, setOpenTypes] = useState<Record<string, boolean>>({});

  const toggleP = (id: string) => setOpenProjects({ ...openProjects, [id]: !openProjects[id] });
  const toggleT = (k: string) => setOpenTypes({ ...openTypes, [k]: !openTypes[k] });

  return (
    <div>
      <PageHeader title="Classement documentaire" description="Arborescence Projet → Type de contrôle → Inspection." />
      <div className="p-4 md:p-8">
        <div className="rounded-lg border border-border bg-card">
          {data.projects.map((p) => {
            const insps = data.inspections.filter((i) => i.projectId === p.id);
            const types = Array.from(new Set(insps.map((i) => i.controlType)));
            const pOpen = openProjects[p.id] ?? true;
            return (
              <div key={p.id} className="border-b border-border last:border-0">
                <button
                  onClick={() => toggleP(p.id)}
                  className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-accent/40"
                >
                  {pOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <FolderOpen className="h-4 w-4 text-primary" />
                  <span className="font-medium">{p.code} — {p.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{insps.length} inspection(s)</span>
                </button>
                {pOpen && (
                  <div className="pl-6">
                    {types.map((t) => {
                      const key = `${p.id}::${t}`;
                      const tOpen = openTypes[key] ?? true;
                      const forType = insps.filter((i) => i.controlType === t);
                      return (
                        <div key={key} className="border-t border-border">
                          <button
                            onClick={() => toggleT(key)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-accent/40"
                          >
                            {tOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            <FolderOpen className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{t}</span>
                            <span className="ml-auto text-xs text-muted-foreground">{forType.length}</span>
                          </button>
                          {tOpen && (
                            <ul className="pl-6">
                              {forType.map((i) => (
                                <li key={i.id}>
                                  <Link
                                    to="/inspections/$inspectionId"
                                    params={{ inspectionId: i.id }}
                                    className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-t border-border px-4 py-2 hover:bg-accent/40"
                                  >
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <div className="min-w-0">
                                      <div className="text-sm truncate">{i.number} — {i.zone || "—"}</div>
                                      <div className="text-xs text-muted-foreground">{i.date}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <ResultBadge result={i.result} />
                                      <NCBadge status={i.ncStatus} />
                                      <span
                                        className={`inline-flex items-center gap-1 text-xs ${
                                          i.sharedWithClient ? "text-emerald-700" : "text-muted-foreground"
                                        }`}
                                        title={i.sharedWithClient ? "Partagé avec le client" : "Non partagé"}
                                      >
                                        {i.sharedWithClient ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                                        {i.sharedWithClient ? "Partagé" : "Non partagé"}
                                      </span>
                                    </div>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                    {types.length === 0 && (
                      <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
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
