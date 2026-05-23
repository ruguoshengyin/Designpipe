from pydantic import BaseModel, Field
from typing import Optional, Literal, List


class ProjectCreate(BaseModel):
    product: str
    target_user: str
    scenario: str
    title: str = "新设计项目"
    style: str = "通用风格"
    cover: str = "mobile"
    status: str = "草稿"
    tag: Optional[str] = None
    collaborators: List[str] = Field(default_factory=list)


class ProjectUpdate(BaseModel):
    product: Optional[str] = None
    target_user: Optional[str] = None
    scenario: Optional[str] = None
    direction: Optional[str] = None
    title: Optional[str] = None
    style: Optional[str] = None
    cover: Optional[str] = None
    current_step: Optional[int] = None
    max_step: Optional[int] = None
    status: Optional[str] = None
    tag: Optional[str] = None
    collaborators: Optional[List[str]] = None
    page_type: Optional[str] = None
    uploaded_image: Optional[str] = None


class GenerateRequest(BaseModel):
    project_id: str
    step: int                                       # 1=diagnose 2=concept+wf 3=hifi 4=handoff
    direction: Optional[Literal["A", "B", "C"]] = None
    image: Optional[str] = None                    # base64 data-uri
    qa_context: Optional[str] = None               # Q&A answers from Kickoff


class ChatRequest(BaseModel):
    project_id: str
    step: int
    messages: list[dict]
    image: Optional[str] = None
    max_tokens: Optional[int] = None


class StepSaveRequest(BaseModel):
    data_type: Literal["json", "html", "markdown"]
    content: str
