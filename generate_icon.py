"""Generates icon-192.png and icon-512.png for Naam Smaran.
Pure geometric drawing (no external assets, no font glyph dependency) so it
renders identically anywhere PIL is available. Rendered at 4x and downsized
for clean, anti-aliased edges.
"""
import math
from PIL import Image, ImageDraw, ImageFilter

MAROON_DARK = (43, 7, 11, 255)
MAROON_MID = (99, 24, 36, 255)
GOLD = (233, 194, 100, 255)
GOLD_LIGHT = (255, 236, 190, 255)
PETAL = (236, 199, 108, 255)


def radial_bg(size):
    img = Image.new("RGBA", (size, size), MAROON_DARK)
    px = img.load()
    cx = cy = size / 2
    max_r = size * 0.75
    for y in range(0, size, 2):
        for x in range(0, size, 2):
            d = min(math.hypot(x - cx, y - cy) / max_r, 1.0)
            r = int(MAROON_MID[0] * (1 - d) + MAROON_DARK[0] * d)
            g = int(MAROON_MID[1] * (1 - d) + MAROON_DARK[1] * d)
            b = int(MAROON_MID[2] * (1 - d) + MAROON_DARK[2] * d)
            for yy in (y, y + 1):
                for xx in (x, x + 1):
                    if xx < size and yy < size:
                        px[xx, yy] = (r, g, b, 255)
    return img


def make_icon(size, out_path, maskable=False):
    S = size * 4  # supersample factor
    img = radial_bg(S)
    cx, cy = S / 2, S / 2
    safe_r = S * (0.40 if maskable else 0.46)

    glow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gr = safe_r * 0.95
    gd.ellipse([cx - gr, cy - gr, cx + gr, cy + gr], fill=(255, 205, 120, 110))
    glow = glow.filter(ImageFilter.GaussianBlur(S * 0.05))
    img = Image.alpha_composite(img, glow)

    ring_layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    rd = ImageDraw.Draw(ring_layer)
    ring_r = safe_r
    ring_w = max(S * 0.022, 4)
    rd.ellipse([cx - ring_r, cy - ring_r, cx + ring_r, cy + ring_r], outline=GOLD, width=int(ring_w))
    img = Image.alpha_composite(img, ring_layer)

    petal_layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    petals = 8
    pr = ring_r * 0.86
    petal_w = pr * 0.62
    petal_h = pr * 1.05
    for i in range(petals):
        angle = (2 * math.pi / petals) * i
        single = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        sd = ImageDraw.Draw(single)
        top = cy - pr
        sd.ellipse([cx - petal_w / 2, top, cx + petal_w / 2, top + petal_h], fill=PETAL)
        single = single.rotate(-math.degrees(angle), center=(cx, cy), resample=Image.BICUBIC)
        petal_layer = Image.alpha_composite(petal_layer, single)
    img = Image.alpha_composite(img, petal_layer)

    inner_layer = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    ipr = ring_r * 0.48
    ipw = ipr * 0.62
    iph = ipr * 1.0
    for i in range(petals):
        angle = (2 * math.pi / petals) * i + (math.pi / petals)
        single = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        sd = ImageDraw.Draw(single)
        top = cy - ipr
        sd.ellipse([cx - ipw / 2, top, cx + ipw / 2, top + iph], fill=GOLD_LIGHT)
        single = single.rotate(-math.degrees(angle), center=(cx, cy), resample=Image.BICUBIC)
        inner_layer = Image.alpha_composite(inner_layer, single)
    img = Image.alpha_composite(img, inner_layer)

    draw = ImageDraw.Draw(img, "RGBA")
    br = ring_r * 0.20
    draw.ellipse([cx - br, cy - br, cx + br, cy + br], fill=(58, 12, 14, 255))
    br2 = br * 0.74
    draw.ellipse([cx - br2, cy - br2, cx + br2, cy + br2], fill=GOLD_LIGHT)

    img = img.resize((size, size), resample=Image.LANCZOS)
    img.save(out_path, "PNG")


make_icon(192, "/home/claude/naam-smaran/icons/icon-192.png", maskable=False)
make_icon(512, "/home/claude/naam-smaran/icons/icon-512.png", maskable=False)
make_icon(512, "/home/claude/naam-smaran/icons/icon-512-maskable.png", maskable=True)
print("icons generated")
