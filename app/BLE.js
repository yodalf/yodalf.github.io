const connectButton = document.getElementById("controlButton");
const deviceName = document.getElementById("deviceNameInput");
const connectionStatus = document.getElementById("connectionStatus");

connectButton.addEventListener("click", BLEManager);

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

        const idCar = await idService.getCharacteristic("00aabbbb-0001-0001-0001-000000000001");
        console.log("Characteristic: ", idCar);

        const buf = idCar.readValue();
        console.log(buf);

        device.gatt.disconnect();

    }
    catch {
        connectionStatus.textContent = "CANCELLED";  
    };

}


