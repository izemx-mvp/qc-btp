import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, FolderKanban, ClipboardList, ClipboardCheck, Archive, HardHat, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";


const nav = [
  { to: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/projets", label: "Projets", icon: FolderKanban },
  { to: "/checklists", label: "Checklists", icon: ClipboardList },
  { to: "/inspections", label: "Inspections", icon: ClipboardCheck },
  { to: "/classement", label: "Classement", icon: Archive },
] as const;

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const Sidebar = (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-sidebar">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-sidebar-border">
        <div className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
          <HardHat className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-sidebar-foreground truncate">QC BTP</div>
          <div className="text-xs text-muted-foreground truncate">Contrôle Qualité</div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map((n) => {
          const active = pathname === n.to || (n.to !== "/" && pathname.startsWith(n.to));
          return (
            <Link
              key={n.to}
              to={n.to}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <n.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{n.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>

  );

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden md:flex">{Sidebar}</div>
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0">{Sidebar}</div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 md:hidden">
          <button className="p-1" onClick={() => setOpen(true)} aria-label="Ouvrir le menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="text-sm font-semibold">QC BTP</div>
        </header>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-border bg-card px-4 py-5 md:px-8">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold text-foreground md:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
