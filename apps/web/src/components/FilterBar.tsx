import React from 'react';
import { useFilters, PresetPeriodo } from '../context/FilterContext';
import { useAuth } from '../context/AuthContext';
import { Calendar, Building, Layers, GitCompare, Lock } from 'lucide-react';

export const FilterBar: React.FC = () => {
  const {
    clienteId,
    setClienteId,
    preset,
    setPreset,
    canais,
    alternarCanal,
    comparar,
    setComparar,
    clientes,
  } = useFilters();

  const { usuario } = useAuth();
  const isClienteFinal = usuario?.perfil === 'cliente';

  const presets: { id: PresetPeriodo; label: string }[] = [
    { id: '7d', label: '7 Dias' },
    { id: '30d', label: '30 Dias' },
    { id: '90d', label: '90 Dias' },
    { id: 'este_mes', label: 'Este Mês' },
  ];

  const canaisDisponiveis = [
    { id: 'google_ads', label: 'Google Ads', cor: 'border-blue-500 text-blue-700 bg-blue-50' },
    { id: 'meta_ads', label: 'Meta Ads', cor: 'border-sky-500 text-sky-700 bg-sky-50' },
    { id: 'ga4', label: 'GA4', cor: 'border-amber-500 text-amber-700 bg-amber-50' },
    { id: 'instagram', label: 'Instagram', cor: 'border-pink-500 text-pink-700 bg-pink-50' },
  ];

  return (
    <div className="bg-white border-b border-slate-200 py-3 shadow-xs sticky top-16 z-20 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
        {/* Seletor de Cliente (Multitenant) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            {isClienteFinal ? <Lock className="w-4 h-4 text-slate-400" /> : <Building className="w-4 h-4 text-slate-400" />}
            <span>Cliente:</span>
          </div>

          {isClienteFinal ? (
            <div className="text-xs font-semibold px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-800 flex items-center gap-2">
              <span>{clientes.find((c) => c.id === clienteId)?.nome || 'Meu Painel'}</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono">
                Isolado
              </span>
            </div>
          ) : (
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className="text-xs font-medium border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none max-w-[220px]"
            >
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Presets de Período */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-0.5" />
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => setPreset(p.id)}
              className={`text-xs px-2.5 py-1 rounded-md font-medium transition ${
                preset === p.id
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Seleção de Canais */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            Canais:
          </span>
          <div className="flex items-center gap-1">
            {canaisDisponiveis.map((ch) => {
              const ativo = canais.includes(ch.id);
              return (
                <button
                  key={ch.id}
                  onClick={() => alternarCanal(ch.id)}
                  className={`text-xs px-2.5 py-1 rounded-md border font-medium transition ${
                    ativo
                      ? ch.cor
                      : 'border-slate-200 text-slate-400 bg-white hover:border-slate-300'
                  }`}
                >
                  {ch.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Comparativo de Período (RF-05) */}
        <div className="flex items-center gap-1.5">
          <GitCompare className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs font-semibold text-slate-500">Comparar:</span>
          <select
            value={comparar}
            onChange={(e) => setComparar(e.target.value as any)}
            className="text-xs border border-slate-300 rounded-lg px-2 py-1 bg-white text-slate-800 outline-none"
          >
            <option value="anterior">Período Anterior</option>
            <option value="ano_anterior">Mesmo período do ano anterior</option>
            <option value="nenhum">Sem comparação</option>
          </select>
        </div>
      </div>
    </div>
  );
};
