#!/usr/bin/env python3
"""Generate unique soft living fruit/baby illustrations (no OpenMoji)."""

from __future__ import annotations

import math
import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
FRUIT_DIR = ROOT / "mobile" / "assets" / "images" / "fruits"
BABY_DIR = ROOT / "mobile" / "assets" / "images" / "babies"
SIZE = 256


def soft_circle(
    draw: ImageDraw.ImageDraw,
    center: tuple[float, float],
    radius: float,
    color: tuple[int, int, int, int],
    steps: int = 10,
) -> None:
    cx, cy = center
    r, g, b, a = color
    for i in range(steps, 0, -1):
        t = i / steps
        alpha = int(a * (0.35 + 0.65 * t * t))
        rad = radius * (0.55 + 0.45 * t)
        draw.ellipse(
            (cx - rad, cy - rad, cx + rad, cy + rad),
            fill=(r, g, b, alpha),
        )


def highlight(
    draw: ImageDraw.ImageDraw,
    center: tuple[float, float],
    radius: float,
) -> None:
    cx, cy = center
    soft_circle(draw, (cx - radius * 0.28, cy - radius * 0.32), radius * 0.28, (255, 255, 255, 110), 6)


def leaf(
    draw: ImageDraw.ImageDraw,
    tip: tuple[float, float],
    angle_deg: float,
    length: float,
    color: tuple[int, int, int, int] = (86, 150, 84, 230),
) -> None:
    angle = math.radians(angle_deg)
    bx = tip[0] - math.cos(angle) * length
    by = tip[1] - math.sin(angle) * length
    px = math.cos(angle + math.pi / 2) * length * 0.28
    py = math.sin(angle + math.pi / 2) * length * 0.28
    draw.polygon(
        [
            tip,
            (bx + px, by + py),
            (bx - px * 0.2, by - py * 0.2),
            (bx - px, by - py),
        ],
        fill=color,
    )


def save_rgba(img: Image.Image, path: Path, *, blur: bool = True) -> None:
    out = img.filter(ImageFilter.GaussianBlur(radius=0.8)) if blur else img
    out.save(path, "PNG")


def make_base() -> tuple[Image.Image, ImageDraw.ImageDraw]:
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img, "RGBA")
    # soft peach plate
    soft_circle(draw, (SIZE / 2, SIZE / 2), 118, (255, 236, 228, 255), 14)
    return img, draw


FRUITS: list[tuple[str, callable]] = []


def fruit_poppy(path: Path) -> None:
    img, draw = make_base()
    soft_circle(draw, (128, 140), 18, (55, 40, 48, 250), 8)
    soft_circle(draw, (128, 140), 8, (90, 70, 80, 255), 4)
    leaf(draw, (128, 118), -90, 28)
    save_rgba(img, path)


def fruit_sesame(path: Path) -> None:
    img, draw = make_base()
    for i, (x, y) in enumerate([(110, 120), (138, 118), (124, 145), (146, 142), (108, 148)]):
        soft_circle(draw, (x, y), 10 + (i % 2), (232, 210, 160, 250), 6)
        highlight(draw, (x, y), 10)
    save_rgba(img, path)


def fruit_rice(path: Path) -> None:
    img, draw = make_base()
    for i in range(7):
        x = 100 + i * 8
        y = 120 + (i % 3) * 10
        draw.ellipse((x, y, x + 18, y + 10), fill=(245, 240, 220, 250))
    save_rgba(img, path)


def fruit_pea(path: Path) -> None:
    img, draw = make_base()
    soft_circle(draw, (128, 136), 34, (120, 180, 90, 250), 10)
    highlight(draw, (128, 136), 34)
    leaf(draw, (128, 100), -90, 22)
    save_rgba(img, path)


def fruit_blueberry(path: Path) -> None:
    img, draw = make_base()
    soft_circle(draw, (118, 138), 28, (70, 90, 170, 250), 10)
    soft_circle(draw, (146, 132), 26, (90, 110, 200, 245), 10)
    soft_circle(draw, (132, 156), 24, (60, 80, 160, 245), 10)
    for c in [(118, 138), (146, 132), (132, 156)]:
        highlight(draw, c, 24)
        draw.ellipse((c[0] - 4, c[1] - 10, c[0] + 4, c[1] - 4), fill=(240, 220, 255, 180))
    save_rgba(img, path)


