const baseTheme = {
  app_bg: "#0f0f0f",
  panel_bg: "#1a1a1a",
  panel_inner: "#151515",
  menu_bg: "#181b22",
  menu_text: "#cfd5dd",
  left_bg: "#14171d",
  left_section_bg: "#101318",
  right_bg: "#15181e",
  right_card_bg: "#1a1d23",
  tab_bg: "#15181e",
  tab_active: "#4cc2ff",
  tab_text: "#c8d0da",
  input_bg: "#0f1217",
  input_border: "#333333",
  button_bg: "#4cc2ff",
  button_hover: "#5fd0ff",
  text_primary: "#ffffff",
  text_secondary: "#9ca4af",
  success: "#00cc88",
  error: "#ff5c72",
  accent: "#4cc2ff",
};

const presets = {
  dark: { ...baseTheme },
  neon: {
    app_bg: "#050507",
    panel_bg: "#0d0f14",
    panel_inner: "#081117",
    menu_bg: "#09131a",
    menu_text: "#8affc1",
    left_bg: "#081118",
    left_section_bg: "#071018",
    right_bg: "#091018",
    right_card_bg: "#0e1520",
    tab_bg: "#0b1018",
    tab_active: "#00ffa3",
    tab_text: "#d8fff1",
    input_bg: "#060b10",
    input_border: "#1f2937",
    button_bg: "#00ffa3",
    button_hover: "#00ffd0",
    text_primary: "#ffffff",
    text_secondary: "#8affc1",
    success: "#00ffa3",
    error: "#ff4d8d",
    accent: "#00ffa3",
  },
  light: {
    app_bg: "#f5f5f5",
    panel_bg: "#ffffff",
    panel_inner: "#f0f3f6",
    menu_bg: "#e8edf3",
    menu_text: "#39424e",
    left_bg: "#eef3f8",
    left_section_bg: "#f5f7fa",
    right_bg: "#eef3f8",
    right_card_bg: "#ffffff",
    tab_bg: "#eef3f8",
    tab_active: "#4cc2ff",
    tab_text: "#364152",
    input_bg: "#ffffff",
    input_border: "#d4d8dd",
    button_bg: "#4cc2ff",
    button_hover: "#3aaedc",
    text_primary: "#111111",
    text_secondary: "#555555",
    success: "#0ea56b",
    error: "#d9485f",
    accent: "#4cc2ff",
  },
};

const defaultTemplate = `QWidget {
    background-color: {{app_bg}};
    color: {{text_primary}};
}

QMainWindow {
    background-color: {{app_bg}};
}

QMenuBar, QMenu {
    background-color: {{menu_bg}};
    color: {{menu_text}};
}

QDockWidget, QGroupBox, QStatusBar {
    background-color: {{panel_bg}};
}

QLineEdit, QComboBox, QTextEdit, QPlainTextEdit {
    background-color: {{input_bg}};
    border: 1px solid {{input_border}};
    color: {{text_primary}};
}

QPushButton, QToolButton {
    background-color: {{button_bg}};
    color: #000000;
}

QPushButton:hover, QToolButton:hover {
    background-color: {{button_hover}};
}

QTabBar::tab {
    background-color: {{tab_bg}};
    color: {{tab_text}};
}

QTabBar::tab:selected {
    background-color: {{tab_active}};
    color: #000000;
}
`;

const THEME_KEYS = Object.keys(baseTheme);
const theme = { ...baseTheme };
const defaultTheme = { ...baseTheme };

const canvas = document.getElementById("bg");
const ctx = canvas.getContext("2d");
const preview = document.getElementById("preview");
const downloadButton = document.getElementById("download");
const qssUpload = document.getElementById("qssUpload");
const themeNameInput = document.getElementById("themeName");
const resetButton = document.getElementById("resetTheme");
const advancedModeToggle = document.getElementById("advancedMode");
const toast = document.getElementById("toast");
const startCreatingButton = document.getElementById("startCreating");
const generatorSection = document.getElementById("generator");
const palettePreviewCard = document.getElementById("palettePreviewCard");
const palettePreview = document.getElementById("palettePreview");
const glow = document.createElement("div");
const spotlight = document.createElement("div");
const toolCard = document.querySelector(".tool-card");
const sidebar = document.querySelector(".sidebar");
const previewPane = document.querySelector(".preview");
const cards = [...document.querySelectorAll(".card")];
const stepSections = [...document.querySelectorAll("[data-step-group]")];
const stepTabs = [...document.querySelectorAll(".step-tab")];
const colorInputs = [...document.querySelectorAll("input[type='color']")];
const previewZones = [...previewPane.querySelectorAll("[data-zone]")];

