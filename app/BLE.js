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
                { services: ["00aabbbb-0001-0001-0001-000000000001"] },
                { namePrefix: "Hello" },
            ],
            //optionalServices: ["00aabbbb-0001-0001-0001-000000000001"],
        };
        const device = await navigator.bluetooth.requestDevice(options);
        
        const connectedDevice = await device.gatt.connect();

        const fileService = await connectedDevice.getPrimaryService( "00aabbbb-0001-0001-0001-000000000001" );
        console.log(fileService);
    }
    catch((error) => { console.error(`ERR: ${error}`); connectionStatus.textContent = "CANCELLED"; } ) ;

}


