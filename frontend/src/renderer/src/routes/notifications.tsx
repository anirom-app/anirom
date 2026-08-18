import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Bell, Info, AlertTriangle, ShieldCheck, Zap, MonitorUp, Trash2, CheckCheck, Archive, ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useNotifications, Notification } from '@/hooks/useNotifications'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { trpc } from '@/main'
import AniromPerson from '@/assets/images/person/anirom-person.png'

export const Route = createFileRoute('/notifications')({
  component: NotificationsPage,
})

function getNotificationIcon(type: Notification['type']) {
  switch (type) {
    case 'LOGIN':
      return <ShieldCheck className="w-5 h-5 text-emerald-400" />
    case 'NEW_EPISODE':
      return <Zap className="w-5 h-5 text-amber-400" />
    case 'NEW_SEASON':
      return <Zap className="w-5 h-5 text-amber-400" />
    case 'APP_UPDATE':
      return <MonitorUp className="w-5 h-5 text-blue-400" />
    case 'SYSTEM':
      return <AlertTriangle className="w-5 h-5 text-red-400" />
    default:
      return <Info className="w-5 h-5 text-zinc-400" />
  }
}

function formatNotificationDate(createdAt: any) {
  if (!createdAt) return '';
  let dateObj: Date;
  if (Array.isArray(createdAt)) {
    const [year, month, day, hour, minute, second] = createdAt;
    dateObj = new Date(year, month - 1, day, hour || 0, minute || 0, second || 0);
  } else {
    dateObj = new Date(createdAt);
  }
  
  if (isNaN(dateObj.getTime())) return '';
  return format(dateObj, "d 'de' MMM, HH:mm", { locale: ptBR });
}

function NotificationItem({ notification, index, onDelete, onMarkAsRead }: { notification: Notification, index: number, onDelete: (id: string) => void, onMarkAsRead: (id: string) => void }) {
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (notification.type === 'NEW_SEASON' && notification.referenceId) {
      const fetchPoster = async () => {
        try {
          const data = await utils.client.getAnimeDetails.query({ animeId: notification.referenceId! });
          if (data && data.poster_path) {
            setPosterUrl(`https://image.tmdb.org/t/p/w500${data.poster_path}`);
          }
        } catch (error) {
          console.error("Failed to fetch poster for notification", error);
        }
      };
      fetchPoster();
    }
  }, [notification]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        if (!notification.read) {
          onMarkAsRead(notification.id);
        }
        if (notification.referenceId) {
          navigate({ to: '/animes/$animeId', params: { animeId: notification.referenceId } });
        }
      }}
      className={`group relative overflow-hidden rounded-2xl p-5 flex gap-5 transition-all duration-300 cursor-pointer 
        ${!notification.read 
          ? 'bg-black/40 backdrop-blur-lg border border-white/10 shadow-lg hover:bg-black/60 hover:border-white/20' 
          : 'bg-black/20 backdrop-blur-md border border-white/5 hover:bg-white/5 hover:border-white/10 hover:-translate-y-0.5 hover:shadow-xl'
        }
      `}
    >
      {!notification.read && (
        <div className="absolute top-0 bottom-0 left-0 w-1 bg-red-600 shadow-[2px_0_10px_rgba(220,38,38,0.3)]" />
      )}

      <div className="shrink-0 mt-0.5">
        {posterUrl ? (
          <div className="w-16 h-20 rounded-xl overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-white/10">
             <img 
               src={`anirom://media/?url=${encodeURIComponent(posterUrl)}`} 
               alt="Capa do Anime" 
               className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
             />
          </div>
        ) : (
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 shadow-inner group-hover:bg-white/10 transition-colors">
            {getNotificationIcon(notification.type)}
          </div>
        )}
      </div>
      
      <div className="flex-1 space-y-2 pt-1">
        <div className="flex items-start justify-between gap-4">
          <h3 className={`text-base tracking-wide transition-colors ${!notification.read ? 'text-white font-semibold' : 'text-zinc-300 font-medium group-hover:text-white'}`}>
            {notification.title}
          </h3>
          <span className="text-xs font-medium text-zinc-500 whitespace-nowrap bg-black/30 px-2.5 py-1 rounded-full border border-white/5">
            {formatNotificationDate(notification.createdAt)}
          </span>
        </div>
        <p className="text-sm text-zinc-400 leading-relaxed max-w-[92%] group-hover:text-zinc-300 transition-colors">
          {notification.message}
        </p>
      </div>
      
      <div className="absolute right-5 top-2/3 -translate-y-1/2 flex items-center  gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
        {!notification.read && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-all shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead(notification.id);
            }}
            title="Marcar como lida"
          >
            <CheckCheck className="w-4 h-4" />
          </Button>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-zinc-400 hover:text-red-400 hover:bg-red-500/20 hover:border-red-500/30 transition-all shadow-lg"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
          title="Excluir notificação"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