def fruit_raspberry(path: Path) -> None:
    img, draw = make_base()
    cells = [
        (118, 120), (140, 120), (108, 140), (128, 138), (148, 140),
        (118, 158), (140, 158), (128, 170),
    ]
    for c in cells:
        soft_circle(draw, c, 14, (210, 70, 110, 250), 7)
        highlight(draw, c, 14)
    leaf(draw, (128, 104), -90, 24)
    save_rgba(img, path)


def fruit_grape(path: Path) -> None:
    img, draw = make_base()
    soft_circle(draw, (128, 142), 30, (130, 90, 170, 250), 10)
    highlight(draw, (128, 142), 30)
    leaf(draw, (128, 108), -95, 26, (90, 150, 80, 230))
    draw.line((128, 108, 128, 90), fill=(90, 120, 70, 220), width=3)
    save_rgba(img, path)


def fruit_olive(path: Path) -> None:
    img, draw = make_base()
    draw.ellipse((98, 112, 158, 168), fill=(110, 130, 70, 250))
    highlight(draw, (120, 130), 28)
    leaf(draw, (128, 108), -110, 24)
    save_rgba(img, path)


def fruit_kumquat(path: Path) -> None:
    img, draw = make_base()
    soft_circle(draw, (128, 140), 36, (240, 150, 60, 250), 12)
    highlight(draw, (128, 140), 36)
    leaf(draw, (128, 104), -90, 22)
    save_rgba(img, path)


def fruit_fig(path: Path) -> None:
    img, draw = make_base()
    # tear/pear-shaped fig, purple-green
    draw.polygon(
        [(128, 96), (168, 150), (150, 180), (106, 180), (88, 150)],
        fill=(150, 90, 130, 250),
    )
    soft_circle(draw, (128, 158), 28, (120, 70, 110, 180), 8)
    highlight(draw, (118, 130), 30)
    leaf(draw, (128, 96), -90, 20)
    save_rgba(img, path)


def fruit_lime(path: Path) -> None:
    img, draw = make_base()
    soft_circle(draw, (128, 140), 42, (170, 210, 70, 250), 12)
    highlight(draw, (128, 140), 42)
    save_rgba(img, path)


def fruit_plum(path: Path) -> None:
    img, draw = make_base()
    soft_circle(draw, (128, 140), 40, (140, 70, 150, 250), 12)
    draw.arc((108, 110, 148, 170), 250, 300, fill=(90, 40, 100, 180), width=3)
    highlight(draw, (128, 140), 40)
    leaf(draw, (128, 100), -90, 22)
    save_rgba(img, path)


def fruit_nectarine(path: Path) -> None:
    img, draw = make_base()
    soft_circle(draw, (128, 140), 44, (240, 120, 80, 250), 12)
    draw.arc((108, 108, 148, 172), 250, 300, fill=(200, 80, 50, 160), width=3)
    highlight(draw, (128, 140), 44)
    leaf(draw, (128, 96), -90, 24)
    save_rgba(img, path)


def fruit_apple(path: Path) -> None:
    img, draw = make_base()
    soft_circle(draw, (128, 142), 46, (220, 70, 70, 250), 12)
    leaf(draw, (138, 98), -40, 28)
    draw.line((128, 100, 128, 88), fill=(90, 70, 50, 220), width=3)
    highlight(draw, (128, 142), 46)
    save_rgba(img, path)


def fruit_avocado(path: Path) -> None:
    img, draw = make_base()
    draw.ellipse((96, 88, 160, 190), fill=(90, 140, 70, 250))
    soft_circle(draw, (128, 145), 22, (150, 100, 50, 255), 8)
    highlight(draw, (118, 120), 36)
    save_rgba(img, path)


def fruit_pear(path: Path) -> None:
    img, draw = make_base()
    soft_circle(draw, (128, 168), 40, (200, 200, 90, 250), 10)
    soft_circle(draw, (128, 120), 28, (190, 195, 80, 250), 10)
    leaf(draw, (136, 92), -50, 24)
    highlight(draw, (118, 140), 30)
    save_rgba(img, path)


