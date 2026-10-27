#!/usr/bin/env python3
"""Re-download fruit photos and place on soft peach plate WITHOUT white studio background."""

from __future__ import annotations

import importlib.util
import time
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "mobile" / "assets" / "images" / "fruits"
SIZE = 512
PLATE = (255, 236, 228, 255)

# Prefer clean single-subject photos (white/simple bg) so size reads clearly.
CLEAN_SOURCES: list[tuple[str, list[str], str, float]] = [
    ("fruit_01.png", ["File:Poppy seeds.jpg"], "Маковое зерно", 0.86),
    ("fruit_02.png", ["File:Sa white sesame seeds.jpg"], "Кунжутное семечко", 0.86),
    ("fruit_03.png", ["File:Rice_grains_(IRRI).jpg"], "Рисовое зёрнышко", 0.86),
    ("fruit_04.png", ["File:Green_peas.jpg"], "Горошина", 0.84),
    ("fruit_05.png", ["File:Blueberries.jpg"], "Черника", 0.88),
    ("fruit_06.png", ["File:Raspberries_(Rubus_idaeus).jpg"], "Малина", 0.88),
    ("fruit_07.png", ["File:Green grape cluster on a white background.jpg"], "Виноградина", 0.86),
    ("fruit_08.png", ["File:Green olives.jpg"], "Оливка", 0.84),
    ("fruit_09.png", ["File:Kumquat.jpg"], "Кумкват", 0.86),
    ("fruit_10.png", ["File:Figs.jpg"], "Инжир", 0.88),
    ("fruit_11.png", ["File:Lime-Whole-Split.jpg"], "Лайм", 0.88),
    ("fruit_12.png", ["File:Plums.jpg"], "Слива", 0.88),
    ("fruit_13.png", ["File:Nectarines.jpg"], "Нектарин", 0.90),
    ("fruit_14.png", ["File:Red_Apple.jpg"], "Яблоко", 0.90),
    ("fruit_15.png", ["File:Avocado.jpg"], "Авокадо", 0.90),
    ("fruit_16.png", ["File:Pears.jpg"], "Груша", 0.90),
    ("fruit_17.png", ["File:Red bell pepper.jpg"], "Сладкий перец", 0.90),
    ("fruit_18.png", ["File:Mangos_-_single_and_halved.jpg"], "Манго", 0.90),
    ("fruit_19.png", ["File:Banana_on_white_background.jpg"], "Банан", 0.88),
    ("fruit_20.png", ["File:Grapefruit cut.jpg"], "Грейпфрут", 0.90),
    ("fruit_21.png", ["File:Papaya_cross_section_BNC.jpg"], "Папайя", 0.90),
    ("fruit_22.png", ["File:Solanum melongena fruit.jpg"], "Баклажан", 0.88),
    ("fruit_23.png", ["File:Corncobs.jpg"], "Кукурузный початок", 0.88),
    ("fruit_24.png", ["File:Cauliflower.JPG"], "Цветная капуста", 0.90),
    ("fruit_25.png", ["File:Coconut.jpg"], "Кокос", 0.90),
    ("fruit_26.png", ["File:White cabbage.jpg"], "Кочан капусты", 0.90),
    ("fruit_27.png", ["File:Cantaloupe_and_canary_melon.jpg"], "Небольшая дыня", 0.72),
    ("fruit_28.png", ["File:Cantaloupe_and_canary_melon.jpg"], "Дыня", 0.86),
    ("fruit_29.png", ["File:Cantaloupe_and_canary_melon.jpg"], "Крупная дыня", 0.96),
    ("fruit_30.png", ["File:Watermelon.jpg"], "Небольшой арбуз", 0.70),
    ("fruit_31.png", ["File:Watermelon.jpg"], "Средний арбуз", 0.80),
    ("fruit_32.png", ["File:Zucchini.jpg"], "Кабачок", 0.86),
    ("fruit_33.png", ["File:Zucchini.jpg"], "Крупный кабачок", 0.96),
    ("fruit_34.png", ["File:Pumpkin.jpg"], "Тыква", 0.88),
    ("fruit_35.png", ["File:Pumpkin.jpg"], "Крупная тыква", 0.96),
    ("fruit_36.png", ["File:Watermelon.jpg"], "Арбуз", 0.88),
    ("fruit_37.png", ["File:Watermelon.jpg"], "Крупный арбуз", 0.94),
    ("fruit_38.png", ["File:Watermelon.jpg"], "Очень крупный арбуз", 0.98),
]


def load_downloader():
    path = ROOT / "scripts" / "download-real-fruit-photos.py"
    spec = importlib.util.spec_from_file_location("fruit_dl", path)
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(mod)
    return mod


