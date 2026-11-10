"""Rewrites the name entries in outlines.json from Inter SemiBold, so the logo files need no font.

Usage: python3 scripts/brand/outline-name.py <Inter-SemiBold.ttf> "<short name>" "<full name>"
"""
import json
import sys
from pathlib import Path

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

SIZE = 40
TRACKING = -0.011  # in em, matches the tightened setting the logo has always used

font_path, short, full = sys.argv[1:4]
font = TTFont(font_path)
glyphs = font.getGlyphSet()
cmap = font.getBestCmap()
scale = SIZE / font["head"].unitsPerEm
cap_height = font["OS/2"].sCapHeight * scale


def outline(text):
    x = 0.0
    parts = []
    for char in text:
        name = cmap[ord(char)]
        pen = SVGPathPen(glyphs, ntos=lambda value: f"{value:.2f}".rstrip("0").rstrip("."))
        glyphs[name].draw(TransformPen(pen, (scale, 0, 0, -scale, x, 0)))
        parts.append(pen.getCommands())
        x += glyphs[name].width * scale + TRACKING * SIZE
    return {"d": "".join(parts), "width": round(x - TRACKING * SIZE, 2), "capHeight": round(cap_height, 2)}


target = Path(__file__).parent / "outlines.json"
data = json.loads(target.read_text())
data["short"] = outline(short)
data["full"] = outline(full)
target.write_text(json.dumps(data))
print({key: (value["width"], value["capHeight"]) for key, value in data.items()})
