import json
from backend.utils.design_spec import get_design_spec


def build_messages(project: dict, step3_concept: dict, chosen_direction: str) -> list[dict]:
    direction = next(
        (d for d in step3_concept.get("directions", []) if d["key"] == chosen_direction),
        {}
    )
    moves_text = "\n".join(f"- {m}" for m in direction.get("moves", []))

    system = f"""你是转转 App 的高级 UI 工程师，专门生成符合转转设计系统的高保真 HTML 原型。

{get_design_spec()}

---
当前项目：
产品：{project['product']}
目标用户：{project['target_user']}
核心场景：{project['scenario']}

选定设计方向：{chosen_direction} — {direction.get('title', '')}
方向理念：{direction.get('oneliner', '')}
关键设计动作：
{moves_text}

---
输出要求：
1. 输出完整独立 HTML 文件（<!DOCTYPE html> 开头）
2. 页面宽度固定 390px，height auto（内容撑开）
3. 严格按上方设计系统规范生成，直接参考 HTML 模板，不要重新发明
4. 不引用任何外部图片 URL，用 #ECECEC 灰色块 + SVG 占位图标替代
5. 不使用外部 CSS/JS 框架（纯 inline style）
6. 不使用 JavaScript
7. 生成完毕后，按自查清单逐项核查，确保无误后再输出

只输出 HTML 代码，不要有任何解释文字。"""

    return [
        {"role": "system", "content": system},
        {"role": "user", "content": "请生成高保真 HTML 页面。"},
    ]
