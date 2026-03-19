import { authReady, currentUserId, db, firebaseFns, firebaseReady, storage } from "./firebase.js";

const MAX_FILE_SIZE = 200 * 1024;

const canvas = document.getElementById("bg");
const ctx = canvas?.getContext("2d");
const marketplaceGrid = document.getElementById("themesGrid") || document.getElementById("marketplaceGrid");
const marketplaceSearchInput = document.getElementById("marketplaceSearch");
const marketplaceCategories = [...document.querySelectorAll(".marketplace-category")];
const marketplaceSortTabs = [...document.querySelectorAll(".marketplace-sort-tab")];
const uploadButton = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");
const toast = document.getElementById("toast");
const themePreviewModal = document.getElementById("themePreviewModal");
const themePreviewClose = document.getElementById("themePreviewClose");
const themePreviewName = document.getElementById("themePreviewName");
const themePreviewCategory = document.getElementById("themePreviewCategory");
const themePreviewMeta = document.getElementById("themePreviewMeta");
const themePreviewPalette = document.getElementById("themePreviewPalette");
const themePreviewCanvas = document.getElementById("themePreviewCanvas");
const themePreviewCopy = document.getElementById("themePreviewCopy");
const themePreviewDownload = document.getElementById("themePreviewDownload");

const seedThemes = [
  { name: "Cotton Sky", file: "./themes/G_Cotton Sky.qss", colors: ["#1a1a2e", "#22203a", "#aa96da", "#a8d8ea"] },
  { name: "Electropop", file: "./themes/G_Electropop.qss", colors: ["#0d0d0d", "#151515", "#5200ff", "#ccff00"] },
  { name: "Frosted Fantasy", file: "./themes/G_Frosted Fantasy.qss", colors: ["#0a0818", "#110d2a", "#4361ee", "#f72585"] },
  { name: "Glowing Horizon", file: "./themes/G_Glowing Horizon.qss", colors: ["#0d0f1a", "#141727", "#4272ff", "#ffb343"] },
  { name: "Rainbow", file: "./themes/G_Rainbow.qss", colors: ["#ff3d00", "#ff6b00", "#ffd000", "#00cc00"] },
];

let marketplaceThemes = [];
let particles = [];
let mouse = { x: 0, y: 0 };
let activeCategory = "all";
let toastTimer = null;
let currentSort = "new";
let visibleThemeCount = 12;
let isLoadingBatch = false;
let activePreviewTheme = null;
let likeStore = {};
let lastUpload = 0;

try {
  likeStore = JSON.parse(window.localStorage.getItem("marketplaceLikes") || "{}");
} catch (_error) {
  likeStore = {};
}

