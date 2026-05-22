from pydantic import BaseModel
from typing import Optional, Literal


class ProjectCreate(BaseModel):
    product: str
    target_user: str
    scenario: str


class ProjectUpdate(BaseModel):
    product: Optional[str] = None
    target_user: Optional[str] = None
    scenario: Optional[str] = None
    direction: Optional[str] = None


class GenerateRequest(BaseModel):
    project_id: str
    step: int
    direction: Optional[Literal["A", "B", "C"]] = None
    image: Optional[str] = None


class ChatRequest(BaseModel):
    project_id: str
    step: int
    messages: list[dict]
    image: Optional[str] = None


class StepSaveRequest(BaseModel):
    data_type: Literal["json", "html", "markdown"]
    content: str
