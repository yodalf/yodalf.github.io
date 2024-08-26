const connectButton = document.getElementById("controlButton");
const deviceName = document.getElementById("deviceNameInput");
const connectionStatus = document.getElementById("connectionStatus");

connectButton.addEventListener("click", BLEConnectionHandler);


var device;

function idCarValueChanged(event)
{
    const value = event.target.value;

    console.log("*** HELLO!");
    console.log(value);
    
    return value;
}


function serviceDisconnected(event)
{
    const device = event.target;

    console.log(`Device ${device.name} is disconnected.`);
    connectionStatus.textContent = "IDLE";
    connectButton.textContent = "Connect";
}


async function BLEConnectionHandler()
{
    if (device) {
        if (device.gatt.connected) {
            device.gatt.disconnect();
        }
        else
        {
            BLEManager();
        }
    }
    else {
        BLEManager();
    }
}


async function BLEManager()
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
       

        const connectedDevice = await device.gatt.connect();
        connectionStatus.textContent = "Connected!";  
        connectButton.textContent = "Disconnect";
        device.addEventListener('gattserverdisconnected', serviceDisconnected);

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


