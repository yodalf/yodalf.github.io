const connectButton = document.getElementById("controlButton");
const deviceName = document.getElementById("deviceNameInput");
const connectionStatus = document.getElementById("connectionStatus");

connectButton.addEventListener("click", BLEManager);

async function BLEManager()
{

    connectionStatus.textContent = "...";

    try {
        const device = await navigator.bluetooth.requestDevice( { 
            filters: [ {
                //namePrefix: 'Hello',
                services: ['00AABBBB-0001-0001-0001-000000000001']
            } ] } );
        
        const connectedDevice = await device.gatt.connect();
        connectionStatus.textContent = "CONNECTED";

        const fileService = await connectedDevice.getPrimaryService( '00AABBBB-0000-0000-0000-000000000001' );
        console.log(fileService);
    }
    catch {
        connectionStatus.textContent = "CANCELLED";
    }

}


