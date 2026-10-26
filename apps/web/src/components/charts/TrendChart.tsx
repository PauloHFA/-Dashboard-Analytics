import React from 'react';
import { Line } from 'react-chartjs-2';
import './chartSetup';
import { temaCores } from './chartSetup';
import { PontoSerieTemporal } from '@dashboard/shared';

interface Props {
  atual: PontoSerieTemporal[];
  comparativo?: PontoSerieTemporal[];
  metrica: 'investimento' | 'conversoes' | 'cliques' | 'receita';
  titulo?: string;
}

const configMetricas = {
  investimento: { label: 'Investimento (R$)', prefixo: 'R$ ' },
  receita: { label: 'Receita (R$)', prefixo: 'R$ ' },
  conversoes: { label: 'Conversões', prefixo: '' },
  cliques: { label: 'Cliques', prefixo: '' },
};

export const TrendChart: React.FC<Props> = ({ atual, comparativo, metrica, titulo }) => {
  const cfg = configMetricas[metrica];

  const datasets: any[] = [
    {
      label: 'Período Atual',
      data: atual.map((p) => p[metrica]),
      borderColor: temaCores.primaria,
      backgroundColor: temaCores.primariaSuave,
      fill: true,
      tension: 0.28,
      pointRadius: atual.length > 40 ? 0 : 3,
      pointHoverRadius: 6,
      borderWidth: 2.5,
    },
  ];

  if (comparativo && comparativo.length > 0) {
    datasets.push({
      label: 'Período Comparado',
      data: comparativo.map((p) => p[metrica]),
      borderColor: temaCores.neutra,
      borderDash: [6, 4], // Especificação formal da seção 11.3
      fill: false,
      tension: 0.28,
      pointRadius: 0,
      pointHoverRadius: 5,
      borderWidth: 2,
    });
  }

  const data = {
    labels: atual.map((p) => p.data),
    datasets,
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          font: { family: 'Inter, sans-serif', size: 12 },
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 12 },
        padding: 10,
        callbacks: {
          label: (context: any) => {
            let val = context.raw || 0;
            if (cfg.prefixo) {
              val = Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            } else {
              val = Number(val).toLocaleString('pt-BR');
            }
            return ` ${context.dataset.label}: ${cfg.prefixo}${val}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, maxTicksLimit: 12 },
      },
      y: {
        grid: { color: '#f1f5f9' },
        ticks: {
          font: { size: 11 },
          callback: (value: any) => (cfg.prefixo ? `${cfg.prefixo}${value}` : value),
        },
      },
    },
  };

  return (
    <div className="w-full h-72">
      {titulo && <h4 className="text-sm font-semibold text-slate-700 mb-2">{titulo}</h4>}
      <Line data={data} options={options} />
    </div>
  );
};

