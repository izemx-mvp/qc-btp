import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  ssr: false,
  component: Index,
});

function Index() {
  const { auth, hydrated } = useStore();
  if (!hydrated) return null;
  return <Navigate to={auth ? "/dashboard" : "/auth"} />;
}
