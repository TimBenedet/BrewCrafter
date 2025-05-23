
'use client';

import React, { useState, useEffect } from 'react';
import { generateTotpQrCodeAction } from '@/app/actions/auth-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ShieldCheck, ShieldAlert, QrCodeIcon, AlertTriangle } from 'lucide-react';
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

  return (
    <div className="container mx-auto max-w-md py-12">
      <Alert variant="destructive" className="mb-6">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle className="font-bold">AVERTISSEMENT DE SÉCURITÉ IMPORTANT</AlertTitle>
        <AlertDescription>
          Cette page est destinée à la **configuration initiale unique** du TOTP par l'administrateur.
          Une fois votre application d'authentification configurée, il est fortement recommandé de rendre cette page inaccessible (par exemple, en supprimant le fichier ou en la protégeant) dans un environnement de production pour empêcher toute configuration non autorisée.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <QrCodeIcon className="mr-2 h-6 w-6 text-primary" />
            Configuration de l'Authentification TOTP
          </CardTitle>
          <CardDescription>
            Scannez ce QR code avec votre application d'authentification (Google Authenticator, Authy, etc.) pour configurer l'accès admin.
            Ceci ne doit être fait qu'une seule fois.
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
                    <li>Scannez ce QR code une seule fois avec votre application d'authentification préférée.</li>
                    <li>Gardez votre `TOTP_SECRET` (la variable d'environnement) en sécurité. Ne le partagez jamais.</li>
                    <li>Une fois la configuration terminée, cette page `/admin/setup-totp` devrait être sécurisée ou supprimée pour la production.</li>
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
        </CardContent>
      </Card>
    </div>
  );
}
