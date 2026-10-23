# -*- coding: utf-8 -*-
"""临时脚本：打印第一张素材中部水平亮度剖面，定位封面/纸页边界。"""
from PIL import Image

img = Image.open(r'D:/DoubaoDownloads/书籍素材图生成.png').convert('L')
w, h = img.size
px = img.load()

for yratio in (0.30, 0.45, 0.60, 0.75):
    y = int(h * yratio)
    row = []
    for x in range(0, w, 32):
        row.append(px[x, y])
    # 压缩为 20 段摘要（每段平均 + 标记亮段）
    print('y=%.2f' % yratio)
    seg = []
    for i in range(0, len(row) - 8, 8):
        avg = sum(row[i:i + 8]) / 8
        seg.append((i * 32, int(avg)))
    print('  ', ' '.join('%d:%d' % (x, v) for x, v in seg))
