"""
Generate DartFit hand scan overlay on the provided hand photo.
Produces two versions:
  hand_overlay_scan.png  — live scan view (dark reticle + coloured bones + joints)
  hand_overlay_analyze.png — analyze screen view (orange skeleton on hand photo)
"""

from PIL import Image, ImageDraw, ImageFont
import math, os

# ── Load source image ─────────────────────────────────────────────
SRC = '/root/.claude/uploads/14eafabe-f66a-496d-a2e5-8defe8c6b0a3.jpeg'
if not os.path.exists(SRC):
    # Try common upload paths
    import glob
    hits = glob.glob('/root/.claude/uploads/*.jpeg') + glob.glob('/root/.claude/uploads/*.jpg')
    SRC = hits[0] if hits else SRC

img_orig = Image.open(SRC).convert('RGBA')
W, H = img_orig.size   # 2040 x 1536

# ── Hand landmark coordinates (estimated from photo) ──────────────
# Palm-up view, fingers spread.  Coordinates in original 2040×1536 pixels.
LM = {
    # Wrist
    0:  (1080, 1310),
    # Thumb: CMC→MCP→IP→TIP
    1:  (1300, 1140),
    2:  (1460, 1000),
    3:  (1570, 870),
    4:  (1660, 760),
    # Index: MCP→PIP→DIP→TIP
    5:  (1195, 840),
    6:  (1188, 620),
    7:  (1178, 450),
    8:  (1168, 295),
    # Middle: MCP→PIP→DIP→TIP
    9:  (1035, 810),
    10: (1020, 595),
    11: (1010, 430),
    12: (1003, 278),
    # Ring: MCP→PIP→DIP→TIP
    13: (883, 855),
    14: (862, 650),
    15: (850, 490),
    16: (843, 365),
    # Pinky: MCP→PIP→DIP→TIP
    17: (748, 930),
    18: (733, 750),
    19: (722, 635),
    20: (715, 545),
}

# MediaPipe bone connections
CONNECTIONS = [
    (0,1),(1,2),(2,3),(3,4),          # thumb
    (0,5),(5,6),(6,7),(7,8),          # index
    (0,9),(9,10),(10,11),(11,12),     # middle
    (0,13),(13,14),(14,15),(15,16),   # ring
    (0,17),(17,18),(18,19),(19,20),   # pinky
    (5,9),(9,13),(13,17),             # palm arch
]

# Per-finger colours (thumb, index, middle, ring, pinky)
def bone_color(i, j):
    mx = max(i, j)
    if mx <= 4:  return (255, 107, 53)   # orange  – thumb
    if mx <= 8:  return (78, 205, 196)   # teal    – index
    if mx <= 12: return (69, 183, 209)   # blue    – middle
    if mx <= 16: return (150, 206, 180)  # green   – ring
    return (255, 234, 167)               # yellow  – pinky

ORANGE  = (232, 87, 14)
ORANGE_A = (232, 87, 14, 160)

# ─────────────────────────────────────────────────────────────────
# VERSION 1 — SCAN SCREEN (live camera overlay style)
# Dark semi-transparent tint + coloured skeleton
# ─────────────────────────────────────────────────────────────────
scan = img_orig.copy()

# Dark vignette overlay to simulate the scan screen
vignette = Image.new('RGBA', (W, H), (0, 0, 0, 0))
vd = ImageDraw.Draw(vignette)
for r in range(60, 0, -1):
    alpha = int(160 * (1 - r/60)**2)
    x0 = int(W * (1 - r/60) / 2)
    y0 = int(H * (1 - r/60) / 2)
    x1 = W - x0; y1 = H - y0
    vd.rectangle([x0, y0, x1, y1], fill=(0,0,0,alpha//20))
# Simpler approach: just blend a dark layer at the edges
tint = Image.new('RGBA', (W, H), (0, 0, 0, 80))
scan = Image.alpha_composite(scan, tint)

overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(overlay)

# ── Silhouette fill ──
silhouette_pts = [LM[k] for k in [0, 1, 5, 9, 13, 17]]
d.polygon(silhouette_pts, fill=(232, 87, 14, 55))

# Thick stroke chains for silhouette
for chain in [[0,1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16],[17,18,19,20]]:
    pts = [LM[k] for k in chain]
    d.line(pts, fill=(232, 87, 14, 55), width=90, joint='curve')

# ── Bone segments (coloured) ──
for (i, j) in CONNECTIONS:
    col = bone_color(i, j) + (220,)
    d.line([LM[i], LM[j]], fill=col, width=8, joint='curve')

# ── Joint dots ──
for idx, (x, y) in LM.items():
    r = 22 if idx == 0 else 16
    d.ellipse([x-r, y-r, x+r, y+r], fill=(232, 87, 14, 230))
    ri = r - 5
    d.ellipse([x-ri, y-ri, x+ri, y+ri], fill=(255, 255, 255, 200))

# ── Measurement callouts ──
try:
    font_b = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 42)
    font_r = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 36)
