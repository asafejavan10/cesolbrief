import { ShieldCheck, ShieldOff, Trash2, Users, Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ConfirmModal } from '../components/ConfirmModal';
import { MetricCard } from '../components/MetricCard';
import { UserEditModal } from '../components/UserEditModal';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { getUsers, removeUser } from '../services/dataProvider';
import { User } from '../types';
import { formatDate } from '../utils/format';

export function UsersAdmin() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [removeTarget, setRemoveTarget] = useState<User | null>(null);
  const [editTarget, setEditTarget] = useState<User | null>(null);

  async function refresh() {
    setUsers(await getUsers());
  }

  useEffect(() => {
    refresh().catch(() => setUsers([]));
  }, []);

  async function confirmRemove() {
    if (!removeTarget) return;
    if (removeTarget.id === user?.id) {
      toast.error('Você não pode remover sua própria conta.');
      setRemoveTarget(null);
      return;
    }
    await removeUser(removeTarget.id);
    setRemoveTarget(null);
    await refresh();
    toast.success('Usuário removido.');
  }

  return (
    <DashboardLayout>
      <div className="border-b border-stone-200 bg-white px-4 py-5 sm:px-6 lg:px-8">
        <p className="text-sm font-bold text-cesol-800">Administração</p>
        <h1 className="mt-1 text-3xl font-black text-stone-950">Usuários</h1>
      </div>
      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Total de usuários" value={users.length} icon={Users} tone="bg-cesol-50 text-cesol-800" />
          <MetricCard label="Administradores" value={users.filter((item) => item.isAdmin).length} icon={ShieldCheck} tone="bg-emerald-50 text-emerald-800" />
          <MetricCard label="Usuários comuns" value={users.filter((item) => !item.isAdmin).length} icon={ShieldOff} tone="bg-stone-100 text-stone-700" />
        </div>
        <section className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left">
              <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-5 py-4">Nome</th>
                  <th className="px-5 py-4">E-mail</th>
                  <th className="px-5 py-4">Perfil</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Limite Briefings</th>
                  <th className="px-5 py-4">Criado em</th>
                  <th className="px-5 py-4">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {users.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-4 text-sm font-bold text-stone-950">{item.nome}</td>
                    <td className="px-5 py-4 text-sm text-stone-600">{item.email}</td>
                    <td className="px-5 py-4">
                      <span className={item.isAdmin ? 'rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200 whitespace-nowrap' : 'rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-700 ring-1 ring-stone-200 whitespace-nowrap'}>
                        {item.isAdmin ? 'Administrador' : 'Usuário comum'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={item.isBlocked ? 'rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-800 ring-1 ring-red-200 whitespace-nowrap' : 'rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200 whitespace-nowrap'}>
                        {item.isBlocked ? 'Bloqueado' : 'Ativo'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-stone-700 whitespace-nowrap">
                      {item.limitBriefings !== null && item.limitBriefings !== undefined ? `${item.limitBriefings} briefing(s)` : 'Sem limite'}
                    </td>
                    <td className="px-5 py-4 text-sm text-stone-600 whitespace-nowrap">{formatDate(item.created_at)}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button className="btn-secondary px-3 py-1.5 text-xs font-bold whitespace-nowrap" onClick={() => setEditTarget(item)} type="button">
                          <Settings size={14} /> Configurar
                        </button>
                        <button className="btn-secondary px-3 py-1.5 text-xs font-bold text-red-700 hover:border-red-200 hover:text-red-800 whitespace-nowrap" onClick={() => setRemoveTarget(item)} type="button">
                          <Trash2 size={14} /> Remover
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <ConfirmModal
        open={Boolean(removeTarget)}
        title="Remover usuário?"
        description="O perfil será removido da lista do sistema. No Supabase, a conta de autenticação pode continuar existindo e deve ser excluída em Authentication > Users se você quiser bloquear completamente o login."
        onCancel={() => setRemoveTarget(null)}
        onConfirm={confirmRemove}
      />
      {editTarget && (
        <UserEditModal
          open={Boolean(editTarget)}
          targetUser={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={refresh}
        />
      )}
    </DashboardLayout>
  );
}
