const baseTheme = {
  app_bg: "#35383c",
  text_primary: "#f3f5f7",
  text_secondary: "#787d84",
  panel_bg: "#43474c",
  panel_title_bg: "#43474c",
  panel_border: "#66696d",
  menu_bg: "#43474c",
  menu_hover: "#5a5e64",
  button_bg: "#53565c",
  button_hover: "#686c74",
  button_active: "#00e5ff",
  input_bg: "#4a4e54",
  input_border: "#5c6066",
  input_focus: "#00e5ff",
  tab_bg: "#35383c",
  tab_hover: "#525660",
  tab_active: "#35383c",
  accent: "#00e5ff",
  accent_secondary: "#5a5e64",
  success: "#00cc88",
  error: "#ff5c72",
  statusbar_bg: "#4a4e54",
  statusbar_border: "#66696d",
};

const presets = {
  dark: { ...baseTheme },
  neon: {
    app_bg: "#050507",
    text_primary: "#ffffff",
    text_secondary: "#8affc1",
    panel_bg: "#0d0f14",
    panel_title_bg: "#101522",
    panel_border: "#1f2937",
    menu_bg: "#09131a",
    menu_hover: "#132337",
    button_bg: "#00ffa3",
    button_hover: "#00ffd0",
    button_active: "#00ffa3",
    input_bg: "#060b10",
    input_border: "#1f2937",
    input_focus: "#00ffd0",
    tab_bg: "#0b1018",
    tab_hover: "#132337",
    tab_active: "#0b1018",
    accent: "#00ffa3",
    accent_secondary: "#132337",
    success: "#00ffa3",
    error: "#ff4d8d",
    statusbar_bg: "#081118",
    statusbar_border: "#00ffa3",
  },
  light: {
    app_bg: "#f5f5f5",
    text_primary: "#111111",
    text_secondary: "#555555",
    panel_bg: "#ffffff",
    panel_title_bg: "#f0f4f8",
    panel_border: "#d7dee7",
    menu_bg: "#ffffff",
    menu_hover: "#e9f4ff",
    button_bg: "#4cc2ff",
    button_hover: "#3aaedc",
    button_active: "#4cc2ff",
    input_bg: "#ffffff",
    input_border: "#c9d6e2",
    input_focus: "#4cc2ff",
    tab_bg: "#eef3f8",
    tab_hover: "#dff0ff",
    tab_active: "#4cc2ff",
    accent: "#4cc2ff",
    accent_secondary: "#8abfe0",
    success: "#0ea56b",
    error: "#d9485f",
    statusbar_bg: "#eef3f8",
    statusbar_border: "#d7dee7",
  },
};

const inspoPalettes = {
  ocean: ["#0f172a", "#1e293b", "#1d4ed8", "#38bdf8", "#e2e8f0"],
  ember: ["#1c1917", "#292524", "#7c2d12", "#fb923c", "#f5f5f4"],
  violet: ["#111827", "#1f2937", "#6d28d9", "#a78bfa", "#f5f3ff"],
};

const SAFE_QSS_MAP = {
  app_bg: {
    selectors: ["QWidget", "QMainWindow", "QWidget:disabled"],
    properties: ["background-color"],
  },
  text_primary: {
    selectors: ["QWidget", "QLabel"],
    properties: ["color"],
  },
  text_secondary: {
    selectors: ["QWidget:disabled"],
    properties: ["color"],
  },
  panel_bg: {
    selectors: ["QDockWidget", "QGroupBox", "QStatusBar"],
    properties: ["background-color"],
  },
  panel_title_bg: {
    selectors: ["QDockWidget::title"],
    properties: ["background-color"],
  },
  panel_border: {
    selectors: ["QDockWidget", "QGroupBox"],
    properties: ["border-color"],
  },
  menu_bg: {
    selectors: ["QMenuBar", "QMenu", "QToolBar"],
    properties: ["background-color"],
  },
  menu_hover: {
    selectors: ["QMenu::item:selected"],
    properties: ["background-color"],
  },
  button_bg: {
    selectors: ["QPushButton"],
    properties: ["background-color", "color", "border-color"],
  },
  button_hover: {
    selectors: ["QPushButton:hover"],
    properties: ["background-color"],
  },
  button_active: {
    selectors: ["QPushButton:pressed", "QPushButton:checked"],
    properties: ["background-color"],
  },
  input_bg: {
    selectors: ["QLineEdit", "QComboBox", "QSpinBox", "QTextEdit", "QPlainTextEdit"],
    properties: ["background-color", "color"],
  },
  input_border: {
    selectors: ["QLineEdit", "QComboBox", "QSpinBox"],
    properties: ["border-color"],
  },
  input_focus: {
    selectors: ["QLineEdit:focus", "QComboBox:focus"],
    properties: ["border-color"],
  },
  tab_bg: {
    selectors: ["QTabBar::tab"],
    properties: ["background-color", "color"],
  },
  tab_hover: {
    selectors: ["QTabBar::tab:hover"],
    properties: ["background-color"],
  },
  tab_active: {
    selectors: ["QTabBar::tab:selected"],
    properties: ["background-color", "color"],
  },
  accent: {
    selectors: ["QPushButton:hover", "QTabBar::tab:selected"],
    properties: ["background-color"],
  },
  accent_secondary: {
    selectors: ["QToolButton:hover"],
    properties: ["background-color"],
  },
  success: {
    selectors: ['QLabel[status="active"]'],
    properties: ["color"],
  },
  error: {
    selectors: ['QLabel[status="error"]'],
    properties: ["color"],
  },
  statusbar_bg: {
    selectors: ["QStatusBar"],
    properties: ["background-color"],
  },
  statusbar_border: {
    selectors: ["QStatusBar"],
    properties: ["border-color"],
  },
};

const BLOCKED_PROPERTIES = [
  "padding",
  "margin",
  "spacing",
  "border-radius",
  "font",
  "font-size",
  "font-weight",
  "width",
  "height",
  "min-width",
  "max-width",
  "min-height",
  "max-height",
];
const ALLOWED_PROPERTIES = ["color", "background-color", "border-color"];
const UNSAFE_QSS_PROPERTY_RE =
  /(padding|margin|spacing|border-radius|font-size|font-weight|font|min-width|max-width|min-height|max-height|width|height)\s*:[^;]*;/gi;
const LOCKED_QSS_RULES = `
VideoDisplay {
    background: #000000 !important;
}

QWidget#videoDisplay {
    background: #000000 !important;
}
`;
const WHITELISTED_SELECTOR_TERMS = [...new Set(Object.values(SAFE_QSS_MAP).flatMap((config) => config.selectors.map((selector) => selector.toLowerCase())))];
const THEME_TO_SAFE_ZONE = Object.keys(SAFE_QSS_MAP).reduce((accumulator, key) => {
  accumulator[key] = key;
  return accumulator;
}, {});
const SAFE_TOKENS = [
  "app_bg",
  "text_primary",
  "text_secondary",
  "panel_bg",
  "panel_title_bg",
  "panel_border",
  "menu_bg",
  "menu_hover",
  "button_bg",
  "button_hover",
  "button_active",
  "input_bg",
  "input_border",
  "input_focus",
  "tab_bg",
  "tab_hover",
  "tab_active",
  "accent",
  "accent_secondary",
  "success",
  "error",
  "statusbar_bg",
  "statusbar_border",
];
const PREVIEW_ZONE_ALIASES = {
  "panel-inner": "panel-title-bg",
  "menu-text": "text-primary",
  "left-bg": "panel-bg",
  "left-section-bg": "panel-border",
  "right-bg": "panel-bg",
  "right-card-bg": "statusbar-bg",
  "tab-text": "text-primary",
};
const SURFACE_KEYS = new Set([
  "app_bg",
  "panel_bg",
  "panel_title_bg",
  "menu_bg",
  "input_bg",
  "tab_bg",
  "tab_active",
  "statusbar_bg",
]);
let lastPatchedSelectors = [];

