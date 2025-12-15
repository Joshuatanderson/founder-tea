import { createHmac, timingSafeEqual, randomInt } from "crypto";

// Use a long, random secret. Generate with: openssl rand -hex 32
const SECRET = process.env.VERIFICATION_SECRET!;
const EXPIRY_MINUTES = 10;
const CODE_LENGTH = 6;

export interface Challenge {
  token: string; // What we return to client
  code: string; // What we send via email
  expiresAt: number; // Timestamp for client to show countdown
}

export interface VerificationResult {
  valid: boolean;
  email?: string; // Return email so caller can look up eligible groups
  error?: string;
}

/**
 * Creates a stateless verification challenge.
 *
 * The returned token contains: expiry.hmac
 * The HMAC is computed over: email|code|expiry
 *
 * This means:
 * - Token alone reveals nothing about email or code
 * - Valid submission requires knowing email + code + having unexpired token
 * - No database storage needed
 * - Group selection happens AFTER verification
 */
export function createChallenge(email: string): Challenge {
  // Generate random 6-digit code
  const code = generateSecureCode(CODE_LENGTH);

  // Set expiry
  const expiresAt = Date.now() + EXPIRY_MINUTES * 60 * 1000;

  // Compute HMAC over verification data (no groupId - that's determined by domain)
  const hmac = computeHmac(email, code, expiresAt);

  // Token format: expiry.hmac
  const token = `${expiresAt}.${hmac}`;

  return { token, code, expiresAt };
}

/**
 * Verifies a challenge submission.
 *
 * Recomputes the HMAC using provided email + code + token data.
 * If it matches, all inputs are correct and unexpired.
 *
 * Returns the verified email so the caller can look up eligible groups.
 */
export function verifyChallenge(
  token: string,
  email: string,
  code: string
): VerificationResult {
  // Parse token
  const parts = token.split(".");
  if (parts.length !== 2) {
    return { valid: false, error: "Invalid token format" };
  }

  const [expiryStr, providedHmac] = parts;
  const expiresAt = parseInt(expiryStr, 10);

  // Check expiry
  if (isNaN(expiresAt)) {
    return { valid: false, error: "Invalid token format" };
  }
  if (Date.now() > expiresAt) {
    return { valid: false, error: "Verification code expired" };
  }

  // Recompute HMAC
  const expectedHmac = computeHmac(email, code, expiresAt);

  // Constant-time comparison (prevents timing attacks)
  if (!safeCompare(providedHmac, expectedHmac)) {
    return { valid: false, error: "Invalid verification code" };
  }

  return { valid: true, email: email.toLowerCase() };
}

/**
 * Computes HMAC-SHA256 over the verification data.
 */
function computeHmac(
  email: string,
  code: string,
  expiresAt: number
): string {
  const data = `${email.toLowerCase()}|${code}|${expiresAt}`;
  return createHmac("sha256", SECRET).update(data).digest("hex");
}

/**
 * Generates a cryptographically secure random code.
 */
function generateSecureCode(length: number): string {
  const max = Math.pow(10, length);
  const min = Math.pow(10, length - 1);
  return randomInt(min, max).toString();
}

/**
 * Constant-time string comparison.
 * Prevents timing attacks where attacker measures response time
 * to guess correct characters.
 */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