def fruit_pepper(path: Path) -> None:
    img, draw = make_base()
    draw.polygon(
        [(128, 92), (170, 130), (162, 180), (94, 180), (86, 130)],
        fill=(220, 60, 50, 250),
    )
    soft_circle(draw, (128, 150), 34, (200, 40, 40, 120), 8)
    leaf(draw, (128, 92), -90, 18, (60, 130, 60, 240))
    highlight(draw, (118, 130), 30)
    save_rgba(img, path)


def fruit_mango(path: Path) -> None:
    img, draw = make_base()
    draw.ellipse((88, 100, 168, 188), fill=(240, 170, 50, 250))
    soft_circle(draw, (140, 150), 28, (230, 100, 50, 120), 8)
    highlight(draw, (110, 130), 34)
    leaf(draw, (128, 100), -100, 24)
    save_rgba(img, path)


def fruit_banana(path: Path) -> None:
    img, draw = make_base()
    draw.pieslice((70, 90, 190, 200), 200, 340, fill=(245, 215, 70, 250))
    draw.arc((80, 100, 180, 190), 210, 330, fill=(220, 180, 40, 180), width=4)
    highlight(draw, (130, 130), 40)
    save_rgba(img, path)


def fruit_grapefruit(path: Path) -> None:
    img, draw = make_base()
    soft_circle(draw, (128, 140), 52, (240, 120, 100, 250), 14)
    soft_circle(draw, (128, 140), 34, (255, 180, 150, 90), 8)
    highlight(draw, (128, 140), 52)
    save_rgba(img, path)


def fruit_papaya(path: Path) -> None:
    img, draw = make_base()
    # elongated orange papaya with green tip - distinct from coconut
    draw.ellipse((100, 78, 156, 198), fill=(240, 140, 50, 250))
    soft_circle(draw, (128, 100), 18, (120, 170, 70, 200), 8)
    soft_circle(draw, (128, 150), 16, (200, 80, 40, 100), 6)
    highlight(draw, (118, 130), 36)
    save_rgba(img, path)


def fruit_eggplant(path: Path) -> None:
    img, draw = make_base()
    draw.ellipse((104, 96, 152, 196), fill=(100, 50, 140, 250))
    leaf(draw, (128, 96), -90, 20, (70, 140, 70, 240))
    highlight(draw, (120, 130), 34)
    save_rgba(img, path)


def fruit_corn(path: Path) -> None:
    img, draw = make_base()
    draw.ellipse((110, 78, 146, 198), fill=(240, 200, 60, 250))
    for y in range(90, 190, 12):
        draw.line((114, y, 142, y), fill=(220, 170, 40, 160), width=2)
    leaf(draw, (110, 100), 200, 40, (90, 160, 70, 220))
    leaf(draw, (146, 110), -20, 36, (90, 160, 70, 220))
    save_rgba(img, path)


def fruit_cauliflower(path: Path) -> None:
    img, draw = make_base()
    for c in [(110, 130), (146, 130), (128, 112), (128, 148), (112, 150), (144, 150)]:
        soft_circle(draw, c, 22, (245, 240, 220, 250), 8)
    leaf(draw, (100, 160), 160, 36, (80, 150, 70, 230))
    leaf(draw, (156, 160), 20, 36, (80, 150, 70, 230))
    save_rgba(img, path)


def fruit_coconut(path: Path) -> None:
    img, draw = make_base()
    # brown fibrous coconut - distinct from papaya
    soft_circle(draw, (128, 140), 48, (140, 95, 55, 250), 12)
    soft_circle(draw, (118, 128), 10, (60, 40, 30, 220), 4)
    soft_circle(draw, (138, 124), 8, (60, 40, 30, 200), 4)
    soft_circle(draw, (128, 142), 8, (60, 40, 30, 200), 4)
    highlight(draw, (128, 140), 48)
    save_rgba(img, path)


