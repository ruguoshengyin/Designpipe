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

# ── In-page secondary-interaction layer (chips / accordion / picker sheet / toast) ──
# Self-contained: auto-wires by convention + heuristics, injected before </body>.
# Does NOT touch dpShow/dpBack screen navigation.
ZZ_INTERACT = """
<style id="zz-interact-css">
.zz-seg__item--on,[data-chip].zz-on{
  border:1px solid #FF0F27!important;color:#FF0F27!important;
  background:rgba(255,15,39,0.04)!important;}
[data-acc]{cursor:pointer;}
.zz-acc-collapsed{max-height:0!important;overflow:hidden!important;
  padding-top:0!important;padding-bottom:0!important;margin-top:0!important;margin-bottom:0!important;
  opacity:0;transition:max-height .25s ease,opacity .2s ease,padding .25s ease;}
.zz-acc-body{transition:max-height .25s ease,opacity .2s ease;overflow:hidden;}
.zz-acc-arrow{transition:transform .2s ease;}
.zz-acc-arrow.zz-rot{transform:rotate(180deg);}
.zz-isheet{position:absolute;left:0;right:0;bottom:0;width:100%;max-height:72%;overflow-y:auto;
  background:#fff;border-radius:16px 16px 0 0;padding:20px 16px calc(16px + env(safe-area-inset-bottom));
  transform:translateY(100%);transition:transform .3s cubic-bezier(.4,0,.2,1);z-index:120;}
.zz-isheet.zz-open{transform:translateY(0);}
.zz-isheet-mask{position:absolute;inset:0;background:rgba(0,0,0,.5);z-index:119;display:none;}
.zz-isheet-mask.zz-open{display:block;}
.zz-toast{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) scale(.9);
  background:rgba(17,17,17,.86);color:#fff;font-size:13px;padding:11px 18px;border-radius:10px;
  z-index:240;opacity:0;pointer-events:none;transition:opacity .18s ease,transform .18s ease;
  max-width:240px;text-align:center;}
.zz-toast.zz-show{opacity:1;transform:translate(-50%,-50%) scale(1);}
</style>
<script id="zz-interact-js">
(function(){
  function ready(fn){if(document.readyState!='loading')fn();else document.addEventListener('DOMContentLoaded',fn);}
  function navs(el){var o=(el.getAttribute&&el.getAttribute('onclick'))||'';return /dpShow|dpBack/.test(o);}
  ready(function(){
    // ── Toast helper ──
    var toastEl=null,toastT=null;
    window.zzToast=function(msg){
      if(!toastEl){toastEl=document.createElement('div');toastEl.className='zz-toast';document.body.appendChild(toastEl);}
      toastEl.textContent=msg||'已选择';toastEl.classList.add('zz-show');
      clearTimeout(toastT);toastT=setTimeout(function(){toastEl.classList.remove('zz-show');},1400);
    };

    // ── 1. Chip select groups ──
    // Convention: .zz-seg (single) / [data-multi] (multi). Heuristic: any parent with >=2
    // sibling chips whose onclick does NOT navigate.
    function activate(chip,on){chip.classList.toggle('zz-on',on);chip.classList.toggle('zz-seg__item--on',on);}
    function wireChipGroup(group){
      if(group._zzc)return;
      var chips=Array.prototype.filter.call(group.children,function(c){
        var cl=(c.className||'')+'';return /chip|seg|tag|option|condition|grade|新|成新/.test(cl)||c.hasAttribute('data-chip');
      });
      // fall back to all element children if class match failed
      if(chips.length<2)chips=Array.prototype.slice.call(group.children);
      chips=chips.filter(function(c){return c.nodeType==1 && !navs(c);});
      if(chips.length<2)return;
      group._zzc=1;
      var multi=group.hasAttribute('data-multi')||/multi/.test((group.className||'')+'');
      chips.forEach(function(chip){
        chip.style.cursor='pointer';
        chip.addEventListener('click',function(e){
          if(navs(chip))return;e.stopPropagation();
          if(multi){var on=!(chip.classList.contains('zz-on'));activate(chip,on);}
          else{chips.forEach(function(c){c.classList.remove('active','is-active','selected','checked');activate(c,false);});activate(chip,true);}
        });
      });
    }
    document.querySelectorAll('[data-chips],[data-chip-group],[class*="seg"],[class*="chip"],[class*="condition"],[class*="grade"]').forEach(function(g){
      // only treat as group if it directly holds multiple chip-like children
      if(g.children&&g.children.length>=2)wireChipGroup(g);
    });

    // ── 2. Accordion (collapse/expand) ──
    // Convention: header [data-acc]; body = next element sibling. Heuristic: header class
    // contains accordion/collapse/expand, or row has a chevron-up + a following sibling block.
    function wireAcc(head){
      if(head._zza)return;head._zza=1;
      var body=head.getAttribute&&head.getAttribute('data-acc')
        ? document.getElementById(head.getAttribute('data-acc')) : head.nextElementSibling;
      if(!body)return;
      body.classList.add('zz-acc-body');
      var arrow=head.querySelector('[data-lucide],svg,[class*="arrow"],[class*="chevron"]');
      if(arrow)arrow.classList.add('zz-acc-arrow');
      head.style.cursor='pointer';
      head.addEventListener('click',function(e){
        if(navs(head))return;e.stopPropagation();
        var collapsed=body.classList.toggle('zz-acc-collapsed');
        if(arrow)arrow.classList.toggle('zz-rot',collapsed);
      });
    }
    document.querySelectorAll('[data-acc],[class*="accordion"] [class*="head"],[class*="collapse"] [class*="head"]').forEach(wireAcc);

    // ── 3. Bottom-sheet picker ──
    var mask=null;
    function ensureMask(){if(!mask){mask=document.createElement('div');mask.className='zz-isheet-mask';document.body.appendChild(mask);mask.addEventListener('click',closeSheets);}return mask;}
    function closeSheets(){document.querySelectorAll('.zz-isheet.zz-open').forEach(function(s){s.classList.remove('zz-open');});if(mask)mask.classList.remove('zz-open');}
    function openSheet(id){var s=document.getElementById(id);if(!s)return false;s.classList.add('zz-isheet','zz-open');ensureMask().classList.add('zz-open');return true;}
    window.zzCloseSheets=closeSheets;
    document.querySelectorAll('[data-sheet-open]').forEach(function(t){
      if(t._zzs)return;t._zzs=1;t.style.cursor='pointer';
      t.addEventListener('click',function(e){e.stopPropagation();if(!openSheet(t.getAttribute('data-sheet-open')))zzToast('请选择');});
    });
    document.querySelectorAll('[data-sheet-close]').forEach(function(c){if(c._zzsc)return;c._zzsc=1;c.style.cursor='pointer';c.addEventListener('click',function(e){e.stopPropagation();closeSheets();});});
    // sheet option rows write value back to trigger + close
    document.querySelectorAll('.zz-isheet [data-opt]').forEach(function(o){
      if(o._zzo)return;o._zzo=1;o.style.cursor='pointer';
      o.addEventListener('click',function(e){e.stopPropagation();
        var sheet=o.closest('.zz-isheet');var tid=sheet&&sheet.id;
        var trig=tid&&document.querySelector('[data-sheet-open="'+tid+'"] [data-picker-value]');
        if(trig)trig.textContent=o.textContent.trim();
        closeSheets();});
    });

    // ── 4. data-toast feedback (picker rows without a sheet, demo CTAs) ──
    document.querySelectorAll('[data-toast]').forEach(function(el){
      if(el._zzt)return;el._zzt=1;el.style.cursor='pointer';
      el.addEventListener('click',function(e){if(navs(el))return;e.stopPropagation();zzToast(el.getAttribute('data-toast')||'已操作');});
    });
  });
})();
</script>
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
    # 1) head CSS reset
    if re.search(r"</head>", html, re.IGNORECASE):
        html = re.sub(r"</head>", DP_RESET + "</head>", html, count=1, flags=re.IGNORECASE)
    elif "<head>" in html:
        html = html.replace("<head>", "<head>" + DP_RESET, 1)
    else:
        m = re.search(r"<html[^>]*>", html, re.IGNORECASE)
        if m:
            html = html[:m.end()] + "<head>" + DP_RESET + "</head>" + html[m.end():]
        else:
            html = DP_RESET + html
    # 2) in-page interaction layer (chips / accordion / picker sheet / toast)
    if "zz-interact-js" not in html:
        if re.search(r"</body>", html, re.IGNORECASE):
            html = re.sub(r"</body>", ZZ_INTERACT + "</body>", html, count=1, flags=re.IGNORECASE)
        else:
            html = html + ZZ_INTERACT
    return html


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
            "⛔ 视觉硬约束（只约束皮肤，不得以此为由删减任何策略模块）：\n"
            "  · 唯一强调色：#FF0F27（转转品牌红）\n"
            "  · 禁止紫色系：#6366F1 #7C3AED #8B5CF6 #9333EA #A855F7 #C084FC 及所有 purple/violet\n"
            "  · 禁止蓝色系：#007AFF #1677FF #2563EB #3B82F6 及所有 blue/indigo\n"
            "  · 禁止渐变色：任何 linear-gradient/radial-gradient 用于按钮或背景\n"
            "  · 次级按钮：bg:#F5F5F5 color:#111（不是紫色，不是蓝色）\n"
            "  · 禁止嵌套卡片：卡片内不得再套带背景+圆角+阴影的子容器，用分割线和间距区分区域\n"
            "  · 禁止混用容器风格：同一页面只能用「通栏列表行」或「圆角卡片」其中一种，不得混排\n"
            "    发布/表单页 → 统一通栏列表行，section间用8px灰色分隔块(#F8F8F8)\n"
            "    列表/首页 → 统一圆角卡片(16px)，卡片间距8px，左右margin 12px\n\n"
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
            "▓▓▓▓▓ ⚡ 二级页内交互（不跳屏，系统已内置 JS 自动接管，禁止自己写 <script>）▓▓▓▓▓\n"
            "下列「二级操作」只在本屏内响应，绝对不要绑 dpShow/dpBack：\n"
            "  · 单选标签组（如 新旧程度/成色 99新·95新…）：外层 <div class=\"zz-seg\">，每项 <span class=\"zz-seg__item\">99新</span>，"
            "默认选中项再加类 zz-seg__item--on。点击会自动切换高亮（单选）。\n"
            "  · 多选标签组（如 购买渠道/标签）：外层加 data-multi（其余同上），点击可多选切换。\n"
            "  · 可折叠区（如「补充信息 选填 ⌄」）：折叠区标题元素加 data-acc，紧跟其后的内容块会被它展开/收起；"
            "标题里放一个 chevron-down 图标作为指示箭头。\n"
            "  · 选择器行（如 商品分类/购买时间，行尾有 ›）：\n"
            "      行元素加 data-sheet-open=\"catSheet\"，值文案用 <span data-picker-value>请选择</span>；\n"
            "      并在该屏内提供底部选择层 <div class=\"zz-isheet\" id=\"catSheet\">…\n"
            "        每个选项 <div data-opt>手机数码</div>（点选后自动写回行的值并关闭）…\n"
            "        <div data-sheet-close>取消</div></div>（默认隐藏，点行弹出，点遮罩/取消关闭）。\n"
            "      若该选择器不重要、不想做完整选择层：行上改加 data-toast=\"请选择购买时间\"，点击会弹 toast 提示。\n"
            "  · 任何「演示性」按钮（点了只需反馈不跳屏）：加 data-toast=\"已提交\" 即可。\n\n"
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

        # Phase 4: Quality polish pass — alignment / spacing / typography
        yield _sse({"progress": "品质精修中：对齐、间距、排版…（约 20 秒）"})
        polish_prompt = f"""你是转转 App 的高级 UI 审查工程师。下面是一份高保真 HTML 原型，请逐项执行品质精修，直接返回修正后的完整 HTML。

