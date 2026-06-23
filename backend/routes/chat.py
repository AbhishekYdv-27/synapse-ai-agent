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


# ── Tools the agent can use ───────────────────────────────────────
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_web",
            "description": "Search the internet for current real-time information. Use this when the user asks about recent events, current news, live data, prices, sports scores, weather, or anything that needs up-to-date information beyond your training data.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query to look up on the web"
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_news",
            "description": "Search for the latest news on a topic. Use this when the user asks about recent news, breaking news, current events, or latest updates on any topic.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The news topic to search for"
                    }
                },
                "required": ["query"]
            }
        }
    }
]


# ── Tool execution ────────────────────────────────────────────────
def execute_tool(tool_name, tool_args):
    """Actually run the tool the AI decided to use."""
    try:
        if tool_name == "search_web":
            response = http_requests.post(
                "https://api.tavily.com/search",
                json={
                    "api_key": TAVILY_KEY,
                    "query": tool_args["query"],
                    "max_results": 5,
                    "search_depth": "basic"
                },
                timeout=10
            )
            results = response.json().get("results", [])
            formatted = []
            for r in results:
                formatted.append(
                    f"Source: {r['url']}\n"
                    f"Title: {r['title']}\n"
                    f"Content: {r['content'][:500]}\n"
                )
            return "\n---\n".join(formatted) or "No results found."

        elif tool_name == "search_news":
            response = http_requests.post(
                "https://api.tavily.com/search",
                json={
                    "api_key": TAVILY_KEY,
                    "query": tool_args["query"],
                    "max_results": 5,
                    "search_depth": "basic",
                    "topic": "news"
                },
                timeout=10
            )
            results = response.json().get("results", [])
            formatted = []
            for r in results:
                formatted.append(
                    f"Source: {r['url']}\n"
                    f"Title: {r['title']}\n"
                    f"Content: {r['content'][:500]}\n"
                )
            return "\n---\n".join(formatted) or "No news found."

    except Exception as e:
        return f"Tool error: {str(e)}"


# ── Agent loop ────────────────────────────────────────────────────
def run_agent(messages, mode):
    """
    Agent loop:
    1. Ask Groq what to do next
    2. If Groq wants a tool → run it → feed result back
    3. Repeat until Groq gives final answer
    """
    system_prompt = get_prompt(mode)
    system_prompt += """

You are also an AI agent with access to real-time web search tools.
- Use search_web when you need current information, facts, prices, or anything beyond your training data.
- Use search_news for recent news and current events.
- Always search before saying you don't know something that could be found online.
- After searching, synthesize the results into a clear helpful answer.
- Mention your sources when using search results.
"""

    groq_messages = [{"role": "system", "content": system_prompt}]
    groq_messages.extend(messages)

    max_iterations = 5
    iteration = 0

    while iteration < max_iterations:
        iteration += 1

        response = client.chat.completions.create(
            model=MODEL,
            max_tokens=2048,
            messages=groq_messages,
            tools=TOOLS,
            tool_choice="auto",
            temperature=0.7,
        )

        choice = response.choices[0]
        message = choice.message

        # ── Groq wants to use a tool ──
        if choice.finish_reason == "tool_calls" and message.tool_calls:

            groq_messages.append({
                "role": "assistant",
                "content": message.content or "",
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments
                        }
                    }
                    for tc in message.tool_calls
                ]
            })

            # Run each tool
            for tool_call in message.tool_calls:
                tool_name = tool_call.function.name
                tool_args = json.loads(tool_call.function.arguments)

                print(f"🔧 Agent using: {tool_name} → {tool_args}")

                tool_result = execute_tool(tool_name, tool_args)

                # Feed result back to Groq
                groq_messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": tool_result
                })

            continue  # loop again with search results

        # ── Groq has final answer ──
        else:
            return message.content.strip()

    return "I searched for information but couldn't complete the task. Please try again."


# ── Title generator ───────────────────────────────────────────────
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

    # Save messages to DB
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

    # Auto-title on first message
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