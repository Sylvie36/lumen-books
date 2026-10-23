# -*- coding: utf-8 -*-
"""临时调试：打印书01 两行上的纸页候选段。"""
from PIL import Image

img = Image.open(r'D:/DoubaoDownloads/书籍素材图生成.png').convert('L')
w, h = img.size
px = img.load()

for yratio in (0.35, 0.55):
    y = int(h * yratio)
    row = [px[x, y] for x in range(w)]
    segs = []
    start = None
    for x in range(w):
        if row[x] > 170:
            if start is None:
                start = x
        else:
            if start is not None:
                segs.append((start, x))
                start = None
    big = [s for s in segs if s[1] - s[0] > 60]
    print('y=%d segs>60:' % y, big[:8])
    # 打印 400-1400 区间每 40 列亮度
    print('   ', ' '.join('%d:%d' % (x, row[x]) for x in range(400, 1400, 80)))
