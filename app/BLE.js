const connectButton = document.getElementById("controlButton");
const deviceName = document.getElementById("deviceNameInput");
const status = document.getElementById("connectionStatus");

connectButton.addEventListener("click", BLEManager);

async function BLEManager()
{

    const device = await navigator.bluetooth.requestDevice( { acceptAllDevices:true } );

}


