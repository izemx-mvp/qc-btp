import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FolderKanban,
  ClipboardList,
  ClipboardCheck,
  Archive,
  Settings,
  LogOut,
  ChevronsUpDown,
  AlertOctagon,
  Menu,
  X,
  HardHat,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useStore } from "@/lib/store";

const nav = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard, group: "Suivi" },
  { to: "/projets", label: "Projets", icon: FolderKanban, group: "Suivi" },
  { to: "/inspections", label: "AI Inspection", icon: ClipboardCheck, group: "Terrain" },
  { to: "/non-conformites", label: "Non-conformités", icon: AlertOctagon, group: "Terrain" },
  { to: "/checklists", label: "Checklists", icon: ClipboardList, group: "Référentiel" },
  { to: "/classement", label: "AI Classement", icon: Archive, group: "Référentiel" },
  { to: "/parametres", label: "Paramètres", icon: Settings, group: "Système" },
] as const;

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const ncOpen = data.inspections.filter((i) => i.ncStatus === "ouvert").length;

  const groups = Array.from(new Set(nav.map((n) => n.group)));

  const Sidebar = (
    <aside className="flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border relative overflow-hidden">
      {/* subtle grid background */}
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
      <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />

      <div className="relative flex items-center gap-2.5 px-5 py-5 border-b border-sidebar-border">
        <div className="relative grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground glow-primary">
          <HardHat className="h-4.5 w-4.5" strokeWidth={2.2} />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold tracking-tight text-foreground">QC · BTP</div>
          <div className="mono text-[10px] uppercase tracking-widest text-muted-foreground">v1.0 · control</div>
        </div>
      </div>

      <nav className="relative flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {groups.map((g) => (
          <div key={g}>
            <div className="mono px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
              {g}
            </div>
            <div className="space-y-0.5">
              {nav.filter((n) => n.group === g).map((n) => {
                const active = pathname === n.to || (n.to !== "/dashboard" && pathname.startsWith(n.to));
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                      active
                        ? "bg-primary/10 text-foreground border border-primary/20"
                        : "text-sidebar-foreground/80 hover:text-foreground hover:bg-white/[0.03] border border-transparent",
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-primary glow-primary" />
                    )}
                    <n.icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                      )}
                      strokeWidth={1.75}
                    />
                    <span className="truncate font-medium">{n.label}</span>
                    {n.to === "/non-conformites" && ncOpen > 0 && (
                      <span className="mono ml-auto rounded-md bg-destructive/15 text-destructive px-1.5 py-0.5 text-[10px] font-bold border border-destructive/30">
                        {ncOpen}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="relative border-t border-sidebar-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full flex items-center gap-2.5 rounded-lg p-2 hover:bg-white/[0.04] transition-colors text-left">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary/40 text-primary-foreground text-xs font-bold">
              LK
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-foreground truncate">Leila K.</div>
              <div className="mono text-[10px] uppercase tracking-wider text-muted-foreground truncate">Contrôleuse QC</div>
            </div>
            <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/parametres"><Settings className="mr-2 h-4 w-4" /> Paramètres</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => toast.info("Déconnexion (démo)")}>
              <LogOut className="mr-2 h-4 w-4" /> Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <div className="hidden md:flex">{Sidebar}</div>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0">{Sidebar}</div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-sidebar/50 backdrop-blur px-4 py-3 md:hidden">
          <button className="p-1" onClick={() => setMobileOpen(true)} aria-label="Ouvrir le menu">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="text-sm font-semibold">QC · BTP</div>
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
  breadcrumb,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  breadcrumb?: ReactNode;
}) {
  return (
    <div className="relative border-b border-border bg-sidebar/40 backdrop-blur px-4 py-5 md:px-8">
      <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0">
          {breadcrumb && (
            <div className="mono mb-1.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {breadcrumb}
            </div>
          )}
          <h1 className="truncate text-xl font-semibold tracking-tight text-foreground md:text-[22px]">
            {title}
          </h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