let template = defaultTemplate;
let particles = [];
let mouse = { x: 0, y: 0 };
let currentStep = "base";

const COLOR_VALUE_RE =
  /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)/g;

glow.className = "cursor-glow";
document.body.appendChild(glow);
spotlight.className = "spotlight";
document.body.appendChild(spotlight);

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function createParticles() {
  particles = [];

  for (let index = 0; index < 80; index += 1) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 2 + 1,
    });
  }
}

function drawParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach((particle) => {
    particle.x += particle.vx;
    particle.y += particle.vy;

    if (particle.x < 0 || particle.x > canvas.width) {
      particle.vx *= -1;
    }

    if (particle.y < 0 || particle.y > canvas.height) {
      particle.vy *= -1;
    }

    const dx = mouse.x - particle.x;
    const dy = mouse.y - particle.y;

    particle.x += dx * 0.0005;
    particle.y += dy * 0.0005;

    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(76,194,255,0.6)";
    ctx.fill();
  });

  requestAnimationFrame(drawParticles);
}

function shiftHexColor(hex, amount) {
  const normalized = hex.replace("#", "");
  if (normalized.length === 3) {
    return shiftHexColor(
      `#${normalized[0]}${normalized[0]}${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}`,
      amount
    );
  }

  if (normalized.length !== 6) {
    return normalizeColor(hex) || hex;
  }

  const clamp = (value) => Math.max(0, Math.min(255, value));
  const r = clamp(parseInt(normalized.slice(0, 2), 16) + amount);
  const g = clamp(parseInt(normalized.slice(2, 4), 16) + amount);
  const b = clamp(parseInt(normalized.slice(4, 6), 16) + amount);

  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function clampHex(value) {
  return normalizeColor(value) || "";
}

function hexToRgb(hex) {
  const normalized = clampHex(hex).replace("#", "");
  if (normalized.length !== 6) {
    return null;
  }

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b].map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0")).join("")}`;
}

function luminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return 0;
  }

  const transform = (value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * transform(rgb.r) + 0.7152 * transform(rgb.g) + 0.0722 * transform(rgb.b);
}

function contrastRatio(first, second) {
  const light = Math.max(luminance(first), luminance(second));
  const dark = Math.min(luminance(first), luminance(second));
  return (light + 0.05) / (dark + 0.05);
}

function mixColors(first, second, amount) {
  const rgbFirst = hexToRgb(first);
  const rgbSecond = hexToRgb(second);
  if (!rgbFirst || !rgbSecond) {
    return first;
  }

  const mix = (left, right) => left + (right - left) * amount;
  return rgbToHex({
    r: mix(rgbFirst.r, rgbSecond.r, amount),
    g: mix(rgbFirst.g, rgbSecond.g, amount),
    b: mix(rgbFirst.b, rgbSecond.b, amount),
  });
}

function ensureContrast(textColor, backgroundColor, minimum = 4.5) {
  const safeText = clampHex(textColor) || "#ffffff";
  const safeBackground = clampHex(backgroundColor) || "#000000";
  if (contrastRatio(safeText, safeBackground) >= minimum) {
    return safeText;
  }

  const whiteContrast = contrastRatio("#ffffff", safeBackground);
  const blackContrast = contrastRatio("#000000", safeBackground);
  return whiteContrast >= blackContrast ? "#ffffff" : "#000000";
}

function saturateHex(hex, amount) {
  const normalized = clampHex(hex).replace("#", "");
  if (normalized.length !== 6) {
    return hex;
  }

  const [r, g, b] = [0, 2, 4].map((index) => parseInt(normalized.slice(index, index + 2), 16));
  const average = (r + g + b) / 3;
  const adjust = (channel) => {
    const delta = (channel - average) * amount;
    return Math.max(0, Math.min(255, Math.round(channel + delta)));
  };

  return `#${[adjust(r), adjust(g), adjust(b)].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function normalizeColor(value) {
  if (!value) {
    return "";
  }

  const trimmed = value.trim();
  if (trimmed.startsWith("#")) {
    if (trimmed.length === 4) {
      return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`.toLowerCase();
    }

    return trimmed.toLowerCase();
  }

  const rgbMatch = trimmed.match(/^rgba?\(([^)]+)\)$/i);
  if (!rgbMatch) {
    return "";
  }

  const [r, g, b] = rgbMatch[1]
    .split(",")
    .slice(0, 3)
    .map((part) => Number.parseFloat(part.trim()));

  if ([r, g, b].some((part) => Number.isNaN(part))) {
    return "";
  }

  return `#${[r, g, b]
    .map((part) => Math.max(0, Math.min(255, Math.round(part))).toString(16).padStart(2, "0"))
    .join("")}`;
}