except:
    font_b = ImageFont.load_default()
    font_r = font_b

# Finger length line (middle MCP→TIP, offset left)
p9, p12 = LM[9], LM[12]
ox = -55
d.line([(p9[0]+ox, p9[1]), (p12[0]+ox, p12[1])], fill=(255, 220, 50, 220), width=5)
d.line([(p9[0]+ox-20, p9[1]), (p9[0]+ox+20, p9[1])], fill=(255, 220, 50, 220), width=4)
d.line([(p12[0]+ox-20, p12[1]), (p12[0]+ox+20, p12[1])], fill=(255, 220, 50, 220), width=4)
mid_y = (p9[1]+p12[1])//2
d.text((p9[0]+ox-60, mid_y-18), '88.6mm', fill=(255, 220, 50, 230), font=font_b, anchor='rm')
d.text((p9[0]+ox-60, mid_y+22), 'FINGER', fill=(255, 220, 50, 170), font=font_r, anchor='rm')

# Palm width line (index MCP → pinky MCP, offset down)
p5, p17 = LM[5], LM[17]
oy = 65
d.line([(p5[0], p5[1]+oy), (p17[0], p17[1]+oy)], fill=(100, 200, 255, 220), width=5)
d.line([(p5[0], p5[1]+oy-20), (p5[0], p5[1]+oy+20)], fill=(100, 200, 255, 220), width=4)
d.line([(p17[0], p17[1]+oy-20), (p17[0], p17[1]+oy+20)], fill=(100, 200, 255, 220), width=4)
mid_x = (p5[0]+p17[0])//2
d.text((mid_x, p5[1]+oy+50), '90.7mm', fill=(100, 200, 255, 230), font=font_b, anchor='mt')
d.text((mid_x, p5[1]+oy+95), 'PALM WIDTH', fill=(100, 200, 255, 170), font=font_r, anchor='mt')

