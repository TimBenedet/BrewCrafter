
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
    if (!totpCode || totpCode.length !== 6 || !/^\d{6}$/.test(totpCode)) {
      toast({
        title: 'Invalid Code',
        description: 'Please enter a 6-digit code.',
        variant: 'destructive',
      });
      return false;
    }

    // For local development, allow a backdoor password if TOTP_SECRET is not set or is "DEBUG_MODE"
    // AND if NEXT_PUBLIC_ADMIN_PASSWORD is set. This is NOT for production.
    if (process.env.NODE_ENV === 'development' && 
        (!process.env.TOTP_SECRET || process.env.TOTP_SECRET === "DEBUG_MODE") &&
        process.env.NEXT_PUBLIC_ADMIN_PASSWORD &&
        totpCode === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setIsAdminAuthenticated(true);
      toast({
        title: 'Admin Login Successful (Dev Mode)',
        description: 'Admin features are now enabled using debug password.',
      });
      return true;
    }
    
    const result: AuthActionResult = await verifyTotpAction(totpCode);

    if (result.success) {
      setIsAdminAuthenticated(true);
      toast({
        title: 'Admin Login Successful',
        description: 'Admin features are now enabled.',
      });
      return true;
    } else {
      toast({
        title: 'Login Failed',
        description: result.error || 'Incorrect or expired TOTP code.',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  const logout = useCallback(() => {
    setIsAdminAuthenticated(false);
    toast({ title: 'Admin Logout', description: 'You have been logged out.' });
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
