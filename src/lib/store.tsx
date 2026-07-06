import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Attachment, ChecklistTemplate, Inspection, Project } from "./types";

interface AuthUser {
  email: string;
  name: string;
}

interface Data {
  projects: Project[];
  checklists: ChecklistTemplate[];
  inspections: Inspection[];
}

interface StoreCtx {
  auth: AuthUser | null;
  login: (email: string, password: string, name?: string) => void;
  logout: () => void;
  data: Data;
  setProjects: (p: Project[]) => void;
  setChecklists: (c: ChecklistTemplate[]) => void;
  setInspections: (i: Inspection[]) => void;
  resetSeed: () => void;
  hydrated: boolean;
}

const KEY_AUTH = "qcbtp.auth";
const KEY_DATA = "qcbtp.data.v4";

const seedData = (): Data => {
  const now = new Date().toISOString();
  const projects: Project[] = [
    {
      id: "p1",
      code: "SNG",
      name: "SNG — Résidence Al Andalous",
      client: "Groupe Béton SA",
      startDate: "2026-03-01",
      status: "actif",
      whatsappGroup: "SNG - Contrôle Qualité",
      clientPlatform: "gdrive",
      clientFolderPath: "/Clients/Groupe Béton SA/SNG",
      controlPlan: {
        name: "Plan de contrôle SNG",
        ref: "PC-SNG-001",
        controlTypes: ["Ferraillage", "Coffrage", "Bétonnage", "Réception matériel"],
      },
    },
    {
      id: "p2",
      code: "RSFP",
      name: "RSFP — Extension Zone Industrielle Tanger",
      client: "Tanger Med Utilities",
      startDate: "2026-04-15",
      status: "actif",
      whatsappGroup: "RSFP Suivi Chantier",
      clientPlatform: "sharepoint",
      clientFolderPath: "Sites/Tanger Med Utilities/Documents/Qualité/RSFP",
      controlPlan: {
        name: "Plan de contrôle RSFP",
        ref: "PC-RSFP-01",
        controlTypes: ["Ferraillage", "Bétonnage", "Réception matériel"],
      },
    },
    {
      id: "p3",
      code: "OCP",
      name: "OCP — Silo Jorf Lasfar",
      client: "OCP Group",
      startDate: "2026-02-10",
      status: "actif",
      whatsappGroup: "OCP Jorf QC",
      clientPlatform: "sharepoint",
      clientFolderPath: "Sites/OCP-QC/Documents/Silo Jorf",
      controlPlan: {
        name: "Plan de contrôle OCP Jorf",
        ref: "PC-OCP-JL",
        controlTypes: ["Ferraillage", "Coffrage", "Bétonnage"],
      },
    },
    {
      id: "p4",
      code: "ONCF",
      name: "ONCF — Viaduc Kénitra",
      client: "ONCF",
      startDate: "2025-11-20",
      status: "en_pause",
      whatsappGroup: "ONCF Viaduc",
      clientPlatform: "gdrive",
      clientFolderPath: "/Clients/ONCF/Viaduc Kénitra",
      controlPlan: {
        name: "Plan de contrôle ONCF",
        ref: "PC-ONCF-K",
        controlTypes: ["Ferraillage", "Bétonnage"],
      },
    },
  ];

  const checklists: ChecklistTemplate[] = [
    {
      id: "c1",
      name: "Checklist Ferraillage standard",
      controlType: "Ferraillage",
      items: [
        { id: "i1", label: "Diamètre des aciers conforme au plan", expected: "conforme" },
        { id: "i2", label: "Espacement des cadres", expected: "conforme" },
        { id: "i3", label: "Enrobage minimal respecté", expected: "conforme" },
        { id: "i4", label: "Recouvrements suffisants", expected: "conforme" },
        { id: "i5", label: "Propreté des armatures", expected: "conforme" },
        { id: "i6", label: "Calage et positionnement", expected: "conforme" },
      ],
    },
    {
      id: "c2",
      name: "Checklist Bétonnage standard",
      controlType: "Bétonnage",
      items: [
        { id: "i1", label: "Bon de livraison conforme", expected: "conforme" },
        { id: "i2", label: "Slump / affaissement mesuré", expected: "conforme" },
        { id: "i3", label: "Éprouvettes prélevées (3 min.)", expected: "conforme" },
        { id: "i4", label: "Vibration correcte", expected: "conforme" },
        { id: "i5", label: "Cure du béton mise en place", expected: "conforme" },
      ],
    },
    {
      id: "c3",
      name: "Checklist Coffrage standard",
      controlType: "Coffrage",
      items: [
        { id: "i1", label: "Étanchéité des joints", expected: "conforme" },
        { id: "i2", label: "Stabilité et étaiement", expected: "conforme" },
        { id: "i3", label: "Dimensions conformes au plan", expected: "conforme" },
        { id: "i4", label: "Nettoyage intérieur du coffrage", expected: "conforme" },
        { id: "i5", label: "Huile de démoulage appliquée", expected: "conforme" },
      ],
    },
    {
      id: "c4",
      name: "Checklist Réception matériel",
      controlType: "Réception matériel",
      items: [
        { id: "i1", label: "Bon de livraison conforme à la commande", expected: "conforme" },
        { id: "i2", label: "Certificats matière fournis", expected: "conforme" },
        { id: "i3", label: "État visuel du matériel", expected: "conforme" },
        { id: "i4", label: "Quantités livrées vérifiées", expected: "conforme" },
        { id: "i5", label: "Stockage adapté", expected: "conforme" },
      ],
    },
  ];

  const zones = {
    p1: ["Niveau R+2 – Poteau P12", "Dalle R+1", "Voile V3 – RDC", "Semelle S07", "Poutre PT4 – R+3"],
    p2: ["Radier zone A", "Longrine L2", "Poteau P05 – Hall B", "Dalle mezzanine"],
    p3: ["Silo n°2 – Ceinture inf.", "Radier silo n°1", "Cône silo n°3"],
    p4: ["Pile P4", "Chevêtre C2", "Semelle P3"],
  };

  const mockPics = (variant: "ok" | "nc_open" | "nc_closed" | "draft", seed: number): Attachment[] => {
    if (variant === "draft") return [];
    const count = variant === "ok" ? 2 : 3;
    return Array.from({ length: count }).map((_, k) => ({
      id: `att-${seed}-${k}`,
      name:
        variant === "nc_open" && k === 0
          ? `NC_${seed}_defaut.jpg`
          : variant === "nc_closed" && k === 2
            ? `${seed}_reprise_apres.jpg`
            : `${seed}_zone_${k + 1}.jpg`,
      type: "image/jpeg",
      dataUrl: `https://picsum.photos/seed/qcbtp-${seed}-${k}/640/420`,
    }));
  };

  const mk = (
    n: number,
    projectId: keyof typeof zones,
    controlType: string,
    checklistId: string,
    date: string,
    zoneIdx: number,
    variant: "ok" | "nc_open" | "nc_closed" | "draft",
  ): Inspection => {
    const cl = checklists.find((c) => c.id === checklistId)!;
    const zone = zones[projectId][zoneIdx % zones[projectId].length];
    const number = "INS-" + String(n).padStart(6, "0");
    const base = {
      id: "insp" + n,
      number,
      projectId,
      controlType,
      checklistTemplateId: cl.id,
      checklistName: cl.name,
      date,
      zone,
      attachments: mockPics(variant, n),
      createdAt: now,
    };
    if (variant === "draft") {
      return {
        ...base,
        result: "",
        items: cl.items.map((it) => ({ itemId: it.id, label: it.label, result: "", comment: "" })),
        stage: "brouillon",
        sharedWithClient: false,
      };
    }
    if (variant === "ok") {
      return {
        ...base,
        result: "conforme",
        items: cl.items.map((it) => ({ itemId: it.id, label: it.label, result: "conforme", comment: "" })),
        stage: n % 2 === 0 ? "classe" : "signe",
        sharedWithClient: n % 3 === 0,
      };
    }
    // NC
    const items = cl.items.map((it, idx) => ({
      itemId: it.id,
      label: it.label,
      result: idx === 1 ? ("non_conforme" as const) : ("conforme" as const),
      comment: idx === 1 ? "Écart constaté sur zone contrôlée" : "",
    }));
    return {
      ...base,
      result: "non_conforme",
      items,
      ncDescription: `Non-conformité sur "${cl.items[1].label.toLowerCase()}"`,
      ncActionPlan: "Reprise avant l'étape suivante, contrôle par chef de chantier",
      ncStatus: variant === "nc_open" ? "ouvert" : "ferme",
      ncClosedDate: variant === "nc_closed" ? "2026-06-28" : undefined,
      stage: variant === "nc_closed" ? "classe" : "rempli",
      sharedWithClient: variant === "nc_closed",
    };
  };

  const inspections: Inspection[] = [
    mk(1, "p1", "Ferraillage", "c1", "2026-04-12", 0, "ok"),
    mk(2, "p1", "Coffrage", "c3", "2026-04-18", 2, "nc_closed"),
    mk(3, "p1", "Bétonnage", "c2", "2026-04-24", 1, "ok"),
    mk(4, "p1", "Ferraillage", "c1", "2026-05-06", 3, "nc_open"),
    mk(5, "p1", "Bétonnage", "c2", "2026-05-14", 1, "ok"),
    mk(6, "p1", "Ferraillage", "c1", "2026-05-28", 4, "ok"),
    mk(7, "p1", "Coffrage", "c3", "2026-06-11", 2, "nc_open"),
    mk(8, "p1", "Bétonnage", "c2", "2026-06-22", 0, "draft"),

    mk(9, "p2", "Ferraillage", "c1", "2026-04-30", 0, "ok"),
    mk(10, "p2", "Bétonnage", "c2", "2026-05-10", 0, "nc_closed"),
    mk(11, "p2", "Réception matériel", "c4", "2026-05-22", 2, "ok"),
    mk(12, "p2", "Ferraillage", "c1", "2026-06-05", 1, "nc_open"),
    mk(13, "p2", "Bétonnage", "c2", "2026-06-19", 3, "draft"),

    mk(14, "p3", "Ferraillage", "c1", "2026-05-03", 0, "ok"),
    mk(15, "p3", "Coffrage", "c3", "2026-05-17", 1, "ok"),
    mk(16, "p3", "Bétonnage", "c2", "2026-06-02", 0, "nc_open"),
    mk(17, "p3", "Ferraillage", "c1", "2026-06-20", 2, "ok"),

    mk(18, "p4", "Ferraillage", "c1", "2026-04-08", 0, "ok"),
    mk(19, "p4", "Bétonnage", "c2", "2026-04-22", 1, "nc_closed"),
  ];

  return { projects, checklists, inspections };
};

