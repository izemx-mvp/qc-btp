import type { Inspection, Project } from "./types";

function escape(v: string) {
  if (/[",\n;]/.test(v)) return '"' + v.replace(/"/g, '""') + '"';
  return v;
}

export function exportInspectionsCSV(project: Project | null, inspections: Inspection[]) {
  const rows = [
    ["N°", "Projet", "Type", "Checklist", "Date", "Zone", "Résultat", "Étape", "NC", "Description NC", "Plan d'action", "Partagée client"],
    ...inspections.map((i) => [
      i.number,
      project?.code ?? i.projectId,
      i.controlType,
      i.checklistName,
      i.date,
      i.zone,
      i.result || "",
      i.stage,
      i.ncStatus || "",
      i.ncDescription || "",
      i.ncActionPlan || "",
      i.sharedWithClient ? "oui" : "non",
    ]),
  ];
  const csv = rows.map((r) => r.map((c) => escape(String(c))).join(";")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `inspections_${project?.code ?? "export"}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
