
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  isAdminAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const { toast } = useToast();

  const login = useCallback((password: string): boolean => {
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setIsAdminAuthenticated(true);
      toast({
        title: 'Connexion Admin Réussie',
        description: 'Les fonctionnalités d\'administration sont maintenant activées.',
      });
      return true;
    } else {
      toast({
        title: 'Échec de la connexion',
        description: 'Mot de passe incorrect.',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  const logout = useCallback(() => {
    setIsAdminAuthenticated(false);
    toast({ title: 'Déconnexion Admin', description: 'Vous êtes déconnecté.' });
  }, [toast]);

  return (
    <AuthContext.Provider value={{ isAdminAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  