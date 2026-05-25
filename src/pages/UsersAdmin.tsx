import { ShieldCheck, ShieldOff, Trash2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ConfirmModal } from '../components/ConfirmModal';
import { MetricCard } from '../components/MetricCard';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { getUsers, removeUser, updateUserRole } from '../services/dataProvider';
import { User } from '../types';
import { formatDate } from '../utils/format';

export function UsersAdmin() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [removeTarget, setRemoveTarget] = useState<User | null>(null);

  async function refresh() {
    setUsers(await getUsers());
  }

  useEffect(() => {
    refresh().catch(() => setUsers([]));
  }, []);

  async function changeRole(target: User, isAdmin: boolean) {
    if (target.id === user?.id && !isAdmin) {
      toast.error('Você não pode remover seu próprio acesso administrativo.');
      return;
    }
    await updateUserRole(target.id, isAdmin);
    await refresh();
    toast.success(isAdmin ? 'Usuário promovido a admin.' : 'Usuário definido como comum.');
  }

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
            <table className="w-full min-w-[860px] text-left">
              <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-5 py-4">Nome</th>
                  <th className="px-5 py-4">E-mail</th>
                  <th className="px-5 py-4">Perfil</th>
                  <th className="px-5 py-4">Criado em</th>
                  <th className="px-5 py-4">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {users.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-4 font-bold text-stone-950">{item.nome}</td>
                    <td className="px-5 py-4 text-sm text-stone-600">{item.email}</td>
                    <td className="px-5 py-4">
                      <span className={item.isAdmin ? 'rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200' : 'rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-700 ring-1 ring-stone-200'}>
                        {item.isAdmin ? 'Administrador' : 'Usuário comum'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-stone-600">{formatDate(item.created_at)}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button className="btn-secondary py-2" onClick={() => changeRole(item, !item.isAdmin)} type="button">
                          {item.isAdmin ? 'Tornar comum' : 'Tornar admin'}
                        </button>
                        <button className="btn-secondary py-2 text-red-700 hover:border-red-200 hover:text-red-800" onClick={() => setRemoveTarget(item)} type="button">
                          <Trash2 size={16} /> Remover
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
    </DashboardLayout>
  );
}
