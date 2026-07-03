import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { AppLayout } from "@/components/app-layout";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthedLayout,
});

function AuthedLayout() {
  const { auth, hydrated } = useStore();
  if (!hydrated) return null;
  if (!auth) return <Navigate to="/auth" />;
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