function bootstrapThemesFromMarkup() {
  if (!marketplaceGrid) {
    return [];
  }

  return [...marketplaceGrid.querySelectorAll(".theme-card")]
    .map((card, index) => {
      const name = card.querySelector(".theme-name")?.textContent?.trim() || `Theme ${index + 1}`;
      const colors = [...card.querySelectorAll(".color-block")]
        .map((block) => normalizeColor(block.dataset.color || block.style.background || ""))
        .filter(Boolean)
        .slice(0, 4);
      const url =
        card.querySelector(".marketplace-download-btn")?.dataset.downloadUrl ||
        card.querySelector("a[href]")?.getAttribute("href") ||
        "";
      const category = String(card.dataset.category || detectCategory(colors)).trim();

      if (colors.length !== 4 || !url) {
        return null;
      }

      return {
        id: `markup-${slugify(name)}-${index}`,
        name,
        colors,
        url,
        category,
        createdAt: "",
      };
    })
    .filter(Boolean);
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
  const matches = String(qss || "").match(/#([0-9a-f]{6})/gi) || [];
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

function inferThemeCategory(colors) {
  if (!colors.length) {
    return "Dark";
  }

  const averageLuminance = colors.reduce((sum, color) => sum + luminance(color), 0) / colors.length;
  const averageSaturation = colors
    .map((color) => hexToRgb(color))
    .filter(Boolean)
    .map((rgb) => rgbToHsl(rgb).s)
    .reduce((sum, value, index, values) => sum + value / values.length, 0);

  if (averageSaturation > 0.58) {
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

function detectCategory(colors) {
  return inferThemeCategory(colors);
}

function themeCategories(entry) {
  const categories = new Set(["all"]);
  const explicit = String(entry.category || "").trim().toLowerCase();
  if (explicit) {
    categories.add(explicit);
  }

  const derived = inferThemeCategory(entry.colors || []).toLowerCase();
  categories.add(derived);
  return [...categories];
}

function resizeCanvas() {
  if (!canvas || !ctx) {
    return;
  }

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function createParticles() {
  if (!canvas) {
    return;
  }

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
  if (!ctx || !canvas) {
    return;
  }

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

  window.requestAnimationFrame(drawParticles);
}

function showToast(message, duration = 2200) {
  if (!toast) {
    return;
  }

  if (toastTimer) {
    window.clearTimeout(toastTimer);
    toastTimer = null;
  }

  toast.textContent = message;
  toast.style.opacity = "1";
  toast.style.transform = "translateY(0) scale(1)";
  toast.style.boxShadow = "0 0 0 1px rgba(76, 194, 255, 0.18), 0 16px 40px rgba(0, 0, 0, 0.42)";

  if (duration <= 0) {
    return;
  }

  toastTimer = window.setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px) scale(0.98)";
    toastTimer = null;
  }, duration);
}

function setEmptyState(message) {
  if (!marketplaceGrid) {
    return;
  }

  marketplaceGrid.innerHTML = "";
  const empty = document.createElement("div");
  empty.className = "marketplace-empty";
  empty.textContent = message;
  marketplaceGrid.appendChild(empty);
}

function slugify(value) {
  return String(value || "theme")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "theme";
}

function themeKey(theme) {
  return String(theme.id || `${theme.name}::${theme.url || theme.fileUrl || theme.file || ""}`);
}

function getThemeLikes(theme) {
  const localLikes = Number(likeStore[themeKey(theme)] || 0);
  const remoteLikes = Number(theme.likes || 0);
  return Math.max(localLikes, remoteLikes);
}

function canDeleteTheme(theme) {
  return Boolean(firebaseReady && currentUserId && theme?.userId && theme.userId === currentUserId);
}

function saveLikes() {
  window.localStorage.setItem("marketplaceLikes", JSON.stringify(likeStore));
}

function sortThemes(themes) {
  const sorted = [...themes];

  if (currentSort === "popular") {
    sorted.sort((left, right) => getThemeLikes(right) - getThemeLikes(left) || String(left.name).localeCompare(String(right.name)));
    return sorted;
  }

  if (currentSort === "random") {
    return sorted
      .map((theme) => ({ theme, weight: `${themeKey(theme)}::${activeCategory}::${marketplaceSearchInput?.value || ""}` }))
      .sort((left, right) => left.weight.localeCompare(right.weight))
      .map((entry, index, list) => list[(index * 7) % list.length]?.theme || entry.theme);
  }

  sorted.sort((left, right) => {
    const leftTime = Number(left.createdAt?.seconds ? left.createdAt.seconds * 1000 : left.createdAt || 0);
    const rightTime = Number(right.createdAt?.seconds ? right.createdAt.seconds * 1000 : right.createdAt || 0);
    return rightTime - leftTime || String(left.name).localeCompare(String(right.name));
  });
  return sorted;
}

function renderSkeletons(count = 8) {
  if (!marketplaceGrid) {
    return;
  }

  marketplaceGrid.innerHTML = "";
  for (let index = 0; index < count; index += 1) {
    const skeleton = document.createElement("div");
    skeleton.className = "theme-card-skeleton";
    skeleton.innerHTML = `
      <div class="theme-card-skeleton-palette">
        <span></span><span></span><span></span><span></span>
      </div>
      <div class="theme-card-skeleton-meta"></div>
    `;
    marketplaceGrid.appendChild(skeleton);
  }
}

function formatCategory(value) {
  const category = String(value || "theme").trim();
  return category ? category.charAt(0).toUpperCase() + category.slice(1).toLowerCase() : "Theme";
}

function validateFile(file) {
  if (!file) {
    return "Choose a .qss file first";
  }

  if (!/\.qss$/i.test(file.name)) {
    return "Only .qss files are allowed";
  }

  if (file.size > MAX_FILE_SIZE) {
    return "QSS file must be 200KB or smaller";
  }

  return "";
}

function renderPalette(target, palette) {
  target.innerHTML = "";
  palette.slice(0, 4).forEach((color) => {
    const swatch = document.createElement("div");
    swatch.className = "color";
    swatch.style.background = color;
    swatch.title = color.toUpperCase();
    target.appendChild(swatch);
  });
}

function createThemeCard(data) {
  const colors = Array.isArray(data.colors) ? data.colors.slice(0, 4).map(normalizeColor).filter(Boolean) : [];
  const url = data.url || data.fileUrl || data.file || "";

  if (colors.length !== 4 || !url || typeof data.name !== "string") {
    return null;
  }

  const card = document.createElement("div");
  card.className = "theme-card";
  card.dataset.category = String(data.category || "").toLowerCase();

  card.addEventListener("mousemove", (event) => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    card.style.setProperty("--my", `${event.clientY - rect.top}px`);
  });

  const likes = getThemeLikes(data);
  const showDelete = canDeleteTheme(data);

  card.innerHTML = `
    <div class="palette-full">
      ${colors.map((color) => `<div class="color-block" style="background:${color}" data-color="${color}" title="${color.toUpperCase()}"></div>`).join("")}
    </div>
    <div class="theme-hover-preview">
      <div class="theme-hover-shell">
        <div class="theme-hover-top" style="background:${colors[0]};"></div>
        <div class="theme-hover-body">
          <div class="theme-hover-sidebar" style="background:${colors[1]}; border-color:${colors[2]};"></div>
          <div class="theme-hover-main">
            <div class="theme-hover-tabs">
              <span style="background:${colors[3]};"></span>
              <span style="background:${colors[2]};"></span>
              <span style="background:${colors[2]}; opacity:0.72;"></span>
            </div>
            <div class="theme-hover-screen"></div>
            <div class="theme-hover-bottom" style="background:${colors[1]}; border-color:${colors[2]};"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="theme-info">
      <div class="theme-meta">
        <span class="theme-name">${data.name}</span>
        <span class="theme-like-count">${likes} likes</span>
      </div>
      <div class="theme-actions">
        <button class="theme-like-btn" type="button" data-like-id="${themeKey(data)}" title="Like ${data.name}">❤</button>
        ${showDelete ? `<button class="theme-delete-btn" type="button" data-delete-id="${data.id}" title="Delete ${data.name}">✕</button>` : ""}
        <button class="download-btn marketplace-download-btn" type="button" data-download-url="${url}" title="Download ${data.name}">↓</button>
      </div>
    </div>
  `;

  card.dataset.previewName = data.name;
  card.dataset.previewCategory = formatCategory(data.category);
  card.dataset.previewUrl = url;
  card.dataset.previewColors = JSON.stringify(colors);
  card.dataset.likeId = themeKey(data);
  card.dataset.deleteId = data.id || "";

  return card;
}

function renderThemes() {
  if (!marketplaceGrid) {
    console.log("GRID:", marketplaceGrid);
    return;
  }

  const queryText = (marketplaceSearchInput?.value || "").trim().toLowerCase();
  const filteredThemes = marketplaceThemes.filter((theme) => {
    const matchesQuery = !queryText || theme.name.toLowerCase().includes(queryText);
    const matchesCategory = activeCategory === "all" || themeCategories(theme).includes(activeCategory);
    return matchesQuery && matchesCategory;
  });
  const sortedThemes = sortThemes(filteredThemes);
  const visibleThemes = sortedThemes.slice(0, visibleThemeCount);

  if (!sortedThemes.length) {
    setEmptyState("No themes match this filter yet.");
    return;
  }

  marketplaceGrid.innerHTML = "";
  let renderedCount = 0;

  visibleThemes.forEach((theme) => {
    const card = createThemeCard(theme);
    if (!card) {
      return;
    }

    marketplaceGrid.appendChild(card);
    renderedCount += 1;
  });

  if (!renderedCount) {
    setEmptyState("Themes were found, but none had a valid 4-color palette.");
    return;
  }

  if (visibleThemes.length < sortedThemes.length) {
    const sentinel = document.createElement("div");
    sentinel.className = "marketplace-load-more";
    sentinel.textContent = "Scroll to load more themes";
    marketplaceGrid.appendChild(sentinel);
  }
}

async function uploadTheme(file, name) {
  const text = await file.text();
  const colors = extractColors(text);

  if (colors.length < 4) {
    throw new Error("Invalid QSS: not enough colors");
  }

  const filename = `${slugify(name)}-${Date.now()}.qss`;
  const storageRef = firebaseFns.ref(storage, `themes/${filename}`);
  const uploadTask = firebaseFns.uploadBytesResumable(storageRef, file, { contentType: "text/plain" });
  const fileUrl = await new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        showToast(`Upload ${Math.round(progress)}%`, 0);
      },
      reject,
      async () => {
        try {
          const url = await firebaseFns.getDownloadURL(uploadTask.snapshot.ref);
          resolve(url);
        } catch (error) {
          reject(error);
        }
      }
    );
  });

  const docRef = await firebaseFns.addDoc(firebaseFns.collection(db, "themes"), {
    name,
    colors,
    fileUrl,
    category: inferThemeCategory(colors),
    likes: 0,
    userId: currentUserId,
    createdAt: firebaseFns.serverTimestamp(),
  });

  return {
    id: docRef.id,
    name,
    colors,
    fileUrl,
    category: inferThemeCategory(colors),
    userId: currentUserId,
    createdAt: Date.now(),
  };
}

