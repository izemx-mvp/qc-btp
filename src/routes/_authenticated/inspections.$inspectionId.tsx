import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Download, Paperclip, Save, Send, Share2, Trash2, X } from "lucide-react";
import { exportInspectionPDF } from "@/lib/pdf";
import { PageHeader } from "@/components/app-layout";
import { NCBadge, ResultBadge, StageBadge } from "@/components/status-badge";
import { useStore, uid } from "@/lib/store";
import type { Attachment, Inspection, InspectionStage, ItemResult, NCStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/inspections/$inspectionId")({
  component: InspectionDetail,
});

function InspectionDetail() {
  const { inspectionId } = Route.useParams();
  const { data, setInspections } = useStore();
  const navigate = useNavigate();
  const found = data.inspections.find((i) => i.id === inspectionId);
  const [state, setState] = useState<Inspection | null>(found ?? null);

  if (!found || !state) return <Navigate to="/inspections" />;

  const project = data.projects.find((p) => p.id === state.projectId);

  const persist = (next: Inspection, msg?: string) => {
    setState(next);
    setInspections(data.inspections.map((i) => (i.id === next.id ? next : i)));
    if (msg) toast.success(msg);
  };

  const globalResult: "conforme" | "non_conforme" | "" = useMemo(() => {
    if (state.items.length === 0) return "";
    if (state.items.some((i) => i.result === "non_conforme")) return "non_conforme";
    if (state.items.every((i) => i.result === "conforme" || i.result === "non_applicable")) return "conforme";
    return "";
  }, [state.items]);

  const setItem = (itemId: string, patch: Partial<Inspection["items"][number]>) => {
    setState({ ...state, items: state.items.map((i) => (i.itemId === itemId ? { ...i, ...patch } : i)) });
  };

  const save = () => {
    const next: Inspection = { ...state, result: globalResult };
    if (globalResult === "non_conforme" && !next.ncStatus) next.ncStatus = "ouvert";
    persist(next, "Enregistré");
  };

  const setStage = (stage: InspectionStage) => {
    const next: Inspection = { ...state, stage, result: globalResult };
    if (globalResult === "non_conforme" && !next.ncStatus) next.ncStatus = "ouvert";
    persist(next, `Statut : ${stage}`);
  };

  const toggleShare = () => {
    const shared = !state.sharedWithClient;
    persist({ ...state, sharedWithClient: shared, stage: shared ? "partage" : state.stage }, shared ? "Partagée" : "Marquée non partagée");
  };

  const setNCStatus = (s: NCStatus) => {
    persist({
      ...state,
      ncStatus: s,
      ncClosedDate: s === "ferme" ? new Date().toISOString().slice(0, 10) : undefined,
    }, s === "ferme" ? "Non-conformité clôturée" : "NC ré-ouverte");
  };

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    const atts: Attachment[] = [];
    for (const f of Array.from(files)) {
      const dataUrl: string = await new Promise((res) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.readAsDataURL(f);
      });
      atts.push({ id: uid(), name: f.name, type: f.type, dataUrl });
    }
    setState({ ...state, attachments: [...state.attachments, ...atts] });
  };

  const removeAtt = (id: string) => setState({ ...state, attachments: state.attachments.filter((a) => a.id !== id) });

  const remove = () => {
    if (!confirm("Supprimer cette inspection ?")) return;
    setInspections(data.inspections.filter((i) => i.id !== state.id));
    navigate({ to: "/inspections" });
  };

  return (
    <div>
      <PageHeader
        title={`${state.number} — ${state.controlType}`}
        description={project ? `${project.code} · ${project.name}` : ""}
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await exportInspectionPDF(state, project ?? null);
                  toast.success("PDF téléchargé");
                } catch (e) {
                  console.error(e);
                  toast.error("Échec de l'export PDF");
                }
              }}
            >
              <Download className="mr-2 h-4 w-4" /> Télécharger PDF
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/inspections"><ArrowLeft className="mr-2 h-4 w-4" /> Retour</Link>
            </Button>
          </div>
        }
      />

      <div className="p-4 md:p-8 space-y-6 max-w-4xl">
        <div className="flex flex-wrap items-center gap-2">
          <StageBadge stage={state.stage} />
          <ResultBadge result={globalResult} />
          <NCBadge status={state.ncStatus} />
          {state.sharedWithClient && (
            <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-xs font-medium">
              Partagée avec le client
            </span>
          )}
        </div>

        <section className="rounded-lg border border-border bg-card p-4 grid gap-3 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" value={state.date} onChange={(e) => setState({ ...state, date: e.target.value })} />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Partie d'ouvrage</Label>
            <Input value={state.zone} onChange={(e) => setState({ ...state, zone: e.target.value })} />
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card">
          <div className="border-b border-border p-4">
            <div className="font-medium">{state.checklistName}</div>
            <div className="text-xs text-muted-foreground">{state.items.length} points de contrôle</div>
          </div>
          <div className="divide-y divide-border">
            {state.items.map((it, idx) => (
              <div key={it.itemId} className="p-4 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-xs text-muted-foreground pt-1 w-6">{idx + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{it.label}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 pl-8">
                  {(["conforme", "non_conforme", "non_applicable"] as ItemResult[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => setItem(it.itemId, { result: r })}
                      className={`rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                        it.result === r
                          ? r === "conforme"
                            ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                            : r === "non_conforme"
                            ? "bg-red-100 border-red-300 text-red-800"
                            : "bg-muted border-border text-foreground"
                          : "bg-background border-border text-muted-foreground hover:bg-accent/50"
                      }`}
                    >
                      {r === "conforme" ? "Conforme" : r === "non_conforme" ? "Non conf." : "N/A"}
                    </button>
                  ))}
                </div>
                <Textarea
                  className="ml-8"
                  rows={1}
                  placeholder="Commentaire (optionnel)"
                  value={it.comment}
                  onChange={(e) => setItem(it.itemId, { comment: e.target.value })}
                />
              </div>
            ))}
          </div>
        </section>

        {globalResult === "non_conforme" && (
          <section className="rounded-lg border border-red-200 bg-red-50/50 p-4 space-y-3">
            <div className="font-medium text-red-900">Non-conformité</div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={2} value={state.ncDescription ?? ""} onChange={(e) => setState({ ...state, ncDescription: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Plan d'action</Label>
              <Textarea rows={2} value={state.ncActionPlan ?? ""} onChange={(e) => setState({ ...state, ncActionPlan: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs">Statut :</Label>
              <Select value={state.ncStatus ?? "ouvert"} onValueChange={(v) => setNCStatus(v as NCStatus)}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ouvert">Ouverte</SelectItem>
                  <SelectItem value="ferme">Fermée</SelectItem>
                </SelectContent>
              </Select>
              {state.ncClosedDate && <span className="text-xs text-muted-foreground">Clôturée le {state.ncClosedDate}</span>}
            </div>
          </section>
        )}

        <section className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-medium">Pièces jointes</div>
            <label className="cursor-pointer inline-flex items-center gap-2 rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent">
              <Paperclip className="h-4 w-4" /> Ajouter
              <input type="file" className="hidden" multiple accept="image/*,application/pdf" onChange={(e) => onFiles(e.target.files)} />
            </label>
          </div>
          {state.attachments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune pièce jointe. Photo ou PDF scanné signé.</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {state.attachments.map((a) => (
                <li key={a.id} className="flex items-center gap-2 rounded-md border border-border p-2">
                  {a.type.startsWith("image/") ? (
                    <img src={a.dataUrl} alt={a.name} className="h-12 w-12 rounded object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded bg-muted grid place-items-center text-xs">PDF</div>
                  )}
                  <a href={a.dataUrl} download={a.name} className="flex-1 min-w-0 text-sm truncate hover:underline">{a.name}</a>
                  <Button variant="ghost" size="icon" onClick={() => removeAtt(a.id)}><X className="h-4 w-4" /></Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="sticky bottom-0 -mx-4 md:-mx-8 border-t border-border bg-card px-4 py-3 md:px-8 flex flex-wrap items-center gap-2 justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={save}><Save className="mr-2 h-4 w-4" /> Enregistrer</Button>
            <Select value={state.stage} onValueChange={(v) => setStage(v as InspectionStage)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="brouillon">Brouillon</SelectItem>
                <SelectItem value="rempli">Rempli</SelectItem>
                <SelectItem value="signe">Signé</SelectItem>
                <SelectItem value="classe">Classé</SelectItem>
              </SelectContent>
            </Select>
            <Button variant={state.sharedWithClient ? "secondary" : "default"} onClick={toggleShare}>
              {state.sharedWithClient ? <Share2 className="mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}
              {state.sharedWithClient ? "Ne plus partager" : "Marquer partagé"}
            </Button>
          </div>
          <Button variant="ghost" onClick={remove}><Trash2 className="mr-2 h-4 w-4 text-destructive" /> Supprimer</Button>
        </section>
      </div>
    </div>
  );
}
