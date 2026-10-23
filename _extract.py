# -*- coding: utf-8 -*-
"""临时脚本：参照 15 张 3D 渲染素材的封面设计语言（双色块 + 双线细边框 +
四角斜线 + 中央方框 L + 底部横线），重绘统一尺寸的平面封面图。
输出 assets/books/covers/book-01..15.png（420x600），执行后删除本脚本。"""
import os, random
from PIL import Image, ImageDraw

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'assets', 'books', 'covers')
os.makedirs(OUT, exist_ok=True)
random.seed(42)

W, H = 420, 600
PAPER = (241, 236, 226)   # 米白
GOLD = (201, 168, 106)    # 金线
WHITE = (246, 244, 238)
INK = (58, 52, 44)        # 浅色书用的深线

# (上部色, 下部色 or None, 线色, L色)
BOOKS = [
    ((241, 236, 226), (46, 70, 56),   GOLD,  (214, 190, 140)),  # 01 米白+墨绿
    ((122, 74, 40),   None,            GOLD,  (226, 200, 150)),  # 02 棕皮革
    ((35, 50, 80),    None,            (200, 208, 224), WHITE),  # 03 藏蓝
    ((241, 236, 226), (217, 98, 43),   GOLD,  (240, 220, 185)),  # 04 米白+橙
    ((241, 236, 226), (34, 48, 78),    GOLD,  (205, 210, 226)),  # 05 米白+藏蓝
    ((30, 58, 44),    None,            GOLD,  (215, 195, 150)),  # 06 墨绿
    ((241, 236, 226), (201, 90, 36),   GOLD,  (238, 216, 180)),  # 07 米白+深橙
    ((241, 236, 226), (126, 45, 57),   GOLD,  (226, 200, 160)),  # 08 米白+酒红
    ((239, 233, 220), None,            (188, 158, 112), (176, 146, 100)),  # 09 全米白
    ((30, 30, 32),    None,            (190, 190, 196), (210, 210, 214)),  # 10 全黑
    ((241, 236, 226), (30, 90, 138),   GOLD,  (190, 214, 236)),  # 11 米白+蓝
    ((241, 236, 226), (110, 78, 150),  GOLD,  (222, 204, 240)),  # 12 米白+紫
    ((224, 147, 131), (46, 70, 56),    (246, 238, 226), (246, 238, 226)),  # 13 粉+墨绿
    ((241, 236, 226), (204, 138, 45),  GOLD,  (240, 220, 175)),  # 14 米白+琥珀
    ((30, 66, 71),    None,            (186, 196, 190), (222, 228, 220)),  # 15 深青
]


def add_noise(img, amp=4):
    px = img.load()
    for y in range(0, H, 2):
        for x in range(0, W, 2):
            r, g, b = px[x, y]
            n = random.randint(-amp, amp)
            c = (max(0, min(255, r + n)), max(0, min(255, g + n)), max(0, min(255, b + n)))
            px[x, y] = c
            if x + 1 < W:
                px[x + 1, y] = c
            if y + 1 < H:
                px[x, y + 1] = c
            if x + 1 < W and y + 1 < H:
                px[x + 1, y + 1] = c


def draw(top_color, bottom_color, line, mark):
    img = Image.new('RGB', (W, H), top_color)
    d = ImageDraw.Draw(img)
    if bottom_color:
        split = int(H * 0.58)
        # 轻微不规则的分界（手工感）
        pts = [(0, split + random.randint(-3, 3))]
        for x in range(40, W, 40):
            pts.append((x, split + random.randint(-3, 3)))
        pts += [(W, split), (W, H), (0, H)]
        d.polygon(pts, fill=bottom_color)

    add_noise(img)
    d = ImageDraw.Draw(img)

    # 双线细边框
    d.rectangle([16, 16, W - 16, H - 16], outline=line, width=2)
    d.rectangle([27, 27, W - 27, H - 27], outline=line, width=1)

    # 四角斜线（外框角上，朝内）
    k = 34
    for cx, cy, sx, sy in ((16, 16, 1, 1), (W - 16, 16, -1, 1), (16, H - 16, 1, -1), (W - 16, H - 16, -1, -1)):
        d.line([cx + sx * 4, cy + sy * k, cx + sx * k, cy + sy * 4], fill=line, width=1)

    # 中央方框 + L 折线
    bw = 108
    bx, by = (W - bw) // 2, int(H * 0.34)
    d.rectangle([bx, by, bx + bw, by + bw], outline=mark, width=3)
    # L：竖 + 底横（偏左）+ 斜撇
    d.line([bx + 30, by + 26, bx + 30, by + 74], fill=mark, width=3)
    d.line([bx + 30, by + 74, bx + 66, by + 74], fill=mark, width=3)
    d.line([bx + 40, by + 52, bx + 84, by + 40], fill=mark, width=3)
    # 底部横线
    d.line([int(W * 0.34), int(H * 0.865), int(W * 0.66), int(H * 0.865)], fill=line, width=2)
    return img


for i, cfg in enumerate(BOOKS, 1):
    img = draw(*cfg)
    img.save(os.path.join(OUT, 'book-%02d.jpg' % i), quality=86)
    if os.path.exists(os.path.join(OUT, 'book-%02d.png' % i)):
        os.remove(os.path.join(OUT, 'book-%02d.png' % i))
print('drawn', len(BOOKS))
