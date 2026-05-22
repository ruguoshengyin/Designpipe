import json


def build_messages(project: dict, step2_content: str) -> list[dict]:
    system = f"""你是一位资深 UX 设计师，正在为以下项目制定设计方向：

产品：{project['product']}
目标用户：{project['target_user']}
核心场景：{project['scenario']}

设计分析：
{step2_content[:2000]}

请严格按以下 JSON schema 输出三个差异化设计方向，不要输出 JSON 以外的内容：
{{
  "recommendation": {{"pick": "A", "reason": "推荐理由（一句话）"}},
  "directions": [
    {{
      "key": "A",
      "title": "方向名称",
      "subtitle": "副标题",
      "oneliner": "一句话描述这个方向的核心理念",
      "moves": ["关键设计动作1", "关键设计动作2", "关键设计动作3"],
      "advantage": "核心优势",
      "tradeoff": "主要权衡/代价",
      "cost": "low",
      "impact": "预期影响",
      "cite": "参考案例或依据",
      "recommended": true
    }},
    {{
      "key": "B",
      ...
    }},
    {{
      "key": "C",
      ...
    }}
  ]
}}

要求：
- 三个方向必须有明显差异（不是同一思路的微调）
- cost: "low"/"med"/"high"
- moves：每个方向 3-4 条具体可执行的设计动作
- 推荐其中一个，给出推荐理由"""

    return [
        {"role": "system", "content": system},
        {"role": "user", "content": "请输出三个设计方向 JSON。"},
    ]
