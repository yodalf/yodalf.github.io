
//{{{  Globals
var device;
var connectedDevice;
var idChar = null;;
var provState = 0;
var provBuf = null;
//}}}

//{{{  Connect UI to our functions
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
    console.log("ID!");
    try
    {
        if ( provState == 0)
        {

        // We start a new ID check
        console.log ("Start Prov");
        provState = 1;


        // COnnect to uur service and characteristic
        const idService = await connectedDevice.getPrimaryService( "00aabbbb-0001-0000-0001-000000000001" );
        console.log("Service: ", idService.uuid);

        idChar = await idService.getCharacteristic("00aabbbb-0001-0001-0001-000000000004");
        console.log("Characteristic: ", idChar);

        // Prep our notification handler
        idChar.addEventListener('characteristicvaluechanged', provValueChanged);
        await idChar.startNotifications();
        
        // Send a '1' request    
        let xx = Uint8Array.of(1); 
        await idChar.writeValue(xx);
        
        provStatus.textContent = "1";  

        //await device.gatt.disconnect();
        }

    }
    catch(error) {
        //connectionStatus.textContent = "CANCELLED "+error; 
        provState = 0;
        provStatus.textContent = "CANCELLED";  
    };

}
//}}}

async function sendPEMtoServer(url, pemData) { //{{{
  // Convert PEM to Uint8Array
  const uint8Array = new Uint8Array(pemData.length);
  for (let i = 0; i < pemData.length; i++) {
    uint8Array[i] = pemData.charCodeAt(i);
  }

  // Base64 encode the Uint8Array
  const b64Encoded = btoa(String.fromCharCode.apply(null, uint8Array));

  // URL safe encode
  const urlSafe = encodeURIComponent(b64Encoded.replace(/\+/g, '-').replace(/\//g, '_'));

  // Construct the URL
  const encodedUrl = `${url}?cert=${urlSafe}`;

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

    console.log('Certificate sent successfully!');
    return response;
  } catch (error) {
    console.error('Failed to send certificate:', error.message);
    throw error;
  }
}
//}}}

//{{{  Event handlers
function serviceDisconnect(event) //{{{
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
function provValueChanged(event) //{{{
{
    const value = event.target.value;

    if (provState == 0)
    {
        console.log("ERROR! provState is 0... ");
    }  else if (provState == 1)
    {
        let b = new Uint8Array(value.buffer); 
        if ((b[0] & 0xf0)  == 0x10)
        {
            dec = new TextDecoder();
            if( (b[0] & 0x0f) != 0x00) 
                provBuf = dec.decode(b.slice(3,3+b[1]));
            else
                provBuf = provBuf + dec.decode(b.slice(3,3+b[1]));

        
            // Send a '1' request    
            let xx = Uint8Array.of(0x10); 
            idChar.writeValue(xx);
            provStatus.textContent = "1";  

        } else if (b[0] == 0x80)
        {
            // The end
            provState = 0;
            provStatus.textContent = "CSR Ready";  

            // provBuf contains a CSR . Build string to send to auth server
            console.log(provBuf);            
            sendPEMtoServer("https://real.ath.cx/s/test.sh?c=", provBuf);
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




