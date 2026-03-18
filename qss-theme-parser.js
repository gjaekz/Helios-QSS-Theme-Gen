const fs = require("fs");

const THEME_KEYS = [
  "bg_main",
  "bg_secondary",
  "accent",
  "accent_hover",
  "text_primary",
  "text_secondary",
  "border",
];

const PROPERTY_RE = /([A-Za-z-]+)\s*:\s*([^;]+);/g;
const BLOCK_RE = /([^{}]+)\{([^{}]*)\}/g;
const COLOR_VALUE_RE =
  /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)/g;
const COLOR_PROPERTY_NAMES = new Set([
  "background",
  "background-color",
  "color",
  "border",
  "border-color",
  "selection-background-color",
  "selection-color",
  "alternate-background-color",
]);

function createEmptyTheme() {
  return {
    bg_main: "",
    bg_secondary: "",
    accent: "",
    accent_hover: "",
    text_primary: "",
    text_secondary: "",
    border: "",
  };
}

function stripComments(input) {
  return input.replace(/\/\*[\s\S]*?\*\//g, "");
}

function normalizeColor(rawColor) {
  const value = rawColor.trim();

  if (value.startsWith("#")) {
    return value.toLowerCase();
  }

  const match = value.match(/^rgba?\(([^)]+)\)$/i);
  if (!match) {
    return null;
  }

  const parts = match[1]
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length !== 3 && parts.length !== 4) {
    return null;
  }

  return `${parts.length === 4 ? "rgba" : "rgb"}(${parts.join(", ")})`.toLowerCase();
}

function extractColorsFromValue(value) {
  if (/gradient|url\(|image\s*:|icon\s*:|transparent\b/i.test(value)) {
    return [];
  }

  const matches = value.match(COLOR_VALUE_RE) || [];
  return matches.map(normalizeColor).filter(Boolean);
}

function splitSelectors(selectorText) {
  return selectorText
    .split(",")
    .map((selector) => selector.trim())
    .filter(Boolean);
}

function selectorIncludes(selector, terms) {
  const lower = selector.toLowerCase();
  return terms.some((term) => lower.includes(term));
}

function colorToRgb(color) {
  if (!color) {
    return null;
  }

  if (color.startsWith("#")) {
    const hex = color.slice(1);
    const expanded =
      hex.length === 3
        ? hex
            .split("")
            .map((char) => char + char)
            .join("")
        : hex;

    return {
      r: Number.parseInt(expanded.slice(0, 2), 16),
      g: Number.parseInt(expanded.slice(2, 4), 16),
      b: Number.parseInt(expanded.slice(4, 6), 16),
    };
  }

  const match = color.match(/^rgba?\(([^)]+)\)$/i);
  if (!match) {
    return null;
  }

  const [r, g, b] = match[1]
    .split(",")
    .slice(0, 3)
    .map((value) => Number.parseFloat(value.trim()));

  if ([r, g, b].some((value) => Number.isNaN(value))) {
    return null;
  }

  return { r, g, b };
}

