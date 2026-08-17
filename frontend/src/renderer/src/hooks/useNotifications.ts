import { useEffect, useCallback, useRef } from "react";
import { useAuthStore, getUserIdFromToken } from "./useAuthStore";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { create } from "zustand";
import { api } from "@/services/api";

export interface Notification {
  id: string;
  userId: string;
  type: "LOGIN" | "NEW_EPISODE" | "NEW_SEASON" | "APP_UPDATE" | "SYSTEM";
  title: string;
  message: string;
  referenceId?: string;
  read: boolean;
  active: boolean;
  createdAt: string;
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  page: number;
  hasMore: boolean;
  
  setNotifications: (updater: Notification[] | ((prev: Notification[]) => Notification[])) => void;
  setUnreadCount: (updater: number | ((prev: number) => number)) => void;
  setLoading: (l: boolean) => void;
  setPage: (p: number) => void;
  setHasMore: (h: boolean) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  loading: true,
  page: 0,
  hasMore: true,
  
  setNotifications: (updater) => set((state) => ({ notifications: typeof updater === 'function' ? updater(state.notifications) : updater })),
  setUnreadCount: (updater) => set((state) => ({ unreadCount: typeof updater === 'function' ? updater(state.unreadCount) : updater })),
  setLoading: (loading) => set({ loading }),
  setPage: (page) => set({ page }),
  setHasMore: (hasMore) => set({ hasMore }),
}));

let isSseConnected = false;

export function useNotifications() {
  const store = useNotificationStore();
  const token = useAuthStore((state) => state.token);
  const loadingMore = useRef(false);

  const fetchUnreadCount = useCallback(async (userId: string, currentToken: string) => {
    try {
      const res = await api.get(`/notifications/unread-count?userId=${userId}`);
      store.setUnreadCount(res.data);
    } catch (err) {
      console.error("Failed to fetch unread count", err);
    }
  }, []);

  const loadNotifications = useCallback(async (userId: string, currentToken: string, pageNum: number, append = false) => {
    try {
      if (pageNum === 0) store.setLoading(true);
      loadingMore.current = true;
      const res = await api.get(`/notifications?userId=${userId}&page=${pageNum}&size=20`);
      const data = res.data;
      const content = data.content || [];
      store.setNotifications(prev => append ? [...prev, ...content] : content);
      store.setHasMore(!data.last);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      store.setLoading(false);
      loadingMore.current = false;
    }
  }, []);

  const loadMore = useCallback(() => {
    const userId = getUserIdFromToken(token);
    if (!userId || !token || loadingMore.current || !store.hasMore) return;
    
    const nextPage = store.page + 1;
    store.setPage(nextPage);
    loadNotifications(userId, token, nextPage, true);
  }, [token, store.page, store.hasMore, loadNotifications]);

  useEffect(() => {
    const userId = getUserIdFromToken(token);
    
    if (!userId || !token) {
      store.setNotifications([]);
      store.setUnreadCount(0);
      store.setLoading(false);
      isSseConnected = false;
      return;
    }

    if (isSseConnected) return;
    isSseConnected = true;

    store.setPage(0);
    loadNotifications(userId, token, 0);
    fetchUnreadCount(userId, token);

    const controller = new AbortController();

    const connect = () => {
      fetchEventSource(`${api.defaults.baseURL}/notifications/stream?userId=${userId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        signal: controller.signal,
        async onopen(res) {
          if (res.ok && res.status === 200) {
            console.log("SSE conectado com sucesso");
          } else {
            throw new Error(`SSE error status: ${res.status}`);
          }
        },
        onmessage(event) {
          try {
            if (event.data) {
              const newNotification = JSON.parse(event.data);
              if (newNotification.type === "PING") return;
              store.setNotifications(prev => [newNotification, ...prev]);
              if (!newNotification.read) {
                store.setUnreadCount(prev => prev + 1);
              }
            }
          } catch (err) {
            console.error("Failed to parse SSE notification", err);
          }
        },
        onclose() {
          console.warn("SSE connection closed");
        },
        onerror(err) {
          console.error("SSE connection error", err);
          return 5000;
        }
      }).catch(err => {
        console.error("SSE fatal error, retrying manually in 5s...", err);
        setTimeout(() => {
          if (!controller.signal.aborted) {
            connect();
          }
        }, 5000);
      });
    };

    connect();

    return () => {
      isSseConnected = false;
      controller.abort();
    };
  }, [token, loadNotifications, fetchUnreadCount]);

  const markAllAsRead = async () => {
    const userId = getUserIdFromToken(token);
    if (!userId || !token) return;
    try {
      await api.patch(`/notifications/read?userId=${userId}`);
      store.setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      store.setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const markAsRead = async (id: string) => {
    if (!token) return;
    
    const notif = store.notifications.find(n => n.id === id);
    if (!notif || notif.read) return;

    try {
      await api.patch(`/notifications/${id}/read`);
      store.setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      store.setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const deleteNotification = async (id: string) => {
    if (!token) return;
    
    const notif = store.notifications.find(n => n.id === id);
    try {
      await api.delete(`/notifications/${id}`);
      store.setNotifications(prev => prev.filter(n => n.id !== id));
      if (notif && !notif.read) {
        store.setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  };

  return {
    ...store,
    loadMore,
    markAllAsRead,
    markAsRead,
    deleteNotification
  };
}
