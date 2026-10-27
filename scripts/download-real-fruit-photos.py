#!/usr/bin/env python3
"""Download ready-made fruit photos (Wikimedia Commons) and fit them for Mamelia UI."""

from __future__ import annotations

import json
import time
import urllib.error
import urllib.parse
import urllib.request
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "mobile" / "assets" / "images" / "fruits"
SIZE = 512
UA = "MameliaMomCare/1.0 (student diploma project; fruit calendar assets)"
MIN_REAL_BYTES = 50000  # already-downloaded real photos are much larger

# Concrete Commons files (photos). Same fruit variants reuse one photo at different scales.
FRUIT_SOURCES: list[tuple[str, list[str], str, float]] = [
    # (out_file, candidate titles, label, scale)
    ("fruit_01.png", ["File:Poppy seeds.jpg", "File:Black_poppy_seeds.jpg"], "Маковое зерно", 0.78),
    ("fruit_02.png", ["File:Sa white sesame seeds.jpg", "File:Sesame_seeds.jpg"], "Кунжутное семечко", 0.78),
    ("fruit_03.png", ["File:Rice_grains_(IRRI).jpg"], "Рисовое зёрнышко", 0.82),
    ("fruit_04.png", ["File:Green_peas.jpg"], "Горошина", 0.78),
    ("fruit_05.png", ["File:Blueberries.jpg"], "Черника", 0.82),
    ("fruit_06.png", ["File:Raspberries_(Rubus_idaeus).jpg"], "Малина", 0.82),
    ("fruit_07.png", ["File:Green grape cluster on a white background.jpg"], "Виноградина", 0.78),
    ("fruit_08.png", ["File:Green olives.jpg", "File:Olives from Spain.jpg"], "Оливка", 0.80),
    ("fruit_09.png", ["File:Kumquat.jpg"], "Кумкват", 0.78),
    ("fruit_10.png", ["File:Figs.jpg", "File:Fig fruit.jpg"], "Инжир", 0.84),
    ("fruit_11.png", ["File:Lime-Whole-Split.jpg"], "Лайм", 0.80),
    ("fruit_12.png", ["File:Plums.jpg"], "Слива", 0.80),
    ("fruit_13.png", ["File:Nectarines.jpg", "File:White nectarine fruit.jpg", "File:Peaches nectarine.jpg"], "Нектарин", 0.80),
    ("fruit_14.png", ["File:Red_Apple.jpg"], "Яблоко", 0.82),
    ("fruit_15.png", ["File:Avocado.jpg", "File:Hass avocado (seed removed).jpg"], "Авокадо", 0.82),
    ("fruit_16.png", ["File:Williams_Bon_Chretien_pears.jpg", "File:Pear_DSC01227.jpg", "File:Pears.jpg"], "Груша", 0.80),
    ("fruit_17.png", ["File:Red bell pepper.jpg", "File:Capsicum annuum - red.jpg"], "Сладкий перец", 0.80),
    ("fruit_18.png", ["File:Mangos_-_single_and_halved.jpg", "File:Mangoes_with_cross_section.jpg"], "Манго", 0.82),
    ("fruit_19.png", ["File:Banana_on_white_background.jpg", "File:Banana-Single.jpg"], "Банан", 0.78),
    ("fruit_20.png", ["File:Citrus paradisi (Grapefruit, pink) white bg.jpg", "File:Grapefruit.jpg"], "Грейпфрут", 0.82),
    ("fruit_21.png", ["File:Papaya_cross_section_BNC.jpg", "File:Papaya_01.JPG"], "Папайя", 0.82),
    ("fruit_22.png", ["File:Solanum melongena fruit.jpg", "File:Aubergine.jpg"], "Баклажан", 0.80),
    ("fruit_23.png", ["File:Corncobs.jpg", "File:Ear of corn.jpg"], "Кукурузный початок", 0.78),
    ("fruit_24.png", ["File:Cauliflower.JPG", "File:Cauliflower_head.jpg"], "Цветная капуста", 0.82),
    ("fruit_25.png", ["File:Coconut.jpg", "File:Coconut_(Cocos_nucifera)_whole_and_in_cross_section.jpg"], "Кокос", 0.82),
    ("fruit_26.png", ["File:White cabbage.jpg", "File:White_cabbage_at_the_market_place.jpg"], "Кочан капусты", 0.82),
    ("fruit_27.png", ["File:Cantaloupe melon.jpg", "File:Cantaloupe_and_canary_melon.jpg"], "Небольшая дыня", 0.70),
    ("fruit_28.png", ["File:Cantaloupe melon.jpg", "File:Cantaloupe_and_canary_melon.jpg"], "Дыня", 0.82),
    ("fruit_29.png", ["File:Cantaloupe melon.jpg", "File:Cantaloupe_and_canary_melon.jpg"], "Крупная дыня", 0.92),
    ("fruit_30.png", ["File:Watermelon.jpg", "File:Watermelon_cross_bnw.jpg"], "Небольшой арбуз", 0.68),
    ("fruit_31.png", ["File:Watermelon.jpg", "File:Watermelon_cross_bnw.jpg"], "Средний арбуз", 0.78),
    ("fruit_32.png", ["File:Zucchini.jpg", "File:Zucchini-Whole.jpg"], "Кабачок", 0.76),
    ("fruit_33.png", ["File:Zucchini.jpg", "File:Zucchini-Whole.jpg"], "Крупный кабачок", 0.90),
    ("fruit_34.png", ["File:Pumpkin.jpg", "File:Pumpkins_1.jpg"], "Тыква", 0.80),
    ("fruit_35.png", ["File:Pumpkin.jpg", "File:Pumpkins_1.jpg"], "Крупная тыква", 0.92),
    ("fruit_36.png", ["File:Watermelon.jpg", "File:Watermelon_cross_bnw.jpg"], "Арбуз", 0.86),
    ("fruit_37.png", ["File:Watermelon.jpg", "File:Watermelon_cross_bnw.jpg"], "Крупный арбуз", 0.94),
    ("fruit_38.png", ["File:Watermelon.jpg", "File:Watermelon_cross_bnw.jpg"], "Очень крупный арбуз", 0.98),
]

