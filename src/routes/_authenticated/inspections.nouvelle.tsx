import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useMemo, useState } from "react";
import { useStore, uid, nextInspectionNumber } from "@/lib/store";
import type { FilledItem, Inspection } from "@/lib/types";
import { PageHeader } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const searchSchema = z.object({ projectId: z.string().optional() });

export const Route = createFileRoute("/_authenticated/inspections/nouvelle")({
  validateSearch: (s) => searchSchema.parse(s),
  component: NewInspection,
});

function NewInspection() {
  const { data, setInspections } = useStore();
  const navigate = useNavigate();
  const search = Route.useSearch();

  const [projectId, setProjectId] = useState(search.projectId ?? data.projects[0]?.id ?? "");
  const project = data.projects.find((p) => p.id === projectId);
  const [controlType, setControlType] = useState("");
  const [checklistId, setChecklistId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [zone, setZone] = useState("");

  const availableTypes = useMemo(() => {
    if (project?.controlPlan?.controlTypes?.length) return project.controlPlan.controlTypes;
    return Array.from(new Set(data.checklists.map((c) => c.controlType)));
  }, [project, data.checklists]);

  const availableChecklists = data.checklists.filter((c) => !controlType || c.controlType === controlType);

  const create = () => {
    if (!project || !controlType || !checklistId) {
      toast.error("Renseignez le projet, le type et la checklist.");
      return;
    }
    const template = data.checklists.find((c) => c.id === checklistId)!;
    const items: FilledItem[] = template.items.map((i) => ({
      itemId: i.id,
      label: i.label,
      result: "",
      comment: "",
    }));
    const insp: Inspection = {
      id: uid(),
      number: nextInspectionNumber(data.inspections),
      projectId: project.id,
      controlType,
      checklistTemplateId: template.id,
      checklistName: template.name,
      date,
      zone,
      result: "",
      items,
      attachments: [],
      stage: "brouillon",
      sharedWithClient: false,
      createdAt: new Date().toISOString(),
    };
    setInspections([insp, ...data.inspections]);
    toast.success("Inspection créée");
    navigate({ to: "/inspections/$inspectionId", params: { inspectionId: insp.id } });
  };

  return (
    <div>
      <PageHeader title="Nouvelle inspection" description="Sélectionnez le projet et la checklist à utiliser." />
      <div className="p-4 md:p-8">
        <div className="max-w-xl space-y-4 rounded-lg border border-border bg-card p-5">
          <div className="space-y-1.5">
            <Label>Projet</Label>
            <Select value={projectId} onValueChange={(v) => { setProjectId(v); setControlType(""); setChecklistId(""); }}>
              <SelectTrigger><SelectValue placeholder="Choisir un projet" /></SelectTrigger>
              <SelectContent>
                {data.projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.code} — {p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Type de contrôle</Label>
            <Select value={controlType} onValueChange={(v) => { setControlType(v); setChecklistId(""); }}>
              <SelectTrigger><SelectValue placeholder="Choisir un type" /></SelectTrigger>
              <SelectContent>
                {availableTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Checklist</Label>
            <Select value={checklistId} onValueChange={setChecklistId} disabled={!controlType}>
              <SelectTrigger><SelectValue placeholder="Choisir une checklist" /></SelectTrigger>
              <SelectContent>
                {availableChecklists.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {controlType && availableChecklists.length === 0 && (
              <p className="text-xs text-muted-foreground">Aucune checklist pour ce type. Créez-en une d'abord.</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Partie d'ouvrage</Label>
              <Input value={zone} onChange={(e) => setZone(e.target.value)} placeholder="Niveau R+1 - Poteau P3" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => navigate({ to: "/inspections" })}>Annuler</Button>
            <Button onClick={create}>Créer et remplir</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
