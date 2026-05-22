// 转转设计系统规范 + HTML 后处理工具
// Exported for use in AI prompts and post-processing pipeline.

export const DPDesignSpec = `
## 转转 ZHUAN — 设计系统规范（来源：Figma 原稿 + 官方 Design System）

### 1. 产品调性
高密度、克制、少色、商品图自己说话。非营销 App。
严禁：banner/轮播/广告位/装饰渐变/毛玻璃/emoji/感叹号/推荐 slogan。
文案是「标签式」非「句子式」，不使用"你/您"。

### 2. 颜色 Token（来源：Figma Color 页 541:4262）
品牌主色   #FF0F27  → 选中态文字、激活Tab、CTA按钮
操作红     #FF0007  → 主按钮背景（确认/提交）
次要红     #FF483C  → 收藏选中、热销榜三角
极淡红     #FFF2F2  → 选中 chip 背景
一级文字   #111111  → 标题、商品名、价格数字（价格绝对用此色，不用红色）
二级文字   #666666  → chip 默认文字、副标题
三级文字   #999999  → 占位、辅助说明
占位灰     #BBBBBB  → 图标 placeholder
页面背景   #FFFFFF  → 列表搜索/feeds 页面（不是 #F8F8F8）
chip 底色  #F5F5F5  → 未选中 chip 背景
分割线     #F0F0F0  → 1px solid（卡片间）
描边       #D8D8D8  → 价格输入框描边
图片占位   #ECECEC  → 商品图占位框背景
警示黄     #FFA628  → 低频
警示底色   #FFFAED  → 低频
链接蓝     #42A0FF  → 低频
成功绿     #72D954  → 低频
成色青     #2E6E89  → 99新/一年质保标签
成色橙     #EE8B57  → 95新/9成新/A/B/S级标签

### 3. 字体规范
中文：PingFang SC，字重 300/400/500/600
价格数字：Akrobat ExtraBold（无字体时回退 PingFang SC 700）
禁止使用：Inter / Roboto / Arial / system-ui

字号（只用这些）：9 / 10 / 12 / 13 / 14 / 16 / 17 / 18 / 20px
字重速查：
  正文/chip文字：300
  副标题/商品名/tab默认：400
  强调/按钮文字：500
  价格¥符号：700（字号12px）
  价格数字：ExtraBold 800（字号20px，或回退700）
行高：中文标签 1.0，正文 20px（14/13px时），标题 16px

### 4. 间距系统（只用）
2 / 4 / 6 / 8 / 12 / 16 / 18 / 24 / 32px

### 5. 圆角系统（严格来自 Figma）
1px   → 卖点标签（极小胶囊，不是4px）
4px   → 商品图（小图/横版）
6px   → 选项按钮 chip
8px   → feeds商品图、TwoLineChip
16px  → 弹层底部（仅左右下）
18px  → 搜索框 pill（h36）
20px  → 主按钮 pill（h40）
999px → 成色 badge（全圆）

### 6. 布局骨架（390px 视口）
状态栏：44px（白底，9:41 + 信号/wifi/电池，#screen 第一个子元素）
搜索栏：44px
排序栏：36px
chip rail：34px
商品列表：flex:1
Tab bar：60px（不是80px）
总高：844px

### 7. 关键组件精确规范

【搜索栏 SearchHeader】
- 容器：h44，bg #fff，padding 0 12px，gap 8px
- 返回按钮：20×20 描边箭头
- 搜索框：flex:1，h36，radius 18px，border 1px solid #111，bg #fff
  - 内：放大镜 SVG（#666）+ 文字 14px/400/#111
- 右侧"搜索"按钮：14px/400/#FF0F27

【排序栏 SortTabs】
- 容器：h36，bg #fff，border-bottom 1px #F0F0F0
- 4个Tab等分：综合▼ / 价格↕ / 型号 / 筛选
- 默认：12px/300/#666
- 综合 Tab：下拉打开时才变 #FF0F27，默认为灰（绝对不能默认红色）

【快筛 Chip Rail】
- 容器：h34，overflow-x auto，padding 0 12px，gap 8px，display flex
- 单个chip：h26，padding 5px 10px，radius 6px，bg #F5F5F5
- 文字：12px/300/#666；选中文字：#111（字重保持300）
- 带下拉箭头的chip右侧加 caret-down SVG

【商品横版卡片 ProductCard（最重要）】
结构：白底，无描边，无圆角，无阴影
卡片之间：1px solid #F0F0F0 分割线（不是gap+圆角卡片）
卡片总高：~120px
内部 padding：12px（上下左右）
布局：flex row，gap 12px

### 8. 严禁清单（项目级）
✗ 页面背景用 #F8F8F8（列表搜索/feeds必须 #FFFFFF）
✗ 商品卡片加圆角/描边/阴影/gap（卡片是无框白底+分割线）
✗ chip 字重不为 300（任何状态字重必须300）
✗ 综合 Tab 默认红色（必须灰色，仅下拉时变红）
✗ 卖点标签 radius > 1px（必须1px）
✗ 商品卡图片区出现勾选圆圈/对勾/选中标记（fa-check/fa-circle-check 等）
✗ 发明规范外的装饰图形（星形/心形叠图/勋章/进度圈）
✗ emoji / 感叹号 / 营销 slogan
✗ 渐变 / 毛玻璃 / backdrop-filter
✗ Tab bar height > 60px（不是80px）
✗ 价格用红色（价格 ¥ 和数字都必须 #111111）
`;

