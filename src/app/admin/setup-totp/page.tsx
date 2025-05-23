
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ShieldAlert, QrCodeIcon } from 'lucide-react';
import { generateTotpQrCodeAction, type AuthActionResult } from '@/app/actions/auth-actions';

export default function SetupTotpPage() {
  const [qrDataURL, setQrDataURL] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchQrCode = async () => {
    setIsLoading(true);
    setError(null);
    setQrDataURL(null);
    const result: AuthActionResult = await generateTotpQrCodeAction();
    if (result.success && result.qrDataURL) {
      setQrDataURL(result.qrDataURL);
    } else {
      setError(result.error || 'Une erreur inconnue est survenue lors de la génération du QR code.');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchQrCode();
  }, []);

  return (
    <div className="container mx-auto max-w-md py-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <QrCodeIcon className="mr-3 h-7 w-7 text-primary" />
            Configuration de l'Authentification TOTP
          </CardTitle>
          <CardDescription>
            Scannez ce QR code avec votre application d'authentification (Google Authenticator, Authy, etc.) pour configurer l'accès administrateur.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="destructive" className="bg-destructive/10 border-destructive/50 text-destructive">
            <ShieldAlert className="h-5 w-5" />
            <AlertTitle className="font-semibold">Avertissement de Sécurité Important !</AlertTitle>
            <AlertDescription>
              Cette page est destinée à la **configuration initiale unique**. Une fois que vous avez scanné le QR code et configuré votre application d'authentification, il est fortement recommandé de rendre cette page inaccessible (par exemple, en la modifiant pour qu'elle renvoie une erreur 404 ou en la supprimant de votre projet déployé) pour empêcher d'autres personnes de lier leur authentificateur à votre compte administrateur.
            </AlertDescription>
          </Alert>

          {isLoading && (
            <div className="flex flex-col items-center justify-center p-8 space-y-2">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Génération du QR code...</p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Erreur de Génération</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {qrDataURL && !isLoading && (
            <div className="flex flex-col items-center space-y-4">
              <p className="text-sm text-center text-muted-foreground">
                Si le QR code n'apparaît pas ou si vous rencontrez des problèmes, assurez-vous que les variables d'environnement `TOTP_SECRET`, `NEXT_PUBLIC_TOTP_ISSUER_NAME`, et `NEXT_PUBLIC_TOTP_ACCOUNT_NAME` sont correctement configurées sur Vercel et dans votre fichier `.env.local`.
              </p>
              <div className="p-4 bg-white rounded-lg shadow-inner inline-block">
                <Image
                  src={qrDataURL}
                  alt="QR Code TOTP"
                  width={256}
                  height={256}
                  priority
                />
              </div>
              <p className="text-sm text-center text-muted-foreground">
                Après avoir scanné ce code, vous pourrez utiliser les codes à 6 chiffres générés par votre application pour vous connecter en tant qu'administrateur.
              </p>
            </div>
          )}
          <div className="flex justify-center">
            <Button onClick={fetchQrCode} variant="outline" disabled={isLoading}>
              <Loader2 className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : 'hidden'}`} />
              Rafraîchir le QR Code
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
