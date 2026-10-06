import { useEffect, useState, useRef, ChangeEvent } from 'react';
import { toast } from 'sonner';
import { Shield, ShieldAlert, Ban, X, Info, Camera, Trash2, Upload, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile, uploadUserAvatar, removeUserAvatar } from '../services/dataProvider';
import { User } from '../types';
import { UserAvatar } from './UserAvatar';

interface UserEditModalProps {
  open: boolean;
  targetUser: User;
  onClose: () => void;
  onSave: () => void;
}

export function UserEditModal({ open, targetUser, onClose, onSave }: UserEditModalProps) {
  const { user: currentUser, updateUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(targetUser.isAdmin);
  const [isBlocked, setIsBlocked] = useState(targetUser.isBlocked || false);
  const [hasLimit, setHasLimit] = useState(targetUser.limitBriefings !== null && targetUser.limitBriefings !== undefined);
  const [limitValue, setLimitValue] = useState<number>(targetUser.limitBriefings || 5);
  const [submitting, setSubmitting] = useState(false);

  // Photo state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(targetUser.avatar_url || null);
  const [removeAvatarRequested, setRemoveAvatarRequested] = useState(false);

  // Sync state when targetUser changes
  useEffect(() => {
    setIsAdmin(targetUser.isAdmin);
    setIsBlocked(targetUser.isBlocked || false);
    const hasLimitVal = targetUser.limitBriefings !== null && targetUser.limitBriefings !== undefined;
    setHasLimit(hasLimitVal);
    setLimitValue(targetUser.limitBriefings || 5);
    setPreviewUrl(targetUser.avatar_url || null);
    setSelectedFile(null);
    setRemoveAvatarRequested(false);
  }, [targetUser]);

  if (!open) return null;

  const isSelf = currentUser?.id === targetUser.id;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size: max 2MB
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error('A foto selecionada ultrapassa o limite de 2MB. Escolha uma imagem menor.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Check type: jpg, jpeg, png
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      toast.error('Formato inválido. Apenas imagens JPG ou PNG são permitidas.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
    setRemoveAvatarRequested(false);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setRemoveAvatarRequested(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      let newAvatarUrl: string | null | undefined = undefined;

      if (removeAvatarRequested) {
        await removeUserAvatar(targetUser.id);
        newAvatarUrl = null;
      } else if (selectedFile) {
        newAvatarUrl = await uploadUserAvatar(targetUser.id, selectedFile);
      }

      const updates = {
        isAdmin,
        isBlocked,
        limitBriefings: hasLimit ? Math.max(0, limitValue) : null,
      };

      await updateUserProfile(targetUser.id, updates);

      if (isSelf) {
        updateUser({
          isAdmin,
          ...(newAvatarUrl !== undefined ? { avatar_url: newAvatarUrl } : {}),
        });
      }

      toast.success('Configurações do usuário atualizadas com sucesso!');
      onSave();
      onClose();
    } catch (error) {
      toast.error('Erro ao atualizar configurações do usuário.');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-stone-950/40 px-4 backdrop-blur-sm">
      <div className="panel w-full max-w-lg p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div>
            <h2 className="text-xl font-black text-stone-950">Configurar Usuário</h2>
            <p className="mt-1 text-xs font-semibold text-stone-500">{targetUser.nome} • {targetUser.email}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-stone-400 hover:bg-stone-50 hover:text-stone-700 transition"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-6 space-y-6">
          {/* PHOTO SECTION */}
          <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
              Foto de Perfil do Usuário
            </label>
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <UserAvatar
                  src={previewUrl}
                  name={targetUser.nome}
                  size="xl"
                  showBorder={true}
                  className="h-16 w-16 border-2 border-stone-800 shadow-sm"
                />
              </div>

              <div className="flex-1 min-w-0 space-y-1.5">
                <p className="text-xs text-stone-600">
                  Esta foto é exibida no filtro de técnicos do dashboard.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-secondary text-xs py-1.5 px-2.5 inline-flex items-center gap-1.5"
                  >
                    <Upload size={13} /> {previewUrl ? 'Alterar foto' : 'Enviar foto'}
                  </button>
                  {previewUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="btn-secondary text-xs py-1.5 px-2.5 text-red-600 hover:text-red-700 hover:border-red-200 inline-flex items-center gap-1.5"
                    >
                      <Trash2 size={13} /> Remover
                    </button>
                  )}
                </div>
                <span className="block text-[10px] text-stone-400">JPG ou PNG até 2MB</span>
              </div>
            </div>
          </div>

          {/* Admin Role Section */}
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                <div className={`mt-0.5 grid h-8 w-8 place-items-center rounded-lg ${isAdmin ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-50 text-stone-500'}`}>
                  <Shield size={18} />
                </div>
                <div>
                  <label className="text-sm font-bold text-stone-950">Privilégios de Administrador</label>
                  <p className="text-xs text-stone-500">Permite ver todos os briefings, gerenciar usuários e alterar configurações.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isAdmin}
                disabled={isSelf}
                onChange={(e) => setIsAdmin(e.target.checked)}
                className="h-5 w-5 rounded-md border-stone-300 text-cesol-600 focus:ring-cesol-500 disabled:opacity-50"
              />
            </div>
            {isSelf && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800 font-medium border border-amber-100">
                <Info size={14} className="flex-shrink-0" />
                Você não pode revogar seus próprios privilégios de administrador.
              </div>
            )}
          </div>

          <hr className="border-stone-100" />

          {/* Account Blocking Section */}
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                <div className={`mt-0.5 grid h-8 w-8 place-items-center rounded-lg ${isBlocked ? 'bg-red-50 text-red-700' : 'bg-stone-50 text-stone-500'}`}>
                  <Ban size={18} />
                </div>
                <div>
                  <label className="text-sm font-bold text-stone-950">Bloquear Usuário</label>
                  <p className="text-xs text-stone-500">Impede o login ou envio de novos briefings por esta conta.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isBlocked}
                disabled={isSelf}
                onChange={(e) => setIsBlocked(e.target.checked)}
                className="h-5 w-5 rounded-md border-stone-300 text-cesol-600 focus:ring-cesol-500 disabled:opacity-50"
              />
            </div>
            {isSelf && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800 font-medium border border-amber-100">
                <Info size={14} className="flex-shrink-0" />
                Você não pode bloquear sua própria conta.
              </div>
            )}
          </div>

          <hr className="border-stone-100" />

          {/* Briefing Limits Section */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                <div className={`mt-0.5 grid h-8 w-8 place-items-center rounded-lg ${hasLimit ? 'bg-cesol-50 text-cesol-700' : 'bg-stone-50 text-stone-500'}`}>
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <label className="text-sm font-bold text-stone-950">Limitar Geração de Briefings</label>
                  <p className="text-xs text-stone-500">Define uma cota máxima de briefings que o usuário pode criar.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={hasLimit}
                onChange={(e) => setHasLimit(e.target.checked)}
                className="h-5 w-5 rounded-md border-stone-300 text-cesol-600 focus:ring-cesol-500"
              />
            </div>

            {hasLimit && (
              <div className="ml-11 max-w-[200px] animate-in slide-in-from-top-2 duration-200">
                <label className="block text-xs font-bold text-stone-600 mb-1">Quantidade Máxima</label>
                <div className="relative rounded-xl shadow-sm">
                  <input
                    type="number"
                    min="0"
                    value={limitValue}
                    onChange={(e) => setLimitValue(parseInt(e.target.value) || 0)}
                    className="input pr-10"
                    required
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-xs font-bold text-stone-400">unids</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-stone-100 pt-6 mt-8">
            <button
              onClick={onClose}
              disabled={submitting}
              className="btn-secondary"
              type="button"
            >
              Cancelar
            </button>
            <button
              disabled={submitting}
              className="btn-primary inline-flex items-center gap-2"
              type="submit"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