function stripComments(qss) {
  return qss.replace(/\/\*[\s\S]*?\*\//g, "");
}

function extractColors(value) {
  if (/gradient|url\(|image\s*:|icon\s*:|transparent\b/i.test(value)) {
    return [];
  }

  return (value.match(COLOR_VALUE_RE) || []).map(normalizeColor).filter(Boolean);
}

function collectDeclarations(qss) {
  const declarations = [];
  const blockRe = /([^{}]+)\{([^{}]*)\}/g;
  const propRe = /([A-Za-z-]+)\s*:\s*([^;]+);/g;
  const clean = stripComments(qss);
  let blockMatch;

  while ((blockMatch = blockRe.exec(clean)) !== null) {
    const selectors = blockMatch[1]
      .split(",")
      .map((selector) => selector.trim())
      .filter(Boolean);
    const body = blockMatch[2];
    let propMatch;

    propRe.lastIndex = 0;

    while ((propMatch = propRe.exec(body)) !== null) {
      const property = propMatch[1].trim().toLowerCase();
      const value = propMatch[2].trim();
      const colors = extractColors(value);

      if (!colors.length) {
        continue;
      }

      selectors.forEach((selector) => {
        declarations.push({
          selector: selector.toLowerCase(),
          property,
          value,
          colors,
        });
      });
    }
  }

  return declarations;
}

function addCandidate(bucket, color) {
  if (!color) {
    return;
  }

  bucket[color] = (bucket[color] || 0) + 1;
}

function pickColor(bucket, fallback) {
  const entries = Object.entries(bucket);
  if (!entries.length) {
    return fallback;
  }

  entries.sort((left, right) => right[1] - left[1]);
  return entries[0][0];
}

function classifyColors(qss) {
  const declarations = collectDeclarations(qss);
  const buckets = THEME_KEYS.reduce((accumulator, key) => {
    accumulator[key] = {};
    return accumulator;
  }, {});

  declarations.forEach((declaration) => {
    const { selector, property, colors } = declaration;
    const firstColor = colors[0];
    const lastColor = colors[colors.length - 1];

    if (property === "color" || property === "selection-color") {
      colors.forEach((color) => {
        if (selector.includes(":disabled") || selector.includes("[status=\"info\"]")) {
          addCandidate(buckets.text_secondary, color);
        } else if (selector.includes("qmenubar")) {
          addCandidate(buckets.menu_text, color);
        } else if (selector.includes("qtabbar::tab")) {
          addCandidate(buckets.tab_text, color);
        } else if (selector.includes("[status=\"active\"]") || selector.includes("success")) {
          addCandidate(buckets.success, color);
        } else if (selector.includes("error")) {
          addCandidate(buckets.error, color);
        } else {
          addCandidate(buckets.text_primary, color);
        }
      });
      return;
    }

    if (property === "border" || property === "border-color") {
      addCandidate(buckets.input_border, lastColor);
      addCandidate(buckets.accent, lastColor);
      return;
    }

    if (selector.includes("qwidget") || selector.includes("qmainwindow")) {
      addCandidate(buckets.app_bg, firstColor);
    }

    if (selector.includes("qmenubar") || selector.includes("qmenu")) {
      addCandidate(buckets.menu_bg, firstColor);
    }

    if (selector.includes("qdockwidget") || selector.includes("qgroupbox")) {
      addCandidate(buckets.panel_bg, firstColor);
      addCandidate(buckets.left_section_bg, firstColor);
      addCandidate(buckets.right_card_bg, firstColor);
    }

    if (
      selector.includes("qlineedit") ||
      selector.includes("qcombobox") ||
      selector.includes("qspinbox") ||
      selector.includes("qtextedit") ||
      selector.includes("qplaintextedit")
    ) {
      addCandidate(buckets.input_bg, firstColor);
      addCandidate(buckets.panel_inner, firstColor);
    }

    if (selector.includes("qtabbar::tab:selected")) {
      addCandidate(buckets.tab_active, firstColor);
    }

    if (selector.includes("qtabbar::tab")) {
      addCandidate(buckets.tab_bg, firstColor);
    }

    if (selector.includes("qpushbutton") || selector.includes("qtoolbutton")) {
      addCandidate(buckets.button_bg, firstColor);
      addCandidate(buckets.accent, firstColor);
    }

    if (selector.includes(":hover")) {
      addCandidate(buckets.button_hover, firstColor);
    }
  });

  return {
    app_bg: pickColor(buckets.app_bg, ""),
    panel_bg: pickColor(buckets.panel_bg, ""),
    panel_inner: pickColor(buckets.panel_inner, ""),
    menu_bg: pickColor(buckets.menu_bg, ""),
    menu_text: pickColor(buckets.menu_text, ""),
    left_bg: pickColor(buckets.left_bg, pickColor(buckets.panel_bg, "")),
    left_section_bg: pickColor(buckets.left_section_bg, pickColor(buckets.panel_inner, "")),
    right_bg: pickColor(buckets.right_bg, pickColor(buckets.panel_bg, "")),
    right_card_bg: pickColor(buckets.right_card_bg, pickColor(buckets.panel_inner, "")),
    tab_bg: pickColor(buckets.tab_bg, ""),
    tab_active: pickColor(buckets.tab_active, pickColor(buckets.accent, "")),
    tab_text: pickColor(buckets.tab_text, pickColor(buckets.text_primary, "")),
    input_bg: pickColor(buckets.input_bg, ""),
    input_border: pickColor(buckets.input_border, ""),
    button_bg: pickColor(buckets.button_bg, pickColor(buckets.accent, "")),
    button_hover: pickColor(buckets.button_hover, ""),
    text_primary: pickColor(buckets.text_primary, ""),
    text_secondary: pickColor(buckets.text_secondary, ""),
    success: pickColor(buckets.success, "#00cc88"),
    error: pickColor(buckets.error, "#ff5c72"),
    accent: pickColor(buckets.accent, ""),
  };
}

function generateTemplate(qss, system) {
  let output = qss;

  Object.entries(system).forEach(([key, value]) => {
    if (!value) {
      return;
    }

    const normalized = normalizeColor(value);
    if (!normalized) {
      return;
    }

    output = output.replace(new RegExp(normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), `{{${key}}}`);
  });

  return output;
}

function generateFinalQSS(nextTemplate, nextTheme) {
  let output = nextTemplate;

  Object.entries(nextTheme).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    output = output.replace(regex, value);
  });

  return output;
}

