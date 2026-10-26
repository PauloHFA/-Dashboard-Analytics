import React, { createContext, useContext, useState, useEffect } from 'react';
import { Usuario } from '@dashboard/shared';
import { fetchApi } from '../services/api';

interface AuthContextType {
  usuario: Usuario | null;
  carregando: boolean;
  loginComo: (usuarioId: string) => void;
  usuariosDisponiveis: { id: string; nome: string; perfil: string; email: string }[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  const usuariosDisponiveis = [
    { id: 'usr-rick', nome: 'Rick (Colaborador)', perfil: 'Admin (Agência)', email: 'rickphtb@gmail.com' },
    { id: 'usr-admin', nome: 'Ricardo Cardoso', perfil: 'Diretor (Agência)', email: 'admin@agencia.com' },
    { id: 'usr-gestor', nome: 'Mariana Gestora', perfil: 'Gestor (3 Clientes)', email: 'gestor@agencia.com' },
    { id: 'usr-cliente-01', nome: 'Carlos Mendes', perfil: 'Cliente (TechNova)', email: 'carlos@technova.com.br' },
  ];

  const carregarUsuario = async (userId: string) => {
    try {
      setCarregando(true);
      localStorage.setItem('auth_token', userId);
      const res = await fetchApi<{ usuario: Usuario }>('/auth/me');
      setUsuario(res.usuario);
    } catch (err) {
      console.error('Falha ao autenticar:', err);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token') || 'usr-rick';
    carregarUsuario(savedToken);
  }, []);

  const loginComo = (usuarioId: string) => {
    carregarUsuario(usuarioId);
  };

  return (
    <AuthContext.Provider value={{ usuario, carregando, loginComo, usuariosDisponiveis }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser utilizado dentro de AuthProvider');
  return context;
};

