import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { ChecklistTemplate, Inspection, Project } from "./types";

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
  hydrated: boolean;
}

const KEY_AUTH = "qcbtp.auth";
const KEY_DATA = "qcbtp.data";

const seedData = (): Data => {
  const now = new Date().toISOString();
  const projects: Project[] = [
    {
      id: "p1",
      code: "SNG",
      name: "Chantier SNG - Tour Nord",
      client: "Groupe Béton SA",
      startDate: "2026-03-01",
      status: "actif",
      whatsappGroup: "SNG - Contrôle Qualité",
      controlPlan: {
        name: "Plan de contrôle SNG",
        ref: "PC-SNG-001",
        controlTypes: ["Ferraillage", "Coffrage", "Bétonnage", "Réception matériel"],
      },
    },
    {
      id: "p2",
      code: "RSFP",
      name: "Résidence RSFP",
      client: "Immobilière du Sud",
      startDate: "2026-05-15",
      status: "actif",
      whatsappGroup: "RSFP Suivi Chantier",
      controlPlan: {
        name: "Plan de contrôle RSFP",
        ref: "PC-RSFP-01",
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
      ],
    },
    {
      id: "c2",
      name: "Checklist Bétonnage standard",
      controlType: "Bétonnage",
      items: [
        { id: "i1", label: "Bon de livraison conforme", expected: "conforme" },
        { id: "i2", label: "Slump / affaissement mesuré", expected: "conforme" },
        { id: "i3", label: "Éprouvettes prélevées", expected: "conforme" },
        { id: "i4", label: "Vibration correcte", expected: "conforme" },
      ],
    },
  ];
  const inspections: Inspection[] = [
    {
      id: "insp1",
      number: "INS-000001",
      projectId: "p1",
      controlType: "Ferraillage",
      checklistTemplateId: "c1",
      checklistName: "Checklist Ferraillage standard",
      date: "2026-06-20",
      zone: "Niveau R+2 - Poteau P12",
      result: "non_conforme",
      items: [
        { itemId: "i1", label: "Diamètre des aciers conforme au plan", result: "conforme", comment: "" },
        { itemId: "i2", label: "Espacement des cadres", result: "non_conforme", comment: "Espacement > 20cm par endroits" },
        { itemId: "i3", label: "Enrobage minimal respecté", result: "conforme", comment: "" },
        { itemId: "i4", label: "Recouvrements suffisants", result: "conforme", comment: "" },
        { itemId: "i5", label: "Propreté des armatures", result: "conforme", comment: "" },
      ],
      ncDescription: "Espacement des cadres non conforme sur la zone haute du poteau",
      ncActionPlan: "Reprise du ferraillage avant coulage - vérification par le chef de chantier",
      ncStatus: "ouvert",
      attachments: [],
      stage: "rempli",
      sharedWithClient: false,
      createdAt: now,
    },
    {
      id: "insp2",
      number: "INS-000002",
      projectId: "p1",
      controlType: "Bétonnage",
      checklistTemplateId: "c2",
      checklistName: "Checklist Bétonnage standard",
      date: "2026-06-25",
      zone: "Dalle R+1",
      result: "conforme",
      items: [
        { itemId: "i1", label: "Bon de livraison conforme", result: "conforme", comment: "" },
        { itemId: "i2", label: "Slump / affaissement mesuré", result: "conforme", comment: "12 cm" },
        { itemId: "i3", label: "Éprouvettes prélevées", result: "conforme", comment: "3 éprouvettes" },
        { itemId: "i4", label: "Vibration correcte", result: "conforme", comment: "" },
      ],
      attachments: [],
      stage: "classe",
      sharedWithClient: true,
      createdAt: now,
    },
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

  return (
    <Ctx.Provider
      value={{
        auth,
        login,
        logout,
        data,
        hydrated,
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
