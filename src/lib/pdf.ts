import { jsPDF } from "jspdf";
import type { Inspection, Project } from "./types";

const stageLabel: Record<string, string> = {
  brouillon: "Brouillon",
  rempli: "Rempli",
  signe: "Signé",
  classe: "Classé",
  partage: "Partagé",
};

const resultLabel = (r: string) =>
  r === "conforme" ? "Conforme" : r === "non_conforme" ? "Non conforme" : r === "non_applicable" ? "N/A" : "—";

async function toDataUrl(src: string): Promise<{ dataUrl: string; w: number; h: number } | null> {
  if (src.startsWith("data:")) {
    return new Promise((res) => {
      const img = new Image();
      img.onload = () => res({ dataUrl: src, w: img.width, h: img.height });
      img.onerror = () => res(null);
      img.src = src;
    });
  }
  try {
    const blob = await fetch(src).then((r) => r.blob());
    const dataUrl: string = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = rej;
      r.readAsDataURL(blob);
    });
    return new Promise((res) => {
      const img = new Image();
      img.onload = () => res({ dataUrl, w: img.width, h: img.height });
      img.onerror = () => res(null);
      img.src = dataUrl;
    });
  } catch {
    return null;
  }
}

export async function exportInspectionPDF(inspection: Inspection, project: Project | null) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = margin;

  const line = (h = 14) => {
    y += h;
    if (y > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Header band
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, 70, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Rapport d'inspection", margin, 32);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`${inspection.number} · ${inspection.controlType}`, margin, 50);
  doc.setTextColor(148, 163, 184);
  doc.text(new Date().toLocaleDateString("fr-FR"), pageW - margin, 32, { align: "right" });

  y = 90;
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Projet", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  line();
  doc.text(project ? `${project.code} — ${project.name}` : "—", margin, y);
  line();
  doc.text(`Client : ${project?.client ?? "—"}`, margin, y);
  line();
  doc.text(`Date : ${inspection.date}   ·   Zone : ${inspection.zone}`, margin, y);
  line();
  doc.text(
    `Étape : ${stageLabel[inspection.stage] ?? inspection.stage}   ·   Résultat : ${resultLabel(inspection.result)}   ·   Partagée client : ${inspection.sharedWithClient ? "oui" : "non"}`,
    margin,
    y,
  );

  y += 24;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageW - margin, y);
  y += 18;

  // Checklist
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`Checklist — ${inspection.checklistName}`, margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  inspection.items.forEach((it, idx) => {
    line(18);
    const badge = resultLabel(it.result);
    const color: [number, number, number] =
      it.result === "conforme" ? [16, 128, 96] : it.result === "non_conforme" ? [190, 40, 50] : [100, 116, 139];
    doc.setTextColor(15, 23, 42);
    const wrap = doc.splitTextToSize(`${idx + 1}. ${it.label}`, pageW - margin * 2 - 90);
    doc.text(wrap, margin, y);
    doc.setTextColor(...color);
    doc.setFont("helvetica", "bold");
    doc.text(badge, pageW - margin, y, { align: "right" });
    doc.setFont("helvetica", "normal");
    if (wrap.length > 1) y += (wrap.length - 1) * 12;
    if (it.comment) {
      line(12);
      doc.setTextColor(100, 116, 139);
      const c = doc.splitTextToSize(`↳ ${it.comment}`, pageW - margin * 2 - 20);
      doc.text(c, margin + 12, y);
      if (c.length > 1) y += (c.length - 1) * 12;
    }
  });

  // NC section
  if (inspection.result === "non_conforme") {
    y += 20;
    if (y > pageH - 120) {
      doc.addPage();
      y = margin;
    }
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(252, 165, 165);
    doc.roundedRect(margin, y, pageW - margin * 2, 90, 6, 6, "FD");
    doc.setTextColor(153, 27, 27);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Non-conformité", margin + 12, y + 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60, 20, 20);
    const desc = doc.splitTextToSize(`Description : ${inspection.ncDescription ?? "—"}`, pageW - margin * 2 - 24);
    doc.text(desc, margin + 12, y + 36);
    const plan = doc.splitTextToSize(`Plan d'action : ${inspection.ncActionPlan ?? "—"}`, pageW - margin * 2 - 24);
    doc.text(plan, margin + 12, y + 36 + desc.length * 12 + 4);
    doc.text(
      `Statut : ${inspection.ncStatus === "ferme" ? "Fermée le " + (inspection.ncClosedDate ?? "") : "Ouverte"}`,
      margin + 12,
      y + 82,
    );
    y += 100;
  }

  // Attachments
  if (inspection.attachments.length > 0) {
    y += 10;
    if (y > pageH - 180) {
      doc.addPage();
      y = margin;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text("Preuves photographiques", margin, y);
    y += 12;

    const imgs = inspection.attachments.filter((a) => a.type.startsWith("image/"));
    const cellW = (pageW - margin * 2 - 20) / 2;
    const cellH = 130;
    let col = 0;

    for (const a of imgs) {
      const meta = await toDataUrl(a.dataUrl);
      if (!meta) continue;
      if (col === 0 && y + cellH > pageH - margin) {
        doc.addPage();
        y = margin;
      }
      const x = margin + col * (cellW + 20);
      const ratio = Math.min(cellW / meta.w, cellH / meta.h);
      const dw = meta.w * ratio;
      const dh = meta.h * ratio;
      try {
        doc.addImage(meta.dataUrl, "JPEG", x, y + 6, dw, dh);
      } catch {
        try {
          doc.addImage(meta.dataUrl, "PNG", x, y + 6, dw, dh);
        } catch {
          /* skip */
        }
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(a.name, x, y + cellH + 18);
      col++;
      if (col === 2) {
        col = 0;
        y += cellH + 30;
      }
    }
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`QC · BTP — ${inspection.number}`, margin, pageH - 20);
    doc.text(`${i} / ${pageCount}`, pageW - margin, pageH - 20, { align: "right" });
  }

  doc.save(`Inspection_${inspection.number}_${project?.code ?? ""}.pdf`);
}
