// http 加解密

const KEY = "@2o25UtrA#de$";

const en_splitStringByLength = (str: string, len: number) => {
  const result = [];
  for (let i = 0; i < str.length; i += len) {
    result.push(str.substr(i, len));
  }
  let r_str1 = '';
  let r_str2 = '';
  let r_end = '';
  for (let i = 0; i < result.length; i++) {
    if (i === (result.length - 1)) {
      r_end = result[i];
    } else {
      if (i % 2 === 0) {
        r_str1 += result[i];
      } else {
        r_str2 += result[i];
      }
    }
  }
  return r_str1 + r_str2 + r_end;
}

const de_splitStringByLength = (str:string, len:number) => {
  var result = [];
  for (var i = 0; i < str.length; i += len) {
    result.push(str.substr(i, len));
  }
  let list1 = [];
  let list2 = [];
  let r_end = '';
  for (let i = 0; i < result.length; i++) {
    if (i == (result.length - 1)) {
      r_end = result[i];
    } else {
      if (i <= (result.length / 2 - 1)) {
        list1.push(result[i]);
      } else {
        list2.push(result[i]);
      }
    }
  }
  let r_str = '';
  for (let i in list1) {
    r_str = r_str + list1[i];
    if (list2[i]) {
      r_str = r_str + list2[i];
    }
  }
  return r_str + r_end;
}

export const encrypt = (encrypt_str: string) => {
  encrypt_str = btoa(encodeURIComponent(encrypt_str));
  let splited_str = en_splitStringByLength(encrypt_str, 5);

  let encrypted = '';
  let key_length = KEY.length;
  for (let i = 0; i < splited_str.length; i++) {
    const tkey:any = KEY[i % key_length];
    encrypted += String.fromCharCode(splited_str.charCodeAt(i) ^ tkey);
  }
  return encrypted;
}

export const decrypt = (decrypt_str: string) => {
  let key_length = KEY.length;
  let decrypted = '';
  for (let i = 0; i < decrypt_str.length; i++) {
    const tkey:any = KEY[i % key_length];
    decrypted += (String.fromCharCode(decrypt_str.charCodeAt(i) ^ tkey));
  }
  decrypted = de_splitStringByLength(decrypted, 5);
  decrypted = decodeURIComponent(atob(decrypted))
  return decrypted;
}