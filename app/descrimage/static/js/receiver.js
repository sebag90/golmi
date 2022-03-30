$(document).ready(function () {
    // --- define globals --- //

    // expect same as backend e.g. the default "http://127.0.0.1:5000";
    const MODEL = window.location.origin
    console.log("Connect to " + MODEL)

    // parameters for random initial state
    // (state is generated once the configuration is received)
    const N_OBJECTS = 10;
    const N_GRIPPERS = 0; // no pre-generated gripper

    const CUSTOM_CONFIG = {
        "move_step": 0.5,
        "width": 25,
        "height": 25
    };

    // --- create a socket --- //
    // don't connect yet
    let socket = io(MODEL, {
        auth: { "password": "GiveMeTheBigBluePasswordOnTheLeft" }
    });
    // debug: print any messages to the console
    localStorage.debug = 'socket.io-client:socket';

    // --- controller --- //
    // create a controller, we still need to attach a gripper in the model to it
    let controller = new document.LocalKeyController();

    // --- view --- //
    // Get references to the three canvas layers
    let bgLayer     = document.getElementById("background");
    let objLayer    = document.getElementById("objects");
    let grLayer     = document.getElementById("gripper");

    // Set up the view js, this also sets up key listeners
    const layerView = new document.LayerView(socket, bgLayer, objLayer, grLayer);
    function onMouseClick(event) {
        socket.emit("descrimage_mouseclick", {
            "target_id": event.target.id,
            "offset_x": event.offsetX,
            "offset_y": event.offsetY,
            "x": event.x,
            "y": event.y,
            "block_size": layerView.blockSize,
            "token": token,
            "this_state": document.getElementById("progress").value,
            "n_states": document.getElementById("progress").max
        })
    }
    grLayer.onclick = onMouseClick
    // --- logger --- //
    // second parameter disables full state logging, significantly reducing
    // log sizes while still keeping track of all changes.
    const logView = new document.LogView(socket, false);

    // --- socket communication --- //
    socket.on("connect", () => {
        console.log("Connected to model server");
    });

    socket.on("joined_room", (data) => {
        // socket.emit("load_config", CUSTOM_CONFIG);
        console.log(`Joined room ${data.room_id} as client ${data.client_id}`);
    })

    socket.on("disconnect", () => {
        console.log("Disconnected from model server");
        // demo of the logView: send the logged data to the server
        logView.addTopLevelData("test", true);
        logView.sendData("/pentomino/save_log");
    });

    socket.on("description_from_server", (data) => {
        console.log(data)
        document.getElementById("description").value = data;
    });

    socket.on("incoming connection", () => {
        audio_notification();
    });

    socket.on("next_state", (state) => {
        document.getElementById("description").value = ""
        document.getElementById("progress").value = state;
    });
    
    socket.on("finish", () => {
        alert("We are done here, you can close the window");
        stop();
    });

    // for debugging: log all events
    socket.onAny((eventName, ...args) => {
        console.log(eventName, args);
    });

    // --- stop and start drawing --- //
    function start(token) {
        // reset the controller in case any key is currently pressed
        controller.resetKeys()
        controller.attachModel(socket);
        // join a GOLMI room with the name "test_room_id"
        socket.emit("join", {"room_id": token});
    }

    function stop() {
        // reset the controller in case any key is currently pressed
        controller.resetKeys();
        // disconnect the controller
        controller.detachModel(socket);
        // manually disconnect
        socket.disconnect();
    }

    function bad_description() {
        let description = document.getElementById("description").value;
        let state_index = document.getElementById("progress").value;
        document.getElementById("description").value = ""

        socket.emit("descrimage_bad_description", {"description":description, "token": token, "state": state_index});
    }

    function audio_notification() {
        var snd = new Audio("static/notification.mp3");
        console.log("this workd")
        snd.play();
    }

    start(token);
    // --- buttons --- //
    $("#bad_description").click(() => {
        bad_description();
    });
    $("#load_file").click(() => {
        load_file();
    });
}); // on document ready end