export function NotificationsPage() {
  const { notifications, loading, unreadCount, hasMore, loadMore, markAllAsRead, markAsRead, deleteNotification } = useNotifications()
  const [showArchived, setShowArchived] = useState(false);
  const [showAllUnread, setShowAllUnread] = useState(false);
  const [showAllRead, setShowAllRead] = useState(false);
  
  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);
  
  const displayedUnread = showAllUnread ? unreadNotifications : unreadNotifications.slice(0, 3);
  const displayedRead = showAllRead ? readNotifications : readNotifications.slice(0, 3);

  return (
    <main className="flex-1 ml-0 md:ml-20 relative min-h-screen overflow-x-hidden pt-24 px-6 md:px-8 pb-20">
      {/* Full Body Character Watermark */}
      <div 
        className="fixed bottom-0 right-0 w-[50vw] max-w-[700px] h-[85vh] z-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: `url(${AniromPerson})`,
          backgroundSize: 'contain',
          backgroundPosition: 'bottom right',
          backgroundRepeat: 'no-repeat',
          maskImage: 'linear-gradient(to left, black 40%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to left, black 40%, transparent 100%)'
        }}
      />
      <div className="max-w-4xl mx-auto relative z-10">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-6">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold font-heading tracking-tight text-white drop-shadow-md">Notificações</h1>
              <p className="text-zinc-400 font-sans mt-1.5">
                Fique por dentro das novidades e alertas da sua conta.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {unreadCount > 0 && (
              <div className="px-4 py-1.5 bg-primary/10 border border-primary/30 rounded-full shadow-[0_0_15px_rgba(157,78,221,0.2)]">
                <span className="text-primary font-semibold text-sm tracking-wide">
                  {unreadCount} {unreadCount === 1 ? 'não lida' : 'não lidas'}
                </span>
              </div>
            )}
            
            {notifications.length > 0 && unreadCount > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={markAllAsRead}
                className="rounded-full backdrop-blur-md bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all shadow-lg"
              >
                <CheckCheck className="w-4 h-4 mr-2 text-primary" />
                Marcar todas lidas
              </Button>
            )}
          </div>
        </header>

        {loading && notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-6 shadow-[0_0_15px_rgba(157,78,221,0.3)]" />
            <p className="font-medium tracking-wide">Sincronizando notificações...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="p-6 bg-white/5 rounded-full mb-6 border border-white/5 shadow-inner">
              <Bell className="w-14 h-14 text-white/10" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-zinc-200">Nada por aqui...</h2>
            <p className="text-zinc-500 max-w-sm mx-auto leading-relaxed">
              Você não possui nenhuma notificação no momento. Quando algo incrível acontecer, avisaremos você!
            </p>
          </div>
        ) : (
          <div className="flex flex-col pb-8">
            {unreadNotifications.length > 0 && (
              <div className="mb-8">
                <div className="mb-4 ml-1">
                  <h2 className="text-lg font-bold text-white tracking-wider uppercase flex items-center gap-3 opacity-90">
                    <span className="w-1.5 h-5 rounded-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.6)]" />
                    Novas Notificações
                  </h2>
                </div>
                <div className="flex flex-col gap-3">
                  <AnimatePresence>
                    {displayedUnread.map((notification, index) => (
                      <NotificationItem 
                        key={notification.id} 
                        notification={notification} 
                        index={index} 
                        onDelete={deleteNotification}
                        onMarkAsRead={markAsRead}
                      />
                    ))}
                  </AnimatePresence>
                  
                  {unreadNotifications.length > 3 && !showAllUnread && (
                    <Button 
                      variant="ghost" 
                      onClick={() => setShowAllUnread(true)}
                      className="mt-2 text-zinc-400 hover:text-white border border-white/5 bg-black/20 hover:bg-white/5 rounded-xl w-full"
                    >
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Ver mais ({unreadNotifications.length - 3})
                    </Button>
                  )}
                  {unreadNotifications.length > 3 && showAllUnread && (
                    <Button 
                      variant="ghost" 
                      onClick={() => setShowAllUnread(false)}
                      className="mt-2 text-zinc-400 hover:text-white border border-white/5 bg-black/20 hover:bg-white/5 rounded-xl w-full"
                    >
                      <ChevronUp className="w-4 h-4 mr-2" />
                      Ocultar
                    </Button>
                  )}
                </div>
              </div>
            )}

            {readNotifications.length > 0 && (
              <div className="mt-4">
                <button 
                  onClick={() => setShowArchived(!showArchived)}
                  className="w-full flex items-center justify-between px-6 py-4 bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl hover:bg-white/5 hover:border-white/10 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Archive className="w-5 h-5 text-zinc-500 group-hover:text-zinc-400 transition-colors" />
                    <h2 className="text-base font-medium text-zinc-400 group-hover:text-zinc-300 transition-colors">
                      Mensagens Lidas ({readNotifications.length})
                    </h2>
                  </div>
                  {showArchived ? (
                    <ChevronUp className="w-5 h-5 text-zinc-500 group-hover:text-zinc-400 transition-colors" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-zinc-500 group-hover:text-zinc-400 transition-colors" />
                  )}
                </button>
                
                <AnimatePresence>
                  {showArchived && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col gap-3 mt-4 opacity-80 hover:opacity-100 transition-opacity duration-500">
                        {displayedRead.map((notification, index) => (
                          <NotificationItem 
                            key={notification.id} 
                            notification={notification} 
                            index={index} 
                            onDelete={deleteNotification}
                            onMarkAsRead={markAsRead}
                          />
                        ))}
                      </div>
                      
                      {readNotifications.length > 3 && !showAllRead && (
                        <Button 
                          variant="ghost" 
                          onClick={() => setShowAllRead(true)}
                          className="w-full mt-3 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl"
                        >
                          <ChevronDown className="w-4 h-4 mr-2" />
                          Ver mais antigas ({readNotifications.length - 3})
                        </Button>
                      )}
                      {readNotifications.length > 3 && showAllRead && (
                        <Button 
                          variant="ghost" 
                          onClick={() => setShowAllRead(false)}
                          className="w-full mt-3 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl"
                        >
                          <ChevronUp className="w-4 h-4 mr-2" />
                          Ocultar antigas
                        </Button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            
            {hasMore && (
              <div className="mt-8 flex justify-center">
                <Button 
                  variant="outline" 
                  onClick={loadMore} 
                  disabled={loading}
                  className="rounded-full backdrop-blur-md bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 transition-all shadow-lg px-6"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2" />
                      Carregando...
                    </span>
                  ) : 'Carregar mensagens antigas'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