function showExportSuccess() {
  toast.style.opacity = "1";
  toast.style.transform = "translateY(0) scale(1)";
  toast.style.boxShadow = "0 0 0 1px rgba(76, 194, 255, 0.18), 0 16px 40px rgba(0, 0, 0, 0.42)";

  window.setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px) scale(0.98)";
  }, 2000);
}

function setActiveStep(step) {
  currentStep = step;
  toolCard?.classList.toggle("is-advanced", advancedModeToggle.checked);

  stepTabs.forEach((button) => {
    button.classList.toggle("active", button.dataset.step === step);
  });

  const showAll = advancedModeToggle.checked;
  stepSections.forEach((section) => {
    const shouldShow = showAll || section.dataset.stepGroup === step;
    section.classList.toggle("is-hidden", !shouldShow);
  });
}

function loadDefaultTheme() {
  Object.assign(theme, defaultTheme);
}

function deriveAccentSystem(source) {
  const accentColor = clampHex(source);
  if (!accentColor) {
    return;
  }

  theme.accent = accentColor;
  theme.button_bg = accentColor;
  theme.button_hover = shiftHexColor(accentColor, 18);
  theme.tab_active = saturateHex(shiftHexColor(accentColor, 6), 0.24);
  theme.input_border = shiftHexColor(accentColor, -42);
}

function showPalette(colors = [], accentColor = "") {
  if (!palettePreviewCard || !palettePreview || !colors.length) {
    return;
  }

  palettePreview.innerHTML = "";
  colors.forEach((color) => {
    const swatch = document.createElement("button");
    swatch.type = "button";
    swatch.className = `palette-swatch${color === accentColor ? " accent-swatch" : ""}`;
    swatch.style.background = color;
    swatch.title = color.toUpperCase();
    swatch.addEventListener("click", () => {
      updateThemeKey("accent", color);
    });
    palettePreview.appendChild(swatch);
  });

  palettePreviewCard.classList.remove("is-hidden");
  palettePreviewCard.classList.add("is-visible");
}

