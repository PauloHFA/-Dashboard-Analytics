import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import './chartSetup';
import { temaCores } from './chartSetup';
import { MetricasPorCanal } from '@dashboard/shared';

interface Props {
  canais: MetricasPorCanal[];
}

export const ChannelDonutChart: React.FC<Props> = ({ canais }) => {
  const canaisComInvestimento = canais.filter((c) => c.investimento > 0);

  const data = {
    labels: canaisComInvestimento.map((c) => c.nomeExibicao),
    datasets: [
      {
        data: canaisComInvestimento.map((c) => c.investimento),
        backgroundColor: canaisComInvestimento.map((c) =>
          c.canal === 'google_ads' ? temaCores.canais.google_ads : temaCores.canais.meta_ads
        ),
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 10,
        callbacks: {
          label: (context: any) => {
            const val = context.raw || 0;
            return ` R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
          },
        },
      },
    },
    cutout: '72%',
  };

  return (
    <div className="w-full h-64 flex items-center justify-center">
      <Doughnut data={data} options={options} />
    </div>
  );
};