const defaultTemplate = String.raw`QWidget {
    background-color: #35383c;
    color: #f3f5f7;
    font-family: "Segoe UI", "Roboto", "Helvetica Neue", sans-serif;
    font-size: 9pt;
}

QWidget:disabled {
    color: #787d84;
}

QWidget:focus {
    outline: none;
}

QMainWindow {
    background-color: #35383c;
}

QMainWindow::separator {
    background: #66696d;
    width: 3px;
    height: 3px;
}

QMainWindow::separator:hover {
    background: #00E5FF;
}

QSplitter::handle {
    background-color: #35383c;
}

QSplitter::handle:hover {
    background-color: #00E5FF;
}

QDockWidget {
    background-color: #43474c;
    border: 1px solid #66696d;
    titlebar-close-icon: url(:/icons/close.svg);
    titlebar-normal-icon: url(:/icons/float.svg);
}

QDockWidget::title {
    background-color: #43474c;
    color: #f4f6f7;
    padding: 5px 8px;
    font-weight: 600;
    border-bottom: 1px solid #2e3136;
}

QDockWidget::close-button, QDockWidget::float-button {
    background-color: transparent;
    border-radius: 4px;
    padding: 2px;
}

QDockWidget::close-button:hover, QDockWidget::float-button:hover {
    background-color: #5a5e64;
}

QMenuBar {
    background-color: #43474c;
    padding: 2px;
    border-bottom: 1px solid #66696d;
}

QMenuBar::item {
    padding: 4px 8px;
    background: transparent;
    border-radius: 4px;
}

QMenuBar::item:selected {
    background-color: #585c62;
    color: #ffffff;
}

QMenu {
    background-color: #43474c;
    border: 1px solid #66696d;
    border-radius: 6px;
    padding: 4px;
}

QMenu::item {
    padding: 6px 24px;
    border-radius: 4px;
}

QMenu::item:selected {
    background-color: #5a5e64;
    color: #ffffff;
}

QMenu::item:pressed {
    background-color: #00E5FF;
    color: #101418;
}

QMenu::separator {
    height: 1px;
    background-color: #66696d;
    margin: 3px 8px;
}

QToolBar {
    background-color: #43474c;
    border: none;
    border-bottom: 1px solid #66696d;
    padding: 3px;
    spacing: 3px;
}

QToolButton {
    background-color: transparent;
    border-radius: 4px;
    padding: 6px 6px;
}

QToolButton:hover {
    background-color: #5a5e64;
}

QToolButton:pressed {
    background-color: #00E5FF;
    color: #101418;
}

QToolButton:checked {
    background-color: #00E5FF;
    border: 1px solid #00E5FF;
    color: #101418;
}

QPushButton {
    background-color: #53565c;
    color: #f4f6f7;
    border: 1px solid #62656a;
    border-radius: 4px;
    padding: 4px 12px;
    min-height: 20px;
}

QPushButton:hover {
    background-color: #686c74;
    border-color: #787c82;
}

QPushButton:pressed {
    background-color: #00E5FF;
    color: #101418;
}

QPushButton:checked {
    background-color: #00E5FF;
    color: #101418;
    border-color: #00E5FF;
}

QPushButton:checked:hover {
    background-color: #5ce0ee;
    border-color: #5ce0ee;
}

QPushButton:default, QPushButton[class="primary"] {
    background-color: #00E5FF;
    color: #101418;
}

QPushButton:default:hover {
    background-color: #5ce0ee;
}

QLineEdit, QSpinBox, QDoubleSpinBox, QComboBox, QTextEdit, QPlainTextEdit {
    background-color: #4a4e54;
    border: 1px solid #5c6066;
    border-radius: 4px;
    padding: 3px 6px;
    selection-background-color: #00E5FF;
    color: #f3f5f7;
    min-height: 18px;
}

QTextEdit[objectName="outputLog"] {
    background-color: #4a4e54;
    color: #f3f5f7;
}

QLineEdit:focus, QSpinBox:focus, QDoubleSpinBox:focus, QComboBox:focus, QTextEdit:focus, QPlainTextEdit:focus {
    border: 1px solid #00E5FF;
    background-color: #52565c;
}

QSpinBox::up-button, QDoubleSpinBox::up-button,
QSpinBox::down-button, QDoubleSpinBox::down-button {
    background-color: transparent;
    border: none;
    width: 16px;
}

QSpinBox::up-button:hover, QDoubleSpinBox::up-button:hover,
QSpinBox::down-button:hover, QDoubleSpinBox::down-button:hover {
    background-color: #5a5e64;
}

QSpinBox::up-arrow, QDoubleSpinBox::up-arrow {
    image: url(:/icons/spinbox-up-arrow.svg);
    width: 10px;
    height: 10px;
}

QSpinBox::down-arrow, QDoubleSpinBox::down-arrow {
    image: url(:/icons/spinbox-down-arrow.svg);
    width: 10px;
    height: 10px;
}

QComboBox {
    min-width: 60px;
    padding: 4px 7px;
}

QComboBox:hover {
    background-color: #585c62;
    border-color: #6e7278;
}

QComboBox::drop-down {
    border: none;
    width: 20px;
    background-color: transparent;
}

QComboBox::down-arrow {
    image: url(:/icons/arrow-down.svg);
    width: 10px;
    height: 10px;
}

QComboBox QAbstractItemView {
    background-color: #43474c;
    border: 1px solid #66696d;
    border-radius: 4px;
    selection-background-color: #00E5FF;
    outline: none;
    padding: 4px;
}

QComboBox QAbstractItemView::item {
    padding: 4px 8px;
    border-radius: 3px;
}

QComboBox QAbstractItemView::item:hover {
    background-color: #5a5e64;
    color: #ffffff;
}

QListView, QTreeView, QTableView {
    background-color: #4a4e54;
    border: 1px solid #4a4e54;
    border-radius: 4px;
    outline: none;
    alternate-background-color: #3a3e44;
}

QListView::item, QTreeView::item {
    padding: 4px 5px;
    border: none;
    border-radius: 3px;
}

QListView::item:hover, QTreeView::item:hover {
    background-color: #5a5e66;
}

QListView::item:selected, QTreeView::item:selected {
    background-color: #5c6268;
    color: #ffffff;
    border-left: 2px solid #00E5FF;
}

QTreeView::branch:has-children:!has-siblings:closed,
QTreeView::branch:closed:has-children:has-siblings {
    image: url(:/icons/tree-expand.svg);
}

QTreeView::branch:open:has-children:!has-siblings,
QTreeView::branch:open:has-children:has-siblings {
    image: url(:/icons/tree-collapse.svg);
}

QHeaderView::section {
    background-color: #43474c;
    color: #d4d8db;
    border: none;
    border-right: 1px solid #2e3136;
    border-bottom: 1px solid #2e3136;
    padding: 4px;
    font-weight: 600;
    font-size: 8pt;
    text-transform: uppercase;
}

QScrollBar:vertical {
    background: #35383c;
    width: 10px;
    margin: 0px;
}

QScrollBar::handle:vertical {
    background: #5a5f66;
    min-height: 20px;
    border-radius: 5px;
    margin: 2px;
}

QScrollBar::handle:vertical:hover {
    background: #7a808a;
}

QScrollBar::horizontal {
    background: #35383c;
    height: 10px;
    margin: 0px;
}

QScrollBar::handle:horizontal {
    background: #5a5f66;
    min-width: 20px;
    border-radius: 5px;
    margin: 2px;
}

QScrollBar::handle:horizontal:hover {
    background: #7a808a;
}

QScrollBar::add-line, QScrollBar::sub-line {
    width: 0px;
    height: 0px;
}

QTabWidget::pane {
    border: 1px solid #66696d;
    border-top: none;
    border-radius: 0px 0px 4px 4px;
    background-color: #35383c;
}

QTabWidget::tab-bar {
    alignment: left;
}

QTabBar::tab {
    background-color: transparent;
    color: #f4f6f7;
    border: none;
    padding: 7px 13px;
    margin-right: 2px;
    border-bottom: 2px solid transparent;
}

QTabBar::tab:hover {
    color: #ffffff;
    background-color: #525660;
}

QTabBar::tab:selected {
    color: #00E5FF;
    border-bottom: 2px solid #00E5FF;
    background-color: #35383c;
}

QGroupBox {
    border: 1px solid #66696d;
    border-radius: 5px;
    margin-top: 22px;
    padding: 4px;
    font-weight: bold;
}

QGroupBox::title {
    subcontrol-origin: margin;
    subcontrol-position: top left;
    padding: 0 5px;
    margin-bottom: -20px;
    background-color: #35383c;
    color: #f4f6f7;
}

QCheckBox { spacing: 6px; }
QCheckBox::indicator {
    width: 14px; height: 14px;
    background-color: #4a4e54;
    border: 1px solid #66696d;
    border-radius: 3px;
}
QCheckBox::indicator:checked {
    background-color: #00E5FF;
    border-color: #00E5FF;
    image: url(:/icons/check.svg);
}

QRadioButton { spacing: 6px; }
QRadioButton::indicator {
    width: 14px; height: 14px;
    background-color: #4a4e54;
    border: 1px solid #66696d;
    border-radius: 7px;
}
QRadioButton::indicator:checked {
    background-color: #00E5FF;
    border-color: #00E5FF;
    image: url(:/icons/radio-dot.svg);
}

QLabel[status="active"] { color: #00E5FF; font-weight: bold; }
QLabel[status="error"] { color: #ff7a73; font-weight: bold; }
QLabel[status="info"] { color: #b5bac0; font-size: 9px; }

QStatusBar {
    background-color: #4a4e54;
    color: #101418;
}`;

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
const quickResetButton = document.getElementById("resetThemeQuick");
const advancedModeToggle = document.getElementById("advancedMode");
const exitAdvancedButton = document.getElementById("exitAdvanced");
const toast = document.getElementById("toast");
const startCreatingButton = document.getElementById("startCreating");
const generatorSection = document.getElementById("generator");
const marketplaceSection = document.getElementById("marketplace");
const marketplaceNavButton = document.getElementById("marketplaceNav");
const marketplaceGrid = document.getElementById("marketplaceGrid");
const marketplaceSearchInput = document.getElementById("marketplaceSearch");
const marketplaceFilterInput = document.getElementById("marketplaceFilter");
const openMarketplaceUploadButton = document.getElementById("openMarketplaceUpload");
const marketplaceModal = document.getElementById("marketplaceModal");
const closeMarketplaceUploadButton = document.getElementById("closeMarketplaceUpload");
const cancelMarketplaceUploadButton = document.getElementById("cancelMarketplaceUpload");
const submitMarketplaceUploadButton = document.getElementById("submitMarketplaceUpload");
const marketplaceThemeNameInput = document.getElementById("marketplaceThemeName");
const marketplaceThemeFileInput = document.getElementById("marketplaceThemeFile");
const marketplaceUploadPalette = document.getElementById("marketplaceUploadPalette");
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
let marketplaceThemes = [];
let pendingMarketplaceUpload = null;
const MARKETPLACE_STORAGE_KEY = "helios-marketplace-themes-v1";

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

function rgbToHsl({ r, g, b }) {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  const delta = max - min;

  if (delta === 0) {
    return { h: 0, s: 0, l: lightness };
  }

  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let hue = 0;

  switch (max) {
    case red:
      hue = (green - blue) / delta + (green < blue ? 6 : 0);
      break;
    case green:
      hue = (blue - red) / delta + 2;
      break;
    default:
      hue = (red - green) / delta + 4;
      break;
  }

  return { h: hue / 6, s: saturation, l: lightness };
}

function hueToRgb(left, right, hue) {
  let nextHue = hue;
  if (nextHue < 0) {
    nextHue += 1;
  }
  if (nextHue > 1) {
    nextHue -= 1;
  }
  if (nextHue < 1 / 6) {
    return left + (right - left) * 6 * nextHue;
  }
  if (nextHue < 1 / 2) {
    return right;
  }
  if (nextHue < 2 / 3) {
    return left + (right - left) * (2 / 3 - nextHue) * 6;
  }
  return left;
}

function hslToRgb({ h, s, l }) {
  if (s === 0) {
    const channel = l * 255;
    return { r: channel, g: channel, b: channel };
  }

  const right = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const left = 2 * l - right;

  return {
    r: hueToRgb(left, right, h + 1 / 3) * 255,
    g: hueToRgb(left, right, h) * 255,
    b: hueToRgb(left, right, h - 1 / 3) * 255,
  };
}

function hexToHsl(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return { h: 0, s: 0, l: 0 };
  }

  return rgbToHsl(rgb);
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

function isValidColor(color) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color);
}

function isDark(color) {
  return luminance(color) < 0.45;
}

function getReadableText(background) {
  return isDark(background) ? "#ffffff" : "#000000";
}

function clampLightness(color, min, max) {
  const normalized = clampHex(color);
  if (!normalized) {
    return color;
  }

  const hsl = hexToHsl(normalized);
  return rgbToHex(
    hslToRgb({
      h: hsl.h,
      s: hsl.s,
      l: Math.max(min, Math.min(max, hsl.l)),
    })
  );
}

