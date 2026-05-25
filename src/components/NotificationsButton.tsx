import { Bell, CheckCircle2, ClipboardPlus, PlayCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getNotifications, markNotificationsRead } from '../services/dataProvider';
import { Notification } from '../types';
import { formatDate } from '../utils/format';

export function NotificationsButton() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unread = notifications.filter((notification) => !notification.read).length;

  useEffect(() => {
    const refresh = () => {
      getNotifications().then(setNotifications).catch(() => setNotifications([]));
    };
    refresh();
    window.addEventListener('cesolbrief:notifications', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('cesolbrief:notifications', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  function toggle() {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen && unread > 0) {
      markNotificationsRead()
        .then(getNotifications)
        .then(setNotifications)
        .catch(() => setNotifications([]));
    }
  }

  return (
    <div className="relative">
      <button className="btn-secondary relative px-3 py-2" onClick={toggle} type="button" aria-label="Abrir notificações">
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[11px] font-black text-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-3 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-soft">
          <div className="border-b border-stone-100 p-4">
            <p className="text-sm font-black text-stone-950">Notificações</p>
            <p className="mt-1 text-xs text-stone-500">Novos briefings, início e finalização aparecem aqui.</p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-5 text-sm font-semibold text-stone-500">Nenhuma notificação por enquanto.</div>
            ) : (
              notifications.map((notification) => {
                const Icon = notification.type === 'novo_briefing' ? ClipboardPlus : notification.type === 'briefing_iniciado' ? PlayCircle : CheckCircle2;
                return (
                  <Link
                    key={notification.id}
                    to={`/dashboard/briefings/${notification.briefing_id}`}
                    className="flex gap-3 border-b border-stone-100 p-4 transition hover:bg-stone-50"
                    onClick={() => setOpen(false)}
                  >
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-cesol-50 text-cesol-800">
                      <Icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-stone-950">{notification.title}</p>
                      <p className="mt-1 text-sm leading-5 text-stone-600">{notification.message}</p>
                      <p className="mt-2 text-xs font-semibold text-stone-400">{formatDate(notification.created_at)}</p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
