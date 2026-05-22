DPRESET = """<script>
(function(){
  // 1. Viewport
  var m = document.querySelector('meta[name=viewport]');
  if (!m) { m = document.createElement('meta'); m.name = 'viewport'; document.head.prepend(m); }
  m.content = 'width=390,initial-scale=1,maximum-scale=1';

  // 2. Font-face (PingFang SC from /fonts/)
  var style = document.createElement('style');
  style.textContent = [
    "@font-face{font-family:'PingFang SC';font-weight:300;src:url('/fonts/PingFangSC-Light.ttf')format('truetype')}",
    "@font-face{font-family:'PingFang SC';font-weight:400;src:url('/fonts/PingFangSC-Regular.ttf')format('truetype')}",
    "@font-face{font-family:'PingFang SC';font-weight:500;src:url('/fonts/PingFangSC-Medium.ttf')format('truetype')}",
    "@font-face{font-family:'PingFang SC';font-weight:600;src:url('/fonts/PingFangSC-Semibold.ttf')format('truetype')}",
    "@font-face{font-family:'PingFang SC';font-weight:700;src:url('/fonts/PingFangSC-Bold.ttf')format('truetype')}",
    "*{-webkit-font-smoothing:antialiased;box-sizing:border-box}",
    "html,body{margin:0;padding:0;width:390px;overflow-x:hidden}",
  ].join('');
  document.head.appendChild(style);

  // 3. Fix external images → grey placeholder
  document.addEventListener('DOMContentLoaded', function(){
    document.querySelectorAll('img[src]').forEach(function(img){
      var src = img.getAttribute('src') || '';
      if (src.startsWith('http') || src.startsWith('//')) {
        img.removeAttribute('src');
        img.style.background = '#ECECEC';
        img.style.display = 'block';
      }
    });

    // 4. Force price colour to #111111 (defensive)
    document.querySelectorAll('[class*=price],[class*=Price]').forEach(function(el){
      if (getComputedStyle(el).color.includes('255,')) {
        el.style.color = '#111111';
      }
    });
  });
})();
</script>"""


def postprocess_hifi(raw_html: str) -> str:
    """Inject dpReset script into AI-generated hi-fi HTML."""
    if "<head>" in raw_html:
        return raw_html.replace("<head>", "<head>" + DPRESET, 1)
    if "<html>" in raw_html:
        return raw_html.replace("<html>", "<html><head>" + DPRESET + "</head>", 1)
    return DPRESET + raw_html
