from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Conversation, Message
from prompts import get_prompt
import os
from groq import Groq

chat_bp = Blueprint("chat", __name__)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = "llama-3.3-70b-versatile"


def generate_title(first_message: str) -> str:
    """Auto-generate a short conversation title from the first user message."""
    try:
        response = client.chat.completions.create(
            model=MODEL,
            max_tokens=20,
            messages=[{
                "role": "user",
                "content": f"Generate a short 3-5 word title for a chat that starts with: '{first_message[:100]}'. Reply with ONLY the title, no quotes, no punctuation at end."
            }]
        )
        return response.choices[0].message.content.strip()
    except Exception:
        return first_message[:40] + ("..." if len(first_message) > 40 else "")


@chat_bp.route("/chat", methods=["POST"])
@jwt_required()
def chat():
    user_id = int(get_jwt_identity())
    data = request.get_json()

    message = data.get("message", "").strip()
    mode = data.get("mode", "chat").lower()
    conversation_id = data.get("conversation_id")

    if not message:
        return jsonify({"error": "Message is required"}), 400

    if mode not in ["chat", "study", "coding", "math"]:
        mode = "chat"

    # Get or create conversation
    conversation = None
    if conversation_id:
        conversation = Conversation.query.filter_by(id=conversation_id, user_id=user_id).first()

    if not conversation:
        conversation = Conversation(user_id=user_id, mode=mode)
        db.session.add(conversation)
        db.session.flush()

    # Build message history for context (last 20 messages)
    history = Message.query.filter_by(conversation_id=conversation.id)\
        .order_by(Message.created_at.asc())\
        .limit(20).all()

    groq_messages = [{"role": "system", "content": get_prompt(mode)}]
    for msg in history:
        groq_messages.append({"role": msg.role, "content": msg.content})
    groq_messages.append({"role": "user", "content": message})

    # Call Groq API
    try:
        response = client.chat.completions.create(
            model=MODEL,
            max_tokens=2048,
            messages=groq_messages,
            temperature=0.7,
        )
        ai_reply = response.choices[0].message.content.strip()
    except Exception as e:
        return jsonify({"error": f"AI service error: {str(e)}"}), 503

    # Save messages to DB
    user_msg = Message(conversation_id=conversation.id, role="user", content=message)
    ai_msg = Message(conversation_id=conversation.id, role="assistant", content=ai_reply)
    db.session.add(user_msg)
    db.session.add(ai_msg)

    # Auto-title the conversation on first message
    if len(history) == 0:
        conversation.title = generate_title(message)

    # Update timestamp
    from datetime import datetime, timezone
    conversation.updated_at = datetime.now(timezone.utc)

    db.session.commit()

    return jsonify({
        "reply": ai_reply,
        "conversation_id": conversation.id,
        "conversation_title": conversation.title,
        "mode": mode,
    }), 200