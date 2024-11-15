
//{{{  Globals
var device;
var connectedDevice;

var idService = null;
var idChar = null;;

var provState = 0;
var provBuf = null;

var receivedCerts;

var dec = new TextDecoder();

var certIndex = 0;
var certSize = 0;
var currentCert = 0;

var idCertType = 0;  // 0 = CSR, 1 = IDevID

var userId = null;
var userHash = null;
var userCert = null;
//}}}

//{{{  Connect UI to our functions
const logintMainButton = document.getElementById("loginMainButton");
const logintButton = document.getElementById("loginButton");
const loginStatus = document.getElementById("loginStatus");
const loginUser = document.getElementById("login_username");
const loginPwd = document.getElementById("login_password");
loginButton.addEventListener("click", loginClick);

const connectButton = document.getElementById("connectButton");
const connectionStatus = document.getElementById("connectionStatus");
const deviceName = document.getElementById("deviceNameInput");


const provButton = document.getElementById("provButton");
const provStatus = document.getElementById("provStatus");
provState = 0;

const ticketButton = document.getElementById("ticketButton");
const ticketStatus = document.getElementById("ticketStatus");

connectButton.addEventListener("click", connectClick);
provButton.addEventListener("click", provClick);
ticketButton.addEventListener("click", ticketClick);
//}}}

// LOGIN & LDevId for mobile
async function loginClick() //{{{
{
    if (userId == null) {
        // The current user
        userId = loginUser.value;
        // The currennt hash
        userHash = await computeSHA256(loginPwd.value);

        // Reset input variables
        loginUser.value = "";
        loginPwd.value = "";
         
        console.log("Initiate login for user " + userId + " ... with PWD-256: " + userHash);
        loginMainButton.attributes["data-bs-toggle"].value="";
        loginMainButton.addEventListener("click", logoutClick);
        loginMainButton.textContent = "Logout";

        devId = localStorage.getItem("ne201_devId");
        if (null == devId)
            devIdHash="";
        else
            devIdHash = await computeSHA256(localStorage.getItem("ne201_devId"));


        XX = await checkLoginOnServer("https://ne201.com/s/check-user.sh", userId, userHash, devIdHash);
        console.log("LOGIN: "+XX);


        if (XX != 0) {
            logoutClick();
            return;
        }
        else {
            try {
                await syncDevId(userId, userHash);
            } catch (error) {
                logoutClick();
                return;
            }
        
            loginStatus.textContent = "OK " + userId;

            return;
        }
    }
    else {
        console.log("Already in, do nothing");
    }
}
//}}}
async function logoutClick() //{{{
{
    console.log("User "+ userId + " logged out");
    loginMainButton.attributes["data-bs-toggle"].value="modal";
    loginMainButton.removeEventListener("click", logoutClick);
    loginMainButton.textContent = "Login";
    loginStatus.textContent = "";
    loginHash = null;
    loginCert = null;
    userId = null;
    userHash = null;
}
//}}}

