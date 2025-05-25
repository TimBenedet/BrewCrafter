
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { TopTabs } from '@/components/layout/TopTabs';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut } from 'lucide-react';
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

// SVG Logo component removed due to persistent parsing errors

export function Header() {
  const { isAdminAuthenticated, login, logout } = useAuth();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const { toast } = useToast(); // loginError state removed as toast is handled by context

  const handleAdminLogin = async () => {
    const success = await login(passwordInput);
    if (success) {
      setIsPasswordDialogOpen(false);
      setPasswordInput(''); // Clear password input
    }
    // Error toast is handled within the login function of AuthContext
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-1 text-xl font-semibold text-primary hover:text-primary/90 transition-colors"
        >
          {/* BrewCrafterLogo component usage removed */}
          <span>BrewCrafter</span>
        </Link>

        <div className="absolute left-1/2 transform -translate-x-1/2">
          <TopTabs />
        </div>

        <div className="flex items-center gap-2">
          {isAdminAuthenticated ? (
            <Button onClick={handleLogout} variant="ghost" size="sm" className="text-destructive hover:text-destructive/90">
              <LogOut className="h-4 w-4 mr-1.5 text-destructive" />
              Admin connected
            </Button>
          ) : (
            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" aria-label="Admin Login">
                  <LogIn className="h-4 w-4 mr-1.5" />
                  Admin connection
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Admin Login</DialogTitle>
                  <DialogDescription>
                    Enter the 6-digit authentication code (TOTP) to access admin features.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="totp-code" className="text-right">
                      Code
                    </Label>
                    <Input
                      id="totp-code"
                      type="text"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="col-span-3"
                      maxLength={6}
                      pattern="\d{6}"
                      placeholder="6-digit code"
                    />
                  </div>
                  {/* loginError display removed as toast is handled by context */}
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="button" onClick={handleAdminLogin}>
                    Login
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </header>
  );
}
