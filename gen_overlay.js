'use strict';
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

// Estimated MediaPipe landmark coords from the user's 2040×1536 hand photo.
// Mapped to a 390×690 canvas: hand bounding box (x700-1720, y230-1380) → (pad to edge)
const LM_RAW = {
  0:[1080,1310], 1:[1300,1140], 2:[1460,1000], 3:[1570,870], 4:[1660,760],
  5:[1195,840],  6:[1188,620],  7:[1178,450],  8:[1168,295],
  9:[1035,810],  10:[1020,595], 11:[1010,430], 12:[1003,278],
  13:[883,855],  14:[862,650],  15:[850,490],  16:[843,365],
  17:[748,930],  18:[733,750],  19:[722,635],  20:[715,545],
};
const CW=390, CH=690, PAD=28;
const X0=700, X1=1720, Y0=220, Y1=1390;
const LM = {};
for (const [k, [x,y]] of Object.entries(LM_RAW)) {
  LM[k] = [ PAD + (x-X0)/(X1-X0)*(CW-PAD*2),
             PAD + (y-Y0)/(Y1-Y0)*(CH-PAD*2) ];
}

const CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4], [0,5],[5,6],[6,7],[7,8],
  [0,9],[9,10],[10,11],[11,12], [0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20], [5,9],[9,13],[13,17],
];
const FC = { thumb:'#ff6b35', idx:'#4ecdc4', mid:'#45b7d1', ring:'#96ceb4', pnk:'#ffeaa7' };

