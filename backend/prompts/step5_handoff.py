def build_messages(project: dict, all_steps: dict) -> list[dict]:
    step1 = all_steps.get(1, {}).get("content", "")[:1000]
    step2 = all_steps.get(2, {}).get("content", "")[:1500]
    step3 = all_steps.get(3, {}).get("content", "")[:1000]

    system = f"""你是一位 UX 设计负责人，正在为以下项目撰写设计交付文档：

产品：{project['product']}
目标用户：{project['target_user']}
场景：{project['scenario']}
选定方向：{project.get('direction', 'A')}

竞品分析摘要：
{step1}

设计分析摘要：
{step2}

概念方向摘要：
{step3}

请用 Markdown 输出交付文档，包含以下章节：
## 项目背景
## 核心诊断（1-2段）
## 选定方向与理由
## 关键设计决策（3-5条，bulleted）
## 下一步建议（2-3条）
## 文件索引
| 文件 | 类型 | 说明 |
|---|---|---|

语言：中文。专业简洁，避免废话。"""

    return [
        {"role": "system", "content": system},
        {"role": "user", "content": "请生成设计交付文档。"},
    ]
