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
                namePrefix: 'Hello',
                services: ['0x00AABBBB-0000-0001-0000-000000000004']
            } ] } );
        const connectedDevice = await device.gatt.connect();
        connectionStatus.textContent = "CONNECTED";
    }
    catch {
        connectionStatus.textContent = "CANCELLED";
    }

}