async function loadThemes() {
  if (!db) {
    renderThemes();
    return;
  }

  try {
    const snapshot = await firebaseFns.getDocs(
      firebaseFns.query(
        firebaseFns.collection(db, "themes"),
        firebaseFns.orderBy("createdAt", "desc")
      )
    );
    const remoteThemes = snapshot.docs
      .map((docSnapshot) => {
        const data = docSnapshot.data();
        const colors = Array.isArray(data.colors) ? data.colors.map(normalizeColor).filter(Boolean).slice(0, 4) : [];
        if (typeof data.name !== "string" || colors.length !== 4 || typeof data.fileUrl !== "string") {
          return null;
          }

        return {
          id: docSnapshot.id,
          name: data.name,
          colors,
          url: data.fileUrl,
          category: data.category || inferThemeCategory(colors),
          likes: Number(data.likes || 0),
          userId: String(data.userId || ""),
          createdAt: data.createdAt || null,
        };
      })
      .filter(Boolean);

    const seen = new Set(marketplaceThemes.map((theme) => `${theme.name}::${theme.url}`));
    remoteThemes.forEach((theme) => {
      const key = `${theme.name}::${theme.url}`;
      if (!seen.has(key)) {
        marketplaceThemes.push(theme);
        seen.add(key);
      }
    });

    renderThemes();
  } catch (_error) {
    if (!marketplaceThemes.length) {
      setEmptyState("Could not load public themes right now.");
    } else {
      renderThemes();
    }
    showToast("Failed to load marketplace");
  }
}