function normalizeSemanticColor(color) {
  return clampLightness(color, 0.15, 0.65);
}

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function adjustLightness(color, amount) {
  const normalized = clampHex(color);
  if (!normalized) {
    return color;
  }

  const hsl = hexToHsl(normalized);
  return rgbToHex(
    hslToRgb({
      h: hsl.h,
      s: hsl.s,
      l: clampNumber(hsl.l + amount, 0.06, 0.9),
    })
  );
}

function safeDarken(color, amount) {
  return adjustLightness(color, -clampNumber(amount, 0.2, 0.5));
}

function safeLighten(color, amount) {
  return adjustLightness(color, clampNumber(amount, 0.08, 0.22));
}

function setSurfaceLightness(color, targetLightness) {
  const normalized = clampHex(color) || baseTheme.app_bg;
  const hsl = hexToHsl(normalized);

  return rgbToHex(
    hslToRgb({
      h: hsl.h,
      s: clampNumber(hsl.s, 0.08, 0.5),
      l: clampNumber(targetLightness, 0.12, 0.28),
    })
  );
}

function resolveTokenColor(color, fallback) {
  return clampHex(color) || clampHex(fallback) || "#000000";
}

function nudgeLightness(color, amount) {
  const normalized = clampHex(color);
  if (!normalized) {
    return color;
  }

  const hsl = hexToHsl(normalized);
  return rgbToHex(
    hslToRgb({
      h: hsl.h,
      s: hsl.s,
      l: clampNumber(hsl.l + amount, 0.08, 0.9),
    })
  );
}

function toBaseTone(color) {
  const normalized = resolveTokenColor(color, baseTheme.app_bg);
  const l = hexToHsl(normalized).l;
  if (l > 0.34) {
    return nudgeLightness(normalized, -0.1);
  }
  if (l < 0.14) {
    return nudgeLightness(normalized, 0.05);
  }
  return normalized;
}

function toSurfaceTone(color) {
  const normalized = resolveTokenColor(color, baseTheme.panel_bg);
  const l = hexToHsl(normalized).l;
  if (l > 0.42) {
    return nudgeLightness(normalized, -0.08);
  }
  if (l < 0.16) {
    return nudgeLightness(normalized, 0.06);
  }
  return normalized;
}

function toStructureTone(color) {
  const normalized = resolveTokenColor(color, baseTheme.accent_secondary);
  const l = hexToHsl(normalized).l;
  if (l > 0.72) {
    return nudgeLightness(normalized, -0.08);
  }
  if (l < 0.22) {
    return nudgeLightness(normalized, 0.08);
  }
  return normalized;
}

function toAccentTone(color) {
  const normalized = resolveTokenColor(color, baseTheme.accent);
  const l = hexToHsl(normalized).l;
  if (l > 0.78) {
    return nudgeLightness(normalized, -0.08);
  }
  if (l < 0.28) {
    return nudgeLightness(normalized, 0.08);
  }
  return normalized;
}

function analyzeColor(color) {
  const normalized = clampHex(color);
  const hsl = hexToHsl(normalized);

  return {
    color: normalized,
    h: hsl.h,
    s: hsl.s,
    l: hsl.l,
    isDark: hsl.l < 0.25,
    isLight: hsl.l > 0.75,
    isAccent: hsl.s > 0.6 && hsl.l > 0.4 && hsl.l < 0.7,
  };
}

function classifyPalette(colors) {
  const analyzed = colors
    .filter((color) => isValidColor(color))
    .map((color) => analyzeColor(normalizeSemanticColor(color)));

  const darks = analyzed
    .filter((entry) => entry.isDark)
    .sort((left, right) => left.l - right.l)
    .map((entry) => entry.color);
  const lights = analyzed
    .filter((entry) => entry.isLight)
    .sort((left, right) => right.l - left.l)
    .map((entry) => entry.color);
  const accents = analyzed
    .filter((entry) => entry.isAccent)
    .sort((left, right) => right.s - left.s || left.l - right.l)
    .map((entry) => entry.color);

  return { darks, lights, accents };
}

function isPaletteMostlyDark(colors) {
  const valid = colors.filter((color) => isValidColor(color));
  if (!valid.length) {
    return true;
  }

  const averageLuminance = valid.reduce((sum, color) => sum + luminance(color), 0) / valid.length;
  return averageLuminance < 0.48;
}

function balancePalette(colors) {
  const analyzed = colors
    .filter((color) => isValidColor(color))
    .map((color) => analyzeColor(color));

  if (!analyzed.length) {
    return {
      primary: baseTheme.accent,
      secondary: shiftHexColor(baseTheme.accent, -18),
      tertiary: baseTheme.panel_bg,
      base: baseTheme.text_primary,
    };
  }

  const bySaturation = [...analyzed].sort((left, right) => right.s - left.s || right.l - left.l);
  const byDarkness = [...analyzed].sort((left, right) => left.l - right.l);
  const byLightness = [...analyzed].sort((left, right) => right.l - left.l);

  const primary = bySaturation[0]?.color || analyzed[0].color;
  const secondary =
    bySaturation.find((entry) => entry.color !== primary)?.color ||
    byLightness.find((entry) => entry.color !== primary)?.color ||
    primary;
  const tertiary =
    byDarkness.find((entry) => entry.color !== primary && entry.color !== secondary)?.color ||
    byDarkness[0]?.color ||
    analyzed[0].color;
  const base =
    byLightness.find((entry) => entry.color !== tertiary)?.color ||
    byLightness[0]?.color ||
    analyzed[0].color;

  return { primary, secondary, tertiary, base };
}

function normalizeSurface(color) {
  return resolveTokenColor(color, baseTheme.panel_bg);
}

function deriveSurfaceSystem(tokens) {
  const appBg = resolveTokenColor(tokens.app_bg, baseTheme.app_bg);
  const panelBg = resolveTokenColor(tokens.panel_bg, baseTheme.panel_bg);
  const sectionBg = resolveTokenColor(tokens.panel_title_bg || tokens.input_bg, panelBg);
  const elevatedBg = resolveTokenColor(tokens.statusbar_bg || tokens.menu_bg, panelBg);

  return {
    app_bg: appBg,
    panel_bg: panelBg,
    section_bg: sectionBg,
    elevated_bg: elevatedBg,
  };
}

function normalizeThemeTokens(nextTheme) {
  const appBg = resolveTokenColor(nextTheme.app_bg, baseTheme.app_bg);
  const panelBg = resolveTokenColor(nextTheme.panel_bg, baseTheme.panel_bg);
  const sectionBg = resolveTokenColor(nextTheme.panel_title_bg || panelBg, panelBg);
  const structure = resolveTokenColor(
    nextTheme.accent_secondary || nextTheme.panel_border || nextTheme.input_border,
    baseTheme.accent_secondary
  );
  const accent = resolveTokenColor(nextTheme.accent, baseTheme.accent);
  const textPrimary = ensureContrast(nextTheme.text_primary || getReadableText(appBg), appBg, 7);
  const textSecondary = ensureContrast(nextTheme.text_secondary || getReadableText(panelBg), panelBg, 4);

    return {
      ...nextTheme,
      app_bg: appBg,
      panel_bg: panelBg,
      panel_title_bg: sectionBg,
      menu_bg: resolveTokenColor(nextTheme.menu_bg, appBg),
      menu_hover: structure,
      button_bg: resolveTokenColor(nextTheme.button_bg, accent),
      button_hover: resolveTokenColor(nextTheme.button_hover, accent),
      button_active: resolveTokenColor(nextTheme.button_active, accent),
      input_bg: resolveTokenColor(nextTheme.input_bg, structure),
      panel_border: structure,
      input_border: structure,
      tab_bg: resolveTokenColor(nextTheme.tab_bg, structure),
      tab_hover: resolveTokenColor(nextTheme.tab_hover, accent),
      tab_active: resolveTokenColor(nextTheme.tab_active, accent),
    statusbar_bg: resolveTokenColor(nextTheme.statusbar_bg, panelBg),
    statusbar_border: structure,
    accent,
    accent_secondary: structure,
    input_focus: resolveTokenColor(nextTheme.input_focus, accent),
    text_primary: textPrimary,
    text_secondary: textSecondary,
  };
}

function stripComments(qss) {
  return qss.replace(/\/\*[\s\S]*?\*\//g, "");
}

function matchesEditableSelector(selector) {
  return WHITELISTED_SELECTOR_TERMS.includes(selector.trim().toLowerCase());
}

function validateQSS(qss) {
  if (/QMainWindow\s*\{[^}]*padding/i.test(qss)) {
    return false;
  }
  if (/QWidget\s*\{[^}]*margin/i.test(qss)) {
    return false;
  }
  return !new RegExp(`(${BLOCKED_PROPERTIES.map((property) => property.replace("-", "\\-")).join("|")})\\s*:`, "i").test(qss);
}

function sanitizeQSS(qss) {
  return stripComments(qss)
    .replace(UNSAFE_QSS_PROPERTY_RE, "")
    .replace(/([^{}]+)\{([^}]*)\}/g, (match, selectorBlock, body) => {
      const selectors = selectorBlock
        .split(",")
        .map((selector) => selector.trim())
        .filter((selector) => matchesEditableSelector(selector.toLowerCase()));

      if (!selectors.length) {
        return "";
      }

      const safeProps = body
        .split(";")
        .map((prop) => prop.trim())
        .filter(Boolean)
        .map((prop) => {
          const [rawProperty, ...rest] = prop.split(":");
          if (!rawProperty || !rest.length) {
            return "";
          }
          const property = rawProperty.trim().toLowerCase();
          const value = rest.join(":").trim();

          if (!ALLOWED_PROPERTIES.includes(property) || !extractColors(value).length) {
            return "";
          }

          return `${property}: ${value}`;
        })
        .filter(Boolean)
        .join("; ");

      return safeProps.trim() ? `${selectors.join(", ")} { ${safeProps}; }` : "";
    })
    .trim();
}

