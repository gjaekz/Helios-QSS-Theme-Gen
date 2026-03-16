"""
Helios II — QSS Theme Generator  v4.0
====================================
Full theme designer with:
  • Real Qt widget live preview (actual QDockWidget, QTabWidget, etc.)
  • Palette Image Extractor — upload any palette/artwork image and
    auto-generate a complete Helios theme from its dominant colors
    (pure K-means clustering implemented with PyQt5 — no PIL/sklearn needed)

Requirements:
    pip install PyQt5

Build to .exe:
    pip install pyinstaller
    pyinstaller --onefile --windowed --name "HeliosThemeGenerator" helios_theme_builder.py
"""

import sys, os, json, re, math, random
from pathlib import Path

# ══════════════════════════════════════════════════════════════════════════════
#  ASSET PATH RESOLVER  — works in dev (.py) and packaged (.exe via PyInstaller)
# ══════════════════════════════════════════════════════════════════════════════
APP_VERSION = "1.0.0"

def _asset(relative: str) -> str:
    """
    Resolve an asset path that works both when running from source and when
    bundled by PyInstaller (--onefile / --onedir).
    PyInstaller extracts data files to sys._MEIPASS at runtime.
    """
    if hasattr(sys, "_MEIPASS"):
        base = Path(sys._MEIPASS)
    else:
        base = Path(__file__).parent
    return str(base / relative)

def _logo_pixmap(height: int = 40) -> "QPixmap":
    """Load the Theme Gen logo scaled to *height* px, keeping aspect ratio."""
    path = _asset("assets/logo/Theme_Gen_Logo.png")
    pix  = QPixmap(path)
    if pix.isNull():
        # Fallback: draw a simple hex shape in brand colours
        pix = QPixmap(height, height)
        pix.fill(Qt.transparent)
    else:
        pix = pix.scaledToHeight(height, Qt.SmoothTransformation)
    return pix
from PyQt5.QtWidgets import *
from PyQt5.QtCore import *
from PyQt5.QtGui import *
from PyQt5.QtGui import QDesktopServices
from PyQt5.QtCore import QUrl

# ══════════════════════════════════════════════════════════════════════════════
#  PURE-PYTHON K-MEANS COLOR EXTRACTOR  (no external dependencies)
# ══════════════════════════════════════════════════════════════════════════════

def _hex(r, g, b):
    return "#{:02X}{:02X}{:02X}".format(int(r), int(g), int(b))

def _luminance(r, g, b):
    return 0.299*r + 0.587*g + 0.114*b

def _color_distance(a, b):
    return math.sqrt(sum((a[i]-b[i])**2 for i in range(3)))

def _is_near_white(r, g, b, thresh=230):
    return r > thresh and g > thresh and b > thresh

def _is_near_black(r, g, b, thresh=25):
    return r < thresh and g < thresh and b < thresh

