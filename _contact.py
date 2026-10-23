# -*- coding: utf-8 -*-
"""临时：15 张素材缩略拼贴 + 标注文件名，用于目检对应关系。"""
import os, glob
from PIL import Image, ImageDraw

SRC = r'D:/DoubaoDownloads'
files = sorted(glob.glob(os.path.join(SRC, '书籍素材图生成*.png')),
               key=lambda p: (len(os.path.basename(p)), os.path.basename(p)))
TW, TH = 340, 340
cols = 5
rows = (len(files) + cols - 1) // cols
sheet = Image.new('RGB', (cols * TW, rows * (TH + 26)), (250, 250, 250))
d = ImageDraw.Draw(sheet)
for i, p in enumerate(files):
    im = Image.open(p).convert('RGB')
    im.thumbnail((TW - 8, TH - 8))
    x = (i % cols) * TW + 4
    y = (i // cols) * (TH + 26) + 4
    sheet.paste(im, (x, y))
    name = os.path.basename(p).replace('书籍素材图生成', 'S').replace('.png', '')
    d.text((x + 2, y + TH - 4), '%02d %s' % (i + 1, name), fill=(200, 0, 0))
sheet.save('_contact.png')
print('ok')
