import { GlobalUser } from "@/app/context";
import type { UserKeys } from "./schemas";
import { User } from "next-auth";
export const maxSize = () => 4096 / 8 - 2 * (256 / 8) - 2;

export const toHexString = (bytes: Uint8Array) => {
  return Array.from(bytes, (byte) => {
    return ("0" + (byte & 0xff).toString(16)).slice(-2);
  }).join("");
};

export const hexToBytes = (hex: string) => {
  let bytes = [];

  for (let c = 0; c < hex.length; c += 2) {
    // bytes.push(parseInt(hex.substr(c, 2), 16));
    bytes.push(parseInt(hex.slice(c, c + 2), 16));
  }

  return new Uint8Array(bytes);
};

export const genKeyPass = async (pass: string, salt: Uint8Array) => {
  const enc = new TextEncoder();

  const passKey = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(pass),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );

  const key = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    passKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  const key_exported_raw = await window.crypto.subtle.exportKey("raw", key);

  return toHexString(new Uint8Array(key_exported_raw));
};

export const genKey = async (): Promise<UserKeys> => {
  const githubKey = await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );

  const cipherKeyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );

  const signKeyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"]
  );

  const cipher_private_exported_key = await window.crypto.subtle.exportKey(
    "jwk",
    cipherKeyPair.privateKey
  );
  const cipher_public_exported_key = await window.crypto.subtle.exportKey(
    "jwk",
    cipherKeyPair.publicKey
  );

  const sign_private_exported_key = await window.crypto.subtle.exportKey(
    "jwk",
    signKeyPair.privateKey
  );
  const sign_public_exported_key = await window.crypto.subtle.exportKey(
    "jwk",
    signKeyPair.publicKey
  );

  const exported_github_key = await window.crypto.subtle.exportKey(
    "raw",
    githubKey
  );

  const cipher = {
    public: cipher_public_exported_key,
    private: cipher_private_exported_key,
  };
  const sign = {
    public: sign_public_exported_key,
    private: sign_private_exported_key,
  };

  return {
    cipher,
    sign,
    exported_github_key: toHexString(new Uint8Array(exported_github_key)),
  };
};

export const simetricCipher = async (
  pt: string,
  encrypt_key_raw: Uint8Array,
  iv: Uint8Array
) => {
  const enc = new TextEncoder();

  const encrypt_key = await crypto.subtle.importKey(
    "raw",
    encrypt_key_raw,
    {
      name: "AES-GCM",
    },
    false,
    ["encrypt", "decrypt"]
  );

  const ct_raw = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    encrypt_key,
    enc.encode(pt)
  );

  return new Uint8Array(ct_raw);
};

export const cipher = async (
  keys: UserKeys,
  user: User,
  pt: string,
  encrypt_key_raw: JsonWebKey
) => {
  const enc = new TextEncoder();

  const encrypt_key = await crypto.subtle.importKey(
    "jwk",
    encrypt_key_raw,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    false,
    ["encrypt"]
  );

  const sign_key_raw = keys.sign.private;

  const sign_key = await crypto.subtle.importKey(
    "jwk",
    sign_key_raw,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  const final_ct = new Uint8Array(512 * 2);

  const pt_ct_raw = await crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    encrypt_key,
    enc.encode(pt)
  );
  const pt_ct = new Uint8Array(pt_ct_raw);

  const handle_ct_raw = await crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    encrypt_key,
    enc.encode(user.handle)
  );
  const handle_ct = new Uint8Array(handle_ct_raw);

  final_ct.set(pt_ct, 0);
  final_ct.set(handle_ct, 512);

  const hash_raw = await crypto.subtle.digest("SHA-256", enc.encode(pt));
  const hash = new Uint8Array(hash_raw);

  const signedHashRaw = await crypto.subtle.sign(
    {
      name: "RSASSA-PKCS1-v1_5",
    },
    sign_key,
    hash
  );

  const signedHash = new Uint8Array(signedHashRaw);

  return { ct: final_ct, signedHash };
};

//  ct = [{user.handle}pk]pk||[{pt}pk]pk

//user.handle
//pt
export const verifyFirm = async (
  message: string,
  signed_hash: Uint8Array,
  sign_key_raw: JsonWebKey
) => {
  const sign_key = await crypto.subtle.importKey(
    "jwk",
    sign_key_raw,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["verify"]
  );

  const enc = new TextEncoder();

  const hashed_pt_raw = await crypto.subtle.digest(
    "SHA-256",
    enc.encode(message)
  );
  const hashed_pt = new Uint8Array(hashed_pt_raw);

  const isCorrectlySigned = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    sign_key,
    signed_hash,
    hashed_pt
  );

  return isCorrectlySigned;
};

export const simetricDecrypt = async (
  ct: Uint8Array,
  iv: Uint8Array,
  key_raw: Uint8Array
) => {
  try {
    const key = await window.crypto.subtle.importKey(
      "raw",
      key_raw,
      {
        name: "AES-GCM",
      },
      false,
      ["encrypt", "decrypt"]
    );

    const pt_raw = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      ct
    );

    return new Uint8Array(pt_raw);
  } catch (e) {
    console.log(e);
    return null;
  }
};

// keys: UserKeys,
// user: User,
export const decrypt = async (keys: UserKeys, ct: Uint8Array) => {
  const private_key_raw = keys.cipher.private;
  const private_key = await crypto.subtle.importKey(
    "jwk",
    private_key_raw,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    false,
    ["decrypt"]
  );

  const dec = new TextDecoder();
  let pt_raw;

  let userHandle_raw;
  try {
    userHandle_raw = await crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      private_key,
      ct.slice(512)
    );
    pt_raw = await crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      private_key,
      ct.slice(0, 512)
    );
  } catch (error) {
    return null;
  }

  const pt = new Uint8Array(pt_raw);
  const userHandle = new Uint8Array(userHandle_raw);

  return { pt: dec.decode(pt), handle: dec.decode(userHandle) };
};