SEARCH_FALLBACKS: dict[str, str] = {
    "fruit_13.png": "nectarine fruit",
    "fruit_15.png": "avocado fruit",
    "fruit_16.png": "pear fruit",
    "fruit_17.png": "red bell pepper",
    "fruit_18.png": "mango fruit",
    "fruit_19.png": "banana fruit",
    "fruit_21.png": "papaya fruit",
    "fruit_22.png": "eggplant",
    "fruit_23.png": "corn cob",
    "fruit_24.png": "cauliflower",
    "fruit_25.png": "coconut",
    "fruit_26.png": "cabbage",
    "fruit_27.png": "cantaloupe",
    "fruit_28.png": "cantaloupe",
    "fruit_29.png": "cantaloupe",
    "fruit_30.png": "watermelon",
    "fruit_31.png": "watermelon",
    "fruit_32.png": "zucchini",
    "fruit_33.png": "zucchini",
    "fruit_34.png": "pumpkin",
    "fruit_35.png": "pumpkin",
    "fruit_36.png": "watermelon",
    "fruit_37.png": "watermelon",
    "fruit_38.png": "watermelon",
}


def request_json(params: dict) -> dict:
    query = urllib.parse.urlencode({**params, "format": "json"})
    url = f"https://commons.wikimedia.org/w/api.php?{query}"
    return json.loads(download_bytes(url).decode("utf-8"))


def download_bytes(url: str, retries: int = 6) -> bytes:
    delay = 2.0
    last_err: Exception | None = None
    for _ in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=90) as resp:
                return resp.read()
        except urllib.error.HTTPError as exc:
            last_err = exc
            if exc.code in (429, 503):
                time.sleep(delay)
                delay = min(delay * 1.8, 30)
                continue
            raise
        except Exception as exc:  # noqa: BLE001
            last_err = exc
            time.sleep(delay)
            delay = min(delay * 1.5, 20)
    assert last_err is not None
    raise last_err


def resolve_thumb_url(title: str, width: int = 1280) -> tuple[str, str] | None:
    data = request_json(
        {
            "action": "query",
            "titles": title,
            "prop": "imageinfo",
            "iiprop": "url|mime|extmetadata",
            "iiurlwidth": str(width),
        }
    )
    pages = data.get("query", {}).get("pages", {})
    for page in pages.values():
        if "missing" in page:
            return None
        infos = page.get("imageinfo") or []
        if not infos:
            return None
        info = infos[0]
        url = info.get("thumburl") or info.get("url")
        if not url:
            return None
        license_name = (
            ((info.get("extmetadata") or {}).get("LicenseShortName") or {}).get("value")
            or "unknown"
        )
        return url, license_name
    return None