function distanceBetween(first, second) {
  const rgbFirst = hexToRgb(first);
  const rgbSecond = hexToRgb(second);
  if (!rgbFirst || !rgbSecond) {
    return Number.MAX_SAFE_INTEGER;
  }

  return Math.sqrt((rgbFirst.r - rgbSecond.r) ** 2 + (rgbFirst.g - rgbSecond.g) ** 2 + (rgbFirst.b - rgbSecond.b) ** 2);
}

function extractDominantColorsFromImage(image) {
  const canvasElement = document.createElement("canvas");
  const context = canvasElement.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return [];
  }

  const maxDimension = 160;
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  canvasElement.width = Math.max(1, Math.round(image.width * scale));
  canvasElement.height = Math.max(1, Math.round(image.height * scale));
  context.drawImage(image, 0, 0, canvasElement.width, canvasElement.height);

  const { data } = context.getImageData(0, 0, canvasElement.width, canvasElement.height);
  const buckets = new Map();

  for (let index = 0; index < data.length; index += 16) {
    const alpha = data[index + 3];
    if (alpha < 180) {
      continue;
    }

    const r = Math.round(data[index] / 24) * 24;
    const g = Math.round(data[index + 1] / 24) * 24;
    const b = Math.round(data[index + 2] / 24) * 24;
    const key = rgbToHex({ r, g, b });
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }

  const sorted = [...buckets.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([color]) => color);

  const deduped = [];
  sorted.forEach((color) => {
    if (deduped.every((existing) => distanceBetween(existing, color) > 34)) {
      deduped.push(color);
    }
  });

  return deduped.slice(0, 8);
}

function createThemeFromPalette(colors) {
  if (!colors.length) {
    return null;
  }

  const sortedByLuminance = [...colors].sort((left, right) => luminance(left) - luminance(right));
  const darkest = sortedByLuminance[0] || baseTheme.app_bg;
  const secondDarkest = sortedByLuminance[1] || shiftHexColor(darkest, 10);
  const midTone = sortedByLuminance[Math.min(2, sortedByLuminance.length - 1)] || shiftHexColor(secondDarkest, 10);
  const brightAccent = [...colors].sort((left, right) => luminance(right) - luminance(left))[0] || baseTheme.accent;
  const lightTone = [...colors].sort((left, right) => luminance(right) - luminance(left))[1] || "#ffffff";

  const generated = {
    app_bg: darkest,
    panel_bg: secondDarkest,
    panel_inner: mixColors(secondDarkest, midTone, 0.45),
    menu_bg: mixColors(darkest, secondDarkest, 0.55),
    menu_text: ensureContrast(lightTone, mixColors(darkest, secondDarkest, 0.55), 4),
    left_bg: mixColors(darkest, secondDarkest, 0.35),
    left_section_bg: mixColors(secondDarkest, midTone, 0.2),
    right_bg: mixColors(darkest, secondDarkest, 0.45),
    right_card_bg: mixColors(secondDarkest, midTone, 0.35),
    tab_bg: mixColors(darkest, secondDarkest, 0.5),
    tab_active: brightAccent,
    tab_text: ensureContrast(lightTone, mixColors(darkest, secondDarkest, 0.5), 4),
    input_bg: mixColors(secondDarkest, midTone, 0.3),
    input_border: shiftHexColor(secondDarkest, 24),
    button_bg: brightAccent,
    button_hover: shiftHexColor(brightAccent, 18),
    text_primary: ensureContrast(lightTone, darkest, 5),
    text_secondary: ensureContrast(mixColors(lightTone, darkest, 0.35), secondDarkest, 3.8),
    success: mixColors(brightAccent, "#00cc88", 0.45),
    error: mixColors(brightAccent, "#ff5c72", 0.55),
    accent: brightAccent,
  };

  generated.text_secondary = ensureContrast(generated.text_secondary, generated.panel_bg, 3.5);
  return generated;
}

function handleImportedImage(file) {
  const reader = new FileReader();
  reader.onload = (event) => {
    const image = new Image();
    image.onload = () => {
      const colors = extractDominantColorsFromImage(image);
      const nextTheme = createThemeFromPalette(colors);
      if (!nextTheme) {
        return;
      }

      Object.assign(theme, nextTheme);
      updateInputs();
      applyTheme();
      showPalette(colors.slice(0, 5), nextTheme.accent);
    };
    image.src = typeof event.target?.result === "string" ? event.target.result : "";
  };
  reader.readAsDataURL(file);
}

