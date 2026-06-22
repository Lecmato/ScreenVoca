"""Screen Voca 아이콘 — 플래시카드 스택 + V (첫 번째 버전)"""
import math
from PIL import Image, ImageDraw

BG       = (10,  14,  39,  255)
CARD     = (255, 255, 255, 255)
CARD2    = (220, 228, 255, 255)
CARD3    = (180, 195, 255, 255)
ACCENT   = (79,  70,  229, 255)
ACCENT_L = (129, 120, 255, 255)
DOT      = (99,  102, 241, 255)


def draw_rounded_rect(draw, xy, radius, fill):
    x0, y0, x1, y1 = xy
    r = int(radius)
    draw.rectangle([x0 + r, y0, x1 - r, y1], fill=fill)
    draw.rectangle([x0, y0 + r, x1, y1 - r], fill=fill)
    draw.ellipse([x0, y0, x0 + r*2, y0 + r*2], fill=fill)
    draw.ellipse([x1 - r*2, y0, x1, y0 + r*2], fill=fill)
    draw.ellipse([x0, y1 - r*2, x0 + r*2, y1], fill=fill)
    draw.ellipse([x1 - r*2, y1 - r*2, x1, y1], fill=fill)


def draw_v_shape(draw, cx, cy, size, color, line_width):
    h = size * 0.55
    w = size * 0.52
    tip_y = cy + h * 0.38
    draw.line([cx - w/2, cy - h/2, cx, tip_y], fill=color, width=line_width)
    draw.line([cx + w/2, cy - h/2, cx, tip_y], fill=color, width=line_width)


def create_frame(size: int) -> Image.Image:
    s = size
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    pad = max(1, int(s * 0.04))
    r_bg = int(s * 0.20)
    draw_rounded_rect(draw, [pad, pad, s-pad, s-pad], r_bg, BG)

    cw = s * 0.54
    ch = s * 0.44
    base_y = s * 0.54
    cx = s * 0.50

    if s >= 32:
        off3 = s * 0.055
        x3 = cx - cw/2 + off3
        y3 = base_y - ch/2 - s * 0.035
        draw_rounded_rect(draw, [x3, y3, x3 + cw, y3 + ch], max(2, int(s * 0.07)), CARD3)

        off2 = s * 0.028
        x2 = cx - cw/2 + off2
        y2 = base_y - ch/2 - s * 0.018
        draw_rounded_rect(draw, [x2, y2, x2 + cw, y2 + ch], max(2, int(s * 0.07)), CARD2)

    x1 = cx - cw / 2
    y1 = base_y - ch / 2

    if s >= 48:
        shadow_off = max(1, int(s * 0.018))
        draw_rounded_rect(
            draw,
            [x1 + shadow_off, y1 + shadow_off, x1 + cw + shadow_off, y1 + ch + shadow_off],
            max(2, int(s * 0.07)),
            (30, 40, 120, 120)
        )

    draw_rounded_rect(draw, [x1, y1, x1 + cw, y1 + ch], max(2, int(s * 0.07)), CARD)

    card_cx = x1 + cw / 2
    card_cy = y1 + ch / 2
    v_size = min(cw, ch) * 0.90
    lw = max(2, int(s * 0.055))
    draw_v_shape(draw, card_cx, card_cy, v_size, ACCENT, lw)

    if s >= 48:
        dot_y = s * 0.875
        dot_r = max(1, int(s * 0.032))
        dot_gap = int(s * 0.092)
        for dx, col in [(cx - dot_gap, ACCENT), (cx, ACCENT_L), (cx + dot_gap, DOT)]:
            draw.ellipse([dx - dot_r, dot_y - dot_r, dx + dot_r, dot_y + dot_r], fill=col)

    return img


def make_ico(path: str):
    sizes = [256, 128, 64, 48, 32, 16]
    big = create_frame(256)
    frames = [big]
    for sz in sizes[1:]:
        frames.append(big.resize((sz, sz), Image.LANCZOS))
    frames[0].save(path, format="ICO", sizes=[(sz, sz) for sz in sizes], append_images=frames[1:])
    print(f"아이콘 저장: {path}")


if __name__ == "__main__":
    make_ico("C:/Users/Mato/Screen Voca/icon.ico")
    create_frame(256).save("C:/Users/Mato/Screen Voca/icon_preview.png")
    print("미리보기: icon_preview.png")