async function checkLoginOnServer(url, user, pwd, devIdHash) { //{{{

  // construct the url
  const encodedUrl = `${url}?user=${user}&hash=${pwd}&idHash=${devIdHash}`;

  try {
    // Send the request using Fetch API
    const response = await fetch(encodedUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('CREDS SENT');

    const x = dec.decode(await response.arrayBuffer());

    console.log(x);
    console.log(x);

    return x;
  } catch (error) {
    console.error('Failed to send credentials:', error.message);
    throw error;
  }
}
//}}}

async function syncDevId(userId, userHash) {
    var subject = "/C=US/O=Test/CN=example.com";
    var sigalg = "SHA256withRSA";
    var keyalg = "RSA";
    var keylen = 2048;
    var curve = "NIST P-256";

    if ( null == localStorage.getItem("ne201_kpub") )
        {
        var kp = KEYUTIL.generateKeypair(keyalg, keylen);
        localStorage.setItem("ne201_kpub", KEYUTIL.getPEM(kp.pubKeyObj));
        localStorage.setItem("ne201_kprv", KEYUTIL.getPEM(kp.prvKeyObj, "PKCS8PRV", userHash));
        console.log("Keypair successfully generated");
        }

    if ( null == localStorage.getItem("ne201_devId") )
      {
        var kpub = KEYUTIL.getKey(localStorage.getItem("ne201_kpub"));
        var kprv = KEYUTIL.getKey(localStorage.getItem("ne201_kprv"), userHash);

        var csr_pem = KJUR.asn1.csr.CSRUtil.newCSRPEM({
          "subject": {"str": subject},
          "sbjpubkey": kpub,
          "sigalg": "SHA1withRSA",
          "sbjprvkey": kprv
        });

        sessionStorage.setItem("ne201_csr", csr_pem);
        console.log("CSR for mobile successfully generated ... submitting to CA ...");
        
        var csr = sessionStorage.getItem("ne201_csr");

        try 
          {
            await sendPEMtoServer("https://ne201.com/s/is-sign-csr.sh", csr, userId, userHash);
            localStorage.setItem("ne201_ca_root", receivedCerts[0]);
            localStorage.setItem("ne201_id_issuer", receivedCerts[1]);
            localStorage.setItem("ne201_devId", receivedCerts[3]);
            console.log("ROOT certificate from CA: ");
            console.log(localStorage.getItem("ne201_ca_root"));
            console.log("Identity Issuer certificate received from CA: ");
            console.log(localStorage.getItem("ne201_id_issuer"));
            console.log("DevID certificate: ");
            console.log(localStorage.getItem("ne201_devId"));

        } catch (error) {
            console.log("ERRO! "+error);
            throw error;
        }
      }
      

}


async function connectClick() //{{{
{
    if (device) {
        if (device.gatt.connected) {
            device.gatt.disconnect();
        }
        else
        {
            connectManager();
        }
    }
    else {
        connectManager();
    }
}
//}}}
async function provClick() //{{{
{
    if (!device) {
        console.log("NO DEVICE!");
        return;
    }
    else {
        provManager();
    }
}
//}}}
async function ticketClick() //{{{
{
    if (!device) {
        console.log("NO DEVICE!");
        return;
    }
    else {
        console.log("Ticket click!");
    }
}
//}}}


function AES() { //{{{
    // https://github.com/themikefuller/Web-Cryptography

  let aes = {};

  aes.encrypt = async (message, password, passwordBits, iterations) => {
  
    let rounds = iterations || 500000;
    let msg = new TextEncoder().encode(message);
    let pass;
    
    if (password) {
      pass = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), {
        "name": "PBKDF2"
      }, false, ['deriveBits']);
    }
    
    if (passwordBits) {
      pass = await crypto.subtle.importKey('raw',new Uint8Array(passwordBits),{
        "name": "PBKDF2"
      },false,['deriveBits'])
    }
    
    let salt = crypto.getRandomValues(new Uint8Array(32));
    let iv = crypto.getRandomValues(new Uint8Array(12));
    
    let bits = await crypto.subtle.deriveBits({
      "name": "PBKDF2",
      "salt": salt,
      "iterations": rounds,
      "hash": {
        "name": "SHA-256"
      }
    }, pass, 256);
    
    let key = await crypto.subtle.importKey('raw', bits, {
      "name": "AES-GCM"
    }, false, ['encrypt']);
    
    let enc = await crypto.subtle.encrypt({
      "name": "AES-GCM",
      "iv": iv
    }, key, msg);
    
    let iterationsHash = btoa(rounds.toString());
    
    let saltHash = btoa(Array.from(new Uint8Array(salt)).map(val => {
      return String.fromCharCode(val)
    }).join(''));
    
    let ivHash = btoa(Array.from(new Uint8Array(iv)).map(val => {
      return String.fromCharCode(val)
    }).join(''));
    
    let encHash = btoa(Array.from(new Uint8Array(enc)).map(val => {
      return String.fromCharCode(val)
    }).join(''));
    
    return iterationsHash + '.' + saltHash + '.' + ivHash + '.' + encHash;
    
  };

  aes.decrypt = async (encrypted, password, passwordBits) => {
  
    let parts = encrypted.split('.');
    let rounds = parseInt(atob(parts[0]));
    
    let salt = new Uint8Array(atob(parts[1]).split('').map(val => {
      return val.charCodeAt(0);
    }));
    
    let iv = new Uint8Array(atob(parts[2]).split('').map(val => {
      return val.charCodeAt(0);
    }));
    
    let enc = new Uint8Array(atob(parts[3]).split('').map(val => {
      return val.charCodeAt(0);
    }));
    
    let pass;
    
    if (password) {
      pass = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), {
        "name": "PBKDF2"
      }, false, ['deriveBits']);
    }
    
    if (passwordBits) {
      pass = await crypto.subtle.importKey('raw', new Uint8Array(passwordBits), {
        "name": "PBKDF2"
      }, false, ['deriveBits']);
    }
    
    let bits = await crypto.subtle.deriveBits({
      "name": "PBKDF2",
      "salt": salt,
      "iterations": rounds,
      "hash": {
        "name": "SHA-256"
      }
    }, pass, 256);
    
    let key = await crypto.subtle.importKey('raw', bits, {
      "name": "AES-GCM"
    }, false, ['decrypt']);
    
    let dec = await crypto.subtle.decrypt({
      "name": "AES-GCM",
      "iv": iv
    }, key, enc);
    
    return (new TextDecoder().decode(dec));
    
  };

  return aes;

}
//}}}
async function computeSHA256(input) { //{{{
  return new Promise((resolve, reject) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    
    crypto.subtle.digest('SHA-256', data).then(buffer => {
      const hexArray = Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0'));
      resolve(hexArray.join(''));
    }).catch(error => reject(error));
  });
}
//}}}