function extractColors(value) {
  if (/gradient|url\(|image\s*:|icon\s*:|transparent\b/i.test(value)) {
    return [];
  }

  return (value.match(COLOR_VALUE_RE) || []).map(normalizeColor).filter(Boolean);
}

function extractPaletteFromQSS(qss) {
  const matches = qss.match(/#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g) || [];
  const unique = [];

  matches
    .map((color) => normalizeColor(color))
    .filter(Boolean)
    .forEach((color) => {
      if (!unique.includes(color)) {
        unique.push(color);
      }
    });

  return unique.slice(0, 8);
}

function collectDeclarations(qss) {
  const declarations = [];
  const blockRe = /([^{}]+)\{([^{}]*)\}/g;
  const propRe = /([A-Za-z-]+)\s*:\s*([^;]+);/g;
  const clean = sanitizeQSS(qss);
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

      if (!ALLOWED_PROPERTIES.includes(property) || !colors.length) {
        continue;
      }

      selectors.forEach((selector) => {
        if (!matchesEditableSelector(selector)) {
          return;
        }
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
    const selector = declaration.selector;
    const property = declaration.property;
    const color = declaration.colors[declaration.colors.length - 1];

    Object.entries(SAFE_QSS_MAP).forEach(([zone, config]) => {
      const selectorMatch = config.selectors.some((safeSelector) => safeSelector.toLowerCase() === selector);
      const propertyMatch = config.properties.includes(property);
      if (selectorMatch && propertyMatch) {
        addCandidate(buckets[zone], color);
      }
    });
  });

  return THEME_KEYS.reduce((accumulator, key) => {
    accumulator[key] = pickColor(buckets[key], baseTheme[key] || "");
    return accumulator;
  }, {});
}

function generateTemplate(qss, system) {
  let output = sanitizeQSS(qss) || defaultTemplate;

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

function getPropertyValueForZone(zone, property, nextTheme) {
  switch (zone) {
    case "button_bg":
      if (property === "background-color") {
        return nextTheme.button_bg;
      }
      if (property === "color") {
        return ensureContrast(nextTheme.text_primary, nextTheme.button_bg, 4.5);
      }
      if (property === "border-color") {
        return nextTheme.accent_secondary;
      }
      break;
    case "input_bg":
      if (property === "background-color") {
        return nextTheme.input_bg;
      }
      if (property === "color") {
        return ensureContrast(nextTheme.text_primary, nextTheme.input_bg, 4.5);
      }
      break;
    case "tab_bg":
      if (property === "background-color") {
        return nextTheme.tab_bg;
      }
      if (property === "color") {
        return ensureContrast(nextTheme.text_primary, nextTheme.tab_bg, 4.5);
      }
      break;
    case "tab_active":
      if (property === "background-color") {
        return nextTheme.tab_active;
      }
      if (property === "color") {
        return ensureContrast(nextTheme.accent || nextTheme.text_primary, nextTheme.tab_active, 3);
      }
      break;
    case "statusbar_bg":
      if (property === "background-color") {
        return nextTheme.statusbar_bg;
      }
      if (property === "border-color") {
        return nextTheme.accent_secondary;
      }
      break;
    default:
      return nextTheme[zone] || "";
  }

  return nextTheme[zone] || "";
}

function replaceColorInCompoundValue(value, replacement) {
  if (!value) {
    return value;
  }

  if (/#(?:[0-9a-f]{6}|[0-9a-f]{3})\b/i.test(value)) {
    return value.replace(/#(?:[0-9a-f]{6}|[0-9a-f]{3})\b/i, replacement);
  }

  if (/\brgba?\([^)]+\)/i.test(value)) {
    return value.replace(/\brgba?\([^)]+\)/i, replacement);
  }

  if (/\btransparent\b/i.test(value)) {
    return replacement;
  }

  return replacement;
}

function patchSelectorProperty(baseQSS, selector, property, value) {
  const blockPattern = /([^{}]+)\{([^}]*)\}/g;
  const escapedProperty = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  return baseQSS.replace(blockPattern, (match, selectorBlock, body) => {
    const selectors = selectorBlock
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    if (!selectors.includes(selector)) {
      return match;
    }

    const propertyPattern = new RegExp(`(${escapedProperty}\\s*:\\s*)([^;]+)(;?)`, "i");
    if (propertyPattern.test(body)) {
      return `${selectorBlock}{${body.replace(propertyPattern, `$1 ${value};`)}}`;
    }

    if (property === "background-color") {
      const backgroundPattern = /(background\s*:\s*)([^;]+)(;?)/i;
      if (backgroundPattern.test(body)) {
        return `${selectorBlock}{${body.replace(backgroundPattern, (_, prefix, current) => `${prefix} ${replaceColorInCompoundValue(current, value)};`)}}`;
      }
    }

    if (property === "border-color") {
      const borderPattern = /(border\s*:\s*)([^;]+)(;?)/i;
      if (borderPattern.test(body)) {
        return `${selectorBlock}{${body.replace(borderPattern, (_, prefix, current) => `${prefix} ${replaceColorInCompoundValue(current, value)};`)}}`;
      }

      const borderSidePattern = /(border-(?:top|right|bottom|left)\s*:\s*)([^;]+)(;?)/gi;
      if (borderSidePattern.test(body)) {
        return `${selectorBlock}{${body.replace(borderSidePattern, (_, prefix, current) => `${prefix} ${replaceColorInCompoundValue(current, value)};`)}}`;
      }
    }

    return match;
  });
}

function parseQSSRules(qss) {
  const rules = [];

  stripComments(qss).replace(/([^{}]+)\{([^}]*)\}/g, (_match, selectorBlock, body) => {
    const properties = {};

    body
      .split(";")
      .map((declaration) => declaration.trim())
      .filter(Boolean)
      .forEach((declaration) => {
        const separatorIndex = declaration.indexOf(":");
        if (separatorIndex === -1) {
          return;
        }

        const name = declaration.slice(0, separatorIndex).trim().toLowerCase();
        const value = declaration.slice(separatorIndex + 1).trim();
        properties[name] = value;
      });

    selectorBlock
      .split(",")
      .map((selector) => selector.trim())
      .filter(Boolean)
      .forEach((selector) => {
        rules.push({ selector, properties: { ...properties } });
      });

    return "";
  });

  return rules;
}

function extractColorValue(value) {
  if (!value) {
    return "";
  }

  const hex = value.match(/#([0-9a-f]{3}|[0-9a-f]{6})/i);
  if (hex) {
    return clampHex(hex[0]);
  }

  const rgb = value.match(/\brgba?\([^)]+\)/i);
  if (rgb) {
    return normalizeColor(rgb[0]);
  }

  return "";
}

function getQSSColor(rules, selectors, properties, fallback = "") {
  const selectorList = Array.isArray(selectors) ? selectors : [selectors];
  const propertyList = Array.isArray(properties) ? properties : [properties];

  for (let selectorIndex = 0; selectorIndex < selectorList.length; selectorIndex += 1) {
    const selector = selectorList[selectorIndex];
    for (let index = rules.length - 1; index >= 0; index -= 1) {
      const rule = rules[index];
      if (rule.selector !== selector) {
        continue;
      }

      for (let propertyIndex = 0; propertyIndex < propertyList.length; propertyIndex += 1) {
        const property = propertyList[propertyIndex].toLowerCase();
        const value = extractColorValue(rule.properties[property]);
        if (value) {
          return value;
        }
      }
    }
  }

  return fallback;
}

