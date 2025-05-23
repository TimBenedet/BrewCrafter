
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
  // Use raw values from env, then encode them
  const rawIssuer = process.env.NEXT_PUBLIC_TOTP_ISSUER_NAME || 'BrewCrafter App';
  const rawAccountName = process.env.NEXT_PUBLIC_TOTP_ACCOUNT_NAME || 'admin';

  if (!secret) {
    console.error('TOTP_SECRET is not set in environment variables.');
    return { success: false, error: 'Configuration TOTP manquante côté serveur.' };
  }

  // Illustrative check for Base32 validity. A production app might have more robust validation
  // or ensure the secret is correctly formatted when set.
  if (!/^[A-Z2-7]+=*$/.test(secret)) {
      console.warn('Warning: TOTP_SECRET may not be a valid Base32 string. It should only contain A-Z and 2-7 characters, optionally ending with = padding.');
      // Depending on strictness, you might return an error here.
      // For now, we'll let speakeasy attempt to use it.
  }

  try {
    // Explicitly URL encode the components for the label and the issuer parameter
    const encodedIssuer = encodeURIComponent(rawIssuer);
    const encodedAccountName = encodeURIComponent(rawAccountName);

    // The label for otpauthURL typically forms the path part of the URL.
    // e.g., otpauth://totp/Issuer:AccountName?secret=...&issuer=Issuer
    // The label parameter to speakeasy.otpauthURL is this path part.
    const otpLabel = `${encodedIssuer}:${encodedAccountName}`;

    const otpauthUrl = speakeasy.otpauthURL({
      secret: secret,       // This is assumed to be the Base32 secret string from env
      label: otpLabel,      // e.g., "BrewCrafter%20App:admin"
      issuer: encodedIssuer,  // e.g., "BrewCrafter%20App" for the query parameter
      encoding: 'base32',   // Tells speakeasy the 'secret' variable IS Base32
      algorithm: 'SHA1',    // Explicitly set common algorithm
      digits: 6,            // Explicitly set common digit count
      period: 30            // Explicitly set common period
    });
    
    console.log('Generated otpauth URL for QR code:', otpauthUrl); // Log the URL for debugging

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
      secret: secret,      // Assumed to be the Base32 secret string from env
      encoding: 'base32',  // Tells speakeasy the 'secret' variable IS Base32
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
    return { success: false, error: 'Erreur lors de la vérification du token TOTP.' };
  }
}
