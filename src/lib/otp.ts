import crypto from "crypto";

/**
 * Generate a 6-digit OTP based on a secret key.
 * Custom TOTP algorithm with 2-minute window.
 */
export function generateOtp(secret: string): string {
  // Convert secret to buffer
  const key = Buffer.from(secret, "hex");

  // Get current time step (120s window)
  const step = 120; // 2 minutes
  const counter = Math.floor(Date.now() / 1000 / step);

  // Create HMAC-SHA1 digest
  const hmac = crypto.createHmac("sha1", key);
  const buffer = Buffer.alloc(8);
  buffer.writeUInt32BE(0, 0); // high bits
  buffer.writeUInt32BE(counter, 4); // low bits
  hmac.update(buffer);
  const digest = hmac.digest();

  // Dynamic truncation
  const offset = digest[digest.length - 1] & 0xf;
  const code =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  // Modulo to get 6 digits
  const otp = (code % 1_000_000).toString().padStart(6, "0");

  return otp;
}
