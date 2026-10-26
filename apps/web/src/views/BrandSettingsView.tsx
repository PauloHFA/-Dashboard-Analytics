import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { AgenciaMarca } from '@dashboard/shared';
import { Palette, CheckCircle2 } from 'lucide-react';

export const BrandSettingsView: React.FC = () => {
  const [marca, setMarca] = useState<AgenciaMarca | null>(null);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    fetchApi<{ marca: AgenciaMarca }>('/agencia/marca')
      .then((res) => setMarca(res.marca))
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!marca) return;

    try {
      await fetchApi('/agencia/marca', {
        method: 'PUT',
        body: JSON.stringify(marca),
      });
      setSucesso(true);
      setTimeout(() => setSucesso(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar marca');
    }
  };

  if (!marca) return null;

  return (
    <div className="max-w-2xl bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Palette className="w-5 h-5 text-blue-600" />
        <h3 className="text-base font-semibold text-slate-900">Personalização da Marca da Agência</h3>
      </div>
      <p className="text-xs text-slate-500 mb-6">
        Configure a identidade visual que será aplicada no painel e nos relatórios exportados em PDF (RF-14).
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Nome da Agência</label>
          <input
            type="text"
            value={marca.nome}
            onChange={(e) => setMarca({ ...marca, nome: e.target.value })}
            className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Cor Primária</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={marca.corPrimaria}
                onChange={(e) => setMarca({ ...marca, corPrimaria: e.target.value })}
                className="w-9 h-9 p-0.5 border border-slate-300 rounded cursor-pointer"
              />
              <span className="font-mono text-xs text-slate-700">{marca.corPrimaria}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Cor Secundária</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={marca.corSecundaria}
                onChange={(e) => setMarca({ ...marca, corSecundaria: e.target.value })}
                className="w-9 h-9 p-0.5 border border-slate-300 rounded cursor-pointer"
              />
              <span className="font-mono text-xs text-slate-700">{marca.corSecundaria}</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Texto do Rodapé no PDF</label>
          <textarea
            rows={2}
            value={marca.rodapeTexto}
            onChange={(e) => setMarca({ ...marca, rodapeTexto: e.target.value })}
            className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {sucesso && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Identidade visual atualizada com sucesso!</span>
          </div>
        )}

        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow transition"
        >
          Salvar Alterações
        </button>
      </form>
    </div>
  );
};

