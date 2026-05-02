import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT_KEY_LEN = 64;
const SCRYPT_N = 16_384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;

function toBase64(value: Buffer) {
  return value.toString("base64");
}

function fromBase64(value: string) {
  return Buffer.from(value, "base64");
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

export function generateOpaqueToken(bytes = 48) {
  return randomBytes(bytes).toString("base64url");
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, SCRYPT_KEY_LEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  }) as Buffer;

  return `s2$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${toBase64(salt)}$${toBase64(derived)}`;
}

export async function verifyPassword(password: string, stored: string) {
  const parts = stored.split("$");
  if (!parts.length) {
    return false;
  }

  // Backward compatibility: some seeded users may still have the legacy `s1` hash format.
  if (parts[0] === "s1" && parts.length === 3) {
    const salt = parts[1];
    const expectedHex = parts[2];
    if (!salt || !expectedHex) {
      return false;
    }

    const candidateHex = scryptSync(password, salt, 64).toString("hex");
    const expected = Buffer.from(expectedHex, "hex");
    const candidate = Buffer.from(candidateHex, "hex");
    if (expected.length !== candidate.length) {
      return false;
    }
    return timingSafeEqual(candidate, expected);
  }

  if (parts[0] === "s2" && parts.length === 6) {
    const N = Number(parts[1]);
    const r = Number(parts[2]);
    const p = Number(parts[3]);
    const salt = fromBase64(parts[4] ?? "");
    const expected = fromBase64(parts[5] ?? "");

    if (!N || !r || !p || !salt.length || !expected.length) {
      return false;
    }

    const derived = scryptSync(password, salt, expected.length, {
      N,
      r,
      p,
    }) as Buffer;

    return timingSafeEqual(derived, expected);
  }

  return false;
}
