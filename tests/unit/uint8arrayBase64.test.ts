import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ensureUint8ArrayBase64Polyfill } from "@/lib/uint8arrayBase64";

type Base64Alphabet = "base64" | "base64url";
type ToBase64 = (options?: {
  alphabet?: Base64Alphabet;
  omitPadding?: boolean;
}) => string;
type FromBase64 = (
  encoded: string,
  options?: { alphabet?: Base64Alphabet }
) => Uint8Array;

const originalToBase64 = Object.getOwnPropertyDescriptor(
  Uint8Array.prototype,
  "toBase64"
);
const originalFromBase64 = Object.getOwnPropertyDescriptor(
  Uint8Array,
  "fromBase64"
);

const prototype = Uint8Array.prototype as unknown as { toBase64?: unknown };
const constructor = Uint8Array as unknown as { fromBase64?: unknown };

function encode(
  bytes: Uint8Array,
  options?: Parameters<ToBase64>[0]
): string {
  const fn = prototype.toBase64 as ToBase64 | undefined;
  if (typeof fn !== "function") throw new Error("toBase64 is not installed");
  return fn.call(bytes, options);
}

function decode(
  value: string,
  options?: Parameters<FromBase64>[1]
): Uint8Array {
  const fn = constructor.fromBase64 as FromBase64 | undefined;
  if (typeof fn !== "function") throw new Error("fromBase64 is not installed");
  return fn(value, options);
}

function restore(
  target: object,
  key: string,
  descriptor: PropertyDescriptor | undefined
): void {
  if (descriptor) {
    Object.defineProperty(target, key, descriptor);
  } else {
    Reflect.deleteProperty(target, key);
  }
}

beforeEach(() => {
  Reflect.deleteProperty(Uint8Array.prototype, "toBase64");
  Reflect.deleteProperty(Uint8Array, "fromBase64");
});

afterEach(() => {
  restore(Uint8Array.prototype, "toBase64", originalToBase64);
  restore(Uint8Array, "fromBase64", originalFromBase64);
});

describe("ensureUint8ArrayBase64Polyfill", () => {
  it("installs the helpers when the runtime does not provide them", () => {
    expect(prototype.toBase64).toBeUndefined();
    expect(constructor.fromBase64).toBeUndefined();

    ensureUint8ArrayBase64Polyfill();

    expect(typeof prototype.toBase64).toBe("function");
    expect(typeof constructor.fromBase64).toBe("function");
  });

  it("encodes standard base64 with padding by default", () => {
    ensureUint8ArrayBase64Polyfill();

    expect(encode(new Uint8Array([0xfb, 0xff, 0xbe]))).toBe("+/++");
    expect(encode(new Uint8Array([0xfb, 0xff]))).toBe("+/8=");
  });

  it("honours the base64url alphabet and omitPadding", () => {
    ensureUint8ArrayBase64Polyfill();
    const threeBytes = new Uint8Array([0xfb, 0xff, 0xbe]);
    const twoBytes = new Uint8Array([0xfb, 0xff]);

    expect(
      encode(threeBytes, { alphabet: "base64url", omitPadding: true })
    ).toBe("-_--");
    expect(encode(twoBytes, { alphabet: "base64url" })).toBe("-_8=");
    expect(
      encode(twoBytes, { alphabet: "base64url", omitPadding: true })
    ).toBe("-_8");
    expect(encode(twoBytes, { alphabet: "base64", omitPadding: true })).toBe(
      "+/8"
    );
  });

  it("decodes both alphabets, with or without padding", () => {
    ensureUint8ArrayBase64Polyfill();

    expect(Array.from(decode("-_--", { alphabet: "base64url" }))).toEqual([
      0xfb, 0xff, 0xbe,
    ]);
    expect(Array.from(decode("-_8", { alphabet: "base64url" }))).toEqual([
      0xfb, 0xff,
    ]);
    expect(Array.from(decode("+/8="))).toEqual([0xfb, 0xff]);
  });

  it("round-trips arbitrary bytes in both alphabets", () => {
    ensureUint8ArrayBase64Polyfill();
    const bytes = new Uint8Array(
      Array.from({ length: 256 }, (_, index) => index)
    );

    for (const alphabet of ["base64", "base64url"] as const) {
      const encoded = encode(bytes, { alphabet, omitPadding: true });
      expect(Array.from(decode(encoded, { alphabet }))).toEqual(
        Array.from(bytes)
      );
    }
  });

  it("replaces the broken polyfill installed by unpdf", () => {
    // Mirrors PDF.js: ignores the options object and always returns padded
    // standard base64; `atob` rejects the base64url characters.
    function brokenToBase64(this: Uint8Array): string {
      let binary = "";
      for (let index = 0; index < this.length; index += 32768) {
        binary += String.fromCharCode(
          ...this.subarray(index, index + 32768)
        );
      }
      return btoa(binary);
    }
    function brokenFromBase64(encoded: string): Uint8Array {
      return Uint8Array.from(atob(encoded), (character) =>
        character.charCodeAt(0)
      );
    }

    Object.defineProperty(Uint8Array.prototype, "toBase64", {
      value: brokenToBase64,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(Uint8Array, "fromBase64", {
      value: brokenFromBase64,
      writable: true,
      configurable: true,
    });

    expect(
      encode(new Uint8Array([0xfb, 0xff, 0xbe]), {
        alphabet: "base64url",
        omitPadding: true,
      })
    ).toBe("+/++");

    ensureUint8ArrayBase64Polyfill();

    expect(
      encode(new Uint8Array([0xfb, 0xff, 0xbe]), {
        alphabet: "base64url",
        omitPadding: true,
      })
    ).toBe("-_--");
    expect(Array.from(decode("-_--", { alphabet: "base64url" }))).toEqual([
      0xfb, 0xff, 0xbe,
    ]);
  });

  it("is idempotent and leaves a conformant implementation alone", () => {
    ensureUint8ArrayBase64Polyfill();
    const firstToBase64 = prototype.toBase64;
    const firstFromBase64 = constructor.fromBase64;

    ensureUint8ArrayBase64Polyfill();

    expect(prototype.toBase64).toBe(firstToBase64);
    expect(constructor.fromBase64).toBe(firstFromBase64);
  });
});
