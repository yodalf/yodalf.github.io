const connectButton = document.getElementById("controlButton");
const deviceName = document.getElementById("deviceNameInput");
const status = document.getElementById("connectionStatus");

connectButton.addEventListener("click", BLEManager);

async function BLEManager()
{

    connectionStatus.textContent = "...";

    try {
        const device = await navigator.bluetooth.requestDevice( { filters: [ {namePrefix: 'Hello'} ] } );
    }
    catch {
        connectionStatus = "CANCELLED";
    }

}


