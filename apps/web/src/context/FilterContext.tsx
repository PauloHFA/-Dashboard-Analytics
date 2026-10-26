import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { fetchApi } from '../services/api';
import { Cliente } from '@dashboard/shared';

export type PresetPeriodo = '7d' | '30d' | '90d' | 'este_mes';

interface FilterContextType {
  clienteId: string;
  setClienteId: (id: string) => void;
  inicio: string;
  fim: string;
  setDatas: (inicio: string, fim: string) => void;
  preset: PresetPeriodo;
  setPreset: (preset: PresetPeriodo) => void;
  canais: string[];
  alternarCanal: (canal: string) => void;
  comparar: 'anterior' | 'ano_anterior' | 'nenhum';
  setComparar: (modo: 'anterior' | 'ano_anterior' | 'nenhum') => void;
  clientes: Cliente[];
  clienteAtual: Cliente | undefined;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

function obterIntervaloPreset(preset: PresetPeriodo): { inicio: string; fim: string } {
  const hoje = new Date();
  const fim = hoje.toISOString().slice(0, 10);

  if (preset === '7d') {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() - 6);
    return { inicio: d.toISOString().slice(0, 10), fim };
  }
  if (preset === '90d') {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() - 89);
    return { inicio: d.toISOString().slice(0, 10), fim };
  }
  if (preset === 'este_mes') {
    const d = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    return { inicio: d.toISOString().slice(0, 10), fim };
  }

  // 30 dias padrão
  const d = new Date(hoje);
  d.setDate(hoje.getDate() - 29);
  return { inicio: d.toISOString().slice(0, 10), fim };
}

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { usuario } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState<string>('cli-01');
  const [preset, setPresetState] = useState<PresetPeriodo>('30d');
  const [datas, setDatasState] = useState(obterIntervaloPreset('30d'));
  const [canais, setCanais] = useState<string[]>(['google_ads', 'meta_ads', 'ga4', 'instagram']);
  const [comparar, setComparar] = useState<'anterior' | 'ano_anterior' | 'nenhum'>('anterior');

  useEffect(() => {
    if (!usuario) return;
    fetchApi<{ clientes: Cliente[] }>('/clientes')
      .then((res) => {
        setClientes(res.clientes);
        if (usuario.perfil === 'cliente') {
          // Cliente final é restrito estritamente ao seu id
          setClienteId(usuario.clientesIds[0] || 'cli-01');
        } else if (!res.clientes.some((c) => c.id === clienteId)) {
          setClienteId(res.clientes[0]?.id || 'cli-01');
        }
      })
      .catch(console.error);
  }, [usuario]);

  const setPreset = (p: PresetPeriodo) => {
    setPresetState(p);
    setDatasState(obterIntervaloPreset(p));
  };

  const setDatas = (inicio: string, fim: string) => {
    setDatasState({ inicio, fim });
  };

  const alternarCanal = (canal: string) => {
    setCanais((prev) =>
      prev.includes(canal) ? (prev.length > 1 ? prev.filter((c) => c !== canal) : prev) : [...prev, canal]
    );
  };

  const clienteAtual = clientes.find((c) => c.id === clienteId);

  return (
    <FilterContext.Provider
      value={{
        clienteId,
        setClienteId,
        inicio: datas.inicio,
        fim: datas.fim,
        setDatas,
        preset,
        setPreset,
        canais,
        alternarCanal,
        comparar,
        setComparar,
        clientes,
        clienteAtual,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) throw new Error('useFilters deve ser usado dentro de FilterProvider');
  return context;
};

