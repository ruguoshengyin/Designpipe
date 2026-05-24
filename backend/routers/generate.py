"""
Generate router — multi-phase AI orchestration for each pipeline step.

SSE event types emitted:
  {"progress": "message"}                        — progress label for frontend
  {"delta": "chunk"}                             — streaming text chunk
  {"phase_done": "name", "data": {...}}          — sub-phase completed with structured data
  {"done": true, "step": N, "data_type": "..."}  — all phases done
  {"error": "message"}                           — something went wrong
"""
import asyncio
import json
import logging
import re
from typing import AsyncGenerator, Optional

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from aiosqlite import Connection

from backend.database import get_db
from backend.exceptions import BadRequestError
from backend.models import GenerateRequest
from backend.services import step_service
from backend.services.project_service import get_project, update_project
from backend.utils.ai_client import stream_ai
from backend.utils.design_spec import get_design_spec
from backend.utils.hifi_postprocess import postprocess_hifi

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/generate", tags=["generate"])

DESIGN_SPEC = get_design_spec()

DP_RESET = """
<meta name="viewport" content="width=390,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
<style id="dp-guaranteed-reset">
@font-face{font-family:"PingFang SC";font-weight:300;src:url("/fonts/PingFangSC-Light.ttf") format("truetype");font-display:swap;}
@font-face{font-family:"PingFang SC";font-weight:400;src:url("/fonts/PingFangSC-Regular.ttf") format("truetype");font-display:swap;}
@font-face{font-family:"PingFang SC";font-weight:500;src:url("/fonts/PingFangSC-Medium.ttf") format("truetype");font-display:swap;}
@font-face{font-family:"PingFang SC";font-weight:600;src:url("/fonts/PingFangSC-SemiBold.ttf") format("truetype");font-display:swap;}
@font-face{font-family:"PingFang SC";font-weight:700;src:url("/fonts/PingFangSC-Bold.ttf") format("truetype");font-display:swap;}
*,*::before,*::after{box-sizing:border-box!important;}
html{width:390px!important;max-width:390px!important;overflow:hidden!important;margin:0!important;padding:0!important;}
body{width:390px!important;max-width:390px!important;height:844px!important;overflow:hidden!important;margin:0!important;
font-family:'PingFang SC',-apple-system,BlinkMacSystemFont,sans-serif!important;background:#FFFFFF!important;font-weight:300!important;}
.price,[class*="price"]{color:#111111!important;}
</style>
"""


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _sse(data: dict) -> str:
    return f"data: {json.dumps(data, ensure_ascii=False)}\n\n"


def _extract_json(text: str) -> Optional[dict]:
    """Best-effort JSON extraction from AI response."""
    cleaned = re.sub(r"```(?:json)?\s*", "", text).replace("```", "").strip()
    start = cleaned.find("{")
    if start == -1:
        return None
    for end in [cleaned.rfind("}"), cleaned.rfind("},")]:
        if end > start:
            try:
                return json.loads(cleaned[start:end + 1])
            except json.JSONDecodeError:
                pass
    return None


def _extract_html(text: str) -> str:
    m = re.search(r"```html\s*([\s\S]*?)```", text, re.IGNORECASE)
    if m and len(m.group(1).strip()) > 200:
        return m.group(1).strip()
    m = re.search(r"<!DOCTYPE[\s\S]*?</html>", text, re.IGNORECASE) or \
        re.search(r"<html[\s\S]*?</html>", text, re.IGNORECASE)
    if m:
        return m.group(0).strip()
    # truncated
    start = max(text.lower().find("<!doctype"), text.lower().find("<html"))
    if start != -1 and len(text) - start > 200:
        html = text[start:]
        if "</body>" not in html.lower():
            html += "\n</body>"
        if "</html>" not in html.lower():
            html += "\n</html>"
        return html
    return ""


def _inject_dp_reset(html: str) -> str:
    html = re.sub(r"<meta[^>]*name=[\"']viewport[\"'][^>]*>", "", html, flags=re.IGNORECASE)
    if re.search(r"</head>", html, re.IGNORECASE):
        return re.sub(r"</head>", DP_RESET + "</head>", html, count=1, flags=re.IGNORECASE)
    if "<head>" in html:
        return html.replace("<head>", "<head>" + DP_RESET, 1)
    m = re.search(r"<html[^>]*>", html, re.IGNORECASE)
    if m:
        return html[:m.end()] + "<head>" + DP_RESET + "</head>" + html[m.end():]
    return DP_RESET + html


