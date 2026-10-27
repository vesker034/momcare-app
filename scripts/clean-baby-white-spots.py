"""Remove white fringe/speckles from baby stage PNGs and remask to a shared circle."""

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
BABIES = ROOT / "mobile" / "assets" / "images" / "babies"
FRUITS = ROOT / "mobile" / "assets" / "images" / "fruits"

PLATE = np.array([255, 236, 228], dtype=np.float32)
SIZE = 512
PAD = 6
SS = 2


def soft_circle_mask(size: int, pad: int, ss: int = 2) -> np.ndarray:
    big = size * ss
    mask = Image.new("L", (big, big), 0)
    ImageDraw.Draw(mask).ellipse(
        (pad * ss, pad * ss, big - 1 - pad * ss, big - 1 - pad * ss),
        fill=255,
    )
    mask = mask.resize((size, size), Image.Resampling.LANCZOS)
    return np.array(mask, dtype=np.float32) / 255.0


def clean_white_artifacts(rgb: np.ndarray, alpha: np.ndarray) -> np.ndarray:
    out = rgb.astype(np.float32).copy()
    a = alpha.astype(np.float32)
    r, g, b = out[:, :, 0], out[:, :, 1], out[:, :, 2]
    chroma = r - b
    sat = out.max(2) - out.min(2)
    lum = out.mean(2)
    dist_plate = np.linalg.norm(out - PLATE, axis=2)

    white = (
        (a > 8)
        & (lum > 228)
        & (chroma < 16)
        & (sat < 28)
        & (dist_plate > 12)
    )
    white |= (
        (a > 8)
        & (b > 238)
        & (g > 242)
        & (r > 248)
        & (dist_plate > 10)
    )

    junk = white.astype(np.uint8) * 255
    junk_img = Image.fromarray(junk, mode="L").filter(ImageFilter.MaxFilter(5))
    junk = np.array(junk_img) > 0

    flesh = (a > 8) & (lum < 215) & (chroma > 20) & (sat > 25)
    flesh |= (a > 8) & (dist_plate > 35) & (chroma > 22) & (lum < 235)
    junk &= ~flesh

    out[junk] = PLATE

    r, g, b = out[:, :, 0], out[:, :, 1], out[:, :, 2]
    ultra = (a > 8) & (r > 250) & (g > 250) & (b > 245)
    out[ultra] = PLATE

    junk2 = Image.fromarray((junk | ultra).astype(np.uint8) * 255, "L").filter(
        ImageFilter.GaussianBlur(0.8)
    )
    w = (np.array(junk2, dtype=np.float32) / 255.0)[..., None]
    out = out * (1 - w * 0.85) + PLATE * (w * 0.85)

    orig = rgb.astype(np.float32)
    flesh3 = (
        (a > 8)
        & (dist_plate > 40)
        & ((orig[:, :, 0] - orig[:, :, 2]) > 25)
    )
    out = np.where(flesh3[..., None], orig, out)
    return out


def remask(rgb: np.ndarray, circle: np.ndarray) -> Image.Image:
    rgba = np.zeros((SIZE, SIZE, 4), dtype=np.float32)
    rgba[:, :, :3] = rgb
    rgba[:, :, 3] = circle * 255.0
    edge = (circle > 0.02) & (circle < 0.98)
    rgba[edge, :3] = PLATE
    return Image.fromarray(np.clip(rgba, 0, 255).astype(np.uint8), "RGBA")


def count_white(arr: np.ndarray) -> int:
    rgb = arr[:, :, :3].astype(np.float32)
    a = arr[:, :, 3]
    chroma = rgb[:, :, 0] - rgb[:, :, 2]
    sat = rgb.max(2) - rgb.min(2)
    lum = rgb.mean(2)
    dist = np.linalg.norm(rgb - PLATE, axis=2)
    white = (a > 8) & (lum > 228) & (chroma < 16) & (sat < 28) & (dist > 12)
    return int(white.sum())


def main() -> None:
    circle = soft_circle_mask(SIZE, PAD, SS)

    for i in range(1, 5):
        path = BABIES / f"baby_stage_{i}.png"
        im = np.array(Image.open(path).convert("RGBA"))
        rgb, a = im[:, :, :3], im[:, :, 3]
        cleaned = clean_white_artifacts(rgb, a)
        r, g, b = cleaned[:, :, 0], cleaned[:, :, 1], cleaned[:, :, 2]
        residual = (a > 20) & (r > 248) & (g > 248) & (b > 242)
        cleaned[residual] = PLATE
        out = remask(cleaned, circle)
        out.save(path)
        arr = np.array(out)
        print(
            f"stage {i}: remaining white-ish={count_white(arr)}, "
            f"alpha nonzero={int((arr[:, :, 3] > 0).sum())}"
        )

    fruit_map = {39: 2, 40: 3, 41: 4}
    for f, s in fruit_map.items():
        src = BABIES / f"baby_stage_{s}.png"
        dst = FRUITS / f"fruit_{f}.png"
        if dst.exists() and src.exists():
            baby = Image.open(src).convert("RGBA")
            fruit = Image.open(dst)
            if fruit.size == baby.size:
                baby.save(dst)
            else:
                baby.resize(fruit.size, Image.Resampling.LANCZOS).save(dst)
            print(f"synced fruit_{f} <- baby_stage_{s}")

    print("done")


if __name__ == "__main__":
    main()