def fruit_cabbage(path: Path) -> None:
    img, draw = make_base()
    soft_circle(draw, (128, 140), 52, (130, 180, 100, 250), 12)
    draw.arc((96, 108, 160, 172), 20, 160, fill=(90, 140, 70, 160), width=4)
    draw.arc((100, 112, 156, 168), 200, 340, fill=(90, 140, 70, 140), width=3)
    highlight(draw, (128, 140), 52)
    save_rgba(img, path)


def fruit_melon_small(path: Path) -> None:
    img, draw = make_base()
    soft_circle(draw, (128, 140), 46, (210, 220, 110, 250), 12)
    for a in range(0, 360, 40):
        rad = math.radians(a)
        x2 = 128 + math.cos(rad) * 40
        y2 = 140 + math.sin(rad) * 40
        draw.line((128, 140, x2, y2), fill=(170, 180, 70, 120), width=2)
    highlight(draw, (128, 140), 46)
    save_rgba(img, path)


def fruit_melon(path: Path) -> None:
    img, draw = make_base()
    soft_circle(draw, (128, 140), 54, (200, 210, 90, 250), 14)
    for a in range(0, 360, 30):
        rad = math.radians(a)
        x2 = 128 + math.cos(rad) * 48
        y2 = 140 + math.sin(rad) * 48
        draw.line((128, 140, x2, y2), fill=(160, 170, 60, 130), width=2)
    highlight(draw, (128, 140), 54)
    save_rgba(img, path)


def fruit_melon_large(path: Path) -> None:
    img, draw = make_base()
    soft_circle(draw, (128, 140), 60, (190, 200, 80, 250), 14)
    for a in range(0, 360, 24):
        rad = math.radians(a)
        x2 = 128 + math.cos(rad) * 54
        y2 = 140 + math.sin(rad) * 54
        draw.line((128, 140, x2, y2), fill=(150, 160, 50, 140), width=2)
    highlight(draw, (128, 140), 60)
    save_rgba(img, path)


def fruit_watermelon_small(path: Path) -> None:
    img, draw = make_base()
    soft_circle(draw, (128, 140), 44, (70, 160, 90, 250), 12)
    soft_circle(draw, (128, 140), 30, (230, 80, 90, 200), 8)
    highlight(draw, (128, 140), 44)
    save_rgba(img, path)


def fruit_watermelon_medium(path: Path) -> None:
    img, draw = make_base()
    soft_circle(draw, (128, 140), 52, (60, 150, 80, 250), 12)
    soft_circle(draw, (128, 140), 36, (220, 70, 85, 210), 8)
    draw.arc((90, 110, 166, 170), 200, 340, fill=(40, 110, 60, 160), width=3)
    highlight(draw, (128, 140), 52)
    save_rgba(img, path)


def fruit_zucchini(path: Path) -> None:
    img, draw = make_base()
    draw.ellipse((86, 118, 170, 162), fill=(110, 170, 70, 250))
    soft_circle(draw, (100, 140), 14, (90, 140, 55, 180), 6)
    highlight(draw, (130, 135), 30)
    save_rgba(img, path)


def fruit_zucchini_large(path: Path) -> None:
    img, draw = make_base()
    draw.ellipse((70, 112, 186, 168), fill=(100, 165, 65, 250))
    soft_circle(draw, (90, 140), 16, (80, 130, 50, 180), 6)
    highlight(draw, (140, 135), 34)
    save_rgba(img, path)


def fruit_pumpkin(path: Path) -> None:
    img, draw = make_base()
    soft_circle(draw, (108, 145), 36, (230, 130, 40, 250), 10)
    soft_circle(draw, (148, 145), 36, (230, 130, 40, 250), 10)
    soft_circle(draw, (128, 140), 40, (240, 140, 45, 250), 10)
    leaf(draw, (128, 104), -90, 18, (70, 130, 60, 240))
    highlight(draw, (128, 140), 40)
    save_rgba(img, path)


def fruit_pumpkin_large(path: Path) -> None:
    img, draw = make_base()
    soft_circle(draw, (100, 148), 42, (220, 120, 35, 250), 10)
    soft_circle(draw, (156, 148), 42, (220, 120, 35, 250), 10)
    soft_circle(draw, (128, 140), 48, (235, 135, 40, 250), 12)
    leaf(draw, (128, 96), -90, 22, (70, 130, 60, 240))
    highlight(draw, (128, 140), 48)
    save_rgba(img, path)


