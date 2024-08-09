import CryptoJS from "crypto-js";
import sha256 from 'crypto-js/sha256';

const iv = new TextEncoder().encode("1234567890000000");
const DEFAULT_SECRET_KEY = "@kArs0n2q25*Tr0d2Ru";
export function aes_decrypt(tcrypto_key: string, secretdata: string) {
  try {
    const cryptkey = sha256(tcrypto_key + DEFAULT_SECRET_KEY);
    const decrypted = CryptoJS.AES.decrypt(secretdata, cryptkey, {
      iv: CryptoJS.lib.WordArray.create(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
   console.log(error)
  }
}

export function aes_encrypt(tcrypto_key: string, cleardata: string) {
  try {
    const cryptkey = sha256(tcrypto_key + DEFAULT_SECRET_KEY);
    const encrypted = CryptoJS.AES.encrypt(cleardata, cryptkey, {
      iv: CryptoJS.lib.WordArray.create(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    return encrypted.toString();
  } catch (error) {
    console.log(error)
  }
}
