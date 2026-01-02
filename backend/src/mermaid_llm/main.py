"""FastAPI application entry point."""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from mermaid_llm.api.routers import diagram
from mermaid_llm.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

app = FastAPI(
    title="Mermaid LLM API",
    version="0.0.1",
    description="LLM-powered Mermaid diagram generation",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(diagram.router)


@app.get("/health")
async def health() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "ok", "mode": "mock" if settings.is_mock_mode else "live"}


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint."""
    return {"message": "Mermaid LLM API", "docs": "/docs"}