function relativeLuminance({ r, g, b }) {
  const toLinear = (channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function isDarkColor(color) {
  const rgb = colorToRgb(color);
  if (!rgb) {
    return false;
  }

  return relativeLuminance(rgb) < 0.45;
}

function buildDeclarations(qss) {
  const declarations = [];
  const cleanQss = stripComments(qss);
  let blockMatch;

  BLOCK_RE.lastIndex = 0;

  while ((blockMatch = BLOCK_RE.exec(cleanQss)) !== null) {
    const selectorText = blockMatch[1].trim();
    const body = blockMatch[2];
    const selectors = splitSelectors(selectorText);
    let propertyMatch;

    PROPERTY_RE.lastIndex = 0;

    while ((propertyMatch = PROPERTY_RE.exec(body)) !== null) {
      const property = propertyMatch[1].trim();
      const value = propertyMatch[2].trim();

      if (!COLOR_PROPERTY_NAMES.has(property.toLowerCase())) {
        continue;
      }

      const colors = extractColorsFromValue(value);
      if (!colors.length) {
        continue;
      }

      for (const selector of selectors) {
        declarations.push({
          selector,
          property,
          value,
          colors,
        });
      }
    }
  }

  return declarations;
}

function createBuckets() {
  return THEME_KEYS.reduce((accumulator, key) => {
    accumulator[key] = new Map();
    return accumulator;
  }, {});
}

function recordCandidate(buckets, key, color, declaration) {
  if (!THEME_KEYS.includes(key) || !color) {
    return;
  }

  const bucket = buckets[key];
  if (!bucket.has(color)) {
    bucket.set(color, {
      color,
      count: 0,
      selectors: new Set(),
      properties: new Set(),
    });
  }

  const candidate = bucket.get(color);
  candidate.count += 1;
  candidate.selectors.add(declaration.selector);
  candidate.properties.add(declaration.property);
}

function classifyBackground(declaration, buckets) {
  const selector = declaration.selector.toLowerCase();
  const property = declaration.property.toLowerCase();
  const color = declaration.colors[0];

  if (selectorIncludes(selector, ["qwidget", "qmainwindow", "qsplitter::handle", "qscrollbar"])) {
    recordCandidate(buckets, "bg_main", color, declaration);
  }

  if (
    selectorIncludes(selector, [
      "qdockwidget",
      "qmenu",
      "qmenubar",
      "qtoolbar",
      "qheaderview",
      "qgroupbox",
      "qtabwidget::pane",
      "qlistview",
      "qtreeview",
      "qtableview",
      "qstatusbar",
      "qlineedit",
      "qcombobox",
      "qspinbox",
      "qtextedit",
      "qplaintextedit",
      "qcheckbox::indicator",
      "qradiobutton::indicator",
      "qcombobox qabstractitemview",
    ])
  ) {
    recordCandidate(buckets, "bg_secondary", color, declaration);
  }

  if (
    selectorIncludes(selector, [
      "qpushbutton",
      "qtoolbutton",
      "qtabbar::tab:selected",
      "selection-background-color",
      "qlabel[status=\"active\"]",
    ])
  ) {
    recordCandidate(buckets, "accent", color, declaration);
  }

  if (property === "selection-background-color") {
    recordCandidate(buckets, "accent", color, declaration);
  }

  if (selectorIncludes(selector, [":hover"])) {
    recordCandidate(buckets, "accent_hover", color, declaration);
  }
}

function classifyText(declaration, buckets) {
  const selector = declaration.selector.toLowerCase();

  for (const color of declaration.colors) {
    if (selectorIncludes(selector, [":disabled", "[status=\"info\"]", "placeholder"])) {
      recordCandidate(buckets, "text_secondary", color, declaration);
    } else if (isDarkColor(color)) {
      recordCandidate(buckets, "text_secondary", color, declaration);
    } else {
      recordCandidate(buckets, "text_primary", color, declaration);
    }
  }
}

function classifyBorder(declaration, buckets) {
  const selector = declaration.selector.toLowerCase();
  const color = declaration.colors[declaration.colors.length - 1];

  recordCandidate(buckets, "border", color, declaration);

  if (selectorIncludes(selector, [":hover"])) {
    recordCandidate(buckets, "accent_hover", color, declaration);
  }
}

function classifyDeclaration(declaration, buckets) {
  const property = declaration.property.toLowerCase();

  if (property === "color" || property === "selection-color") {
    classifyText(declaration, buckets);
    return;
  }

  if (property === "border" || property === "border-color") {
    classifyBorder(declaration, buckets);
    return;
  }

  classifyBackground(declaration, buckets);
}

function scoreCandidate(key, candidate) {
  const rgb = colorToRgb(candidate.color);
  const luminance = rgb ? relativeLuminance(rgb) : 0;
  let score = candidate.count * 100 + candidate.selectors.size * 15 + candidate.properties.size * 10;

  switch (key) {
    case "bg_main":
    case "bg_secondary":
    case "border":
      score += (1 - luminance) * 20;
      break;
    case "text_primary":
      score += luminance * 20;
      break;
    case "text_secondary":
      score += luminance * 10;
      if (selectorIncludes([...candidate.selectors].join(" "), [":disabled", "[status=\"info\"]"])) {
        score += 40;
      }
      break;
    case "accent":
    case "accent_hover":
      score += 10;
      break;
    default:
      break;
  }

  return score;
}

function choosePreferredColor(key, bucket) {
  const candidates = [...bucket.values()];
  if (!candidates.length) {
    return "";
  }

  candidates.sort((left, right) => scoreCandidate(key, right) - scoreCandidate(key, left));
  return candidates[0].color;
}

function finalizeTheme(buckets) {
  const theme = createEmptyTheme();

  for (const key of THEME_KEYS) {
    theme[key] = choosePreferredColor(key, buckets[key]);
  }

  return theme;
}

function extractThemeFromQss(qss) {
  const declarations = buildDeclarations(qss);
  const buckets = createBuckets();

  for (const declaration of declarations) {
    classifyDeclaration(declaration, buckets);
  }

  return {
    theme: finalizeTheme(buckets),
    declarations,
  };
}

function inferVariableName(declaration, color, theme) {
  const selector = declaration.selector.toLowerCase();
  const property = declaration.property.toLowerCase();

  if (property === "color" || property === "selection-color") {
    if (theme.text_secondary === color && selectorIncludes(selector, [":disabled", "[status=\"info\"]"])) {
      return "text_secondary";
    }
    if (theme.text_primary === color) {
      return "text_primary";
    }
    if (theme.text_secondary === color) {
      return "text_secondary";
    }
  }

  if (property === "border" || property === "border-color") {
    if (theme.accent_hover === color && selectorIncludes(selector, [":hover"])) {
      return "accent_hover";
    }
    if (theme.border === color) {
      return "border";
    }
  }

  if (theme.accent_hover === color && selectorIncludes(selector, [":hover"])) {
    return "accent_hover";
  }

  if (
    theme.accent === color &&
    (selectorIncludes(selector, ["qpushbutton", "qtoolbutton", "qtabbar::tab:selected", "qlabel[status=\"active\"]"]) ||
      property === "selection-background-color")
  ) {
    return "accent";
  }

  if (theme.bg_main === color && selectorIncludes(selector, ["qwidget", "qmainwindow", "qsplitter::handle", "qscrollbar"])) {
    return "bg_main";
  }

  if (
    theme.bg_secondary === color &&
    selectorIncludes(selector, [
      "qdockwidget",
      "qmenu",
      "qmenubar",
      "qtoolbar",
      "qheaderview",
      "qgroupbox",
      "qtabwidget::pane",
      "qlistview",
      "qtreeview",
      "qtableview",
      "qstatusbar",
      "qlineedit",
      "qcombobox",
      "qspinbox",
      "qtextedit",
      "qplaintextedit",
      "qcheckbox::indicator",
      "qradiobutton::indicator",
      "qcombobox qabstractitemview",
    ])
  ) {
    return "bg_secondary";
  }

  if (theme.border === color) {
    return "border";
  }

  return null;
}

function buildTemplatePlan(declarations, theme) {
  return declarations
    .map((declaration) => {
      const replacements = declaration.colors
        .map((color) => ({
          color,
          variable: inferVariableName(declaration, color, theme),
        }))
        .filter((entry) => entry.variable);

      return {
        selector: declaration.selector,
        property: declaration.property,
        originalValue: declaration.value,
        replacements,
      };
    })
    .filter((entry) => entry.replacements.length);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function templateValueFromPlan(originalValue, replacements) {
  let templatedValue = originalValue;

  for (const replacement of replacements) {
    templatedValue = templatedValue.replace(
      new RegExp(escapeRegExp(replacement.color), "i"),
      `{{${replacement.variable}}}`
    );
  }

  return templatedValue;
}

function buildQssTemplate(qss, declarations, theme) {
  const templatePlan = buildTemplatePlan(declarations, theme);
  let template = qss;

  for (const entry of templatePlan) {
    const nextValue = templateValueFromPlan(entry.originalValue, entry.replacements);
    const snippetPattern = new RegExp(
      `${escapeRegExp(entry.property)}\\s*:\\s*${escapeRegExp(entry.originalValue)}`,
      "i"
    );

    template = template.replace(snippetPattern, `${entry.property}: ${nextValue}`);
  }

  return {
    template,
    templatePlan,
  };
}

function generateFinalQSS(template, theme) {
  let output = template;

  Object.entries(theme).forEach(([key, value]) => {
    const regex = new RegExp(`{{${escapeRegExp(key)}}}`, "g");
    output = output.replace(regex, value);
  });

  return output;
}

function downloadQSS(qss) {
  const blob = new Blob([qss], { type: "text/plain" });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = "custom-theme.qss";
  link.click();
}

function parseQssTheme(qss) {
  const extracted = extractThemeFromQss(qss);
  const templated = buildQssTemplate(qss, extracted.declarations, extracted.theme);

  return {
    theme: extracted.theme,
    template: templated.template,
    templatePlan: templated.templatePlan,
    declarations: extracted.declarations,
    keys: THEME_KEYS,
  };
}

function buildThemeTemplateFromFile(filePath) {
  const qss = fs.readFileSync(filePath, "utf8");
  return parseQssTheme(qss);
}

module.exports = {
  THEME_KEYS,
  buildThemeTemplateFromFile,
  createEmptyTheme,
  downloadQSS,
  extractThemeFromQss,
  generateFinalQSS,
  parseQssTheme,
};

if (require.main === module) {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error("Usage: node qss-theme-parser.js <path-to-qss>");
    process.exit(1);
  }

  const result = buildThemeTemplateFromFile(filePath);
  console.log(
    JSON.stringify(
      {
        theme: result.theme,
        template: result.template,
      },
      null,
      2
    )
  );
}
