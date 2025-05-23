
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
import { useAuth } from '@/contexts/AuthContext'; // Corrected import path
import { useToast } from '@/hooks/use-toast'; // Corrected import path

// Define the BrewCrafterLogo component directly here
// SVG was removed due to parsing issues. We'll use text for now.

export function Header() {
  const { isAdminAuthenticated, logout, login } = useAuth();
  const { toast } = useToast(); // Ensure useToast is called if needed
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleAdminLoginAttempt = async () => {
    setLoginError(null);
    const success = await login(passwordInput);
    if (success) {
      setIsPasswordDialogOpen(false);
      setPasswordInput(''); 
    } else {
      // Error toast is handled by AuthContext's login function if specific error is returned
      // For a generic failure here, or if context's login doesn't show a toast on failure:
      setLoginError("Invalid or expired TOTP code.");
    }
  };

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left side: App Name Link */}
        <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-primary hover:text-primary/90 transition-colors">
          {/* <BrewCrafterLogo className="h-8 w-8" /> SVG removed */}
          <span>BrewCrafter</span>
        </Link>

        {/* Center: Navigation Tabs */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <TopTabs />
        </div>

        {/* Right side: Admin Login/Logout */}
        <div className="flex items-center">
          {isAdminAuthenticated ? (
            <Button variant="ghost" size="sm" onClick={logout} aria-label="Admin Logout">
              <LogOut className="h-5 w-5 mr-2 text-destructive" />
              <span className="text-destructive">Admin connected</span>
            </Button>
          ) : (
            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" aria-label="Admin Login">
                  <LogIn className="h-5 w-5 mr-2" />
                  <span>Admin connection</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Administrator Login</DialogTitle>
                  <DialogDescription>
                    Enter the TOTP code from your authenticator app to access admin features.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="totp-code" className="text-right">
                      6-Digit Code
                    </Label>
                    <Input
                      id="totp-code"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="col-span-3"
                      type="text"
                      maxLength={6}
                      pattern="\d{6}"
                      placeholder="Enter code"
                      autoComplete="one-time-code"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAdminLoginAttempt();
                        }
                      }}
                    />
                  </div>
                  {loginError && (
                    <p className="text-sm text-destructive text-center col-span-4">{loginError}</p>
                  )}
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button type="button" onClick={handleAdminLoginAttempt}>Login</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </header>
  );
}
