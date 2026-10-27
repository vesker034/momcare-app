"""Convert freshly generated baby JPGs into clean shared-circle PNGs."""

from __future__ import annotations

from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
BABIES = ROOT / "mobile" / "assets" / "images" / "babies"
FRUITS = ROOT / "mobile" / "assets" / "images" / "fruits"
SRC_DIR = Path(r"C:\Users\andre\.cursor\projects\c-Users-andre-OneDrive\assets")

PLATE = np.array([255.0, 236.0, 228.0])
SIZE = 512
PAD = 10


def circle_alpha(size: int = SIZE, pad: int = PAD) -> np.ndarray:
    big = size * 2
    mask = Image.new("L", (big, big), 0)
    ImageDraw.Draw(mask).ellipse(
        (pad * 2, pad * 2, big - 1 - pad * 2, big - 1 - pad * 2),
        fill=255,
    )
    return np.array(mask.resize((size, size), Image.Resampling.LANCZOS), dtype=np.float32) / 255.0


def largest_cc(mask: np.ndarray) -> np.ndarray:
    visited = np.zeros_like(mask, dtype=bool)
    best: list[tuple[int, int]] = []
    best_n = 0
    h, w = mask.shape
    for y in range(h):
        for x in range(w):
            if mask[y, x] and not visited[y, x]:
                q = deque([(y, x)])
                visited[y, x] = True
                cells: list[tuple[int, int]] = []
                while q:
                    cy, cx = q.popleft()
                    cells.append((cy, cx))
                    for ny, nx in (
                        (cy - 1, cx),
                        (cy + 1, cx),
                        (cy, cx - 1),
                        (cy, cx + 1),
                    ):
                        if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not visited[ny, nx]:
                            visited[ny, nx] = True
                            q.append((ny, nx))
                if len(cells) > best_n:
                    best_n = len(cells)
                    best = cells
    out = np.zeros_like(mask)
    for y, x in best:
        out[y, x] = True
    return out


def fill_holes(mask: np.ndarray) -> np.ndarray:
    h, w = mask.shape
    bg = np.zeros_like(mask, dtype=bool)
    q: deque[tuple[int, int]] = deque()
    for y, x in ((0, 0), (0, w - 1), (h - 1, 0), (h - 1, w - 1)):
        if not mask[y, x]:
            bg[y, x] = True
            q.append((y, x))
    while q:
        y, x = q.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and (not mask[ny, nx]) and (not bg[ny, nx]):
                bg[ny, nx] = True
                q.append((ny, nx))
    return ~bg


def is_outside_bg(rgb: np.ndarray) -> np.ndarray:
    """Black canvas or checkerboard transparency preview."""
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    lum = rgb.mean(2)
    sat = rgb.max(2) - rgb.min(2)
    black = lum < 40
    # checkerboard: near-gray, mid/high lum, low sat
    checker = (sat < 18) & (lum > 140) & (lum < 230) & (np.abs(r - g) < 12) & (np.abs(g - b) < 12)
    # pure white outside (some gens)
    pure_white = (r > 250) & (g > 250) & (b > 250)
    return black | checker | pure_white


def extract_embryo(rgb: np.ndarray, outside: np.ndarray) -> np.ndarray:
    dist = np.linalg.norm(rgb - PLATE, axis=2)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    chroma = r - b
    lum = rgb.mean(2)
    sat = rgb.max(2) - rgb.min(2)

    # White sticker / fringe — never treat as embryo
    whiteish = (r > 245) & (g > 240) & (b > 230) & (chroma < 22)

    embryo = (~outside) & (~whiteish) & (dist > 22) & (lum < 242)
    embryo &= (chroma > 10) | ((sat > 20) & (lum < 220))

    em = Image.fromarray((embryo.astype(np.uint8) * 255), "L")
    em = em.filter(ImageFilter.MedianFilter(5))
    em = em.filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.MinFilter(7))
    em = em.filter(ImageFilter.MaxFilter(3))
    embryo = np.array(em) > 127
    embryo = largest_cc(embryo)
    embryo = fill_holes(embryo)
    em = Image.fromarray((embryo.astype(np.uint8) * 255), "L")
    em = em.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.MinFilter(5))
    return fill_holes(np.array(em) > 127)


