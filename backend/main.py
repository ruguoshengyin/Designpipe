"""
Designpipe 2.0 — FastAPI application entry point.
"""
import json
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

from backend.config import get_settings
from backend.database import init_db
from backend.routers import projects, steps, generate, chat
from backend.utils.ai_client import stream_ai
from backend.utils.design_spec import get_design_spec

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.DEBUG if get_settings().debug else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(__file__)
FRONTEND_PUBLIC = os.path.join(BASE_DIR, "..", "frontend", "public")


# ── App lifecycle ─────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Designpipe 2.0 — initialising database…")
    await init_db()
    logger.info("Database ready.")
    yield
    logger.info("Shutting down.")


# ── App factory ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="Designpipe 2.0",
    description="AI-powered UX design pipeline API",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(projects.router)
app.include_router(steps.router)
app.include_router(generate.router)
app.include_router(chat.router)


# ── Global exception handler ──────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s %s", request.method, request.url)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)},
    )


# ── Compatibility: proxy-chat (mirrors old localhost:7789 interface) ───────────

@app.post("/api/proxy-chat")
async def proxy_chat(request: Request):
    """
    Drop-in replacement for the old standalone proxy server.
    Accepts {messages, image?, max_tokens?} and returns SSE stream of {"content": "..."}.
    """
    body = await request.json()
    messages = body.get("messages", [])
    image = body.get("image")
    max_tokens_raw = body.get("max_tokens")

    kwargs: dict = {}
    if image:
        kwargs["image"] = image
    if max_tokens_raw:
        try:
            kwargs["max_tokens"] = int(max_tokens_raw)
        except (TypeError, ValueError):
            pass

    async def event_stream():
        async for chunk in stream_ai(messages, **kwargs):
            yield f"data: {json.dumps({'content': chunk})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


# ── Utility endpoints ─────────────────────────────────────────────────────────

@app.get("/api/design-spec")
async def design_spec():
    return {"spec": get_design_spec()}


@app.get("/api/health")
async def health():
    cfg = get_settings()
    return {
        "status": "ok",
        "model": cfg.model,
        "debug": cfg.debug,
    }


# ── Static file serving ───────────────────────────────────────────────────────

_fonts_dir = os.path.join(FRONTEND_PUBLIC, "fonts")
if os.path.isdir(_fonts_dir):
    app.mount("/fonts", StaticFiles(directory=_fonts_dir), name="fonts")

_vendor_dir = os.path.join(FRONTEND_PUBLIC, "vendor")
if os.path.isdir(_vendor_dir):
    app.mount("/vendor", StaticFiles(directory=_vendor_dir), name="vendor")


@app.get("/app")
@app.get("/app.html")
async def serve_app():
    return FileResponse(os.path.join(FRONTEND_PUBLIC, "app.html"))


@app.get("/")
async def root():
    return FileResponse(os.path.join(FRONTEND_PUBLIC, "app.html"))


if os.path.isdir(FRONTEND_PUBLIC):
    app.mount("/public", StaticFiles(directory=FRONTEND_PUBLIC), name="public")
