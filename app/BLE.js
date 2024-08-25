const connectButton = document.getElementById("controlButton");
const deviceName = document.getElementById("deviceNameInput");
const connectionStatus = document.getElementById("connectionStatus");

connectButton.addEventListener("click", BLEManager);

function idCarValueChanged(event)
{
    const value = event.target.value;

    console.log(value);
    
    buf = await idCar.readValue();
    console.log(buf);

    return value;
}


async function BLEManager()
{

    connectionStatus.textContent = "...";

    try {
         let options = {
            filters: [
                { services: ["00aabbbb-0001-0000-0001-000000000001"] },
                { namePrefix: "Hello" },
            ],
            //optionalServices: ["00aabbbb-0001-0001-0001-000000000001"],
        };
        const device = await navigator.bluetooth.requestDevice(options)
            .catch((error) => { console.error(`ERR: ${error}`); connectionStatus.textContent = "CANCELLED"; } );
        
        const connectedDevice = await device.gatt.connect();
        connectionStatus.textContent = "Connected!";  

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




        await device.gatt.disconnect();

    }
    catch(error) {
        connectionStatus.textContent = "CANCELLED "+error;  
    };

}