async function unlockPKCS12(filePath, password) { //{{{
  try {
    // Read the PKCS#12 file as binary data
    const p12Data = await readFile(filePath);

    // Decode the binary data to DER format
    const der = forge.util.decode64(forge.util.encode64(p12Data));

    // Parse the DER data to ASN.1 structure
    const asn1 = forge.asn1.fromDer(der);

    // Parse the PKCS#12 structure
    const pkcs12 = forge.pkcs12.pkcs12FromAsn1(asn1, false, password);

    // Get the private key
    const privateKey = pkcs12.getPrivateKey();

    // Get the certificate
    const certificate = pkcs12.getCertificate();

    // Convert the private key to a Web Crypto-compatible format
    const keyObject = {
      type: 'privatekey',
      algorithm: { name: 'RSA-PKCS1-v1_5' },
      exponent: privateKey.exponent,
      modulus: forge.util.bytesToHex(privateKey.n),
      publicExponent: certificate.publicKey.n,
      publicKey: forge.util.bytesToHex(certificate.publicKey.e)
    };

    return { privateKey: keyObject, certificate };
  } catch (error) {
    console.error('Error unlocking PKCS#12:', error);
    throw error;
  }
}
//}}}

async function connectManager() //{{{
{

    connectionStatus.textContent = "...";

    try {
         let options = {
             acceptAllDevices: true,
             optionalServices: ["00aabbbb-0001-0000-0001-000000000001"] ,
 
             //filters: [
             //    { namePrefix: "Hello" },
             //    { namePrefix: "A" },
             //    { namePrefix: "B" },
             //    { services: ["00aabbbb-0001-0000-0001-000000000001"] },
            //],
        };
        

        device = await navigator.bluetooth.requestDevice(options)
            .catch((error) => { console.error(`ERR: ${error}`); connectionStatus.textContent = "CANCELLED"; } );
       

        connectedDevice = await device.gatt.connect();
        connectionStatus.textContent = "Connected!";  
        connectButton.textContent = "Disconnect";
        device.addEventListener('gattserverdisconnected', serviceDisconnect);

        // Connect to our service and characteristic
        idService = await connectedDevice.getPrimaryService( "00aabbbb-0001-0000-0001-000000000001" );

        idChar = await idService.getCharacteristic("00aabbbb-0001-0001-0001-000000000004");

        // Prep our notification handler
        idChar.addEventListener('characteristicvaluechanged', idValueChanged);
        await idChar.startNotifications();
        
        provManager();

    }
    catch(error) {
        //connectionStatus.textContent = "CANCELLED "+error;  
        device = null;
        connectionStatus.textContent = "CANCELLED";  
    };

}
//}}}
async function provManager() //{{{
{
    try
    {
        if ( provState == 0)
        {

        // We start a new ID check
        provState++;

        // Send a CMD_POP_IDEVID_CSR request    
        let xx = Uint8Array.of(1); 
        await idChar.writeValue(xx);
        
        provStatus.textContent = "Get ID cert";  

        //await device.gatt.disconnect();
        }

        if ( provState == 99 )
        {
            // Factory reset
            // Send a CMD_FACTORY_RESET request    
            let xx = Uint8Array.of(3); 
            await idChar.writeValue(xx);
            
            provStatus.textContent = "...";  
            console.log ("Factory Reset!");
            provButton.textContent = "Provision";
            provState=0;
            idCertType = 0;

        
         
        }

    }
    catch(error) {
        //connectionStatus.textContent = "CANCELLED "+error; 
        provState = 0;
        provStatus.textContent = "CANCELLED";  
    };

}
//}}}

