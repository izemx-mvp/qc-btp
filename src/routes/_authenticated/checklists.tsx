import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Pencil, Plus, Sparkles, Trash2, Search, X } from "lucide-react";
import { PageHeader } from "@/components/app-layout";
import { useStore, uid } from "@/lib/store";
import type { ChecklistItem, ChecklistTemplate, ItemResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/checklists")({
  component: Checklists,
});

const empty = (): ChecklistTemplate => ({
  id: uid(),
  name: "",
  controlType: "",
  items: [{ id: uid(), label: "", expected: "conforme" }],
});

function Checklists() {
  const { data, setChecklists } = useStore();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<ChecklistTemplate | null>(null);
  const [open, setOpen] = useState(false);

  const list = data.checklists.filter((c) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return c.name.toLowerCase().includes(s) || c.controlType.toLowerCase().includes(s);
  });

  const save = (c: ChecklistTemplate) => {
    const exists = data.checklists.some((x) => x.id === c.id);
    setChecklists(exists ? data.checklists.map((x) => (x.id === c.id ? c : x)) : [...data.checklists, c]);
    setOpen(false);
    setEditing(null);
    toast.success(exists ? "Checklist mise à jour" : "Checklist créée");
  };

  const duplicate = (c: ChecklistTemplate) => {
    const copy: ChecklistTemplate = {
      ...c,
      id: uid(),
      name: c.name + " (copie)",
      items: c.items.map((i) => ({ ...i, id: uid() })),
    };
    setChecklists([...data.checklists, copy]);
    toast.success("Checklist dupliquée");
  };

  const remove = (id: string) => {
    if (!confirm("Supprimer cette checklist ?")) return;
    setChecklists(data.checklists.filter((c) => c.id !== id));
  };

  return (
    <div>
      <PageHeader
        title="Checklists (modèles)"
        description="Modèles réutilisables, personnalisables par projet ou client."
        action={
          <div className="flex gap-2">
            <Button variant="outline" disabled title="Bientôt disponible">
              <Sparkles className="mr-2 h-4 w-4" /> Générer avec IA
            </Button>
            <Button
              onClick={() => {
                setEditing(empty());
                setOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Nouvelle checklist
            </Button>
          </div>
        }
      />

      <div className="p-4 md:p-8 space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {list.map((c) => (
            <div key={c.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">{c.controlType || "—"}</div>
                  <div className="font-medium truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{c.items.length} point(s) de contrôle</div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => duplicate(c)} title="Dupliquer">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setEditing(c); setOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(c.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-muted-foreground max-h-32 overflow-auto">
                {c.items.slice(0, 6).map((it) => (
                  <li key={it.id} className="truncate">• {it.label || <em>vide</em>}</li>
                ))}
                {c.items.length > 6 && <li className="text-xs">+ {c.items.length - 6} autres…</li>}
              </ul>
            </div>
          ))}
          {list.length === 0 && <div className="text-sm text-muted-foreground">Aucune checklist.</div>}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          {editing && <ChecklistForm value={editing} onSubmit={save} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ChecklistForm({ value, onSubmit }: { value: ChecklistTemplate; onSubmit: (c: ChecklistTemplate) => void }) {
  const [c, setC] = useState<ChecklistTemplate>(value);
  const update = (patch: Partial<ChecklistTemplate>) => setC({ ...c, ...patch });
  const updateItem = (id: string, patch: Partial<ChecklistItem>) =>
    setC({ ...c, items: c.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) });
  const addItem = () => setC({ ...c, items: [...c.items, { id: uid(), label: "", expected: "conforme" }] });
  const removeItem = (id: string) => setC({ ...c, items: c.items.filter((i) => i.id !== id) });

  return (
    <>
      <DialogHeader>
        <DialogTitle>{value.name ? "Modifier la checklist" : "Nouvelle checklist"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3 py-2">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Nom</Label>
            <Input value={c.name} onChange={(e) => update({ name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Type de contrôle</Label>
            <Input value={c.controlType} onChange={(e) => update({ controlType: e.target.value })} placeholder="Ferraillage..." />
          </div>
        </div>
        <div className="border-t border-border pt-3">
          <div className="flex items-center justify-between mb-2">
            <Label>Points de contrôle</Label>
            <Button variant="outline" size="sm" onClick={addItem}>
              <Plus className="mr-1 h-4 w-4" /> Ajouter
            </Button>
          </div>
          <div className="space-y-2 max-h-80 overflow-auto pr-1">
            {c.items.map((it, idx) => (
              <div key={it.id} className="grid grid-cols-[24px_minmax(0,1fr)_140px_32px] items-center gap-2">
                <span className="text-xs text-muted-foreground">{idx + 1}.</span>
                <Input value={it.label} onChange={(e) => updateItem(it.id, { label: e.target.value })} placeholder="Point à vérifier" />
                <Select value={it.expected} onValueChange={(v) => updateItem(it.id, { expected: v as ItemResult })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conforme">Attendu conforme</SelectItem>
                    <SelectItem value="non_applicable">Non applicable</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" onClick={() => removeItem(it.id)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={() => onSubmit(c)} disabled={!c.name || !c.controlType || c.items.length === 0}>
          Enregistrer
        </Button>
      </DialogFooter>
    </>
  );
}
