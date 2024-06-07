import CryptoJS from "crypto-js";

// function generateUUID() {
//   const crypto = window.crypto;
//   const array = new Uint32Array(4);
//   crypto.getRandomValues(array);
//   let uuid = "";
//   array.forEach(function(value) {
//     uuid += value.toString(16);
//   });
//   return uuid;
// }

const passphrase = '@2o25UtrA#de$';

// 加密函数
function encrypt(data: any) {
  const ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), passphrase);
  return ciphertext.toString();
}

// 解密函数
function decrypt(ciphertext: string) {
  const bytes = CryptoJS.AES.decrypt(ciphertext, passphrase);
  const originalText = bytes.toString(CryptoJS.enc.Utf8);
  return JSON.parse(originalText);
}

export default {
  encrypt,
  decrypt
}
