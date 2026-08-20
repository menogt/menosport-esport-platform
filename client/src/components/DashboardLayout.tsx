import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/useMobile";
import {
  Brackets,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Swords,
  Users,
  UserRound,
  Shield,
  ChartNoAxesCombined,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/dashboard/player" },
  { icon: Users, label: "Team operations", path: "/dashboard/team" },
  { icon: Shield, label: "Clan desk", path: "/dashboard/clan" },
  { icon: Brackets, label: "Live brackets", path: "/brackets/102" },
  { icon: Swords, label: "Match room", path: "/matches/301" },
  { icon: UserRound, label: "Player profile", path: "/profile" },
  { icon: ChartNoAxesCombined, label: "Circuit intel", path: "/dashboard/admin" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 272;
const MIN_WIDTH = 220;
const MAX_WIDTH = 420;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) {
    return (
      <div className="min-h-screen bg-[#070907] text-white flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-lime-950/20">
          <div className="mb-8 flex items-center gap-3 text-lime-300">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-lime-300 text-[#080b08] font-black">M</span>
            <span className="font-black tracking-[0.2em] text-xs">MENO ARENA / AUTH</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Your competitive command center.</h1>
          <p className="mt-3 text-sm leading-6 text-white/55">Sign in to manage your roster, review match windows, and move through the live circuit.</p>
          <Button onClick={() => { window.location.href = "/login"; }} className="mt-8 h-12 w-full rounded-xl bg-lime-300 text-black hover:bg-lime-200">Continue with Supabase</Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = { children: React.ReactNode; setSidebarWidth: (width: number) => void };

function DashboardLayoutContent({ children, setSidebarWidth }: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => location === item.path || location.startsWith(item.path.split("/").slice(0, 3).join("/")));
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const move = (event: MouseEvent) => {
      if (!isResizing) return;
      const left = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const next = event.clientX - left;
      if (next >= MIN_WIDTH && next <= MAX_WIDTH) setSidebarWidth(next);
    };
    const up = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", up);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r border-white/[0.07] bg-[#090c09]" disableTransition={isResizing}>
          <SidebarHeader className="h-[4.5rem] justify-center border-b border-white/[0.07]">
            <div className="flex items-center gap-3 px-2">
              <button onClick={toggleSidebar} aria-label="Toggle navigation" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-lime-300 text-[#080b08] shadow-[0_0_24px_rgba(190,242,100,0.18)]">
                <PanelLeft className="h-4 w-4" />
              </button>
              {!isCollapsed && <div className="min-w-0"><p className="truncate text-sm font-black tracking-[0.18em] text-white">MENO ARENA</p><p className="mt-0.5 text-[10px] uppercase tracking-[0.22em] text-white/35">Player network</p></div>}
            </div>
          </SidebarHeader>
          <SidebarContent className="gap-0 px-2 py-5">
            <p className="px-3 pb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-white/25 group-data-[collapsible=icon]:hidden">Workspace</p>
            <SidebarMenu>
              {menuItems.map(item => {
                const active = location === item.path || location.startsWith(item.path.replace(/\/\d+$/, ""));
                return <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={active} onClick={() => setLocation(item.path)} tooltip={item.label} className="mb-1 h-11 rounded-xl text-white/55 hover:bg-white/[0.06] hover:text-white data-[active=true]:bg-lime-300 data-[active=true]:text-black data-[active=true]:shadow-[0_8px_24px_rgba(190,242,100,0.12)]"><item.icon className="h-4 w-4" /><span>{item.label}</span>{!isCollapsed && active && <ChevronRight className="ml-auto h-3.5 w-3.5" />}</SidebarMenuButton></SidebarMenuItem>;
              })}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="border-t border-white/[0.07] p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild><button className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-300"><Avatar className="h-9 w-9 border border-lime-300/30 bg-lime-300/10"><AvatarFallback className="bg-transparent text-xs font-bold text-lime-200">{user?.name?.charAt(0).toUpperCase() ?? "M"}</AvatarFallback></Avatar><div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"><p className="truncate text-sm font-semibold text-white">{user?.name || "Arena player"}</p><p className="mt-1 truncate text-[11px] text-white/35">{user?.email || "Signed in"}</p></div></button></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 border-white/10 bg-[#101510] text-white"><DropdownMenuItem onClick={logout} className="cursor-pointer text-red-300 focus:bg-red-400/10 focus:text-red-200"><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem></DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div className={`absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-lime-300/20 ${isCollapsed ? "hidden" : ""}`} onMouseDown={() => setIsResizing(true)} />
      </div>
      <SidebarInset className="bg-[#070907]">
        {isMobile && <div className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-white/[0.07] bg-[#090c09]/90 px-3 backdrop-blur"><SidebarTrigger className="h-9 w-9 rounded-lg text-white" /><span className="text-sm font-semibold text-white">{activeMenuItem?.label ?? "Arena"}</span></div>}
        <main className="min-h-screen">{children}</main>
      </SidebarInset>
    </>
  );
}
