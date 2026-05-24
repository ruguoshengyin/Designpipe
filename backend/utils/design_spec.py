DESIGN_SPEC = r"""## 转转 ZHUAN — 设计系统规范 v1.2（来源：Figma 原稿 + ZhuanZhuan Design System + zhuanzhuan-design skill）

### 1. 产品调性
高密度、克制、少色、商品图自己说话。非营销 App。交易驱动，每屏都服务于一笔交易。
严禁：banner/轮播/广告位/装饰渐变/毛玻璃/emoji/感叹号/推荐 slogan/SaaS大留白/social内容流风格。
文案是「标签式」非「句子式」，不使用"你/您"。

### 2. 颜色 Token（来源：Design System v1.1 · 唯一权威）
品牌红    #FF0F27  → 价格数字 / 主CTA按钮背景 / 激活Tab / 选中态文字。仅此用途，不做装饰色。
极淡红    #FFF2F2  → 选中chip背景 / 品牌色浅底
一级文字  #111111  → 标题、商品名、价格¥符号和数字（价格必须是黑色，绝不用红色）
二级文字  #666666  → 副标题、chip默认文字、正文描述
三级文字  #999999  → 占位说明、辅助标注、月售等
占位灰    #BBBBBB  → placeholder、disabled、时间戳
页面背景  #F8F8F8  → 页面级背景（卡片外的灰面）
卡片白    #FFFFFF  → 卡片内容区、sheet背景
chip底色  #F5F5F5  → 未选中chip背景（不是#F8F8F8）
分割线    #F0F0F0  → 1px卡片间 / section间分割
描边      #D8D8D8  → 输入框描边、单选圈
图片占位  #ECECEC  → 商品图占位框背景
警示黄    #FFA628  → 到期≤3天 / 风险提示
警示底    #FFFAED  → 警示消息背景
链接蓝    #42A0FF  → 仅用于链接文字/信息型标签（低频，非交互色）
成功绿    #72D954  → 完成态（低频）
成色青    #2E6E89  → 99新/一年质保标签
成色橙    #EE8B57  → 95新/9成新/A/B/S级标签

🚫 绝对禁止蓝色交互体系：转转无蓝色主操作色
✗ #007AFF / #4169E1 / #1677FF / #0066FF / #2563EB / #3B82F6 及任何蓝色系
✗ 按钮/图标/chip选中/操作区使用蓝色
次级操作按钮正确配色 → bg:#F5F5F5  color:#111  图标:#666

### 3. 字体规范
中文界面：PingFang SC（唯一指定，不得替换）
价格数字：Akrobat ExtraBold（仅价格数字，回退 PingFang SC 800）
英文补充：Manrope（仅editorial/display，绝不替代PingFang SC）
禁止：Inter / Roboto / Arial / Open Sans / SF Pro / system-ui

### 4. 字号/字重/颜色对照表（严格执行，不得随意发明）
10px / 400 / #BBB  → 角标文字、时间戳辅助
11px / 400 / #999  → 优惠条件、到期日、次要标注
12px / 400 / #666  → 卡片描述、筛选chip文字、标签文字
13px / 600 / #111  → 卡片标题、列表主文字、优惠券名称
14px / 400 / #666  → 页面正文、表单标签
14px / 600 / #111  → 强调正文、粗体列表项
15px / 400 / #999  → Tab未选中标签
15px / 700 / #111  → Tab选中标签
16px / 700 / #111  → section标题、弹窗标题
18px / 700 / #111  → 导航栏标题（始终700，无例外）
20px / 700 / brand → sheet/弹窗价格展示
22px / 700 / brand → 底部操作栏价格
价格 ¥ 符号：12px / 700 / #111（与价格数字同色）
价格数字：Akrobat 18-26px / 700-800 / #111（黑色，不是红色）
行高：单行标签 1.2；正文 1.5-1.6；多行说明 1.7-1.85
字间距：价格 -0.02em（更紧凑有力）；导航标题 0；等宽代码 0.05em

### 5. 间距系统（4pt 基准，所有间距必须是4的倍数）
4px   xs   → 图标内边距、badge内边距
8px   sm   → 标签间隙、图标-文字间距、列表项紧缩间距
12px  md-  → 卡片内边距（紧凑）、列表行垂直间距
16px  md   → 页面左右边距（标准）、卡片标准内边距
20px  md+  → 较大卡片内边距、section标题底部
24px  lg   → 模块间距、section垂直内边距
32px  xl   → 主要section间距
48px  2xl  → 屏幕级上下边距
页面内容左右边距：16px（可用宽度 390-32=358px）

### 6. 圆角系统（来源：Design System · 严格对应组件）
4px  (r-xs)  → 角标badge / 小状态chip / 搜索关键词标签
8px  (r-sm)  → 筛选选项 / 输入框 / 上传格子 / 卡片子元素
12px (r-md)  → 优惠券卡片 / sheet选项块 / 中容器
16px (r-lg)  → 主商品卡片 / 大容器
20px (r-xl)  → 特殊大容器
999px (pill) → 全部按钮 / 搜索栏 / CTA / 主操作按钮

底部sheet：左上16px + 右上16px，下角方形（贴屏边）
卖点标签（已验机/次日达）：radius 1px（极小胶囊，不是4px）

### 7. 组件尺寸速查表（精确值，不得自行发明）
状态栏：44px（顶部，白底，9:41 + 信号/wifi/电池SVG）
导航栏内容区：44px → 导航总高 = 44+44 = 88px
底部Tab bar：49px bar + home indicator ≈ 83px总高（或固定60px含home indicator）
底部操作栏（单CTA）：64px；（价格+CTA）：80px
底部sheet把手：32×3px，bg #F0F0F0，居中，距顶10px

按钮高度：lg=48px / md=40px / sm=32px（全部pill圆角）
按钮字号：14px/700（lg/md）；13px/600（sm）
最小触摸区：44×44px（小按钮用invisible padding扩展）

搜索框：h36，radius 999px（pill），bg #F8F8F8（默认）/#FFF+1px #FF0F27（聚焦）
Chip单个：h26，radius 6px，bg #F5F5F5，字 12px/400/#666
商品图：80×80px，radius 8px，bg #ECECEC
Tab bar：h60，border-top 0.5px #F0F0F0，4等分，激活#FF0F27，未激活#999

阴影（只用这套）：0 1px 2px rgba(17,17,17,.04), 0 8px 24px rgba(17,17,17,.04)
禁止：高强度阴影（opacity>0.15）/ 彩色阴影 / 多层复杂阴影

### 8. 严禁清单
✗ 价格用红色（¥和数字必须 #111111 黑色）
✗ chip radius 4px（必须6px）/ chip bg #F8F8F8（必须 #F5F5F5）
✗ chip字重非400（任何状态必须400）
✗ 综合Tab默认红色（默认灰，仅下拉时变红）
✗ 卖点标签 radius > 1px
✗ 商品卡图片区出现勾选/对勾/选中标记
✗ 商品卡加圆角/阴影
✗ Tab bar > 60px
✗ emoji / 感叹号 / 营销slogan / 渐变 / 毛玻璃 / SaaS大留白
✗ 多色accent体系（只有红+灰，无绿/蓝/紫主操作色）
✗ 彩色插画/3D图标/装饰性插图
✗ 间距不是4px倍数
✗ 字号使用规范外数值（只用：10/11/12/13/14/15/16/18/20/22/26px）

### 9. 品质自查清单（生成后必须逐项核对，不合格必须修正后再输出）
□ 价格 ¥ 和数字都是 #111111（不是任何红色）？价格数字用 Akrobat？
□ 字体全用 PingFang SC（不是 Inter/Roboto/system-ui）？
□ 字号/字重/颜色严格按§4对照表？没有随意发明？
□ 所有间距是4的倍数？页面左右边距16px？
□ 圆角：按钮pill / 卡片16px / chip 6px / 卖点标签1px？
□ 背景：页面#F8F8F8 / 卡片#FFFFFF？
□ 没有蓝色（#007AFF等）用于交互？
□ 没有emoji/渐变/毛玻璃/装饰插图？
□ Tab bar 60px？导航总高88px？
□ 对齐：flex布局，所有子元素有明确 align-items？
□ 每个可点击元素最小触摸区44×44px？
□ Lucide图标颜色显式设置（不依赖继承）？

### 10. HTML 模板（AI 直接参考，不要重新发明）

【横版商品卡】
<div style="background:#fff;padding:12px 16px;display:flex;gap:12px;border-bottom:1px solid #F0F0F0;">
  <div style="width:80px;height:80px;border-radius:8px;background:#ECECEC;flex-shrink:0;display:flex;align-items:center;justify-content:center;">
    <i data-lucide="image" style="width:24px;height:24px;color:#BBBBBB;stroke-width:1.5;"></i>
  </div>
  <div style="flex:1;display:flex;flex-direction:column;justify-content:space-between;min-height:80px;">
    <div style="font-family:'PingFang SC',sans-serif;font-size:13px;font-weight:600;color:#111;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">Apple iPhone 15 256G 蓝色</div>
    <div style="display:flex;align-items:center;gap:4px;margin-top:4px;">
      <span style="background:#2E6E89;border-radius:4px;padding:1px 5px;font-size:10px;font-weight:600;color:#fff;">99新</span>
      <span style="font-size:11px;font-weight:400;color:#999;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">外观无划痕 功能完好</span>
    </div>
    <div style="display:flex;gap:4px;margin-top:4px;">
      <span style="height:16px;padding:0 4px;border-radius:1px;border:0.5px solid #FF0F27;font-size:10px;font-weight:400;color:#FF0F27;display:inline-flex;align-items:center;">次日达</span>
      <span style="height:16px;padding:0 4px;border-radius:1px;border:0.5px solid #111;font-size:10px;font-weight:400;color:#111;display:inline-flex;align-items:center;">已验机</span>
    </div>
    <div style="display:flex;align-items:baseline;gap:1px;margin-top:4px;">
      <span style="font-family:'PingFang SC',sans-serif;font-size:12px;font-weight:700;color:#111;">¥</span>
      <span style="font-family:'Akrobat ExtraBold','PingFang SC',sans-serif;font-size:20px;font-weight:800;color:#111;letter-spacing:-0.02em;">4280</span>
      <span style="font-family:'PingFang SC',sans-serif;font-size:11px;font-weight:400;color:#999;margin-left:8px;">月售523件</span>
    </div>
  </div>
</div>

【次级操作按钮组】
<div style="display:flex;gap:8px;padding:0 16px;">
  <button style="flex:1;height:40px;background:#F5F5F5;border:none;border-radius:999px;display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;">
    <i data-lucide="sparkles" style="width:16px;height:16px;color:#666;stroke-width:1.5;"></i>
    <span style="font-family:'PingFang SC',sans-serif;font-size:13px;font-weight:600;color:#111;">智能分组</span>
  </button>
</div>

【主CTA按钮】
<button style="width:100%;height:48px;background:#FF0F27;border:none;border-radius:999px;font-family:'PingFang SC',sans-serif;font-size:14px;font-weight:700;color:#fff;cursor:pointer;">立即购买</button>
"""


def get_design_spec() -> str:
    return DESIGN_SPEC
