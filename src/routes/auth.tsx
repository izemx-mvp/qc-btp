import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HardHat } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
});

function AuthPage() {
  const { auth, login, hydrated } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (hydrated && auth) navigate({ to: "/dashboard" });
  }, [auth, hydrated, navigate]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    login(email, password);
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background">
      <div className="hidden md:flex flex-col justify-between bg-primary text-primary-foreground p-10">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-primary-foreground/15">
            <HardHat className="h-5 w-5" />
          </div>
          <span className="font-semibold">QC BTP</span>
        </div>
        <div className="max-w-md space-y-4">
          <h1 className="text-3xl font-semibold leading-tight">Le contrôle qualité de vos chantiers, centralisé.</h1>
          <p className="text-primary-foreground/80 text-sm">
            Inspections, checklists, non-conformités et classement documentaire — tout au même endroit, sur le terrain
            comme au bureau.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/60">MVP démo — données stockées localement dans le navigateur.</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5">
          <div className="md:hidden flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
              <HardHat className="h-5 w-5" />
            </div>
            <span className="font-semibold">QC BTP</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold">Connexion</h2>
            <p className="text-sm text-muted-foreground mt-1">Accédez à votre backoffice.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="vous@exemple.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Se connecter
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Démo : n'importe quel email/mot de passe fonctionne.
          </p>
        </form>
      </div>
    </div>
  );
}
