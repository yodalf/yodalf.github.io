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
                { services: ["00AABBBB-0001-0001-0001-000000000001"] },
                { namePrefix: "Hello" },
            ],
            optionalServices: ["00AABBBB-0001-0001-0001-000000000001"],
        };
        navigator.bluetooth
                                .requestDevice(options)
                                .then( (device) => { 
                                    console.log(`Name: ${device.name}`);
                                    connectionStatus.textContent = "CONNECTED";
                                    //
                                })
                                .catch((error) => console.error(`ERR: ${error}`)) ;
        
        //const connectedDevice = await device.gatt.connect();

        //const fileService = await connectedDevice.getPrimaryService( '00AABBBB-0000-0000-0000-000000000001' );
        //console.log(fileService);
    }
    catch {
        connectionStatus.textContent = "CANCELLED";
    }

}