async function loadSeedThemes() {
  console.log("GRID:", marketplaceGrid);
  if (!marketplaceGrid) {
    return;
  }

  const loadedThemes = [];
  const baseUrl = new URL("./themes/", window.location.href).toString();

  for (const theme of seedThemes) {
    try {
      const fileUrl = new URL(theme.file.replace("./themes/", ""), baseUrl).toString();
      const response = await fetch(fileUrl, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const text = await response.text();
      const colors = extractColors(text);
      if (colors.length !== 4) {
        throw new Error("QSS did not contain 4 unique colors");
      }

      loadedThemes.push({
        id: `seed-${theme.name.toLowerCase().replace(/\s+/g, "-")}`,
        name: theme.name,
        colors,
        url: fileUrl,
        category: detectCategory(colors),
        createdAt: "",
      });
    } catch (_error) {
      console.error("FAILED:", theme.file, _error);
      loadedThemes.push({
        id: `seed-${theme.name.toLowerCase().replace(/\s+/g, "-")}`,
        name: theme.name,
        colors: theme.colors,
        url: theme.file,
        category: detectCategory(theme.colors),
        createdAt: "",
      });
    }
  }

  marketplaceThemes = loadedThemes;
  renderThemes();
}

async function hasDuplicatePalette(colors) {
  const paletteKey = JSON.stringify(colors.map(normalizeColor));
  const localMatch = marketplaceThemes.some((theme) => JSON.stringify((theme.colors || []).map(normalizeColor)) === paletteKey);

  if (localMatch) {
    return true;
  }

  if (!db || !firebaseFns) {
    return false;
  }

  const snapshot = await firebaseFns.getDocs(firebaseFns.collection(db, "themes"));
  return snapshot.docs.some((docSnapshot) => {
    const remoteColors = Array.isArray(docSnapshot.data().colors) ? docSnapshot.data().colors.map(normalizeColor).slice(0, 4) : [];
    return JSON.stringify(remoteColors) === paletteKey;
  });
}

async function processUploadFile(file) {
  if (Date.now() - lastUpload < 10000) {
    showToast("Wait before uploading again");
    return;
  }

  const validationMessage = validateFile(file);
  if (validationMessage) {
    showToast(validationMessage);
    return;
  }

  if (!firebaseReady || !db || !storage || !firebaseFns) {
    showToast("Uploads are unavailable until Firebase is configured");
    return;
  }

  const text = await file.text();
  const colors = extractColors(text);
  if (colors.length < 4) {
    showToast("Invalid QSS: not enough colors");
    return;
  }

  if (await hasDuplicatePalette(colors)) {
    showToast("Theme with same palette already exists");
    return;
  }

  const category = detectCategory(colors);
  const name = file.name.replace(/\.qss$/i, "");
  const theme = await uploadTheme(file, name);
  lastUpload = Date.now();

  marketplaceThemes.unshift({
    id: theme.id,
    name,
    colors,
    url: theme.fileUrl,
    category,
    userId: theme.userId,
    createdAt: Date.now(),
  });
  renderThemes();
  showToast("Upload successful");
}

function applyPreviewTheme(colors) {
  if (!themePreviewCanvas) {
    return;
  }

  const [base, surface, structure, accent] = colors;
  themePreviewCanvas.style.setProperty("--preview-base", base);
  themePreviewCanvas.style.setProperty("--preview-surface", surface);
  themePreviewCanvas.style.setProperty("--preview-structure", structure);
  themePreviewCanvas.style.setProperty("--preview-accent", accent);
}

function openThemePreview(theme) {
  if (!themePreviewModal || !themePreviewPalette || !themePreviewName || !themePreviewCategory || !themePreviewDownload || !themePreviewCanvas) {
    return;
  }

  activePreviewTheme = theme;
  themePreviewName.textContent = theme.name;
  themePreviewCategory.textContent = formatCategory(theme.category);
  themePreviewMeta.textContent = `${getThemeLikes(theme)} likes • ${formatCategory(theme.category)} theme`;
  themePreviewDownload.href = theme.url || theme.fileUrl || theme.file || "#";
  themePreviewDownload.setAttribute("download", "");
  themePreviewPalette.innerHTML = theme.colors
    .map((color) => `<button class="theme-preview-swatch" type="button" data-color="${color}" style="background:${color}" title="${color.toUpperCase()}"></button>`)
    .join("");
  applyPreviewTheme(theme.colors);
  themePreviewModal.classList.remove("is-hidden");
  document.body.classList.add("theme-preview-open");
}

function closeThemePreview() {
  if (!themePreviewModal) {
    return;
  }

  activePreviewTheme = null;
  themePreviewModal.classList.add("is-hidden");
  document.body.classList.remove("theme-preview-open");
}

async function deleteTheme(themeId) {
  const theme = marketplaceThemes.find((entry) => String(entry.id) === String(themeId));
  if (!theme || !canDeleteTheme(theme) || !firebaseReady || !db || !firebaseFns) {
    return;
  }

  try {
    await firebaseFns.deleteDoc(firebaseFns.doc(db, "themes", themeId));
    const fileUrl = theme.url || theme.fileUrl || "";
    if (fileUrl) {
      await firebaseFns.deleteObject(firebaseFns.ref(storage, fileUrl));
    }
    marketplaceThemes = marketplaceThemes.filter((entry) => String(entry.id) !== String(themeId));
    renderThemes();
    showToast("Theme deleted");
  } catch (_error) {
    showToast("Delete failed");
  }
}

async function likeTheme(themeId) {
  likeStore[themeId] = Number(likeStore[themeId] || 0) + 1;
  saveLikes();

  const theme = marketplaceThemes.find((entry) => themeKey(entry) === themeId);
  if (theme) {
    theme.likes = getThemeLikes(theme);
  }

  renderThemes();
  showToast("Saved to favorites");

  if (firebaseReady && db && firebaseFns) {
    const remoteTheme = marketplaceThemes.find((entry) => String(entry.id) === themeId);
    if (remoteTheme) {
      try {
        await firebaseFns.updateDoc(firebaseFns.doc(db, "themes", remoteTheme.id), {
          likes: firebaseFns.increment(1),
        });
      } catch (_error) {
        // keep local likes if remote update fails
      }
    }
  }
}

async function handleUpload(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  try {
    await processUploadFile(file);
  } catch (error) {
    console.error(error);
    showToast("Upload failed");
  } finally {
    if (fileInput) {
      fileInput.value = "";
    }
  }
}

uploadButton?.addEventListener("click", () => {
  fileInput?.click();
});
fileInput?.addEventListener("change", handleUpload);
marketplaceSearchInput?.addEventListener("input", () => {
  visibleThemeCount = 12;
  renderThemes();
});

document.addEventListener("dragover", (event) => {
  event.preventDefault();
  document.body.classList.add("is-dragging-theme");
});

document.addEventListener("dragleave", (event) => {
  if (event.relatedTarget) {
    return;
  }

  document.body.classList.remove("is-dragging-theme");
});

document.addEventListener("drop", async (event) => {
  event.preventDefault();
  document.body.classList.remove("is-dragging-theme");

  const file = event.dataTransfer?.files?.[0];
  if (!file) {
    return;
  }

  try {
    await processUploadFile(file);
  } catch (error) {
    console.error(error);
    showToast("Upload failed");
  }
});

marketplaceCategories.forEach((button) => {
  button.addEventListener("click", () => {
    activeCategory = button.dataset.category || "all";
    visibleThemeCount = 12;
    marketplaceCategories.forEach((item) => {
      item.classList.toggle("active", item === button);
    });
    renderThemes();
  });
});

marketplaceSortTabs.forEach((button) => {
  button.addEventListener("click", () => {
    currentSort = button.dataset.sort || "new";
    visibleThemeCount = 12;
    marketplaceSortTabs.forEach((item) => {
      item.classList.toggle("active", item === button);
    });
    renderThemes();
  });
});

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  if (target.dataset.closePreview === "true" || target === themePreviewClose) {
    closeThemePreview();
    return;
  }

  if (target.classList.contains("color-block")) {
    const color = target.dataset.color;
    if (!color) {
      return;
    }

    navigator.clipboard.writeText(color).catch(() => {});
    target.classList.add("is-copied");
    showToast(`${color.toUpperCase()} copied`);
    window.setTimeout(() => {
      target.classList.remove("is-copied");
    }, 220);
    return;
  }

  if (target.classList.contains("theme-preview-swatch")) {
    const color = target.dataset.color;
    if (!color) {
      return;
    }

    navigator.clipboard.writeText(color).catch(() => {});
    showToast(`${color.toUpperCase()} copied`);
    return;
  }

  if (target === themePreviewCopy) {
    if (!activePreviewTheme?.colors?.length) {
      return;
    }

    navigator.clipboard.writeText(activePreviewTheme.colors.join(", ")).catch(() => {});
    showToast("Palette copied");
    return;
  }

  if (target.classList.contains("theme-like-btn")) {
    const themeId = target.dataset.likeId;
    if (!themeId) {
      return;
    }

    likeTheme(themeId).catch(() => {});
    return;
  }

  if (target.classList.contains("theme-delete-btn")) {
    const themeId = target.dataset.deleteId;
    if (!themeId) {
      return;
    }

    deleteTheme(themeId).catch(() => {});
    return;
  }

  if (target.classList.contains("marketplace-download-btn")) {
    const url = target.dataset.downloadUrl;
    if (!url) {
      showToast("Theme file unavailable");
      return;
    }

    window.open(url, "_self");
    return;
  }

  const card = target.closest(".theme-card");
  if (card) {
    const colors = JSON.parse(card.dataset.previewColors || "[]");
    if (Array.isArray(colors) && colors.length === 4) {
      openThemePreview({
        id: card.dataset.likeId || "",
        name: card.dataset.previewName || "Theme",
        category: card.dataset.previewCategory || card.dataset.category || "Theme",
        url: card.dataset.previewUrl || "",
        colors,
        likes:
          Number(
            card.querySelector(".theme-like-count")?.textContent?.replace(/[^0-9]/g, "") || 0
          ) || 0,
      });
    }
  }
});

