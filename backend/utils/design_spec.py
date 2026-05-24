DESIGN_SPEC = r"""## 转转 ZHUAN — 设计系统规范（来源：Figma 原稿 + 官方 Design System）

### 1. 产品调性
高密度、克制、少色、商品图自己说话。非营销 App。
严禁：banner/轮播/广告位/装饰渐变/毛玻璃/emoji/感叹号/推荐 slogan。
文案是「标签式」非「句子式」，不使用"你/您"。

### 2. 颜色 Token
品牌主色   #FF0F27  → 选中态文字、激活Tab、CTA按钮
极淡红     #FFF2F2  → 选中 chip 背景
一级文字   #111111  → 标题、商品名、价格数字（价格绝对用此色，不用红色）
二级文字   #666666  → chip 默认文字、副标题
三级文字   #999999  → 占位、辅助说明
页面背景   #FFFFFF  → 列表搜索/feeds 页面（不是 #F8F8F8）
chip 底色  #F5F5F5  → 未选中 chip 背景（不是 #F8F8F8）
分割线     #F0F0F0  → 0.5px（卡片间）
描边       #D8D8D8  → 单选圈描边
图片占位   #ECECEC  → 商品图占位框背景
成色青     #2E6E89  → 99新/一年质保标签
成色橙     #EE8B57  → 95新/9成新/A/B/S级标签

### 3. 字体规范
中文：PingFang SC，字重 300/400/500/600
价格数字：Akrobat ExtraBold（无字体时回退 PingFang SC 700）
禁止使用：Inter / Roboto / Arial / system-ui

字号（只用）：9 / 10 / 12 / 13 / 14 / 16 / 17 / 18 / 20px
字重速查：
  正文/chip文字：300
  副标题/商品名：400
  价格¥符号：700（字号12px）
  价格数字：ExtraBold 800（字号20px）

### 4. 圆角系统（严格来自 Figma）
1px   → 卖点标签（极小，不是4px）
4px   → 商品图、WearBadge
6px   → 选项按钮 chip（不是4px）
8px   → feeds商品图、TwoLineChip
18px  → 搜索框 pill（h36）

### 5. 布局骨架（390px 视口）
搜索栏：44px
排序栏：36px
chip rail：34px
商品列表：flex:1
Tab bar：60px（不是80px）

### 6. 关键组件精确规范

【搜索栏】h44，搜索框 h36 radius 18px border 1px solid #111

【排序栏】h36，border-bottom 0.5px #F0F0F0，4列等分，默认 12px/300/#666
综合 Tab 默认灰色 #666，只有 dropdown 打开时才变 #FF0F27

【Chip Rail】h34，overflow-x auto，padding 0 12px，gap 8px
单个chip：h26，radius 6px，bg #F5F5F5，字 12px/300/#666
选中：bg #FFF2F2，字 #111，字重保持 300

【商品横版卡片 ProductCard（最重要）】
结构：白底，无描边，无圆角，无阴影
卡片间：0.5px solid #F0F0F0 分割线
padding 12px，flex row，gap 12px
图片区：90×90，radius 4px，bg #ECECEC，无任何叠加角标
内容区：flex:1，flex-direction column，justify-content space-between
  第1行：商品名 13px/400/#111，2行截断
  第2行：WearBadge（4px radius，青/橙色底白字） + GradeLetter（#EE8B57）+ 描述 10px/300/#999
  第3行：卖点标签 h14，radius 1px，border 0.5px，字 10px/300
    红色边框 #FF0F27：次日达/促销
    黑色边框 #111：已验机/7天无理由
    青色边框 #2E6E89：一年质保
  第4行：¥ 12px/700/#111 + 数字 Akrobat 20px/800/#111（黑色，绝不用红色）+ 月售 12px/300/#999
右侧：对比单选圈 18×18，border 1px solid #D8D8D8

【Tab bar】h60，border-top 0.5px #F0F0F0，4等分，激活 #FF0F27，未激活 #999

### 7. 严禁清单
✗ 价格用红色（价格 ¥ 和数字都必须 #111111 黑色）
✗ chip radius 4px（必须6px）
✗ chip bg #F8F8F8（必须 #F5F5F5）
✗ 页面背景 #F8F8F8（列表页必须 #FFFFFF）
✗ chip 字重不为 300（任何状态必须300）
✗ 综合 Tab 默认红色（默认灰色，仅下拉时变红）
✗ 卖点标签 radius > 1px（必须1px）
✗ 商品卡图片区有勾选/对勾/选中标记
✗ 商品卡加圆角/阴影/白色卡片容器
✗ Tab bar > 60px
✗ emoji / 感叹号 / 营销 slogan / 渐变 / 毛玻璃

### 7b. 🚫 绝对禁止蓝色——转转无蓝色交互体系
转转 App 的交互色只有红色（#FF0F27）和灰色，绝对没有蓝色。
✗ 禁止：#007AFF / #4169E1 / #1677FF / #0066FF / #2563EB / #3B82F6 以及任何蓝色系
✗ 禁止：按钮文字蓝色 / 图标蓝色 / chip选中蓝色 / 操作区蓝色背景
✗ 禁止：Lucide 图标渲染成蓝色（颜色必须显式设为 #111/#666/#999/#FF0F27，不能依赖继承）

【正确配色速查】
次级操作按钮/功能chip（如 智能分组、批量编辑、自动排序）：
  → background:#F5F5F5  color:#111111  图标色:#666666
主 CTA 按钮（如 立即购买、提交订单）：
  → background:#FF0F27  color:#ffffff
选中/激活态文字或边框：→ #FF0F27
图标默认色：→ #999999（辅助）或 #666666（功能）或 #111111（主操作）

### 8. 完整 HTML 模板（AI 必须直接参考，不要重新发明）

【横版商品卡】
<div style="background:#fff;padding:12px;display:flex;gap:12px;border-bottom:0.5px solid #F0F0F0;">
  <div style="width:90px;height:90px;border-radius:4px;background:#ECECEC;flex-shrink:0;display:flex;align-items:center;justify-content:center;">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#BBBBBB" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="#BBBBBB" stroke="none"/><path d="M21 15l-5-5L5 21"/></svg>
  </div>
  <div style="flex:1;display:flex;flex-direction:column;justify-content:space-between;min-height:90px;">
    <div style="font-family:'PingFang SC',sans-serif;font-size:13px;font-weight:400;color:#111;line-height:20px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">Apple iPhone 15 256G 蓝色 国行 全网通</div>
    <div style="display:flex;align-items:center;gap:4px;margin-top:2px;">
      <span style="background:#2E6E89;border-radius:4px;padding:1px 4px;font-size:10px;font-weight:400;color:#fff;flex-shrink:0;">99新</span>
      <span style="font-size:10px;font-weight:400;color:#EE8B57;flex-shrink:0;">A</span>
      <span style="font-size:10px;font-weight:300;color:#999;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">外观完好 · 机身无痕</span>
    </div>
    <div style="display:flex;gap:4px;flex-wrap:nowrap;overflow:hidden;margin-top:2px;">
      <span style="height:14px;padding:0 3px;border-radius:1px;border:0.5px solid #FF0F27;font-size:10px;font-weight:300;color:#FF0F27;display:inline-flex;align-items:center;flex-shrink:0;">次日达</span>
      <span style="height:14px;padding:0 3px;border-radius:1px;border:0.5px solid #111;font-size:10px;font-weight:300;color:#111;display:inline-flex;align-items:center;flex-shrink:0;">已验机</span>
    </div>
    <div style="display:flex;align-items:baseline;gap:1px;margin-top:2px;">
      <span style="font-family:'PingFang SC',sans-serif;font-size:12px;font-weight:700;color:#111;line-height:1;">¥</span>
      <span style="font-family:'Akrobat ExtraBold','PingFang SC',sans-serif;font-size:20px;font-weight:800;color:#111;line-height:1;">4280</span>
      <span style="font-family:'PingFang SC',sans-serif;font-size:12px;font-weight:300;color:#999;margin-left:6px;">月售523件</span>
    </div>
  </div>
  <div style="width:18px;height:18px;border-radius:9px;border:1px solid #D8D8D8;flex-shrink:0;align-self:center;"></div>
</div>

### 9. 生成自查清单（生成完必须逐项核查）
□ 页面背景 #FFFFFF（不是 #F8F8F8）？
□ 字体 PingFang SC（不是 Inter/Roboto）？
□ 价格 ¥ 和数字都是 #111111 黑色（不是任何红色）？
□ 价格数字用 Akrobat ExtraBold 800？
□ Chip font-weight 恒为 300？
□ Chip bg #F5F5F5，radius 6px？
□ 卖点标签 radius 1px？
□ Tab bar 高度 60px？
□ 商品卡无圆角/阴影/卡片容器？
□ 商品卡图片区无勾选/对勾？
□ 综合Tab默认灰色 #666？
□ 没有 emoji/感叹号/渐变/毛玻璃？
□ 没有发明规范外装饰？
"""


def get_design_spec() -> str:
    return DESIGN_SPEC
