const connectButton = document.getElementById("connectButton");
const connectionStatus = document.getElementById("connectionStatus");
const deviceName = document.getElementById("deviceNameInput");


const provButton = document.getElementById("provButton");
const provStatus = document.getElementById("provStatus");

const ticketButton = document.getElementById("ticketButton");
const ticketStatus = document.getElementById("ticketStatus");

connectButton.addEventListener("click", BLEConnectionClick);
provButton.addEventListener("click", BLEidClick);


var device;
var connectedDevice;
var idCharac;

async function BLEConnectionClick() //{{{
{
    if (device) {
        if (device.gatt.connected) {
            device.gatt.disconnect();
        }
        else
        {
            BLEdeviceManager();
        }
    }
    else {
        BLEdeviceManager();
    }
}
//}}}
async function BLEidClick() //{{{
{
    if (!device) {
        console.log("NO DEVICE!");
        return;
    }
    else {
        BLEidManager();
    }
}
//}}}


function idCarValueChanged(event) //{{{
{
    const value = event.target.value;

    console.log("*** HELLO!");
    console.log(value);
    
    return value;
}
//}}}


function serviceDisconnected(event) //{{{
{
    const tgt = event.target;

    device = null;
    connectedDevice = null;
    console.log(`Device ${tgt.name} is disconnected.`);
    connectionStatus.textContent = "IDLE";
    connectButton.textContent = "Connect";
}
//}}}


async function BLEidManager() //{{{
{
    console.log("ID!");
    try
    {
        const idService = await connectedDevice.getPrimaryService( "00aabbbb-0001-0000-0001-000000000001" );
        console.log("Service: ", idService.uuid);

        const idCar = await idService.getCharacteristic("00aabbbb-0001-0001-0001-000000000004");
        console.log("Characteristic: ", idCar);

        let xx = Uint8Array.of(1); 
        
        //buf = await idCar.readValue();
        //console.log(buf);

        
        idCar.addEventListener('characteristicvaluechanged', idCarValueChanged);
        await idCar.startNotifications();

        await idCar.writeValue(xx);
        

        //buf = await idCar.readValue();
        //console.log(buf);




        //await device.gatt.disconnect();
    }
    catch(error) {
        connectionStatus.textContent = "CANCELLED "+error;  
    };

}
//}}}

async function BLEdeviceManager() //{{{
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
        device.addEventListener('gattserverdisconnected', serviceDisconnected);

    }
    catch(error) {
        connectionStatus.textContent = "CANCELLED "+error;  
    };

}
//}}}