def remove_studio_background(img: Image.Image) -> Image.Image:
    """Make near-white / light-gray studio backgrounds transparent."""
    rgba = img.convert("RGBA")
    pixels = rgba.load()
    w, h = rgba.size

    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            mx = max(r, g, b)
            mn = min(r, g, b)
            # White / light gray / pale beige studio backdrops
            if mx >= 228 and (mx - mn) <= 28:
                pixels[x, y] = (r, g, b, 0)
            elif mx >= 210 and (mx - mn) <= 18 and (r + g + b) / 3 >= 200:
                pixels[x, y] = (r, g, b, 0)

    # Soften cut edges a bit
    alpha = rgba.getchannel("A").filter(ImageFilter.GaussianBlur(radius=0.8))
    rgba.putalpha(alpha)
    return rgba


def autofit_subject(img: Image.Image) -> Image.Image:
    """Crop to opaque subject bbox so the fruit fills the circle better."""
    alpha = img.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        return img
    pad = int(max(img.size) * 0.04)
    left = max(0, bbox[0] - pad)
    top = max(0, bbox[1] - pad)
    right = min(img.width, bbox[2] + pad)
    bottom = min(img.height, bbox[3] + pad)
    return img.crop((left, top, right, bottom))


def fit_on_peach(src: Image.Image, scale: float) -> Image.Image:
    cleaned = remove_studio_background(src)
    cleaned = autofit_subject(cleaned)

    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    plate = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    ImageDraw.Draw(plate).ellipse((6, 6, SIZE - 6, SIZE - 6), fill=PLATE)
    canvas.alpha_composite(plate)

    # Fit subject into a square box, keep aspect
    max_side = max(64, int(SIZE * 0.82 * scale))
    ratio = cleaned.width / max(cleaned.height, 1)
    if ratio >= 1:
        tw = max_side
        th = max(1, int(max_side / ratio))
    else:
        th = max_side
        tw = max(1, int(max_side * ratio))

    fitted = cleaned.resize((tw, th), Image.Resampling.LANCZOS)

    # Circular soft clip so corners don't stick out of the plate
    clip = Image.new("L", (tw, th), 0)
    # use full subject alpha; also soft-round only if nearly square
    subject_alpha = fitted.getchannel("A")
    clip = subject_alpha

    ox = (SIZE - tw) // 2
    oy = (SIZE - th) // 2
    canvas.alpha_composite(fitted, (ox, oy))

    # Final circular mask for the whole card
    round_mask = Image.new("L", (SIZE, SIZE), 0)
    ImageDraw.Draw(round_mask).ellipse((6, 6, SIZE - 6, SIZE - 6), fill=255)
    round_mask = round_mask.filter(ImageFilter.GaussianBlur(0.8))
    out = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    out.paste(canvas, (0, 0))
    out.putalpha(Image.composite(out.getchannel("A"), Image.new("L", (SIZE, SIZE), 0), round_mask))
    # restore plate+fruit with circular edge
    final = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    final.paste(canvas, mask=round_mask)
    return final


def main() -> None:
    dl = load_downloader()
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    ok_n = 0
    fail: list[str] = []

    for out_name, titles, label, scale in CLEAN_SOURCES:
        try:
            resolved = dl.resolve_any(titles, out_name)
            if resolved is None:
                fail.append(f"{label}: resolve failed")
                print("FAIL", label)
                continue
            used_title, url, license_name = resolved
            raw = dl.download_bytes(url)
            photo = ImageOps.exif_transpose(Image.open(BytesIO(raw)))
            out = fit_on_peach(photo, scale)
            path = OUT_DIR / out_name
            out.save(path, "PNG", optimize=True)
            ok_n += 1
            print("OK", label, used_title, license_name, path.stat().st_size)
        except Exception as exc:  # noqa: BLE001
            fail.append(f"{label}: {exc}")
            print("ERR", label, exc)
        time.sleep(1.5)

    (OUT_DIR / "ATTRIBUTION.txt").write_text(
        "Фотографии фруктов (fruit_01–38): Wikimedia Commons.\n"
        "Обработка: убран белый студийный фон, один объект на мягком фоне Mamelia,\n"
        "чтобы лучше читалось соотношение размеров.\n"
        "fruit_39–41 — иллюстрации малыша (см. assets/images/babies/).\n",
        encoding="utf-8",
    )
    print("done", ok_n, "failed", len(fail))
    if fail:
        print("\n".join(fail))
        raise SystemExit(1)


if __name__ == "__main__":
    main()