def sample_pixels_from_qimage(qimage: QImage, max_samples: int = 2000):
    """
    Convert a QImage to a list of (R,G,B) tuples, sampling evenly,
    skipping near-white, near-black, and very-grey pixels.
    """
    img = qimage.convertToFormat(QImage.Format_RGB32)
    w, h = img.width(), img.height()
    total = w * h
    step = max(1, total // max_samples)

    pixels = []
    for i in range(0, total, step):
        x = i % w
        y = i // w
        rgb = img.pixel(x, y)
        r = (rgb >> 16) & 0xFF
        g = (rgb >>  8) & 0xFF
        b =  rgb        & 0xFF
        if _is_near_white(r, g, b): continue
        if _is_near_black(r, g, b): continue
        # skip very desaturated (grey-ish) unless it's a clearly dominant tone
        max_c = max(r, g, b); min_c = min(r, g, b)
        if max_c - min_c < 18: continue
        pixels.append((r, g, b))

    return pixels

def kmeans_colors(pixels, k: int = 5, iterations: int = 12):
    """
    K-means clustering in RGB space.
    Returns k cluster centroids as (R,G,B) tuples, sorted darkest→lightest.
    """
    if len(pixels) < k:
        return pixels + [(128, 128, 128)] * (k - len(pixels))

    # KMeans++ initialisation for better spread
    rng = random.Random(42)
    centroids = [rng.choice(pixels)]
    for _ in range(k - 1):
        dists = [min(_color_distance(p, c)**2 for c in centroids) for p in pixels]
        total = sum(dists)
        r_val = rng.random() * total
        cumul = 0.0
        chosen = pixels[-1]
        for p, d in zip(pixels, dists):
            cumul += d
            if cumul >= r_val:
                chosen = p
                break
        centroids.append(chosen)

    for _ in range(iterations):
        clusters = [[] for _ in range(k)]
        for p in pixels:
            idx = min(range(k), key=lambda i: _color_distance(p, centroids[i]))
            clusters[idx].append(p)
        new_centroids = []
        for i, cluster in enumerate(clusters):
            if cluster:
                avg = tuple(sum(ch[j] for ch in cluster) / len(cluster) for j in range(3))
                new_centroids.append(avg)
            else:
                new_centroids.append(centroids[i])
        if all(_color_distance(new_centroids[i], centroids[i]) < 1.0 for i in range(k)):
            break
        centroids = new_centroids

    # Sort by luminance (darkest first so index 0 = background candidate)
    centroids.sort(key=lambda c: _luminance(*c))
    return [tuple(int(v) for v in c) for c in centroids]

def extract_palette(qimage: QImage, n_colors: int = 5):
    """
    Extract n_colors dominant colors from a QImage.
    Returns list of hex strings like ["#1A2B3C", ...].
    """
    pixels = sample_pixels_from_qimage(qimage)
    if not pixels:
        # Fallback: sample without filters
        img = qimage.convertToFormat(QImage.Format_RGB32)
        w, h = img.width(), img.height()
        total = w * h
        step = max(1, total // 1000)
        pixels = []
        for i in range(0, total, step):
            x = i % w; y = i // w
            rgb = img.pixel(x, y)
            pixels.append(((rgb >> 16) & 0xFF, (rgb >> 8) & 0xFF, rgb & 0xFF))

    colors = kmeans_colors(pixels, k=n_colors)
    return [_hex(*c) for c in colors]

def assign_palette_to_theme(hex_colors: list, theme_name: str = "PaletteTheme") -> dict:
    """
    Intelligently map extracted palette colors to Helios theme keys.
    Sorted darkest→lightest, so:
      [0] = darkest  → background
      [1] = dark     → panel bg
      [2] = mid      → accent / border
      [3] = bright   → accent2 / button hover
      [4] = lightest → text / glow
    For light palettes (avg luminance > 160) the logic is inverted.
    """
    n = len(hex_colors)
    while len(hex_colors) < 5:
        hex_colors.append(hex_colors[-1])

    lums = [_luminance(*tuple(int(hex_colors[i][j:j+2], 16) for j in (1,3,5)))
            for i in range(5)]
    avg_lum = sum(lums) / len(lums)
    is_light = avg_lum > 155

    def lighten(hex_c, amount=40):
        c = QColor(hex_c)
        r = min(255, c.red()   + amount)
        g = min(255, c.green() + amount)
        b = min(255, c.blue()  + amount)
        return _hex(r, g, b)

    def darken(hex_c, amount=40):
        c = QColor(hex_c)
        r = max(0, c.red()   - amount)
        g = max(0, c.green() - amount)
        b = max(0, c.blue()  - amount)
        return _hex(r, g, b)

    def contrast_text(hex_c):
        c = QColor(hex_c)
        lum = _luminance(c.red(), c.green(), c.blue())
        return "#F8F8F8" if lum < 128 else "#1A1A1A"

    if is_light:
        # Light palette: flip so lightest = bg
        bg        = hex_colors[4]
        panel_bg  = hex_colors[3]
        accent    = hex_colors[1]
        accent2   = hex_colors[2]
        glow      = hex_colors[0]
        text_col  = darken(hex_colors[0], 20)
    else:
        bg        = hex_colors[0]
        panel_bg  = hex_colors[1]
        accent    = hex_colors[3]
        accent2   = hex_colors[2]
        glow      = hex_colors[4]
        text_col  = lighten(hex_colors[4], 20)

    border      = darken(panel_bg, 10) if not is_light else lighten(panel_bg, -20)
    btn_bg      = lighten(panel_bg, 8) if not is_light else darken(panel_bg, 8)
    input_bg    = darken(bg, 5)        if not is_light else lighten(bg, -5)
    warning_c   = "#FF6B35"
    tab_bg      = panel_bg
    dropdown_bg = panel_bg
    scrollbar_c = accent
    scroll_hov  = glow

    t = DEFAULT.copy()
    t.update({
        "theme_name":     theme_name,
        "bg":             bg,
        "panel_bg":       panel_bg,
        "panel_border":   accent,
        "accent":         accent,
        "accent2":        accent2,
        "glow":           glow,
        "warning":        warning_c,
        "text":           text_col,
        "border":         border,
        "btn_bg":         btn_bg,
        "btn_hover":      accent,
        "btn_text":       contrast_text(accent),
        "btn_border":     accent,
        "tab_bg":         tab_bg,
        "tab_active":     glow,
        "tab_text":       text_col,
        "input_bg":       input_bg,
        "input_text":     glow,
        "dropdown_bg":    dropdown_bg,
        "scrollbar":      scrollbar_c,
        "scrollbar_hover":scroll_hov,
        "panel_opacity":  100,
        "panel_radius":   5,
        "bg_image":       "",
        "bg_opacity":     100,
        "glass":          False,
    })
    return t


# ══════════════════════════════════════════════════════════════════════════════
#  PRESETS
# ══════════════════════════════════════════════════════════════════════════════
PRESETS = {
    "Default (Helios Dark)": {
        "theme_name":"HeliosDark","bg":"#2F3237","panel_bg":"#3A3E44","panel_opacity":100,
        "panel_border":"#4A4F55","panel_radius":4,"accent":"#2CC5D9","accent2":"#1FA7B8",
        "glow":"#2CC5D9","warning":"#E8572A","text":"#E6E6E6","border":"#5A5F66",
        "btn_bg":"#3A3E44","btn_hover":"#4A4F55","btn_text":"#E6E6E6","btn_border":"#5A5F66",
        "tab_bg":"#34383D","tab_active":"#2CC5D9","tab_text":"#B5B5B5",
        "input_bg":"#1E2125","input_text":"#E6E6E6","dropdown_bg":"#3A3E44",
        "scrollbar":"#4A4F55","scrollbar_hover":"#2CC5D9",
        "bg_image":"","bg_opacity":100,"glass":False,
    },
    "Electropop": {
        "theme_name":"Electropop","bg":"#0D0D0D","panel_bg":"#151515","panel_opacity":100,
        "panel_border":"#5200FF","panel_radius":4,"accent":"#5200FF","accent2":"#F900FF",
        "glow":"#CCFF00","warning":"#FF6B00","text":"#F0F0F0","border":"#222222",
        "btn_bg":"#1E1E1E","btn_hover":"#5200FF","btn_text":"#F0F0F0","btn_border":"#5200FF",
        "tab_bg":"#151515","tab_active":"#CCFF00","tab_text":"#F0F0F0",
        "input_bg":"#080808","input_text":"#CCFF00","dropdown_bg":"#151515",
        "scrollbar":"#5200FF","scrollbar_hover":"#CCFF00",
        "bg_image":"","bg_opacity":100,"glass":False,
    },
    "Dark Carbon": {
        "theme_name":"DarkCarbon","bg":"#111111","panel_bg":"#1C1C1C","panel_opacity":100,
        "panel_border":"#2C2C2C","panel_radius":6,"accent":"#00BCD4","accent2":"#7C4DFF",
        "glow":"#00BCD4","warning":"#FF5252","text":"#E8E8E8","border":"#2C2C2C",
        "btn_bg":"#252525","btn_hover":"#00BCD4","btn_text":"#E8E8E8","btn_border":"#333333",
        "tab_bg":"#1C1C1C","tab_active":"#00BCD4","tab_text":"#AAAAAA",
        "input_bg":"#0A0A0A","input_text":"#E8E8E8","dropdown_bg":"#1C1C1C",
        "scrollbar":"#2C2C2C","scrollbar_hover":"#00BCD4",
        "bg_image":"","bg_opacity":100,"glass":False,
    },
    "Neon": {
        "theme_name":"Neon","bg":"#000000","panel_bg":"#050505","panel_opacity":92,
        "panel_border":"#00FF41","panel_radius":3,"accent":"#00FF41","accent2":"#FF00FF",
        "glow":"#00FF41","warning":"#FF4500","text":"#00FF41","border":"#003300",
        "btn_bg":"#0A0A0A","btn_hover":"#003300","btn_text":"#00FF41","btn_border":"#00FF41",
        "tab_bg":"#050505","tab_active":"#00FF41","tab_text":"#AAAAAA",
        "input_bg":"#030303","input_text":"#00FF41","dropdown_bg":"#0A0A0A",
        "scrollbar":"#003300","scrollbar_hover":"#00FF41",
        "bg_image":"","bg_opacity":100,"glass":False,
    },
    "Glass Ocean": {
        "theme_name":"GlassOcean","bg":"#0A1628","panel_bg":"#162840","panel_opacity":78,
        "panel_border":"#4FC3F7","panel_radius":10,"accent":"#4FC3F7","accent2":"#B39DDB",
        "glow":"#4FC3F7","warning":"#FFB74D","text":"#E1F5FE","border":"#1E3A5F",
        "btn_bg":"#1A3A5C","btn_hover":"#4FC3F7","btn_text":"#E1F5FE","btn_border":"#4FC3F7",
        "tab_bg":"#162840","tab_active":"#4FC3F7","tab_text":"#90CAF9",
        "input_bg":"#0D1F33","input_text":"#E1F5FE","dropdown_bg":"#162840",
        "scrollbar":"#1A3A5C","scrollbar_hover":"#4FC3F7",
        "bg_image":"","bg_opacity":100,"glass":True,
    },
    "Minimal Light": {
        "theme_name":"MinimalLight","bg":"#F5F5F7","panel_bg":"#FFFFFF","panel_opacity":100,
        "panel_border":"#E0E0E0","panel_radius":8,"accent":"#1A1A2E","accent2":"#4A4A8A",
        "glow":"#4A4A8A","warning":"#E53935","text":"#1A1A2E","border":"#E0E0E0",
        "btn_bg":"#EFEFEF","btn_hover":"#1A1A2E","btn_text":"#1A1A2E","btn_border":"#CCCCCC",
        "tab_bg":"#F0F0F0","tab_active":"#1A1A2E","tab_text":"#666666",
        "input_bg":"#FFFFFF","input_text":"#1A1A2E","dropdown_bg":"#FFFFFF",
        "scrollbar":"#CCCCCC","scrollbar_hover":"#999999",
        "bg_image":"","bg_opacity":100,"glass":False,
    },
}
DEFAULT = PRESETS["Default (Helios Dark)"].copy()


# ══════════════════════════════════════════════════════════════════════════════
#  QSS GENERATOR
# ══════════════════════════════════════════════════════════════════════════════
def rgba(hex_color: str, pct: int) -> str:
    c = QColor(hex_color)
    a = int(pct * 2.55)
    return f"rgba({c.red()}, {c.green()}, {c.blue()}, {a})"

def generate_qss(t: dict) -> str:
    r = int(t.get("panel_radius", 4))
    name = t.get("theme_name", "Custom")
    bg_block = ""
    if t.get("bg_image"):
        op = t.get("bg_opacity", 100) / 100
        bg_block = f'\nQMainWindow > QWidget {{ background-image: url("{t["bg_image"]}"); background-repeat: no-repeat; background-position: center; opacity: {op:.2f}; }}'
    glass_block = ""
    if t.get("glass"):
        glass_block = f"\nQDockWidget, QGroupBox {{ background-color: {rgba(t['panel_bg'], min(int(t['panel_opacity']*0.85), 100))}; }}"

    return f"""/* ═══════════════════════════════════════════════════════════
   {name} — Helios II Theme  (Helios Theme Generator v4)
   ═══════════════════════════════════════════════════════════
   Background : {t['bg']}   Panel : {t['panel_bg']}
   Accent     : {t['accent']}   Glow  : {t['glow']}
   ──────────────────────────────────────────────────────── */

QWidget {{ background-color:{t['bg']}; color:{t['text']};
    font-family:"Segoe UI","Roboto","Helvetica Neue",sans-serif; font-size:9pt;
    selection-background-color:{t['accent']}; selection-color:{t['glow']}; }}
QWidget:disabled {{ color:{rgba(t['text'],35)}; }}
QWidget:focus {{ outline:none; }}
{bg_block}

QMainWindow {{ background-color:{t['bg']}; }}
QMainWindow::separator {{ background:{t['accent']}; width:3px; height:3px; }}
QMainWindow::separator:hover {{ background:{t['glow']}; }}
QSplitter::handle {{ background-color:{t['border']}; }}
QSplitter::handle:hover {{ background-color:{t['glow']}; }}

QDockWidget {{ background-color:{rgba(t['panel_bg'],t['panel_opacity'])}; border:2px solid {t['panel_border']}; }}
QDockWidget::title {{ background:qlineargradient(x1:0,y1:0,x2:1,y2:0,stop:0 {rgba(t['accent'],30)},stop:1 {rgba(t['accent'],10)});
    color:{t['glow']}; padding:6px 8px; font-weight:bold; border-bottom:2px solid {t['glow']}; text-align:left; }}
QDockWidget::close-button,QDockWidget::float-button {{ background:{rgba(t['glow'],12)}; border-radius:3px; padding:2px; }}
QDockWidget::close-button:hover,QDockWidget::float-button:hover {{ background:{t['accent2']}; }}
{glass_block}

QMenuBar {{ background-color:{t['panel_bg']}; padding:2px; border-bottom:2px solid {t['glow']}; }}
QMenuBar::item {{ padding:4px 12px; background:transparent; color:{t['text']}; }}
QMenuBar::item:selected {{ background-color:{t['accent']}; color:{t['glow']}; }}
QMenu {{ background-color:{t['panel_bg']}; border:2px solid {t['glow']}; border-radius:{r}px; padding:4px; }}
QMenu::item {{ padding:6px 24px; border-radius:{max(0,r-1)}px; color:{t['text']}; }}
QMenu::item:selected {{ background-color:{t['accent']}; color:{t['glow']}; }}
QMenu::separator {{ height:1px; background:{t['border']}; margin:4px 8px; }}

QToolBar {{ background-color:{t['panel_bg']}; border:none; border-bottom:2px solid {t['accent2']}; padding:3px; spacing:3px; }}
QToolBar::separator {{ width:1px; background:{t['border']}; margin:4px 3px; }}
QToolButton {{ background-color:transparent; border:1px solid transparent; border-radius:{r}px; padding:6px 8px; color:{t['text']}; }}
QToolButton:hover {{ background-color:{rgba(t['accent'],25)}; border:1px solid {t['glow']}; color:{t['glow']}; }}
QToolButton:pressed {{ background-color:{rgba(t['accent'],40)}; color:{t['warning']}; }}
QToolButton:checked {{ background-color:{t['glow']}; border:2px solid {t['accent']}; color:{t['bg']}; }}

QPushButton {{ background:qlineargradient(x1:0,y1:0,x2:0,y2:1,stop:0 {t['btn_bg']},stop:1 {rgba(t['btn_bg'],80)});
    color:{t['btn_text']}; border:2px solid {t['btn_border']}; border-radius:{r}px;
    padding:5px 14px; font-weight:bold; min-height:22px; }}
QPushButton:hover {{ background:qlineargradient(x1:0,y1:0,x2:0,y2:1,stop:0 {t['btn_hover']},stop:1 {rgba(t['btn_hover'],70)});
    color:{t['glow']}; border-color:{t['glow']}; }}
QPushButton:pressed {{ background-color:{t['glow']}; color:{t['bg']}; border-color:{t['accent']}; }}
QPushButton:checked {{ background-color:{t['glow']}; color:{t['bg']}; border:2px solid {t['accent']}; }}
QPushButton:default {{ background-color:{t['accent']}; color:{t['glow']}; border:2px solid {t['glow']}; }}
QPushButton:default:hover {{ background-color:{t['glow']}; color:{t['bg']}; }}
QPushButton:disabled {{ background:{rgba(t['btn_bg'],50)}; color:{rgba(t['btn_text'],40)}; border-color:{rgba(t['btn_border'],40)}; }}

QLineEdit,QSpinBox,QDoubleSpinBox,QTextEdit,QPlainTextEdit {{
    background-color:{t['input_bg']}; border:2px solid {t['border']}; border-radius:{r}px;
    padding:3px 6px; color:{t['input_text']};
    selection-background-color:{t['accent']}; selection-color:{t['glow']}; min-height:18px; }}
QTextEdit[objectName="outputLog"] {{ background-color:{t['input_bg']}; color:{t['text']}; border:2px solid {t['accent2']}; }}
QLineEdit:focus,QSpinBox:focus,QDoubleSpinBox:focus,QTextEdit:focus,QPlainTextEdit:focus {{
    border:2px solid {t['accent2']}; }}
QLineEdit:hover,QSpinBox:hover,QDoubleSpinBox:hover {{ border-color:{rgba(t['accent'],70)}; }}
QSpinBox::up-button,QDoubleSpinBox::up-button,QSpinBox::down-button,QDoubleSpinBox::down-button {{
    background-color:transparent; border:none; width:16px; }}
QSpinBox::up-button:hover,QDoubleSpinBox::up-button:hover,
QSpinBox::down-button:hover,QDoubleSpinBox::down-button:hover {{ background-color:{t['accent']}; }}

QComboBox {{ background-color:{t['dropdown_bg']}; border:2px solid {t['border']};
    border-radius:{r}px; padding:4px 7px; color:{t['input_text']}; min-height:18px; }}
QComboBox:hover {{ border-color:{t['accent2']}; }}
QComboBox:focus {{ border-color:{t['accent']}; }}
QComboBox::drop-down {{ border:none; width:20px; background:transparent; }}
QComboBox QAbstractItemView {{ background-color:{t['panel_bg']}; border:2px solid {t['glow']};
    selection-background-color:{t['accent']}; selection-color:{t['glow']};
    outline:none; padding:4px; color:{t['input_text']}; }}

QListView,QTreeView,QTableView {{ background-color:{t['input_bg']}; border:2px solid {t['border']};
    border-radius:{r}px; outline:none; color:{t['text']}; alternate-background-color:{rgba(t['bg'],100)}; }}
QListView::item,QTreeView::item {{ padding:4px 5px; border:none; }}
QListView::item:hover,QTreeView::item:hover {{ background-color:{rgba(t['accent'],20)}; color:{t['glow']}; }}
QListView::item:selected,QTreeView::item:selected {{
    background-color:{rgba(t['glow'],12)}; color:{t['glow']}; border-left:3px solid {t['glow']}; }}
QHeaderView::section {{ background-color:{rgba(t['accent'],22)}; color:{t['glow']};
    border:none; border-bottom:2px solid {t['glow']}; padding:4px 8px; font-weight:bold; }}

QScrollBar:vertical {{ background:{t['bg']}; width:12px; margin:0; }}
QScrollBar::handle:vertical {{ background:{t['scrollbar']}; min-height:20px; border-radius:5px; margin:2px; border:1px solid {t['accent2']}; }}
QScrollBar::handle:vertical:hover {{ background:{t['scrollbar_hover']}; border:1px solid {t['accent']}; }}
QScrollBar:horizontal {{ background:{t['bg']}; height:12px; margin:0; }}
QScrollBar::handle:horizontal {{ background:{t['scrollbar']}; min-width:20px; border-radius:5px; margin:2px; border:1px solid {t['accent2']}; }}
QScrollBar::handle:horizontal:hover {{ background:{t['scrollbar_hover']}; border:1px solid {t['accent']}; }}
QScrollBar::add-line,QScrollBar::sub-line {{ width:0; height:0; }}
QScrollBar::corner {{ background:transparent; }}

QTabWidget::pane {{ border:2px solid {t['accent']}; border-top:none; background-color:{t['bg']}; }}
QTabWidget::tab-bar {{ alignment:left; }}
QTabBar::tab {{ background-color:{t['tab_bg']}; color:{t['tab_text']}; border:1px solid {t['border']};
    border-bottom:none; padding:7px 13px; margin-right:2px; border-radius:{r}px {r}px 0 0; }}
QTabBar::tab:hover {{ background-color:{rgba(t['accent'],28)}; color:{t['glow']}; border-color:{t['accent']}; }}
QTabBar::tab:selected {{ background-color:{rgba(t['tab_active'],14)}; color:{t['tab_active']};
    font-weight:bold; border-color:{t['tab_active']}; border-top:2px solid {t['tab_active']}; }}

QGroupBox {{ border:2px solid {t['accent']}; border-radius:{r}px; margin-top:22px; padding:4px; font-weight:bold; }}
QGroupBox::title {{ subcontrol-origin:margin; subcontrol-position:top left;
    padding:0 5px; background:transparent; color:{t['glow']}; }}

QCheckBox {{ spacing:6px; color:{t['text']}; }}
QCheckBox::indicator {{ width:14px; height:14px; background:{t['input_bg']};
    border:2px solid {t['accent']}; border-radius:3px; }}
QCheckBox::indicator:hover {{ border-color:{t['glow']}; }}
QCheckBox::indicator:checked {{ background-color:{t['glow']}; border-color:{t['glow']}; }}

QRadioButton {{ spacing:6px; color:{t['text']}; }}
QRadioButton::indicator {{ width:14px; height:14px; background:{t['input_bg']};
    border:2px solid {t['accent']}; border-radius:7px; }}
QRadioButton::indicator:hover {{ border-color:{t['accent2']}; }}
QRadioButton::indicator:checked {{ background-color:{t['accent2']}; border-color:{t['accent2']}; }}

QSlider::groove:horizontal {{ height:4px; background:{t['border']}; border-radius:2px; }}
QSlider::handle:horizontal {{ background:{t['accent']}; border:2px solid {t['glow']};
    width:14px; height:14px; margin:-5px 0; border-radius:7px; }}
QSlider::sub-page:horizontal {{ background:{t['accent']}; border-radius:2px; }}

QProgressBar {{ background-color:{t['input_bg']}; border:1px solid {t['border']};
    border-radius:{r}px; text-align:center; color:{t['text']}; height:10px; }}
QProgressBar::chunk {{ background:qlineargradient(x1:0,y1:0,x2:1,y2:0,stop:0 {t['accent']},stop:1 {t['glow']});
    border-radius:{r}px; }}

QStatusBar {{ background-color:{rgba(t['accent'],20)}; color:{t['glow']}; border-top:2px solid {t['accent']}; }}
QStatusBar::item {{ border:none; }}

QToolTip {{ background-color:{t['panel_bg']}; color:{t['glow']}; border:1px solid {t['accent']};
    padding:4px 8px; border-radius:{r}px; font-size:9pt; }}

QLabel[status="active"] {{ color:{t['glow']}; font-weight:bold; }}
QLabel[status="error"]  {{ color:{t['warning']}; font-weight:bold; }}
QLabel[status="info"]   {{ color:{rgba(t['text'],50)}; font-size:9px; }}
"""


# ══════════════════════════════════════════════════════════════════════════════
#  REAL HELIOS PREVIEW WINDOW
# ══════════════════════════════════════════════════════════════════════════════
class HeliosPreviewWindow(QMainWindow):
    def __init__(self, parent=None):
        super().__init__(parent)
        self._build()

    # ── tiny helper ──────────────────────────────────────────────────────────
    @staticmethod
    def _section_label(text):
        """Thin coloured section-header label exactly like Helios group headers."""
        lbl = QLabel(text)
        lbl.setStyleSheet(
            "font-size:9pt; font-weight:bold; padding:1px 4px; "
            "border-left:3px solid palette(highlight);"
        )
        return lbl

    def _build(self):
        # ── Menu bar: File | View | Plugins | Tools | Help ────────────────
        mb = self.menuBar()
        mb.setNativeMenuBar(False)
        for name, items in [
            ("File",    ["New Session","Open…","Save","Save As…","---","Exit"]),
            ("View",    ["Video Display","Device Monitor","---","Online Resources"]),
            ("Plugins", ["Plugin Manager","Reload Plugins","---","Plugin Settings"]),
            ("Tools",   ["Preferences","Style Editor","---","Diagnostics"]),
            ("Help",    ["Documentation","Check for Updates","---","About Helios II"]),
        ]:
            menu = mb.addMenu(name)
            for item in items:
                if item == "---": menu.addSeparator()
                else: menu.addAction(item)

        # ── Thin top status bar (below menu, above docks) ─────────────────
        # Helios has a slim info strip: ● Server online | Logged in as wggja | Welcome to Helios II
        top_bar = QWidget()
        top_bar.setFixedHeight(22)
        top_bar.setObjectName("heliosTopBar")
        tb_layout = QHBoxLayout(top_bar)
        tb_layout.setContentsMargins(6, 0, 6, 0)
        tb_layout.setSpacing(0)

        def status_item(dot_color, text):
            w = QWidget(); h = QHBoxLayout(w); h.setContentsMargins(0,0,8,0); h.setSpacing(4)
            dot = QLabel("●"); dot.setStyleSheet(f"color:{dot_color}; font-size:9px;")
            lbl = QLabel(text); lbl.setStyleSheet("font-size:9pt;")
            h.addWidget(dot); h.addWidget(lbl)
            return w

        tb_layout.addWidget(status_item("#00CC44", "Server online"))
        sep1 = QFrame(); sep1.setFrameShape(QFrame.VLine)
        sep1.setStyleSheet("color: palette(mid);"); tb_layout.addWidget(sep1)
        tb_layout.addWidget(status_item("#AAAAAA", " Logged in as User"))
        sep2 = QFrame(); sep2.setFrameShape(QFrame.VLine)
        sep2.setStyleSheet("color: palette(mid);"); tb_layout.addWidget(sep2)
        tb_layout.addWidget(status_item("#AAAAAA", " Welcome to Helios II"))
        tb_layout.addStretch()

        # Wrap menu + top_bar in a container that becomes the "north" widget
        north = QWidget()
        north_layout = QVBoxLayout(north)
        north_layout.setContentsMargins(0,0,0,0)
        north_layout.setSpacing(0)
        north_layout.addWidget(top_bar)

        # We attach the top bar as a toolbar so it sits just below the menu
        top_tb = self.addToolBar("StatusBar")
        top_tb.setMovable(False)
        top_tb.setFloatable(False)
        top_tb.addWidget(top_bar)
        top_tb.setStyleSheet("QToolBar { border:none; padding:0; spacing:0; }")

        # ── Central area: tab bar + video display + output panel ──────────
        central = QWidget()
        self.setCentralWidget(central)
        c_vbox = QVBoxLayout(central)
        c_vbox.setContentsMargins(0, 0, 0, 0)
        c_vbox.setSpacing(0)

        # Tab bar: Video Display | Device Monitor | Online Resources
        center_tabs = QTabWidget()
        center_tabs.setDocumentMode(True)

        # ── Tab 1: Video Display ──────────────────────────────────────────
        vid_tab = QWidget()
        vt_layout = QVBoxLayout(vid_tab)
        vt_layout.setContentsMargins(0, 0, 0, 0)
        vt_layout.setSpacing(0)

        # Top info strip (Processing: 0 FPS | Display: 0 FPS)
        vid_info = QWidget(); vid_info.setFixedHeight(24)
        vi_layout = QHBoxLayout(vid_info)
        vi_layout.setContentsMargins(6, 0, 6, 0)
        vi_layout.addStretch()
        vi_layout.addWidget(QLabel("Processing: 0 FPS"))
        sep_vi = QFrame(); sep_vi.setFrameShape(QFrame.VLine); vi_layout.addWidget(sep_vi)
        vi_layout.addWidget(QLabel("Display: 0 FPS"))
        vt_layout.addWidget(vid_info)

        # Main black video canvas
        vid_canvas = QFrame()
        vid_canvas.setObjectName("videoCanvas")
        vid_canvas.setStyleSheet("QFrame#videoCanvas { background: #000000; }")
        vid_canvas.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        canvas_layout = QVBoxLayout(vid_canvas)
        canvas_layout.setAlignment(Qt.AlignCenter)
        no_signal = QLabel("Video Display")
        no_signal.setAlignment(Qt.AlignCenter)
        no_signal.setStyleSheet("color:#333333; font-size:11pt;")
        canvas_layout.addWidget(no_signal)
        vt_layout.addWidget(vid_canvas, 1)

        center_tabs.addTab(vid_tab, "Video Display")

        # ── Tab 2: Device Monitor ─────────────────────────────────────────
        dev_tab = QWidget()
        dt_layout = QVBoxLayout(dev_tab)
        dt_layout.setContentsMargins(8, 8, 8, 8)
        dt_layout.setSpacing(6)
        dt_layout.addWidget(QLabel("Device Monitor"))
        dev_table = QTableWidget(4, 3)
        dev_table.setHorizontalHeaderLabels(["Device", "Status", "FPS"])
        dev_table.setAlternatingRowColors(True)
        dev_table.horizontalHeader().setStretchLastSection(True)
        for ri, (dev, st, fps) in enumerate([
            ("Game Capture HD60 S", "Active", "60"),
            ("Titan Two Device 1",  "Bridge Active", "—"),
            ("USB IN A",            "Disconnected", "—"),
            ("USB IN B",            "Disconnected", "—"),
        ]):
            for ci, txt in enumerate([dev, st, fps]):
                dev_table.setItem(ri, ci, QTableWidgetItem(txt))
        dt_layout.addWidget(dev_table)
        center_tabs.addTab(dev_tab, "Device Monitor")

        # ── Tab 3: Online Resources ───────────────────────────────────────
        res_tab = QWidget()
        rt_layout = QVBoxLayout(res_tab)
        rt_layout.setContentsMargins(8, 8, 8, 8)
        rt_layout.setSpacing(6)
        rt_layout.addWidget(QLabel("Online Resources"))
        res_list = QListWidget()
        res_list.addItems([
            "Helios II Documentation",
            "Community Scripts Repository",
            "Plugin Downloads",
            "Firmware Updates",
            "Support Forum",
        ])
        rt_layout.addWidget(res_list)
        center_tabs.addTab(res_tab, "Online Resources")

        c_vbox.addWidget(center_tabs, 1)

        # ── Output Panel (bottom dock) ────────────────────────────────────
        out_dock = QDockWidget("Output Panel", self)
        out_dock.setFeatures(
            QDockWidget.DockWidgetFloatable | QDockWidget.DockWidgetMovable
        )
        out_dock.setAllowedAreas(Qt.BottomDockWidgetArea)

        out_widget = QWidget()
        out_layout = QVBoxLayout(out_widget)
        out_layout.setContentsMargins(2, 2, 2, 2)
        out_layout.setSpacing(0)

        output_log = QTextEdit()
        output_log.setObjectName("outputLog")
        output_log.setReadOnly(True)
        output_log.setMinimumHeight(80)
        output_log.setPlainText(
            "[INFO]  TitanBridge: No memory slot loaded\n"
            "[INFO]  Helios II initialised — build 2025.3\n"
            "[INFO]  OpenCV Capture: Device ready — Game Capture HD60 S\n"
            "[INFO]  Python 3.11 runtime loaded\n"
            "[WARN]  Video Input: Not detected — check capture device\n"
            "[INFO]  Script: 2k_Vision.py loaded successfully\n"
            "[INFO]  Memory Slot 1: Creative GPC v1.00 — Hi\n"
        )
        out_layout.addWidget(output_log)
        out_dock.setWidget(out_widget)
        self.addDockWidget(Qt.BottomDockWidgetArea, out_dock)

        # ── LEFT DOCK: OpenCV Capture control panel ───────────────────────
        left_dock = QDockWidget("OpenCV Capture", self)
        left_dock.setFeatures(
            QDockWidget.DockWidgetFloatable | QDockWidget.DockWidgetMovable
        )
        left_dock.setAllowedAreas(Qt.LeftDockWidgetArea | Qt.RightDockWidgetArea)

        left_scroll = QScrollArea()
        left_scroll.setWidgetResizable(True)
        left_scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarAlwaysOff)
        left_scroll.setMinimumWidth(195)
        left_scroll.setMaximumWidth(230)

        left_w = QWidget()
        left_layout = QVBoxLayout(left_w)
        left_layout.setContentsMargins(4, 4, 4, 4)
        left_layout.setSpacing(6)

        # ── Capture Source ────────────────────────────────────────────────
        left_layout.addWidget(self._section_label("Capture Source"))
        src_group = QGroupBox()
        src_gl = QFormLayout(src_group)
        src_gl.setContentsMargins(6, 6, 6, 6)
        src_gl.setSpacing(4)
        device_cb = QComboBox()
        device_cb.addItems(["Game Capture HD60 S", "OBS Virtual Camera", "Webcam HD"])
        device_row = QHBoxLayout()
        device_row.addWidget(device_cb, 1)
        refresh_btn = QPushButton("↺")
        refresh_btn.setFixedWidth(26)
        device_row.addWidget(refresh_btn)
        src_gl.addRow("Device:", device_row)
        left_layout.addWidget(src_group)

        # ── Settings ──────────────────────────────────────────────────────
        left_layout.addWidget(self._section_label("Settings"))
        settings_group = QGroupBox()
        set_gl = QFormLayout(settings_group)
        set_gl.setContentsMargins(6, 6, 6, 6)
        set_gl.setSpacing(4)
        fps_cb = QComboBox()
        fps_cb.addItems(["60 FPS", "30 FPS", "120 FPS"])
        set_gl.addRow("Frame Rate:", fps_cb)
        res_cb = QComboBox()
        res_cb.addItems(["1080p (1920x1080)", "720p (1280x720)", "4K (3840x2160)"])
        set_gl.addRow("Resolution:", res_cb)
        left_layout.addWidget(settings_group)

        # ── Control ───────────────────────────────────────────────────────
        left_layout.addWidget(self._section_label("Control"))
        ctrl_group = QGroupBox()
        ctrl_gl = QVBoxLayout(ctrl_group)
        ctrl_gl.setContentsMargins(6, 6, 6, 6)
        ctrl_gl.setSpacing(4)
        start_btn = QPushButton("Start Capture")
        start_btn.setDefault(True)
        ctrl_gl.addWidget(start_btn)
        write_fps = QLabel("Write FPS: --")
        write_fps.setStyleSheet("font-size:9pt;")
        ctrl_gl.addWidget(write_fps)
        left_layout.addWidget(ctrl_group)

        # ── CV Python ─────────────────────────────────────────────────────
        left_layout.addWidget(self._section_label("CV Python"))
        cv_group = QGroupBox()
        cv_gl = QVBoxLayout(cv_group)
        cv_gl.setContentsMargins(6, 4, 6, 6)
        cv_gl.setSpacing(3)
        py_status = QLabel("✔  Python: 3.11")
        py_status.setStyleSheet("color: #00CC44; font-size:9pt;")
        cv_gl.addWidget(py_status)
        vid_status = QLabel("✖  Video Input: Not detected")
        vid_status.setStyleSheet("color: #CC2222; font-size:9pt;")
        cv_gl.addWidget(vid_status)

        left_layout.addWidget(cv_group)
        left_layout.addWidget(self._section_label("Python Script (.py)"))

        script_group = QGroupBox()
        sc_gl = QVBoxLayout(script_group)
        sc_gl.setContentsMargins(6, 6, 6, 6)
        sc_gl.setSpacing(4)
        script_row = QHBoxLayout()
        script_cb = QComboBox()
        script_cb.addItems(["2k_Vision.py", "nba2k_main.py", "custom.py"])
        script_row.addWidget(script_cb, 1)
        folder_btn = QPushButton("📁"); folder_btn.setFixedWidth(26); script_row.addWidget(folder_btn)
        del_btn = QPushButton("✖"); del_btn.setFixedWidth(26); script_row.addWidget(del_btn)
        sc_gl.addLayout(script_row)
        left_layout.addWidget(script_group)

        left_layout.addWidget(self._section_label("Control"))
        ctrl2_group = QGroupBox()
        ctrl2_gl = QVBoxLayout(ctrl2_group)
        ctrl2_gl.setContentsMargins(6, 6, 6, 6)
        ctrl2_gl.setSpacing(4)
        btns_row = QHBoxLayout()
        start_btn2 = QPushButton("Start"); btns_row.addWidget(start_btn2)
        restart_btn2 = QPushButton("Restart"); btns_row.addWidget(restart_btn2)
        ctrl2_gl.addLayout(btns_row)
        for stat_txt in ["Process: -- ms", "Jitter: -- ms", "Script FPS: --"]:
            ctrl2_gl.addWidget(QLabel(stat_txt))
        left_layout.addWidget(ctrl2_group)

        # ── File Explorer ─────────────────────────────────────────────────
        left_layout.addWidget(self._section_label("File Explorer"))
        fe_group = QGroupBox()
        fe_gl = QVBoxLayout(fe_group)
        fe_gl.setContentsMargins(6, 6, 6, 6)
        fe_gl.setSpacing(4)
        path_row = QHBoxLayout()
        path_edit = QLineEdit("C:/Users/user/Desktop/HeliosII/scripts")
        path_edit.setReadOnly(True)
        path_row.addWidget(path_edit, 1)
        open_btn = QPushButton("▶")
        open_btn.setFixedWidth(26)
        open_btn.setStyleSheet("QPushButton { background: #00AA33; color: white; font-weight:bold; }")
        path_row.addWidget(open_btn)
        fe_gl.addLayout(path_row)
        file_tree = QTreeWidget()
        file_tree.setHeaderHidden(True)
        file_tree.setMinimumHeight(70)
        QTreeWidgetItem(file_tree, ["📁  2k_Vision"])
        QTreeWidgetItem(file_tree, ["📁  nba2k_main"])
        fe_gl.addWidget(file_tree)
        left_layout.addWidget(fe_group)

        left_layout.addStretch()
        left_scroll.setWidget(left_w)
        left_dock.setWidget(left_scroll)
        self.addDockWidget(Qt.LeftDockWidgetArea, left_dock)

        # ── RIGHT DOCK: Titan Bridge ───────────────────────────────────────
        right_dock = QDockWidget("Titan Bridge", self)
        right_dock.setFeatures(
            QDockWidget.DockWidgetFloatable | QDockWidget.DockWidgetMovable
        )
        right_dock.setAllowedAreas(Qt.LeftDockWidgetArea | Qt.RightDockWidgetArea)

        right_scroll = QScrollArea()
        right_scroll.setWidgetResizable(True)
        right_scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarAlwaysOff)
        right_scroll.setMinimumWidth(210)
        right_scroll.setMaximumWidth(260)

        right_w = QWidget()
        right_layout = QVBoxLayout(right_w)
        right_layout.setContentsMargins(4, 4, 4, 4)
        right_layout.setSpacing(6)

        # ── Titan Two Device ─────────────────────────────────────────────
        right_layout.addWidget(self._section_label("Titan Two Device"))
        t2d_group = QGroupBox()
        t2d_gl = QVBoxLayout(t2d_group)
        t2d_gl.setContentsMargins(6, 6, 6, 6)
        t2d_gl.setSpacing(4)
        device_row2 = QHBoxLayout()
        t2_device_cb = QComboBox()
        t2_device_cb.addItems([
            "Titan Two Device 1 (03364111833C/85044404/304D202020)",
            "Titan Two Device 2",
        ])
        device_row2.addWidget(t2_device_cb, 1)
        t2_refresh = QPushButton("↺"); t2_refresh.setFixedWidth(26)
        device_row2.addWidget(t2_refresh)
        t2d_gl.addLayout(device_row2)

        # Bridge active + Restart button row
        bridge_row = QHBoxLayout()
        restart_bridge = QPushButton("Restart Bridge")
        restart_bridge.setDefault(True)
        bridge_row.addWidget(restart_bridge, 1)
        bridge_active_dot = QLabel("●")
        bridge_active_dot.setStyleSheet("color:#00CC44; font-size:13px;")
        bridge_row.addWidget(bridge_active_dot)
        t2d_gl.addLayout(bridge_row)
        right_layout.addWidget(t2d_group)

        # ── Memory Slots ──────────────────────────────────────────────────
        right_layout.addWidget(self._section_label("Memory Slots"))
        mem_group = QGroupBox()
        mem_gl = QVBoxLayout(mem_group)
        mem_gl.setContentsMargins(4, 4, 4, 4)
        mem_gl.setSpacing(3)

        for slot_num, slot_name, slot_sub, active in [
            (1, "Creative GPC v1.00", "Hi",  True),
            (2, "SLOT_002_NAME",      "—",   False),
            (3, "none",               "—",   False),
        ]:
            slot_frame = QFrame()
            slot_frame.setFrameShape(QFrame.StyledPanel)
            sf_layout = QHBoxLayout(slot_frame)
            sf_layout.setContentsMargins(6, 4, 6, 4)
            sf_layout.setSpacing(8)
            num_lbl = QLabel(str(slot_num))
            num_lbl.setStyleSheet(
                "font-size:14pt; font-weight:bold; min-width:16px; color: palette(text);"
            )
            sf_layout.addWidget(num_lbl)
            name_col = QVBoxLayout(); name_col.setSpacing(0)
            name_lbl = QLabel(slot_name)
            name_lbl.setStyleSheet(
                "font-size:9pt; font-weight:bold;" + (" color: palette(text);" if active else " color: palette(mid);")
            )
            sub_lbl = QLabel(slot_sub)
            sub_lbl.setStyleSheet("font-size:8pt; color: palette(mid);")
            name_col.addWidget(name_lbl); name_col.addWidget(sub_lbl)
            sf_layout.addLayout(name_col, 1)
            mem_gl.addWidget(slot_frame)

        right_layout.addWidget(mem_group)

        # ── Device Config / KMG Capture tabs ─────────────────────────────
        cfg_tabs = QTabWidget()

        # Device Config tab
        dc_tab = QWidget()
        dc_layout = QVBoxLayout(dc_tab)
        dc_layout.setContentsMargins(6, 6, 6, 6)
        dc_layout.setSpacing(4)
        out_row = QHBoxLayout()
        out_row.addWidget(QLabel("Output:"))
        out_cb = QComboBox()
        out_cb.addItems(["Xbox Series X/S", "PlayStation 5", "PC"])
        out_row.addWidget(out_cb, 1)
        dc_layout.addLayout(out_row)

        # USB Ports table
        dc_layout.addWidget(self._section_label("USB Ports"))
        usb_table = QTableWidget(4, 2)
        usb_table.setHorizontalHeaderLabels(["Port", "Status"])
        usb_table.verticalHeader().setVisible(False)
        usb_table.horizontalHeader().setStretchLastSection(True)
        usb_table.setMaximumHeight(110)
        for ri, (port, status) in enumerate([
            ("IN A",  "Disconnected"),
            ("IN B",  "Disconnected"),
            ("OUT",   "Disconnected"),
            ("PROG",  "Helios II"),
        ]):
            usb_table.setItem(ri, 0, QTableWidgetItem(port))
            usb_table.setItem(ri, 1, QTableWidgetItem(status))
        dc_layout.addWidget(usb_table)
        dc_layout.addStretch()
        cfg_tabs.addTab(dc_tab, "Device Config")

        # KMG Capture tab
        kmg_tab = QWidget()
        kmg_layout = QVBoxLayout(kmg_tab)
        kmg_layout.setContentsMargins(6, 6, 6, 6)
        kmg_layout.setSpacing(4)
        kmg_layout.addWidget(QLabel("KMG Capture Device:"))
        kmg_cb = QComboBox(); kmg_cb.addItems(["None", "KMG-1", "KMG-2"])
        kmg_layout.addWidget(kmg_cb)
        kmg_layout.addWidget(QPushButton("Connect KMG"))
        kmg_layout.addStretch()
        cfg_tabs.addTab(kmg_tab, "KMG Capture")

        right_layout.addWidget(cfg_tabs)
        right_layout.addStretch()

        right_scroll.setWidget(right_w)
        right_dock.setWidget(right_scroll)
        self.addDockWidget(Qt.RightDockWidgetArea, right_dock)

        # ── Status bar (very bottom) ──────────────────────────────────────
        sb = self.statusBar()
        sb.showMessage(
            "  Helios II  |  OpenCV Capture: Ready  |  TitanBridge: Active  |  Python 3.11"
        )

    def apply_stylesheet(self, qss: str):
        self.setStyleSheet(qss)