function updateThemeKey(key, value) {
  const normalized = clampHex(value);
  if (!normalized) {
    return;
  }

  theme[key] = normalized;

  if (key === "accent") {
    deriveAccentSystem(normalized);
  } else if (key === "button_bg") {
    theme.button_hover = shiftHexColor(normalized, 18);
  } else if (key === "tab_active") {
    theme.accent = normalized;
  }

  updateInputs();
  applyTheme();
}

function downloadQSS(qss) {
  const name = themeNameInput.value.trim() || "custom-theme";
  const blob = new Blob([qss], { type: "text/plain" });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = `${name}.qss`;
  link.click();
  URL.revokeObjectURL(link.href);
  showExportSuccess();
}

function updateInputs() {
  colorInputs.forEach((input) => {
    const key = input.dataset.key;
    const value = theme[key];
    if (!value) {
      return;
    }

    input.value = value;

    const control = input.closest(".card")?.querySelector(".color-control");
    const trigger = control?.querySelector(".color-trigger");
    const hexInput = control?.querySelector(".color-hex");
    if (trigger) {
      trigger.style.setProperty("--swatch", value);
    }
    if (hexInput && document.activeElement !== hexInput) {
      hexInput.value = value.toUpperCase();
    }
  });
}

function handleImportedQSS(qss) {
  try {
    const system = classifyColors(qss);
    const hasExtractedColor = Object.values(system).some(Boolean);

    if (!hasExtractedColor) {
      return;
    }

    Object.keys(theme).forEach((key) => {
      if (system[key]) {
        theme[key] = normalizeColor(system[key]);
      }
    });

    template = generateTemplate(qss, system);
    updateInputs();
    applyTheme();
    showPalette(Object.values(system).filter(Boolean).slice(0, 5), theme.accent);
  } catch (_error) {
    // Keep the current theme and UI running if import parsing fails.
  }
}

function applyPreset(presetName) {
  const preset = presets[presetName];
  if (!preset) {
    return;
  }

  Object.assign(theme, preset);
  updateInputs();
  applyTheme();
}

