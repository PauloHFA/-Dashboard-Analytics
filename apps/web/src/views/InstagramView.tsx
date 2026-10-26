import React from 'react';
import { ResumoMetricas, InstagramMidia, formatarNumero, formatarPercentual } from '@dashboard/shared';
import { Eye, Radio, UserPlus, Heart, MessageCircle, Sparkles } from 'lucide-react';

interface Props {
  resumo: ResumoMetricas;
  midias: InstagramMidia[];
}

export const InstagramView: React.FC<Props> = ({ resumo, midias }) => {
  return (
    <div className="space-y-6">
      {/* Alerta de Atualização de Métrica Graph API (Seção 5 e 7 do PDF) */}
      <div className="bg-pink-50 border border-pink-200 rounded-xl p-4 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-pink-600 shrink-0 mt-0.5" />
        <div className="text-xs text-pink-950 leading-relaxed">
          <span className="font-semibold">Padrão Instagram Graph API:</span> A métrica de{' '}
          <strong>Views (Visualizações)</strong> é a convenção oficial da Meta que unificou impressões e reproduções de
          vídeo.
        </div>
      </div>

      {/* Grid de KPIs do Instagram */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Visualizações (Views)</span>
            <Eye className="w-4 h-4 text-pink-500" />
          </div>
          <span className="text-2xl font-bold text-slate-900">{formatarNumero(resumo.viewsInstagram)}</span>
          <p className="text-xs text-slate-400 mt-2">Total de exibições no feed, stories e reels</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Contas Alcançadas</span>
            <Radio className="w-4 h-4 text-rose-500" />
          </div>
          <span className="text-2xl font-bold text-slate-900">{formatarNumero(resumo.alcanceInstagram)}</span>
          <p className="text-xs text-slate-400 mt-2">Contas únicas que visualizaram o conteúdo</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Taxa de Engajamento</span>
            <Heart className="w-4 h-4 text-red-500" />
          </div>
          <span className="text-2xl font-bold text-slate-900">{formatarPercentual(resumo.engajamentoInstagram)}</span>
          <p className="text-xs text-slate-400 mt-2">Interações ÷ Alcance Total</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Novos Seguidores</span>
            <UserPlus className="w-4 h-4 text-violet-500" />
          </div>
          <span className="text-2xl font-bold text-slate-900">+342</span>
          <p className="text-xs text-slate-400 mt-2">Crescimento líquido da comunidade</p>
        </div>
      </div>

      {/* Publicações de Maior Desempenho (RF-13) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900 mb-1">Publicações de Maior Desempenho</h3>
        <p className="text-xs text-slate-500 mb-6">
          Conteúdos com maior volume de visualizações e interações no perfil
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {midias.map((midia) => (
            <div
              key={midia.id}
              className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="relative h-44 bg-slate-100 overflow-hidden">
                  <img
                    src={midia.thumbnailUrl}
                    alt="Capa do post"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    {midia.tipo}
                  </span>
                </div>
                <div className="p-4">
                  <p className="text-xs text-slate-700 line-clamp-3 leading-relaxed mb-3">
                    {midia.legenda}
                  </p>
                </div>
              </div>

              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <strong>{formatarNumero(midia.views)}</strong> views
                </span>
                <span className="flex items-center gap-1 text-rose-600 font-semibold">
                  <Heart className="w-3.5 h-3.5" />
                  {formatarNumero(midia.curtidas)}
                </span>
                <span className="flex items-center gap-1 text-slate-600">
                  <MessageCircle className="w-3.5 h-3.5 text-slate-400" />
                  {midia.comentarios}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
