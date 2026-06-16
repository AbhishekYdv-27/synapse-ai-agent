from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Conversation, Message

history_bp = Blueprint("history", __name__)


@history_bp.route("/conversations", methods=["GET"])
@jwt_required()
def get_conversations():
    user_id = int(get_jwt_identity())

    conversations = Conversation.query\
        .filter_by(user_id=user_id)\
        .order_by(Conversation.updated_at.desc())\
        .all()

    return jsonify({
        "conversations": [c.to_dict() for c in conversations]
    }), 200


@history_bp.route("/conversations/<int:conv_id>", methods=["GET"])
@jwt_required()
def get_conversation(conv_id):
    user_id = int(get_jwt_identity())

    conversation = Conversation.query.filter_by(id=conv_id, user_id=user_id).first()
    if not conversation:
        return jsonify({"error": "Conversation not found"}), 404

    return jsonify({
        "conversation": conversation.to_dict(include_messages=True)
    }), 200


@history_bp.route("/conversations/<int:conv_id>", methods=["DELETE"])
@jwt_required()
def delete_conversation(conv_id):
    user_id = int(get_jwt_identity())

    conversation = Conversation.query.filter_by(id=conv_id, user_id=user_id).first()
    if not conversation:
        return jsonify({"error": "Conversation not found"}), 404

    db.session.delete(conversation)
    db.session.commit()

    return jsonify({"message": "Conversation deleted"}), 200


@history_bp.route("/conversations/<int:conv_id>/title", methods=["PATCH"])
@jwt_required()
def rename_conversation(conv_id):
    user_id = int(get_jwt_identity())
    data = request.get_json()
    new_title = data.get("title", "").strip()

    if not new_title:
        return jsonify({"error": "Title is required"}), 400

    conversation = Conversation.query.filter_by(id=conv_id, user_id=user_id).first()
    if not conversation:
        return jsonify({"error": "Conversation not found"}), 404

    conversation.title = new_title[:100]
    db.session.commit()

    return jsonify({"message": "Renamed", "title": conversation.title}), 200


@history_bp.route("/conversations", methods=["DELETE"])
@jwt_required()
def clear_all_conversations():
    user_id = int(get_jwt_identity())

    Conversation.query.filter_by(user_id=user_id).delete()
    db.session.commit()

    return jsonify({"message": "All conversations cleared"}), 200