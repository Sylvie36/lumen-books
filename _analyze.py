# -*- coding: utf-8 -*-
"""临时脚本：分析 15 张书籍渲染素材的尺寸 / 非黑 bbox / 封面右边界，执行后删除。"""
import os, glob
from PIL import Image

SRC = r'D:/DoubaoDownloads'
files = sorted(glob.glob(os.path.join(SRC, '书籍素材图生成*.png')),
               key=lambda p: (len(os.path.basename(p)), os.path.basename(p)))

print('file count:', len(files))
for p in files:
    img = Image.open(p).convert('L')
    w, h = img.size
    px = img.load()
    # 非黑 bbox（阈值 20）
    minx, miny, maxx, maxy = w, h, 0, 0
    for y in range(0, h, 4):
        for x in range(0, w, 4):
            if px[x, y] > 20:
                if x < minx: minx = x
                if x > maxx: maxx = x
                if y < miny: miny = y
                if y > maxy: maxy = y
    # 中央行带 (y 40%-60%) 的列平均亮度：用于区分 封面区(有色) 与 纸页区(最亮)
    band = []
    for x in range(minx, maxx + 1):
        s = 0
        n = 0
        for y in range(int(h * .35), int(h * .6)):
            v = px[x, y]
            if v > 20:
                s += v
                n += 1
        band.append((x, s / n if n else 0))
    # 纸页 = 右侧最亮列群；封面右边界 = 亮度开始陡降前的位置
    # 简化：从右往左找连续 30 列平均亮度 > 150 的最左起点
    page_left = None
    x = maxx
    while x > minx + 60:
        seg = [b[1] for b in band if x - 30 <= b[0] < x]
        if seg and sum(seg) / len(seg) > 140:
            x -= 4
            page_left = x
        else:
            break
    name = os.path.basename(p)
    print('%s size=%dx%d bbox=(%d,%d)-(%d,%d) page_left=%s' %
          (name, w, h, minx, miny, maxx, maxy, page_left))
