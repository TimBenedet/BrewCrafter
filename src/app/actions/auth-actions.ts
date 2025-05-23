
'use server';

import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

export interface AuthActionResult {
  success: boolean;
  error?: string;
  qrDataURL?: string;
}

export async function generateTotpQrCodeAction(): Promise<AuthActionResult> {
  const secret = process.env.TOTP_SECRET;
  const issuer = process.env.NEXT_PUBLIC_TOTP_ISSUER_NAME || 'BrewCrafter App';
  const accountName = process.env.NEXT_PUBLIC_TOTP_ACCOUNT_NAME || 'admin';

  if (!secret) {
    console.error('TOTP_SECRET is not set in environment variables.');
    return { success: false, error: 'Configuration TOTP manquante côté serveur.' };
  }

  try {
    const otpauthUrl = speakeasy.otpauthURL({
      secret: secret,
      label: `${issuer}:${accountName}`,
      issuer: issuer,
      encoding: 'base32',
    });

    const qrDataURL = await qrcode.toDataURL(otpauthUrl);
    return { success: true, qrDataURL: qrDataURL };
  } catch (error) {
    console.error('Error generating TOTP QR code:', error);
    return { success: false, error: 'Erreur lors de la génération du QR code TOTP.' };
  }
}

export async function verifyTotpAction(token: string): Promise<AuthActionResult> {
  const secret = process.env.TOTP_SECRET;

  if (!secret) {
    console.error('TOTP_SECRET is not set in environment variables for verification.');
    return { success: false, error: 'Configuration TOTP manquante côté serveur.' };
  }

  if (!token || token.length !== 6 || !/^\d{6}$/.test(token)) {
    return { success: false, error: 'Le code TOTP doit être composé de 6 chiffres.' };
  }

  try {
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 1, // Allows for a 30-second window before and after current time
    });

    if (verified) {
      return { success: true };
    } else {
      return { success: false, error: 'Code TOTP invalide ou expiré.' };
    }
  } catch (error) {
    console.error('Error verifying TOTP token:', error);
    return { success: false, error: 'Er