# Finger span (thumb tip → pinky tip)
p4, p20 = LM[4], LM[20]
d.line([p4, p20], fill=(232, 87, 14, 160), width=4)
span_mid = ((p4[0]+p20[0])//2, (p4[1]+p20[1])//2)
d.text((span_mid[0], span_mid[1]-50), 'SPAN 224mm', fill=(232, 87, 14, 210), font=font_b, anchor='mb')

# Throw angle badge (bottom right)
d.text((W-60, H-60), '20.7° throw arc', fill=(232, 87, 14, 210), font=font_b, anchor='rb')

# Grip diameter badge (bottom left)
d.text((60, H-60), '∅16.5mm grip', fill=(150, 230, 180, 210), font=font_b, anchor='lb')

# Orange reticle corners
rc = 200  # corner length
rw = 8
corner_col = (232, 87, 14, 200)
# top-left of hand bounding box (approx)
bx0, by0, bx1, by1 = 680, 250, 1720, 1380
d.line([(bx0, by0), (bx0+rc, by0)], fill=corner_col, width=rw)
d.line([(bx0, by0), (bx0, by0+rc)], fill=corner_col, width=rw)
d.line([(bx1, by0), (bx1-rc, by0)], fill=corner_col, width=rw)
d.line([(bx1, by0), (bx1, by0+rc)], fill=corner_col, width=rw)
d.line([(bx0, by1), (bx0+rc, by1)], fill=corner_col, width=rw)
d.line([(bx0, by1), (bx0, by1-rc)], fill=corner_col, width=rw)
d.line([(bx1, by1), (bx1-rc, by1)], fill=corner_col, width=rw)
d.line([(bx1, by1), (bx1, by1-rc)], fill=corner_col, width=rw)

# STATUS text at top
d.rectangle([0, 0, W, 100], fill=(0,0,0,160))
try:
    font_mono = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf', 44)
except:
    font_mono = font_b
d.text((W//2, 50), '● HAND LANDMARKS DETECTED — PROCESSING...', fill=(232, 87, 14, 240), font=font_mono, anchor='mm')

scan = Image.alpha_composite(scan, overlay)
scan_rgb = scan.convert('RGB')
scan_rgb.save('/home/user/dartfit/hand_scan_live.png', quality=94)
print('✓ hand_scan_live.png')

# ─────────────────────────────────────────────────────────────────
# VERSION 2 — ANALYZE SCREEN (orange-only skeleton on dark bg)
# Shows the hand photo frozen in the analyze canvas style
# ─────────────────────────────────────────────────────────────────
# Crop to hand area + scale to 560x680 (canvas size on analyze screen)
CROP = (620, 230, 1760, 1400)
hand_crop = img_orig.crop(CROP)
cW, cH = hand_crop.size

# Scale landmarks to crop space
def cl(idx):
    x, y = LM[idx]
    return (x - CROP[0], y - CROP[1])

analyze = Image.new('RGBA', (cW, cH), (0,0,0,255))
# Blend hand photo at 80% opacity
hand_rgba = hand_crop.convert('RGBA')
analyze = Image.alpha_composite(analyze, Image.blend(Image.new('RGBA', (cW,cH), (0,0,0,255)), hand_rgba, 0.82))

ov2 = Image.new('RGBA', (cW, cH), (0,0,0,0))
d2 = ImageDraw.Draw(ov2)

# Silhouette
sil_pts = [cl(k) for k in [0,1,5,9,13,17]]
d2.polygon(sil_pts, fill=(232, 87, 14, 60))
for chain in [[0,1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16],[17,18,19,20]]:
    pts2 = [cl(k) for k in chain]
    d2.line(pts2, fill=(232, 87, 14, 60), width=110, joint='curve')

# Bones (all orange)
for (i, j) in CONNECTIONS:
    d2.line([cl(i), cl(j)], fill=(232, 87, 14, 200), width=10, joint='curve')

# Joints
for idx in LM:
    x, y = cl(idx)
    r = 26 if idx == 0 else 18
    d2.ellipse([x-r, y-r, x+r, y+r], fill=(232, 87, 14, 230))
    ri = r - 6
    d2.ellipse([x-ri, y-ri, x+ri, y+ri], fill=(255, 255, 255, 200))

# Measurement lines
p9c, p12c = cl(9), cl(12)
ox2 = -60
d2.line([(p9c[0]+ox2, p9c[1]), (p12c[0]+ox2, p12c[1])], fill=(255, 220, 50, 210), width=6)
p5c, p17c = cl(5), cl(17)
oy2 = 70
d2.line([(p5c[0], p5c[1]+oy2), (p17c[0], p17c[1]+oy2)], fill=(100, 200, 255, 210), width=6)

try:
    font_sm = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 50)
    font_mono2 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf', 38)
except:
    font_sm = font_b; font_mono2 = font_b

mid_yc = (p9c[1]+p12c[1])//2
d2.text((p9c[0]+ox2-10, mid_yc), '88.6mm', fill=(255,220,50,230), font=font_sm, anchor='rm')
mid_xc = (p5c[0]+p17c[0])//2
d2.text((mid_xc, p5c[1]+oy2+10), '90.7mm', fill=(100,200,255,230), font=font_sm, anchor='mt')

# Span
p4c, p20c = cl(4), cl(20)
d2.line([p4c, p20c], fill=(232, 87, 14, 150), width=5)
spanc = ((p4c[0]+p20c[0])//2, (p4c[1]+p20c[1])//2)
d2.text((spanc[0], spanc[1]-40), 'SPAN 224mm', fill=(232, 87, 14, 200), font=font_sm, anchor='mb')

# Throw angle badge
d2.text((cW-20, cH-20), '20.7° arc', fill=(232, 87, 14, 200), font=font_mono2, anchor='rb')

analyze = Image.alpha_composite(analyze, ov2)
analyze_rgb = analyze.convert('RGB')
analyze_rgb.save('/home/user/dartfit/hand_analyze_overlay.png', quality=94)
print('✓ hand_analyze_overlay.png')
print(f'Source image: {W}×{H}')