function makePage(darkBg, allOrange) {
  const lmJ = JSON.stringify(LM);
  const conJ = JSON.stringify(CONNECTIONS);
  const bcFn = allOrange
    ? `function bc(i,j){return'rgba(232,87,14,.9)';}`
    : `function bc(i,j){const m=Math.max(i,j);if(m<=4)return'${FC.thumb}';if(m<=8)return'${FC.idx}';if(m<=12)return'${FC.mid}';if(m<=16)return'${FC.ring}';return'${FC.pnk}';}`;
  const bgDraw = darkBg
    ? `ctx.fillStyle='#0d0d0d';ctx.fillRect(0,0,CW,CH);`
    : `
      const g=ctx.createLinearGradient(0,0,CW,CH);
      g.addColorStop(0,'#3a3028');g.addColorStop(.5,'#1e1812');g.addColorStop(1,'#0d0a08');
      ctx.fillStyle=g;ctx.fillRect(0,0,CW,CH);
      // floor stripe
      ctx.fillStyle='rgba(90,65,40,.35)';ctx.fillRect(0,CH*.6,CW,CH*.4);
      // bg blobs suggesting room objects
      ctx.fillStyle='rgba(100,80,50,.12)';
      ctx.beginPath();ctx.ellipse(55,200,75,110,0,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.ellipse(330,175,55,85,.3,0,Math.PI*2);ctx.fill();
    `;
  const skinDraw = `
    const skinG=ctx.createRadialGradient(${LM[9][0]},${LM[9][1]},5,${LM[9][0]},${LM[9][1]},200);
    skinG.addColorStop(0,'rgba(225,175,145,.95)');
    skinG.addColorStop(.5,'rgba(205,155,125,.90)');
    skinG.addColorStop(1,'rgba(180,128,104,.85)');
    ctx.strokeStyle=skinG;ctx.lineCap='round';ctx.lineJoin='round';
    // Draw fingers as thick stroke paths first
    [[0,1,2,3,4],[0,5,6,7,8],[0,9,10,11,12],[0,13,14,15,16],[0,17,18,19,20]].forEach(chain=>{
      ctx.lineWidth=darkBg?0:24;
      if(!darkBg){
        ctx.beginPath();ctx.moveTo(LM[chain[0]][0],LM[chain[0]][1]);
        chain.slice(1).forEach(k=>ctx.lineTo(LM[k][0],LM[k][1]));
        ctx.stroke();
      }
    });
    // Palm fill
    const pp=[0,1,5,9,13,17].map(k=>LM[k]);
    ctx.fillStyle=skinG;
    ctx.beginPath();ctx.moveTo(pp[0][0],pp[0][1]);
    pp.forEach(([x,y])=>ctx.lineTo(x,y));ctx.closePath();ctx.fill();
  `.replace('darkBg?0:24', darkBg ? '0' : '24').replace('!darkBg', darkBg ? 'false' : 'true');
  const tintAlpha = darkBg ? 0.55 : 0.32;
  const headerTxt = darkBg ? 'BIOMECHANICAL ANALYSIS' : 'HAND SCAN';
  const statusTxt = darkBg ? 'DETECTING KEYPOINTS...' : '✓ HAND LANDMARKS DETECTED — PROCESSING...';
  const liveLabel = darkBg ? "'rgba(232,87,14,.9)'" : "'rgba(22,163,74,.95)'";
  const liveText  = darkBg ? 'ANALYZING...' : '● LIVE';

  return `<!DOCTYPE html><html><head><style>
    *{margin:0;padding:0}body{width:${CW}px;height:${CH}px;overflow:hidden;background:#000}
    canvas{display:block}
  </style></head><body><canvas id="c" width="${CW}" height="${CH}"></canvas><script>
  const LM=${lmJ};
  const CONNECTIONS=${conJ};
  ${bcFn}
  const ctx=document.getElementById('c').getContext('2d');
  const CW=${CW},CH=${CH};

  // Background
  ${bgDraw}
  // Skin
  ${skinDraw}
  // Dark tint
  ctx.fillStyle='rgba(0,0,0,${tintAlpha})';ctx.fillRect(0,0,CW,CH);

  // Silhouette glow
  ctx.save();
  ctx.fillStyle='rgba(232,87,14,0.18)';ctx.strokeStyle='rgba(232,87,14,0.18)';
  ctx.lineWidth=42;ctx.lineCap='round';ctx.lineJoin='round';
  [[0,1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16],[17,18,19,20]].forEach(chain=>{
    ctx.beginPath();ctx.moveTo(LM[chain[0]][0],LM[chain[0]][1]);
    chain.slice(1).forEach(k=>ctx.lineTo(LM[k][0],LM[k][1]));ctx.stroke();
  });
  ctx.beginPath();[0,1,5,9,13,17].forEach((k,i)=>{
    if(!i)ctx.moveTo(LM[k][0],LM[k][1]);else ctx.lineTo(LM[k][0],LM[k][1]);
  });ctx.closePath();ctx.fill();ctx.restore();

  // Bones
  ctx.lineCap='round';
  CONNECTIONS.forEach(([i,j])=>{
    ctx.beginPath();ctx.moveTo(LM[i][0],LM[i][1]);ctx.lineTo(LM[j][0],LM[j][1]);
    ctx.strokeStyle=bc(i,j);ctx.lineWidth=4;ctx.globalAlpha=.9;ctx.stroke();ctx.globalAlpha=1;
  });

  // Joints
  Object.entries(LM).forEach(([idx,[x,y]])=>{
    const r=+idx===0?8:5.5;
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);
    ctx.fillStyle='rgba(232,87,14,.93)';ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=1.3;ctx.stroke();
  });

  // ── Measurement callouts ──
  ctx.setLineDash([4,3]);ctx.lineWidth=1.6;
  // Finger length
  const ox=-34;
  ctx.strokeStyle='rgba(255,220,50,.9)';
  ctx.beginPath();ctx.moveTo(LM[9][0]+ox,LM[9][1]);ctx.lineTo(LM[12][0]+ox,LM[12][1]);ctx.stroke();
  ctx.setLineDash([]);
  const fmy=(LM[9][1]+LM[12][1])/2;
  ctx.fillStyle='rgba(255,220,50,.97)';ctx.font='bold 11px monospace';ctx.textAlign='right';
  ctx.fillText('88.6mm',LM[9][0]+ox-5,fmy-4);
  ctx.font='9px monospace';ctx.fillText('FINGER',LM[9][0]+ox-5,fmy+9);

  // Palm width
  const oy=44;
  ctx.setLineDash([4,3]);ctx.strokeStyle='rgba(100,200,255,.9)';
  ctx.beginPath();ctx.moveTo(LM[5][0],LM[5][1]+oy);ctx.lineTo(LM[17][0],LM[17][1]+oy);ctx.stroke();
  ctx.setLineDash([]);
  const pmx=(LM[5][0]+LM[17][0])/2;
  ctx.fillStyle='rgba(100,200,255,.97)';ctx.textAlign='center';
  ctx.font='bold 11px monospace';ctx.fillText('90.7mm',pmx,LM[5][1]+oy+14);
  ctx.font='9px monospace';ctx.fillText('PALM WIDTH',pmx,LM[5][1]+oy+26);

  // Span
  ctx.setLineDash([3,3]);ctx.strokeStyle='rgba(232,87,14,.6)';
  ctx.beginPath();ctx.moveTo(LM[4][0],LM[4][1]);ctx.lineTo(LM[20][0],LM[20][1]);ctx.stroke();
  ctx.setLineDash([]);
  ctx.font='bold 10px monospace';ctx.fillStyle='rgba(232,87,14,.92)';ctx.textAlign='center';
  ctx.fillText('SPAN 224mm',(LM[4][0]+LM[20][0])/2+6,(LM[4][1]+LM[20][1])/2-10);

  // ── Corner reticle ──
  const bx0=LM[17][0]-26,by0=LM[12][1]-20,bx1=LM[4][0]+26,by1=LM[0][1]+28;
  const cl=28;ctx.strokeStyle='rgba(232,87,14,.88)';ctx.lineWidth=3;
  function corner(x,y,dx,dy){ctx.beginPath();ctx.moveTo(x+cl*dx,y);ctx.lineTo(x,y);ctx.lineTo(x,y+cl*dy);ctx.stroke();}
  corner(bx0,by0,1,1);corner(bx1,by0,-1,1);corner(bx0,by1,1,-1);corner(bx1,by1,-1,-1);

  // ── Top bar ──
  ctx.fillStyle='rgba(0,0,0,0.75)';ctx.fillRect(0,0,CW,44);
  ctx.fillStyle='rgba(232,87,14,1)';ctx.font='bold 14px sans-serif';ctx.textAlign='left';
  ctx.fillText('${headerTxt}',14,28);
  ctx.fillStyle=${liveLabel};ctx.font='bold 10px monospace';ctx.textAlign='right';
  ctx.fillText('${liveText}',CW-14,28);

  // ── Bottom status ──
  ctx.fillStyle='rgba(0,0,0,0.80)';ctx.fillRect(0,CH-48,CW,48);
  ctx.fillStyle='rgba(232,87,14,.95)';ctx.font='bold 10px monospace';ctx.textAlign='center';
  ctx.fillText('${statusTxt}',CW/2,CH-26);
  ctx.fillStyle='rgba(180,180,180,.55)';ctx.font='9px sans-serif';
  ctx.fillText('Finger 88.6mm  ·  Palm 90.7mm  ·  Span 224mm  ·  Flex 0.69  ·  Arc 20.7°',CW/2,CH-10);

  document.getElementById('c')._done=true;
  </script></body></html>`;
}

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox','--disable-dev-shm-usage'] });

  async function render(html, outPath) {
    const ctx = await browser.newContext({ viewport:{width:CW,height:CH}, deviceScaleFactor:2.5 });
    const page = await ctx.newPage();
    await page.setContent(html);
    await page.waitForFunction("() => document.getElementById('c')._done===true", {timeout:5000}).catch(()=>{});
    await page.waitForTimeout(300);
    await page.screenshot({ path: outPath });
    await ctx.close();
    console.log('✓', outPath);
  }

  await render(makePage(false, false), '/home/user/dartfit/hand_scan_live.png');
  await render(makePage(true,  true),  '/home/user/dartfit/hand_analyze_overlay.png');

  await browser.close();
  console.log('Done.');
})().catch(e => { console.error(e); process.exit(1); });
