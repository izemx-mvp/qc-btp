import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search, Trash2, Pencil } from "lucide-react";
import { PageHeader } from "@/components/app-layout";
import { useStore, uid } from "@/lib/store";
import type { Project, ProjectStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/projets")({
  component: Projects,
});

const emptyProject = (): Project => ({
  id: uid(),
  code: "",
  name: "",
  client: "",
  startDate: new Date().toISOString().slice(0, 10),
  status: "actif",
  whatsappGroup: "",
  controlPlan: { name: "", ref: "", controlTypes: [] },
});

function Projects() {
  const { data, setProjects } = useStore();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Project | null>(null);
  const [open, setOpen] = useState(false);

  const list = data.projects.filter((p) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return p.name.toLowerCase().includes(s) || p.code.toLowerCase().includes(s) || p.client.toLowerCase().includes(s);
  });

  const save = (p: Project) => {
    const exists = data.projects.some((x) => x.id === p.id);
    setProjects(exists ? data.projects.map((x) => (x.id === p.id ? p : x)) : [...data.projects, p]);
    setOpen(false);
    setEditing(null);
    toast.success(exists ? "Projet mis à jour" : "Projet créé");
  };

  const remove = (id: string) => {
    if (!confirm("Supprimer ce projet ?")) return;
    setProjects(data.projects.filter((p) => p.id !== id));
    toast.success("Projet supprimé");
  };

  return (
    <div>
      <PageHeader
        title="Projets"
        description="Chantiers suivis et leur plan de contrôle."
        action={
          <Button
            onClick={() => {
              setEditing(emptyProject());
              setOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Nouveau projet
          </Button>
        }
      />

      <div className="p-4 md:p-8 space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" />
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <div key={p.id} className="group panel-elevated p-5 hover:border-primary/30 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mono text-[10px] uppercase tracking-widest text-muted-foreground">{p.code}</div>
                  <Link
                    to="/projets/$projectId"
                    params={{ projectId: p.id }}
                    className="mt-0.5 font-semibold text-foreground hover:text-primary transition-colors block truncate"
                  >
                    {p.name}
                  </Link>
                  <div className="text-xs text-muted-foreground truncate mt-0.5">{p.client}</div>
                </div>
                <StatusPill status={p.status} />
              </div>
              <div className="mono mt-4 text-[10px] uppercase tracking-widest text-muted-foreground">
                Début · {p.startDate}
                {p.controlPlan?.ref ? ` · ${p.controlPlan.ref}` : ""}
              </div>
              {p.controlPlan?.controlTypes && p.controlPlan.controlTypes.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {p.controlPlan.controlTypes.map((t) => (
                    <span key={t} className="mono text-[10px] uppercase tracking-wider rounded-md border border-border bg-white/[0.03] text-muted-foreground px-1.5 py-0.5">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
                <Link to="/projets/$projectId" params={{ projectId: p.id }} className="text-xs text-primary hover:underline">
                  Ouvrir le projet →
                </Link>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => { setEditing(p); setOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(p.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {list.length === 0 && (
            <div className="col-span-full text-sm text-muted-foreground">Aucun projet.</div>
          )}
        </div>

      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          {editing && <ProjectForm project={editing} onSubmit={save} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusPill({ status }: { status: ProjectStatus }) {
  const map = {
    actif: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    termine: "bg-slate-500/10 text-slate-400 border-slate-500/30",
    en_pause: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  } as const;
  const label = { actif: "Actif", termine: "Terminé", en_pause: "En pause" } as const;
  const dot = {
    actif: "bg-emerald-400",
    termine: "bg-slate-400",
    en_pause: "bg-amber-400",
  } as const;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${map[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot[status]}`} />
      {label[status]}
    </span>
  );
}


function ProjectForm({ project, onSubmit }: { project: Project; onSubmit: (p: Project) => void }) {
  const [p, setP] = useState<Project>(project);
  const setCP = (k: keyof NonNullable<Project["controlPlan"]>, v: string | string[]) =>
    setP({ ...p, controlPlan: { ...(p.controlPlan ?? { name: "", ref: "", controlTypes: [] }), [k]: v } });

  return (
    <>
      <DialogHeader>
        <DialogTitle>{project.name ? "Modifier le projet" : "Nouveau projet"}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-3 py-2">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Code</Label>
            <Input value={p.code} onChange={(e) => setP({ ...p, code: e.target.value })} placeholder="SNG" />
          </div>
          <div className="space-y-1.5">
            <Label>Statut</Label>
            <Select value={p.status} onValueChange={(v) => setP({ ...p, status: v as ProjectStatus })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="actif">Actif</SelectItem>
                <SelectItem value="en_pause">En pause</SelectItem>
                <SelectItem value="termine">Terminé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Nom du projet</Label>
          <Input value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Client</Label>
            <Input value={p.client} onChange={(e) => setP({ ...p, client: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Date de début</Label>
            <Input type="date" value={p.startDate} onChange={(e) => setP({ ...p, startDate: e.target.value })} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Groupe WhatsApp (référence)</Label>
          <Input value={p.whatsappGroup ?? ""} onChange={(e) => setP({ ...p, whatsappGroup: e.target.value })} />
        </div>
        <div className="border-t border-border pt-3 space-y-3">
          <div className="text-sm font-medium">Plan de contrôle</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nom</Label>
              <Input value={p.controlPlan?.name ?? ""} onChange={(e) => setCP("name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Référence</Label>
              <Input value={p.controlPlan?.ref ?? ""} onChange={(e) => setCP("ref", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Types de contrôle (séparés par des virgules)</Label>
            <Textarea
              rows={2}
              value={(p.controlPlan?.controlTypes ?? []).join(", ")}
              onChange={(e) =>
                setCP(
                  "controlTypes",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
              placeholder="Ferraillage, Coffrage, Bétonnage..."
            />
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={() => onSubmit(p)} disabled={!p.name || !p.code}>
          Enregistrer
        </Button>
      </DialogFooter>
    </>
  );
}
