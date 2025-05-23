
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
  // Utiliser les valeurs brutes de l'environnement
  const rawIssuer = process.env.NEXT_PUBLIC_TOTP_ISSUER_NAME || 'BrewCrafter App';
  const rawAccountName = process.env.NEXT_PUBLIC_TOTP_ACCOUNT_NAME || 'admin';

  if (!secret) {
    console.error('TOTP_SECRET is not set in environment variables.');
    return { success: false, error: 'Configuration TOTP manquante côté serveur.' };
  }

  // Vérification illustrative de la validité Base32.
  if (!/^[A-Z2-7]+=*$/.test(secret)) {
      console.warn('Warning: TOTP_SECRET may not be a valid Base32 string. It should only contain A-Z and 2-7 characters, optionally ending with = padding.');
      // En fonction de la sévérité, vous pourriez retourner une erreur ici.
  }

  try {
    // Speakeasy s'occupe de l'encodage URI pour `label` et `issuer`.
    // `label` doit être le nom du compte (ex: 'admin', 'user@example.com').
    // `issuer` est le nom du service (ex: 'Mon Application').
    // Speakeasy va construire le chemin comme `issuer:label` et ajouter `&issuer=issuer` en query param.
    const otpauthUrl = speakeasy.otpauthURL({
      secret: secret,        // Doit être la chaîne Base32
      label: rawAccountName,   // e.g., "admin"
      issuer: rawIssuer,     // e.g., "BrewCrafter App"
      encoding: 'base32',    // Indique à speakeasy que la variable `secret` EST Base32
      algorithm: 'SHA1',     // Algorithme standard
      digits: 6,             // Nombre de chiffres standard
      period: 30             // Période standard en secondes
    });
    
    console.log('Generated otpauth URL for QR code:', otpauthUrl); // Log pour débogage

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
      secret: secret,      // Doit être la chaîne Base32
      encoding: 'base32',  // Indique à speakeasy que la variable `secret` EST Base32
      token: token,
      window: 1,           // Permet une tolérance de +/- 30 secondes
    });

    if (verified) {
      return { success: true };
    } else {
      return { success: false, error: 'Code TOTP invalide ou expiré.' };
    }
  } catch (error) {
    console.error('Error verifying TOTP token:', error);
    return { success: false, error: 'Erreur lors de la vérification du token TOTP.' };
  }
}
