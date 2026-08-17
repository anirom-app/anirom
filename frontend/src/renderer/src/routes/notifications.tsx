import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Bell, Info, AlertTriangle, ShieldCheck, Zap, MonitorUp, Trash2, CheckCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useNotifications, Notification } from '@/hooks/useNotifications'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

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
      return <Info className="w-5 h-5 text-gray-400" />
  }
}

import { trpc } from '@/main'

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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        if (!notification.read) {
          onMarkAsRead(notification.id);
        }
        if (notification.referenceId) {
          navigate({ to: '/animes/$animeId', params: { animeId: notification.referenceId } });
        }
      }}
      className={`p-4 flex gap-4 transition-colors hover:bg-white/5 cursor-pointer ${
        !notification.read ? 'bg-primary/5' : ''
      }`}
    >
      <div className="shrink-0 mt-1">
        {posterUrl ? (
          <div className="w-16 h-20 rounded-lg overflow-hidden border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
             <img src={`anirom://media/?url=${encodeURIComponent(posterUrl)}`} alt="Capa do Anime" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="p-2.5 bg-[#0a0a0a] rounded-xl border border-white/10 shadow-inner">
            {getNotificationIcon(notification.type)}
          </div>
        )}
      </div>
      
      <div className="flex-1 space-y-1 pt-2">
        <div className="flex items-start justify-between gap-4">
          <h3 className={`text-base font-semibold ${!notification.read ? 'text-white' : 'text-gray-200'}`}>
            {notification.title}
          </h3>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatNotificationDate(notification.createdAt)}
          </span>
        </div>
        <p className="text-sm text-gray-400 leading-relaxed">
          {notification.message}
        </p>
      </div>

      {!notification.read && (
        <div className="shrink-0 flex items-center pr-2">
          <div className="w-2.5 h-2.5 bg-primary rounded-full shadow-[0_0_10px_rgba(157,78,221,0.8)]" />
        </div>
      )}
      
      <div className="shrink-0 flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-zinc-500 hover:text-red-400 hover:bg-red-400/10"
          onClick={() => onDelete(notification.id)}
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

  return (
   
    <main className="flex-1 ml-0 md:ml-20 relative min-h-screen overflow-x-hidden pt-24 px-6 md:px-8 pb-20">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3  rounded-2xl">
              <Bell className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-heading tracking-tight">Notificações</h1>
              <p className="text-muted-foreground font-sans mt-1">
                Fique por dentro das novidades e alertas da sua conta.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {unreadCount > 0 && (
              <div className="px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
                <span className="text-primary font-medium text-sm">
                  {unreadCount} não lidas
                </span>
              </div>
            )}
            
            {notifications.length > 0 && unreadCount > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={markAllAsRead}
                className="border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300"
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                Marcar todas como lidas
              </Button>
            )}
          </div>
        </header>

        <section className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl">
          {loading && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
              <p>Carregando notificações...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <div className="p-4 bg-white/5 rounded-full mb-4">
                <Bell className="w-12 h-12 text-white/20" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Nada por aqui...</h2>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Você não possui nenhuma notificação no momento. Volte mais tarde!
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="divide-y divide-white/5">
                <AnimatePresence>
                  {notifications.map((notification, index) => (
                    <NotificationItem 
                      key={notification.id} 
                      notification={notification} 
                      index={index} 
                      onDelete={deleteNotification}
                      onMarkAsRead={markAsRead}
                    />
                  ))}
                </AnimatePresence>
              </div>
              {hasMore && (
                <div className="p-4 border-t border-white/5 flex justify-center">
                  <Button 
                    variant="ghost" 
                    onClick={loadMore} 
                    disabled={loading}
                    className="text-zinc-400 hover:text-white"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2" />
                        Carregando...
                      </span>
                    ) : 'Carregar mais'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
