from flask_cors import cross_origin
from flask import render_template, Blueprint, jsonify, request

from app.app import app, socketio, room_manager
from golmi.server.obj import Obj

from app import DEFAULT_CONFIG_FILE

def apply_config_to(app):
    app.config[DEFAULT_CONFIG_FILE] = (
        "app/pentomino/static/resources/config/pentomino_config.json"
    )


rlenv = Blueprint(
    'RLenv',
    __name__,
    template_folder='templates',
    static_folder='static',
    url_prefix="/rlenv"
)


@cross_origin
@rlenv.route("/", methods=["GET"])
def rlenv_home():
    return (
        "added functionalities to use golmi as dynamic "
        "environment for reinforcement learning"
    )


@cross_origin
@rlenv.route("/inspect/<room_id>", methods=["GET"])
def inspector_page(room_id):
    return render_template(
        "inspector.html",
        room_id=room_id
    )


@cross_origin
@rlenv.route("/<room_id>/state", methods=["GET"])
def get_state(room_id):
    model = room_manager.get_model_of_room(room_id)
    return jsonify(model.state.to_dict(include_grid_config=True))


@cross_origin
@rlenv.route("/gripper/<room_id>/<gripper_id>", methods=["GET", "DELETE", "POST"])
def rawgripper_by_id(room_id, gripper_id):
    model = room_manager.get_model_of_room(room_id)
    gripper_dict = model.get_gripper_dict()
    if request.method == "DELETE":
        if gripper_id in gripper_dict:
            model.remove_gr(gripper_id)

            # ungrip gripped objects
            gripped_objs = gripper_dict[gripper_id]["gripped"]
            if gripped_objs is not None:
                for obj_id, obj in model.state.objs.items():
                    if obj_id in gripped_objs:
                        obj.gripped = False

            model._notify_views(
                "update_state",
                model.state.to_dict()
            )

        this_gripper = gripper_dict.get(gripper_id)

    elif request.method == "GET":
        this_gripper = gripper_dict.get(gripper_id)

    elif request.method == "POST":
        x = float(request.json["x"])
        y = float(request.json["y"])

        model.add_gr(gripper_id, x, y)
        gripper_dict = model.get_gripper_dict()
        this_gripper = gripper_dict.get(gripper_id)

        model._notify_views(
            "update_state",
            model.state.to_dict()
        )

    return dict() if this_gripper is None else this_gripper


@cross_origin
@rlenv.route("/cell/<room_id>/<x>/<y>", methods=["GET"])
def get_raw_cell(room_id, x, y):
    model = room_manager.get_model_of_room(room_id)

    tile = model.state.get_tile(float(x), float(y))
    if tile.objects:
        objs = [item.to_dict() for item in tile.objects]
        return jsonify(objs)

    return jsonify(list())

@cross_origin
@rlenv.route("/<room_id>/<x>/<y>/<blocksize>", methods=["GET"])
def get_last_object(room_id, x, y, blocksize):
    model = room_manager.get_model_of_room(room_id)
    tile = model.state.get_tile(float(x), float(y))
    if tile.objects:
        obj = tile.objects[-1].to_dict()
        return jsonify({
            str(obj["id_n"]): obj
        })

    return dict()