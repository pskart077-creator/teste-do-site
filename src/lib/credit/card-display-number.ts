const CARD_DISPLAY_PREFIX = "54388219";

function hashSeed(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function formatCardDisplayNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16).padEnd(16, "0");

  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export function getCardDisplayNumber(seed: string) {
  const normalizedSeed = seed.trim() || "credpagos";
  let suffix = "";
  let counter = 0;

  while (suffix.length < 8) {
    const hash = hashSeed(`${normalizedSeed}:${counter}`);
    suffix += String(hash % 100_000_000).padStart(8, "0");
    counter += 1;
  }

  return formatCardDisplayNumber(`${CARD_DISPLAY_PREFIX}${suffix.slice(0, 8)}`);
}
