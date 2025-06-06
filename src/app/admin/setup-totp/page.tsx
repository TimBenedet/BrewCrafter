
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ShieldAlert, QrCodeIcon } from 'lucide-react';
import { generateTotpQrCodeAction } from '@/app/actions/auth-actions';
import type { AuthActionResult } from '@/types/actions'; // Updated import

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
      setError(result.error || 'An unknown error occurred while generating the QR code.');
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
            Setup TOTP Authentication
          </CardTitle>
          <CardDescription>
            Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.) to set up administrator access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="destructive" className="bg-destructive/10 border-destructive/50 text-destructive">
            <ShieldAlert className="h-5 w-5" />
            <AlertTitle className="font-semibold">Important Security Warning!</AlertTitle>
            <AlertDescription>
              This page is for <strong>initial setup only</strong>. Once you have scanned the QR code and configured your authenticator app, it is strongly recommended to make this page inaccessible again (e.g., by modifying its code to return a 404 error or by removing it from your deployed project) to prevent others from linking their authenticator to your admin account.
            </AlertDescription>
          </Alert>

          {isLoading && (
            <div className="flex flex-col items-center justify-center p-8 space-y-2">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Generating QR code...</p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Generation Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {qrDataURL && !isLoading && (
            <div className="flex flex-col items-center space-y-4">
              <p className="text-sm text-center text-muted-foreground">
                If the QR code does not appear or if you encounter issues, ensure that the `TOTP_SECRET`, `NEXT_PUBLIC_TOTP_ISSUER_NAME`, and `NEXT_PUBLIC_TOTP_ACCOUNT_NAME` environment variables are correctly configured on Vercel and in your `.env.local` file. The `TOTP_SECRET` must be a valid Base32 string.
              </p>
              <div className="p-4 bg-white rounded-lg shadow-inner inline-block">
                <Image
                  src={qrDataURL}
                  alt="TOTP QR Code"
                  width={256}
                  height={256}
                  priority
                />
              </div>
              <p className="text-sm text-center text-muted-foreground">
                After scanning this code, you will be able to use the 6-digit codes generated by your app to log in as an administrator.
              </p>
            </div>
          )}
          <div className="flex justify-center">
            <Button onClick={fetchQrCode} variant="outline" disabled={isLoading}>
              <Loader2 className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : 'hidden'}`} />
              Refresh QR Code
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