function applyTheme() {
  const glowColor = `${theme.accent}26`;
  const activeBg = `${theme.tab_active}26`;
  const activeBorder = `${theme.tab_active}66`;

  document.body.style.background = `radial-gradient(circle at top, ${shiftHexColor(theme.app_bg, 10)}, ${shiftHexColor(
    theme.app_bg,
    -10
  )} 60%)`;
  document.body.style.color = theme.text_primary;
  document.documentElement.style.setProperty("--accent", theme.accent);

  preview.style.background = "transparent";

  document.querySelectorAll(".helios-app").forEach((el) => {
    el.style.background = theme.app_bg;
    el.style.color = theme.text_primary;
  });

  document.querySelectorAll(".preview-card").forEach((el) => {
    el.style.background = `${theme.app_bg}66`;
    el.style.border = `1px solid ${theme.input_border}`;
    el.style.boxShadow = `0 20px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px ${theme.input_border}22`;
  });

  document.querySelectorAll(".menu-bar").forEach((el) => {
    el.style.background = theme.menu_bg;
    el.style.borderBottom = `1px solid ${theme.input_border}`;
    el.style.color = theme.menu_text;
  });

  document.querySelectorAll(".menu-items").forEach((el) => {
    el.style.color = theme.menu_text;
  });

  document.querySelectorAll(".left-panel").forEach((el) => {
    el.style.background = theme.left_bg;
    el.style.borderRight = `1px solid ${theme.input_border}`;
    el.style.color = theme.text_primary;
  });

  document.querySelectorAll(".right-panel").forEach((el) => {
    el.style.background = theme.right_bg;
    el.style.borderLeft = `1px solid ${theme.input_border}`;
    el.style.color = theme.text_primary;
  });

  document.querySelectorAll(".section-block").forEach((el) => {
    el.style.background = theme.left_section_bg;
    el.style.border = `1px solid ${theme.input_border}`;
    el.style.borderRadius = "4px";
    el.style.padding = "8px";
  });

  document.querySelectorAll(".card").forEach((el) => {
    if (!el.closest(".controls")) {
      el.style.background = theme.panel_bg;
      el.style.border = `1px solid ${theme.input_border}`;
      el.style.color = theme.text_primary;
    }
  });

  document.querySelectorAll(".preview-card-block").forEach((el) => {
    el.style.background = theme.right_card_bg;
  });

  document.querySelectorAll(".input").forEach((el) => {
    el.style.background = theme.input_bg;
    el.style.color = theme.text_primary;
    el.style.border = `1px solid ${theme.input_border}`;
    el.onmouseover = () => {
      el.style.borderColor = theme.tab_active;
    };
    el.onmouseout = () => {
      el.style.borderColor = theme.input_border;
    };
    el.onfocus = () => {
      el.style.boxShadow = `0 0 0 1px ${theme.input_border}, 0 0 18px ${glowColor}`;
    };
    el.onblur = () => {
      el.style.boxShadow = "none";
    };
  });

  document.querySelectorAll(".btn").forEach((el) => {
    if (el.id === "download") {
      return;
    }

    el.style.background = theme.button_bg;
    el.style.color = "#000000";
    el.style.border = `1px solid ${theme.input_border}`;
    el.style.boxShadow = `0 0 0 1px ${glowColor}`;

    el.onmouseover = () => {
      el.style.background = theme.button_hover;
    };

    el.onmouseout = () => {
      el.style.background = theme.button_bg;
    };
  });

  document.querySelectorAll(".tab").forEach((el) => {
    el.style.background = "transparent";
    el.style.color = theme.tab_text;
    el.style.border = "none";
    el.style.borderBottom = "2px solid transparent";
    el.style.cursor = "pointer";
    el.onmouseover = () => {
      if (!el.classList.contains("active")) {
        el.style.color = theme.text_primary;
      }
    };
    el.onmouseout = () => {
      if (!el.classList.contains("active")) {
        el.style.color = theme.tab_text;
      }
    };
  });

  document.querySelectorAll(".tab.active").forEach((el) => {
    el.style.background = "transparent";
    el.style.color = theme.text_primary;
    el.style.borderBottomColor = theme.tab_active;
    el.style.boxShadow = "none";
  });

  document.querySelectorAll(".section-block label, .preview-card-block label").forEach((el) => {
    el.style.color = theme.text_secondary;
  });

  document.querySelectorAll(".display-area").forEach((el) => {
    el.style.background = "transparent";
    el.style.border = "none";
  });

  document.querySelectorAll(".display-canvas").forEach((el) => {
    el.style.setProperty("background", "#000000", "important");
    el.style.border = `1px solid ${theme.input_border}`;
  });

  document.querySelectorAll(".workspace-mode, .output-header, .status-strip, .panel-title").forEach((el) => {
    el.style.background = theme.panel_bg;
    el.style.color = theme.text_primary;
  });

  document.querySelectorAll(".output-body").forEach((el) => {
    el.style.background = theme.panel_inner;
  });

  document.querySelectorAll(".meta-line, .usb-row span, .status-strip span:not(.status-online)").forEach((el) => {
    el.style.color = theme.text_secondary;
  });

  document.querySelectorAll(".subtab").forEach((el) => {
    el.style.color = theme.text_secondary;
    el.style.borderBottomColor = "transparent";
  });

  document.querySelectorAll(".active-subtab").forEach((el) => {
    el.style.color = theme.text_primary;
    el.style.borderBottomColor = theme.tab_active;
  });

  document.querySelectorAll(".slot").forEach((el, index) => {
    el.style.background = theme.panel_inner;
    el.style.border = `1px solid ${theme.input_border}`;
    el.style.color = theme.text_secondary;

    if (index === 0) {
      el.style.boxShadow = `inset 3px 0 0 ${theme.success}`;
    } else if (index === 1) {
      el.style.boxShadow = `inset 3px 0 0 ${theme.accent}`;
    } else {
      el.style.boxShadow = `inset 3px 0 0 ${theme.error}`;
    }
  });

  downloadButton.style.background = "linear-gradient(135deg, #4cc2ff, #7c5cff)";
  downloadButton.style.border = "none";
  downloadButton.style.color = "#ffffff";
  downloadButton.style.boxShadow = "0 0 20px rgba(76, 194, 255, 0.3)";
}

function wireCardSpotlights() {
  cards.forEach((card) => {
    card.addEventListener("mousemove", (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--x", `${event.clientX - rect.left}px`);
      card.style.setProperty("--y", `${event.clientY - rect.top}px`);
    });
  });
}

