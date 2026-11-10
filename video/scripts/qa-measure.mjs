// Shared by the shell and place QA scripts. Runs inside the page.
// Runs in the page. Returns every measurement the geometry and contrast checks need.
export function measure() {
  const parse = (value) => {
    const m = value.match(/rgba?\(([^)]+)\)/);
    if (!m) {
      // oklch() and color() from Tailwind classes: let a canvas resolve them.
      const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = value;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
      return { r, g, b, a: a / 255 };
    }
    const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 };
  };
  const over = (top, bottom) => ({
    r: top.r * top.a + bottom.r * (1 - top.a),
    g: top.g * top.a + bottom.g * (1 - top.a),
    b: top.b * top.a + bottom.b * (1 - top.a),
    a: 1,
  });
  const lum = (c) => {
    const f = (v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const bgOf = (el) => {
    const layers = [];
    for (let n = el; n; n = n.parentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0) {
        layers.push(c);
        if (c.a === 1) break;
      }
    }
    let out = { r: 255, g: 255, b: 255, a: 1 };
    for (const layer of layers.reverse()) out = over(layer, out);
    return out;
  };
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return (
      r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" &&
      r.right > 0 && r.bottom > 0 && r.left < innerWidth && r.top < innerHeight
    );
  };

  const shell = document.querySelector('[data-testid="app-shell"], [data-testid="landing-view"]');
  const main = document.querySelector('[data-testid="shell-main"]');
  const contrast = [];
  const sizes = new Set();
  const fonts = [];
  for (const el of shell.querySelectorAll("*")) {
    if (el.closest('[data-testid="preview-content"]')) continue;
    const text = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).map((n) => n.textContent.trim()).join(" ");
    if (!text || !visible(el)) continue;
    const s = getComputedStyle(el);
    const fg = parse(s.color);
    const bg = bgOf(el);
    const a = lum(over(fg, bg));
    const b = lum(bg);
    const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    contrast.push({ text: text.slice(0, 40), ratio: Number(ratio.toFixed(2)) });
    if (el.closest(".cc-doc")) continue;
    sizes.add(parseFloat(s.fontSize));
    fonts.push({ text: text.slice(0, 40), family: s.fontFamily, mono: el.classList.contains("cc-mono") });
  }

  const controls = [...shell.querySelectorAll("a, button")]
    .filter((el) => !el.classList.contains("cc-skip") && !el.closest('[data-testid="preview-content"], .cc-doc') && visible(el))
    .map((el) => {
      const r = el.getBoundingClientRect();
      return { id: el.dataset.testid ?? el.textContent.trim().slice(0, 20), w: Math.round(r.width), h: Math.round(r.height), zone: el.closest('[data-testid="shell-titlebar"]') ? "title" : "chrome" };
    });

  const box = (testid) => {
    const el = [...document.querySelectorAll(`[data-testid="${testid}"]`)].find(visible);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
  };

  const clipped = [...shell.querySelectorAll(".cc-nav__label, .cc-tab__label")]
    .filter((el) => visible(el) && el.scrollWidth > el.clientWidth + 0.5)
    .map((el) => el.textContent);

  const innerOverflow = [...shell.querySelectorAll(".cc-skillpane, .cc-library, .cc-doc, .cc-card, .cc-place, .cc-proof__panel, .cc-proof__body")]
    .filter((el) => visible(el) && el.scrollWidth - el.clientWidth > 1)
    .map((el) => `${el.className}: ${el.scrollWidth - el.clientWidth}px`);

  return {
    viewport: [innerWidth, innerHeight],
    innerOverflow,
    docOverflow: document.documentElement.scrollWidth - innerWidth,
    bodyOverflow: document.body.scrollWidth - innerWidth,
    mainOverflow: main ? main.scrollWidth - main.clientWidth : 0,
    contrast,
    sizes: [...sizes],
    fonts,
    controls,
    clipped,
    sidebar: box("shell-sidebar"),
    topbar: box("shell-topbar"),
    bottombar: box("shell-bottombar"),
    mainBox: box("shell-main"),
    titlebar: box("shell-titlebar"),
    menu: box("shell-space-menu") ?? box("shell-account-menu"),
  };
}