async def _call_json(prompt: str, image: Optional[str] = None) -> Optional[dict]:
    """Collect full AI response, parse as JSON."""
    msgs = [{"role": "user", "content": prompt}]
    chunks = []
    async for chunk in stream_ai(msgs, image=image, max_tokens=4096):
        if chunk.startswith("__ERROR__"):
            raise RuntimeError(chunk)
        chunks.append(chunk)
    return _extract_json("".join(chunks))


async def _call_text(
    prompt: str,
    image: Optional[str] = None,
    max_tokens: int = 16000,
) -> str:
    """Collect full AI response as text."""
    msgs = [{"role": "user", "content": prompt}]
    chunks = []
    async for chunk in stream_ai(msgs, image=image, max_tokens=max_tokens):
        if chunk.startswith("__ERROR__"):
            raise RuntimeError(chunk)
        chunks.append(chunk)
    return "".join(chunks)


async def _stream_text(
    prompt: str,
    image: Optional[str] = None,
    max_tokens: int = 16000,
) -> AsyncGenerator[str, None]:
    """Stream AI response chunks (yields text strings)."""
    msgs = [{"role": "user", "content": prompt}]
    async for chunk in stream_ai(msgs, image=image, max_tokens=max_tokens):
        if chunk.startswith("__ERROR__"):
            raise RuntimeError(chunk)
        yield chunk


# ─────────────────────────────────────────────────────────────────────────────
# Step orchestration
# ─────────────────────────────────────────────────────────────────────────────