const Ctx = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthUser | null>(null);
  const [data, setData] = useState<Data>({ projects: [], checklists: [], inspections: [] });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const a = localStorage.getItem(KEY_AUTH);
      if (a) setAuth(JSON.parse(a));
      const d = localStorage.getItem(KEY_DATA);
      if (d) setData(JSON.parse(d));
      else {
        const seed = seedData();
        setData(seed);
        localStorage.setItem(KEY_DATA, JSON.stringify(seed));
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY_DATA, JSON.stringify(data));
  }, [data, hydrated]);

  const login = (email: string, _password: string, name?: string) => {
    const user = { email, name: name || email.split("@")[0] };
    setAuth(user);
    localStorage.setItem(KEY_AUTH, JSON.stringify(user));
  };
  const logout = () => {
    setAuth(null);
    localStorage.removeItem(KEY_AUTH);
  };
  const resetSeed = () => {
    const seed = seedData();
    setData(seed);
    localStorage.setItem(KEY_DATA, JSON.stringify(seed));
  };

  return (
    <Ctx.Provider
      value={{
        auth,
        login,
        logout,
        data,
        hydrated,
        resetSeed,
        setProjects: (p) => setData((d) => ({ ...d, projects: p })),
        setChecklists: (c) => setData((d) => ({ ...d, checklists: c })),
        setInspections: (i) => setData((d) => ({ ...d, inspections: i })),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore must be used inside StoreProvider");
  return c;
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function nextInspectionNumber(existing: Inspection[]) {
  const n = existing.length + 1;
  return "INS-" + String(n).padStart(6, "0");
}
