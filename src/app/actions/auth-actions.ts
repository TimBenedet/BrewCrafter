
'use server';

import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import type { AuthActionResult } from '@/types/actions'; // Updated import

export async function generateTotpQrCodeAction(): Promise<AuthActionResult> {
  const secret = process.env.TOTP_SECRET;
  // Use raw environment values
  const rawIssuer = process.env.NEXT_PUBLIC_TOTP_ISSUER_NAME || 'BrewCrafter App';
  const rawAccountName = process.env.NEXT_PUBLIC_TOTP_ACCOUNT_NAME || 'admin';

  if (!secret) {
    console.error('TOTP_SECRET is not set in environment variables.');
    return { success: false, error: 'Server-side TOTP configuration missing.' };
  }

  // Illustrative check for Base32 validity.
  if (!/^[A-Z2-7]+=*$/.test(secret)) {
      console.warn('Warning: TOTP_SECRET may not be a valid Base32 string. It should only contain A-Z and 2-7 characters, optionally ending with = padding.');
      // Depending on severity, you might return an error here.
  }

  try {
    // Speakeasy handles URI encoding for `label` and `issuer`.
    // `label` should be the account name (e.g., 'admin', 'user@example.com').
    // `issuer` is the service name (e.g., 'My Application').
    // Speakeasy will construct the path as `issuer:label` and add `&issuer=issuer` as a query param.
    const otpauthUrl = speakeasy.otpauthURL({
      secret: secret,        // Must be the Base32 string
      label: rawAccountName,   // e.g., "admin"
      issuer: rawIssuer,     // e.g., "BrewCrafter App"
      encoding: 'base32',    // Tells speakeasy the `secret` variable IS Base32
      algorithm: 'SHA1',     // Standard algorithm
      digits: 6,             // Standard number of digits
      period: 30             // Standard period in seconds
    });
    
    console.log('Generated otpauth URL for QR code:', otpauthUrl); // Log for debugging

    const qrDataURL = await qrcode.toDataURL(otpauthUrl);
    return { success: true, qrDataURL: qrDataURL };
  } catch (error) {
    console.error('Error generating TOTP QR code:', error);
    return { success: false, error: 'Error generating TOTP QR code.' };
  }
}

export async function verifyTotpAction(token: string): Promise<AuthActionResult> {
  const secret = process.env.TOTP_SECRET;

  if (!secret) {
    console.error('TOTP_SECRET is not set in environment variables for verification.');
    return { success: false, error: 'Server-side TOTP configuration missing.' };
  }

  if (!token || token.length !== 6 || !/^\d{6}$/.test(token)) {
    return { success: false, error: 'The TOTP code must be 6 digits.' };
  }

  try {
    const verified = speakeasy.totp.verify({
      secret: secret,      // Must be the Base32 string
      encoding: 'base32',  // Tells speakeasy the `secret` variable IS Base32
      token: token,
      window: 1,           // Allows a tolerance of +/- 30 seconds
    });

    if (verified) {
      return { success: true };
    } else {
      return { success: false, error: 'Invalid or expired TOTP code.' };
    }
  } catch (error) {
    console.error('Error verifying TOTP token:', error);
    return { success: false, error: 'Error verifying TOTP token.' };
  }
}
