import json
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

from backend.database import init_db
from backend.routers import projects, steps, generate, chat
from backend.utils.ai_client import stream_ai
from backend.utils.design_spec import get_design_spec

BASE_DIR = os.path.dirname(__file__)
FRONTEND_PUBLIC = os.path.join(BASE_DIR, "..", "frontend", "public")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="Designpipe 2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router)
app.include_router(steps.router)
app.include_router(generate.router)
app.include_router(chat.router)


# ── Compatibility endpoint: mirrors the old localhost:7789/chat interface ──
@app.post("/api/proxy-chat")
async def proxy_chat(request: Request):
    body = await request.json()
    messages = body.get("messages", [])
    image = body.get("image")
    max_tokens = body.get("max_tokens")

    async def event_stream():
        kwargs = {"image": image}
        if max_tokens:
            try:
                kwargs["max_tokens"] = int(max_tokens)
            except (TypeError, ValueError):
                pass
        async for chunk in stream_ai(messages, **kwargs):
            # Use same format as old proxy: {"content": "..."}
            yield f"data: {json.dumps({'content': chunk})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.get("/api/design-spec")
async def design_spec():
    return {"spec": get_design_spec()}


@app.get("/api/health")
async def health():
    return {"status": "ok"}


# ── Serve fonts ────────────────────────────────────────────────────────────
_fonts_dir = os.path.join(FRONTEND_PUBLIC, "fonts")
if os.path.isdir(_fonts_dir):
    app.mount("/fonts", StaticFiles(directory=_fonts_dir), name="fonts")

# ── Serve vendor scripts ───────────────────────────────────────────────────
_vendor_dir = os.path.join(FRONTEND_PUBLIC, "vendor")
if os.path.isdir(_vendor_dir):
    app.mount("/vendor", StaticFiles(directory=_vendor_dir), name="vendor")


# ── Serve the main app HTML ────────────────────────────────────────────────
@app.get("/app")
@app.get("/app.html")
async def serve_app():
    return FileResponse(os.path.join(FRONTEND_PUBLIC, "app.html"))


@app.get("/")
async def root():
    return FileResponse(os.path.join(FRONTEND_PUBLIC, "app.html"))


# ── Serve any other public static files ───────────────────────────────────
if os.path.isdir(FRONTEND_PUBLIC):
    app.mount("/public", StaticFiles(directory=FRONTEND_PUBLIC), name="public")