def search_file_title(query: str) -> str | None:
    data = request_json(
        {
            "action": "query",
            "generator": "search",
            "gsrsearch": f"filetype:bitmap {query}",
            "gsrnamespace": "6",
            "gsrlimit": "10",
            "prop": "imageinfo",
            "iiprop": "url|mime",
            "iiurlwidth": "800",
        }
    )
    pages = data.get("query", {}).get("pages", {})
    ranked = sorted(pages.values(), key=lambda p: p.get("index", 999))
    for page in ranked:
        title = page.get("title")
        infos = page.get("imageinfo") or []
        if not title or not infos:
            continue
        mime = (infos[0].get("mime") or "").lower()
        if mime.startswith("image/") and "svg" not in mime:
            return title
    return None


def fit_on_plate(src: Image.Image, scale: float) -> Image.Image:
    img = src.convert("RGBA")
    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    plate = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(plate, "RGBA")
    pad = 8
    draw.ellipse((pad, pad, SIZE - pad, SIZE - pad), fill=(255, 236, 228, 255))
    canvas.alpha_composite(plate)

    side = min(img.size)
    left = (img.width - side) // 2
    top = (img.height - side) // 2
    cropped = img.crop((left, top, left + side, top + side))

    target = max(64, int(SIZE * 0.78 * scale))
    fitted = cropped.resize((target, target), Image.Resampling.LANCZOS)

    mask = Image.new("L", (target, target), 0)
    ImageDraw.Draw(mask).ellipse((2, 2, target - 3, target - 3), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(radius=1.2))
    fitted.putalpha(mask)

    ox = (SIZE - target) // 2
    oy = (SIZE - target) // 2
    canvas.alpha_composite(fitted, (ox, oy))
    return canvas


def resolve_any(titles: list[str], out_name: str) -> tuple[str, str, str] | None:
    for title in titles:
        resolved = resolve_thumb_url(title)
        if resolved:
            url, license_name = resolved
            return title, url, license_name
        time.sleep(0.8)

    query = SEARCH_FALLBACKS.get(out_name)
    if not query:
        return None
    found = search_file_title(query)
    if not found:
        return None
    resolved = resolve_thumb_url(found)
    if not resolved:
        return None
    url, license_name = resolved
    return found, url, license_name


def process_one(out_name: str, titles: list[str], scale: float) -> tuple[bool, str]:
    out_path = OUT_DIR / out_name
    if out_path.exists() and out_path.stat().st_size >= MIN_REAL_BYTES:
        return True, f"skip existing real photo ({out_path.stat().st_size} bytes)"

    resolved = resolve_any(titles, out_name)
    if resolved is None:
        return False, f"could not resolve {titles}"

    used_title, url, license_name = resolved
    raw = download_bytes(url)
    photo = Image.open(BytesIO(raw))
    photo = ImageOps.exif_transpose(photo)
    out = fit_on_plate(photo, scale)
    out.save(out_path, "PNG", optimize=True)
    return True, f"{used_title} [{license_name}] -> {out_name} ({out_path.stat().st_size} bytes)"


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    attributions: list[str] = []
    failed: list[str] = []

    for out_name, titles, label, scale in FRUIT_SOURCES:
        try:
            ok, message = process_one(out_name, titles, scale)
            print(("OK" if ok else "FAIL"), label, "-", message)
            if ok:
                attributions.append(f"{label}: {message}")
            else:
                failed.append(f"{label}: {message}")
        except Exception as exc:  # noqa: BLE001
            msg = f"{label}: {exc}"
            print("ERR", msg)
            failed.append(msg)
        time.sleep(1.6)

    attribution = OUT_DIR / "ATTRIBUTION.txt"
    previous = ""
    if attribution.exists():
        previous = attribution.read_text(encoding="utf-8")
    attribution.write_text(
        "Фотографии фруктов и овощей: Wikimedia Commons (готовые фото, не генерация).\n"
        "Лицензии исходников: CC BY / CC BY-SA / CC0 / Public domain — см. страницы файлов на Commons.\n"
        "Обработка для UI: квадратный кроп + мягкий круглый фон Mamelia.\n"
        "Иллюстрации малыша (fruit_39–41 / babies/*) — отдельные ассеты проекта, не фото фруктов.\n\n"
        + "\n".join(attributions)
        + ("\n\nFAILED:\n" + "\n".join(failed) if failed else "")
        + ("\n\n--- previous ---\n" + previous if previous else "")
        + "\n",
        encoding="utf-8",
    )
    print("done", "ok", len(attributions), "failed", len(failed))
    if failed:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
