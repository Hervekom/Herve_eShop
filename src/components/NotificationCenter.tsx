import React from 'react';
import {
  Bell,
  BellRing,
  CheckCheck,
  ExternalLink,
  Gift,
  Info,
  Megaphone,
  Package,
  RefreshCw,
  ShieldCheck,
  Tag,
  X,
} from 'lucide-react';
import { CustomerNotification } from '../types';

interface NotificationCenterProps {
  notifications: CustomerNotification[];
  unreadCount: number;
  onClose: () => void;
  onRefresh: () => void;
  onMarkAllAsRead: () => void;
  onMarkOneAsRead: (id: string) => void;
  onOpenNotification: (notification: CustomerNotification) => void;
}

const getNotificationIcon = (type: CustomerNotification['type']) => {
  switch (String(type || '').toLowerCase()) {
    case 'promotion':
      return Gift;
    case 'announcement':
      return Megaphone;
    case 'product':
      return Package;
    case 'account':
      return ShieldCheck;
    case 'order':
      return Tag;
    case 'system':
      return Info;
    default:
      return BellRing;
  }
};

export default function NotificationCenter({
  notifications,
  unreadCount,
  onClose,
  onRefresh,
  onMarkAllAsRead,
  onMarkOneAsRead,
  onOpenNotification,
}: NotificationCenterProps) {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-luxe-dark/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[88vh] overflow-hidden rounded-3xl border border-warm-cream-dark/70 bg-warm-cream shadow-2xl">
        <div className="bg-luxe-dark text-white px-6 py-5 border-b border-luxe-gold/20">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/8 border border-white/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-luxe-gold" />
              </div>
              <div>
                <h3 className="type-section-title !text-[clamp(1.4rem,2vw,1.9rem)] text-white">
                  Notification Center
                </h3>
                <p className="type-meta text-white/70 mt-1">
                  Promotions, product updates, account messages, and admin announcements.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/15 text-white/80 hover:text-white flex items-center justify-center transition-colors"
              aria-label="Close notifications"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="type-badge px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-white">
                {notifications.length} total
              </span>
              {unreadCount > 0 && (
                <span className="type-badge px-3 py-1.5 rounded-full bg-luxe-orange text-white">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onRefresh}
                className="type-button inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 text-white px-4 py-2.5 hover:bg-white/12 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                type="button"
                onClick={onMarkAllAsRead}
                disabled={unreadCount <= 0}
                className="type-button inline-flex items-center gap-2 rounded-full bg-white text-luxe-dark px-4 py-2.5 hover:bg-luxe-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all as read
              </button>
            </div>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-5 md:p-6">
          {notifications.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-warm-cream-dark/80 bg-white px-6 py-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-warm-cream mx-auto flex items-center justify-center border border-warm-cream-dark/80">
                <Bell className="w-6 h-6 text-luxe-muted" />
              </div>
              <h4 className="type-card-title text-luxe-dark mt-5">No new notifications</h4>
              <p className="type-meta text-luxe-muted mt-2 max-w-md mx-auto">
                New promotions, product launches, account updates, and announcements will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                const unread = !notification.isRead;
                return (
                  <div
                    key={notification.id}
                    className={`rounded-2xl border p-4 transition-colors ${
                      unread
                        ? 'bg-white border-luxe-gold/35 shadow-sm'
                        : 'bg-white/75 border-warm-cream-dark/70'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => onOpenNotification(notification)}
                        className="w-full text-left flex items-start gap-3"
                      >
                        <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${
                          unread
                            ? 'bg-luxe-gold/10 border-luxe-gold/30 text-luxe-copper'
                            : 'bg-warm-cream border-warm-cream-dark text-luxe-muted'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className={`type-card-title !text-[1rem] truncate ${unread ? 'text-luxe-dark' : 'text-luxe-dark/80'}`}>
                              {notification.title}
                            </h4>
                            {unread && (
                              <span className="type-badge px-2 py-1 rounded-full bg-luxe-orange/10 text-luxe-orange border border-luxe-orange/20">
                                New
                              </span>
                            )}
                          </div>
                          <p className="type-meta text-luxe-muted mt-1 break-words">
                            {notification.message}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-3">
                            <span className="type-meta text-luxe-muted font-mono">
                              {new Date(notification.createdAt).toLocaleString('en-GB', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <span className="type-badge px-2 py-1 rounded-full border border-warm-cream-dark text-luxe-muted">
                              {notification.type}
                            </span>
                            {notification.link && (
                              <span className="type-meta text-luxe-copper inline-flex items-center gap-1">
                                Open item <ExternalLink className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                        </div>
                      </button>

                      {unread && (
                        <button
                          type="button"
                          onClick={() => onMarkOneAsRead(notification.id)}
                          className="type-button shrink-0 px-3 py-2 rounded-xl border border-warm-cream-dark bg-white hover:bg-warm-cream text-luxe-dark transition-colors"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
