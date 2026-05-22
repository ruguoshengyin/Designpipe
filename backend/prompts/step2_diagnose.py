import json


def build_messages(project: dict, step1_content: str) -> list[dict]:
    system = f"""你是一位资深产品设计策略师，专注中国移动电商。
基于竞品分析，为以下项目做深度设计分析：

产品：{project['product']}
目标用户：{project['target_user']}
核心场景：{project['scenario']}

竞品分析结果：
{step1_content[:3000]}

请严格按以下 JSON schema 输出，不要输出任何 JSON 以外的内容：
{{
  "diagnosis": "一句话核心诊断（不超过50字）",
  "decisionModel": [
    {{"label": "步骤名", "sub": "说明（可选）"}}
  ],
  "tensions": [
    {{"left": "矛盾左侧", "right": "矛盾右侧", "note": "说明"}}
  ],
  "judgements": ["核心判断1", "核心判断2"],
  "opportunities": [
    {{"priority": "P0", "item": "机会点", "why": "原因", "impact": "影响"}}
  ],
  "principles": ["设计原则1", "设计原则2"]
}}

要求：
- decisionModel：用户做出决策的心智步骤，3-6项
- tensions：设计中存在的矛盾/取舍，2-4组
- judgements：你对现有设计问题的核心判断，3-5条
- opportunities：按 P0/P1/P2 优先级排序，共4-6个
- principles：指导本项目的设计原则，3-5条"""

    return [
        {"role": "system", "content": system},
        {"role": "user", "content": "请输出设计分析 JSON。"},
    ]
