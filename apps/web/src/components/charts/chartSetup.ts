import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Registrar estritamente os módulos utilizados (Section 11.3 do PDF)
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const temaCores = {
  primaria: '#2563eb', // Azul Royal
  primariaSuave: 'rgba(37, 99, 235, 0.1)',
  secundaria: '#0ea5e9', // Ciano
  neutra: '#94a3b8', // Slate / Cinza para o comparativo tracejado
  verde: '#10b981', // Sucesso
  vermelho: '#ef4444', // Alerta
  amarelo: '#f59e0b',
  roxo: '#8b5cf6',
  canais: {
    google_ads: '#4285f4',
    meta_ads: '#0081fb',
    ga4: '#ea4335',
    instagram: '#e1306c',
  },
};