class PreviewContainer(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        layout = QVBoxLayout(self); layout.setContentsMargins(0,0,0,0)
        scroll = QScrollArea(); scroll.setWidgetResizable(True)
        scroll.setStyleSheet("QScrollArea{border:none;background:#070710;}")
        wrapper = QWidget(); wrapper.setStyleSheet("background:#070710;")
        wl = QVBoxLayout(wrapper); wl.setContentsMargins(16,16,16,16)
        chrome = QFrame()
        chrome.setStyleSheet("QFrame{background:#161630;border:1px solid #2A2A50;border-radius:10px;}")
        cl2 = QVBoxLayout(chrome); cl2.setContentsMargins(0,0,0,0); cl2.setSpacing(0)
        ftb = QWidget(); ftb.setFixedHeight(28)
        ftb.setStyleSheet("background:#101024;border-radius:10px 10px 0 0;border-bottom:1px solid #1E1E40;")
        ftbl = QHBoxLayout(ftb); ftbl.setContentsMargins(10,6,10,6)
        for col in ["#FF5F57","#FEBC2E","#28C840"]:
            d=QLabel("●"); d.setStyleSheet(f"color:{col};font-size:9px;background:transparent;"); ftbl.addWidget(d)
        ftbl.addStretch()
        wt=QLabel("Helios II  —  Live Theme Preview"); wt.setStyleSheet("color:#333360;font-size:10px;background:transparent;"); ftbl.addWidget(wt)
        ftbl.addStretch(); cl2.addWidget(ftb)
        self.preview = HeliosPreviewWindow()
        self.preview.setMinimumSize(900,540)
        cl2.addWidget(self.preview)
        wl.addWidget(chrome); scroll.setWidget(wrapper); layout.addWidget(scroll)

    def apply_qss(self, qss: str):
        self.preview.apply_stylesheet(qss)


# ══════════════════════════════════════════════════════════════════════════════
#  PALETTE EXTRACTION DIALOG
# ══════════════════════════════════════════════════════════════════════════════
ROLE_LABELS = [
    ("bg",      "Primary Background",   "Darkest / main window background"),
    ("panel_bg","Panel Background",     "Panel, dock and secondary backgrounds"),
    ("accent",  "Primary Accent",       "Key accent — borders, active elements"),
    ("accent2", "Secondary Accent",     "Secondary accent — hover, highlights"),
    ("glow",    "Glow / Text Highlight","Bright text and selection highlight"),
]

class PaletteSwatchWidget(QWidget):
    """Displays one extracted color with its role label and a manual override button."""
    colorChanged = pyqtSignal(int, str)   # index, new_hex

    def __init__(self, index: int, hex_color: str, role_label: str, desc: str, parent=None):
        super().__init__(parent)
        self.index = index
        self._color = hex_color
        self.setFixedHeight(64)

        h = QHBoxLayout(self); h.setContentsMargins(0,0,0,0); h.setSpacing(12)

        # Big color swatch
        self._swatch = QFrame()
        self._swatch.setFixedSize(56, 52)
        self._swatch.setStyleSheet(f"background:{hex_color};border-radius:6px;border:2px solid #ffffff22;")
        self._swatch.setCursor(Qt.PointingHandCursor)
        self._swatch.mousePressEvent = lambda e: self._pick()
        h.addWidget(self._swatch)

        # Labels
        info = QVBoxLayout(); info.setSpacing(2)
        role = QLabel(f"Color {index+1}  —  {role_label}")
        role.setStyleSheet("color:#CCCCFF;font-size:12px;font-weight:700;background:transparent;")
        info.addWidget(role)
        self._hex_label = QLabel(hex_color.upper())
        self._hex_label.setStyleSheet(
            "color:#6666AA;font-family:'Cascadia Code',Consolas,monospace;"
            "font-size:11px;background:transparent;")
        info.addWidget(self._hex_label)
        desc_lbl = QLabel(desc)
        desc_lbl.setStyleSheet("color:#444466;font-size:10px;background:transparent;")
        info.addWidget(desc_lbl)
        h.addLayout(info, 1)

        # Edit button
        edit_btn = QPushButton("✎")
        edit_btn.setFixedSize(28, 28)
        edit_btn.setToolTip("Override this color manually")
        edit_btn.setStyleSheet(
            "QPushButton{background:#1A1A2A;color:#6666AA;border:1px solid #2A2A4A;border-radius:4px;}"
            "QPushButton:hover{background:#222240;color:#AAAAFF;}")
        edit_btn.clicked.connect(self._pick)
        h.addWidget(edit_btn)

    def _pick(self):
        c = QColorDialog.getColor(QColor(self._color), self, f"Edit Color {self.index+1}")
        if c.isValid():
            self._color = c.name()
            self._update_display()
            self.colorChanged.emit(self.index, self._color)

    def _update_display(self):
        self._swatch.setStyleSheet(
            f"background:{self._color};border-radius:6px;border:2px solid #ffffff22;")
        self._hex_label.setText(self._color.upper())

    def set_color(self, hex_c: str):
        self._color = hex_c
        self._update_display()

    def color(self): return self._color


class PaletteExtractDialog(QDialog):
    """
    Full palette extraction workflow dialog:
      1. Shows image preview
      2. Extracts 5 dominant colors using K-means
      3. Lets user edit/swap individual colors
      4. Emits the final palette on Accept
    """
    paletteAccepted = pyqtSignal(list)   # list of 5 hex strings

    def __init__(self, image_path: str, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Palette Extractor — Helios Theme Generator")
        self.setMinimumSize(640, 580)
        self.resize(680, 640)
        self.image_path = image_path
        self._colors = ["#111111","#222222","#444444","#888888","#CCCCCC"]
        self._qimage = None
        self._swatch_widgets: list[PaletteSwatchWidget] = []
        self._build_ui()
        self._load_and_extract()

    def _build_ui(self):
        main = QVBoxLayout(self)
        main.setContentsMargins(20, 20, 20, 20)
        main.setSpacing(16)

        # Header
        hdr = QLabel("🎨  Palette Extractor")
        hdr.setStyleSheet("color:#CCFF00;font-size:16px;font-weight:700;")
        main.addWidget(hdr)

        sub = QLabel("Dominant colors extracted from your image are mapped to Helios theme roles.\n"
                     "Click any swatch or the ✎ button to manually override a color.")
        sub.setStyleSheet("color:#666688;font-size:11px;")
        sub.setWordWrap(True)
        main.addWidget(sub)

        sep = QFrame(); sep.setFrameShape(QFrame.HLine)
        sep.setStyleSheet("color:#1A1A2A;"); main.addWidget(sep)

        # Two-column: image preview | swatches
        cols = QHBoxLayout(); cols.setSpacing(20)

        # Left: image + metadata
        left = QVBoxLayout(); left.setSpacing(8)
        self._img_label = QLabel()
        self._img_label.setFixedSize(220, 220)
        self._img_label.setAlignment(Qt.AlignCenter)
        self._img_label.setStyleSheet(
            "background:#0A0A14;border:1px solid #1A1A2A;border-radius:8px;color:#444466;font-size:11px;")
        self._img_label.setText("Loading…")
        left.addWidget(self._img_label)

        # Horizontal color strip (live preview of extracted colors)
        self._strip = QFrame()
        self._strip.setFixedHeight(28)
        self._strip.setStyleSheet("border-radius:5px;")
        left.addWidget(self._strip)

        self._img_info = QLabel()
        self._img_info.setStyleSheet("color:#444466;font-size:10px;font-family:monospace;")
        self._img_info.setWordWrap(True)
        left.addWidget(self._img_info)

        # Re-extract button
        btn_reextract = QPushButton("↺  Re-extract Colors")
        btn_reextract.setToolTip("Run the color extraction algorithm again")
        btn_reextract.clicked.connect(self._reextract)
        left.addWidget(btn_reextract)

        left.addStretch()
        cols.addLayout(left)

        # Right: swatch rows
        right = QVBoxLayout(); right.setSpacing(6)
        swatches_lbl = QLabel("Extracted Palette")
        swatches_lbl.setStyleSheet("color:#8888AA;font-size:10px;font-weight:700;letter-spacing:1.5px;")
        right.addWidget(swatches_lbl)

        for i, (key, role_label, desc) in enumerate(ROLE_LABELS):
            sw = PaletteSwatchWidget(i, "#333333", role_label, desc)
            sw.colorChanged.connect(self._on_swatch_change)
            self._swatch_widgets.append(sw)
            right.addWidget(sw)

        right.addStretch()
        cols.addLayout(right, 1)
        main.addLayout(cols)

        # Status
        self._status_lbl = QLabel("Analysing image…")
        self._status_lbl.setStyleSheet("color:#5555AA;font-size:11px;font-style:italic;")
        self._status_lbl.setAlignment(Qt.AlignCenter)
        main.addWidget(self._status_lbl)

        sep2 = QFrame(); sep2.setFrameShape(QFrame.HLine)
        sep2.setStyleSheet("color:#1A1A2A;"); main.addWidget(sep2)

        # Buttons
        btn_row = QHBoxLayout(); btn_row.setSpacing(10)
        btn_row.addStretch()
        btn_cancel = QPushButton("Cancel"); btn_cancel.clicked.connect(self.reject)
        btn_cancel.setFixedWidth(90)
        btn_row.addWidget(btn_cancel)
        self._btn_apply = QPushButton("✓  Apply Palette to Theme")
        self._btn_apply.setEnabled(False)
        self._btn_apply.setFixedHeight(36)
        self._btn_apply.setStyleSheet(
            "QPushButton{background:qlineargradient(x1:0,y1:0,x2:1,y2:0,stop:0 #3300CC,stop:1 #6600FF);"
            "color:#CCFF00;border:1px solid #CCFF00;border-radius:6px;font-weight:700;font-size:13px;padding:0 18px;}"
            "QPushButton:hover{background:#CCFF00;color:#0D0D20;}"
            "QPushButton:disabled{background:#1A1A2A;color:#333355;border-color:#222244;}")
        self._btn_apply.clicked.connect(self._accept)
        btn_row.addWidget(self._btn_apply)
        main.addLayout(btn_row)

    def _load_and_extract(self):
        self._qimage = QImage(self.image_path)
        if self._qimage.isNull():
            self._status_lbl.setText("⚠  Could not load image.")
            return

        # Show thumbnail
        pix = QPixmap.fromImage(self._qimage).scaled(
            220, 220, Qt.KeepAspectRatio, Qt.SmoothTransformation)
        self._img_label.setPixmap(pix)
        self._img_label.setText("")
        self._img_info.setText(
            f"{Path(self.image_path).name}\n"
            f"{self._qimage.width()} × {self._qimage.height()} px")

        self._status_lbl.setText("Analysing pixels…")
        QApplication.processEvents()
        self._run_extraction()

    def _run_extraction(self):
        if self._qimage is None or self._qimage.isNull():
            return
        self._status_lbl.setText("Running K-means clustering…")
        QApplication.processEvents()
        try:
            colors = extract_palette(self._qimage, n_colors=5)
            self._colors = colors
            self._update_swatches(colors)
            self._update_strip(colors)
            self._status_lbl.setText(
                f"✓  Extracted {len(colors)} dominant colors  —  review and click Apply")
            self._btn_apply.setEnabled(True)
        except Exception as e:
            self._status_lbl.setText(f"⚠  Extraction failed: {e}")

    def _reextract(self):
        self._btn_apply.setEnabled(False)
        self._status_lbl.setText("Re-extracting…")
        QApplication.processEvents()
        self._run_extraction()

    def _update_swatches(self, colors: list):
        for i, sw in enumerate(self._swatch_widgets):
            if i < len(colors):
                sw.set_color(colors[i])

    def _update_strip(self, colors: list):
        # Build an inline CSS gradient strip from the colors
        if not colors: return
        pct = 100.0 / len(colors)
        stops = []
        for i, c in enumerate(colors):
            stops.append(f"{c} {i*pct:.0f}%")
            stops.append(f"{c} {(i+1)*pct:.0f}%")
        gradient = f"qlineargradient(x1:0,y1:0,x2:1,y2:0,{','.join(f'stop:{i/(len(colors)-1 or 1):.3f} {c}' for i,c in enumerate(colors))})"
        self._strip.setStyleSheet(f"background:{gradient};border-radius:5px;border:1px solid #1A1A2A;")

    def _on_swatch_change(self, index: int, new_hex: str):
        if index < len(self._colors):
            self._colors[index] = new_hex
        self._update_strip(self._colors)

    def _accept(self):
        # Collect current colors from swatch widgets (may have been manually edited)
        final = [sw.color() for sw in self._swatch_widgets]
        self.paletteAccepted.emit(final)
        self.accept()


# ══════════════════════════════════════════════════════════════════════════════
#  SMALL REUSABLE WIDGETS
# ══════════════════════════════════════════════════════════════════════════════
class SwatchBtn(QPushButton):
    colorChanged = pyqtSignal(str)
    def __init__(self, color="#FFFFFF", parent=None):
        super().__init__(parent); self._c = color
        self.setFixedSize(32,22); self.setCursor(Qt.PointingHandCursor)
        self._repaint(); self.clicked.connect(self._pick)
    def _repaint(self):
        c = QColor(self._c); lum=0.299*c.red()+0.587*c.green()+0.114*c.blue()
        ring="#FFFFFF55" if lum<128 else "#00000055"
        self.setStyleSheet(f"background:{self._c};border:2px solid {ring};border-radius:4px;")
    def _pick(self):
        c = QColorDialog.getColor(QColor(self._c),self,"Pick Colour")
        if c.isValid(): self._c=c.name(); self._repaint(); self.colorChanged.emit(self._c)
    def color(self): return self._c
    def set_color(self, v): self._c=v; self._repaint()

class ColorRow(QWidget):
    changed = pyqtSignal()
    def __init__(self, label, key, tip="", label_obj_name="row_label", parent=None):
        super().__init__(parent); self.key=key; self._sync=False
        h=QHBoxLayout(self); h.setContentsMargins(0,0,0,0); h.setSpacing(8)
        lbl=QLabel(label); lbl.setObjectName(label_obj_name)
        lbl.setAlignment(Qt.AlignLeft|Qt.AlignVCenter)
        if label_obj_name=="row_label": lbl.setMinimumWidth(152)
        if tip: lbl.setToolTip(tip)
        h.addWidget(lbl)
        self.sw=SwatchBtn()
        self.sw.colorChanged.connect(self._from_sw)
        if tip: self.sw.setToolTip(tip)
        h.addWidget(self.sw)
        self.he=QLineEdit(); self.he.setObjectName("hex_input")
        self.he.setPlaceholderText("#RRGGBB"); self.he.setMaxLength(7)
        self.he.textChanged.connect(self._from_hex)
        h.addWidget(self.he); h.addStretch()
    def _from_sw(self,c): self._sync=True; self.he.setText(c); self._sync=False; self.changed.emit()
    def _from_hex(self,t):
        if self._sync: return
        if re.match(r'^#[0-9A-Fa-f]{6}$',t.strip()): self.sw.set_color(t.strip()); self.changed.emit()
    def value(self): return self.sw.color()
    def set_value(self,c): self._sync=True; self.sw.set_color(c); self.he.setText(c); self._sync=False

class SliderRow(QWidget):
    changed = pyqtSignal()
    def __init__(self, label, key, lo=0, hi=100, suffix="%", tip="", label_obj_name="row_label", parent=None):
        super().__init__(parent); self.key=key; self.suffix=suffix
        h=QHBoxLayout(self); h.setContentsMargins(0,0,0,0); h.setSpacing(8)
        lbl=QLabel(label); lbl.setObjectName(label_obj_name)
        if label_obj_name=="row_label": lbl.setMinimumWidth(152)
        if tip: lbl.setToolTip(tip); h.addWidget(lbl)
        self.sl=QSlider(Qt.Horizontal); self.sl.setRange(lo,hi); self.sl.setValue(hi)
        self.sl.setCursor(Qt.PointingHandCursor)
        if tip: self.sl.setToolTip(tip)
        self.sl.valueChanged.connect(self._on); h.addWidget(self.sl,1)
        self.vl=QLabel(f"{hi}{suffix}"); self.vl.setObjectName("row_label")
        self.vl.setFixedWidth(38); self.vl.setAlignment(Qt.AlignRight|Qt.AlignVCenter); h.addWidget(self.vl)
    def _on(self,v): self.vl.setText(f"{v}{self.suffix}"); self.changed.emit()
    def value(self): return self.sl.value()
    def set_value(self,v): self.sl.setValue(v); self.vl.setText(f"{v}{self.suffix}")

class CollapsibleSection(QWidget):
    def __init__(self, title, icon="", parent=None):
        super().__init__(parent); self._exp=True
        outer=QVBoxLayout(self); outer.setContentsMargins(0,0,0,6); outer.setSpacing(0)
        hdr=QWidget(); hdr.setFixedHeight(34); hdr.setCursor(Qt.PointingHandCursor)
        hdr.setStyleSheet("QWidget{background:#0F0F1C;border-radius:6px 6px 0 0;}QWidget:hover{background:#131325;}")
        hl=QHBoxLayout(hdr); hl.setContentsMargins(12,0,12,0); hl.setSpacing(8)
        if icon:
            ic=QLabel(icon); ic.setStyleSheet("color:#5555AA;font-size:13px;background:transparent;"); hl.addWidget(ic)
        tl=QLabel(title.upper())
        tl.setStyleSheet("color:#7777BB;font-size:10px;font-weight:700;letter-spacing:1.5px;background:transparent;")
        hl.addWidget(tl); hl.addStretch()
        self._arrow=QLabel("▾"); self._arrow.setStyleSheet("color:#4444AA;background:transparent;"); hl.addWidget(self._arrow)
        hdr.mousePressEvent=lambda e: self.toggle(); outer.addWidget(hdr)
        self._body=QFrame(); self._body.setObjectName("section_box")
        self._body.setStyleSheet("QFrame#section_box{background:#0D0D1A;border:1px solid #1A1A2A;border-top:none;border-radius:0 0 6px 6px;}")
        self._bl=QVBoxLayout(self._body); self._bl.setContentsMargins(14,10,14,12); self._bl.setSpacing(6)
        outer.addWidget(self._body)
    def add(self,w): self._bl.addWidget(w)
    def toggle(self):
        self._exp=not self._exp; self._body.setVisible(self._exp)
        self._arrow.setText("▾" if self._exp else "▸")


# ══════════════════════════════════════════════════════════════════════════════
#  BUILDER STYLESHEET  (compact side-panel edition)
# ══════════════════════════════════════════════════════════════════════════════
BUILDER_QSS = """
/* ── Base ─────────────────────────────────────────────────────────────────── */
QMainWindow,QDialog { background:#1A1C22; }
QWidget {
    background:#1A1C22; color:#C8CAD4;
    font-family:"Segoe UI","SF Pro Text",sans-serif; font-size:12px;
}
QScrollArea  { border:none; background:transparent; }
QScrollBar:vertical   { background:transparent; width:5px; margin:0; }
QScrollBar::handle:vertical { background:#2E3040; border-radius:3px; min-height:16px; }
QScrollBar::handle:vertical:hover { background:#4A4CCC; }
QScrollBar::add-line,QScrollBar::sub-line { height:0; }
QScrollBar:horizontal { background:transparent; height:5px; margin:0; }
QScrollBar::handle:horizontal { background:#2E3040; border-radius:3px; }
QSplitter::handle { background:#12141A; }
QToolTip { background:#252830; color:#2CC5D9; border:1px solid #2CC5D9;
           padding:4px 8px; border-radius:4px; font-size:11px; }

/* ── Sidebar navigation ────────────────────────────────────────────────────── */
QWidget#sidebar {
    background:#13151B;
    border-right:1px solid #22242C;
}
QPushButton#nav_btn {
    background:transparent; color:#6E7080;
    border:none; border-radius:6px;
    padding:8px 6px; font-size:11px; font-weight:600;
    text-align:center;
}
QPushButton#nav_btn:hover { background:#1E2028; color:#A0A8C0; }
QPushButton#nav_btn[active="true"] {
    background:#1E2540; color:#2CC5D9;
    border-left:2px solid #2CC5D9;
    border-radius:0 6px 6px 0;
}

/* ── Center config panel ───────────────────────────────────────────────────── */
QWidget#config_panel { background:#1A1C22; }
QLabel#section_heading {
    color:#2CC5D9; font-size:11px; font-weight:700;
    letter-spacing:1.5px; background:transparent;
    padding:4px 0 2px 0;
}
QLabel#row_label, QLabel#tab_row_label {
    color:#7A7E90; font-size:11px; min-width:106px; max-width:106px;
}

/* ── Hex input ─────────────────────────────────────────────────────────────── */
QLineEdit#hex_input {
    background:#12141A; color:#9AAABB; border:1px solid #2A2C38;
    border-radius:4px; padding:2px 5px;
    font-family:"Cascadia Code","Consolas",monospace; font-size:11px;
    max-width:68px; min-height:0;
}
QLineEdit#hex_input:focus { border-color:#2CC5D9; }

/* ── Theme name input ──────────────────────────────────────────────────────── */
QLineEdit#theme_name_input {
    background:#12141A; color:#D0D8E8;
    border:1px solid #2A2C38; border-radius:5px;
    padding:5px 10px; font-size:12px; font-weight:600;
}
QLineEdit#theme_name_input:focus { border-color:#2CC5D9; }

/* ── Sliders ───────────────────────────────────────────────────────────────── */
QSlider::groove:horizontal { height:3px; background:#23252E; border-radius:2px; }
QSlider::handle:horizontal {
    background:#2CC5D9; border:none;
    width:12px; height:12px; margin:-5px 0; border-radius:6px;
}
QSlider::sub-page:horizontal { background:#2CC5D9; border-radius:2px; }

/* ── Checkboxes ────────────────────────────────────────────────────────────── */
QCheckBox { color:#7A7E90; spacing:6px; font-size:11px; }
QCheckBox::indicator { width:13px; height:13px; background:#12141A;
    border:1px solid #2A2C38; border-radius:3px; }
QCheckBox::indicator:hover { border-color:#2CC5D9; }
QCheckBox::indicator:checked { background:#2CC5D9; border-color:#2CC5D9; }

/* ── Generic buttons ───────────────────────────────────────────────────────── */
QPushButton {
    background:#22242E; color:#A0A8C0;
    border:1px solid #2C2E3C; border-radius:5px; padding:5px 12px;
}
QPushButton:hover { background:#2A2C3A; border-color:#3C3E50; color:#C8CAD4; }
QPushButton:pressed { background:#181A22; }

/* ── Bottom toolbar ────────────────────────────────────────────────────────── */
QWidget#bottom_bar {
    background:#13151B;
    border-top:1px solid #22242C;
}
QPushButton#tb_generate {
    background:#1A3A4A; color:#2CC5D9;
    border:1px solid #2CC5D9; border-radius:5px;
    font-weight:700; font-size:11px; padding:6px 14px;
}
QPushButton#tb_generate:hover { background:#2CC5D9; color:#0D1620; }
QPushButton#tb_download {
    background:#1A2A1A; color:#4EC94E;
    border:1px solid #336633; border-radius:5px;
    font-weight:600; font-size:11px; padding:6px 14px;
}
QPushButton#tb_download:hover { background:#4EC94E; color:#0D1A0D; }
QPushButton#tb_download:disabled { background:#12181A; color:#2A3A2A; border-color:#1E2A1E; }
QPushButton#tb_reset {
    background:#2A1A1A; color:#CC6666;
    border:1px solid #442222; border-radius:5px;
    font-size:11px; padding:6px 14px;
}
QPushButton#tb_reset:hover { background:#CC6666; color:#1A0D0D; }
QPushButton#tb_palette {
    background:#1E1430; color:#AA77DD;
    border:1px solid #553388; border-radius:5px;
    font-size:11px; padding:6px 14px;
}
QPushButton#tb_palette:hover { background:#AA77DD; color:#0D0820; }
QPushButton#tb_generic {
    background:#1E2028; color:#8890A8;
    border:1px solid #2A2C3A; border-radius:5px;
    font-size:11px; padding:6px 12px;
}
QPushButton#tb_generic:hover { background:#2A2C3A; color:#C8CAD4; }

/* ── Preset combo ──────────────────────────────────────────────────────────── */
QComboBox#preset_combo {
    background:#12141A; color:#A0A8C0; border:1px solid #2A2C38;
    border-radius:5px; padding:5px 8px; font-size:11px;
}
QComboBox#preset_combo:hover { border-color:#2CC5D9; }
QComboBox#preset_combo QAbstractItemView {
    background:#1E2028; border:1px solid #2CC5D9;
    selection-background-color:#1A3A4A; color:#A0A8C0; outline:none;
}

/* ── Preview panel ─────────────────────────────────────────────────────────── */
QWidget#preview_panel { background:#0E1016; }
QLabel#preview_header_lbl {
    color:#2E3040; font-size:10px; font-weight:700; letter-spacing:2px;
    background:transparent;
}

/* ── Palette strip ─────────────────────────────────────────────────────────── */
QFrame#palette_strip { background:#12141A; border:1px solid #22242C; border-radius:4px; }

/* ── Section divider ───────────────────────────────────────────────────────── */
QFrame#hdivider { background:#22242C; max-height:1px; }

/* ── Instructions ──────────────────────────────────────────────────────────── */
QLabel#install_text { color:#4A7A4A; font-size:10px; font-family:"Cascadia Code",Consolas,monospace; }

/* ── Dialog ─────────────────────────────────────────────────────────────────── */
QFrame#action_section { background:#1E2028; border:1px solid #22242C; border-radius:6px; }
QFrame#instructions_box { background:#12180F; border:1px solid #1A2A1A; border-radius:6px; }
QLabel#instructions_text { color:#4A8A4A; font-size:11px; font-family:"Cascadia Code",Consolas,monospace; }
"""


# ══════════════════════════════════════════════════════════════════════════════
#  MAIN WINDOW  — compact side-panel layout
# ══════════════════════════════════════════════════════════════════════════════
# Navigation items: (label, icon, section_key)
NAV_ITEMS = [
    ("General",    "◈", "general"),
    ("Panels",     "▣", "panels"),
    ("Buttons",    "⬡", "buttons"),
    ("Tabs",       "⊞", "tabs"),
    ("Inputs",     "✎", "inputs"),
    ("Scrollbars", "⇅", "scrollbars"),
    ("Background", "⬚", "background"),
    ("Presets",    "★", "presets"),
    ("Export",     "⬇", "export"),
]


class HeliosThemeGenerator(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Helios II — QSS Theme Generator")
        self.setMinimumSize(1060, 640)
        self.resize(1200, 720)
        self.setStyleSheet(BUILDER_QSS)

        self._theme = DEFAULT.copy()
        self._color_rows:  dict[str, ColorRow]  = {}
        self._slider_rows: dict[str, SliderRow] = {}
        self._generated_qss = ""
        self._current_palette: list[str] = []
        self._nav_buttons: dict[str, QPushButton] = {}
        self._current_section = "general"

        self._timer = QTimer()
        self._timer.setSingleShot(True)
        self._timer.setInterval(80)
        self._timer.timeout.connect(self._rebuild_and_apply)

        # Window icon (taskbar + title bar)
        ico_path = _asset("assets/logo/themegen.ico")
        if os.path.exists(ico_path):
            self.setWindowIcon(QIcon(ico_path))

        self._build_ui()
        self._load_values(DEFAULT)

    # ── helpers ──────────────────────────────────────────────────────────────
    def _lbl(self, text, style=""):
        l = QLabel(text)
        if style: l.setStyleSheet(style)
        return l

    def _hdiv(self):
        f = QFrame(); f.setObjectName("hdivider")
        f.setFrameShape(QFrame.HLine); f.setFixedHeight(1)
        return f

    def _section_lbl(self, text):
        l = QLabel(text); l.setObjectName("section_heading"); return l

    def _add_cr(self, layout, label, key, tip=""):
        r = ColorRow(label, key, tip, label_obj_name="tab_row_label")
        r.changed.connect(self._on_change)
        self._color_rows[key] = r
        layout.addWidget(r)

    def _add_sl(self, layout, label, key, lo, hi, suffix, tip=""):
        r = SliderRow(label, key, lo, hi, suffix, tip, label_obj_name="tab_row_label")
        r.changed.connect(self._on_change)
        self._slider_rows[key] = r
        layout.addWidget(r)

    # ── UI construction ───────────────────────────────────────────────────────
    def _build_ui(self):
        root = QWidget(); self.setCentralWidget(root)
        rl = QVBoxLayout(root); rl.setContentsMargins(0,0,0,0); rl.setSpacing(0)

        # ── Title bar ─────────────────────────────────────────────────────
        tbar = QWidget(); tbar.setObjectName("app_titlebar")
        tbar.setFixedHeight(46)
        tbar.setStyleSheet(
            "background:qlineargradient(x1:0,y1:0,x2:1,y2:0,"
            "stop:0 #0A0C14,stop:1 #10121C);"
            "border-bottom:1px solid #1E2030;")
        tbl = QHBoxLayout(tbar); tbl.setContentsMargins(12,0,12,0); tbl.setSpacing(10)

        # Logo image in header
        logo_lbl = QLabel()
        logo_lbl.setStyleSheet("background:transparent;border:none;")
        logo_lbl.setPixmap(_logo_pixmap(36))
        logo_lbl.setAlignment(Qt.AlignVCenter)
        tbl.addWidget(logo_lbl)

        # App title
        tbl.addWidget(self._lbl("Helios II  Theme Generator",
            "color:#D0D8E8;font-size:13px;font-weight:700;background:transparent;"))

        tbl.addStretch()

        # About button (top-right)
        about_btn = QPushButton("About")
        about_btn.setStyleSheet(
            "QPushButton{background:transparent;color:#3A3E50;border:none;"
            "font-size:10px;padding:2px 8px;}"
            "QPushButton:hover{color:#2CC5D9;}")
        about_btn.setCursor(Qt.PointingHandCursor)
        about_btn.clicked.connect(self._show_about)
        tbl.addWidget(about_btn)

        self._status_lbl = QLabel("")
        self._status_lbl.setStyleSheet(
            "color:#2CC5D9;font-size:10px;background:transparent;min-width:180px;")
        self._status_lbl.setAlignment(Qt.AlignRight | Qt.AlignVCenter)
        tbl.addWidget(self._status_lbl)
        rl.addWidget(tbar)

        # ── Main body: sidebar + config + preview ─────────────────────────
        body = QWidget(); body_l = QHBoxLayout(body)
        body_l.setContentsMargins(0,0,0,0); body_l.setSpacing(0)

        body_l.addWidget(self._build_sidebar())

        # Config panel lives in a stacked widget
        self._stack = QStackedWidget()
        self._stack.setObjectName("config_panel")
        self._stack.setFixedWidth(300)
        self._stack.setStyleSheet("background:#1A1C22; border-right:1px solid #22242C;")
        self._build_all_pages()
        body_l.addWidget(self._stack)

        body_l.addWidget(self._build_preview_panel(), 1)
        rl.addWidget(body, 1)

        # ── Bottom toolbar ─────────────────────────────────────────────────
        rl.addWidget(self._build_bottom_bar())

    # ── Sidebar ───────────────────────────────────────────────────────────────
    def _build_sidebar(self):
        sb = QWidget(); sb.setObjectName("sidebar"); sb.setFixedWidth(84)
        sl = QVBoxLayout(sb); sl.setContentsMargins(0,8,0,8); sl.setSpacing(2)

        # App icon/logo area — real image scaled to sidebar width
        logo = QLabel()
        logo.setAlignment(Qt.AlignCenter)
        logo.setStyleSheet("background:transparent;border:none;padding:4px 0 8px 0;")
        logo.setPixmap(_logo_pixmap(52))
        sl.addWidget(logo)

        for label, icon, key in NAV_ITEMS:
            btn = QPushButton(f"{icon}\n{label}")
            btn.setObjectName("nav_btn")
            btn.setFixedHeight(56)
            btn.setCursor(Qt.PointingHandCursor)
            btn.clicked.connect(lambda checked, k=key: self._nav_to(k))
            self._nav_buttons[key] = btn
            sl.addWidget(btn)

        sl.addStretch()
        return sb

    def _nav_to(self, key: str):
        # Deactivate old
        if self._current_section in self._nav_buttons:
            self._nav_buttons[self._current_section].setProperty("active", False)
            self._nav_buttons[self._current_section].style().unpolish(self._nav_buttons[self._current_section])
            self._nav_buttons[self._current_section].style().polish(self._nav_buttons[self._current_section])
        # Activate new
        self._current_section = key
        self._nav_buttons[key].setProperty("active", True)
        self._nav_buttons[key].style().unpolish(self._nav_buttons[key])
        self._nav_buttons[key].style().polish(self._nav_buttons[key])
        # Show page
        page_map = {item[2]: i for i, item in enumerate(NAV_ITEMS)}
        self._stack.setCurrentIndex(page_map[key])

    def _make_page_scroll(self):
        """Returns (QScrollArea, inner_vbox_layout)"""
        scroll = QScrollArea(); scroll.setWidgetResizable(True)
        scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarAlwaysOff)
        scroll.setStyleSheet("background:#1A1C22;border:none;")
        page = QWidget(); page.setStyleSheet("background:#1A1C22;")
        layout = QVBoxLayout(page)
        layout.setContentsMargins(14, 14, 14, 18)
        layout.setSpacing(3)
        scroll.setWidget(page)
        return scroll, layout

    # ── Config pages ──────────────────────────────────────────────────────────
    def _build_all_pages(self):
        for _, _, key in NAV_ITEMS:
            builder = getattr(self, f"_page_{key}")
            self._stack.addWidget(builder())
        # Activate default
        self._nav_to("general")

    def _page_general(self):
        scroll, cv = self._make_page_scroll()
        cv.addWidget(self._section_lbl("THEME NAME"))
        name_w = QWidget(); nl = QHBoxLayout(name_w)
        nl.setContentsMargins(0,0,0,6); nl.setSpacing(6)
        self._name_edit = QLineEdit(); self._name_edit.setObjectName("theme_name_input")
        self._name_edit.setPlaceholderText("MyTheme"); self._name_edit.setText("HeliosDark")
        self._name_edit.textChanged.connect(self._on_change)
        nl.addWidget(self._name_edit); cv.addWidget(name_w)
        cv.addWidget(self._hdiv())
        cv.addWidget(self._section_lbl("COLORS"))
        for lbl,key,tip in [
            ("Background",       "bg",      "Main window background"),
            ("Accent",           "accent",  "Primary accent color"),
            ("Secondary Accent", "accent2", "Secondary accent"),
            ("Glow / Highlight", "glow",    "Bright selection highlight"),
            ("Text Color",       "text",    "Default widget text"),
            ("Warning Color",    "warning", "Errors and warnings"),
        ]: self._add_cr(cv, lbl, key, tip)
        cv.addStretch(); return scroll

    def _page_panels(self):
        scroll, cv = self._make_page_scroll()
        cv.addWidget(self._section_lbl("PANEL COLORS"))
        for lbl,key,tip in [
            ("Panel Background", "panel_bg",     "Dock widget background"),
            ("Panel Border",     "panel_border",  "Dock panel border"),
            ("Border Color",     "border",        "Separators and inputs"),
        ]: self._add_cr(cv, lbl, key, tip)
        cv.addWidget(self._hdiv()); cv.addWidget(self._section_lbl("SETTINGS"))
        self._add_sl(cv, "Panel Opacity",  "panel_opacity",  20, 100, "%", "Panel transparency")
        self._add_sl(cv, "Border Radius",  "panel_radius",    0,  14, "px","Corner rounding")
        cv.addStretch(); return scroll

    def _page_buttons(self):
        scroll, cv = self._make_page_scroll()
        cv.addWidget(self._section_lbl("BUTTON COLORS"))
        for lbl,key,tip in [
            ("Background",  "btn_bg",    "Default button fill"),
            ("Hover Color", "btn_hover", "Button on mouse-over"),
            ("Text Color",  "btn_text",  "Button label text"),
            ("Border Color","btn_border","Button outline"),
        ]: self._add_cr(cv, lbl, key, tip)
        cv.addStretch(); return scroll

    def _page_tabs(self):
        scroll, cv = self._make_page_scroll()
        cv.addWidget(self._section_lbl("TAB COLORS"))
        for lbl,key,tip in [
            ("Tab Background",  "tab_bg",     "Inactive tab fill"),
            ("Active Tab Color","tab_active",  "Selected tab highlight"),
            ("Tab Text Color",  "tab_text",    "Inactive tab text"),
        ]: self._add_cr(cv, lbl, key, tip)
        cv.addStretch(); return scroll

    def _page_inputs(self):
        scroll, cv = self._make_page_scroll()
        cv.addWidget(self._section_lbl("INPUT COLORS"))
        for lbl,key,tip in [
            ("Input Background",   "input_bg",    "Text fields and lists"),
            ("Input Text Color",   "input_text",  "Text inside inputs"),
            ("Dropdown Background","dropdown_bg", "ComboBox dropdown"),
        ]: self._add_cr(cv, lbl, key, tip)
        cv.addStretch(); return scroll

    def _page_scrollbars(self):
        scroll, cv = self._make_page_scroll()
        cv.addWidget(self._section_lbl("SCROLLBAR COLORS"))
        for lbl,key,tip in [
            ("Scrollbar Color","scrollbar",       "Handle fill"),
            ("Hover Color",    "scrollbar_hover", "Handle on hover"),
        ]: self._add_cr(cv, lbl, key, tip)
        cv.addStretch(); return scroll

    def _page_background(self):
        scroll, cv = self._make_page_scroll()
        cv.addWidget(self._section_lbl("BACKGROUND IMAGE"))
        img_w = QWidget(); irl = QHBoxLayout(img_w)
        irl.setContentsMargins(0,0,0,0); irl.setSpacing(5)
        self._img_lbl = QLabel("No image")
        self._img_lbl.setStyleSheet("color:#444466;font-size:10px;font-style:italic;")
        self._img_lbl.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Preferred)
        irl.addWidget(self._img_lbl, 1)
        b1 = QPushButton("Browse"); b1.setFixedWidth(54); b1.clicked.connect(self._pick_image)
        b2 = QPushButton("✕"); b2.setFixedWidth(20); b2.clicked.connect(self._clear_image)
        irl.addWidget(b1); irl.addWidget(b2)
        cv.addWidget(img_w)
        cv.addWidget(self._hdiv()); cv.addWidget(self._section_lbl("SETTINGS"))
        self._add_sl(cv, "Image Opacity", "bg_opacity", 10, 100, "%", "Image opacity")
        self._glass_chk = QCheckBox("  Enable glass / blur effect")
        self._glass_chk.stateChanged.connect(self._on_change)
        cv.addWidget(self._glass_chk)
        cv.addStretch(); return scroll

    def _page_presets(self):
        scroll, cv = self._make_page_scroll()
        cv.addWidget(self._section_lbl("PRESET THEMES"))
        self.preset_combo = QComboBox(); self.preset_combo.setObjectName("preset_combo")
        self.preset_combo.addItems(list(PRESETS.keys()))
        cv.addWidget(self.preset_combo)
        btn_apply = QPushButton("  Apply Preset"); btn_apply.clicked.connect(self._apply_preset)
        cv.addWidget(btn_apply)
        cv.addWidget(self._hdiv()); cv.addWidget(self._section_lbl("PALETTE EXTRACTOR"))
        pal_info = QLabel("Upload a palette image or artwork to\nauto-generate a theme from its colors.")
        pal_info.setStyleSheet("color:#6A6E80;font-size:10px;line-height:1.4;")
        pal_info.setWordWrap(True); cv.addWidget(pal_info)
        btn_pal = QPushButton("⬆  Upload Palette Image")
        btn_pal.setObjectName("tb_palette"); btn_pal.clicked.connect(self._open_palette_image)
        cv.addWidget(btn_pal)
        # Palette colour strip
        self._palette_strip_frame = QFrame(); self._palette_strip_frame.setObjectName("palette_strip")
        self._palette_strip_frame.setFixedHeight(24)
        psl = QHBoxLayout(self._palette_strip_frame)
        psl.setContentsMargins(3,3,3,3); psl.setSpacing(3)
        self._palette_swatches: list[QFrame] = []
        for _ in range(5):
            sw = QFrame(); sw.setFixedSize(24, 18)
            sw.setStyleSheet("background:#22242C;border-radius:3px;")
            psl.addWidget(sw); self._palette_swatches.append(sw)
        psl.addStretch(); cv.addWidget(self._palette_strip_frame)
        self._palette_name_lbl = QLabel("No palette loaded")
        self._palette_name_lbl.setStyleSheet("color:#444466;font-size:10px;font-style:italic;")
        cv.addWidget(self._palette_name_lbl)
        cv.addStretch(); return scroll

    def _page_export(self):
        scroll, cv = self._make_page_scroll()
        cv.addWidget(self._section_lbl("CONFIG FILE"))
        be = QPushButton("⬆  Export Config (.json)"); be.clicked.connect(self._export_config)
        bi = QPushButton("⬇  Import Config (.json)"); bi.clicked.connect(self._import_config)
        cv.addWidget(be); cv.addWidget(bi)
        cv.addWidget(self._hdiv()); cv.addWidget(self._section_lbl("INSTALL IN HELIOS II"))
        inst = QLabel(
            "1.  Generate → Download theme\n\n"
            "2.  Copy .qss into:\n"
            "      HeliosII\\lib\\styles\\\n\n"
            "3.  Open Helios II\n\n"
            "4.  Tools → Preferences → Style\n\n"
            "5.  Select theme → Apply\n\n"
            "6.  Restart if needed\n\n"
            "ℹ  If Helios is detected,\n"
            "    Download auto-copies\n"
            "    the file for you."
        )
        inst.setObjectName("install_text"); inst.setWordWrap(True); cv.addWidget(inst)
        cv.addStretch(); return scroll

    # ── Preview panel ─────────────────────────────────────────────────────────
    def _build_preview_panel(self):
        w = QWidget(); w.setObjectName("preview_panel")
        vl = QVBoxLayout(w); vl.setContentsMargins(0,0,0,0); vl.setSpacing(0)

        # Thin header
        hdr = QWidget(); hdr.setFixedHeight(28)
        hdr.setStyleSheet("background:#0E1016;border-bottom:1px solid #1A1C22;")
        hl = QHBoxLayout(hdr); hl.setContentsMargins(10,0,10,0); hl.setSpacing(8)
        for col in ["#FF5F57","#FEBC2E","#28C840"]:
            d=QLabel("●"); d.setStyleSheet(f"color:{col};font-size:8px;background:transparent;")
            hl.addWidget(d)
        hl.addWidget(self._lbl("LIVE PREVIEW  —  Helios II",
            "color:#2E3040;font-size:9px;font-weight:700;letter-spacing:2px;background:transparent;"))
        hl.addStretch()
        live = QLabel("● LIVE"); live.setStyleSheet("color:#28C840;font-size:9px;background:transparent;")
        hl.addWidget(live)
        vl.addWidget(hdr)
        self.preview_container = PreviewContainer()
        vl.addWidget(self.preview_container, 1)
        return w

    # ── Bottom toolbar ────────────────────────────────────────────────────────
    def _build_bottom_bar(self):
        bar = QWidget(); bar.setObjectName("bottom_bar"); bar.setFixedHeight(46)
        bl = QHBoxLayout(bar); bl.setContentsMargins(10,6,10,6); bl.setSpacing(6)

        def tb(label, obj, tip, slot, enabled=True):
            b = QPushButton(label); b.setObjectName(obj)
            b.setToolTip(tip); b.setEnabled(enabled)
            b.clicked.connect(slot)
            return b

        self.btn_gen = tb("⬡  Generate", "tb_generate",
                          "Compile settings into a .qss file", self._generate)
        self.btn_dl  = tb("⬇  Download", "tb_download",
                          "Save the .qss file to disk", self._download, enabled=False)
        bl.addWidget(self.btn_gen)
        bl.addWidget(self.btn_dl)

        bl.addWidget(self._vdiv())

        btn_reset = tb("↺  Reset", "tb_reset",
                       "Reset to Default (Helios Dark)", self._reset)
        bl.addWidget(btn_reset)

        bl.addWidget(self._vdiv())

        btn_pal = tb("🎨  Palette", "tb_palette",
                     "Upload a palette image and extract theme colors",
                     self._open_palette_image)
        bl.addWidget(btn_pal)

        bl.addWidget(self._vdiv())

        btn_exp = tb("⬆  Export", "tb_generic", "Export config as JSON", self._export_config)
        btn_imp = tb("⬇  Import", "tb_generic", "Import config from JSON", self._import_config)
        bl.addWidget(btn_exp); bl.addWidget(btn_imp)

        bl.addStretch()
        return bar

    def _vdiv(self):
        f = QFrame(); f.setFrameShape(QFrame.VLine)
        f.setStyleSheet("color:#22242C;"); return f

    # ── legacy helpers (kept for palette dialog compatibility) ────────────────
    def _panel_header(self, text): return self._lbl(text)
    def _action_frame(self):
        f=QFrame(); f.setObjectName("action_section"); return f
    def _section_title(self, text, color="#555588"):
        return self._lbl(text, f"color:{color};font-size:10px;font-weight:700;letter-spacing:1.5px;background:transparent;")

    # ── Logic ─────────────────────────────────────────────────────────────────
    def _on_change(self): self._timer.start()

    def _collect(self):
        for k,r in self._color_rows.items(): self._theme[k] = r.value()
        for k,r in self._slider_rows.items(): self._theme[k] = r.value()
        self._theme["theme_name"] = self._name_edit.text().strip() or "MyTheme"
        self._theme["glass"] = self._glass_chk.isChecked()

    def _rebuild_and_apply(self):
        self._collect()
        qss = generate_qss(self._theme)
        self._generated_qss = qss
        self.preview_container.apply_qss(qss)
        self.btn_dl.setEnabled(True)

    def _load_values(self, vals: dict):
        for k,r in self._color_rows.items(): r.set_value(vals.get(k, "#888888"))
        for k,r in self._slider_rows.items(): r.set_value(vals.get(k, 100))
        self._name_edit.setText(vals.get("theme_name", "MyTheme"))
        self._glass_chk.setChecked(bool(vals.get("glass", False)))
        bg = vals.get("bg_image", "")
        if bg:
            self._img_lbl.setText(Path(bg).name)
            self._img_lbl.setStyleSheet("color:#6888AA;font-size:10px;")
        else:
            self._img_lbl.setText("No image")
            self._img_lbl.setStyleSheet("color:#444466;font-size:10px;font-style:italic;")
        self._rebuild_and_apply()

    def _apply_preset(self):
        name = self.preset_combo.currentText()
        if name in PRESETS:
            self._load_values(PRESETS[name])
            self._flash_status(f"✓  Preset \"{name}\" applied")

    def _reset(self):
        if QMessageBox.question(self, "Reset",
                "Reset all settings to Default (Helios Dark)?",
                QMessageBox.Yes | QMessageBox.No) == QMessageBox.Yes:
            self._load_values(PRESETS["Default (Helios Dark)"])
            self._flash_status("✓  Reset to defaults")

    def _generate(self):
        self._collect()
        self._generated_qss = generate_qss(self._theme)
        self.preview_container.apply_qss(self._generated_qss)
        self.btn_dl.setEnabled(True)
        self._flash_status("✓  Theme compiled — click Download")

    def _download(self):
        if not self._generated_qss: self._generate()
        name = self._theme.get("theme_name", "MyTheme")
        helios_dir = self._find_helios_styles_dir()
        default_path = str((helios_dir / f"{name}.qss") if helios_dir
                           else Path.home() / f"{name}.qss")
        path, _ = QFileDialog.getSaveFileName(self, "Save QSS Theme", default_path,
                    "QSS Stylesheets (*.qss);;All Files (*)")
        if not path: return
        try:
            save_path = Path(path)
            with open(save_path, "w", encoding="utf-8") as f: f.write(self._generated_qss)
        except Exception as e:
            QMessageBox.critical(self, "Save Error", str(e)); return

        saved_in_helios = helios_dir and save_path.parent == helios_dir
        self._flash_status(f"✓  Saved: {save_path.name}", color="#4EC94E")

        dlg = QDialog(self); dlg.setWindowTitle("Theme Saved ✓")
        dlg.setMinimumWidth(460); dlg.setStyleSheet(BUILDER_QSS)
        dl = QVBoxLayout(dlg); dl.setContentsMargins(18,16,18,16); dl.setSpacing(10)
        dl.addWidget(self._lbl(f"✅  {save_path.name}  saved!",
            "color:#2CC5D9;font-size:13px;font-weight:bold;"))
        pl = QLabel(str(save_path)); pl.setStyleSheet("color:#4A4E60;font-size:10px;font-family:monospace;")
        pl.setWordWrap(True); dl.addWidget(pl)

        if saved_in_helios:
            b = QLabel("🎯  Saved directly into Helios II styles folder!")
            b.setStyleSheet("color:#4EC94E;font-size:11px;font-weight:bold;"
                "background:#0E1A0E;border:1px solid #1A3A1A;border-radius:4px;padding:5px 8px;")
            dl.addWidget(b)
        elif helios_dir:
            b = QLabel(f"⚡  Helios II detected at:\n  {helios_dir}")
            b.setStyleSheet("color:#8888CC;font-size:10px;background:#0E0E1A;"
                "border:1px solid #2A2A4A;border-radius:4px;padding:5px 8px;")
            b.setWordWrap(True); dl.addWidget(b)
            copy_btn = QPushButton("📋  Copy theme into Helios styles folder")
            copy_btn.setStyleSheet("QPushButton{background:#0E1A0E;color:#4EC94E;border:1px solid #1A3A1A;"
                "border-radius:4px;padding:6px;font-weight:600;}"
                "QPushButton:hover{background:#4EC94E;color:#0D1A0D;}")
            def _do_copy():
                try:
                    import shutil; dest = helios_dir / save_path.name
                    shutil.copy2(str(save_path), str(dest))
                    copy_btn.setText("✅  Copied!"); copy_btn.setEnabled(False)
                except Exception as ex: QMessageBox.critical(dlg, "Copy Failed", str(ex))
            copy_btn.clicked.connect(_do_copy); dl.addWidget(copy_btn)

        sep = QFrame(); sep.setFrameShape(QFrame.HLine)
        sep.setStyleSheet("color:#22242C;"); dl.addWidget(sep)

        steps = QTextEdit(); steps.setReadOnly(True); steps.setFixedHeight(140)
        steps.setStyleSheet("background:#0E1016;color:#4A8A4A;border:1px solid #1A2A1A;"
            "border-radius:4px;font-family:'Cascadia Code',Consolas,monospace;font-size:10px;")
        steps.setPlainText(
            f"1.  Copy  {save_path.name}  into:\n"
            f"       HeliosII\\lib\\styles\\\n\n"
            f"2.  Open Helios II\n\n"
            f"3.  Tools \u2192 Preferences \u2192 Style\n\n"
            f"4.  Select  \"{name}\"  from the list\n\n"
            f"5.  Click Apply or OK\n\n"
            f"6.  Restart Helios II if needed"
        )
        dl.addWidget(steps)
        open_btn = QPushButton("📂  Open folder")
        open_btn.setStyleSheet("QPushButton{background:#1E2028;color:#6A6E80;border:1px solid #2A2C3A;"
            "border-radius:4px;padding:5px;}"
            "QPushButton:hover{color:#C8CAD4;border-color:#3C3E50;}")
        open_btn.clicked.connect(lambda: QDesktopServices.openUrl(
            QUrl.fromLocalFile(str(save_path.parent))))
        ok_btn = QPushButton("Done"); ok_btn.clicked.connect(dlg.accept)
        row = QHBoxLayout(); row.addWidget(open_btn); row.addStretch(); row.addWidget(ok_btn)
        dl.addLayout(row)
        dlg.exec_()

    def _find_helios_styles_dir(self):
        candidates = []
        for drive in ["C","D","E","F"]:
            root = Path(f"{drive}:/")
            candidates += [
                root/"HeliosII"/"lib"/"styles",
                root/"Helios II"/"lib"/"styles",
                root/"Program Files"/"HeliosII"/"lib"/"styles",
            ]
        home = Path.home()
        candidates += [
            home/"HeliosII"/"lib"/"styles",
            home/"Desktop"/"HeliosII"/"lib"/"styles",
        ]
        for p in candidates:
            if p.exists(): return p
        return None

    def _export_config(self):
        self._collect()
        path,_ = QFileDialog.getSaveFileName(self,"Export Config",
            str(Path.home()/f"{self._theme['theme_name']}_config.json"),
            "JSON (*.json);;All Files (*)")
        if path:
            try:
                with open(path,"w") as f: json.dump(self._theme,f,indent=2)
                self._flash_status("✓  Config exported")
            except Exception as e: QMessageBox.critical(self,"Error",str(e))

    def _import_config(self):
        path,_ = QFileDialog.getOpenFileName(self,"Import Config",str(Path.home()),
            "JSON (*.json);;All Files (*)")
        if path:
            try:
                with open(path) as f: data=json.load(f)
                self._load_values(data); self._flash_status("✓  Config imported")
            except Exception as e: QMessageBox.critical(self,"Error",str(e))

    def _pick_image(self):
        path,_ = QFileDialog.getOpenFileName(self,"Choose Background Image",str(Path.home()),
            "Images (*.png *.jpg *.jpeg *.bmp *.svg);;All Files (*)")
        if path:
            self._theme["bg_image"] = path
            self._img_lbl.setText(Path(path).name)
            self._img_lbl.setStyleSheet("color:#6888AA;font-size:10px;")
            self._on_change()

    def _clear_image(self):
        self._theme["bg_image"] = ""
        self._img_lbl.setText("No image")
        self._img_lbl.setStyleSheet("color:#444466;font-size:10px;font-style:italic;")
        self._on_change()

    def _open_palette_image(self):
        path, _ = QFileDialog.getOpenFileName(self,"Upload Palette Image",str(Path.home()),
            "Images (*.png *.jpg *.jpeg *.bmp *.gif *.tiff *.webp);;All Files (*)")
        if not path: return
        dlg = PaletteExtractDialog(path, self)
        dlg.setStyleSheet(BUILDER_QSS)
        dlg.paletteAccepted.connect(self._on_palette_accepted)
        dlg.exec_()

    def _on_palette_accepted(self, colors: list):
        self._current_palette = colors
        for i, sw in enumerate(self._palette_swatches):
            if i < len(colors):
                sw.setStyleSheet(f"background:{colors[i]};border-radius:3px;")
        name = self._name_edit.text().strip() or "PaletteTheme"
        new_theme = assign_palette_to_theme(colors, theme_name=name)
        self._load_values(new_theme)
        self._palette_name_lbl.setText(f"{len(colors)} colors extracted")
        self._palette_name_lbl.setStyleSheet("color:#8855CC;font-size:10px;")
        self._flash_status("✓  Palette applied — adjust colors as needed")

    def _show_about(self):
        dlg = AboutDialog(self)
        dlg.exec_()

    def _flash_status(self, msg: str, color: str = "#2CC5D9"):
        self._status_lbl.setText(msg)
        self._status_lbl.setStyleSheet(
            f"color:{color};font-size:10px;background:transparent;min-width:200px;")
        QTimer.singleShot(5000, lambda: self._status_lbl.setText(""))


# ══════════════════════════════════════════════════════════════════════════════
#  SPLASH SCREEN
# ══════════════════════════════════════════════════════════════════════════════
class SplashScreen(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowFlags(Qt.FramelessWindowHint | Qt.WindowStaysOnTopHint |
                            Qt.SplashScreen)
        self.setAttribute(Qt.WA_TranslucentBackground)
        self.setFixedSize(460, 280)

        # Centre on screen
        screen = QApplication.primaryScreen().geometry()
        self.move(
            (screen.width()  - self.width())  // 2,
            (screen.height() - self.height()) // 2,
        )

        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(0)

        # Dark rounded card
        card = QWidget()
        card.setStyleSheet(
            "background:qlineargradient(x1:0,y1:0,x2:0,y2:1,"
            "stop:0 #12141E,stop:1 #0A0C14);"
            "border:1px solid #2CC5D9;"
            "border-radius:14px;"
        )
        cl = QVBoxLayout(card)
        cl.setContentsMargins(30, 28, 30, 28)
        cl.setSpacing(14)
        cl.setAlignment(Qt.AlignCenter)

        # Logo image
        logo_lbl = QLabel()
        logo_lbl.setAlignment(Qt.AlignCenter)
        logo_lbl.setStyleSheet("background:transparent;border:none;")
        pix = _logo_pixmap(120)
        logo_lbl.setPixmap(pix)
        cl.addWidget(logo_lbl)

        # App name
        name_lbl = QLabel("Helios II  QSS Theme Generator")
        name_lbl.setAlignment(Qt.AlignCenter)
        name_lbl.setStyleSheet(
            "color:#D0D8F0;font-size:15px;font-weight:700;"
            "background:transparent;border:none;"
            "font-family:\"Segoe UI\",sans-serif;"
        )
        cl.addWidget(name_lbl)

        # Version
        ver_lbl = QLabel(f"Version {APP_VERSION}")
        ver_lbl.setAlignment(Qt.AlignCenter)
        ver_lbl.setStyleSheet(
            "color:#2CC5D9;font-size:11px;background:transparent;border:none;"
        )
        cl.addWidget(ver_lbl)

        # Loading bar (purely cosmetic)
        self._bar = QProgressBar()
        self._bar.setRange(0, 100)
        self._bar.setValue(0)
        self._bar.setTextVisible(False)
        self._bar.setFixedHeight(3)
        self._bar.setStyleSheet(
            "QProgressBar{background:#1A1C26;border:none;border-radius:2px;}"
            "QProgressBar::chunk{background:qlineargradient(x1:0,y1:0,x2:1,y2:0,"
            "stop:0 #7B2FFF,stop:1 #2CC5D9);border-radius:2px;}"
        )
        cl.addWidget(self._bar)

        layout.addWidget(card)

        # Animate the loading bar
        self._anim_timer = QTimer()
        self._anim_timer.setInterval(16)   # ~60 fps
        self._anim_timer.timeout.connect(self._tick)
        self._anim_val = 0.0
        self._anim_timer.start()

    def _tick(self):
        self._anim_val = min(100.0, self._anim_val + 2.2)
        self._bar.setValue(int(self._anim_val))
        if self._anim_val >= 100:
            self._anim_timer.stop()


# ══════════════════════════════════════════════════════════════════════════════
#  ABOUT DIALOG
# ══════════════════════════════════════════════════════════════════════════════
class AboutDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("About Theme Gen")
        self.setFixedSize(380, 320)
        self.setStyleSheet(
            "QDialog{background:#12141E;}"
            "QLabel{background:transparent;}"
            "QPushButton{background:#1A2A3A;color:#2CC5D9;border:1px solid #2CC5D9;"
            "border-radius:5px;padding:6px 20px;font-weight:600;}"
            "QPushButton:hover{background:#2CC5D9;color:#0A0C14;}"
        )

        # Set dialog icon
        icon_path = _asset("assets/logo/themegen.ico")
        if os.path.exists(icon_path):
            self.setWindowIcon(QIcon(icon_path))

        layout = QVBoxLayout(self)
        layout.setContentsMargins(28, 24, 28, 24)
        layout.setSpacing(12)
        layout.setAlignment(Qt.AlignCenter)

        # Logo
        logo_lbl = QLabel(); logo_lbl.setAlignment(Qt.AlignCenter)
        pix = _logo_pixmap(90)
        logo_lbl.setPixmap(pix)
        layout.addWidget(logo_lbl)

        # Title
        t = QLabel("Theme Gen")
        t.setAlignment(Qt.AlignCenter)
        t.setStyleSheet("color:#D0D8F0;font-size:18px;font-weight:700;")
        layout.addWidget(t)

        # Sub
        s = QLabel("Helios II QSS Theme Generator")
        s.setAlignment(Qt.AlignCenter)
        s.setStyleSheet("color:#6A6E80;font-size:11px;")
        layout.addWidget(s)

        # Version
        v = QLabel(f"Version {APP_VERSION}")
        v.setAlignment(Qt.AlignCenter)
        v.setStyleSheet("color:#2CC5D9;font-size:11px;")
        layout.addWidget(v)

        # Description
        d = QLabel(
            "Visually design and export custom QSS themes\n"
            "for the Helios II capture and scripting platform."
        )
        d.setAlignment(Qt.AlignCenter)
        d.setWordWrap(True)
        d.setStyleSheet("color:#5A5E70;font-size:10px;line-height:1.5;")
        layout.addWidget(d)

        layout.addStretch()

        btn = QPushButton("Close")
        btn.clicked.connect(self.accept)
        btn.setFixedWidth(100)
        layout.addWidget(btn, alignment=Qt.AlignCenter)


# ══════════════════════════════════════════════════════════════════════════════
#  ENTRY POINT
# ══════════════════════════════════════════════════════════════════════════════
def main():
    QApplication.setAttribute(Qt.AA_EnableHighDpiScaling, True)
    QApplication.setAttribute(Qt.AA_UseHighDpiPixmaps, True)
    app = QApplication(sys.argv)
    app.setApplicationName("Theme Gen")
    app.setOrganizationName("Helios")
    app.setStyle("Fusion")

    # ── Set application-wide icon (taskbar + window chrome) ──────────────────
    ico_path = _asset("assets/logo/themegen.ico")
    if os.path.exists(ico_path):
        app.setWindowIcon(QIcon(ico_path))

    # ── Splash screen ─────────────────────────────────────────────────────────
    splash = SplashScreen()
    splash.show()
    app.processEvents()

    # ── Build main window (hidden while splash is visible) ───────────────────
    w = HeliosThemeGenerator()

    # Wait for splash bar to finish (~1.6 s at 60fps × 2.2 per tick)
    QTimer.singleShot(1650, lambda: (splash.close(), w.show()))

    sys.exit(app.exec_())

if __name__ == "__main__":
    main()
