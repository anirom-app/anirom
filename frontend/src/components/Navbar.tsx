"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { 
  Home, 
  BarChart2, 
  User as UserIcon, 
  Calendar, 
  Zap, 
  Bell, 
  Settings,
  Search,
  Bookmark,
  ListSortDescending
} from "lucide-react";
import { useAuthStore } from "@/hooks/useAuthStore";
import { UserProfileModal } from "@/components/UserProfileModal";
import { cn } from "@/utils";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [imageError, setImageError] = useState(false);

  const navItems = [
    { icon: Home, label: "Início", href: "/" },
    { icon:Bookmark, label: "Salvos", href: "/Salvos" },
    { icon: ListSortDescending, label: "Categorias", href: "/schedule" },
    { icon: Zap, label: "Trending", href: "/trending" },
    { icon: Bell, label: "Notifications", href: "/notifications" },
  ];

  return (
    <>
      {/* Top Search Bar */}
      <div className="fixed top-4 right-4 md:top-6 md:right-8 z-[60]">
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const q = formData.get('q');
          if (q) router.push(`/search?q=${encodeURIComponent(q as string)}`);
        }} className="flex items-center bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 hover:border-primary/50 transition-colors rounded-full px-4 py-2 shadow-lg">
          <Search className="w-4 h-4 text-muted-foreground mr-2" />
          <input 
            name="q"
            type="text" 
            placeholder="Buscar animes..." 
            className="bg-transparent border-none outline-none text-white placeholder:text-muted-foreground text-sm w-48 md:w-64" 
            autoComplete="off"
          />
        </form>
      </div>

      <nav className="fixed bottom-0 left-0 w-full md:w-20 h-16 md:h-screen md:top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-t md:border-t-0 md:border-r border-border/10 flex flex-row md:flex-col items-center justify-around md:justify-start py-0 md:py-6 gap-0 md:gap-8">
        
        {/* Logo (Hidden on Mobile) */}
        <Link href="/" className="hidden md:flex items-center justify-center w-16 h-16 rounded-full hover:scale-105 transition-transform shadow-lg">
          <img src="/images/anirom-logo.png" alt="logo anirom" className="w-full h-full" />
        </Link>

        {/* Main Nav Items */}
        <div className="flex flex-row md:flex-col gap-2 md:gap-6 flex-1 md:mt-4 items-center justify-center">
          {navItems.map((item, idx) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={idx} 
                href={item.href}
                className={cn(
                  "p-3 rounded-xl transition-all group relative flex items-center justify-center",
                  isActive ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
                title={item.label}
              >
                <item.icon className="w-5 h-5 md:w-6 md:h-6" strokeWidth={isActive ? 2.5 : 2} />
                
                {/* Tooltip on hover */}
                <span className="absolute left-14 bg-popover text-popover-foreground text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Bottom Actions (Settings & Profile) */}
        <div className="flex flex-row md:flex-col gap-2 md:gap-6 md:mb-4 items-center pr-2 md:pr-0">
          <Link 
            href="/settings"
            className={cn(
              "p-3 rounded-xl transition-all text-muted-foreground hover:text-white hover:bg-white/5 group relative",
              pathname === "/settings" && "bg-white/10 text-white"
            )}
          >
            <Settings className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2} />
            <span className="absolute left-14 bg-popover text-popover-foreground text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Settings
            </span>
          </Link>

          {user && (
            <UserProfileModal>
              <button className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border-2 border-transparent hover:border-primary transition-all cursor-pointer shadow-lg hover:shadow-primary/20">
                {!imageError && user.photoUrl ? (
                  <img 
                    src={user.photoUrl} 
                    alt={user.nickname} 
                    className="w-full h-full object-cover" 
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <UserIcon className="h-5 w-5 text-primary" />
                )}
              </button>
            </UserProfileModal>
          )}
        </div>
      </nav>
    </>
  );
}
