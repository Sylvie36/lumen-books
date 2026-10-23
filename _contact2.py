# -*- coding: utf-8 -*-
"""临时：15 张重绘封面拼贴目检。"""
import os
from PIL import Image

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'assets', 'books', 'covers')
TW, TH = 200, 286
cols, rows = 5, 3
sheet = Image.new('RGB', (cols * TW, rows * TH), (250, 250, 250))
for i in range(1, 16):
    im = Image.open(os.path.join(OUT, 'book-%02d.png' % i))
    im.thumbnail((TW - 6, TH - 6))
    sheet.paste(im, ((i - 1) % cols * TW + 3, (i - 1) // cols * TH + 3))
sheet.save('_covers.png')
print('ok')
