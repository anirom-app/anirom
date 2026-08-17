"use client";

import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import logoImg from "@/assets/images/anirom-logo.png";
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
  ListSortDescending,
  Puzzle
} from "lucide-react";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useNotifications } from "@/hooks/useNotifications";
import { UserProfileModal } from "@/components/UserProfileModal";
import { cn } from "@/utils";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

export function Navbar() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuthStore();
  const { unreadCount, notifications } = useNotifications();
  const [imageError, setImageError] = useState(false);

  const navItems = [
    { icon: Home, label: "Início", to: "/" },
    { icon: Bookmark, label: "Salvos", to: "/salvos" },
    { icon: ListSortDescending, label: "Categorias", to: "/explore" },
    { icon: Zap, label: "Trending", to: "/trending" },
    { icon: Bell, label: "Notifications", to: "/notifications" },
  ];

  return (
    <>
      {/* Top Search Bar */}
      <div className="fixed top-4 right-4 md:top-6 md:right-8 z-[60]">
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const q = formData.get('q');
          if (q) navigate({ to: '/search', search: { q: q as string } });
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
        <Link to="/" className="hidden md:flex items-center justify-center w-16 h-16 rounded-full hover:scale-105 transition-transform shadow-lg">
          <img src={logoImg} alt="logo anirom" className="w-full h-full" />
        </Link>

        {/* Main Nav Items */}
        <div className="flex flex-row md:flex-col gap-2 md:gap-6 flex-1 md:mt-4 items-center justify-center">
          {navItems.map((item, idx) => {
            const isActive = pathname === item.href;
            
            const linkContent = (
              <Link 
                key={idx} 
                to={item.to}
                className={cn(
                  "p-3 rounded-xl transition-all group relative flex items-center justify-center",
                  isActive ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
                title={item.label}
              >
                <div className="relative">
                  <item.icon className="w-5 h-5 md:w-6 md:h-6" strokeWidth={isActive ? 2.5 : 2} />
                  {item.to === '/notifications' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-primary border-2 border-[#0a0a0a]"></span>
                    </span>
                  )}
                </div>
                
                {/* Tooltip on hover (only if it's not the hover card trigger) */}
                {item.to !== '/notifications' && (
                  <span className="absolute left-14 bg-popover text-popover-foreground text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 hidden md:block">
                    {item.label}
                  </span>
                )}
              </Link>
            );

            if (item.to === '/notifications') {
              const unreadNotifications = notifications.filter((n) => !n.read).slice(0, 5);
              
              return (
                <HoverCard key={idx} openDelay={100} closeDelay={150}>
                  <HoverCardTrigger asChild>
                    {linkContent}
                  </HoverCardTrigger>
                  <HoverCardContent 
                    side="right" 
                    sideOffset={15} 
                    className="w-80 bg-[#0a0a0a] border-white/10 p-0 shadow-2xl ml-4 hidden md:block z-[100]"
                  >
                    <div className="p-4 border-b border-white/5">
                      <h4 className="font-semibold text-white">Notificações</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {unreadCount > 0 ? `Você tem ${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Nenhuma novidade agora.'}
                      </p>
                    </div>
                    
                    <div className="flex flex-col">
                      {unreadNotifications.length > 0 ? (
                        unreadNotifications.map((n) => (
                          <Link 
                            key={n.id} 
                            to={n.referenceId ? `/animes/${n.referenceId}` : '/notifications'} 
                            className="p-3 hover:bg-white/5 border-b border-white/5 transition-colors flex flex-col gap-1 last:border-0 cursor-pointer"
                          >
                            <span className="text-sm font-medium text-white line-clamp-1">{n.title}</span>
                            <span className="text-xs text-muted-foreground line-clamp-2">{n.message}</span>
                          </Link>
                        ))
                      ) : (
                        <div className="p-6 text-center text-sm text-muted-foreground">
                          Tudo limpo por aqui!
                        </div>
                      )}
                    </div>
                    
                    <Link 
                      to="/notifications" 
                      className="block w-full text-center text-xs text-primary font-medium p-3 bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      Ver todas as notificações
                    </Link>
                  </HoverCardContent>
                </HoverCard>
              );
            }

            return linkContent;
          })}
        </div>

        {/* Bottom Actions (Settings & Profile) */}
        <div className="flex flex-row md:flex-col gap-2 md:gap-6 md:mb-4 items-center pr-2 md:pr-0">
          <Link 
            to="/settings"
            className={cn(
              "p-3 rounded-xl transition-all text-muted-foreground hover:text-white hover:bg-white/5 group relative",
              pathname === "/settings" && "bg-white/10 text-white"
            )}
          >
            <Puzzle className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2} />
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