def inpaint_whites(rgb: np.ndarray, mask: np.ndarray) -> np.ndarray:
    out = rgb.copy()
    r, g, b = out[:, :, 0], out[:, :, 1], out[:, :, 2]
    chroma = r - b
    bad = mask & (
        ((r > 248) & (g > 238) & (b > 225))
        | ((r > 242) & (g > 238) & (b > 230) & (chroma < 18))
    )
    flesh_fallback = np.array([232.0, 188.0, 162.0])
    for _ in range(16):
        if not bad.any():
            break
        ys, xs = np.where(bad)
        new = out.copy()
        still = np.zeros_like(bad)
        for y, x in zip(ys, xs):
            y0, y1 = max(0, y - 4), min(SIZE, y + 5)
            x0, x1 = max(0, x - 4), min(SIZE, x + 5)
            patch = out[y0:y1, x0:x1]
            good = mask[y0:y1, x0:x1] & ~bad[y0:y1, x0:x1]
            if good.sum() >= 4:
                new[y, x] = np.median(patch[good], axis=0)
            else:
                new[y, x] = flesh_fallback
                still[y, x] = True
        out = new
        bad = still
    # soften blown highlights
    r, g, b = out[:, :, 0], out[:, :, 1], out[:, :, 2]
    hot = mask & (r > 246) & (g > 230)
    out[hot, 0] = np.minimum(out[hot, 0], 244)
    out[hot, 1] = np.minimum(out[hot, 1], 215)
    out[hot, 2] = np.minimum(out[hot, 2], 190)
    return out


def process_one(src: Path, dst: Path) -> None:
    img = Image.open(src).convert("RGB").resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    rgb = np.array(img, dtype=np.float32)
    outside = is_outside_bg(rgb)
    # expand outside a bit to eat fringe
    out_img = Image.fromarray((outside.astype(np.uint8) * 255), "L").filter(ImageFilter.MaxFilter(3))
    outside = np.array(out_img) > 0

    embryo = extract_embryo(rgb, outside)
    cleaned = inpaint_whites(rgb, embryo)

    soft = Image.fromarray((embryo.astype(np.uint8) * 255), "L").filter(
        ImageFilter.GaussianBlur(1.1)
    )
    ae = (np.array(soft, dtype=np.float32) / 255.0)[..., None]
    ca = circle_alpha()

    out = np.zeros((SIZE, SIZE, 4), dtype=np.float32)
    out[:, :, 0] = PLATE[0]
    out[:, :, 1] = PLATE[1]
    out[:, :, 2] = PLATE[2]
    out[:, :, 3] = ca * 255.0
    out[:, :, :3] = out[:, :, :3] * (1.0 - ae) + cleaned * ae

    # final white purge inside circle
    r, g, b = out[:, :, 0], out[:, :, 1], out[:, :, 2]
    leftover = (ca > 0.4) & (r > 248) & (g > 245) & (b > 238) & ((r - b) < 18)
    out[leftover, 0] = PLATE[0]
    out[leftover, 1] = PLATE[1]
    out[leftover, 2] = PLATE[2]

    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), "RGBA").save(dst)
    white = int(
        (
            (out[:, :, 0] > 248)
            & (out[:, :, 1] > 245)
            & (out[:, :, 2] > 238)
            & (out[:, :, 3] > 40)
        ).sum()
    )
    print(f"{dst.name}: embryo={int(embryo.sum())} white_left={white}")


def main() -> None:
    sources = {
        1: SRC_DIR / "baby_stage_1_clean.jpg",
        2: SRC_DIR / "baby_stage_2_clean.jpg",
        3: SRC_DIR / "baby_stage_3_clean.jpg",
        4: SRC_DIR / "baby_stage_4_clean.jpg",
    }
    for i, src in sources.items():
        if not src.exists():
            raise SystemExit(f"missing {src}")
        process_one(src, BABIES / f"baby_stage_{i}.png")

    for fruit, stage in ((39, 2), (40, 3), (41, 4)):
        src = BABIES / f"baby_stage_{stage}.png"
        dst = FRUITS / f"fruit_{fruit}.png"
        if dst.exists():
            Image.open(src).convert("RGBA").resize(
                Image.open(dst).size, Image.Resampling.LANCZOS
            ).save(dst)
            print(f"synced fruit_{fruit}")


if __name__ == "__main__":
    main()
