from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "宣传物料"
FONT = "/System/Library/Fonts/STHeiti Medium.ttc"

raw = Image.open(ASSETS / "二维码原图.png").convert("L")
module_px = 10
quiet = module_px * 4
qr = Image.new("L", (raw.width + quiet * 2, raw.height + quiet * 2), 255)
qr.paste(raw, (quiet, quiet))
qr = qr.convert("RGB")
qr.save(ASSETS / "游戏二维码.png", optimize=True)

poster = Image.open(ASSETS / "海报底图.png").convert("RGBA")
w, h = poster.size

# Strengthen the title zone while keeping the generated space scene visible.
shade = Image.new("RGBA", poster.size, (0, 0, 0, 0))
shade_draw = ImageDraw.Draw(shade)
for y in range(0, 390):
    alpha = int(175 * (1 - y / 390))
    shade_draw.rectangle((0, y, w, y + 1), fill=(2, 8, 24, alpha))
poster = Image.alpha_composite(poster, shade)

def font(size):
    return ImageFont.truetype(FONT, size=size)

def centered_text(text, y, fnt, fill, stroke=0, stroke_fill=(0, 0, 0, 220), glow=None):
    if glow:
        layer = Image.new("RGBA", poster.size, (0, 0, 0, 0))
        ld = ImageDraw.Draw(layer)
        ld.text((w // 2, y), text, font=fnt, anchor="mm", fill=glow, stroke_width=2, stroke_fill=glow)
        layer = layer.filter(ImageFilter.GaussianBlur(10))
        poster.alpha_composite(layer)
    ImageDraw.Draw(poster).text((w // 2, y), text, font=fnt, anchor="mm", fill=fill,
                                stroke_width=stroke, stroke_fill=stroke_fill)

centered_text("星轨：最后防线", 105, font(82), (240, 250, 255, 255), 2,
              (5, 20, 44, 245), (60, 190, 255, 150))
centered_text("部署 · 进化 · 守住星海", 192, font(30), (141, 222, 255, 255), 1,
              (6, 16, 35, 230))

draw = ImageDraw.Draw(poster)
feature = "4座基础塔   ·   16种终极形态   ·   无尽地图挑战"
bbox = draw.textbbox((0, 0), feature, font=font(22))
fw = bbox[2] - bbox[0]
draw.rounded_rectangle((w / 2 - fw / 2 - 24, 231, w / 2 + fw / 2 + 24, 276),
                       radius=22, fill=(7, 22, 48, 190), outline=(90, 196, 255, 115), width=2)
draw.text((w // 2, 253), feature, font=font(22), anchor="mm", fill=(218, 238, 255, 255))

# Deterministic QR compositing: nearest-neighbor preserves the module grid.
qr_small = qr.resize((qr.width // 2, qr.height // 2), Image.Resampling.NEAREST).convert("RGBA")
panel_x0, panel_y0, panel_x1, panel_y1 = 681, 1167, 998, 1514
draw.rounded_rectangle((panel_x0, panel_y0, panel_x1, panel_y1), radius=28,
                       fill=(3, 12, 30, 238), outline=(92, 215, 255, 220), width=3)
draw.text(((panel_x0 + panel_x1) // 2, panel_y0 + 30), "扫码即玩", font=font(27),
          anchor="mm", fill=(158, 232, 255, 255))
qx = (panel_x0 + panel_x1 - qr_small.width) // 2
qy = panel_y0 + 54
draw.rounded_rectangle((qx - 8, qy - 8, qx + qr_small.width + 8, qy + qr_small.height + 8),
                       radius=10, fill=(255, 255, 255, 255))
poster.alpha_composite(qr_small, (qx, qy))
draw.text(((panel_x0 + panel_x1) // 2, panel_y1 - 25), "手机浏览器直接开战", font=font(17),
          anchor="mm", fill=(190, 214, 238, 255))

# Bottom-left callout balances the QR panel.
tag = "你的防线，能守到第几波？"
draw.text((48, 1488), tag, font=font(25), anchor="ls", fill=(231, 245, 255, 255),
          stroke_width=2, stroke_fill=(3, 10, 24, 235))

poster.convert("RGB").save(ASSETS / "宣传海报.png", quality=96, optimize=True)
print(ASSETS / "游戏二维码.png")
print(ASSETS / "宣传海报.png")
