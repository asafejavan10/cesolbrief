import { Search, X, Check, Clock3, FilePlus2, Users } from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { cn } from '../utils/cn';

export type TechnicianItem = {
  nome: string;
  avatar_url?: string | null;
};

interface DashboardFiltersProps {
  query: string;
  onQueryChange: (val: string) => void;
  tecnicos: TechnicianItem[];
  selectedTecnico: string;
  onTecnicoChange: (val: string) => void;
  servico: string;
  onServicoChange: (val: string) => void;
  status: string;
  onStatusChange: (val: string) => void;
  servicosList?: string[];
}

export function DashboardFilters({
  query,
  onQueryChange,
  tecnicos,
  selectedTecnico,
  onTecnicoChange,
  servico,
  onServicoChange,
  status,
  onStatusChange,
  servicosList = ['Rotulagem', 'Logotipo', 'Rede Social', 'Outro'],
}: DashboardFiltersProps) {
  const handleToggleTecnico = (nome: string) => {
    if (selectedTecnico.toLowerCase() === nome.toLowerCase()) {
      onTecnicoChange('todos');
    } else {
      onTecnicoChange(nome);
    }
  };

  const handleToggleStatus = (val: string) => {
    if (status === val) {
      onStatusChange('todos');
    } else {
      onStatusChange(val);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. PESQUISAR Panel */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition">
        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-500">
            PESQUISAR
          </span>
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3.5 text-stone-400" size={19} />
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Pesquisar por empreendimento, cidade ou técnico..."
              className="w-full rounded-xl border border-stone-200 bg-white py-3 pl-11 pr-10 text-sm text-stone-800 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200 transition"
            />
            {query && (
              <button
                type="button"
                onClick={() => onQueryChange('')}
                className="absolute right-3 rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition"
                title="Limpar pesquisa"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </label>
      </div>

      {/* 2. FILTROS Panel: TÉCNICO | SERVIÇO | STATUS */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          
          {/* TÉCNICO SECTION */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                TÉCNICO
              </span>
              {selectedTecnico !== 'todos' && (
                <button
                  type="button"
                  onClick={() => onTecnicoChange('todos')}
                  className="text-[11px] font-semibold text-cesol-700 hover:underline"
                >
                  Limpar ({selectedTecnico})
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5 overflow-x-auto overflow-y-hidden py-2 px-1 scrollbar-thin">
              {/* "Todos" Avatar Pill */}
              <button
                type="button"
                onClick={() => onTecnicoChange('todos')}
                title="Todos os técnicos"
                className={cn(
                  'group relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 transition-colors focus:outline-none',
                  selectedTecnico === 'todos'
                    ? 'border-stone-900 bg-stone-900 text-white shadow-sm ring-2 ring-stone-900/20'
                    : 'border-stone-300 bg-stone-50 text-stone-600 hover:border-stone-500 hover:bg-stone-100'
                )}
              >
                <Users size={18} />
              </button>

              {/* Technicians circular avatars */}
              {tecnicos.map((t) => {
                const isSelected = selectedTecnico.toLowerCase() === t.nome.toLowerCase();
                return (
                  <button
                    key={t.nome}
                    type="button"
                    onClick={() => handleToggleTecnico(t.nome)}
                    title={t.nome}
                    className={cn(
                      'group relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full p-0 transition-colors focus:outline-none',
                      isSelected ? 'ring-2 ring-cesol-600/40' : ''
                    )}
                  >
                    <UserAvatar
                      src={t.avatar_url}
                      name={t.nome}
                      size="md"
                      showBorder={false}
                      className={cn(
                        'h-12 w-12 border-2 transition-colors',
                        isSelected
                          ? 'border-cesol-600 shadow-sm'
                          : 'border-stone-800 hover:border-stone-500'
                      )}
                    />
                  </button>
                );
              })}

              {tecnicos.length === 0 && (
                <span className="text-xs text-stone-400 italic">Nenhum técnico cadastrado</span>
              )}
            </div>
          </div>

          {/* DIVIDER FOR DESKTOP */}
          <div className="hidden lg:block h-12 w-px bg-stone-200" />

          {/* SERVIÇO SECTION */}
          <div className="w-full lg:w-56 shrink-0">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-500">
              SERVIÇO
            </span>
            <div className="relative">
              <select
                value={servico}
                onChange={(e) => onServicoChange(e.target.value)}
                className="w-full appearance-none rounded-xl border border-stone-200 bg-white py-3 pl-4 pr-10 text-sm font-medium text-stone-800 shadow-none outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-200 transition cursor-pointer"
              >
                <option value="todos">Todos</option>
                {servicosList.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-stone-500">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          {/* DIVIDER FOR DESKTOP */}
          <div className="hidden lg:block h-12 w-px bg-stone-200" />

          {/* STATUS SECTION */}
          <div className="shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                STATUS
              </span>
              {status !== 'todos' && (
                <button
                  type="button"
                  onClick={() => onStatusChange('todos')}
                  className="text-[11px] font-semibold text-cesol-700 hover:underline"
                >
                  Ver todos
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Novo Briefing (Blue) */}
              <button
                type="button"
                onClick={() => handleToggleStatus('novo')}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-bold text-white transition-all shadow-sm focus:outline-none',
                  'bg-[#026aa7] hover:bg-[#025b8f]',
                  status === 'novo'
                    ? 'ring-2 ring-offset-2 ring-[#026aa7] scale-105 shadow-md'
                    : status !== 'todos'
                    ? 'opacity-40 hover:opacity-75'
                    : 'opacity-100'
                )}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-md border border-white/40 bg-white/10">
                  <FilePlus2 size={14} className="text-white" />
                </span>
                <span>Novo Briefing</span>
              </button>

              {/* Fazendo (Crimson/Rose) */}
              <button
                type="button"
                onClick={() => handleToggleStatus('em_andamento')}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-bold text-white transition-all shadow-sm focus:outline-none',
                  'bg-[#d92d53] hover:bg-[#c22446]',
                  status === 'em_andamento'
                    ? 'ring-2 ring-offset-2 ring-[#d92d53] scale-105 shadow-md'
                    : status !== 'todos'
                    ? 'opacity-40 hover:opacity-75'
                    : 'opacity-100'
                )}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-md border border-white/40 bg-white/10">
                  <Clock3 size={14} className="text-white" />
                </span>
                <span>Fazendo</span>
              </button>

              {/* Concluído (Green) */}
              <button
                type="button"
                onClick={() => handleToggleStatus('concluido')}
                className={cn(
                  'flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-bold text-white transition-all shadow-sm focus:outline-none',
                  'bg-[#10b981] hover:bg-[#059669]',
                  status === 'concluido'
                    ? 'ring-2 ring-offset-2 ring-[#10b981] scale-105 shadow-md'
                    : status !== 'todos'
                    ? 'opacity-40 hover:opacity-75'
                    : 'opacity-100'
                )}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-md border border-white/40 bg-white/10">
                  <Check size={14} className="text-white stroke-[3]" />
                </span>
                <span>Concluído</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