window.addEventListener("resize", () => {
  resizeCanvas();
  createParticles();
});

window.addEventListener("mousemove", (event) => {
  mouse.x = event.clientX;
  mouse.y = event.clientY;
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeThemePreview();
  }
});

window.addEventListener("scroll", () => {
  if (isLoadingBatch) {
    return;
  }

  const threshold = document.documentElement.scrollHeight - window.innerHeight - 180;
  if (window.scrollY < threshold) {
    return;
  }

  const queryText = (marketplaceSearchInput?.value || "").trim().toLowerCase();
  const availableCount = sortThemes(
    marketplaceThemes.filter((theme) => {
      const matchesQuery = !queryText || theme.name.toLowerCase().includes(queryText);
      const matchesCategory = activeCategory === "all" || themeCategories(theme).includes(activeCategory);
      return matchesQuery && matchesCategory;
    })
  ).length;

  if (visibleThemeCount >= availableCount) {
    return;
  }

  isLoadingBatch = true;
  window.setTimeout(() => {
    visibleThemeCount += 12;
    renderThemes();
    isLoadingBatch = false;
  }, 160);
});

window.addEventListener("DOMContentLoaded", () => {
  renderSkeletons();
  resizeCanvas();
  createParticles();
  drawParticles();
  if (!firebaseReady && uploadButton) {
    uploadButton.dataset.uploadState = "disabled";
    uploadButton.title = "Add Firebase config to enable public uploads";
  }
  marketplaceThemes = bootstrapThemesFromMarkup();
  renderThemes();
  loadSeedThemes().then(() => loadThemes());
  authReady.then(() => {
    renderThemes();
  });
});
