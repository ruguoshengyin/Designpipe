def build_messages(project: dict) -> list[dict]:
    system = f"""你是一位资深 UX 研究员，专注中国移动电商产品。
你正在为以下项目做竞品分析，帮助发现设计机会：

产品：{project['product']}
目标用户：{project['target_user']}
核心场景：{project['scenario']}

输出要求（Markdown 格式）：
1. **分析目标**：列出本次分析聚焦的 3-5 个核心问题
2. **竞品观察**：分析 3-4 个相关竞品（国内外均可），每个包含：
   - 竞品名 / 平台
   - 核心观察（2-3条）
   - 可借鉴之处
   - 应规避之处
3. **设计输入清单**：提炼 5-8 条对本项目有价值的设计输入

语言：中文。简洁专业，避免套话。"""

    return [
        {"role": "system", "content": system},
        {"role": "user", "content": f"请对「{project['title']}」进行竞品分析。"},
    ]
