const http = require("http");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

const ROOT = __dirname;
const THEMES_DIR = path.join(ROOT, "themes");
const THEMES_JSON = path.join(ROOT, "themes.json");
const PORT = Number(process.env.PORT || 3000);

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".qss": "text/plain; charset=utf-8",
};

function ensureStorage() {
  if (!fs.existsSync(THEMES_DIR)) {
    fs.mkdirSync(THEMES_DIR, { recursive: true });
  }

  if (!fs.existsSync(THEMES_JSON)) {
    fs.writeFileSync(THEMES_JSON, "[]\n", "utf8");
  }
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

function sendText(response, statusCode, message) {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
  });
  response.end(message);
}

function safeSlug(value) {
  const slug = String(value || "theme")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "theme";
}

function normalizeColor(value) {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) {
    return "";
  }

  if (trimmed.length === 4) {
    return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`.toLowerCase();
  }

  return trimmed.toLowerCase();
}

function extractColors(qss) {
  const matches = String(qss || "").match(/#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g) || [];
  const unique = [];

  matches
    .map((color) => normalizeColor(color))
    .filter(Boolean)
    .forEach((color) => {
      if (!unique.includes(color)) {
        unique.push(color);
      }
    });

  return unique.slice(0, 4);
}

function hexToRgb(hex) {
  const normalized = normalizeColor(hex).replace("#", "");
  if (normalized.length !== 6) {
    return null;
  }

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function luminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return 0;
  }

  const channel = (value) => {
    const normalized = value / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

function rgbToHsl(rgb) {
  const red = rgb.r / 255;
  const green = rgb.g / 255;
  const blue = rgb.b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const delta = max - min;
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    switch (max) {
      case red:
        h = (green - blue) / delta + (green < blue ? 6 : 0);
        break;
      case green:
        h = (blue - red) / delta + 2;
        break;
      default:
        h = (red - green) / delta + 4;
        break;
    }
    h /= 6;
  }

  return { h, s, l };
}

function inferCategory(colors) {
  if (!colors.length) {
    return "Minimal";
  }

  const averageLuminance = colors.reduce((sum, color) => sum + luminance(color), 0) / colors.length;
  const averageSaturation = colors
    .map((color) => hexToRgb(color))
    .filter(Boolean)
    .map((rgb) => rgbToHsl(rgb).s)
    .reduce((sum, saturation, _, values) => sum + saturation / values.length, 0);

  if (averageSaturation > 0.62) {
    return "Neon";
  }

  if (averageLuminance > 0.6) {
    return "Light";
  }

  if (averageSaturation < 0.22) {
    return "Minimal";
  }

  return "Dark";
}

function readThemes() {
  ensureStorage();
  try {
    const parsed = JSON.parse(fs.readFileSync(THEMES_JSON, "utf8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function writeThemes(themes) {
  fs.writeFileSync(THEMES_JSON, JSON.stringify(themes, null, 2), "utf8");
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) {
        reject(new Error("Payload too large"));
        request.destroy();
      }
    });

    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function serveFile(requestPath, response) {
  const normalizedPath = requestPath === "/" ? "/index.html" : requestPath;
  const resolvedPath = path.normalize(path.join(ROOT, normalizedPath));

  if (!resolvedPath.startsWith(ROOT)) {
    sendText(response, 403, "Forbidden");
    return;
  }

  fs.readFile(resolvedPath, (error, data) => {
    if (error) {
      sendText(response, 404, "Not found");
      return;
    }

    const extension = path.extname(resolvedPath).toLowerCase();
    response.writeHead(200, {
      "Content-Type": MIME_TYPES[extension] || "application/octet-stream",
    });
    response.end(data);
  });
}

async function handleApi(request, response) {
  if (request.method === "GET" && request.url === "/api/themes") {
    const themes = readThemes();
    sendJson(response, 200, themes);
    return true;
  }

  if (request.method === "POST" && request.url === "/api/themes") {
    try {
      const body = await readRequestBody(request);
      const payload = JSON.parse(body || "{}");
      const name = String(payload.name || "").trim();
      const qss = String(payload.qss || "");

      if (!name) {
        sendJson(response, 400, { error: "Theme name is required." });
        return true;
      }

      if (!qss.trim()) {
        sendJson(response, 400, { error: "QSS content is required." });
        return true;
      }

      const colors = extractColors(qss);
      if (colors.length !== 4) {
        sendJson(response, 400, { error: "Theme must contain exactly 4 extractable colors." });
        return true;
      }

      const id = randomUUID();
      const filename = `${safeSlug(name)}-${id.slice(0, 8)}.qss`;
      const filepath = path.join(THEMES_DIR, filename);
      const theme = {
        id,
        name,
        colors,
        file: `themes/${filename}`,
        category: inferCategory(colors),
        createdAt: new Date().toISOString(),
      };

      fs.writeFileSync(filepath, qss, "utf8");
      const themes = readThemes();
      themes.unshift(theme);
      writeThemes(themes);

      sendJson(response, 201, theme);
      return true;
    } catch (error) {
      sendJson(response, 500, { error: error.message || "Upload failed." });
      return true;
    }
  }

  return false;
}

ensureStorage();

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);

  if (requestUrl.pathname.startsWith("/api/")) {
    request.url = requestUrl.pathname;
    const handled = await handleApi(request, response);
    if (!handled) {
      sendText(response, 404, "Not found");
    }
    return;
  }

  serveFile(requestUrl.pathname, response);
});

server.listen(PORT, () => {
  console.log(`Marketplace server running at http://localhost:${PORT}`);
});
