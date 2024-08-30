
//{{{  Globals
var device;
var connectedDevice;
var idCharac;
var provState;
var provBuf;
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

        const idCar = await idService.getCharacteristic("00aabbbb-0001-0001-0001-000000000004");
        console.log("Characteristic: ", idCar);

        // Prep our notification handler
        idCar.addEventListener('characteristicvaluechanged', provValueChanged);
        await idCar.startNotifications();
        
        // Send a '1' request    
        let xx = Uint8Array.of(1); 
        await idCar.writeValue(xx);
        
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


//{{{  Event handlers
function serviceDisconnect(event) //{{{
{
    const tgt = event.target;

    device = null;
    connectedDevice = null;
    provState = 0;
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
        console.log("*** HELLO! value is "+value);
    
        provBUf =i Buffer.from(value); 

    } else
    {
        console.log("TBC...");
    }
}
//}}}

//}}}