function applyToPreview(finalQSS) {
  const rules = parseQSSRules(finalQSS);
  const appBg = getQSSColor(rules, ["QMainWindow", "QWidget"], ["background-color", "background"], theme.app_bg);
  const panelBg = getQSSColor(
    rules,
    ["QDockWidget", "QGroupBox", "QDialog", "QScrollArea", "QTabWidget::pane"],
    ["background-color", "background"],
    theme.panel_bg
  );
  const sectionBg = getQSSColor(
    rules,
    ["QFrame", "QListView", "QTreeView", "QTableView", "QStackedWidget", "QComboBox QAbstractItemView", "QAbstractItemView"],
    ["background-color", "background"],
    theme.input_bg
  );
  const elevatedBg = getQSSColor(rules, ["QMenu::item:selected", "QPushButton:hover", "QToolButton:hover"], ["background-color", "background"], theme.button_hover);
  const panelTitleBg = getQSSColor(rules, ["QDockWidget::title", "QGroupBox::title"], ["background-color", "background"], theme.panel_title_bg);
  const panelBorder = getQSSColor(rules, ["QDockWidget", "QGroupBox", "QTabWidget::pane"], ["border-color", "border"], theme.panel_border);
  const menuBg = getQSSColor(rules, ["QMenuBar", "QMenu", "QToolBar"], ["background-color", "background"], theme.menu_bg);
  const menuText = getQSSColor(rules, ["QWidget", "QLabel", "QMenuBar"], ["color"], theme.text_primary);
  const textSecondary = getQSSColor(rules, ["QWidget:disabled", "QLabel[status=\"info\"]"], ["color"], theme.text_secondary);
  const buttonBg = getQSSColor(rules, ["QPushButton"], ["background-color", "background"], theme.button_bg);
  const buttonText = getQSSColor(rules, ["QPushButton"], ["color"], ensureContrast(theme.text_primary, buttonBg, 4.5));
  const buttonHover = getQSSColor(rules, ["QPushButton:hover"], ["background-color", "background"], theme.button_hover);
  const inputBg = getQSSColor(
    rules,
    ["QLineEdit", "QComboBox", "QSpinBox", "QTextEdit", "QPlainTextEdit"],
    ["background-color", "background"],
    theme.input_bg
  );
  const inputText = getQSSColor(rules, ["QLineEdit", "QComboBox", "QTextEdit"], ["color"], theme.text_primary);
  const inputBorder = getQSSColor(rules, ["QLineEdit", "QComboBox", "QSpinBox"], ["border-color", "border"], theme.input_border);
  const inputFocus = getQSSColor(rules, ["QLineEdit:focus", "QComboBox:focus"], ["border-color", "border"], theme.input_focus);
  const tabBg = getQSSColor(rules, ["QTabBar::tab"], ["background-color", "background"], theme.tab_bg);
  const tabText = getQSSColor(rules, ["QTabBar::tab"], ["color"], theme.text_primary);
  const tabHover = getQSSColor(rules, ["QTabBar::tab:hover"], ["background-color", "background"], theme.tab_hover);
  const tabActiveBg = getQSSColor(rules, ["QTabBar::tab:selected"], ["background-color", "background"], theme.tab_active);
  const tabActiveText = getQSSColor(rules, ["QTabBar::tab:selected"], ["color"], theme.accent);
  const statusbarBg = getQSSColor(rules, ["QStatusBar"], ["background-color", "background"], theme.statusbar_bg);
  const statusbarBorder = getQSSColor(rules, ["QStatusBar"], ["border-color", "border"], theme.statusbar_border);
  const success = getQSSColor(rules, ['QLabel[status="active"]'], ["color"], theme.success);
  const error = getQSSColor(rules, ['QLabel[status="error"]'], ["color"], theme.error);

  document.body.style.background = `radial-gradient(circle at top, ${shiftHexColor(appBg, 10)}, ${shiftHexColor(appBg, -10)} 60%)`;
  document.body.style.color = menuText;
  document.documentElement.style.setProperty("--accent", tabActiveText || theme.accent);

  preview.style.background = "transparent";

  document.querySelectorAll(".helios-app").forEach((el) => {
    el.style.background = appBg;
    el.style.color = menuText;
  });

  document.querySelectorAll(".preview-card").forEach((el) => {
    el.style.background = mixColors(appBg, "#000000", 0.12);
    el.style.border = `1px solid ${panelBorder}`;
    el.style.boxShadow = `0 20px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px ${panelBorder}22`;
  });

  document.querySelectorAll(".menu-bar").forEach((el) => {
    el.style.background = menuBg;
    el.style.borderBottom = `1px solid ${panelBorder}`;
    el.style.color = menuText;
  });

  document.querySelectorAll(".menu-items, .menu-items span").forEach((el) => {
    el.style.color = menuText;
  });

  document.querySelectorAll(".status-strip, .workspace-mode, .output-header").forEach((el) => {
    el.style.background = statusbarBg;
    el.style.borderBottom = `1px solid ${statusbarBorder}`;
    el.style.color = menuText;
  });

  document.querySelectorAll(".left-panel, .right-panel").forEach((el) => {
    el.style.background = panelBg;
    el.style.color = menuText;
  });

  document.querySelectorAll(".left-panel").forEach((el) => {
    el.style.borderRight = `1px solid ${panelBorder}`;
  });

  document.querySelectorAll(".right-panel").forEach((el) => {
    el.style.borderLeft = `1px solid ${panelBorder}`;
  });

  document.querySelectorAll(".center-panel, .center-stack, .output-panel, .preferences-dialog").forEach((el) => {
    el.style.background = panelBg;
    el.style.color = menuText;
  });

  document.querySelectorAll(".section-block, .preview-card-block, .usb-card, .output-body, .dialog-content").forEach((el) => {
    el.style.background = sectionBg;
    el.style.border = `1px solid ${inputBorder || panelBorder}`;
    el.style.color = menuText;
  });

  document.querySelectorAll(".panel-title").forEach((el) => {
    el.style.background = panelTitleBg;
    el.style.color = menuText;
  });

  document.querySelectorAll(".input").forEach((el) => {
    el.style.background = inputBg;
    el.style.color = inputText;
    el.style.border = `1px solid ${inputBorder}`;
    el.onmouseover = () => {
      el.style.borderColor = inputFocus;
    };
    el.onmouseout = () => {
      el.style.borderColor = inputBorder;
    };
    el.onfocus = () => {
      el.style.boxShadow = `0 0 0 1px ${inputFocus}`;
    };
    el.onblur = () => {
      el.style.boxShadow = "none";
    };
  });

  document.querySelectorAll(".btn").forEach((el) => {
    if (el.id === "download") {
      return;
    }

    el.style.background = buttonBg;
    el.style.color = buttonText;
    el.style.border = `1px solid ${panelBorder}`;
    el.style.boxShadow = "none";
    el.onmouseover = () => {
      el.style.background = buttonHover;
    };
    el.onmouseout = () => {
      el.style.background = buttonBg;
    };
  });

  document.querySelectorAll(".tab").forEach((el) => {
    el.style.background = tabBg;
    el.style.color = tabText;
    el.style.border = "none";
    el.style.borderBottom = "2px solid transparent";
    el.style.cursor = "pointer";
    el.onmouseover = () => {
      if (!el.classList.contains("active")) {
        el.style.background = tabHover;
      }
    };
    el.onmouseout = () => {
      if (!el.classList.contains("active")) {
        el.style.background = tabBg;
      }
    };
  });

  document.querySelectorAll(".tab.active").forEach((el) => {
    el.style.background = tabActiveBg;
    el.style.color = tabActiveText;
    el.style.borderBottomColor = tabActiveText;
  });

  document.querySelectorAll(".section-block label, .preview-card-block label, .dialog-row label, .meta-line, .usb-row span, .status-strip span:not(.status-online)").forEach((el) => {
    el.style.color = textSecondary;
  });

  document.querySelectorAll(".display-area").forEach((el) => {
    el.style.background = panelBg;
    el.style.border = `1px solid ${panelBorder}`;
  });

  document.querySelectorAll(".display-canvas").forEach((el) => {
    el.style.setProperty("background", "#000000", "important");
    el.style.border = `1px solid ${inputBorder}`;
  });

  document.querySelectorAll(".subtab").forEach((el) => {
    el.style.color = textSecondary;
    el.style.borderBottomColor = "transparent";
  });

  document.querySelectorAll(".active-subtab").forEach((el) => {
    el.style.color = tabActiveText;
    el.style.borderBottomColor = tabActiveText;
  });

  document.querySelectorAll(".slot").forEach((el, index) => {
    el.style.background = sectionBg;
    el.style.border = `1px solid ${inputBorder}`;
    el.style.color = textSecondary;

    if (index === 0) {
      el.style.boxShadow = `inset 3px 0 0 ${success}`;
    } else if (index === 1) {
      el.style.boxShadow = `inset 3px 0 0 ${tabActiveText}`;
    } else {
      el.style.boxShadow = `inset 3px 0 0 ${error}`;
    }
  });

  document.querySelectorAll(".success-badge").forEach((el) => {
    el.style.background = `${success}22`;
    el.style.color = success;
  });

  document.querySelectorAll(".error-badge").forEach((el) => {
    el.style.background = `${error}22`;
    el.style.color = error;
  });

  downloadButton.style.background = "linear-gradient(135deg, #4cc2ff, #7c5cff)";
  downloadButton.style.border = "none";
  downloadButton.style.color = "#ffffff";
  downloadButton.style.boxShadow = "0 0 20px rgba(76, 194, 255, 0.3)";
}

