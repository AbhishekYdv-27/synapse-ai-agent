from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Conversation, Message
from prompts import get_prompt
import os
import json
import requests as http_requests
from groq import Groq

chat_bp = Blueprint("chat", __name__)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
TAVILY_KEY = os.getenv("TAVILY_API_KEY")
MODEL = "llama-3.3-70b-versatile"


# ── Web search function ───────────────────────────────────────────
def search_web(query, news=False):
    """Search the web using Tavily API."""
    try:
        payload = {
            "api_key": TAVILY_KEY,
            "query": query,
            "max_results": 5,
            "search_depth": "basic"
        }
        if news:
            payload["topic"] = "news"

        response = http_requests.post(
            "https://api.tavily.com/search",
            json=payload,
            timeout=10
        )
        results = response.json().get("results", [])
        formatted = []
        for r in results:
            formatted.append(
                f"Title: {r['title']}\n"
                f"Source: {r['url']}\n"
                f"Info: {r['content'][:400]}"
            )
        return "\n\n".join(formatted) if formatted else "No results found."
    except Exception as e:
        return f"Search failed: {str(e)}"


# ── Decide if search is needed ────────────────────────────────────
def needs_search(message: str) -> bool:
    """
    Simple keyword-based check to decide if web search is needed.
    More reliable than letting the model decide via tool calls.
    """
    message_lower = message.lower()

    search_keywords = [
        # Time-sensitive
        "today", "latest", "current", "now", "recent", "2024", "2025", "2026",
        "this week", "this month", "this year", "right now", "live",
        # News
        "news", "update", "announce", "release", "launch", "just",
        # Prices / data
        "price", "stock", "crypto", "bitcoin", "rate", "cost",
        # Sports
        "score", "match", "winner", "ipl", "cricket", "football",
        "who won", "result",
        # People / events
        "who is", "what happened", "where is", "weather",
        # Explicit search intent
        "search", "find", "look up", "google",
    ]

    return any(keyword in message_lower for keyword in search_keywords)


def is_news_query(message: str) -> bool:
    """Check if it's specifically a news query."""
    news_keywords = [
        "news", "headline", "breaking", "latest news",
        "what happened", "current events", "update"
    ]
    return any(k in message.lower() for k in news_keywords)


# ── Agent loop ────────────────────────────────────────────────────
def run_agent(messages, mode):
    """
    Smart agent:
    1. Check if search is needed based on message keywords
    2. If yes → search web → inject results into prompt
    3. Always give final answer via Groq
    """
    # Get the latest user message
    user_message = ""
    for msg in reversed(messages):
        if msg["role"] == "user":
            user_message = msg["content"]
            break

    system_prompt = get_prompt(mode)
    search_context = ""

    # ── Step 1: Decide if search needed ──
    if needs_search(user_message):
        print(f"🔍 Searching web for: {user_message}")

        is_news = is_news_query(user_message)
        search_results = search_web(user_message, news=is_news)

        search_context = f"""
REAL-TIME WEB SEARCH RESULTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{search_results}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Use the above search results to answer the user's question accurately.
Always mention your sources. If results are not relevant, use your training data.
"""
        print(f"✅ Search complete")

    # ── Step 2: Build final prompt ──
    if search_context:
        full_system = system_prompt + "\n\n" + search_context + """

You are an AI agent with real-time web access.
When you have search results, use them to give accurate, up-to-date answers.
Always cite your sources at the end of your response.
"""
    else:
        full_system = system_prompt

    # ── Step 3: Get answer from Groq ──
    groq_messages = [{"role": "system", "content": full_system}]
    groq_messages.extend(messages)

    response = client.chat.completions.create(
        model=MODEL,
        max_tokens=2048,
        messages=groq_messages,
        temperature=0.7,
    )

    return response.choices[0].message.content.strip()


# ── Title generator ───────────────────────────────────────────────
def generate_title(first_message: str) -> str:
    """Auto-generate a short conversation title."""
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


# ── Main chat route ───────────────────────────────────────────────
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
        conversation = Conversation.query.filter_by(
            id=conversation_id, user_id=user_id
        ).first()

    if not conversation:
        conversation = Conversation(user_id=user_id, mode=mode)
        db.session.add(conversation)
        db.session.flush()

    # Build message history (last 20 messages)
    history = Message.query.filter_by(
        conversation_id=conversation.id
    ).order_by(Message.created_at.asc()).limit(20).all()

    # Build messages for agent
    groq_messages = []
    for msg in history:
        groq_messages.append({
            "role": msg.role,
            "content": msg.content
        })
    groq_messages.append({"role": "user", "content": message})

    # ── Run the agent ──
    try:
        ai_reply = run_agent(groq_messages, mode)
    except Exception as e:
        return jsonify({"error": f"AI service error: {str(e)}"}), 503

    # Save to DB
    user_msg = Message(
        conversation_id=conversation.id,
        role="user",
        content=message
    )
    ai_msg = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=ai_reply
    )
    db.session.add(user_msg)
    db.session.add(ai_msg)

    # Auto-title first message
    if len(history) == 0:
        conversation.title = generate_title(message)

    from datetime import datetime, timezone
    conversation.updated_at = datetime.now(timezone.utc)
    db.session.commit()

    return jsonify({
        "reply": ai_reply,
        "conversation_id": conversation.id,
        "conversation_title": conversation.title,
        "mode": mode,
    }), 200