function buildColorControls() {
  colorInputs.forEach((input) => {
    if (input.dataset.enhanced === "true") {
      return;
    }

    input.dataset.enhanced = "true";
    const key = input.dataset.key;
    const wrapper = document.createElement("div");
    wrapper.className = "color-control";

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "color-trigger";
    trigger.setAttribute("aria-label", `Choose ${key}`);

    const meta = document.createElement("div");
    meta.className = "color-meta";

    const hexInput = document.createElement("input");
    hexInput.type = "text";
    hexInput.className = "color-hex";
    hexInput.maxLength = 7;
    hexInput.value = (theme[key] || input.value || "").toUpperCase();

    const note = document.createElement("div");
    note.className = "color-note";
    note.textContent = "Swatch + HEX";

    trigger.addEventListener("click", () => input.click());
    input.addEventListener("input", () => updateThemeKey(key, input.value));
    hexInput.addEventListener("change", () => {
      const normalized = clampHex(hexInput.value);
      if (!normalized) {
        hexInput.value = (theme[key] || input.value || "").toUpperCase();
        return;
      }

      input.value = normalized;
      updateThemeKey(key, normalized);
    });

    meta.append(hexInput, note);
    wrapper.append(trigger, meta);
    input.insertAdjacentElement("afterend", wrapper);
  });
}

function wireFocusStates() {
  if (!toolCard || !sidebar || !previewPane) {
    return;
  }

  sidebar.addEventListener("mouseenter", () => {
    toolCard.classList.add("is-hovering-sidebar");
    toolCard.classList.remove("is-hovering-preview");
  });

  sidebar.addEventListener("mouseleave", () => {
    toolCard.classList.remove("is-hovering-sidebar");
  });

  previewPane.addEventListener("mouseenter", () => {
    toolCard.classList.add("is-hovering-preview");
    toolCard.classList.remove("is-hovering-sidebar");
  });

  previewPane.addEventListener("mouseleave", () => {
    toolCard.classList.remove("is-hovering-preview");
  });
}

function scrollToControl(zone) {
  const control = document.querySelector(
    `.control-group[data-zone="${zone}"], .advanced-control[data-zone="${zone}"]`
  );
  const target = control?.closest(".card") || control;
  if (!target) {
    return;
  }

  target.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });

  highlightControl(target);
}

function clearHighlights() {
  document.querySelectorAll(".active-highlight").forEach((element) => {
    element.classList.remove("active-highlight");
  });
}

function highlightControl(target) {
  target.classList.add("active-highlight");
  window.setTimeout(() => {
    target.classList.remove("active-highlight");
  }, 1500);
}

function wirePreviewZoneEditing() {
  previewZones.forEach((element) => {
    element.addEventListener("click", (event) => {
      event.stopPropagation();
      const zone = element.getAttribute("data-zone");
      if (!zone) {
        return;
      }

      clearHighlights();
      scrollToControl(zone);
      element.classList.add("zone-active");
      window.setTimeout(() => {
        element.classList.remove("zone-active");
      }, 900);
    });
  });
}

document.querySelectorAll(".preset").forEach((button) => {
  button.onclick = () => {
    applyPreset(button.dataset.preset);
  };
});

stepTabs.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveStep(button.dataset.step);
  });
});

qssUpload.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  const name = file.name.toLowerCase();
  const isImage = file.type.startsWith("image/") || /\.(png|jpe?g)$/.test(name);
  if (isImage) {
    handleImportedImage(file);
    return;
  }

  const reader = new FileReader();

  reader.onload = (loadEvent) => {
    const qss = loadEvent.target.result;
    handleImportedQSS(typeof qss === "string" ? qss : "");
  };

  reader.readAsText(file);
});

resetButton.onclick = () => {
  loadDefaultTheme();
  updateInputs();
  applyTheme();
};

advancedModeToggle.addEventListener("change", () => {
  setActiveStep(currentStep);
});

window.addEventListener("resize", () => {
  resizeCanvas();
  createParticles();
});

window.addEventListener("mousemove", (event) => {
  mouse.x = event.clientX;
  mouse.y = event.clientY;
  glow.style.left = `${event.clientX}px`;
  glow.style.top = `${event.clientY}px`;
  spotlight.style.left = `${event.clientX}px`;
  spotlight.style.top = `${event.clientY}px`;
});

downloadButton.onclick = () => {
  const finalQSS = generateFinalQSS(template, theme);
  downloadQSS(finalQSS);
};

startCreatingButton?.addEventListener("click", () => {
  if (!generatorSection) {
    return;
  }

  const yOffset = -72;
  const y = generatorSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
  window.scrollTo({ top: y, behavior: "smooth" });
});

themeNameInput.value = "custom-theme";
loadDefaultTheme();
resizeCanvas();
createParticles();
drawParticles();
buildColorControls();
wireCardSpotlights();
wireFocusStates();
wirePreviewZoneEditing();
setActiveStep("base");
updateInputs();
applyTheme();