【精修清单——每项必查必改，不合格直接修正，不要只说"已符合"】

① 排版精修
  - 字号/字重/颜色严格遵守对照表（见下方）：不在表中的组合一律改为最接近的规范值
  - 标题 13px/600/#111；副标题 12px/400/#666；辅助说明 11px/400/#999；时间戳 10px/400/#BBB
  - 导航栏标题 18px/700/#111；section标题 16px/700/#111
  - 价格¥符号 12px/700/#111；价格数字 Akrobat 20px/800/#111（黑色，绝非红色）
  - 行高：单行标签 1.2，正文 1.5，多行说明 1.7
  - 所有字体必须是 'PingFang SC'（检查每一处 font-family，消灭 Inter/Roboto/system-ui）

② 间距精修（4pt 基准）
  - 检查所有 padding/margin/gap，改为最接近的4的倍数（4/8/12/16/20/24/32px）
  - 页面左右内容边距统一 16px，不得出现 10px/15px/18px/20px 的边距
  - 卡片内边距 12px（紧凑）或 16px（标准）
  - 相邻元素间距：图标-文字 8px；标签间 4-8px；卡片间 0（用分割线代替）

③ 圆角精修
  - 主按钮/CTA：999px pill
  - 卡片容器：16px
  - chip筛选：6px（不是4px，不是8px）
  - 卖点标签（次日达/已验机）：1px（极小，不是4px）
  - 输入框/搜索框：999px pill
  - 图片占位：8px

