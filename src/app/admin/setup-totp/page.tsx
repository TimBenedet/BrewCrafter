'use client';

import React, { useState, useEffect } from 'react';
import { generateTotpQrCodeAction } from '@/app/actions/auth-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ShieldCheck, ShieldAlert, QrCodeIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function SetupTotpPage() {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchQrCode = async () => {
      setIsLoading(true);
      setError(null);
      const result = await generateTotpQrCodeAction();
      if (result.success && result.qrDataURL) {
        setQrCodeUrl(result.qrDataURL);
      } else {
        setError(result.error || 'Impossible de générer le QR code.');
      }
      setIsLoading(false);
    };

    fetchQrCode();
  }, []);

  // Example of how an admin might generate a secret if they don't have one
  // This should NOT be run in production client-side like this.
  // It's here for illustrative purposes for the admin.
  const handleGenerateSecretExample = () => {
    // This is an example. In a real scenario, you'd run this in a secure environment
    // (e.g., a local script) and then set the TOTP_SECRET environment variable.
    // const secret = speakeasy.generateSecret({ length: 32, name: process.env.NEXT_PUBLIC_TOTP_ISSUER_NAME });
    // console.log('Example generated secret (base32):', secret.base32);
    // alert(`Example generated secret (base32): ${secret.base32}. Store this securely as TOTP_SECRET.`);
    alert("Pour générer un nouveau secret, utilisez un outil sécurisé (comme un script local avec 'speakeasy') puis configurez la variable d'environnement TOTP_SECRET sur Vercel et dans votre .env.local. Ne le faites que si vous comprenez les implications de sécurité.");
  };


  return (
    <div className="container mx-auto max-w-md py-12">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <QrCodeIcon className="mr-2 h-6 w-6 text-primary" />
            Configuration de l'Authentification TOTP
          </CardTitle>
          <CardDescription>
            Scannez ce QR code avec votre application d'authentification (Google Authenticator, Authy, etc.) pour configurer l'accès admin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p>Génération du QR code...</p>
            </div>
          )}

          {error && !isLoading && (
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>Erreur de Configuration</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {qrCodeUrl && !isLoading && !error && (
            <div className="flex flex-col items-center space-y-4">
              <p className="text-sm text-center">
                Si vous n'avez pas encore configuré votre variable d'environnement `TOTP_SECRET`, veuillez le faire avant de scanner.
                Ce QR code est basé sur la variable `TOTP_SECRET` de votre environnement.
              </p>
              <div className="p-2 bg-white rounded-lg shadow-md inline-block">
                <Image src={qrCodeUrl} alt="QR Code TOTP" width={256} height={256} priority />
              </div>
              <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertTitle>Instructions Importantes</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    <li>Scannez ce QR code avec votre application d'authentification préférée.</li>
                    <li>Gardez votre secret TOTP (la variable d'environnement `TOTP_SECRET`) en sécurité. Ne le partagez jamais.</li>
                    <li>Si vous perdez l'accès à votre application d'authentification, vous devrez reconfigurer le `TOTP_SECRET` et re-scanner.</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          )}
          <div className="pt-4 text-center">
            <Button variant="outline" asChild>
              <Link href="/">Retour à l'accueil</Link>
            </Button>
          </div>
           {/* <div className="pt-4 text-center">
            <Button variant="link" size="sm" onClick={handleGenerateSecretExample} className="text-xs text-muted-foreground">
              (Admin Dev: Aide pour générer un nouveau secret)
            </Button>
          </div> */}
        </CardContent>
      </Card>
    </div>
  );
}