def fruit_watermelon(path: Path) -> None:
    img, draw = make_base()
    soft_circle(draw, (128, 140), 56, (50, 140, 70, 250), 14)
    soft_circle(draw, (128, 140), 40, (220, 65, 80, 220), 10)
    for a in (210, 250, 290):
        rad = math.radians(a)
        draw.line(
            (128, 140, 128 + math.cos(rad) * 50, 140 + math.sin(rad) * 50),
            fill=(30, 100, 50, 160),
            width=3,
        )
    highlight(draw, (128, 140), 56)
    save_rgba(img, path)


def fruit_watermelon_large(path: Path) -> None:
    img, draw = make_base()
    soft_circle(draw, (128, 140), 62, (45, 135, 65, 250), 14)
    soft_circle(draw, (128, 140), 44, (215, 60, 75, 220), 10)
    for a in (200, 240, 280, 320):
        rad = math.radians(a)
        draw.line(
            (128, 140, 128 + math.cos(rad) * 56, 140 + math.sin(rad) * 56),
            fill=(25, 95, 45, 160),
            width=3,
        )
    highlight(draw, (128, 140), 62)
    save_rgba(img, path)


def fruit_watermelon_xl(path: Path) -> None:
    img, draw = make_base()
    soft_circle(draw, (128, 140), 68, (40, 125, 60, 250), 14)
    soft_circle(draw, (128, 140), 48, (210, 55, 70, 220), 10)
    for a in range(180, 360, 30):
        rad = math.radians(a)
        draw.line(
            (128, 140, 128 + math.cos(rad) * 62, 140 + math.sin(rad) * 62),
            fill=(20, 90, 40, 150),
            width=3,
        )
    highlight(draw, (128, 140), 68)
    save_rgba(img, path)


def draw_baby_figure(
    draw: ImageDraw.ImageDraw,
    *,
    head_c: tuple[float, float],
    head_r: float,
    body_c: tuple[float, float],
    body_r: float,
    arm_r: float | None = None,
    with_face: bool = False,
    with_smile: bool = False,
) -> None:
    """Solid silhouette with a wide neck and face features only on the head."""
    skin = (255, 214, 196, 255)
    hx, hy = head_c
    bx, by = body_c

    # Very wide neck so the silhouette never pinches into a fake mouth curve.
    half_w = max(head_r * 0.88, body_r * 0.78)
    draw.rectangle((hx - half_w, hy, hx + half_w, by), fill=skin)

    draw.ellipse((bx - body_r, by - body_r, bx + body_r, by + body_r), fill=skin)

    if arm_r is not None:
        arm_y = hy + (by - hy) * 0.62
        span = body_r * 0.95
        for ax in (bx - span, bx + span):
            draw.ellipse(
                (ax - arm_r, arm_y - arm_r, ax + arm_r, arm_y + arm_r),
                fill=skin,
            )

    draw.ellipse((hx - head_r, hy - head_r, hx + head_r, hy + head_r), fill=skin)

    if with_face:
        # Eyes in the upper third of the head.
        eye_y = hy - head_r * 0.28
        eye_dx = head_r * 0.26
        eye_r = max(2.2, head_r * 0.07)
        for ex in (hx - eye_dx, hx + eye_dx):
            draw.ellipse(
                (ex - eye_r, eye_y - eye_r, ex + eye_r, eye_y + eye_r),
                fill=(90, 70, 70, 245),
            )

        if with_smile:
            # Tiny smile immediately under the eyes (upper half of the head only).
            smile_cy = hy - head_r * 0.18
            smile_w = head_r * 0.16
            smile_h = head_r * 0.08
            box = (
                hx - smile_w,
                smile_cy - smile_h * 0.05,
                hx + smile_w,
                smile_cy + smile_h,
            )
            # Hard guard: never draw at or below head center.
            max_bottom = hy - 1
            if box[3] > max_bottom:
                shift = box[3] - max_bottom
                box = (box[0], box[1] - shift, box[2], box[3] - shift)
            draw.arc(box, 45, 135, fill=(210, 120, 120, 240), width=2)