④ 颜色精修
  - 消灭所有蓝色（#007AFF/#4169E1/#1677FF 等），替换：次级操作→#F5F5F5底#111字，链接→#42A0FF仅文字
  - 价格数字颜色强制为 #111111（黑色），不得为任何红色
  - 次级功能按钮（智能分组/批量编辑/自动排序等）：bg:#F5F5F5 color:#111 图标:#666
  - Lucide 图标颜色必须显式写在 style 属性中，不能依赖 color 继承

⑤ 对齐精修
  - 每个 flex 容器必须有明确的 align-items（center/flex-start/flex-end/stretch）
  - 文字与图标垂直居中：用 display:flex; align-items:center; gap:Npx 替代 margin 方案
  - 卡片内各行之间的间距统一（用 gap 或 margin-top，不要混用）
  - 底部操作栏：position:absolute; bottom:0（或 position:fixed，但在多屏结构中用absolute）

⑥ 组件尺寸精修
  - 所有按钮高度：大按钮48px / 中按钮40px / 小按钮32px
  - Chip高度：26px；内边距：0 10px
  - Tab bar高度：60px；底部padding 8px保护home indicator区
  - 导航栏内容区：44px（状态栏44px+导航44px=总88px）
  - 最小触摸区：44×44px（小按钮用 min-width/min-height 保证）

⑦ 多屏一致性
  - 检查所有 .dp-screen：同一元素（nav-bar/tab-bar/status-bar）在各屏幕高度、间距、颜色必须一致
  - 保留所有 dpShow/dpBack onclick 绑定，不得删除
  - 保留 Lucide CDN 和 lucide.createIcons() 调用

【禁止事项（修精时不得破坏）】
  - 不得删除任何业务模块或交互功能
  - 不得改变页面信息架构（只改视觉细节）
  - 不得引入新的颜色或风格

【待精修 HTML】
{final_html}

直接返回完整修正后的 HTML，从 <!DOCTYPE html> 开始，禁止 markdown，禁止说明文字。"""
        try:
            polished_chunks: list[str] = []
            async for chunk in _stream_text(polish_prompt, None, max_tokens=16000):
                polished_chunks.append(chunk)
                yield _sse({"delta": chunk})
            polished = _extract_html("".join(polished_chunks))
            if polished and len(polished) > 500:
                final_html = polished
        except Exception as e:
            logger.warning("Quality polish pass failed: %s", e)

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
