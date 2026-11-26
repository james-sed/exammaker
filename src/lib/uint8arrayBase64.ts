/**
 * `unpdf` bundles a PDF.js build that installs its own `Uint8Array` base64
 * helpers the first time it is imported. Those helpers ignore the standard
 * options (`alphabet`, `omitPadding`), so they always return regular, padded
 * base64 even when base64url was requested.
 *
 * `jose` (used by Auth.js) prefers `Uint8Array.prototype.toBase64` whenever it
 * exists. In a long-lived Node process that has extracted a PDF, the broken
 * helper therefore turns Auth.js session cookies into invalid base64url, and
 * every request fails with `JWEInvalid`.
 *
 * Installing a conformant implementation before `unpdf` loads makes PDF.js
 * skip its own (it only defines the helper when it is missing). Replacing an
 * already-broken global also repairs a process where the import order was
 * reversed.
 */

type Base64Alphabet = "base64" | "base64url";

interface ToBase64Options {
  alphabet?: Base64Alphabet;
  omitPadding?: boolean;
}

interface FromBase64Options {
  alphabet?: Base64Alphabet;
}

type ToBase64 = (options?: ToBase64Options) => string;
type FromBase64 = (
  encoded: string,
  options?: FromBase64Options
) => Uint8Array;

// 0xFB 0xFF 0xBE encodes to "+/++" in base64 and "-_--" in base64url.
const PROBE = new Uint8Array([0xfb, 0xff, 0xbe]);
const PROBE_BASE64URL = "-_--";

function normalizeAlphabet(value: string | undefined): Base64Alphabet {
  if (value === undefined) return "base64";
  if (value === "base64" || value === "base64url") return value;
  throw new TypeError(`Invalid base64 alphabet: ${value}`);
}

function toBase64(this: Uint8Array, options: ToBase64Options = {}): string {
  const alphabet = normalizeAlphabet(options.alphabet);
  const omitPadding = options.omitPadding ?? false;
  const base64 = Buffer.from(
    this.buffer,
    this.byteOffset,
    this.byteLength
  ).toString("base64");

  const encoded =
    alphabet === "base64url"
      ? base64.replace(/\+/g, "-").replace(/\//g, "_")
      : base64;

  return omitPadding ? encoded.replace(/=+$/, "") : encoded;
}

function fromBase64(
  encoded: string,
  options: FromBase64Options = {}
): Uint8Array {
  const alphabet = normalizeAlphabet(options.alphabet);
  const base64 =
    alphabet === "base64url"
      ? encoded.replace(/-/g, "+").replace(/_/g, "/")
      : encoded;

  // Copy out of Buffer's pooled storage so callers own a plain Uint8Array.
  return new Uint8Array(Buffer.from(base64, "base64"));
}

function isConformantToBase64(candidate: unknown): candidate is ToBase64 {
  if (typeof candidate !== "function") return false;

  try {
    return (
      (candidate as ToBase64).call(PROBE, {
        alphabet: "base64url",
        omitPadding: true,
      }) === PROBE_BASE64URL
    );
  } catch {
    return false;
  }
}

function isConformantFromBase64(candidate: unknown): candidate is FromBase64 {
  if (typeof candidate !== "function") return false;

  try {
    const decoded = (candidate as FromBase64)(PROBE_BASE64URL, {
      alphabet: "base64url",
    });

    return (
      decoded.length === 3 &&
      decoded[0] === 0xfb &&
      decoded[1] === 0xff &&
      decoded[2] === 0xbe
    );
  } catch {
    return false;
  }
}

/**
 * Ensures `Uint8Array.prototype.toBase64` and `Uint8Array.fromBase64` follow
 * the TC39 proposal (including the `base64url` alphabet and `omitPadding`).
 * Idempotent, and a no-op outside Node where `Buffer` is unavailable.
 */
export function ensureUint8ArrayBase64Polyfill(): void {
  if (typeof Uint8Array === "undefined" || typeof Buffer === "undefined") {
    return;
  }

  const prototype = Uint8Array.prototype as unknown as {
    toBase64?: unknown;
  };
  const constructor = Uint8Array as unknown as { fromBase64?: unknown };

  if (!isConformantToBase64(prototype.toBase64)) {
    Object.defineProperty(prototype, "toBase64", {
      value: toBase64,
      writable: true,
      configurable: true,
      enumerable: false,
    });
  }

  if (!isConformantFromBase64(constructor.fromBase64)) {
    Object.defineProperty(constructor, "fromBase64", {
      value: fromBase64,
      writable: true,
      configurable: true,
      enumerable: false,
    });
  }
}
