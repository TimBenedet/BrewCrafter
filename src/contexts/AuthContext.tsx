
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { verifyTotpAction, type AuthActionResult } from '@/app/actions/auth-actions';

interface AuthContextType {
  isAdminAuthenticated: boolean;
  login: (totpCode: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const storedAuthState = localStorage.getItem('isAdminAuthenticated');
      return storedAuthState === 'true';
    }
    return false;
  });
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (isAdminAuthenticated) {
        localStorage.setItem('isAdminAuthenticated', 'true');
      } else {
        localStorage.removeItem('isAdminAuthenticated');
      }
    }
  }, [isAdminAuthenticated]);

  const login = useCallback(async (totpCode: string): Promise<boolean> => {
    if (!totpCode || totpCode.length !== 6) {
      toast({
        title: 'Code Invalide',
        description: 'Veuillez entrer un code à 6 chiffres.',
        variant: 'destructive',
      });
      return false;
    }

    const result: AuthActionResult = await verifyTotpAction(totpCode);

    if (result.success) {
      setIsAdminAuthenticated(true);
      toast({
        title: 'Connexion Admin Réussie',
        description: 'Les fonctionnalités d\'administration sont maintenant activées.',
      });
      return true;
    } else {
      toast({
        title: 'Échec de la connexion',
        description: result.error || 'Code TOTP incorrect ou expiré.',
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
  return context;
};
