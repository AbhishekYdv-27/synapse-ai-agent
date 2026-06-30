import os
from dotenv import load_dotenv
load_dotenv()

from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from models import db
from routes.auth import auth_bp
from routes.chat import chat_bp
from routes.history import history_bp


def create_app():
    app = Flask(__name__)

    # ── Database config ───────────────────────────────────────────
    if os.getenv("FLASK_ENV") == "production":
        db_path = "/data/synapse.db"
    else:
        db_path = "synapse.db"

    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = os.getenv(
        "JWT_SECRET_KEY", "change-this-in-production"
    )
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = False

    # ── Extensions ────────────────────────────────────────────────
    db.init_app(app)

    CORS(app, resources={r"/api/*": {"origins": [
        "http://localhost:3000",
        "https://synapse-ai-agent.vercel.app",
        "https://*.vercel.app"
    ]}}, allow_headers=["Content-Type", "Authorization"])

    jwt = JWTManager(app)

    limiter = Limiter(
        get_remote_address,
        app=app,
        default_limits=["200 per day", "50 per hour"],
        storage_uri="memory://",
    )

    # ── JWT error handlers ────────────────────────────────────────
    @jwt.unauthorized_loader
    def unauthorized_callback(reason):
        return jsonify({"error": "Missing or invalid token"}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(reason):
        return jsonify({"error": "Invalid token"}), 422

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({"error": "Token expired"}), 401

    # ── Blueprints ────────────────────────────────────────────────
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(chat_bp, url_prefix="/api")
    app.register_blueprint(history_bp, url_prefix="/api")

    # ── Rate limit chat ───────────────────────────────────────────
    limiter.limit("30 per minute")(chat_bp)

    # ── Health check ──────────────────────────────────────────────
    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok", "service": "Synapse AI"}), 200

    # ── Init DB ───────────────────────────────────────────────────
    with app.app_context():
        db.create_all()
        print("✅  Database tables ready")

    return app


if __name__ == "__main__":
    app = create_app()
    print("🚀  Synapse AI backend running on http://localhost:5000")
    app.run(debug=True, port=5000)