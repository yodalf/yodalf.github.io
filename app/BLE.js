const connectButton = document.getElementById("controlButton");
const deviceName = document.getElementById("deviceNameInput");
const connectionStatus = document.getElementById("connectionStatus");

connectButton.addEventListener("click", BLEManager);

async function BLEManager()
{

    connectionStatus.textContent = "...";

    try {
        const device = await navigator.bluetooth.requestDevice( { filters: [ {namePrefix: 'Hello'} ] } );
        const connectedDevice = await device.gatt.connect();
        connectionStatus.textContent = "CONNECTED";
    }
    catch {
        connectionStatus.textContent = "CANCELLED";
    }

}


