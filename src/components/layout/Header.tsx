
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

// Define the BrewCrafterLogo component directly here (commented out due to previous parsing issues with complex SVGs)
// If you have a simple SVG or want to try again, you can place it here.
// const BrewCrafterLogo = (props: React.SVGProps<SVGSVGElement>) => (
//   <svg /* your svg content */ ></svg>
// );

export function Header() {
  const { isAdminAuthenticated, login, logout } = useAuth();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAdminLogin = async () => {
    setLoginError(null);
    const success = await login(passwordInput);
    if (success) {
      setIsPasswordDialogOpen(false);
      setPasswordInput(''); // Clear password input
    } else {
      // The toast is already handled in AuthContext's login function
      // but you could set a specific dialog error here if needed.
      // For now, the toast from context is sufficient.
      // setLoginError("Invalid password or TOTP code.");
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-semibold text-primary hover:text-primary/90 transition-colors"
        >
          {/* <BrewCrafterLogo className="h-8 w-8" /> */}
          <span>BrewCrafter</span>
        </Link>

        <div className="absolute left-1/2 transform -translate-x-1/2">
          <TopTabs />
        </div>

        <div className="flex items-center gap-2">
          {isAdminAuthenticated ? (
            <Button onClick={handleLogout} variant="ghost" size="sm" className="text-destructive hover:text-destructive/90">
              <LogOut className="h-4 w-4 mr-1.5" />
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
                    Enter the authentication code (TOTP) to access admin features.
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
                  {loginError && (
                    <p className="text-sm text-destructive col-span-4 text-center">{loginError}</p>
                  )}
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