function removeLightBackgrounds(qss, tokens) {
  return qss
    .replace(/(background-color\s*:\s*)(#f{3,6}|#e{3,6}|white)\b/gi, `$1${tokens.panel_bg}`)
    .replace(/(background\s*:\s*)(#f{3,6}|#e{3,6}|white)\b/gi, `$1${tokens.panel_bg}`);
}

function applyThemeToBaseQSS(baseQSS, nextTheme) {
  let output = baseQSS || defaultTemplate;
  const normalizedTheme = normalizeThemeTokens(nextTheme);
  const surfaces = deriveSurfaceSystem(normalizedTheme);
  const patchedSelectors = new Set();
  const patchAndTrack = (selector, property, value) => {
    const nextOutput = patchSelectorProperty(output, selector, property, value);
    if (nextOutput !== output) {
      patchedSelectors.add(`${selector} -> ${property}`);
      output = nextOutput;
    }
  };

  Object.entries(THEME_TO_SAFE_ZONE).forEach(([themeKey, zone]) => {
    const config = SAFE_QSS_MAP[zone];
    if (!config || !normalizedTheme[themeKey]) {
      return;
    }

    config.selectors.forEach((selector) => {
      config.properties.forEach((property) => {
        const value = getPropertyValueForZone(zone, property, normalizedTheme);
        if (!value) {
          return;
        }
        patchAndTrack(selector, property, value);
      });
    });
  });

  patchAndTrack("QDockWidget", "background-color", normalizedTheme.app_bg);
  patchAndTrack("QFrame", "background-color", surfaces.section_bg);
  patchAndTrack("QMainWindow::separator", "background-color", normalizedTheme.accent_secondary);
  patchAndTrack("QMainWindow::separator:hover", "background-color", normalizedTheme.accent);
  patchAndTrack("QSplitter::handle", "background-color", normalizedTheme.panel_border);
  patchAndTrack("QSplitter::handle:hover", "background-color", normalizedTheme.accent_secondary);
  patchAndTrack("QGroupBox", "background-color", surfaces.panel_bg);
  patchAndTrack("QGroupBox", "border-color", normalizedTheme.accent_secondary);
    patchAndTrack("QGroupBox::title", "background-color", normalizedTheme.panel_title_bg);
    patchAndTrack("QTabWidget::pane", "background-color", surfaces.panel_bg);
    patchAndTrack("QTabWidget::pane", "border-color", normalizedTheme.accent_secondary);
    patchAndTrack("QScrollArea", "background-color", normalizedTheme.app_bg);
    patchAndTrack("QStackedWidget", "background-color", normalizedTheme.app_bg);
    patchAndTrack("QDialog", "background-color", normalizedTheme.app_bg);
  patchAndTrack("QMenu", "background-color", surfaces.panel_bg);
  patchAndTrack("QMenu", "border-color", normalizedTheme.accent_secondary);
  patchAndTrack("QMenuBar", "border-color", normalizedTheme.accent_secondary);
  patchAndTrack("QMenuBar::item:selected", "background-color", normalizedTheme.menu_hover);
  patchAndTrack("QMenu::item:selected", "background-color", normalizedTheme.menu_hover);
  patchAndTrack("QMenu::item:pressed", "background-color", normalizedTheme.accent);
  patchAndTrack("QMenu::separator", "background-color", normalizedTheme.accent_secondary);
  patchAndTrack("QToolBar", "border-color", normalizedTheme.accent_secondary);
  patchAndTrack("QToolBar", "background-color", normalizedTheme.menu_bg);
  patchAndTrack("QDockWidget::title", "border-color", normalizedTheme.accent_secondary);
  patchAndTrack("QDockWidget::close-button:hover", "background-color", normalizedTheme.menu_hover);
  patchAndTrack("QDockWidget::float-button:hover", "background-color", normalizedTheme.menu_hover);
  patchAndTrack("QToolButton:hover", "background-color", normalizedTheme.menu_hover);
  patchAndTrack("QToolButton:pressed", "background-color", normalizedTheme.accent);
  patchAndTrack("QToolButton:checked", "background-color", normalizedTheme.accent);
  patchAndTrack("QToolButton:checked", "border-color", normalizedTheme.accent_secondary);
    patchAndTrack("QPushButton:hover", "border-color", normalizedTheme.accent_secondary);
    patchAndTrack("QPushButton:pressed", "background-color", normalizedTheme.button_active);
    patchAndTrack("QPushButton:pressed", "border-color", normalizedTheme.accent_secondary);
    patchAndTrack("QPushButton:checked", "background-color", normalizedTheme.button_active);
    patchAndTrack("QPushButton:checked", "border-color", normalizedTheme.accent_secondary);
    patchAndTrack("QPushButton:checked:hover", "background-color", normalizedTheme.button_hover);
    patchAndTrack("QPushButton:checked:hover", "border-color", normalizedTheme.accent_secondary);
    patchAndTrack("QPushButton:default", "background-color", normalizedTheme.accent);
    patchAndTrack("QPushButton:default", "border-color", normalizedTheme.accent_secondary);
    patchAndTrack("QPushButton:default:hover", "background-color", normalizedTheme.button_hover);
    patchAndTrack("QPushButton:default:hover", "border-color", normalizedTheme.accent_secondary);
    patchAndTrack("QLineEdit:focus", "background-color", surfaces.section_bg);
    patchAndTrack("QSpinBox:focus", "background-color", surfaces.section_bg);
    patchAndTrack("QDoubleSpinBox:focus", "background-color", surfaces.section_bg);
    patchAndTrack("QComboBox:focus", "background-color", surfaces.section_bg);
    patchAndTrack("QTextEdit:focus", "background-color", surfaces.section_bg);
    patchAndTrack("QPlainTextEdit:focus", "background-color", surfaces.section_bg);
    patchAndTrack("QComboBox QAbstractItemView", "background-color", surfaces.section_bg);
    patchAndTrack("QComboBox QAbstractItemView", "border-color", normalizedTheme.accent_secondary);
    patchAndTrack("QComboBox:hover", "background-color", normalizedTheme.menu_hover);
    patchAndTrack("QComboBox:hover", "border-color", normalizedTheme.accent_secondary);
    patchAndTrack("QComboBox QAbstractItemView::item:hover", "background-color", normalizedTheme.menu_hover);
    patchAndTrack("QTabBar::tab", "border-color", normalizedTheme.accent_secondary);
    patchAndTrack("QTabBar::tab:selected", "border-color", normalizedTheme.accent);
    patchAndTrack("QAbstractItemView", "background-color", surfaces.section_bg);
    patchAndTrack("QAbstractItemView", "alternate-background-color", surfaces.panel_bg);
    patchAndTrack("QListView", "background-color", surfaces.section_bg);
    patchAndTrack("QListView", "border-color", normalizedTheme.accent_secondary);
    patchAndTrack("QListView", "alternate-background-color", surfaces.panel_bg);
    patchAndTrack("QListView::item:hover", "background-color", normalizedTheme.menu_hover);
    patchAndTrack("QListView::item:selected", "background-color", normalizedTheme.accent);
    patchAndTrack("QTreeView", "background-color", surfaces.section_bg);
    patchAndTrack("QTreeView", "border-color", normalizedTheme.accent_secondary);
    patchAndTrack("QTreeView", "alternate-background-color", surfaces.panel_bg);
    patchAndTrack("QTreeView::item:hover", "background-color", normalizedTheme.menu_hover);
    patchAndTrack("QTreeView::item:selected", "background-color", normalizedTheme.accent);
    patchAndTrack("QTableView", "background-color", surfaces.section_bg);
    patchAndTrack("QTableView", "border-color", normalizedTheme.accent_secondary);
    patchAndTrack("QTableView", "alternate-background-color", surfaces.panel_bg);
    patchAndTrack("QTextEdit[objectName=\"outputLog\"]", "background-color", surfaces.section_bg);
  patchAndTrack("QHeaderView::section", "background-color", surfaces.panel_bg);
  patchAndTrack("QHeaderView::section", "color", normalizedTheme.text_primary);
  patchAndTrack("QHeaderView::section", "border-color", normalizedTheme.accent_secondary);
  patchAndTrack("QListView::item:selected", "border-color", normalizedTheme.accent_secondary);
  patchAndTrack("QTreeView::item:selected", "border-color", normalizedTheme.accent_secondary);
  patchAndTrack("QScrollBar:vertical", "background-color", surfaces.panel_bg);
  patchAndTrack("QScrollBar::handle:vertical", "background-color", normalizedTheme.panel_border);
  patchAndTrack("QScrollBar::handle:vertical:hover", "background-color", normalizedTheme.accent_secondary);
  patchAndTrack("QScrollBar:horizontal", "background-color", surfaces.panel_bg);
  patchAndTrack("QScrollBar::handle:horizontal", "background-color", normalizedTheme.panel_border);
  patchAndTrack("QScrollBar::handle:horizontal:hover", "background-color", normalizedTheme.accent_secondary);
  patchAndTrack("QCheckBox::indicator", "background-color", surfaces.section_bg);
  patchAndTrack("QCheckBox::indicator", "border-color", normalizedTheme.accent_secondary);
  patchAndTrack("QCheckBox::indicator:checked", "background-color", normalizedTheme.accent);
  patchAndTrack("QCheckBox::indicator:checked", "border-color", normalizedTheme.accent_secondary);
  patchAndTrack("QRadioButton::indicator", "background-color", surfaces.section_bg);
  patchAndTrack("QRadioButton::indicator", "border-color", normalizedTheme.accent_secondary);
  patchAndTrack("QRadioButton::indicator:checked", "background-color", normalizedTheme.accent);
  patchAndTrack("QRadioButton::indicator:checked", "border-color", normalizedTheme.accent_secondary);
  patchAndTrack('QLabel[status="info"]', "color", normalizedTheme.text_secondary);
  patchAndTrack("QStatusBar", "border-color", normalizedTheme.accent_secondary);

  lastPatchedSelectors = [...patchedSelectors];
  console.log("Applied selectors:", lastPatchedSelectors);

  return removeLightBackgrounds(output, surfaces);
}

function generateFinalQSS(nextTemplate, nextTheme) {
  let output = applyThemeToBaseQSS(nextTemplate || defaultTemplate, nextTheme);

  if (!/VideoDisplay\s*\{/i.test(output)) {
    output = `${output.trim()}\n\nVideoDisplay {\n    background: #000000 !important;\n}`;
  }

  if (!/QWidget#videoDisplay\s*\{/i.test(output)) {
    output = `${output.trim()}\n\nQWidget#videoDisplay {\n    background: #000000 !important;\n}`;
  }

  return output.trim();
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
  exitAdvancedButton?.classList.toggle("is-hidden", !advancedModeToggle.checked);

  stepTabs.forEach((button) => {
    button.classList.toggle("active", button.dataset.step === step);
  });

  const showAll = advancedModeToggle.checked;
  stepSections.forEach((section) => {
    const shouldShow = showAll || section.dataset.stepGroup === step;
    section.classList.toggle("is-hidden", !shouldShow);
  });

  document.querySelectorAll("[data-non-theme='true']").forEach((section) => {
    section.classList.toggle("is-hidden", advancedModeToggle.checked);
  });
}

function loadDefaultTheme() {
  Object.assign(theme, normalizeThemeTokens(defaultTheme));
  template = defaultTemplate;
}

function resetThemeState() {
  loadDefaultTheme();
  hidePalette();
  if (qssUpload) {
    qssUpload.value = "";
  }
  if (themeNameInput) {
    themeNameInput.value = "custom-theme";
  }
  document.querySelectorAll(".preset").forEach((button) => {
    button.classList.toggle("active", button.dataset.preset === "dark");
  });
  updateInputs();
  applyTheme();
}

function deriveAccentSystem(source) {
  const accentColor = clampHex(source);
  if (!accentColor) {
    return;
  }

  theme.accent = accentColor;
  theme.button_bg = accentColor;
  theme.button_hover = accentColor;
  theme.button_active = accentColor;
  theme.input_focus = accentColor;
}

function getAppliedPreviewPalette(nextTheme) {
  const normalizedTheme = normalizeThemeTokens(nextTheme);
  return [
    normalizedTheme.app_bg,
    normalizedTheme.panel_bg,
    normalizedTheme.accent,
    normalizedTheme.accent_secondary,
  ].filter(Boolean);
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

function hidePalette() {
  if (!palettePreviewCard || !palettePreview) {
    return;
  }

  palettePreview.innerHTML = "";
  palettePreviewCard.classList.add("is-hidden");
  palettePreviewCard.classList.remove("is-visible");
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

  return deduped.filter((color) => isValidColor(color)).slice(0, 6);
}

function isUsablePalette(colors) {
  if (!colors || colors.length < 3) {
    return false;
  }

  const valid = colors.filter((color) => isValidColor(color));
  if (valid.length < 3) {
    return false;
  }

  const unique = [...new Set(valid)];
  if (unique.length < 3) {
    return false;
  }

  const sorted = [...unique].sort((left, right) => luminance(left) - luminance(right));
  return contrastRatio(sorted[0], sorted[sorted.length - 1]) >= 2.2;
}

  function mapPaletteToTokens(colors) {
      const valid = colors.filter((color) => isValidColor(color)).slice(0, 4);
      if (!valid.length) {
        return { ...baseTheme };
      }
    const [base, surface, secondary, accentColor] = [
      valid[0] || baseTheme.app_bg,
      valid[1] || valid[0] || baseTheme.panel_bg,
      valid[2] || valid[1] || baseTheme.accent_secondary,
      valid[3] || valid[2] || valid[1] || baseTheme.accent,
    ];
    const appBg = resolveTokenColor(base, baseTheme.app_bg);
    const panelBg = resolveTokenColor(surface, baseTheme.panel_bg);
    const sectionBg = resolveTokenColor(surface, panelBg);
    const secondaryTone = resolveTokenColor(secondary, baseTheme.accent_secondary);
    const accent = resolveTokenColor(accentColor, baseTheme.accent);
      const inputBg = resolveTokenColor(secondary, secondaryTone);
      const menuBg = resolveTokenColor(base, appBg);
      const statusbarBg = resolveTokenColor(surface, panelBg);
    const textPrimary = ensureContrast(getReadableText(appBg), appBg, 7);
    const textSecondary = ensureContrast(getReadableText(panelBg), panelBg, 4);

    const tokenMap = {
      app_bg: appBg,
      panel_bg: panelBg,
      panel_title_bg: sectionBg,
        panel_border: secondaryTone,
        menu_bg: menuBg,
        menu_hover: secondaryTone,
        button_bg: accent,
        button_hover: accent,
        button_active: accent,
        input_bg: inputBg,
        input_border: secondaryTone,
        input_focus: accent,
        tab_bg: secondaryTone,
        tab_hover: accent,
        tab_active: accent,
        accent,
        accent_secondary: secondaryTone,
        text_primary: textPrimary,
        text_secondary: textSecondary,
        success: accent,
        error: base,
        statusbar_bg: statusbarBg,
        statusbar_border: secondaryTone,
      };

  return SAFE_TOKENS.reduce((accumulator, key) => {
    accumulator[key] = isValidColor(tokenMap[key]) ? tokenMap[key] : baseTheme[key];
    return accumulator;
  }, {});
}

function handleImportedImage(file) {
  const reader = new FileReader();
  reader.onload = (event) => {
    const image = new Image();
    image.onload = () => {
      const colors = extractDominantColorsFromImage(image).slice(0, 4);
      const nextTheme = normalizeThemeTokens(mapPaletteToTokens(colors));

      Object.assign(theme, nextTheme);
      template = defaultTemplate;
      updateInputs();
      applyTheme();
      showPalette(colors);
    };
    image.onerror = () => {
      loadDefaultTheme();
      updateInputs();
      applyTheme();
    };
    image.src = typeof event.target?.result === "string" ? event.target.result : "";
  };
  reader.readAsDataURL(file);
}

function updateThemeKey(key, value) {
  let normalized = clampHex(value);
  if (!normalized) {
    return;
  }

  theme[key] = normalized;

  if (key === "accent") {
    deriveAccentSystem(normalized);
  } else if (key === "button_active" || key === "input_focus") {
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

function downloadMarketplaceQSS(name, qss) {
  const safeName = (name || "marketplace-theme").trim().replace(/[^\w\- ]+/g, "").replace(/\s+/g, "-") || "marketplace-theme";
  const blob = new Blob([qss], { type: "text/plain" });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = `${safeName}.qss`;
  link.click();
  URL.revokeObjectURL(link.href);
  showToast(`${name} downloaded`);
}

function showToast(message) {
  toast.textContent = message;
  toast.style.opacity = "1";
  toast.style.transform = "translateY(0) scale(1)";
  toast.style.boxShadow = "0 0 0 1px rgba(76, 194, 255, 0.18), 0 16px 40px rgba(0, 0, 0, 0.42)";

  window.setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px) scale(0.98)";
  }, 2000);
}

function inferMarketplaceTone(palette) {
  if (!palette.length) {
    return "dark";
  }

  const average = palette.reduce((sum, color) => sum + luminance(color), 0) / palette.length;
  return average > 0.45 ? "light" : "dark";
}

function renderMarketplacePalette(target, palette) {
  target.innerHTML = "";
  palette.slice(0, 4).forEach((color) => {
    const swatch = document.createElement("span");
    swatch.style.background = color;
    swatch.title = color.toUpperCase();
    target.appendChild(swatch);
  });
}

function getMarketplaceSeedThemes() {
  return [
    { id: "preset-dark", name: "Dark", description: "Default Helios dark workspace.", qss: generateFinalQSS(defaultTemplate, presets.dark) },
    { id: "preset-neon", name: "Neon", description: "High contrast glow for bold setups.", qss: generateFinalQSS(defaultTemplate, presets.neon) },
    { id: "preset-light", name: "Light", description: "Bright workspace with clean contrast.", qss: generateFinalQSS(defaultTemplate, presets.light) },
  ].map((themeDefinition) => {
    const palette = extractPaletteFromQSS(themeDefinition.qss).slice(0, 4);
    return {
      ...themeDefinition,
      palette,
      tone: inferMarketplaceTone(palette),
      source: "built-in",
    };
  });
}

function saveMarketplaceThemes() {
  const uploads = marketplaceThemes.filter((themeEntry) => themeEntry.source === "user");
  window.localStorage.setItem(MARKETPLACE_STORAGE_KEY, JSON.stringify(uploads));
}

function loadMarketplaceThemes() {
  let uploads = [];

  try {
    uploads = JSON.parse(window.localStorage.getItem(MARKETPLACE_STORAGE_KEY) || "[]");
  } catch (_error) {
    uploads = [];
  }

  const normalizedUploads = uploads
    .filter((themeEntry) => typeof themeEntry?.name === "string" && typeof themeEntry?.qss === "string")
    .map((themeEntry) => ({
      id: themeEntry.id || `user-${Date.now()}`,
      name: themeEntry.name,
      qss: themeEntry.qss,
      palette: (themeEntry.palette || extractPaletteFromQSS(themeEntry.qss)).slice(0, 4),
      tone: themeEntry.tone || inferMarketplaceTone((themeEntry.palette || []).slice(0, 4)),
      description: themeEntry.description || "Uploaded theme",
      source: "user",
    }));

  marketplaceThemes = [...getMarketplaceSeedThemes(), ...normalizedUploads];
}

function renderMarketplaceThemes() {
  if (!marketplaceGrid) {
    return;
  }

  const query = (marketplaceSearchInput?.value || "").trim().toLowerCase();
  const toneFilter = marketplaceFilterInput?.value || "all";
  const filteredThemes = marketplaceThemes.filter((themeEntry) => {
    const matchesSearch = !query || themeEntry.name.toLowerCase().includes(query);
    const matchesTone = toneFilter === "all" || themeEntry.tone === toneFilter;
    return matchesSearch && matchesTone;
  });

  marketplaceGrid.innerHTML = "";

  if (!filteredThemes.length) {
    const emptyState = document.createElement("div");
    emptyState.className = "marketplace-empty";
    emptyState.textContent = "No themes match the current search or filter.";
    marketplaceGrid.appendChild(emptyState);
    return;
  }

  filteredThemes.forEach((themeEntry) => {
    const card = document.createElement("article");
    card.className = "theme-card";

    const header = document.createElement("div");
    header.className = "theme-card-header";

    const title = document.createElement("h3");
    title.className = "theme-name";
    title.textContent = themeEntry.name;

    const tone = document.createElement("span");
    tone.className = "theme-tone";
    tone.textContent = themeEntry.tone;

    header.append(title, tone);

    const palette = document.createElement("div");
    palette.className = "palette";
    renderMarketplacePalette(palette, themeEntry.palette);

    const copy = document.createElement("p");
    copy.className = "theme-card-copy";
    copy.textContent = themeEntry.description || "QSS theme ready to download.";

    const action = document.createElement("button");
    action.type = "button";
    action.className = "download-btn btn-primary";
    action.textContent = "Download";
    action.addEventListener("click", () => {
      downloadMarketplaceQSS(themeEntry.name, themeEntry.qss);
    });

    card.append(header, palette, copy, action);
    marketplaceGrid.appendChild(card);
  });
}

function resetMarketplaceUploadForm() {
  pendingMarketplaceUpload = null;
  if (marketplaceThemeNameInput) {
    marketplaceThemeNameInput.value = "";
  }
  if (marketplaceThemeFileInput) {
    marketplaceThemeFileInput.value = "";
  }
  if (marketplaceUploadPalette) {
    marketplaceUploadPalette.innerHTML = '<span class="marketplace-upload-empty">Upload a .qss file to preview its palette.</span>';
  }
}

function openMarketplaceModal() {
  if (!marketplaceModal) {
    return;
  }
  marketplaceModal.classList.remove("is-hidden");
  marketplaceModal.setAttribute("aria-hidden", "false");
}

function closeMarketplaceModal() {
  if (!marketplaceModal) {
    return;
  }
  marketplaceModal.classList.add("is-hidden");
  marketplaceModal.setAttribute("aria-hidden", "true");
  resetMarketplaceUploadForm();
}

function previewMarketplaceUploadPalette(colors) {
  if (!marketplaceUploadPalette) {
    return;
  }

  marketplaceUploadPalette.innerHTML = "";
  if (!colors.length) {
    marketplaceUploadPalette.innerHTML = '<span class="marketplace-upload-empty">No usable colors were found in this QSS file.</span>';
    return;
  }

  colors.slice(0, 4).forEach((color) => {
    const swatch = document.createElement("span");
    swatch.className = "palette-chip";
    swatch.style.background = color;
    swatch.title = color.toUpperCase();
    marketplaceUploadPalette.appendChild(swatch);
  });
}

function submitMarketplaceUpload() {
  if (!pendingMarketplaceUpload) {
    showToast("Choose a QSS file first");
    return;
  }

  if (pendingMarketplaceUpload.palette.length < 4) {
    showToast("Need 4 palette colors from the QSS");
    return;
  }

  const name = (marketplaceThemeNameInput?.value || "").trim() || pendingMarketplaceUpload.name;
  const entry = {
    id: `user-${Date.now()}`,
    name,
    qss: pendingMarketplaceUpload.qss,
    palette: pendingMarketplaceUpload.palette.slice(0, 4),
    tone: inferMarketplaceTone(pendingMarketplaceUpload.palette.slice(0, 4)),
    description: "Uploaded theme",
    source: "user",
  };

  marketplaceThemes = [entry, ...marketplaceThemes];
  saveMarketplaceThemes();
  renderMarketplaceThemes();
  closeMarketplaceModal();
  showToast(`${name} uploaded`);
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
    const isSafe = validateQSS(qss);
    if (!isSafe) {
      console.warn("Unsafe QSS detected");
    }

    const colors = extractPaletteFromQSS(qss);
    const nextTheme = normalizeThemeTokens(mapPaletteToTokens(colors.slice(0, 4)));

    Object.assign(theme, nextTheme);
    template = defaultTemplate;
    updateInputs();
    applyTheme();
    showPalette(colors.slice(0, 4));
  } catch (_error) {
    // Keep the current theme and UI running if import parsing fails.
  }
}

function applyInspoPalette(name) {
  const palette = inspoPalettes[name];
  if (!palette) {
    return;
  }
  const nextTheme = normalizeThemeTokens(mapPaletteToTokens(palette));

  Object.assign(theme, nextTheme);

  template = defaultTemplate;
  updateInputs();
  applyTheme();
  showPalette(getAppliedPreviewPalette(nextTheme), nextTheme.accent);

  document.querySelectorAll(".inspo-palette").forEach((button) => {
    button.classList.toggle("active", button.dataset.inspo === name);
  });
}

function applyPreset(presetName) {
  const preset = presets[presetName];
  if (!preset) {
    return;
  }

  Object.assign(theme, normalizeThemeTokens(preset));
  template = defaultTemplate;
  document.querySelectorAll(".preset").forEach((button) => {
    button.classList.toggle("active", button.dataset.preset === presetName);
  });
  updateInputs();
  applyTheme();
  showPalette(getAppliedPreviewPalette(theme), theme.accent);
}

  function applyTheme() {
    const previewBase = normalizeThemeTokens(theme);
    const surfaces = deriveSurfaceSystem(previewBase);
    const previewTheme = {
      panel_inner: previewBase.panel_title_bg,
      menu_text: previewBase.text_primary,
      left_bg: surfaces.panel_bg,
      left_section_bg: previewBase.panel_title_bg,
      right_bg: surfaces.panel_bg,
      right_card_bg: previewBase.panel_title_bg,
      tab_text: previewBase.text_primary,
      elevated_bg: surfaces.elevated_bg,
    };
    const glowColor = `${previewBase.accent}26`;

    document.body.style.background = previewBase.app_bg;
    document.body.style.color = previewBase.text_primary;
    document.documentElement.style.setProperty("--accent", previewBase.accent);

  preview.style.background = "transparent";

  document.querySelectorAll(".helios-app").forEach((el) => {
    el.style.background = surfaces.app_bg;
    el.style.color = previewBase.text_primary;
  });

      document.querySelectorAll(".preview-card").forEach((el) => {
        el.style.background = previewBase.app_bg;
        el.style.border = `1px solid ${previewBase.panel_border}`;
        el.style.boxShadow = `0 20px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px ${previewBase.panel_border}22`;
      });

  document.querySelectorAll(".menu-bar").forEach((el) => {
    el.style.background = previewBase.menu_bg;
    el.style.borderBottom = `1px solid ${previewBase.accent_secondary}`;
    el.style.color = previewTheme.menu_text;
  });

  document.querySelectorAll(".menu-items").forEach((el) => {
    el.style.color = previewTheme.menu_text;
  });

  document.querySelectorAll(".left-panel").forEach((el) => {
      el.style.background = previewBase.app_bg;
      el.style.borderRight = `1px solid ${previewBase.accent_secondary}`;
      el.style.color = previewBase.text_primary;
    });

  document.querySelectorAll(".right-panel").forEach((el) => {
      el.style.background = previewBase.app_bg;
      el.style.borderLeft = `1px solid ${previewBase.accent_secondary}`;
      el.style.color = previewBase.text_primary;
    });

  document.querySelectorAll(".center-panel, .center-stack, .output-panel, .preferences-dialog").forEach((el) => {
    el.style.background = surfaces.app_bg;
    el.style.color = previewBase.text_primary;
  });

    document.querySelectorAll(".section-block").forEach((el) => {
      el.style.background = previewTheme.left_section_bg;
      el.style.border = `1px solid ${previewBase.panel_border}`;
      el.style.borderRadius = "4px";
      el.style.padding = "8px";
    });

  document.querySelectorAll(".card").forEach((el) => {
      if (!el.closest(".controls")) {
        el.style.background = previewBase.panel_bg;
        el.style.border = `1px solid ${previewBase.panel_border}`;
        el.style.color = previewBase.text_primary;
      }
    });

    document.querySelectorAll(".preview-card-block, .usb-card, .dialog-content").forEach((el) => {
      el.style.background = previewTheme.panel_inner;
      el.style.border = `1px solid ${previewBase.panel_border}`;
    });

  document.querySelectorAll(".input").forEach((el) => {
    el.style.background = previewBase.input_bg;
    el.style.color = previewBase.text_primary;
    el.style.border = `1px solid ${previewBase.input_border}`;
    el.onmouseover = () => {
      el.style.borderColor = previewBase.input_focus;
    };
    el.onmouseout = () => {
      el.style.borderColor = previewBase.input_border;
    };
    el.onfocus = () => {
      el.style.boxShadow = `0 0 0 1px ${previewBase.input_border}, 0 0 18px ${glowColor}`;
    };
    el.onblur = () => {
      el.style.boxShadow = "none";
    };
  });

    document.querySelectorAll(".btn").forEach((el) => {
      if (el.id === "download") {
        return;
      }

      el.style.background = previewBase.button_bg;
      el.style.color = ensureContrast("#ffffff", previewBase.button_bg, 4.5);
      el.style.border = `1px solid ${previewBase.panel_border}`;
      el.style.boxShadow = `0 0 0 1px ${glowColor}`;

    el.onmouseover = () => {
      el.style.background = previewBase.button_hover;
    };

    el.onmouseout = () => {
      el.style.background = previewBase.button_bg;
    };
  });

  document.querySelectorAll(".tab").forEach((el) => {
    el.style.background = previewBase.tab_bg;
    el.style.color = previewTheme.tab_text;
    el.style.border = "none";
    el.style.borderBottom = "2px solid transparent";
    el.style.cursor = "pointer";
    el.onmouseover = () => {
      if (!el.classList.contains("active")) {
        el.style.background = previewBase.tab_hover || previewTheme.elevated_bg;
        el.style.color = ensureContrast("#ffffff", previewBase.tab_hover || previewTheme.elevated_bg, 4.5);
      }
    };
    el.onmouseout = () => {
      if (!el.classList.contains("active")) {
        el.style.background = previewBase.tab_bg;
        el.style.color = previewTheme.tab_text;
      }
    };
  });

    document.querySelectorAll(".tab.active").forEach((el) => {
      el.style.background = previewBase.tab_active;
      el.style.color = ensureContrast("#ffffff", previewBase.tab_active, 4.5);
      el.style.borderBottomColor = previewBase.accent;
      el.style.boxShadow = "none";
    });

  document.querySelectorAll(".section-block label, .preview-card-block label, .dialog-row label").forEach((el) => {
    el.style.color = previewBase.text_secondary;
  });

  document.querySelectorAll(".display-area").forEach((el) => {
    el.style.background = "transparent";
    el.style.border = "none";
  });

  document.querySelectorAll(".display-canvas").forEach((el) => {
    el.style.setProperty("background", "#000000", "important");
    el.style.border = `1px solid ${previewBase.panel_border}`;
  });

    document.querySelectorAll(".workspace-mode, .output-header, .status-strip").forEach((el) => {
      el.style.background = previewBase.statusbar_bg;
      el.style.color = previewBase.text_primary;
    });

  document.querySelectorAll(".panel-title").forEach((el) => {
    el.style.background = previewBase.panel_title_bg;
    el.style.color = previewBase.text_primary;
  });

    document.querySelectorAll(".output-body").forEach((el) => {
      el.style.background = previewTheme.panel_inner;
      el.style.borderTop = `1px solid ${previewBase.panel_border}`;
    });

  document.querySelectorAll(".meta-line, .usb-row span, .status-strip span:not(.status-online)").forEach((el) => {
    el.style.color = previewBase.text_secondary;
  });

  document.querySelectorAll(".subtab").forEach((el) => {
    el.style.color = previewBase.text_secondary;
    el.style.borderBottomColor = "transparent";
  });

    document.querySelectorAll(".active-subtab").forEach((el) => {
      el.style.color = previewBase.accent;
      el.style.borderBottomColor = previewBase.accent;
    });

    document.querySelectorAll(".slot").forEach((el, index) => {
      el.style.background = previewTheme.panel_inner;
      el.style.border = `1px solid ${previewBase.panel_border}`;
      el.style.color = previewBase.text_secondary;

      if (index === 0) {
        el.style.boxShadow = `inset 3px 0 0 ${previewBase.accent}`;
      } else {
        el.style.boxShadow = `inset 3px 0 0 ${previewBase.accent_secondary}`;
      }
    });

  document.querySelectorAll(".success-badge").forEach((el) => {
    el.style.background = `${previewBase.success}22`;
    el.style.color = previewBase.success;
  });

  document.querySelectorAll(".error-badge").forEach((el) => {
    el.style.background = `${previewBase.error}22`;
    el.style.color = previewBase.error;
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
  const resolvedZone = PREVIEW_ZONE_ALIASES[zone] || zone;
  const control = document.querySelector(
    `.control-group[data-zone="${resolvedZone}"], .advanced-control[data-zone="${resolvedZone}"]`
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

document.querySelectorAll(".inspo-palette").forEach((button) => {
  button.onclick = () => {
    applyInspoPalette(button.dataset.inspo);
  };
});

marketplaceSearchInput?.addEventListener("input", () => {
  renderMarketplaceThemes();
});

marketplaceFilterInput?.addEventListener("change", () => {
  renderMarketplaceThemes();
});

openMarketplaceUploadButton?.addEventListener("click", () => {
  openMarketplaceModal();
});

closeMarketplaceUploadButton?.addEventListener("click", () => {
  closeMarketplaceModal();
});

cancelMarketplaceUploadButton?.addEventListener("click", () => {
  closeMarketplaceModal();
});

marketplaceModal?.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  if (target.dataset.closeMarketplace === "true") {
    closeMarketplaceModal();
  }
});

marketplaceThemeFileInput?.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    pendingMarketplaceUpload = null;
    previewMarketplaceUploadPalette([]);
    return;
  }

  const reader = new FileReader();
  reader.onload = (loadEvent) => {
    const qss = typeof loadEvent.target?.result === "string" ? loadEvent.target.result : "";
    const palette = extractPaletteFromQSS(qss).slice(0, 4);

    pendingMarketplaceUpload = {
      name: file.name.replace(/\.qss$/i, ""),
      qss,
      palette,
    };

    if (marketplaceThemeNameInput && !marketplaceThemeNameInput.value.trim()) {
      marketplaceThemeNameInput.value = pendingMarketplaceUpload.name;
    }

    previewMarketplaceUploadPalette(palette);
  };
  reader.readAsText(file);
});

submitMarketplaceUploadButton?.addEventListener("click", () => {
  submitMarketplaceUpload();
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

if (resetButton) {
  resetButton.onclick = resetThemeState;
}
if (quickResetButton) {
  quickResetButton.onclick = resetThemeState;
}
if (exitAdvancedButton) {
  exitAdvancedButton.onclick = () => {
    advancedModeToggle.checked = false;
    setActiveStep(currentStep);
  };
}

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
  try {
    const finalQSS = generateFinalQSS(template, theme);
    downloadQSS(finalQSS);
  } catch (_error) {
    const finalQSS = generateFinalQSS(defaultTemplate, defaultTheme);
    downloadQSS(finalQSS);
  }
};

startCreatingButton?.addEventListener("click", () => {
  if (!generatorSection) {
    return;
  }

  const yOffset = -72;
  const y = generatorSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
  window.scrollTo({ top: y, behavior: "smooth" });
});

if (generatorSection) {
  const generatorObserver = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        generatorSection.classList.add("visible");
      }
    },
    { threshold: 0.2 }
  );

  generatorObserver.observe(generatorSection);
}

themeNameInput.value = "custom-theme";
loadDefaultTheme();
loadMarketplaceThemes();
renderMarketplaceThemes();
resetMarketplaceUploadForm();
document.querySelectorAll(".preset").forEach((button) => {
  button.classList.toggle("active", button.dataset.preset === "dark");
});
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
