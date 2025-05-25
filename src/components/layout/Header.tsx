
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { TopTabs } from '@/components/layout/TopTabs';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, Menu as MenuIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { usePathname } from 'next/navigation';

// SVG Logo has been removed due to persistent parsing errors.

export function Header() {
  const { isAdminAuthenticated, login, logout } = useAuth();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const { toast } = useToast();
  const pathname = usePathname();

  const handleAdminLogin = async () => {
    setLoginError(null);
    const success = await login(passwordInput);
    if (success) {
      setIsPasswordDialogOpen(false);
      setPasswordInput(''); // Clear password input
    } else {
      setLoginError('Invalid or expired TOTP code.'); // Keep error generic
    }
  };

  const handleLogout = () => {
    logout();
  };

  // Close dialog if path changes
  useEffect(() => {
    if (isPasswordDialogOpen) {
      setIsPasswordDialogOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);


  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left side: Brand Name */}
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-semibold text-primary hover:text-primary/90 transition-colors"
          aria-label="BrewCrafter Homepage"
        >
          {/* SVG Logo Removed */}
          <span>BrewCrafter</span>
        </Link>

        {/* Center: Navigation Tabs */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <TopTabs />
        </div>

        {/* Right side: Admin Login/Logout */}
        <div className="flex items-center">
          {isAdminAuthenticated ? (
            <Button onClick={handleLogout} variant="ghost" size="sm" className="text-destructive hover:text-destructive/90 hover:bg-destructive/10">
              <LogOut className="mr-1.5 h-5 w-5 text-destructive" />
              Admin connected
            </Button>
          ) : (
            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" aria-label="Admin Login">
                  <LogIn className="mr-1.5 h-5 w-5" />
                  Admin connection
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Admin Login</DialogTitle>
                  <DialogDescription>
                    Enter the Time-based One-Time Password (TOTP) from your authenticator app to access admin features.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="totp-code" className="text-right">
                      6-Digit Code
                    </Label>
                    <Input
                      id="totp-code"
                      type="text"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="col-span-3"
                      maxLength={6}
                      pattern="\d{6}"
                      placeholder="Enter code"
                    />
                  </div>
                  {loginError && (
                    <p className="text-sm text-center text-destructive col-span-4">{loginError}</p>
                  )}
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button type="button" onClick={handleAdminLogin}>Login</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </header>
  );
}