export function DPPostProcessHtml(rawHtml: string): string {
  const scriptOpen = '<' + 'script>';
  const scriptClose = '<' + '/script>';
  const dpReset = '<meta name="viewport" content="width=390,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">'
    + '<style id="dp-guaranteed-reset">'
    + '*,*::before,*::after{box-sizing:border-box!important;}'
    + 'html{width:390px!important;max-width:390px!important;overflow:hidden!important;margin:0!important;padding:0!important;}'
    + 'body{width:390px!important;max-width:390px!important;height:844px!important;overflow:hidden!important;margin:0!important;font-family:\'PingFang SC\',-apple-system,sans-serif!important;}'
    + 'body *{max-width:390px!important;}'
    + 'body > div,body > section,body > main,body > header,body > footer,body > nav,body > #screen,body > #app{width:100%!important;max-width:100%!important;}'
    + 'body{overflow-wrap:break-word;word-break:break-word;}'
    + 'img,svg,video,canvas{max-width:100%!important;}'
    + '</style>'
    + scriptOpen + '(function(){'
    + 'function fixImg(img){var w=img.getAttribute("width")||img.offsetWidth||80;var h=img.getAttribute("height")||img.offsetHeight||80;var ph=document.createElement("div");ph.style.cssText="width:"+w+"px;height:"+h+"px;background:#ECECEC;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;";ph.innerHTML=\'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#BBBBBB" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>\';if(img.parentNode)img.parentNode.replaceChild(ph,img);}'
    + 'function isDarkBg(bg){var m=bg.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);if(m){var r=+m[1],g=+m[2],b=+m[3];return r<60&&g<60&&b<60;}return false;}'
    + 'function killPhoneChrome(){var mi=5;while(mi-->0){var f=document.body.firstElementChild;if(!f)break;var s=window.getComputedStyle(f);var br=parseInt(s.borderRadius)||0;var w=f.offsetWidth;var h=f.offsetHeight;if(isDarkBg(s.backgroundColor)&&br>=20&&w>=350&&h>=600){while(f.firstChild)document.body.insertBefore(f.firstChild,f);f.remove();continue;}if(br>=20&&w>=350&&h>=600&&f.children.length===1){var inner=f.firstElementChild;if(inner&&parseInt(window.getComputedStyle(inner).borderRadius)>=10){while(f.firstChild)document.body.insertBefore(f.firstChild,f);f.remove();continue;}}break;}document.querySelectorAll("*").forEach(function(el){var s=window.getComputedStyle(el);var r=el.getBoundingClientRect();if(!isDarkBg(s.backgroundColor))return;if(r.top<6&&r.width>=200&&r.height<=12)el.style.display="none";if(r.bottom>document.body.offsetHeight-30&&r.width>=60&&r.height<=14)el.style.display="none";});}'
    + 'function fixPriceStyle(){var walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,null,false);var n,nodes=[];while(n=walker.nextNode()){if(/¥\\s*\\d/.test(n.nodeValue)||(/^\\s*\\d{2,}(\\.\\d+)?\\s*$/.test(n.nodeValue)&&n.parentElement&&/¥/.test(n.parentElement.textContent)))nodes.push(n);}nodes.forEach(function(node){var p=node.parentElement;if(p){p.style.cssText+=";color:#111111 !important;font-family:Akrobat,\\"PingFang SC\\",-apple-system,sans-serif !important;font-weight:700 !important;";var a=p.parentElement;for(var i=0;i<2&&a&&a!==document.body;i++){var cs=window.getComputedStyle(a).color;if(/(255,\\s*15|255,\\s*72)/i.test(cs))a.style.color="#111111";a=a.parentElement;}}});}'
    + 'document.addEventListener("DOMContentLoaded",function(){document.querySelectorAll("img").forEach(function(img){if(img.src&&/^https?:\\/\\//.test(img.src)){img.onerror=function(){fixImg(this);};if(img.complete&&img.naturalWidth===0)fixImg(img);}else if(!img.src||img.src==="")fixImg(img);});killPhoneChrome();fixPriceStyle();setTimeout(function(){killPhoneChrome();fixPriceStyle();},50);});'
    + '})();' + scriptClose;

  let html = rawHtml;
  html = html.replace(/<meta[^>]*name=["']viewport["'][^>]*>/gi, '');
  if (html.match(/<\/head>/i)) {
    html = html.replace(/<\/head>/i, dpReset + '</head>');
  } else if (html.includes('<head>')) {
    html = html.replace('<head>', '<head>' + dpReset);
  } else if (html.match(/<html[^>]*>/i)) {
    html = html.replace(/(<html[^>]*>)/i, '$1<head>' + dpReset + '</head>');
  } else {
    html = dpReset + html;
  }
  return html;
}

// Also attach to window for iframe/backward compat
if (typeof window !== 'undefined') {
  (window as any).DPDesignSpec = DPDesignSpec;
  (window as any).DPPostProcessHtml = DPPostProcessHtml;
}
