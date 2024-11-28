const crypto = require('crypto');
const fs = require('fs');

async function genKey() {
keypair = await crypto.subtle.generateKey(
    {
    name: "RSA-OAEP",
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
);
console.log("KEYPAIR");
console.log(keypair);
return keypair;
}


// Function to read and convert PEM public key
async function getPemPrivateKey(pemPath) {
  const pemData = await fs.promises.readFile(pemPath, 'utf8');
  return Buffer.from(pemData.replace(/-----BEGIN PRIVATE KEY-----/, '').replace(/-----END PRIVATE KEY-----/, ''), 'base64');
}
async function getPemPublicKey(pemPath) {
  const pemData = await fs.promises.readFile(pemPath, 'utf8');
  return Buffer.from(pemData.replace(/-----BEGIN PUBLIC KEY-----/, '').replace(/-----END PUBLIC KEY-----/, ''), 'base64');
}

// Function to decrypt data
async function decryptData(privateKey, encryptedDataBuffer) {
  try {
    console.log("TEST");
      console.log(encryptedDataBuffer);
      // Convert ArrayBuffer to CryptoKey

    // Decrypt the data
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      privateKey,
      encryptedDataBuffer
    );

    return new TextDecoder().decode(decryptedData);
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}
async function encryptData(publicKey, clearDataBuffer) {
  try {
    //console.log("TEST");
     // console.log(encryptedDataBuffer);
      // Convert ArrayBuffer to CryptoKey

    // Decrypt the data
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      publicKey,
      clearDataBuffer
    );

    return encryptedData;
    //return new TextDecoder().decode(encryptedData);
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
}

// Usage example
const publicKeyPath = './kpub';
const privateKeyPath = './kprv';
const clearFilePath = './c';
const encryptedFilePath = './t';

(async () => {
  try {
keypair = await genKey();
console.log("KP: "+keypair.privateKey);
  

    pub = await crypto.subtle.exportKey("spki",keypair.publicKey);
    console.log("PUB");
    console.log(pub);
    console.log("PUBEND");
    var body = btoa(String.fromCharCode(...new Uint8Array(pub)));
    console.log(body);
    body = body.match(/.{1,64}/g).join('\n');

    pubkey = `-----BEGIN PUBLIC KEY-----\n${body}\n-----END PUBLIC KEY-----`;
    console.log(pubkey);

    var pemData = pubkey;
    publicKeyBuffer = Buffer.from(pemData.replace(/-----BEGIN PUBLIC KEY-----/, '').replace(/-----END PUBLIC KEY-----/, ''), 'base64');



      // Read public key
    //const publicKeyBuffer = await getPemPublicKey(publicKeyPath);
    prv = await crypto.subtle.exportKey("pkcs8",keypair.privateKey);
    // Convert the ArrayBuffer to a Uint8Array
    var byteArray = new Uint8Array(prv);

    console.log("PRIV");
    console.log(byteArray);
    console.log("PRVEND");

    body = btoa(String.fromCharCode(...new Uint8Array(prv)));
    console.log(body);
    body = body.match(/.{1,64}/g).join('\n');
    body = body.replace(/=/,'');
    prvkey = `-----BEGIN PRIVATE KEY-----\n${body}\n-----END PRIVATE KEY-----`;
    console.log(prvkey);






    pemData = pubkey;
      console.log(pemData);
    publicKeyBuffer  = Buffer.from(pemData.replace(/-----BEGIN PUBLIC KEY-----/, '').replace(/-----END PUBLIC KEY-----/, ''), 'base64');
    pemData = prvkey;
      console.log(pemData);
    privateKeyBuffer = Buffer.from(pemData.replace(/-----BEGIN PRIVATE KEY-----/, '').replace(/-----END PRIVATE KEY-----/, ''), 'base64');
    //const privateKeyBuffer = await getPemPrivateKey(privateKeyPath);


    publicKeyBuffer = await getPemPublicKey("./kpub");
    privateKeyBuffer = await getPemPrivateKey("./kprv");

    const publicKey = await crypto.subtle.importKey(
      'spki',
      publicKeyBuffer,
        {
          name: "RSA-OAEP",
          hash: "SHA-256",
    publicExponent: new Uint8Array([1, 0, 1]),
        },
      true,
      ['encrypt']
    );
    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      privateKeyBuffer,
        {
          name: "RSA-OAEP",
          hash: "SHA-256",
    publicExponent: new Uint8Array([1, 0, 1]),
        },
      true,
      ['decrypt']
    );

    //console.log(publicKey);
    console.log(keypair.privateKey);
    console.log(privateKey);
    xprv = await crypto.subtle.exportKey("pkcs8",keypair.privateKey);
    var xbyteArray = new Uint8Array(xprv);
      console.log("BYTEPRV: "+xbyteArray);
      console.log("END");
    xprv = await crypto.subtle.exportKey("pkcs8",privateKey);
    var xbyteArray = new Uint8Array(xprv);
      console.log("BYTEPRV: "+xbyteArray);
      console.log("END");


    // Read clear data
    const clearDataBuffer = Buffer.from(await fs.promises.readFile("./msg"));
    //const clearDataBuffer = Buffer.from( new TextEncoder().encode("HELLO"));

   const encryptedData = await encryptData(publicKey, clearDataBuffer);
   // const encryptedData = await encryptData(keypair.publicKey, clearDataBuffer);
    console.log("ENC: "+encryptedData);

    // Read encrypted data
    //const encryptedDataBuffer = Buffer.from(await fs.promises.readFile(encryptedFilePath));
    var encryptedDataBuffer = Buffer.from(encryptedData);
    await fs.promises.writeFile("msg_e", encryptedDataBuffer); 

     // console.log("ENC BUF: "+encryptedDataBuffer);

    // Decrypt data
    //const decryptedData = await decryptData(keypair.privateKey, encryptedData);
    encryptedDataBuffer = Buffer.from(await fs.promises.readFile("./msg_e"));
    const decryptedData = await decryptData(privateKey, encryptedDataBuffer);

    if (decryptedData) {
      console.log('Decrypted data:', decryptedData);
    } else {
      console.log('Failed to decrypt data.');
    }
  } catch (error) {
    console.error('Error:', error);
  }
})();


