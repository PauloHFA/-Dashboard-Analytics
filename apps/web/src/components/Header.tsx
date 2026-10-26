import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { RefreshCw, Printer, User, FileSpreadsheet, Moon, Sun, Maximize2, Minimize2 } from 'lucide-react';

interface HeaderProps {
  onExportPdf: () => void;
  onExportCsv: () => void;
  onRefresh: () => void;
  minutosDesdeAtualizacao: number;
}

export const Header: React.FC<HeaderProps> = ({
  onExportPdf,
  onExportCsv,
  onRefresh,
  minutosDesdeAtualizacao,
}) => {
  const { usuario, usuariosDisponiveis, loginComo } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            GM
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-900 text-base leading-tight">GrowMetrics Digital</h1>
              <span className="text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                BI Multicliente
              </span>
            </div>
            <p className="text-xs text-slate-500">Painel Centralizado de Marketing</p>
          </div>
        </div>

        {/* Central / Status de Frescor */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>
            Atualizado {minutosDesdeAtualizacao === 0 ? 'agora' : `há ${minutosDesdeAtualizacao} min`}
          </span>
          <button
            onClick={onRefresh}
            title="Recarregar métricas"
            className="p-1 hover:text-blue-600 transition-colors ml-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* User Info & Switcher & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Alternador Dark Mode */}
          <button
            onClick={() => setIsDark(!isDark)}
            title={isDark ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Modo Apresentação / Tela Cheia (RNF-07) */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Sair da Tela Cheia' : 'Modo Reunião / Tela Cheia (RNF-07)'}
            className="hidden md:flex p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-blue-600" /> : <Maximize2 className="w-4 h-4 text-slate-600" />}
          </button>

          <button
            onClick={onExportCsv}
            title="Exportar planilha de dados em CSV (RF-17)"
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={onExportPdf}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Exportar PDF</span>
          </button>

          {/* Quick Profile Switcher for Testing RBAC & Multitenancy */}
          <div className="relative flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <User className="w-4 h-4 text-slate-500" />
            <select
              value={usuario?.id || 'usr-admin'}
              onChange={(e) => loginComo(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-800 outline-none cursor-pointer pr-1"
            >
              {usuariosDisponiveis.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome} ({u.perfil})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