async def _orchestrate(
    step: int,
    project: dict,
    direction: Optional[str],
    image: Optional[str],
    qa_context: str,
    db: Connection,
) -> AsyncGenerator[str, None]:

    pid = project["id"]
    s1_content = await step_service.get_step_content(pid, 0, db)   # step 0 = research (user-filled)
    s1 = _extract_json(s1_content) or {}
    brief = (
        f"分析目标：{s1.get('objective', project.get('product', ''))}\n"
        f"设计输入：{'；'.join((s1.get('inputs') or [])[:3])}"
    )

    # ── Step 1: Design analysis (diagnose) ───────────────────────────────────
    if step == 1:
        yield _sse({"progress": "正在生成设计分析…（约 20 秒）"})
        prompt = f"""你是资深UX设计师。基于以下竞品分析背景，生成设计分析，只返回JSON不加说明：
{brief}{qa_context}
{{"diagnosis":"核心问题2句","decisionModel":[{{"label":"目标锁定","text":"15字"}},{{"label":"快速过滤","text":"15字"}},{{"label":"横向比对","text":"15字"}},{{"label":"信任校验","text":"15字"}},{{"label":"进入详情","text":"15字"}}],"tensions":[{{"name":"张力1","expr":"18字","design":"18字"}},{{"name":"张力2","expr":"18字","design":"18字"}},{{"name":"张力3","expr":"18字","design":"18字"}}],"judgements":["判断1","判断2","判断3"],"opportunities":[{{"p":"P0","name":"机会1","why":"15字","impact":"10字"}},{{"p":"P0","name":"机会2","why":"15字","impact":"10字"}},{{"p":"P1","name":"机会3","why":"15字","impact":"10字"}},{{"p":"P1","name":"机会4","why":"15字","impact":"10字"}},{{"p":"P2","name":"机会5","why":"15字","impact":"10字"}}],"principles":["原则1","原则2","原则3","原则4"]}}"""
        result = await _call_json(prompt, image)
        if result:
            await step_service.save_step(pid, 1, "json", json.dumps(result, ensure_ascii=False), db)
            yield _sse({"phase_done": "diagnose", "data": result})
        yield _sse({"done": True, "step": step, "data_type": "json"})

    # ── Step 2: Concept directions + wireframes ───────────────────────────────
    elif step == 2:
        s2_content = await step_service.get_step_content(pid, 1, db)
        s2 = _extract_json(s2_content) or {}
        diagnosis = s2.get("diagnosis", s1.get("objective", ""))
        opps = "；".join(f"{o['p']} {o['name']}" for o in (s2.get("opportunities") or [])[:5]) \
               or "；".join((s1.get("inputs") or [])[:3])

        # Phase 1: detect page type
        yield _sse({"progress": "正在识别页面类型…"})
        page_type = project.get("page_type") or "移动端页面"
        if image:
            try:
                pt = await _call_text(
                    "这是一张移动端 App 截图。请用5到8个字精确描述这个页面的类型，"
                    "例如发布商品页、商品详情页、搜索结果列表页等。只输出页面类型名称，不加任何其他文字。",
                    image, max_tokens=64,
                )
                page_type = pt.strip().replace('"', "").replace("。", "")[:20]
            except Exception:
                pass
        else:
            try:
                pt = await _call_text(
                    f"根据以下项目描述，推断这是移动端 App 的哪个页面类型。"
                    f"用5到8个字回答。只输出页面类型，不加任何其他文字。\n\n项目描述：{project.get('product', '')}",
                    max_tokens=64,
                )
                page_type = pt.strip().replace('"', "").replace("。", "")[:20]
            except Exception:
                pass
        await update_project(pid, {"page_type": page_type}, db)
        yield _sse({"phase_done": "page_type", "data": page_type})

        # Phase 2: generate 3 concept directions
        yield _sse({"progress": "正在生成 3 个概念方向…（约 20 秒）"})
        concept_prompt = f"""你是资深UX设计师。基于以下设计背景，生成3个差异化概念方向，只返回JSON不加说明：
诊断：{diagnosis}
机会点：{opps}
页面类型：{page_type}
{brief}{qa_context}

{{"directions":[{{"key":"A","title":"方向名(4字)","subtitle":"定位(12字)","oneliner":"策略(30字)","moves":["动作1(12字)","动作2","动作3"],"advantage":"优势(18字)","tradeoff":"代价(18字)","cost":"low","impact":"影响(12字)","cite":"对应机会"}},{{"key":"B","title":"...","subtitle":"...","oneliner":"...","moves":["...","...","..."],"advantage":"...","tradeoff":"...","cost":"med","impact":"...","cite":"...","recommended":true}},{{"key":"C","title":"...","subtitle":"...","oneliner":"...","moves":["...","...","..."],"advantage":"...","tradeoff":"...","cost":"high","impact":"...","cite":"..."}}],"recommendation":{{"pick":"B","reason":"推荐理由(35字)"}}}}"""
        concept = await _call_json(concept_prompt, image)
        if not concept:
            yield _sse({"error": "概念方向生成失败"})
            return
        directions = concept.get("directions", [])
        yield _sse({"phase_done": "concept", "data": concept})

        # Phase 3: generate ALL wireframes IN PARALLEL ─────────────────────────
        yield _sse({"progress": f"正在并行生成 {len(directions)} 个线框图…（约 40 秒）"})

        obj_text = s1.get("objective", project.get("product", ""))

        async def _gen_one_wireframe(d: dict, idx: int) -> dict:
            """Generate wireframe HTML + summary for one direction. Returns enriched dict."""
            dk = d.get("key", chr(65 + idx))
            wf_prompt = (
                f"你是UX设计师。用户的项目页面类型是【{page_type}】，截图就是这个页面。\n"
                f"请生成一份**{page_type}**的移动端黑白线框图HTML，不得改变页面类型。\n\n"
                f"【项目】\n{obj_text}\n诊断：{diagnosis}\n\n"
                f"【该方向】\n{d.get('title', '')}——{d.get('oneliner', '')}\n"
                f"关键动作：{'；'.join(d.get('moves', []))}\n\n"
                f"【关键要求】\n"
                f"- 页面类型必须是【{page_type}】，严禁生成其他类型的页面\n"
                f"- 体现该设计方向的特征（分组前置、流程可视化、模块合并等）\n\n"
                f"【线框图规范】\n"
                f"- 黑白灰阶：仅用 #FFFFFF / #F5F5F5 / #E8E8E8 / #CCCCCC / #999999 / #333333\n"
                f"- 禁止彩色、渐变、阴影\n"
                f"- 灰色矩形/圆角矩形代替图片占位\n"
                f"- 章节标题、按钮文字、Tab 文字保留真实文字，正文用灰色色块代替\n\n"
                f"【技术】\n"
                f"- width: 390px, height: 844px, overflow: hidden, margin: 0\n"
                f"- font-family: 'PingFang SC', -apple-system, sans-serif\n"
                f"- 样式用 <style> 标签内联\n"
                f"- 只返回完整 HTML，从 <!DOCTYPE html> 开始，不加说明文字、不要 markdown 代码块"
            )

            # Generate wireframe HTML
            wf_html = (
                f'<!DOCTYPE html><html><head><meta name="viewport" content="width=390,initial-scale=1">'
                f"<style>*{{box-sizing:border-box;margin:0;padding:0}}body{{width:390px;height:844px;"
                f"background:#f5f5f5;display:flex;align-items:center;justify-content:center;"
                f"font-family:'PingFang SC',sans-serif}}</style></head><body>"
                f"<div style='text-align:center;color:#999'><div style='font-size:32px;margin-bottom:12px'>⚠️</div>"
                f"<div style='font-size:14px'>方向 {dk} 线框图生成失败</div></div></body></html>"
            )
            summary = ""
            try:
                raw = await _call_text(wf_prompt, image)
                m = re.search(r"<!DOCTYPE[\s\S]*?</html>", raw, re.IGNORECASE) or \
                    re.search(r"<html[\s\S]*?</html>", raw, re.IGNORECASE)
                wf_html = m.group(0) if m else raw.replace("```html", "").replace("```", "").strip()

                # Generate summary right after (still within this coroutine)
                stripped = re.sub(r"<style[\s\S]*?</style>", "", wf_html, flags=re.IGNORECASE)
                try:
                    summary = (await _call_text(
                        f"分析以下移动端线框图HTML，提取页面区域结构，输出简洁列表。\n"
                        f"每行格式：区域名 | 高度或比例 | 核心内容描述（20字内）\n"
                        f"从上到下按顺序列出，不超过15行，只输出列表，不加任何说明\n\n"
                        f"线框图HTML：\n{stripped[:6000]}",
                        max_tokens=512,
                    )).strip()
                except Exception as e:
                    logger.warning("Wireframe %s summary failed: %s", dk, e)

            except Exception as e:
                logger.warning("Wireframe %s generation failed: %s", dk, e)

            return {"key": dk, "html": wf_html, "summary": summary}

        # Fire all wireframe tasks concurrently
        wf_tasks = [_gen_one_wireframe(d, i) for i, d in enumerate(directions)]
        wf_results = await asyncio.gather(*wf_tasks, return_exceptions=True)

        # Merge results back and emit events
        for i, result in enumerate(wf_results):
            if isinstance(result, Exception):
                dk = directions[i].get("key", chr(65 + i))
                logger.error("Wireframe %s task raised: %s", dk, result)
                result = {
                    "key": dk,
                    "html": (
                        f'<!DOCTYPE html><html><head><meta name="viewport" content="width=390,initial-scale=1">'
                        f"<style>*{{box-sizing:border-box;margin:0;padding:0}}body{{width:390px;height:844px;"
                        f"background:#f5f5f5;display:flex;align-items:center;justify-content:center;"
                        f"font-family:'PingFang SC',sans-serif}}</style></head><body>"
                        f"<div style='text-align:center;color:#999'><div style='font-size:32px;margin-bottom:12px'>⚠️</div>"
                        f"<div style='font-size:14px'>方向 {dk} 线框图生成失败</div></div></body></html>"
                    ),
                    "summary": "",
                }
            dk = result["key"]
            directions[i]["wireframeHTML"] = result["html"]
            directions[i]["wireframeSummary"] = result["summary"]
            yield _sse({"phase_done": f"wireframe_{dk}", "data": result})

        # Merge wireframes back into concept and save
        concept["directions"] = directions
        await step_service.save_step(pid, 2, "json", json.dumps(concept, ensure_ascii=False), db)
        yield _sse({"done": True, "step": step, "data_type": "json"})

    # ── Step 3: Hi-fi generation (3 phases) ───────────────────────────────────
    elif step == 3:
        s2_json = await step_service.get_step_json(pid, 2, db)
        dirs = s2_json.get("directions", [])
        dir_key = direction or (s2_json.get("recommendation") or {}).get("pick", "B")
        dir_data = next((d for d in dirs if d.get("key") == dir_key), dirs[1] if len(dirs) > 1 else {})

        page_type = project.get("page_type") or "移动端页面"
        obj = s1.get("objective") or project.get("product", "")
        product_keyword = re.search(r"[「『]([^」』]+)[」』]", obj)
        nav_title = (product_keyword.group(1).split("搜索")[0].strip() if product_keyword else "") or page_type

        has_summary = bool(dir_data.get("wireframeSummary") and len(dir_data["wireframeSummary"]) > 30)
        raw_wf = dir_data.get("wireframeHTML", "")
        has_raw_wf = len(raw_wf) > 500 and "生成失败" not in raw_wf
        wireframe_ref = ""
        if has_summary:
            wireframe_ref = dir_data["wireframeSummary"]
        elif has_raw_wf:
            wireframe_ref = re.sub(r"<style[\s\S]*?</style>", "", raw_wf, flags=re.IGNORECASE)
            wireframe_ref = re.sub(r"<!--[\s\S]*?-->", "", wireframe_ref)
            wireframe_ref = re.sub(r"\s+", " ", wireframe_ref).strip()[:4000]

        # Phase 1: strategy decomposition
        yield _sse({"progress": "正在把策略拆解为具体组件…（约 10 秒）"})
        strategy_modules = []
        try:
            decompose_prompt = (
                f"你是资深UX设计师。把下面的设计策略，针对【{page_type}】这个具体页面，"
                f"拆成可直接落地的UI模块清单。\n"
                "规则：每个关键动作至少对应1个具体模块；"
                "模块必须是页面上看得见的真实UI（卡片/横幅/步骤条/浮层/标签/分组等）；"
                "signal要写出让用户一眼能认出该策略的视觉特征。\n"
                "只返回JSON不加说明：\n\n"
                f"选定方向：{dir_data.get('title', '')}——{dir_data.get('oneliner', '')}\n"
                f"关键动作：\n"
                + "\n".join(f"{i+1}. {m}" for i, m in enumerate(dir_data.get("moves", [])))
                + f"\n页面类型：{page_type}\n"
                + (f"线框结构参考：\n{wireframe_ref[:1500]}\n" if wireframe_ref else "")
                + '\n{"modules":[{"move":"对应关键动作原文","name":"模块名(6字内)",'
                '"where":"页面位置","what":"长什么样(30字内)","signal":"一眼识别的视觉特征"}]}'
            )
            result = await _call_json(decompose_prompt, image)
            if result and isinstance(result.get("modules"), list):
                strategy_modules = [m for m in result["modules"] if m and m.get("name")]
        except Exception as e:
            logger.warning("Strategy decompose failed, fallback to moves: %s", e)

        yield _sse({"phase_done": "decompose", "data": strategy_modules})

        strategy_block = (
            "\n".join(
                f"  {i+1}. 【{m['name']}】（服务策略：{m.get('move', '')}）\n"
                f"       位置：{m.get('where', '自定')}　形态：{m.get('what', '')}　识别特征：{m.get('signal', '')}"
                for i, m in enumerate(strategy_modules)
            ) if strategy_modules else
            "\n".join(
                f"  【动作{i+1}】{m}\n        → 必须为它设计一个具体的、显眼的 UI 元素来承载"
                for i, m in enumerate(dir_data.get("moves", []))
            )
        )

        # Phase 2: generate hi-fi HTML (streaming)
        yield _sse({"progress": "高保真设计稿生成中…（约 30 秒）"})
        wireframe_section = ("线框图参考：\n" + wireframe_ref) if wireframe_ref else ""
        hifi_prompt = (
            "你是转转资深移动端UX工程师。本次任务有两个层次，顺序不可颠倒：\n"
            "① 首先必须 100% 落实下面的【设计策略】——这是这个页面之所以存在的理由；\n"
            "② 然后在策略骨架上套用转转设计规范（视觉皮肤）。\n"
            "两者冲突时——策略优先。\n\n"
            "▓▓▓▓▓ ⚡ 设计策略（最高优先级）▓▓▓▓▓\n"
            f"页面类型：【{page_type}】　导航栏标题：【{nav_title}】\n"
            f"▶ 选定方向：{dir_data.get('title', '')}（{dir_data.get('subtitle', '')}）\n"
            f"▶ 核心策略：{dir_data.get('oneliner', '')}\n"
            f"▶ 方向优势：{dir_data.get('advantage', '')}\n"
            "▶ 必含模块清单（缺一不可）：\n"
            f"{strategy_block}\n\n"
            f"{DESIGN_SPEC}\n\n"
            "█████ 页面结构规则 █████\n"
            "✅ 第一个子元素必须是 status-bar（44px）\n"
            f"✅ 第二个子元素必须是 nav-bar（44px，居中标题【{nav_title}】）\n"
            "✅ 页面宽 390px × 高 844px，overflow:hidden\n"
            "✅ 底部 Tab bar 必须贴底，高度 60px\n"
            "【状态栏模板——必须照抄】\n"
            '<div style="height:44px;display:flex;align-items:center;justify-content:space-between;padding:0 20px;background:#fff;">\n'
            '  <span style="font-size:13px;font-weight:500;font-family:\'PingFang SC\',sans-serif;">9:41</span>\n'
            '  <div style="display:flex;align-items:center;gap:6px;">...</div>\n'
            "</div>\n\n"
            f"{qa_context}\n\n"
            f"{wireframe_section}\n\n"
            "▓▓▓▓▓ ⚡ 可交互多屏原型要求（必须实现）▓▓▓▓▓\n"
            "本次必须生成【多屏可交互 HTML 原型】，包含 3-5 个完整独立屏幕，用户可点击按钮跳转屏幕。\n\n"
            "【必须采用的 HTML 骨架结构】\n"
            "<!DOCTYPE html><html><head><meta charset='UTF-8'>\n"
            "<style>\n"
            "  * { box-sizing:border-box; margin:0; padding:0; }\n"
            "  body { width:390px; height:844px; overflow:hidden; position:relative; background:#f5f5f5; }\n"
            "  .dp-screen {\n"
            "    position:absolute; top:0; left:0; width:390px; height:844px;\n"
            "    overflow:hidden; background:#fff;\n"
            "    transition:transform 0.22s cubic-bezier(.4,0,.2,1);\n"
            "    transform:translateX(100%);\n"
            "  }\n"
            "  .dp-screen.active { transform:translateX(0); }\n"
            "  .dp-screen.prev   { transform:translateX(-30%); }\n"
            "</style>\n"
            "</head><body>\n"
            "  <div class='dp-screen active' id='s1'><!-- 主屏 --></div>\n"
            "  <div class='dp-screen' id='s2'><!-- 次屏 --></div>\n"
            "  <!-- 根据需要继续添加 s3 s4 s5 -->\n"
            "<script>\n"
            "  var _hist=[];\n"
            "  function dpShow(id){\n"
            "    var cur=document.querySelector('.dp-screen.active');\n"
            "    if(cur){cur.classList.remove('active');cur.classList.add('prev');}\n"
            "    document.querySelectorAll('.dp-screen.prev').forEach(function(s){if(s.id!=(cur&&cur.id))s.classList.remove('prev');});\n"
            "    document.getElementById(id).classList.add('active');\n"
            "    if(cur)_hist.push(cur.id);\n"
            "  }\n"
            "  function dpBack(){\n"
            "    var prev=_hist.pop()||'s1';\n"
            "    var cur=document.querySelector('.dp-screen.active');\n"
            "    if(cur){cur.classList.remove('active');}\n"
            "    document.querySelectorAll('.dp-screen.prev').forEach(function(s){s.classList.remove('prev');});\n"
            "    document.getElementById(prev).classList.add('active');\n"
            "  }\n"
            "</script>\n"
            "</body></html>\n\n"
            "【屏幕规划指南——根据页面类型智能规划 3-5 个屏幕】\n"
            "  s1（主屏）：完整主页面，包含所有必含模块、Tab bar、CTA 按钮\n"
            "  s2：点击最主要 CTA（如「我想买」「立即购买」「联系卖家」「提交订单」）后的结果页\n"
            "  s3：点击次要 CTA（如「出价」「加入购物车」「查看更多图片」「筛选」）后的结果页\n"
            "  s4（可选）：再深一层的交互（图片全屏 / 评价列表 / 卖家主页 / 订单确认）\n"
            "  s5（可选）：底部 Tab 另一个 tab 的页面预览\n\n"
            "【交互绑定硬规则】\n"
            "  ① 所有按钮、Tab 项、图片入口、链接文字必须绑定 onclick=\"dpShow('sN')\" 跳转对应屏幕\n"
            "  ② s2 及之后的屏幕，nav-bar 左侧必须有 ← 返回按钮，onclick=\"dpBack()\"\n"
            "  ③ 不要使用 <a href> 跳转，所有导航只用 dpShow / dpBack\n"
            "  ④ 每个屏幕都要有完整的 status-bar + nav-bar + 页面内容 + 底部 Tab bar（若有）\n"
            "  ⑤ 所有屏幕视觉风格、色彩规范必须与 s1 保持一致\n\n"
            "▓▓▓▓▓ ⚡ 图标规范（Lucide Icons · 转转强弱标准）▓▓▓▓▓\n"
            "必须使用 Lucide 开源图标库，在 <head> 内引入 CDN：\n"
            "<script src=\"https://unpkg.com/lucide@latest/dist/umd/lucide.min.js\"></script>\n"
            "用法：<i data-lucide=\"icon-name\"></i>，在 </body> 前调用 lucide.createIcons();\n\n"
            "【转转图标强弱规范】\n"
            "强（stroke-width:2 · 主操作/强调/必要信息）\n"
            "  - 导航返回箭头（chevron-left）· nav-bar 右侧操作（share-2 / more-horizontal）\n"
            "  - 主 CTA 按钮内图标 · 底部 Tab bar 当前选中项\n"
            "  - 错误/警告提示（alert-circle · x-circle）\n"
            "弱（stroke-width:1.5 · 辅助/次级/装饰）\n"
            "  - 底部 Tab bar 未选中项 · 列表行末箭头（chevron-right）\n"
            "  - 图片占位（image）· 表单图标（search / calendar / map-pin）\n"
            "  - 卡片内辅助图标 · 标签/chip 前置图标\n"
            "尺寸规则：Tab bar 22px · Nav bar 操作 20px · 列表行内 16px · 表单内 14px\n"
            "颜色规则：主操作图标跟随父元素文字色；Tab 选中 #FF0F27；Tab 未选中 #999999；辅助图标 #BBBBBB\n"
            "禁止：emoji 代替图标 · 外部图片 src · 非 Lucide 的其他 SVG 图标库\n\n"
            "只返回完整 HTML，从 <!DOCTYPE html> 开始，禁止 markdown 代码块，禁止任何说明文字。"
        )

        hifi_chunks: list[str] = []
        async for chunk in _stream_text(hifi_prompt, image, max_tokens=16000):
            hifi_chunks.append(chunk)
            yield _sse({"delta": chunk})

        final_html = _extract_html("".join(hifi_chunks)) or "".join(hifi_chunks)

        # Phase 3: strategy verification pass
        if strategy_modules and final_html:
            yield _sse({"progress": "正在核对策略模块是否落地…（约 20 秒）"})
            module_list = "\n".join(
                f"{i+1}. 【{m['name']}】位置:{m.get('where','自定')}｜"
                f"形态:{m.get('what','')}｜识别特征:{m.get('signal','')}"
                for i, m in enumerate(strategy_modules)
            )
            check_prompt = f"""你是UX设计稿质检员。下面这份高保真HTML是一个【多屏可交互原型】，本应落地一套"必含模块"。
请逐条核对 s1（主屏）是否包含所有必含模块，把"缺失"或"只是文字提及但没有对应UI"的模块补进s1，最后返回完整修正后的HTML。

【本页必含模块清单——逐条核对（针对 s1 主屏）】
{module_list}

【核对方法】
- 对每个模块，在 s1 的 HTML 里找对应的真实UI元素（不是注释、不是纯文字一句话）
- 找到且符合"识别特征" → 保留
- 找不到 / 只是文字带过 / 不符合识别特征 → 在"位置"处补出符合"形态+识别特征"的真实UI

【硬约束——多屏结构必须完整保留】
- 只增补缺失模块、修正不达标模块，不得删除已有业务区块
- 必须保留所有 .dp-screen 屏幕（s1, s2, s3... 完整保留）
- 必须保留 <script> 中的 dpShow / dpBack 导航函数
- 必须保留所有按钮上的 onclick="dpShow(...)" / onclick="dpBack()" 绑定
- 所有屏幕仍是 390×844、overflow:hidden
- 沿用页面已有的转转视觉风格，不要引入新风格
- 图标必须使用 Lucide（<i data-lucide="...">），保留 <head> 内的 Lucide CDN script 标签和 </body> 前的 lucide.createIcons() 调用
- 直接返回完整HTML，从<!DOCTYPE html>开始，禁止markdown代码块、禁止任何说明文字

【待核对HTML】
{final_html}"""
            try:
                verified_chunks: list[str] = []
                async for chunk in _stream_text(check_prompt, image, max_tokens=16000):
                    verified_chunks.append(chunk)
                    yield _sse({"delta": chunk})
                verified = _extract_html("".join(verified_chunks))
                if verified and len(verified) > 500:
                    final_html = verified
            except Exception as e:
                logger.warning("Strategy verification pass failed: %s", e)

        # Inject dp-reset and save
        final_html = _inject_dp_reset(final_html)
        await step_service.save_step(pid, 3, "html", final_html, db)
        if direction:
            await update_project(pid, {"direction": direction}, db)
        yield _sse({"done": True, "step": step, "data_type": "html"})

    # ── Step 4: Handoff document ───────────────────────────────────────────────
    elif step == 4:
        s2_json = await step_service.get_step_json(pid, 2, db)
        dirs = s2_json.get("directions", [])
        dir_key = direction or project.get("direction") or "B"
        dir_data = next((d for d in dirs if d.get("key") == dir_key), {})
        s1_json = await step_service.get_step_json(pid, 1, db)

        yield _sse({"progress": "正在生成交付文档…（约 15 秒）"})
        prompt = f"""你是资深UX设计师。重新生成项目交付摘要，只返回JSON不加说明：
{brief}
诊断：{s1_json.get('diagnosis', '')}
选定方向：{dir_data.get('title', dir_key)}—{dir_data.get('oneliner', '')}

{{"background":"项目背景(2句)","diagnosis":"核心诊断(1-2句)","direction":"选定方向(1句)","decisions":["决策1(18字)","决策2","决策3","决策4","决策5"],"next":["建议1(18字)","建议2","建议3"],"files":[{{"name":"01-竞品分析.md","type":"md","size":"18KB"}},{{"name":"02-设计分析.md","type":"md","size":"24KB"}},{{"name":"03-概念方向.pdf","type":"pdf","size":"1.4MB"}},{{"name":"04-高保真.html","type":"html","size":"210KB"}},{{"name":"05-交付摘要.md","type":"md","size":"12KB"}}]}}"""
        result = await _call_json(prompt)
        if result:
            await step_service.save_step(pid, 4, "json", json.dumps(result, ensure_ascii=False), db)
            yield _sse({"phase_done": "handoff", "data": result})
        yield _sse({"done": True, "step": step, "data_type": "json"})

    else:
        yield _sse({"error": f"Unknown step: {step}"})


