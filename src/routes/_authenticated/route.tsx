import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppLayout } from "@/components/app-layout";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/_authenticated")({
  component: AuthedLayout,
});

function AuthedLayout() {
  const { auth, hydrated } = useStore();
  const navigate = useNavigate();
  useEffect(() => {
    if (hydrated && !auth) navigate({ to: "/auth", replace: true });
  }, [auth, hydrated, navigate]);
  if (!hydrated || !auth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Chargement…</div>
      </div>
    );
  }
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

