from backend.prompts.step3_concept import build_messages as _concept_msgs


def build_messages(project: dict, step3_concept: dict, direction_key: str) -> list[dict]:
    direction = next(
        (d for d in step3_concept.get("directions", []) if d["key"] == direction_key),
        {}
    )

    moves_text = "\n".join(f"- {m}" for m in direction.get("moves", []))

    system = f"""你是一位专业 UI 工程师，正在生成移动端低保真线框图 HTML。

当前方向 {direction_key}：{direction.get('title', '')}
理念：{direction.get('oneliner', '')}
关键动作：
{moves_text}

产品：{project['product']}
场景：{project['scenario']}

生成要求（严格遵守）：
1. 输出完整独立 HTML 文件（<!DOCTYPE html> 开头）
2. 页面宽度 390px，高度自适应
3. 全灰度配色：
   - 背景：#FFFFFF
   - 占位色块：#E8E8E8（图片区）、#D0D0D0（深色块）
   - 文字色：#333（深）、#888（浅）、#BBB（占位）
   - 分割线：#EEEEEE
4. 严禁任何品牌色（#FF0F27、#EE8B57、#2E6E89 等）
5. 不使用外部图片 URL，图片用灰色块代替
6. 字体：font-family: 'PingFang SC', sans-serif 即可，线框图不加载外部字体
7. 用灰色矩形块代替真实文字内容，只保留关键标签文字
8. Tab bar 高度 40px（线框缩小比例，非高保真的 60px）
9. 搜索框 height 28px，radius 14px
10. 不使用 JavaScript

只输出 HTML 代码，不要有任何解释文字。"""

    return [
        {"role": "system", "content": system},
        {"role": "user", "content": f"请生成方向 {direction_key} 的低保真线框图 HTML。"},
    ]
