$(document).ready(function () {
    // --- define globals --- //

    // expect same as backend e.g. the default "http://127.0.0.1:5000";
    const MODEL = window.location.origin

    // --- create a socket --- //
    // don't connect yet
    let socket = io(MODEL, {
        auth: { "password": "GiveMeTheBigBluePasswordOnTheLeft" }
    });

    // --- view --- //
    // Get references to the three canvas layers
    let bgLayer     = document.getElementById("background");
    let objLayer    = document.getElementById("objects");
    let grLayer     = document.getElementById("gripper");

    // Set up the view js, this also sets up key listeners
    const layerView = new document.LayerView(socket, bgLayer, objLayer, grLayer);
    socket.emit("join", {"room_id": room_id});
}); // on document ready end