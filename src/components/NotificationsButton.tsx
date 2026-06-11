import { Bell, CheckCircle2, ClipboardPlus, PlayCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getNotifications, markNotificationsRead, deleteNotification } from '../services/dataProvider';
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

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Erro ao deletar notificação:', err);
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
        <div className="absolute bottom-full right-0 z-50 mb-3 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-soft animate-in slide-in-from-bottom-2 duration-200">
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
                  <div key={notification.id} className="group relative">
                    <Link
                      to={`/dashboard/briefings/${notification.briefing_id}`}
                      className="flex gap-3 border-b border-stone-100 p-4 pr-10 transition hover:bg-stone-50"
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
                    <button
                      onClick={(e) => handleDelete(notification.id, e)}
                      className="absolute right-3 top-4 grid h-6 w-6 place-items-center rounded-md border border-stone-200 bg-white text-stone-400 opacity-0 group-hover:opacity-100 hover:border-red-200 hover:text-red-600 transition shadow-sm z-10"
                      title="Apagar notificação"
                      type="button"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