def fruit_newborn(path: Path) -> None:
    img, draw = make_base()
    draw_baby_figure(
        draw,
        head_c=(128, 98),
        head_r=42,
        body_c=(128, 182),
        body_r=38,
        arm_r=13,
        with_face=True,
        with_smile=True,
    )
    save_rgba(img, path, blur=False)


def fruit_term_baby(path: Path) -> None:
    fruit_newborn(path)


def fruit_birth_baby(path: Path) -> None:
    fruit_newborn(path)


FRUIT_BUILDERS = [
    fruit_poppy,
    fruit_sesame,
    fruit_rice,
    fruit_pea,
    fruit_blueberry,
    fruit_raspberry,
    fruit_grape,
    fruit_olive,
    fruit_kumquat,
    fruit_fig,
    fruit_lime,
    fruit_plum,
    fruit_nectarine,
    fruit_apple,
    fruit_avocado,
    fruit_pear,
    fruit_pepper,
    fruit_mango,
    fruit_banana,
    fruit_grapefruit,
    fruit_papaya,
    fruit_eggplant,
    fruit_corn,
    fruit_cauliflower,
    fruit_coconut,
    fruit_cabbage,
    fruit_melon_small,
    fruit_melon,
    fruit_melon_large,
    fruit_watermelon_small,
    fruit_watermelon_medium,
    fruit_zucchini,
    fruit_zucchini_large,
    fruit_pumpkin,
    fruit_pumpkin_large,
    fruit_watermelon,
    fruit_watermelon_large,
    fruit_watermelon_xl,
    fruit_newborn,
    fruit_term_baby,
    fruit_birth_baby,
]


def make_baby(stage: int, path: Path) -> None:
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img, "RGBA")
    # Opaque plate — translucent rings look like a fake smile on dark UI backgrounds.
    cx = cy = SIZE / 2
    draw.ellipse((cx - 118, cy - 118, cx + 118, cy + 118), fill=(255, 236, 228, 255))

    if stage == 1:
        draw_baby_figure(
            draw,
            head_c=(128, 116),
            head_r=34,
            body_c=(128, 172),
            body_r=24,
            arm_r=None,
            with_face=False,
            with_smile=False,
        )
    elif stage == 2:
        draw_baby_figure(
            draw,
            head_c=(128, 108),
            head_r=38,
            body_c=(128, 176),
            body_r=34,
            arm_r=12,
            with_face=False,
            with_smile=False,
        )
    elif stage == 3:
        draw_baby_figure(
            draw,
            head_c=(128, 100),
            head_r=42,
            body_c=(128, 180),
            body_r=38,
            arm_r=13,
            with_face=True,
            with_smile=False,
        )
    else:
        draw_baby_figure(
            draw,
            head_c=(128, 96),
            head_r=46,
            body_c=(128, 186),
            body_r=40,
            arm_r=14,
            with_face=True,
            with_smile=True,
        )

    save_rgba(img, path, blur=False)


def main() -> None:
    FRUIT_DIR.mkdir(parents=True, exist_ok=True)
    BABY_DIR.mkdir(parents=True, exist_ok=True)

    assert len(FRUIT_BUILDERS) == 41, len(FRUIT_BUILDERS)

    for index, builder in enumerate(FRUIT_BUILDERS, start=1):
        path = FRUIT_DIR / f"fruit_{index:02d}.png"
        builder(path)
        print("fruit", path.name)

    for stage in range(1, 5):
        path = BABY_DIR / f"baby_stage_{stage}.png"
        make_baby(stage, path)
        print("baby", path.name)

    attribution = FRUIT_DIR / "ATTRIBUTION.txt"
    attribution.write_text(
        "Иллюстрации фруктов и малыша: оригинальные soft-иллюстрации Mamelia "
        "(сгенерированы для проекта, без OpenMoji).\n",
        encoding="utf-8",
    )
    print("done", len(FRUIT_BUILDERS), "fruits + 4 baby stages")


if __name__ == "__main__":
    main()
