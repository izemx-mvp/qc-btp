import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Trash2, MessageCircle, FolderOpen, Cloud, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/parametres")({
  component: Parametres,
});

interface Member { id: string; name: string; email: string; role: "admin" | "controleur" | "lecteur"; }

const initialMembers: Member[] = [
  { id: "u1", name: "Leila K.", email: "leila@qcbtp.ma", role: "admin" },
  { id: "u2", name: "Youssef B.", email: "youssef@qcbtp.ma", role: "controleur" },
  { id: "u3", name: "Sara M.", email: "sara@partenaires.ma", role: "lecteur" },
];

const integrations = [
  { key: "wa", name: "WhatsApp Business", desc: "Import automatique des photos et messages terrain.", icon: MessageCircle, color: "text-emerald-600 bg-emerald-50" },
  { key: "gd", name: "Google Drive", desc: "Classement automatique des rapports dans les dossiers projet.", icon: FolderOpen, color: "text-blue-600 bg-blue-50" },
  { key: "sp", name: "SharePoint", desc: "Synchronisation avec les espaces documentaires client.", icon: Cloud, color: "text-sky-600 bg-sky-50" },
];

function Parametres() {
  const { resetSeed } = useStore();
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [orgName, setOrgName] = useState("QC BTP — Leila K.");
  const [notif, setNotif] = useState("email");

  const invite = () => {
    const id = "u" + (members.length + 1);
    setMembers([...members, { id, name: "Nouveau membre", email: "nouveau@qcbtp.ma", role: "controleur" }]);
    toast.success("Invitation envoyée (démo)");
  };
  const remove = (id: string) => {
    setMembers(members.filter((m) => m.id !== id));
    toast.success("Membre retiré");
  };
  const updateRole = (id: string, role: Member["role"]) => {
    setMembers(members.map((m) => (m.id === id ? { ...m, role } : m)));
  };

  return (
    <div>
      <PageHeader
        title="Paramètres"
        description="Organisation, équipe et intégrations."
        action={
          <Button variant="outline" onClick={() => { resetSeed(); toast.success("Données de démo restaurées"); }}>
            <RefreshCw className="mr-2 h-4 w-4" /> Réinitialiser la démo
          </Button>
        }
      />

      <div className="p-4 md:p-8 space-y-6 max-w-4xl">
        {/* Organisation */}
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold mb-4">Organisation</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Nom de l'organisation</Label>
              <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Notifications</Label>
              <Select value={notif} onValueChange={setNotif}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email uniquement</SelectItem>
                  <SelectItem value="wa">Email + WhatsApp</SelectItem>
                  <SelectItem value="none">Aucune</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Équipe</h2>
            <Button size="sm" onClick={invite}>
              <UserPlus className="mr-2 h-4 w-4" /> Inviter un membre
            </Button>
          </div>
          <div className="divide-y divide-border">
            {members.map((m) => (
              <div key={m.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 py-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                  {m.name.split(" ").map((s) => s[0]).join("").slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{m.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{m.email}</div>
                </div>
                <Select value={m.role} onValueChange={(v) => updateRole(m.id, v as Member["role"])}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrateur</SelectItem>
                    <SelectItem value="controleur">Contrôleur</SelectItem>
                    <SelectItem value="lecteur">Lecteur</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="sm" onClick={() => remove(m.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* Integrations */}
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold mb-1">Intégrations</h2>
          <p className="text-xs text-muted-foreground mb-4">Connectez vos outils du quotidien. Ces intégrations arrivent dans la prochaine phase.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {integrations.map((i) => (
              <div key={i.key} className="rounded-lg border border-border p-4 flex items-start gap-3">
                <span className={`grid h-10 w-10 place-items-center rounded-lg ${i.color}`}>
                  <i.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{i.name}</span>
                    <span className="text-[10px] uppercase tracking-wide rounded-full bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5">
                      Bientôt
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{i.desc}</p>
                  <Button variant="outline" size="sm" disabled className="mt-3">Connecter</Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex justify-end">
          <Button onClick={() => toast.success("Paramètres enregistrés")}>Enregistrer les modifications</Button>
        </div>
      </div>
    </div>
  );
}