async function extractMultipleCertificates(content) { //{{{

    const regex = RegExp(
        "-+BEGIN\\s+.*CERTIFICATE[^-]*-+(?:\\s|\\r|\\n)+" // Header
        + "([A-Za-z0-9+/\r\n=]+={0,2})"                   // Base64 text
        + "-+END\\s+.*CERTIFICATE[^-]*-+"                // Footer
        , 'g');

    let currentMatch;

    const certificates = [];

    while ((currentMatch = regex.exec(content)) !== null) {
        //console.log(`Found ${currentMatch[0]}. Next starts at ${regex.lastIndex}.`);
        certificates.push(currentMatch[0]);
        }

    if (certificates.length === 0) {
        throw new Error('No certificates found');
        }
      
    return certificates;

}
//}}}

async function sendPEMtoServer(url, pemData, userId, userHash) { //{{{
  // Convert PEM to Uint8Array
  const uint8Array = new Uint8Array(pemData.length);
  for (let i = 0; i < pemData.length; i++) {
    uint8Array[i] = pemData.charCodeAt(i);
  }

  // Base64 encode the Uint8Array
  const b64Encoded = btoa(String.fromCharCode.apply(null, uint8Array));

  // URL safe encode
  const urlSafe = encodeURIComponent(b64Encoded.replace(/\+/g, '-').replace(/\//g, '_'));

  // construct the url
  const encodedUrl = `${url}?${urlSafe}&${userId}&${userHash}`;

  try {
    // Send the request using Fetch API
    const response = await fetch(encodedUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('CSR sent for signature:');
    console.log(pemData);

    const x = dec.decode(await response.arrayBuffer());
    //const  = dec.decode(x);
    try {
        receivedCerts = await extractMultipleCertificates(x);
        //console.log('Received Certificates:', receivedCerts);
    } catch (error) {
        console.error(error.message);
        throw error;
    }

    return response;
  } catch (error) {
    console.error('Failed to send certificate:', error.message);
    throw error;
  }
}
//}}}


//{{{  Event handlers
async function serviceDisconnect(event) //{{{
{
    const tgt = event.target;

    device = null;
    connectedDevice = null;
    provState = 0;
    provBuf = null;
    provStatus.textContent = "...";  

    console.log(`Device ${tgt.name} is disconnected.`);
    connectionStatus.textContent = "IDLE";
    connectButton.textContent = "Connect";
}
//}}}
async function idValueChanged(event) //{{{
{
    const value = event.target.value;

    if (provState == 0)
    {
        console.log("provState is 0 ... device being factory reset");
    }  else if (provState == 1)
    {
        let b = new Uint8Array(value.buffer); 
        if ((b[0] & 0xf0)  == 0x10)
        {
            if( (b[0] & 0x0f) != 0x00) 
            {
                provBuf = dec.decode(b.slice(3,3+b[1]));
                idCertType = b[0] & 0x0f;
            }
            else
                provBuf = provBuf + dec.decode(b.slice(3,3+b[1]));
        
            // Send a CMD_ACK request    
            let xx = Uint8Array.of(0x10); 
            idChar.writeValue(xx);

        } else if (b[0] == 0x80)
        {
            if (idCertType == 0x01) // IDevID
            {
                console.log("DevID from device:");
                console.log(provBuf);
                provState = 99;
                currentCert = 0;
                provStatus.textContent = "Device Provisioned";
                provButton.textContent = "Factory Reset";

            } else if (idCertType == 0x02) // CSR
            {
                provState++;
                provStatus.textContent = "CSR sent";  

                // provBuf contains a CSR . Build string to send to auth server
                //console.log(provBuf);            
                await sendPEMtoServer("https://ne201.com/s/is-sign-csr.sh", provBuf);

                // We got 4 certs back: ROOT, IS, AS, IDevID
                // in the 'receivedCerts' variable
                provState++;

                console.log("ROOT certificate received from CA: ");
                console.log(receivedCerts[0]);
                console.log("Identity Issuer certificate received from CA: ");
                console.log(receivedCerts[1]);
                console.log("New DevID certificate received from CA: ");
                console.log(receivedCerts[3]);


                // Validate the certs
                // TODO

                // Start sending ROOT (currentCert == 0) to the device via BLE
                provStatus.textContent = "Provisioning Cert "+currentCert;  
                let utf8Encode = new TextEncoder();
                // The first 240 bytes
                var xx = new Uint8Array([0x02, 0x00 | currentCert, 240]);
                var yy = new Uint8Array(utf8Encode.encode(receivedCerts[currentCert]));
                certSize = yy.length;
                certIndex = 240;
                yy = new Uint8Array(utf8Encode.encode(receivedCerts[currentCert]).slice(0,240));
                let zz = new Uint8Array(xx.length + yy.length);
                zz.set(xx);
                zz.set(yy, xx.length);
                await idChar.writeValue(zz);
            }
            else
            {
                provState = 0;
                currentCert = 0;    
                provStatus.textContent = "Unknown state";  
                provButton.textContent = "Factory Reset";
            }
        }
    }  else if (provState == 3)
    {
        // We are sending the ROOT cert, CONTINUE

        let b = new Uint8Array(value.buffer); 
        if ((b[0] & 0xf0)  == 0x10)
        {
            let utf8Encode = new TextEncoder();
            // The next bytes
            if (240 < certSize - certIndex)
            {
                // Still more than 240
                var xx = new Uint8Array([0x02, 0x10 | currentCert, 240]);
                yy = new Uint8Array(utf8Encode.encode(receivedCerts[currentCert]).slice(certIndex,certIndex+240));
                certIndex += 240;
            }
            else
            {
                // Last bytes
                var xx = new Uint8Array([0x02, 0x20 | currentCert, certSize - certIndex]);
                yy = new Uint8Array(utf8Encode.encode(receivedCerts[currentCert]).slice(certIndex,certSize));
                certIndex = certSize;
            }

            let zz = new Uint8Array(xx.length + yy.length);
            zz.set(xx);
            zz.set(yy, xx.length);
            await idChar.writeValue(zz);

        } else if (b[0] == 0x80)
        {
            // Next cert
            currentCert++; 
            if (currentCert < 4)
            {
                // Trig next cert
                provStatus.textContent = "Provisioning Cert "+currentCert;  

                let utf8Encode = new TextEncoder();
                // The first 240 bytes
                var xx = new Uint8Array([0x02, 0x00 | currentCert, 240]);
                var yy = new Uint8Array(utf8Encode.encode(receivedCerts[currentCert]));
                certSize = yy.length;
                certIndex = 240;
                yy = new Uint8Array(utf8Encode.encode(receivedCerts[currentCert]).slice(0,240));
                let zz = new Uint8Array(xx.length + yy.length);
                zz.set(xx);
                zz.set(yy, xx.length);
                await idChar.writeValue(zz);
                     
            }
            else
            {
                // The end
                provState = 99;
                currentCert = 0;    
                provStatus.textContent = "Device Provisioned";  
                provButton.textContent = "Factory Reset";
            }
            
        }

    }  
       else
    {
        console.log("TBC...");
        provBuf=null;
    }
}
//}}}

//}}}




