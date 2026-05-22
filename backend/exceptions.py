"""
Custom application exceptions.
Routers catch these and return appropriate HTTP responses.
"""
from fastapi import HTTPException


class NotFoundError(HTTPException):
    def __init__(self, resource: str = "Resource", id: str = ""):
        detail = f"{resource} not found" + (f": {id}" if id else "")
        super().__init__(status_code=404, detail=detail)


class BadRequestError(HTTPException):
    def __init__(self, detail: str):
        super().__init__(status_code=400, detail=detail)


class AIError(RuntimeError):
    """Raised when the AI backend returns an error code."""
    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(f"[{code}] {message}")
