import { useState, useRef, ChangeEvent } from 'react';
import { Camera, Trash2, User as UserIcon, Mail, Shield, Check, Lock, ArrowLeft, Loader2, Upload } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { Navbar } from '../components/Navbar';
import { UserAvatar } from '../components/UserAvatar';
import { uploadUserAvatar, removeUserAvatar, updateUserProfile, updatePassword } from '../services/dataProvider';

export function Profile() {
  const { user, updateUser, refreshUser } = useAuth();
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(user?.avatar_url || null);
  const [nome, setNome] = useState(user?.nome || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [removeAvatarRequested, setRemoveAvatarRequested] = useState(false);

  if (!user) return null;

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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      toast.error('O nome não pode estar em branco.');
      return;
    }

    setSaving(true);
    try {
      let newAvatarUrl: string | null | undefined = undefined;

      if (removeAvatarRequested) {
        await removeUserAvatar(user.id);
        newAvatarUrl = null;
      } else if (selectedFile) {
        newAvatarUrl = await uploadUserAvatar(user.id, selectedFile);
      }

      if (nome !== user.nome) {
        await updateUserProfile(user.id, { nome: nome.trim() });
      }

      updateUser({
        nome: nome.trim(),
        ...(newAvatarUrl !== undefined ? { avatar_url: newAvatarUrl } : {}),
      });

      setSelectedFile(null);
      setRemoveAvatarRequested(false);
      await refreshUser();
      toast.success('Perfil atualizado com sucesso!');
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao salvar alterações do perfil.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error('Digite a nova senha.');
      return;
    }
    if (password.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }

    setSavingPassword(true);
    try {
      await updatePassword(user.email, password);
      setPassword('');
      setConfirmPassword('');
      toast.success('Senha atualizada com sucesso!');
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao alterar a senha.');
    } finally {
      setSavingPassword(false);
    }
  };

  const content = (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-cesol-800">
            Configurações de Conta
          </span>
          <h1 className="text-3xl font-black text-stone-950">Meu Perfil</h1>
          <p className="mt-1 text-sm text-stone-600">
            Gerencie sua foto de identificação e suas informações pessoais.
          </p>
        </div>
        <div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary text-xs inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={16} /> Voltar
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Photo Card */}
        <div className="panel p-6 flex flex-col items-center text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-4 self-start">
            Foto do Perfil
          </span>

          <div className="relative group my-2">
            <UserAvatar
              src={previewUrl}
              name={nome || user.nome}
              size="2xl"
              showBorder={true}
              className="h-32 w-32 border-4 border-stone-800 shadow-md"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 grid h-10 w-10 place-items-center rounded-full bg-stone-900 text-white shadow-lg hover:bg-stone-800 transition"
              title="Trocar foto"
            >
              <Camera size={18} />
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            className="hidden"
          />

          <div className="mt-4 space-y-1">
            <p className="text-xs font-bold text-stone-700">Foto de Identificação</p>
            <p className="text-[11px] text-stone-500 max-w-[220px]">
              Esta foto aparecerá para os administradores no filtro de técnicos no dashboard.
            </p>
            <p className="text-[11px] text-stone-400 font-medium pt-1">
              JPG ou PNG • Máximo 2MB
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 justify-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary text-xs py-2 px-3 inline-flex items-center gap-1.5"
            >
              <Upload size={14} /> Selecionar Foto
            </button>
            {(previewUrl || selectedFile) && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="btn-secondary text-xs py-2 px-3 text-red-600 hover:text-red-700 hover:border-red-200 inline-flex items-center gap-1.5"
              >
                <Trash2 size={14} /> Remover
              </button>
            )}
          </div>

          {selectedFile && (
            <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
              Nova foto selecionada: {selectedFile.name}
            </div>
          )}
        </div>

        {/* Right Column: User Details and Password Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info Form */}
          <div className="panel p-6 sm:p-7">
            <h2 className="text-lg font-black text-stone-950 mb-1">Informações Pessoais</h2>
            <p className="text-xs text-stone-500 mb-6">
              Mantenha seus dados atualizados para facilitar a comunicação no sistema.
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                  Nome Completo
                </label>
                <div className="relative">
                  <UserIcon className="pointer-events-none absolute left-3.5 top-3.5 text-stone-400" size={17} />
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    className="input pl-10"
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-3.5 text-stone-400" size={17} />
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="input pl-10 bg-stone-100 text-stone-500 cursor-not-allowed"
                  />
                </div>
                <span className="mt-1 block text-[11px] text-stone-400">
                  O e-mail é utilizado para login e não pode ser alterado diretamente.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-stone-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-stone-500">Nível de Acesso:</span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      user.isAdmin
                        ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200'
                        : 'bg-stone-100 text-stone-700 ring-1 ring-stone-200'
                    }`}
                  >
                    <Shield size={12} />
                    {user.isAdmin ? 'Administrador' : 'Técnico'}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-xs py-2.5 px-5 font-bold inline-flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Salvando...
                    </>
                  ) : (
                    <>
                      <Check size={16} /> Salvar Alterações
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="panel p-6 sm:p-7">
            <h2 className="text-lg font-black text-stone-950 mb-1">Segurança e Senha</h2>
            <p className="text-xs text-stone-500 mb-6">
              Altere sua senha de acesso a qualquer momento.
            </p>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                    Nova Senha
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-3.5 text-stone-400" size={17} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo de 6 caracteres"
                      className="input pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                    Confirmar Nova Senha
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-3.5 text-stone-400" size={17} />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a nova senha"
                      className="input pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-stone-100">
                <button
                  type="submit"
                  disabled={savingPassword || !password}
                  className="btn-secondary text-xs py-2.5 px-5 font-bold inline-flex items-center gap-2"
                >
                  {savingPassword ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Atualizando...
                    </>
                  ) : (
                    'Atualizar Senha'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  if (user.isAdmin) {
    return <DashboardLayout>{content}</DashboardLayout>;
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <main>{content}</main>
    </div>
  );
}