# ─────────────────────────────────────────────────────────────────────────────
# Router
# ─────────────────────────────────────────────────────────────────────────────

@router.post("")
async def generate(body: GenerateRequest):
    """
    Validate request eagerly, then stream the response.
    We open our OWN database connection inside the generator so it stays
    alive for the full duration of the SSE stream (FastAPI closes Depends
    connections when the handler returns, before the stream is consumed).
    """
    if body.step not in (1, 2, 3, 4):
        raise BadRequestError(f"Invalid step: {body.step}. Valid: 1 2 3 4")

    qa_context = f"\n{body.qa_context}\n" if body.qa_context else ""

    async def event_stream():
        import aiosqlite
        from backend.database import DB_PATH
        async with aiosqlite.connect(DB_PATH) as db:
            db.row_factory = aiosqlite.Row
            try:
                project = await get_project(body.project_id, db)
            except Exception as exc:
                yield _sse({"error": str(exc)})
                return
            try:
                async for event in _orchestrate(
                    step=body.step,
                    project=project,
                    direction=body.direction,
                    image=body.image,
                    qa_context=qa_context,
                    db=db,
                ):
                    yield event
            except Exception as exc:
                logger.exception("Generate step=%s failed", body.step)
                yield _sse({"error": str(exc)})

    return StreamingResponse(event_stream(), media_type="text/event-stream")
