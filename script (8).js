/* ============================================================
   STORY ART — procedural SVG/CSS art for "The Fraction Chronicles"
   (historical environments, textures, fruit icons, chapter UI motifs)
   Pure presentation: no game logic lives here. Exposed as window.StoryArt.
   ============================================================ */
(function(){
'use strict';

let UID = 0;
const f = n => Math.round(n*10)/10;
function rng(seed){ let s = seed>>>0 || 1; return ()=>{ s = (Math.imul(s,1664525)+1013904223)>>>0; return s/4294967296; }; }
function hashStr(str){ let h=2166136261; for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
const lerp = (a,b,t)=> a+(b-a)*t;
/* weathering grain is layered automatically over large, stone/earth-coloured shapes of the scenery
   (skipped for blue shapes - water, sky, glazed brick, glass - and for translucent or tiny ones) */
let TEX = false;
function texOK(fill, ex, area){
  if(!TEX || area < 700 || typeof fill!=='string' || fill[0]!=='#' || fill.length!==7 || /opacity|class=/.test(ex)) return false;
  const r=parseInt(fill.substr(1,2),16), g=parseInt(fill.substr(3,2),16), b=parseInt(fill.substr(5,2),16);
  return !(b > r+10 && b >= g-6);
}
const poly = (pts,fill,ex='') => {
  const P = pts.map(p=>f(p[0])+','+f(p[1])).join(' '), base = `<polygon points="${P}" fill="${fill}" ${ex}/>`;
  if(!TEX) return base;
  const xs=pts.map(p=>p[0]), ys=pts.map(p=>p[1]), w=Math.max(...xs)-Math.min(...xs), h=Math.max(...ys)-Math.min(...ys);
  return (w<1000 && texOK(fill,ex,w*h*.6)) ? base+`<polygon points="${P}" fill="url(#sa-grain)" opacity=".55"/>` : base;
};
const rect = (x,y,w,h,fill,ex='') => {
  const base = `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="${fill}" ${ex}/>`;
  return (w<1000 && texOK(fill,ex,w*h)) ? base+`<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="url(#sa-grain)" opacity=".55" ${(ex.match(/rx="[^"]*"/)||[''])[0]}/>` : base;
};
const circ = (x,y,r,fill,ex='') => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fill}" ${ex}/>`;
const line = (x1,y1,x2,y2,stroke,w=1,ex='') => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${stroke}" stroke-width="${w}" ${ex}/>`;
const pth = (d,fill,ex='') => `<path d="${d}" fill="${fill}" ${ex}/>`;
const sway = (x,y,rnd,inner,cls='sa-sway') => `<g class="${cls}" style="transform-origin:${f(x)}px ${f(y)}px;animation-delay:-${f(rnd()*5)}s">${inner}</g>`;

function lgrad(id, stops, x2=0, y2=1){
  return `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(s=>`<stop offset="${s[0]}" stop-color="${s[1]}"${s[2]!=null?` stop-opacity="${s[2]}"`:''}/>`).join('')}</linearGradient>`;
}
function hills(rnd, baseY, amp, fill, fs=1, op=1){
  const p1=rnd()*6, p2=rnd()*6, p3=rnd()*6;
  let d = `M-600 400 L-600 ${f(baseY)}`;
  for(let x=-600;x<=1800;x+=15){
    const v = .5*Math.sin(x*.004*fs+p1)+.3*Math.sin(x*.011*fs+p2)+.2*Math.sin(x*.027*fs+p3);
    d += ` L${x} ${f(baseY-amp*(v*.5+.5))}`;
  }
  return `<path d="${d} L1800 400Z" fill="${fill}" opacity="${op}"/>`;
}
function peaks(rnd, baseY, amp, fill, n, snow){
  let pts=[[-600,400],[-600,baseY]]; const w=2400/n;
  for(let i=0;i<=n;i++){
    const px = -600 + i*w + (rnd()-.5)*w*.5, py = baseY - amp*(.45+rnd()*.55);
    pts.push([px,py]);
    pts.push([px+w/2+(rnd()-.5)*w*.2, baseY-amp*(.05+rnd()*.2)]);
  }
  pts.push([1800,baseY],[1800,400]);
  let s = poly(pts,fill);
  return s;
}
function haze(uid, y0, y1, color, a){
  const id=`hz${uid}_${y0}`;
  return `<defs>${lgrad(id,[[0,color,0],[1,color,a]])}</defs>${rect(-600,y0,2400,y1-y0,`url(#${id})`)}`;
}
function cloudPuffs(rnd, n, fill, y0, y1){
  let s=''; for(let i=0;i<n;i++){
    const x=rnd()*2400, y=y0+rnd()*(y1-y0), sc=.6+rnd()*1.1;
    s += `<g transform="translate(${f(x)} ${f(y)}) scale(${f(sc)})" fill="${fill}"><ellipse cx="0" cy="0" rx="60" ry="16"/><ellipse cx="-26" cy="-10" rx="30" ry="18"/><ellipse cx="14" cy="-16" rx="36" ry="22"/><ellipse cx="42" cy="-4" rx="26" ry="14"/></g>`;
  }
  return s;
}

/* ---------- plants ---------- */
function frond(tx,ty,ex,ey,w,fill){
  const mx=(tx+ex)/2, my=(ty+ey)/2, nx=-(ey-ty), ny=(ex-tx), l=Math.hypot(nx,ny)||1;
  const ux=nx/l*w, uy=ny/l*w;
  return `<path d="M${f(tx)} ${f(ty)} Q${f(mx+ux)} ${f(my+uy)} ${f(ex)} ${f(ey)} Q${f(mx-ux)} ${f(my-uy)} ${f(tx)} ${f(ty)}Z" fill="${fill}"/>`;
}
function palm(x,y,s,rnd,trunk='#7a5a38',leaf='#4f7a3a',leaf2='#6a9a46'){
  const h=84*s, lean=(rnd()-.5)*22*s, tx=x+lean, ty=y-h;
  let g=`<path d="M${f(x-3*s)} ${y} Q${f(x+lean*.3)} ${f(y-h*.5)} ${f(tx-1.6*s)} ${f(ty)} L${f(tx+1.8*s)} ${f(ty)} Q${f(x+lean*.3+4*s)} ${f(y-h*.5)} ${f(x+3*s)} ${y}Z" fill="${trunk}"/>`;
  for(let i=1;i<9;i++){ const t=i/9, cx=lerp(x,tx,t)+Math.sin(t*3)*lean*.1; g+=line(cx-3*s*(1-t*.4),y-h*t,cx+3*s*(1-t*.4),y-h*t-1.5,'rgba(0,0,0,.22)',.9); }
  const angs=[-175,-150,-125,-100,-80,-55,-30,-5];
  angs.forEach((a,i)=>{ const r=a*Math.PI/180, L=(38+rnd()*10)*s; const ex=tx+Math.cos(r)*L, ey=ty+Math.sin(r)*L*.55+(Math.abs(Math.cos(r))*16*s);
    g+=frond(tx,ty,ex,ey,5*s,i%2?leaf:leaf2); });
  g+=circ(tx,ty+2*s,3*s,'#5a3d22'); g+=circ(tx+4*s,ty+4*s,2.6*s,'#5a3d22');
  return sway(x,y,rnd,g);
}
function roundTree(x,y,s,rnd,canopy=['#4f7a3a','#6a9a46','#86b35a'],trunk='#6b4a2a'){
  const h=34*s;
  let g=`<path d="M${f(x-3*s)} ${y} L${f(x-2*s)} ${f(y-h)} L${f(x+2*s)} ${f(y-h)} L${f(x+3*s)} ${y}Z" fill="${trunk}"/>`;
  g+=circ(x-12*s,y-h-4*s,16*s,canopy[0])+circ(x+12*s,y-h-2*s,15*s,canopy[0])+circ(x,y-h-14*s,19*s,canopy[1]);
  for(let i=0;i<7;i++) g+=circ(x+(rnd()-.5)*30*s,y-h-(rnd()*26)*s,(3+rnd()*3)*s,canopy[2],'opacity=".7"');
  return sway(x,y,rnd,g);
}
function oliveTree(x,y,s,rnd){
  let g=`<path d="M${x-4*s} ${y} Q${x-9*s} ${y-16*s} ${x-3*s} ${y-26*s} Q${x-1*s} ${y-18*s} ${x+2*s} ${y-27*s} Q${x+9*s} ${y-14*s} ${x+4*s} ${y}Z" fill="#6f5a45"/>`;
  g+=line(x-3*s,y-4*s,x-5*s,y-14*s,'rgba(0,0,0,.25)',1);
  for(let i=0;i<9;i++){ const cx=x+(rnd()-.5)*38*s, cy=y-30*s-(rnd()*14)*s; g+=`<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(11*s)}" ry="${f(6*s)}" fill="${i%2?'#8c9a6a':'#a4b07e'}"/>`; }
  return sway(x,y,rnd,g);
}
function cypress(x,y,s,rnd,col='#2f5a3a'){
  return sway(x,y,rnd,`<path d="M${x} ${f(y-70*s)} Q${f(x+11*s)} ${f(y-34*s)} ${f(x+6*s)} ${y} L${f(x-6*s)} ${y} Q${f(x-11*s)} ${f(y-34*s)} ${x} ${f(y-70*s)}Z" fill="${col}"/><path d="M${x} ${f(y-66*s)} Q${f(x+3*s)} ${f(y-34*s)} ${f(x+1*s)} ${y}" stroke="rgba(255,255,255,.12)" stroke-width="2" fill="none"/>`);
}
function pine(x,y,s,rnd,col='#3a5a3a'){
  let g=rect(x-1.5*s,y-8*s,3*s,8*s,'#5a4028');
  for(let i=0;i<4;i++){ const w=(22-i*4)*s, yy=y-8*s-i*11*s; g+=poly([[x-w,yy],[x,yy-16*s],[x+w,yy]],col); }
  return sway(x,y,rnd,g);
}
function bamboo(x,y,h,rnd,s=1){
  const c=['#6a9a4a','#7cae56','#5a8a3e'][Math.floor(rnd()*3)];
  let g=rect(x-2.6*s,y-h,5.2*s,h,c);
  for(let yy=y-14;yy>y-h;yy-=16+rnd()*8){ g+=rect(x-3.2*s,yy,6.4*s,2,'#41692c'); }
  g+=rect(x-2.6*s,y-h,1.4*s,h,'rgba(255,255,255,.22)');
  for(let i=0;i<4;i++){ const ly=y-h+i*12+4, dir=i%2?1:-1; g+=frond(x,ly,x+dir*(16+rnd()*8)*s,ly+7,2.4*s,'#6fa34f'); }
  return sway(x,y,rnd,g);
}
function wheatPatch(x,y,w,rnd,s=1){
  let g='';
  for(let i=0;i<w/5;i++){ const px=x+i*5+(rnd()-.5)*3, h=(18+rnd()*10)*s, bend=(rnd()-.5)*5;
    g+=`<path d="M${f(px)} ${y} Q${f(px+bend)} ${f(y-h*.6)} ${f(px+bend*1.5)} ${f(y-h)}" stroke="#c9a53c" stroke-width="1.2" fill="none"/>`;
    g+=`<ellipse cx="${f(px+bend*1.5)}" cy="${f(y-h-3)}" rx="1.7" ry="4.2" fill="${i%2?'#e0be58':'#d1aa42'}" transform="rotate(${f(bend*3)} ${f(px+bend*1.5)} ${f(y-h-3)})"/>`;
  }
  return g;
}
function grassTuft(x,y,s,col='#5f8a3f'){
  let g=''; for(let i=-2;i<=2;i++) g+=`<path d="M${f(x+i*2.6*s)} ${y} Q${f(x+i*3.6*s)} ${f(y-8*s)} ${f(x+i*6*s)} ${f(y-13*s+Math.abs(i)*2)}" stroke="${col}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
  return g;
}
function rock(x,y,s,col='#8a8478'){
  return `<path d="M${f(x-14*s)} ${y} Q${f(x-14*s)} ${f(y-10*s)} ${f(x-4*s)} ${f(y-13*s)} Q${f(x+10*s)} ${f(y-14*s)} ${f(x+14*s)} ${y}Z" fill="${col}"/><path d="M${f(x-8*s)} ${f(y-6*s)} Q${f(x-2*s)} ${f(y-12*s)} ${f(x+6*s)} ${f(y-10*s)}" stroke="rgba(255,255,255,.28)" stroke-width="1.5" fill="none"/>`;
}
function jar(x,y,s,col='#b0673a',band='#e8c07a'){
  return `<path d="M${f(x-8*s)} ${f(y-22*s)} Q${f(x-14*s)} ${f(y-8*s)} ${f(x-8*s)} ${y} L${f(x+8*s)} ${y} Q${f(x+14*s)} ${f(y-8*s)} ${f(x+8*s)} ${f(y-22*s)}Z" fill="${col}"/><rect x="${f(x-6*s)}" y="${f(y-27*s)}" width="${f(12*s)}" height="${f(6*s)}" rx="2" fill="${col}"/><path d="M${f(x-11*s)} ${f(y-13*s)} Q${f(x)} ${f(y-9*s)} ${f(x+11*s)} ${f(y-13*s)}" stroke="${band}" stroke-width="${f(2.2*s)}" fill="none"/><path d="M${f(x-6*s)} ${f(y-18*s)} Q${f(x-9*s)} ${f(y-8*s)} ${f(x-6*s)} ${f(y-2*s)}" stroke="rgba(255,255,255,.3)" stroke-width="2" fill="none"/>`;
}
function windowArch(x,y,w,h,fill='#2a2018'){
  return `<path d="M${f(x)} ${f(y+h)} L${f(x)} ${f(y+w/2)} A${f(w/2)} ${f(w/2)} 0 0 1 ${f(x+w)} ${f(y+w/2)} L${f(x+w)} ${f(y+h)}Z" fill="${fill}"/>`;
}
function brickLines(x,y,w,h,rowH,color='rgba(0,0,0,.18)'){
  let s=''; for(let yy=y+rowH;yy<y+h;yy+=rowH) s+=line(x,yy,x+w,yy,color,.8);
  let k=0; for(let yy=y;yy<y+h;yy+=rowH,k++){ for(let xx=x+(k%2?rowH*1.2:0);xx<x+w;xx+=rowH*2.4) s+=line(xx,yy,xx,Math.min(yy+rowH,y+h),color,.7); }
  return s;
}
function flag(x,y,w,h,col,rnd){
  return `<line x1="${f(x)}" y1="${f(y)}" x2="${f(x)}" y2="${f(y+h*2.2)}" stroke="#4a3a2a" stroke-width="1.6"/>` +
    `<g class="sa-flag" style="transform-origin:${f(x)}px ${f(y+h/2)}px;animation-delay:-${f(rnd()*3)}s"><path d="M${f(x)} ${f(y)} Q${f(x+w*.5)} ${f(y-3)} ${f(x+w)} ${f(y+2)} L${f(x+w*.8)} ${f(y+h/2)} L${f(x+w)} ${f(y+h)} Q${f(x+w*.5)} ${f(y+h-3)} ${f(x)} ${f(y+h)}Z" fill="${col}"/></g>`;
}

/* ============================================================
   HORIZON SCENES — viewBox 0 0 1200 380, ground line at y≈360-380
   ============================================================ */
const H = {};

H.prologue = (uid,rnd)=>{
  let s='';
  s+=hills(rnd,150,60,'#9db878',.6)+haze(uid,110,200,'#fff2c8',.45);
  s+=hills(rnd,190,50,'#86a860',.9);
  // distant settlement of round mud-brick huts with thatch
  [[180,205],[222,212],[262,203],[880,208],[930,200],[978,210]].forEach(([x,y],i)=>{
    const w=26+rnd()*8;
    s+=rect(x-w/2,y-16,w,16,'#c9a878')+poly([[x-w/2-4,y-15],[x,y-34-rnd()*4],[x+w/2+4,y-15]],'#b8964a')
      +line(x-w/2-2,y-18,x,y-33,'rgba(255,255,255,.25)',1)+rect(x-3,y-10,6,10,'#6a4a2c');
    if(i%2===0) s+=`<path class="sa-smoke" d="M${x+6} ${y-36} q4 -8 0 -14 q-4 -6 1 -12" stroke="rgba(255,255,255,.55)" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  });
  s+=haze(uid,170,260,'#fff4d6',.3);
  s+=hills(rnd,236,34,'#6f9b48',1.3);
  // ploughed field with converging crop rows
  s+=poly([[-600,380],[-600,280],[1800,280],[1800,380]],'#8a6a3e');
  for(let i=0;i<22;i++){ const t=i/21, x0=lerp(-300,1500,t), x1=lerp(380,820,t);
    s+=line(x1,282,x0,380,i%2?'#6f5230':'#a07c4a',i%2?3.4:2.2,'opacity=".85"');
    if(i%3===0) s+=line(x1,282,x0,380,'#7aa24a',1.2,'stroke-dasharray="3 5" opacity=".7"'); }
  s+=wheatPatch(40,300,300,rnd,1.1)+wheatPatch(860,300,300,rnd,1.1)+wheatPatch(120,334,220,rnd,1.5)+wheatPatch(900,336,240,rnd,1.5);
  // trees & wooden fence
  s+=roundTree(90,284,1.2,rnd)+roundTree(1110,286,1.3,rnd,['#5a8a3a','#78a84c','#94c060'])+roundTree(1030,278,.9,rnd);
  for(let x=300;x<900;x+=34){ s+=rect(x,330,5,26,'#8a6038')+rect(x+.5,330,1.8,26,'rgba(255,255,255,.2)'); }
  s+=rect(296,336,610,4,'#9a7044')+rect(296,346,610,4,'#9a7044');
  s+=rect(296,336,610,1.2,'rgba(255,255,255,.28)');
  // granary on stilts / storage baskets
  s+=rect(560,298,50,26,'#c8a46a')+poly([[552,300],[585,276],[618,300]],'#a8822e')+rect(566,324,4,16,'#6a4a2c')+rect(600,324,4,16,'#6a4a2c');
  s+=windowArch(578,306,14,18,'#4a3420');
  [[640,352],[672,356]].forEach(([x,y])=>{ s+=`<ellipse cx="${x}" cy="${y-8}" rx="15" ry="12" fill="#c9954a"/><ellipse cx="${x}" cy="${y-16}" rx="15" ry="4" fill="#e8c880"/>`+line(x-13,y-10,x+13,y-10,'rgba(0,0,0,.2)',1)+line(x-12,y-4,x+12,y-4,'rgba(0,0,0,.2)',1); });
  s+=rect(-600,358,2400,22,'#6f9b48');
  return s;
};

H.egypt = (uid,rnd)=>{
  let s='';
  const pyr=(x,by,w,h,l,d)=>{
    const ax=x+w*.04, L=[x-w/2,by], M=[x+w*.14,by+7], R=[x+w/2,by], A=[ax,by-h];
    let o=poly([L,A,M],l)+poly([M,A,R],d);
    for(let i=1;i<9;i++){ const t=i/9;
      o+=line(lerp(L[0],A[0],t),lerp(L[1],A[1],t),lerp(M[0],A[0],t),lerp(M[1],A[1],t),'rgba(0,0,0,.13)',.8);
      o+=line(lerp(M[0],A[0],t),lerp(M[1],A[1],t),lerp(R[0],A[0],t),lerp(R[1],A[1],t),'rgba(0,0,0,.18)',.8); }
    o+=line(L[0],L[1],A[0],A[1],'rgba(255,255,255,.35)',1.2);
    return o;
  };
  s+=hills(rnd,205,40,'#e6c488',.5)+haze(uid,160,250,'#fff0c8',.5);
  s+=pyr(300,236,170,118,'#f0d494','#c99f58')+pyr(470,240,250,174,'#f4d99a','#cfa35c')+pyr(660,238,210,148,'#eed08e','#c79b54');
  s+=haze(uid,200,290,'#f8e4b0',.45);
  s+=hills(rnd,262,38,'#dcb877',.9)+hills(rnd,288,26,'#d1a964',1.4);
  // Nile with shimmer + sailboats + papyrus reeds
  s+=`<defs>${lgrad('nl'+uid,[[0,'#39b8c4'],[1,'#1c8ea0']])}</defs>`;
  s+=poly([[-600,300],[1800,296],[1800,330],[-600,338]],`url(#nl${uid})`);
  for(let i=0;i<20;i++){ const x=rnd()*1150, y=304+rnd()*28; s+=`<path class="sa-shimmer" style="animation-delay:-${f(rnd()*4)}s" d="M${f(x)} ${f(y)} q10 -3 22 0" stroke="rgba(255,255,255,.55)" stroke-width="1.6" fill="none" stroke-linecap="round"/>`; }
  [[760,318],[910,312]].forEach(([x,y],i)=>{ s+=`<g class="sa-bob" style="animation-delay:-${i*1.3}s">`+poly([[x-16,y],[x+16,y],[x+10,y+6],[x-10,y+6]],'#6a4426')+poly([[x,y-24],[x,y-2],[x+16,y-2]],'#f6ecd2')+line(x,y-26,x,y,'#4a3020',1.4)+`</g>`; });
  // temple: pylon gateway with cavetto cornice, carved reliefs, obelisk
  const tx=140;
  s+=`<defs><pattern id="hg${uid}" width="14" height="22" patternUnits="userSpaceOnUse"><g fill="none" stroke="rgba(90,52,20,.55)" stroke-width="1.1"><ellipse cx="4" cy="4" rx="3.4" ry="1.8"/><circle cx="4" cy="4" r=".8" fill="rgba(90,52,20,.6)"/><path d="M10 2 v8 M7 5 h6"/><path d="M2 14 q2 -3 4 0 t4 0 t4 0"/><path d="M5 18 v4 M3 20 h4"/></g></pattern></defs>`;
  [[tx,0],[tx+150,0]].forEach(([x],i)=>{
    s+=poly([[x,300],[x+8,214],[x+82,214],[x+90,300]],'#e2c286')+poly([[x+82,214],[x+90,300],[x+104,300],[x+96,214]],'#b98f50');
    s+=poly([[x+8,214],[x+82,214],[x+96,214],[x+4,214]],'#e2c286')+`<path d="M${x+2} 214 q43 -22 96 0 v-5 q-48 -22 -96 0Z" fill="#f0d89c"/>`;
    s+=poly([[x+10,222],[x+80,222],[x+86,296],[x+4,296]],`url(#hg${uid})`);
    s+=rect(x+34,236,20,2,'#8a5a2c')+`<rect x="${x+37}" y="198" width="3" height="34" fill="#7a5028"/><rect x="${x+54}" y="198" width="3" height="34" fill="#7a5028"/>`+poly([[x+36,198],[x+58,198],[x+57,194],[x+37,194]],'#c04a3a');
  });
  s+=poly([[tx+90,300],[tx+90,244],[tx+150,244],[tx+150,300]],'#2a1c12')+rect(tx+90,240,60,6,'#c9a050')+rect(tx+98,250,44,2,'rgba(255,215,120,.5)');
  s+=poly([[tx-50,300],[tx-44,150],[tx-36,150],[tx-30,300]],'#e8cb8c')+poly([[tx-44,150],[tx-40,128],[tx-36,150]],'#f4d27a')+poly([[tx-40,128],[tx-36,150],[tx-44,150]],'#ffe9a8');
  s+=line(tx-40,150,tx-40,296,'rgba(120,80,30,.4)',1.5);
  for(let i=0;i<6;i++) s+=rect(tx-42,160+i*18,5,9,'rgba(110,70,30,.55)');
  // papyrus-column colonnade (lotus/papyrus bundle capitals)
  for(let i=0;i<6;i++){ const x=420+i*34;
    s+=rect(x,262,14,36,'#e3c58a')+rect(x+9,262,5,36,'#bf9858')+`<ellipse cx="${x+7}" cy="262" rx="11" ry="6" fill="#e9d09a"/>`+`<path d="M${x-1} 262 q8 -12 16 0Z" fill="#8ec9b0"/>`+rect(x-2,296,18,4,'#c9a468'); }
  s+=rect(414,252,212,12,'#d2ad6a')+rect(414,252,212,3,'#ecd79a')+rect(414,262,212,2,'rgba(0,0,0,.18)');
  // palms, reeds
  s+=palm(40,330,1.1,rnd)+palm(1120,330,1.2,rnd)+palm(1060,336,.9,rnd)+palm(720,300,.7,rnd);
  for(let i=0;i<14;i++){ const x=830+rnd()*60, h=18+rnd()*14; s+=`<path d="M${f(x)} 332 Q${f(x+3)} ${f(332-h*.6)} ${f(x+(rnd()-.5)*6)} ${f(332-h)}" stroke="#5a9a52" stroke-width="1.6" fill="none"/>`+`<circle cx="${f(x+(rnd()-.5)*6)}" cy="${f(332-h-2)}" r="2.6" fill="#8ec078"/>`; }
  s+=rect(-600,356,2400,24,'#d8b46a');
  return s;
};

H.babylon = (uid,rnd)=>{
  let s='';
  s+=hills(rnd,225,26,'#9a8a9a',.5,.6)+haze(uid,190,270,'#f6cf9a',.5);
  // city wall: mud brick with crenellations, towers
  s+=rect(-600,262,2400,40,'#b8905a')+brickLines(-100,262,1400,40,6.5,'rgba(70,40,15,.22)');
  for(let x=-600;x<1800;x+=26){ s+=rect(x,254,15,9,'#b8905a')+line(x,254,x+15,254,'rgba(255,255,255,.25)',1); }
  for(let x=70;x<1200;x+=210){ s+=rect(x,226,34,76,'#c39a62')+brickLines(x,226,34,76,6.5,'rgba(70,40,15,.22)')+rect(x-3,220,40,7,'#a87c46'); for(let k=0;k<3;k++) s+=rect(x-3+k*14,212,10,9,'#c39a62'); s+=windowArch(x+11,244,12,18,'#33241a'); }
  // Ziggurat: stepped tiers with central stair + shrine
  const zx=600, zb=292, tiers=[[300,34],[236,32],[172,30],[112,28]];
  let yy=zb;
  tiers.forEach(([w,h],i)=>{
    yy-=h;
    s+=rect(zx-w/2,yy,w,h,i%2?'#c39a5e':'#b88b52')+poly([[zx+w/2,yy],[zx+w/2+10,yy+6],[zx+w/2+10,yy+h+6],[zx+w/2,yy+h]],'#8a6434');
    s+=brickLines(zx-w/2,yy,w,h,5.5,'rgba(60,30,10,.2)');
    s+=rect(zx-w/2,yy,w,3,'rgba(255,235,190,.4)');
    for(let k=0;k<Math.floor(w/22);k++) s+=rect(zx-w/2+8+k*22,yy+10,8,h-16,'rgba(60,30,10,.22)');
  });
  s+=poly([[zx-16,zb],[zx-8,zb-130],[zx+8,zb-130],[zx+16,zb]],'#d4ad72');
  for(let i=1;i<14;i++){ const y=zb-i*9.2; s+=line(zx-16+i*.9,y,zx+16-i*.9,y,'rgba(70,40,10,.35)',1); }
  s+=rect(zx-26,yy-24,52,24,'#2f6aa8')+rect(zx-26,yy-24,52,4,'#e8c050')+poly([[zx-32,yy-24],[zx,yy-42],[zx+32,yy-24]],'#e0b440');
  for(let k=0;k<4;k++) s+=rect(zx-20+k*11,yy-17,6,13,'#1b4a82');
  // Ishtar-style glazed gate: blue brick with rows of gold relief figures
  const gx=210;
  s+=rect(gx,214,70,88,'#1f5fa6')+rect(gx+110,214,70,88,'#1f5fa6')+rect(gx+70,236,40,66,'#14406e')+`<path d="M${gx+70} 236 a20 20 0 0 1 40 0Z" fill="#14406e"/>`;
  [gx,gx+110].forEach(x=>{ for(let r=0;r<5;r++){ s+=rect(x,222+r*16,70,2.4,'#e0b840'); for(let k=0;k<4;k++) s+=`<path d="M${x+8+k*16} ${236+r*16} h9 l-2 -7 h-5Z" fill="#e8c460" opacity=".85"/>`; }
    for(let k=0;k<2;k++) s+=rect(x+k*60,206,10,10,'#1f5fa6')+rect(x+k*60+16,206,10,10,'#1f5fa6'); s+=rect(x,200,70,6,'#d9b24a'); });
  s+=`<path d="M${gx+68} 236 a22 22 0 0 1 44 0" stroke="#e0b840" stroke-width="3" fill="none"/>`;
  // palms & river with reflections
  s+=palm(60,318,1.2,rnd,'#7a5a38','#4f7a3a','#6f9a4a')+palm(130,322,.9,rnd)+palm(1100,320,1.2,rnd)+palm(1040,324,.95,rnd)+palm(880,300,.75,rnd);
  s+=`<defs>${lgrad('eu'+uid,[[0,'#3a8ab8'],[1,'#2a6a96']])}</defs>`+poly([[-600,334],[1800,330],[1800,366],[-600,370]],`url(#eu${uid})`);
  for(let i=0;i<18;i++){ const x=rnd()*1150, y=338+rnd()*26; s+=`<path class="sa-shimmer" style="animation-delay:-${f(rnd()*4)}s" d="M${f(x)} ${f(y)} q10 -3 22 0" stroke="rgba(255,255,255,.5)" stroke-width="1.6" fill="none" stroke-linecap="round"/>`; }
  s+=rect(-600,368,2400,12,'#9a7a4a');
  return s;
};

H.china = (uid,rnd)=>{
  let s='';
  s+=peaks(rnd,230,150,'#a9b8b4',5)+haze(uid,110,260,'#f2f4ef',.65);
  s+=peaks(rnd,262,120,'#7e9690',6)+haze(uid,160,290,'#eef2ea',.55);
  s+=peaks(rnd,290,80,'#587a6c',7)+haze(uid,200,320,'#e8efe4',.35);
  // pagoda on a stone terrace: 5 tiers, up-curved eaves, red walls
  const px=640, base=312;
  s+=rect(px-70,base-10,140,14,'#9a9488')+rect(px-78,base-2,156,6,'#847e72');
  for(let k=0;k<6;k++) s+=line(px-60+k*24,base-10,px-60+k*24,base+4,'rgba(0,0,0,.18)',1);
  const tiers=5; let y=base-10;
  for(let i=0;i<tiers;i++){
    const w=92-i*13, h=22; y-=h;
    s+=rect(px-w/2+6,y,w-12,h,'#b8352a')+rect(px-w/2+6,y,3,h,'rgba(255,200,160,.35)')+rect(px+w/2-9,y,3,h,'rgba(0,0,0,.2)');
    for(let k=0;k<3;k++) s+=rect(px-w/2+14+k*((w-36)/2.4),y+6,7,12,'#4a1812');
    s+=rect(px-w/2+4,y,w-8,3,'#e8c050');
    const rw=w/2+16;
    s+=`<path d="M${f(px-rw-6)} ${f(y+2)} Q${f(px-rw+8)} ${f(y+2)} ${f(px-rw*.55)} ${f(y-6)} L${f(px-rw*.15)} ${f(y-12)} L${f(px+rw*.15)} ${f(y-12)} L${f(px+rw*.55)} ${f(y-6)} Q${f(px+rw-8)} ${f(y+2)} ${f(px+rw+6)} ${f(y+2)} Q${f(px+rw*.5)} ${f(y+7)} ${f(px)} ${f(y+7)} Q${f(px-rw*.5)} ${f(y+7)} ${f(px-rw-6)} ${f(y+2)}Z" fill="#3c4a48"/>`;
    s+=`<path d="M${f(px-rw*.55)} ${f(y-6)} L${f(px-rw*.15)} ${f(y-12)} L${f(px+rw*.15)} ${f(y-12)}" stroke="rgba(255,255,255,.28)" stroke-width="1.4" fill="none"/>`;
    for(let k=-3;k<=3;k++) s+=line(px+k*rw*.2,y-10+Math.abs(k)*1.6,px+k*rw*.24,y+6,'rgba(0,0,0,.22)',.8);
    // hanging lanterns at the eave tips
    [-1,1].forEach(d=>{ const lx=px+d*(rw+2), ly=y+4; s+=`<g class="sa-lantern" style="transform-origin:${f(lx)}px ${f(ly)}px;animation-delay:-${f(rnd()*3)}s">`+line(lx,ly,lx,ly+5,'#4a3020',1)+`<ellipse cx="${f(lx)}" cy="${f(ly+9)}" rx="3.6" ry="4.6" fill="#e04a2c"/><rect x="${f(lx-1.8)}" y="${f(ly+4)}" width="3.6" height="1.6" fill="#e8c050"/><ellipse cx="${f(lx)}" cy="${f(ly+9)}" rx="9" ry="9" fill="rgba(255,190,90,.25)"/></g>`; });
  }
  s+=line(px,y-14,px,y-36,'#e8c050',2.4)+circ(px,y-18,3,'#e8c050')+circ(px,y-26,2.4,'#e8c050');
  // stone arch bridge over a river
  s+=`<defs>${lgrad('cr'+uid,[[0,'#6aa8a4'],[1,'#3f817f']])}</defs>`+poly([[-600,334],[1800,330],[1800,372],[-600,376]],`url(#cr${uid})`);
  for(let i=0;i<16;i++){ const x=rnd()*1150, y=340+rnd()*26; s+=`<path class="sa-shimmer" style="animation-delay:-${f(rnd()*4)}s" d="M${f(x)} ${f(y)} q10 -3 22 0" stroke="rgba(255,255,255,.5)" stroke-width="1.6" fill="none" stroke-linecap="round"/>`; }
  const bx=240;
  s+=`<path d="M${bx-120} 342 Q${bx-60} 296 ${bx} 294 Q${bx+60} 296 ${bx+120} 342 L${bx+120} 352 L${bx-120} 352Z" fill="#a39b8c"/>`;
  s+=`<path d="M${bx-80} 352 Q${bx} 300 ${bx+80} 352Z" fill="#3f817f"/>`;
  s+=`<path d="M${bx-80} 352 Q${bx} 300 ${bx+80} 352" stroke="#7c7466" stroke-width="3" fill="none"/>`;
  for(let k=0;k<9;k++) s+=rect(bx-96+k*24,284+Math.abs(k-4)*3.6,3,10,'#7c7466');
  s+=`<path d="M${bx-100} 296 Q${bx} 276 ${bx+100} 296" stroke="#c9503f" stroke-width="3" fill="none"/>`;
  // bamboo grove, pine, paifang gate
  for(let i=0;i<18;i++) s+=bamboo(940+i*14+(rnd()*6),346,70+rnd()*60,rnd,.9+rnd()*.4);
  s+=pine(110,342,1.2,rnd)+pine(60,346,.9,rnd);
  const gx=430;
  s+=rect(gx,290,7,54,'#b8352a')+rect(gx+64,290,7,54,'#b8352a')+rect(gx-6,286,83,8,'#9a2a20')+`<path d="M${gx-12} 286 Q${gx+36} 268 ${gx+82} 286 L${gx+80} 280 Q${gx+36} 262 ${gx-10} 280Z" fill="#3c4a48"/>`+rect(gx+10,296,50,4,'#e8c050');
  s+=rect(-600,368,2400,12,'#7a6a52');
  return s;
};

H.greece = (uid,rnd)=>{
  let s='';
  s+=peaks(rnd,210,90,'#b7b8a2',4)+haze(uid,120,240,'#eef6fb',.55);
  // Aegean: bright band with shimmer
  s+=`<defs>${lgrad('ae'+uid,[[0,'#7cc4ea'],[1,'#2f86c4']])}</defs>`+rect(-600,226,2400,64,`url(#ae${uid})`);
  for(let i=0;i<26;i++){ const x=rnd()*1160, y=232+rnd()*50; s+=`<path class="sa-shimmer" style="animation-delay:-${f(rnd()*4)}s" d="M${f(x)} ${f(y)} q8 -3 18 0" stroke="rgba(255,255,255,.65)" stroke-width="1.5" fill="none" stroke-linecap="round"/>`; }
  s+=poly([[860,226],[900,200],[960,208],[1010,226]],'#a8a48c')+poly([[900,200],[960,208],[930,226]],'#948f78');
  s+=hills(rnd,288,34,'#aab27a',.8)+hills(rnd,306,24,'#8fa060',1.4);
  // Parthenon-style temple: 3-step stylobate, fluted Doric columns, entablature with triglyphs, pediment
  const x0=330, w=520, top=224, base=314, cols=8;
  s+=rect(x0-22,base,w+44,8,'#d8d4c6')+rect(x0-12,base-8,w+24,8,'#e6e2d6')+rect(x0-2,base-16,w+4,8,'#f2efe6');
  s+=rect(x0,top+22,w,base-16-top-22,'#2c3340','opacity=".55"');
  for(let i=0;i<cols;i++){ const cx=x0+8+i*((w-16)/(cols-1)), cw=17;
    s+=`<path d="M${f(cx-cw/2)} ${base-16} L${f(cx-cw/2+1.8)} ${top+30} L${f(cx+cw/2-1.8)} ${top+30} L${f(cx+cw/2)} ${base-16}Z" fill="#f3f0e6"/>`;
    s+=rect(cx+cw/2-5,top+30,4,base-16-top-30,'rgba(120,110,90,.22)');
    for(let k=-2;k<=2;k++) s+=line(cx+k*3,top+32,cx+k*3.4,base-18,'rgba(120,110,90,.2)',.7);
    s+=`<path d="M${f(cx-cw/2-2)} ${top+30} Q${f(cx)} ${top+36} ${f(cx+cw/2+2)} ${top+30} L${f(cx+cw/2+4)} ${top+25} L${f(cx-cw/2-4)} ${top+25}Z" fill="#ece8dc"/>`; }
  s+=rect(x0-8,top+8,w+16,17,'#f0ecdf')+rect(x0-8,top+8,w+16,2,'#fff')+rect(x0-8,top+23,w+16,2,'rgba(0,0,0,.16)');
  for(let i=0;i<30;i++){ const tx=x0-2+i*(w/29.6); s+=rect(tx,top+11,6,10,'#8a8066','opacity=".55"')+rect(tx+8,top+11,3,10,'#2f86c4','opacity=".35"'); }
  s+=poly([[x0-14,top+8],[x0+w/2,top-42],[x0+w+14,top+8]],'#f6f3ea')+poly([[x0+10,top+4],[x0+w/2,top-34],[x0+w-10,top+4]],'#c9d4de')+poly([[x0+10,top+4],[x0+w/2,top-34],[x0+w/2,top+4]],'rgba(255,255,255,.35)');
  s+=poly([[x0-14,top+8],[x0+w/2,top-42],[x0+w+14,top+8]],'none','stroke="#fff" stroke-width="2"');
  s+=circ(x0+w/2,top-14,7,'#e9eef2')+circ(x0+w/2,top-14,3,'#b7a05a');
  [x0-6,x0+w+6].forEach(ax=>{ s+=`<path d="M${ax-6} ${top+6} q6 -16 12 0Z" fill="#e8dcb0"/>`; });
  // foreground columns: Ionic (volutes) + Corinthian (acanthus), plus a stele with a geometry diagram
  const ion=(x,y)=> rect(x-8,y-46,16,46,'#f2efe6')+rect(x+3,y-46,4,46,'rgba(120,110,90,.2)')+rect(x-12,y-52,24,6,'#ece8dc')+circ(x-10,y-50,5,'#f2efe6','stroke="#cfc9b6" stroke-width="1"')+circ(x+10,y-50,5,'#f2efe6','stroke="#cfc9b6" stroke-width="1"')+rect(x-13,y-56,26,4,'#f6f3ea')+rect(x-12,y-4,24,4,'#e3dfd2');
  const cor=(x,y)=> rect(x-8,y-46,16,46,'#f2efe6')+rect(x+3,y-46,4,46,'rgba(120,110,90,.2)')+`<path d="M${x-12} ${y-46} Q${x-14} ${y-60} ${x-6} ${y-62} Q${x} ${y-70} ${x+6} ${y-62} Q${x+14} ${y-60} ${x+12} ${y-46}Z" fill="#f4f1e8"/>`+`<path d="M${x-9} ${y-48} q2 -9 5 -3 q2 -9 4 -2 q3 -8 5 0 q3 -6 4 5" stroke="#bdb59c" stroke-width="1" fill="none"/>`+rect(x-13,y-72,26,4,'#f6f3ea')+rect(x-12,y-4,24,4,'#e3dfd2');
  s+=ion(90,336)+cor(150,340)+cypress(40,340,.9,rnd)+oliveTree(1040,338,1.3,rnd)+oliveTree(1120,336,1.1,rnd)+cypress(1170,340,.8,rnd);
  s+=rect(210,300,46,40,'#e9e5d8')+rect(210,300,46,3,'#fff')+`<polygon points="222,330 222,312 244,330" fill="none" stroke="#2f86c4" stroke-width="1.6"/><rect x="222" y="322" width="8" height="8" fill="none" stroke="#2f86c4" stroke-width="1.2"/><circle cx="240" cy="314" r="7" fill="none" stroke="#c9a050" stroke-width="1.3"/>`;
  // marble statue on pedestal
  s+=rect(1000,314,22,26,'#e9e5d8')+rect(996,336,30,5,'#d8d4c6')+`<path d="M1011 312 q-7 -2 -6 -14 q0 -10 6 -12 q6 2 6 12 q1 12 -6 14Z" fill="#f4f1e8"/>`+circ(1011,282,5.4,'#f4f1e8')+rect(1004,300,14,6,'rgba(150,140,120,.3)');
  s+=rect(-600,358,2400,22,'#d6cfae');
  return s;
};

H.india = (uid,rnd)=>{
  let s='';
  s+=hills(rnd,205,34,'#c8a67a',.5,.8)+haze(uid,160,250,'#ffe3b0',.5);
  // Nagara-style shikhara temple on a stepped plinth (curvilinear tower + amalaka + kalasha)
  const tx=640, base=318;
  s+=rect(tx-110,base-8,220,10,'#c98a5a')+rect(tx-96,base-18,192,10,'#d49b68')+rect(tx-84,base-28,168,10,'#dba874');
  s+=rect(tx-70,base-84,140,56,'#d8a068')+rect(tx-70,base-84,140,4,'#efc088');
  for(let i=0;i<5;i++){ const px=tx-58+i*28; s+=rect(px,base-78,10,48,'#c58a52')+rect(px+7,base-78,3,48,'rgba(0,0,0,.2)')+rect(px-2,base-82,14,5,'#e0aa72')+rect(px-2,base-32,14,4,'#b57a46')+rect(px+2,base-70,2,34,'rgba(70,30,0,.25)'); }
  s+=windowArch(tx-12,base-72,24,44,'#3a2216')+rect(tx-14,base-30,28,2,'#efc088');
  // curvilinear tower
  s+=`<path d="M${tx-52} ${base-84} Q${tx-50} ${base-150} ${tx-12} ${base-206} L${tx+12} ${base-206} Q${tx+50} ${base-150} ${tx+52} ${base-84}Z" fill="#cf9560"/>`;
  s+=`<path d="M${tx} ${base-84} Q${tx+2} ${base-150} ${tx+12} ${base-206} L${tx+12} ${base-206} Q${tx+50} ${base-150} ${tx+52} ${base-84}Z" fill="rgba(90,40,10,.2)"/>`;
  for(let i=1;i<14;i++){ const t=i/14, y=base-84-t*122, hw=lerp(52,13,Math.pow(t,.8)); s+=line(tx-hw,y,tx+hw,y,'rgba(70,30,5,.35)',1.4); s+=line(tx-hw,y+3,tx+hw,y+3,'rgba(255,225,170,.25)',1); }
  for(let i=0;i<4;i++){ const y=base-110-i*24; s+=windowArch(tx-8,y,16,18,'#4a2a18','opacity=".55"'); }
  s+=`<ellipse cx="${tx}" cy="${base-210}" rx="18" ry="6" fill="#e0aa72"/><ellipse cx="${tx}" cy="${base-214}" rx="14" ry="5" fill="#ecbc82"/>`+rect(tx-4,base-232,8,16,'#c98a5a')+`<ellipse cx="${tx}" cy="${base-232}" rx="6" ry="4" fill="#e8c050"/>`+poly([[tx-1,base-236],[tx+1,base-236],[tx,base-252]],'#e8c050');
  s+=flag(tx+2,base-252,22,12,'#d8402c',rnd);
  // red-brick monastery/university quadrangle with arched cells + stupa (Nalanda-style learning centre)
  const mx=180;
  s+=rect(mx,252,260,66,'#a8523a')+brickLines(mx,252,260,66,6,'rgba(50,15,5,.28)')+rect(mx-6,246,272,8,'#8a3e2a')+rect(mx-6,246,272,2,'rgba(255,200,160,.35)');
  for(let i=0;i<9;i++) s+=windowArch(mx+10+i*28,276,14,40,'#2f1812')+rect(mx+12+i*28,270,10,4,'#d8a070','opacity=".5"');
  s+=rect(mx+100,238,60,14,'#b8604a')+brickLines(mx+100,238,60,14,5,'rgba(50,15,5,.25)');
  s+=`<path d="M${mx+280} 318 L${mx+280} 286 Q${mx+280} 232 ${mx+334} 232 Q${mx+388} 232 ${mx+388} 286 L${mx+388} 318Z" fill="#c08258"/>`+rect(mx+276,314,116,8,'#9a5a38')+rect(mx+300,222,68,10,'#a8683e')+line(mx+334,222,mx+334,200,'#e8c050',2)+rect(mx+322,214,24,4,'#e8c050');
  for(let k=0;k<4;k++) s+=line(mx+300+k*22,246,mx+300+k*22,314,'rgba(60,20,5,.2)',1);
  // palms, peepal, lotus pond with blooms, carved pillar
  s+=palm(60,326,1.2,rnd,'#7a5a38','#4c7e3a','#68a048')+palm(120,330,.9,rnd)+palm(1130,326,1.25,rnd)+palm(1066,332,1,rnd)+roundTree(930,320,1.2,rnd,['#4a7a34','#68a044','#84bc58']);
  s+=`<defs>${lgrad('lp'+uid,[[0,'#4fa6a0'],[1,'#2f7f80']])}</defs>`+`<ellipse cx="860" cy="350" rx="100" ry="16" fill="url(#lp${uid})"/>`;
  for(let i=0;i<7;i++){ const x=790+i*22+rnd()*6, y=346+rnd()*8; s+=`<ellipse cx="${f(x)}" cy="${f(y)}" rx="9" ry="3.2" fill="#3f8f50"/>`+`<g class="sa-sway" style="transform-origin:${f(x)}px ${f(y)}px"><path d="M${f(x)} ${f(y-1)} q-5 -6 0 -10 q5 4 0 10Z" fill="#f4a8b8"/><path d="M${f(x-3)} ${f(y-1)} q-5 -3 -4 -8 q5 1 4 8Z" fill="#ec8aa0"/><path d="M${f(x+3)} ${f(y-1)} q5 -3 4 -8 q-5 1 -4 8Z" fill="#ec8aa0"/></g>`; }
  s+=rect(-600,358,2400,22,'#d6a66e');
  return s;
};

H.islam = (uid,rnd)=>{
  let s='';
  s+=hills(rnd,215,30,'#d9c9a0',.5,.8)+haze(uid,170,260,'#f0fbf6',.55);
  // domed hall (ribbed dome on drum) with pointed-horseshoe arcade, minaret, garden, fountain
  const cx=600, base=316;
  s+=rect(cx-150,252,300,base-252,'#ede3c8')+rect(cx-150,252,300,4,'#fff6dc')+rect(cx+120,252,30,base-252,'rgba(120,90,40,.2)');
  s+=rect(cx-150,246,300,8,'#cdb98a')+`<path d="M${cx-150} 246 h300" stroke="#1fae9a" stroke-width="2.4" stroke-dasharray="8 4"/>`;
  s+=rect(cx-60,206,120,42,'#e8dcb8')+rect(cx-60,206,120,3,'#fff')+rect(cx+36,206,24,42,'rgba(120,90,40,.2)');
  for(let i=0;i<5;i++) s+=windowArch(cx-50+i*21,214,12,26,'#1c3a4a')+line(cx-44+i*21,218,cx-44+i*21,240,'rgba(255,220,130,.5)',1);
  s+=`<defs>${lgrad('dm'+uid,[[0,'#3fd0bc'],[.55,'#1fae9a'],[1,'#0f7a72']],1,0)}</defs>`;
  s+=`<path d="M${cx-52} 206 Q${cx-56} 136 ${cx} 128 Q${cx+56} 136 ${cx+52} 206Z" fill="url(#dm${uid})"/>`;
  for(let k=-3;k<=3;k++) s+=`<path d="M${cx+k*6} 206 Q${cx+k*10} 150 ${cx} 130" stroke="rgba(255,255,255,.22)" stroke-width="1.2" fill="none"/>`;
  s+=`<path d="M${cx-48} 176 Q${cx} 168 ${cx+48} 176" stroke="#e8c050" stroke-width="2" fill="none" stroke-dasharray="4 3"/>`+line(cx,130,cx,108,'#e8c050',2.2)+circ(cx,118,3.4,'#e8c050')+`<path d="M${cx-4} 108 a4 4 0 1 0 5 -4 a3 3 0 1 1 -5 4Z" fill="#e8c050"/>`;
  // arcade of pointed-horseshoe arches with geometric tile spandrels
  for(let i=0;i<9;i++){ const x=cx-144+i*32; s+=`<path d="M${x} ${base} L${x} 292 Q${x} 268 ${x+13} 262 Q${x+26} 268 ${x+26} 292 L${x+26} ${base}Z" fill="#26404a"/>`+`<path d="M${x-2} ${base} L${x-2} 292 Q${x-2} 264 ${x+13} 258 Q${x+28} 264 ${x+28} 292 L${x+28} ${base}" stroke="#1fae9a" stroke-width="2.2" fill="none"/>`+`<path d="M${x+3} ${base} L${x+3} 296" stroke="rgba(255,220,130,.35)" stroke-width="1.2"/>`; }
  // minarets
  [[cx-210,'#e9dcb8'],[cx+210,'#e9dcb8']].forEach(([x,c],i)=>{
    s+=rect(x-12,170,24,base-170,c)+rect(x+4,170,8,base-170,'rgba(120,90,40,.22)');
    for(let k=0;k<7;k++) s+=rect(x-12,184+k*19,24,2.4,'rgba(31,174,154,.55)');
    s+=rect(x-17,164,34,6,'#cdb98a')+rect(x-10,140,20,24,c)+windowArch(x-4,146,8,12,'#26404a')+poly([[x-13,140],[x,112],[x+13,140]],'#1fae9a')+line(x,112,x,98,'#e8c050',2)+circ(x,100,2.6,'#e8c050');
  });
  // library wing with scroll shelves + lamps
  s+=rect(120,268,180,50,'#e6d9b4')+rect(120,264,180,6,'#cdb98a');
  for(let i=0;i<4;i++) s+=`<path d="M${136+i*40} 318 L${136+i*40} 292 Q${136+i*40} 276 ${150+i*40} 276 Q${164+i*40} 276 ${164+i*40} 292 L${164+i*40} 318Z" fill="#3a2a22"/>`+rect(140+i*40,296,20,3,'#c98a3a')+rect(140+i*40,304,20,3,'#a8682a')+rect(142+i*40,286,4,10,'#d8402c')+rect(148+i*40,284,4,12,'#2f6aa8');
  // gardens: cypress + date palms + fountain (animated water)
  s+=cypress(60,330,1.2,rnd,'#2a5a3a')+cypress(100,334,1,rnd,'#2a5a3a')+palm(1110,332,1.25,rnd)+palm(1050,336,1,rnd)+cypress(1170,334,1,rnd,'#2a5a3a');
  s+=`<ellipse cx="600" cy="346" rx="74" ry="12" fill="#cdb98a"/><ellipse cx="600" cy="344" rx="66" ry="9.6" fill="#2fb8c4"/>`+rect(596,326,8,18,'#e9dcb8')+`<ellipse cx="600" cy="326" rx="12" ry="3.6" fill="#e9dcb8"/>`;
  s+=`<path class="sa-spout" d="M600 326 q-16 -20 -26 4 M600 326 q16 -20 26 4 M600 326 v-16" stroke="rgba(255,255,255,.8)" stroke-width="2" fill="none" stroke-linecap="round" stroke-dasharray="3 3"/>`;
  for(let i=0;i<10;i++){ const x=560+rnd()*80, y=342+rnd()*6; s+=`<path class="sa-shimmer" style="animation-delay:-${f(rnd()*3)}s" d="M${f(x)} ${f(y)} q5 -2 10 0" stroke="rgba(255,255,255,.7)" stroke-width="1.3" fill="none"/>`; }
  s+=rect(-600,358,2400,22,'#c9b88a');
  return s;
};

H.europe = (uid,rnd)=>{
  let s='';
  s+=hills(rnd,190,60,'#a8b49a',.5,.9)+haze(uid,140,250,'#e8ecf2',.6);
  s+=hills(rnd,236,40,'#8fa27c',.8);
  // patchwork medieval strip fields
  for(let i=0;i<14;i++){ const x=-50+i*100, c=['#a9b46a','#c4b86a','#8aa66a','#b6a85a'][i%4]; s+=poly([[x+40,262],[x+100,262],[x+70+(i%3)*40,300],[x-30+(i%3)*30,300]],c,'opacity=".8"'); }
  s+=hills(rnd,288,24,'#7c9468',1.2);
  // castle: curtain wall, round & square towers, conical roofs, banners, gatehouse
  const cx=620, base=318;
  s+=rect(cx-190,262,380,base-262,'#9a9a98')+rect(cx-190,262,380,4,'#bcbcb8');
  for(let i=0;i<24;i++) s+=rect(cx-190+i*16,252,9,11,'#9a9a98')+rect(cx-190+i*16,252,9,2,'#bcbcb8');
  s+=brickLines(cx-190,264,380,base-264,9,'rgba(0,0,0,.16)');
  const tower=(x,w,top,roof)=>{ let o=rect(x-w/2,top,w,base-top,'#a6a6a2')+rect(x+w/2-w*.3,top,w*.3,base-top,'rgba(0,0,0,.18)')+brickLines(x-w/2,top,w,base-top,8,'rgba(0,0,0,.16)');
    for(let k=0;k<Math.floor(w/12);k++) o+=rect(x-w/2+2+k*12,top-8,8,9,'#a6a6a2');
    o+=rect(x-w/2-3,top,w+6,4,'#bcbcb8');
    if(roof) o+=poly([[x-w/2-4,top-8],[x,top-8-w*.9],[x+w/2+4,top-8]],'#8a2a34')+poly([[x,top-8-w*.9],[x+w/2+4,top-8],[x+2,top-8]],'rgba(0,0,0,.22)');
    o+=windowArch(x-3,top+14,6,14,'#1a1a1a');
    return o; };
  s+=tower(cx-190,44,196,true)+tower(cx+190,44,196,true)+tower(cx,64,150,false)+tower(cx-100,34,214,true)+tower(cx+100,34,214,true);
  s+=poly([[cx-32,150-8],[cx,150-8-62],[cx+32,150-8]],'#2f4a7a')+poly([[cx,150-70],[cx+32,142],[cx+2,142]],'rgba(0,0,0,.22)');
  s+=flag(cx,150-70-22,26,14,'#a8283a',rnd)+flag(cx-190,196-8-40*.9-22,22,12,'#2f4a7a',rnd)+flag(cx+190,196-8-40*.9-22,22,12,'#a8283a',rnd);
  s+=`<path d="M${cx-26} ${base} L${cx-26} 286 Q${cx} 262 ${cx+26} 286 L${cx+26} ${base}Z" fill="#2a1c14"/>`+rect(cx-22,276,44,3,'#7a7a78');
  for(let k=0;k<6;k++) s+=line(cx-22+k*8.8,276,cx-22+k*8.8,base,'#6a6a68',1.4);
  // village: half-timbered houses, church spire, post windmill
  const house=(x,y,w,h,wall)=>{ let o=rect(x,y,w,h,wall)+poly([[x-5,y],[x+w/2,y-h*.7],[x+w+5,y]],'#8a4a32')+poly([[x+w/2,y-h*.7],[x+w+5,y],[x+w/2,y]],'rgba(0,0,0,.18)');
    o+=rect(x,y,w,2.4,'#5a3a22')+rect(x,y+h-2,w,2,'#5a3a22')+line(x,y,x+w,y+h,'#5a3a22',1.6)+line(x+w,y,x,y+h,'#5a3a22',1.6)+line(x+w/2,y,x+w/2,y+h,'#5a3a22',1.6);
    o+=rect(x+w*.14,y+h*.4,6,7,'#2a2a3a')+rect(x+w*.7,y+h*.4,6,7,'#2a2a3a');
    return o; };
  s+=house(60,300,46,34,'#eadfc0')+house(116,306,40,28,'#e4d6b4')+house(920,298,48,36,'#eadfc0')+house(980,306,42,28,'#dccaa4')+house(1040,300,44,34,'#e6d9b8');
  s+=rect(846,272,22,62,'#bdb8a8')+brickLines(846,272,22,62,7,'rgba(0,0,0,.16)')+poly([[842,272],[857,222],[872,272]],'#7a3a3a')+line(857,222,857,206,'#e8c050',1.8)+line(851,212,863,212,'#e8c050',1.8)+rect(836,310,42,24,'#c8c2b0')+windowArch(852,314,10,18,'#2a2a3a');
  s+=`<g class="sa-mill" style="transform-origin:200px 268px">`+line(200,268,200,224,'#6a4a2c',2)+line(200,268,200,312,'#6a4a2c',2)+line(200,268,156,268,'#6a4a2c',2)+line(200,268,244,268,'#6a4a2c',2)+poly([[200,268],[200,224],[212,224],[212,262]],'rgba(245,235,215,.9)')+poly([[200,268],[244,268],[244,280],[206,274]],'rgba(245,235,215,.9)')+poly([[200,268],[200,312],[188,312],[188,274]],'rgba(245,235,215,.9)')+poly([[200,268],[156,268],[156,256],[194,262]],'rgba(245,235,215,.9)')+`</g>`+poly([[184,320],[192,268],[208,268],[216,320]],'#8a6038')+rect(190,268,20,8,'#6a4a2c');
  s+=roundTree(30,318,1.2,rnd,['#4f7a42','#6a9a52','#86b46a'])+roundTree(1170,320,1.4,rnd,['#4f7a42','#6a9a52','#86b46a'])+roundTree(780,322,1,rnd,['#5a8446','#76a05a','#92bc72']);
  s+=rect(-600,358,2400,22,'#8a8678');
  return s;
};

H.modern = (uid,rnd)=>{
  let s='';
  s+=hills(rnd,250,24,'#34415e',.6,.7)+haze(uid,160,300,'#6f6ab8',.28);
  // skyline of glass towers with lit windows, reflective gradients
  s+=`<defs>${lgrad('gl'+uid,[[0,'#7fd4ff',.9],[.5,'#3a78c4',.9],[1,'#1c2f5a',.95]],1,1)}${lgrad('gl2'+uid,[[0,'#b9a8ff',.85],[1,'#26356a',.95]],1,1)}</defs>`;
  const bldg=(x,w,h,i)=>{ const g= i%3===1?`url(#gl2${uid})`:`url(#gl${uid})`; let o=rect(x,330-h,w,h,g)+rect(x,330-h,w,2,'rgba(255,255,255,.6)')+poly([[x,330-h],[x+w*.38,330-h],[x+w*.12,330]],'rgba(255,255,255,.12)');
    for(let yy=330-h+8; yy<324; yy+=9){ for(let xx=x+4; xx<x+w-4; xx+=7){ if(rnd()<.34) o+=rect(xx,yy,4,5,rnd()<.5?'#ffe9a8':'#9ae8ff',`class="sa-win" style="animation-delay:-${f(rnd()*6)}s" opacity=".8"`); } }
    return o; };
  [[20,50,120],[80,40,170],[128,60,100],[196,46,200],[250,70,140],[330,44,230],[382,56,120],[446,48,180],[760,52,150],[820,46,220],[874,64,130],[946,44,190],[996,60,110],[1064,50,170],[1120,56,130]].forEach(([x,w,h],i)=>{ s+=bldg(x,w,h,i); });
  s+=rect(350,330-230-26,2,26,'#cfe8ff')+circ(351,330-230-28,2.2,'#ff6a6a','class="sa-win"');
  // central university / mathematics laboratory with big glass facade + observatory dome
  const lx=520, lw=210;
  s+=rect(lx,262,lw,68,`url(#gl${uid})`)+rect(lx,258,lw,5,'#e8f2ff')+poly([[lx,262],[lx+lw*.3,262],[lx+lw*.08,330]],'rgba(255,255,255,.14)');
  for(let k=1;k<7;k++) s+=line(lx+k*lw/7,262,lx+k*lw/7,330,'rgba(255,255,255,.4)',1.2);
  s+=line(lx,296,lx+lw,296,'rgba(255,255,255,.4)',1.2);
  s+=`<path d="M${lx+70} 258 a35 35 0 0 1 70 0Z" fill="#dfe8f4"/><path d="M${lx+70} 258 a35 35 0 0 1 70 0" stroke="#fff" stroke-width="1.4" fill="none"/>`+rect(lx+100,226,10,32,'rgba(60,80,120,.5)')+line(lx+105,228,lx+105,256,'#9ae8ff',1.2);
  // digital math display
  s+=rect(lx+14,272,80,20,'#0c1530','stroke="#5ee0ff" stroke-width="1.6"')+`<text x="${lx+54}" y="287" text-anchor="middle" font-family="Nunito,sans-serif" font-weight="800" font-size="13" fill="#7ff0ff">½ + ¼ = ¾</text>`;
  // wind turbine (engineering), spinning
  s+=poly([[678,330],[682,196],[686,330]],'#e8eef6')+`<g class="sa-spin" style="transform-origin:682px 196px">`+poly([[682,196],[679,140],[685,140]],'#f2f6fb')+poly([[682,196],[730,222],[728,228]],'#f2f6fb')+poly([[682,196],[634,224],[636,229]],'#f2f6fb')+`</g>`+circ(682,196,4,'#cfe0f0');
  // modern trees / planters
  [[480,334],[760,334],[300,336]].forEach(([x,y])=>{ s+=rect(x-6,y-8,12,8,'#2a3a56')+circ(x,y-16,9,'#3ea58a')+circ(x-5,y-12,6,'#56c4a0'); });
  s+=rect(-600,358,2400,22,'#2a3550');
  return s;
};

/* ============================================================
   THEMES: palette, period, landmark facts, journal card per chapter
   ============================================================ */
const THEME = {
  prologue:{ n:'Prologue', sky:['#8fc9ee','#cfe6d2','#fff0c6'], ground:'#7a9c4e', tile:'grass', road:['#ead7a2','#c8a468'],
    accent:'#c9a24a', accent2:'#6f9b48', panel:'#fdf5de', panel2:'#f4e6bd', ink:'#33290f', frame:['#9a7044','#6a4a2a'], board:['#9a7044','#6a4a2a'],
    frieze:'wheat', particle:'pollen', sun:[78,10,'#fff3b0'],
    civ:'Early Farming Communities', period:'Over 10,000 years ago',
    link:'Sharing a harvest fairly is where the idea of "a part of a whole" first becomes useful.',
    lm:{ label:'Harvest Fields', x:600, y:225, text:'Farming began more than 10,000 years ago in several parts of the world. Dividing grain and land fairly made "a part of a whole" a practical idea, long before any fraction notation existed.' },
    card:{ title:'Sharing the Harvest', prop:'basket', text:'Early farming communities needed ways to divide a harvest fairly. Talking about "a half" or "a quarter" of a loaf or a field came long before written fractions.' } },
  egypt:{ n:'Egypt', sky:['#6ab4dc','#f0d9a4','#fdeab8'], ground:'#d8b46a', tile:'sand', road:['#ecd8a6','#c9a060'],
    accent:'#d4a62a', accent2:'#2fa6b0', panel:'#f8e8bf', panel2:'#ecd29a', ink:'#3a2a10', frame:['#d9b04a','#9a6a1a'], board:['#c9a050','#8a5a1a'],
    frieze:'egypt', particle:'dust', sun:[18,12,'#fff2b0'],
    civ:'Ancient Egypt', period:'c. 2000–1550 BCE',
    link:'Egyptian scribes wrote most fractions as sums of unit fractions — 3/4 became 1/2 + 1/4.',
    lm:{ label:'Pyramids of Giza', x:470, y:150, text:'The Great Pyramid of Giza was built around 2560 BCE. Surveying, rationing and building on this scale needed careful measuring. The Rhind Papyrus (copied c. 1550 BCE) shows scribes working with unit fractions.' },
    card:{ title:'Unit Fractions & the Rhind Papyrus', prop:'papyrus', text:'The Rhind Mathematical Papyrus (copied around 1550 BCE) lists many problems solved with unit fractions such as 1/2 + 1/4.' } },
  babylon:{ n:'Babylon', sky:['#3f6fae','#d9a58f','#f8d39c'], ground:'#a98456', tile:'brick', road:['#e0c590','#b08a58'],
    accent:'#e0b440', accent2:'#2f6aa8', panel:'#f6ecd2', panel2:'#e6d4a6', ink:'#1f2a44', frame:['#2f6aa8','#163e72'], board:['#2f6aa8','#163e72'],
    frieze:'babylon', particle:'sparkle', night:true, sun:[84,26,'#ffe2a0'],
    civ:'Mesopotamia & Babylon', period:'c. 2000–1600 BCE onward',
    link:'Babylonian scribes counted in base 60, so their fractions worked like decimals — but with sixtieths.',
    lm:{ label:'Ziggurat', x:600, y:190, text:'Ziggurats were stepped temple towers in Mesopotamian cities. Scribes of this region pressed cuneiform into clay tablets and used a base-60 (sexagesimal) number system with fractional places.' },
    card:{ title:'Base-60 on Clay', prop:'tablet', text:'Babylonian scribes wrote numbers in base 60. Our 60-minute hours and 360° circles still echo that tradition.' } },
  china:{ n:'China', sky:['#a9c6d4','#ecdccc','#f8ecd8'], ground:'#7e8a62', tile:'flagstone', road:['#e4d6bc','#a79a82'],
    accent:'#d8a62c', accent2:'#b8352a', panel:'#fcf1e2', panel2:'#f1d9c0', ink:'#3a1a14', frame:['#b8352a','#7a1c18'], board:['#a02a22','#6a1812'],
    frieze:'china', particle:'petal', sun:[82,16,'#fff0d0'],
    civ:'Ancient China', period:'Han-era and earlier traditions, c. 200 BCE – 200 CE',
    link:'The Nine Chapters on the Mathematical Art explains how to add, subtract and simplify fractions.',
    lm:{ label:'Pagoda', x:640, y:150, text:'Pagodas grew out of Buddhist architecture that reached China during the Han era and flourished in later centuries. The Nine Chapters on the Mathematical Art took shape over many centuries, with material from the Han period or earlier.' },
    card:{ title:'Counting Rods & Nine Chapters', prop:'rods', text:'Chinese mathematicians calculated with counting rods. The Nine Chapters on the Mathematical Art includes methods for working with fractions.' } },
  greece:{ n:'Greece', sky:['#5aa8e0','#bfe0f4','#eef8fc'], ground:'#d6cfae', tile:'marble', road:['#f4f0e4','#cfc8b4'],
    accent:'#c9a050', accent2:'#2f86c4', panel:'#fbfaf4', panel2:'#e9e6da', ink:'#1f2f46', frame:['#e9e6da','#a9a38c'], board:['#d8d4c6','#8e897a'],
    frieze:'greece', particle:'sparkle', sun:[20,10,'#fffbd0'],
    civ:'Ancient Greece', period:'c. 600–300 BCE',
    link:'Greek geometers treated fractions as ratios — comparisons between lengths, areas and numbers.',
    lm:{ label:'Doric Temple', x:590, y:200, text:'The Parthenon (built 447–432 BCE) is a Doric temple. Greek builders and geometers cared about proportion, and Euclid\'s Elements (c. 300 BCE) organised the study of ratios and geometry.' },
    card:{ title:'Ratio and Proportion', prop:'diagram', text:'Greek mathematicians such as Euclid studied ratios of lengths and areas, giving fractions a geometric meaning.' } },
  india:{ n:'India', sky:['#f2a860','#f8d4a0','#fff0c8'], ground:'#c98a52', tile:'sandstone', road:['#f0d8a8','#c18a50'],
    accent:'#e8b04a', accent2:'#b8402a', panel:'#fbf0da', panel2:'#f0d6a6', ink:'#3a1a0c', frame:['#b8402a','#7a2418'], board:['#b8602a','#7a3818'],
    frieze:'india', particle:'petal', sun:[16,18,'#ffe0a0'],
    civ:'India', period:'c. 5th–12th centuries CE',
    link:'Indian mathematicians wrote fractions with one number above another and refined place-value numerals.',
    lm:{ label:'Temple & Monastery', x:640, y:110, text:'Learning centres such as Nalanda flourished from about the 5th to the 12th century CE, the same period in which mathematicians like Aryabhata and Brahmagupta wrote. Stone temples with curved towers (shikharas) were built across India in these centuries.' },
    card:{ title:'Palm-Leaf Mathematics', prop:'palmleaf', text:'Indian scholars refined place-value numerals and wrote fractions with the numerator above the denominator. Many texts were copied onto palm leaves.' } },
  islam:{ n:'Islamic Golden Age', sky:['#4fb8c8','#bfe8e0','#f6f2dc'], ground:'#c9b88a', tile:'zellige', road:['#f4ead0','#c9b890'],
    accent:'#e0b440', accent2:'#1fae9a', panel:'#fbf7ea', panel2:'#e8e0c4', ink:'#0f3a40', frame:['#1fae9a','#0f6a68'], board:['#17887c','#0b504c'],
    frieze:'islam', particle:'sparkle', sun:[84,12,'#fff8d0'],
    civ:'The Islamic Golden Age', period:'c. 8th–14th centuries CE',
    link:'Scholars translated, tested and improved Greek and Indian mathematics, and used fractions in trade, inheritance and astronomy.',
    lm:{ label:'Domed Hall', x:600, y:130, text:'In 9th-century Baghdad, the House of Wisdom was a centre for translating and studying works from Greece and India. Al-Khwarizmi (c. 780–850) wrote on Hindu-Arabic numerals and algebra.' },
    card:{ title:'Astrolabes & Algebra', prop:'astrolabe', text:'Scholars built on Greek and Indian mathematics. Instruments such as the astrolabe relied on careful measurement and division of angles.' } },
  europe:{ n:'Medieval Europe', sky:['#8fa8c8','#cdd6e0','#f0eadc'], ground:'#8a8678', tile:'cobble', road:['#d6cdb6','#9a9078'],
    accent:'#c9a24a', accent2:'#8a2a34', panel:'#f6ecd2', panel2:'#e6d4a8', ink:'#33200f', frame:['#7a5a3a','#4a3220'], board:['#7a5a3a','#4a3220'],
    frieze:'europe', particle:'leaf', sun:[22,14,'#fff0c8'],
    civ:'Medieval Europe', period:'c. 12th–15th centuries CE',
    link:'Merchants adopted Hindu-Arabic numerals, and the horizontal fraction bar became common in writing.',
    lm:{ label:'Castle', x:620, y:120, text:'Fibonacci\'s Liber Abaci (1202) taught European merchants the Hindu-Arabic numerals and helped make the horizontal fraction bar common. Market scales and tally sticks were everyday tools for measuring and counting.' },
    card:{ title:'The Fraction Bar', prop:'scale', text:'Fibonacci\'s Liber Abaci (1202) introduced Hindu-Arabic numerals to merchants and helped make the fraction bar common in Europe.' } },
  modern:{ n:'Modern Mathematics', sky:['#10183a','#3a3a86','#8a78c8'], ground:'#232d3d', tile:'grid', road:['#7be6ff','#3a7ab8'],
    accent:'#5ee0ff', accent2:'#9a7aff', panel:'#f4f8ff', panel2:'#dde8f6', ink:'#13234a', frame:['#5ee0ff','#2a5aa0'], board:['#2a4a86','#12224a'],
    frieze:'modern', particle:'data', night:true, sun:[86,14,'#cfe0ff'],
    civ:'Modern Mathematics', period:'c. 1600 CE – today',
    link:'Fractions underpin algebra, calculus, physics, engineering and computing.',
    lm:{ label:'Laboratory & Skyline', x:620, y:250, text:'Fractions appear in engineering ratios, scientific formulas, probability and finance. Computers store many non-whole numbers as binary fractions.' },
    card:{ title:'Fractions Everywhere', prop:'panel', text:'From engineering ratios to probability, fractions describe parts, rates and chances. Computers even store many numbers as binary fractions.' } }
};

/* ============================================================
   GROUND TEXTURE TILES (160×160 SVG data-URIs: soil, sand, brick, stone, marble…)
   ============================================================ */
const svgURI = s => 'url("data:image/svg+xml;utf8,' + encodeURIComponent(s) + '")';
function star8(cx,cy,r,fill,stroke,sw=1){
  const a=[],b=[]; for(let i=0;i<4;i++){ const t=i*Math.PI/2; a.push([cx+r*Math.cos(t+Math.PI/4),cy+r*Math.sin(t+Math.PI/4)]); b.push([cx+r*Math.cos(t),cy+r*Math.sin(t)]); }
  const pp=p=>p.map(q=>f(q[0])+','+f(q[1])).join(' ');
  return `<polygon points="${pp(a)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/><polygon points="${pp(b)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
}
function tileSVG(kind, base){
  const r = rng(hashStr(kind)+11); const S=160; let g='';
  const sp = (n,fn)=>{ for(let i=0;i<n;i++) g+=fn(i); };
  switch(kind){
    case 'grass':
      sp(90,()=>`<ellipse cx="${f(r()*S)}" cy="${f(r()*S)}" rx="${f(2+r()*5)}" ry="${f(1+r()*2)}" fill="${r()<.5?'#5f8a3c':'#92b660'}" opacity=".35"/>`);
      sp(26,()=>{ const x=r()*S,y=r()*S; return `<path d="M${f(x)} ${f(y)} q-2 -7 -5 -9 M${f(x)} ${f(y)} q1 -8 1 -11 M${f(x)} ${f(y)} q3 -6 6 -8" stroke="#4f7a32" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".7"/>`; });
      sp(9,()=>{ const x=r()*S,y=r()*S; return circ(x,y,1.8,r()<.5?'#fff2a0':'#ffffff','opacity=".85"'); });
      sp(6,()=>`<ellipse cx="${f(r()*S)}" cy="${f(r()*S)}" rx="${f(6+r()*8)}" ry="${f(3+r()*3)}" fill="#8a6a3a" opacity=".16"/>`);
      break;
    case 'sand':
      sp(7,i=>`<path d="M${f(-10)} ${f(10+i*24+r()*6)} q40 ${f(-8-r()*6)} 80 0 t90 0" stroke="#f6e2b0" stroke-width="2" fill="none" opacity=".55"/><path d="M-10 ${f(15+i*24+r()*6)} q40 ${f(-8-r()*6)} 80 0 t90 0" stroke="#b78a40" stroke-width="1.2" fill="none" opacity=".28"/>`);
      sp(120,()=>circ(r()*S,r()*S,.6+r()*1.1,r()<.5?'#a7793a':'#fff0c4','opacity=".5"'));
      sp(5,()=>`<ellipse cx="${f(r()*S)}" cy="${f(r()*S)}" rx="${f(3+r()*4)}" ry="${f(1.6+r()*1.6)}" fill="#9a7440" opacity=".45"/>`);
      break;
    case 'brick':
      for(let row=0;row<8;row++){ const y=row*20; for(let col=-1;col<5;col++){ const x=col*40+(row%2?20:0); g+=`<rect x="${x+1}" y="${y+1}" width="38" height="18" rx="1.5" fill="${['#b58c58','#a98350','#bf9662','#9c7a4a'][Math.floor(r()*4)]}" opacity=".55"/>`; } }
      sp(70,()=>circ(r()*S,r()*S,.6+r()*1.2,'#4a3018','opacity=".25"'));
      sp(4,()=>`<path d="M${f(r()*S)} ${f(r()*S)} l${f(r()*10-5)} ${f(6+r()*8)} l${f(r()*8-4)} 5" stroke="#4a3018" stroke-width="1" fill="none" opacity=".4"/>`);
      break;
    case 'flagstone':
      sp(14,()=>{ const x=r()*S,y=r()*S,w=26+r()*24,h=20+r()*16; return `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="6" fill="${['#8f9684','#a2a692','#7e8a74','#9a9a88'][Math.floor(r()*4)]}" stroke="#5e6556" stroke-width="1.4" opacity=".6"/>`; });
      sp(24,()=>`<ellipse cx="${f(r()*S)}" cy="${f(r()*S)}" rx="${f(2+r()*5)}" ry="${f(1+r()*2)}" fill="#5f8a3c" opacity=".35"/>`);
      sp(6,()=>`<path d="M${f(r()*S)} ${f(r()*S)} l${f(r()*12-6)} ${f(7+r()*9)}" stroke="#4a5044" stroke-width="1" fill="none" opacity=".45"/>`);
      break;
    case 'marble':
      for(let a=0;a<2;a++) for(let b=0;b<2;b++){ g+=`<rect x="${a*80+1.5}" y="${b*80+1.5}" width="77" height="77" fill="${['#f4f1e8','#ebe7da','#f8f6ee','#e6e2d4'][(a*2+b+(r()<.3?1:0))%4]}" stroke="#bfb9a4" stroke-width="1.6"/>`; }
      sp(9,()=>`<path d="M${f(r()*S)} ${f(r()*S)} q${f(r()*30-15)} ${f(r()*20)} ${f(r()*40-20)} ${f(20+r()*20)} t${f(r()*20-10)} ${f(20+r()*10)}" stroke="#8aa0b4" stroke-width="${f(.6+r()*.8)}" fill="none" opacity=".35"/>`);
      sp(26,()=>circ(r()*S,r()*S,.7,'#9a948a','opacity=".25"'));
      break;
    case 'sandstone':
      for(let a=0;a<2;a++) for(let b=0;b<2;b++){ g+=`<rect x="${a*80+1}" y="${b*80+1}" width="78" height="78" fill="${['#d49a5e','#cc9054','#da a46a'.replace(' ','')][(a+b)%3]}" stroke="#8a5428" stroke-width="1.6" opacity=".6"/>`; g+=`<polygon points="${a*80+40},${b*80+10} ${a*80+70},${b*80+40} ${a*80+40},${b*80+70} ${a*80+10},${b*80+40}" fill="none" stroke="#7a4420" stroke-width="1.2" opacity=".55"/>`; g+=circ(a*80+40,b*80+40,6,'none','stroke="#e8b04a" stroke-width="1.4" opacity=".7"'); g+=circ(a*80+40,b*80+40,2,'#e8b04a','opacity=".7"'); }
      sp(90,()=>circ(r()*S,r()*S,.7+r(),r()<.5?'#6a3a14':'#f6d8a0','opacity=".32"'));
      break;
    case 'zellige':
      for(let a=0;a<2;a++) for(let b=0;b<2;b++){ const cx=a*80+40, cy=b*80+40; g+=`<rect x="${a*80}" y="${b*80}" width="80" height="80" fill="${(a+b)%2?'#1f8f84':'#2aa89a'}"/>`+star8(cx,cy,34,'#f4ead0','#0c5a58',1.4)+star8(cx,cy,19,'#1fae9a','#0c5a58',1.2)+circ(cx,cy,5,'#e0b440','stroke="#0c5a58" stroke-width="1"')+`<path d="M${a*80} ${b*80} l12 12 M${a*80+80} ${b*80} l-12 12 M${a*80} ${b*80+80} l12 -12 M${a*80+80} ${b*80+80} l-12 -12" stroke="#e0b440" stroke-width="1.6"/>`; }
      g+=`<rect width="160" height="160" fill="none" stroke="#0c5a58" stroke-width="1.5" opacity=".5"/>`;
      break;
    case 'cobble':
      sp(120,()=>{ const x=(Math.floor(r()*10))*16+(r()*6), y=(Math.floor(r()*10))*16+(r()*6); const c=['#8f8b80','#a29e90','#7a766c','#9a9686','#b0ac9c'][Math.floor(r()*5)]; return `<ellipse cx="${f(x+8)}" cy="${f(y+8)}" rx="${f(6.5+r()*2)}" ry="${f(5.5+r()*2)}" fill="${c}" stroke="#4e4a42" stroke-width="1.1" opacity=".85"/><ellipse cx="${f(x+6)}" cy="${f(y+6)}" rx="3" ry="1.8" fill="#fff" opacity=".18"/>`; });
      sp(30,()=>`<ellipse cx="${f(r()*S)}" cy="${f(r()*S)}" rx="${f(2+r()*3)}" ry="1.2" fill="#5f8a3c" opacity=".35"/>`);
      break;
    case 'grid': default:
      for(let i=0;i<=8;i++){ g+=line(i*20,0,i*20,160,'#4ad8ff',1,'opacity=".28"')+line(0,i*20,160,i*20,'#4ad8ff',1,'opacity=".28"'); }
      sp(12,()=>circ(Math.floor(r()*9)*20,Math.floor(r()*9)*20,2.4,'#7ff0ff','opacity=".8"'));
      sp(4,()=>`<rect x="${Math.floor(r()*7)*20}" y="${Math.floor(r()*7)*20}" width="20" height="20" fill="#9a7aff" opacity=".14"/>`);
      break;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}"><rect width="${S}" height="${S}" fill="${base}"/>${g}</svg>`;
}

/* ---------- chapter friezes: repeating 40×14 border strips ---------- */

/* large-scale ground variation drawn over the repeating tile (611px: coprime with the 160px tile) */
function macroSVG(kind, base, night){
  const r = rng(hashStr('m'+kind)+5), S=611; let g='', defs='';
  const P = {
    grass:    { dark:'#2f5a22', light:'#b6d878', warm:'#8a6a3a', stone:'#9a9488', crack:false, moss:false },
    sand:     { dark:'#8a5e24', light:'#fff0c0', warm:'#b8863a', stone:'#9a7440', crack:true,  moss:false },
    brick:    { dark:'#3a2410', light:'#e8c890', warm:'#7a5a30', stone:'#8a6a3c', crack:true,  moss:false },
    flagstone:{ dark:'#2e3a2a', light:'#b8c0a4', warm:'#6a6a4a', stone:'#7a8070', crack:true,  moss:true  },
    marble:   { dark:'#6a6a5a', light:'#ffffff', warm:'#b0a890', stone:'#c8c2b0', crack:true,  moss:false },
    sandstone:{ dark:'#5a2a10', light:'#f8d8a0', warm:'#9a5a2a', stone:'#8a5a34', crack:true,  moss:false },
    zellige:  { dark:'#0a3a3a', light:'#f4ead0', warm:'#1f8f84', stone:'#d8c890', crack:true,  moss:false },
    cobble:   { dark:'#2a2a26', light:'#c8c4b4', warm:'#5a4a38', stone:'#8a8678', crack:false, moss:true  },
    grid:     { dark:'#04060e', light:'#5ee0ff', warm:'#9a7aff', stone:'#3a4a6a', crack:false, moss:false }
  }[kind] || { dark:'#222', light:'#fff', warm:'#888', stone:'#888', crack:false, moss:false };
  const blot = (i,col,op)=>{ const x=r()*S, y=r()*S, rx=60+r()*130, ry=rx*(.35+r()*.5), a=r()*180;
    defs += `<radialGradient id="b${i}"><stop offset="0" stop-color="${col}" stop-opacity="${op}"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient>`;
    // draw wrapped copies so the tile stays seamless
    [[0,0],[S,0],[-S,0],[0,S],[0,-S]].forEach(([ox,oy])=>{ g += `<ellipse cx="${f(x+ox)}" cy="${f(y+oy)}" rx="${f(rx)}" ry="${f(ry)}" fill="url(#b${i})" transform="rotate(${f(a)} ${f(x+ox)} ${f(y+oy)})"/>`; });
  };
  for(let i=0;i<8;i++) blot(i, P.dark, night?.22:.16);
  for(let i=8;i<14;i++) blot(i, P.light, night?.12:.15);
  for(let i=14;i<18;i++) blot(i, P.warm, .13);
  if(P.moss) for(let i=18;i<22;i++) blot(i, '#4f7a32', .2);
  for(let i=0;i<26;i++){ const x=r()*(S-20)+10, y=r()*(S-20)+10, k=.6+r()*1.2;
    g += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(3.5*k)}" ry="${f(2.2*k)}" fill="${P.stone}" opacity=".5"/><ellipse cx="${f(x-.8)}" cy="${f(y-1)}" rx="${f(2.4*k)}" ry="${f(1.2*k)}" fill="#fff" opacity=".16"/><ellipse cx="${f(x+1.5)}" cy="${f(y+2.3*k)}" rx="${f(4*k)}" ry="${f(1.1*k)}" fill="#000" opacity=".15"/>`; }
  if(P.crack) for(let i=0;i<7;i++){ let x=r()*S, y=r()*S, d=`M${f(x)} ${f(y)}`; const n=4+Math.floor(r()*4); for(let k=0;k<n;k++){ x+=r()*24-12; y+=6+r()*14; d+=` L${f(x)} ${f(y)}`; }
    g += `<path d="${d}" stroke="${P.dark}" stroke-width="1.1" fill="none" opacity=".34" stroke-linejoin="round"/><path d="${d}" stroke="${P.light}" stroke-width=".6" fill="none" opacity=".18" transform="translate(1 1)"/>`; }
  const grain = night ? '0 0 0 0 .4  0 0 0 0 .9  0 0 0 0 1  1.2 0 0 0 -.7' : '0 0 0 0 .1  0 0 0 0 .07  0 0 0 0 .03  1.4 0 0 0 -.6';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}"><defs>${defs}<filter id="gn" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="${hashStr(kind)%60}" stitchTiles="stitch"/><feColorMatrix type="matrix" values="${grain}"/></filter></defs>${g}<rect width="${S}" height="${S}" filter="url(#gn)" opacity=".45"/></svg>`;
}

function friezeSVG(kind, th){
  const a=th.accent, b=th.accent2; let g='';
  switch(kind){
    case 'wheat': g=`<rect width="40" height="14" fill="${th.frame[0]}"/>`+[0,20].map(x=>`<path d="M${x+10} 13 V3" stroke="#e8c85a" stroke-width="1.2"/>`+[3,6,9].map(y=>`<ellipse cx="${x+7.6}" cy="${y}" rx="1.4" ry="2.6" fill="#f2d46a" transform="rotate(-25 ${x+7.6} ${y})"/><ellipse cx="${x+12.4}" cy="${y}" rx="1.4" ry="2.6" fill="#f2d46a" transform="rotate(25 ${x+12.4} ${y})"/>`).join('')).join(''); break;
    case 'egypt': g=`<rect width="40" height="14" fill="#e8c978"/><rect y="0" width="40" height="2" fill="${a}"/><rect y="12" width="40" height="2" fill="${a}"/><g fill="none" stroke="#7a4a1a" stroke-width="1.2"><ellipse cx="6" cy="7" rx="3" ry="2"/><circle cx="6" cy="7" r=".8" fill="#7a4a1a"/><path d="M14 6 q2 -3 4 0 t4 0 M14 9 q2 -3 4 0 t4 0"/><circle cx="31" cy="5.5" r="2.2"/><path d="M31 7.7 v5 M28.4 9.6 h5.2"/></g>`; break;
    case 'babylon': g=`<rect width="40" height="14" fill="#1f5fa6"/><rect y="0" width="40" height="1.8" fill="${a}"/><rect y="12.2" width="40" height="1.8" fill="${a}"/><circle cx="20" cy="7" r="4.4" fill="${a}"/><circle cx="20" cy="7" r="1.8" fill="#1f5fa6"/>${[0,1,2,3,4,5].map(i=>`<ellipse cx="${20+Math.cos(i*1.047)*4.4}" cy="${7+Math.sin(i*1.047)*4.4}" rx="1.3" ry="1.3" fill="#f4d878"/>`).join('')}<path d="M3 4 h7 M3 10 h7 M30 4 h7 M30 10 h7" stroke="#6fa0d8" stroke-width="1.4"/>`; break;
    case 'china': g=`<rect width="40" height="14" fill="#a82a22"/><rect y="0" width="40" height="1.6" fill="${a}"/><rect y="12.4" width="40" height="1.6" fill="${a}"/><path d="M4 11 V3 H16 V9 H9 V6 H13 M24 11 V3 H36 V9 H29 V6 H33" fill="none" stroke="${a}" stroke-width="1.6"/>`; break;
    case 'greece': g=`<rect width="40" height="14" fill="#f4f0e4"/><rect y="0" width="40" height="1.6" fill="${b}"/><rect y="12.4" width="40" height="1.6" fill="${b}"/><path d="M2 11 V3 H16 V10 H6 V6.6 H12" fill="none" stroke="${b}" stroke-width="1.6"/><path d="M22 11 V3 H36 V10 H26 V6.6 H32" fill="none" stroke="${b}" stroke-width="1.6"/>`; break;
    case 'india': g=`<rect width="40" height="14" fill="#f1d8a2"/><rect y="0" width="40" height="1.6" fill="#b8402a"/><rect y="12.4" width="40" height="1.6" fill="#b8402a"/>${[0,20].map(x=>`<path d="M${x+2} 12 Q${x+10} -2 ${x+18} 12Z" fill="#e8823a" stroke="#b8402a" stroke-width="1"/><path d="M${x+6} 12 Q${x+10} 3 ${x+14} 12Z" fill="#e8b04a"/>`).join('')}`; break;
    case 'islam': g=`<rect width="40" height="14" fill="#f4ead0"/><rect y="0" width="40" height="1.6" fill="${b}"/><rect y="12.4" width="40" height="1.6" fill="${b}"/>${[10,30].map(x=>star8(x,7,6,'#1fae9a','#0c5a58',.8)+circ(x,7,1.8,'#e0b440')).join('')}`; break;
    case 'europe': g=`<rect width="40" height="14" fill="#f1e2bc"/><rect y="0" width="40" height="1.6" fill="${th.frame[0]}"/><rect y="12.4" width="40" height="1.6" fill="${th.frame[0]}"/>${[10,30].map((x,i)=>`<polygon points="${x},2.4 ${x+5},7 ${x},11.6 ${x-5},7" fill="${i?'#2f4a8a':'#8a2a34'}"/><circle cx="${x}" cy="7" r="1.3" fill="${a}"/>`).join('')}<path d="M20 4 q3 3 0 6" stroke="#5a7a3a" stroke-width="1" fill="none"/>`; break;
    case 'modern': g=`<rect width="40" height="14" fill="#102248"/><path d="M0 7 H10 L14 3 H26 L30 11 H40" fill="none" stroke="#5ee0ff" stroke-width="1.4"/><circle cx="10" cy="7" r="1.8" fill="#9a7aff"/><circle cx="26" cy="3" r="1.8" fill="#5ee0ff"/><circle cx="30" cy="11" r="1.8" fill="#9a7aff"/>`; break;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="14" viewBox="0 0 40 14">${g}</svg>`;
}

/* ============================================================
   FOREGROUND silhouettes (corner dressing; viewBox 0 0 300 220)
   ============================================================ */
function fore(id, side, rnd){
  const L = side==='l'; let s='';
  const X = x => L ? x : 300-x;
  switch(id){
    case 'prologue':
      s += L ? (()=>{ let o=''; for(let x=14;x<150;x+=24) o+=rect(x,150,6,46,'#8a6038')+rect(x+1,150,2,46,'rgba(255,255,255,.2)'); o+=rect(8,162,150,5,'#9a7044')+rect(8,178,150,5,'#9a7044'); o+=wheatPatch(20,206,130,rnd,2); o+=`<g><circle cx="190" cy="150" r="14" fill="#7a5a2a"/><circle cx="190" cy="150" r="9" fill="#f2c42a"/><path d="M190 164 V206" stroke="#4f7a32" stroke-width="3"/></g>`; return o; })()
           : `<path d="M150 214 Q150 176 200 172 Q250 176 250 214Z" fill="#e0c068"/>`+`<path d="M162 196 Q200 204 240 196" stroke="rgba(120,80,20,.4)" stroke-width="2" fill="none"/>`+`<path d="M170 176 Q200 150 232 176Z" fill="#c9a24a"/>`+`<g><ellipse cx="90" cy="200" rx="36" ry="12" fill="#a8763a"/><path d="M54 200 Q56 168 90 166 Q124 168 126 200Z" fill="#c0904a"/><ellipse cx="90" cy="166" rx="34" ry="8" fill="#d8aa62"/>${circ(76,160,9,'#d42a2a')}${circ(94,158,9,'#f58a12')}${circ(108,162,8,'#7a2aa8')}${circ(86,166,3,'#4f7a32')}</g>`;
      break;
    case 'egypt':
      s += L ? palm(70,208,2.2,rnd)+(()=>{let o='';for(let i=0;i<12;i++){const x=120+i*7+rnd()*4,h=40+rnd()*40;o+=`<path d="M${f(x)} 210 Q${f(x+4)} ${f(210-h*.6)} ${f(x+(rnd()-.5)*10)} ${f(210-h)}" stroke="#4f8a46" stroke-width="2.2" fill="none"/>`+circ(x+(rnd()-.5)*8,210-h-3,3.4,'#8ec078');}return o;})()
           : jar(80,208,2.6)+jar(150,210,2,'#a85a30')+rock(220,210,2.4,'#c9a468')+`<path d="M200 210 L206 120 L214 120 L220 210Z" fill="#e8cb8c"/><path d="M206 120 L210 98 L214 120Z" fill="#f4d27a"/>`;
      break;
    case 'babylon':
      s += L ? palm(80,210,2.4,rnd,'#7a5a38','#4f7a3a','#6f9a4a')+jar(170,210,2.2,'#a8703c','#2f6aa8')
           : `<g>${[0,1,2].map(r=>[0,1,2,3].slice(r).map((c,i)=>`<rect x="${60+i*38+r*19}" y="${190-r*20}" width="36" height="18" fill="#b8905a" stroke="#6a4a24" stroke-width="1.4"/>`).join('')).join('')}</g>`+palm(210,210,2,rnd)+jar(40,210,1.9);
      break;
    case 'china':
      s += L ? [0,1,2,3,4,5,6].map(i=>bamboo(30+i*22,214,110+rnd()*70,rnd,1.7)).join('')
           : pine(210,214,3,rnd)+`<g><rect x="70" y="170" width="40" height="44" fill="#9a9488"/><rect x="62" y="162" width="56" height="10" fill="#847e72"/><rect x="76" y="132" width="28" height="30" fill="#a39b8c"/><path d="M68 132 Q90 112 112 132Z" fill="#847e72"/><rect x="82" y="140" width="16" height="14" fill="#e8a43a" opacity=".85"/></g>`+rock(150,214,2.2,'#8a8478');
      break;
    case 'greece':
      s += L ? oliveTree(100,214,3.2,rnd)+`<path d="M180 214 V120" stroke="#f2efe6" stroke-width="30"/><rect x="164" y="112" width="32" height="8" fill="#ece8dc"/><circle cx="168" cy="108" r="7" fill="#f2efe6" stroke="#cfc9b6"/><circle cx="192" cy="108" r="7" fill="#f2efe6" stroke="#cfc9b6"/>`
           : `<path d="M110 214 L120 140 L150 140 L158 214Z" fill="#f2efe6"/><path d="M146 140 L154 214" stroke="rgba(120,110,90,.3)" stroke-width="5"/><rect x="104" y="130" width="62" height="12" fill="#e9e5d8"/>`+cypress(220,214,2.4,rnd)+rock(60,214,2,'#d8d4c6');
      break;
    case 'india':
      s += L ? palm(70,212,2.3,rnd,'#7a5a38','#4c7e3a','#68a048')+`<g><path d="M150 214 Q140 150 200 130 Q196 170 220 214Z" fill="#3f8a46"/><path d="M170 214 Q180 160 232 150 Q216 186 238 214Z" fill="#58a858"/></g>`
           : `<g><rect x="90" y="86" width="40" height="128" fill="#d49a60"/><rect x="82" y="78" width="56" height="12" fill="#e0aa72"/><rect x="82" y="206" width="56" height="8" fill="#b57a46"/>${[0,1,2,3,4,5].map(i=>`<path d="M96 ${100+i*18} h28 M110 ${100+i*18} v10" stroke="rgba(70,30,0,.35)" stroke-width="2" fill="none"/>`).join('')}</g>`+`<g><ellipse cx="200" cy="206" rx="40" ry="10" fill="#c98a52"/><ellipse cx="200" cy="202" rx="34" ry="7" fill="#3f8f90"/>${circ(190,200,6,'#f4a8b8')}${circ(210,203,5,'#ec8aa0')}</g>`;
      break;
    case 'islam':
      s += L ? cypress(70,214,3,rnd,'#2a5a3a')+`<g><rect x="110" y="170" width="150" height="44" fill="#e9dcb8"/><rect x="110" y="170" width="150" height="6" fill="#1fae9a"/><ellipse cx="185" cy="172" rx="66" ry="10" fill="#2fb8c4"/></g>`
           : `<g><path d="M70 214 V120 Q70 70 120 62 Q170 70 170 120 V214" fill="none" stroke="#e9dcb8" stroke-width="16"/><path d="M62 214 V120 Q62 64 120 54 Q178 64 178 120 V214" fill="none" stroke="#1fae9a" stroke-width="4"/><g class="sa-lantern" style="transform-origin:120px 80px"><line x1="120" y1="80" x2="120" y2="100" stroke="#6a4a2a" stroke-width="2"/><path d="M110 100 h20 l-3 22 h-14Z" fill="#e0b440"/><circle cx="120" cy="112" r="16" fill="rgba(255,200,90,.25)"/></g></g>`+palm(230,214,2.1,rnd);
      break;
    case 'europe':
      s += L ? (()=>{ let o=''; for(let x=12;x<150;x+=26) o+=rect(x,150,6,50,'#8a6038')+poly([[x-1,150],[x+3,142],[x+7,150]],'#8a6038'); o+=rect(6,164,150,5,'#9a7044')+rect(6,180,150,5,'#9a7044'); o+=`<ellipse cx="200" cy="198" rx="36" ry="18" fill="#d8b856"/><path d="M168 198 Q200 160 232 198Z" fill="#e8c866"/>`+line(184,190,216,190,'rgba(140,100,20,.4)',1.4); return o; })()
           : roundTree(90,214,3.3,rnd,['#4f7a42','#6a9a52','#86b46a'])+`<g><rect x="190" y="168" width="40" height="46" rx="8" fill="#8a5a30"/><rect x="190" y="178" width="40" height="3" fill="#4a3220"/><rect x="190" y="198" width="40" height="3" fill="#4a3220"/></g>`+`<rect x="140" y="188" width="38" height="26" fill="#a8783e"/><rect x="140" y="188" width="38" height="3" fill="#c9965a"/>`;
      break;
    case 'modern':
      s += L ? `<g><path d="M30 214 L70 70 L150 70 L190 214Z" fill="rgba(126,214,255,.22)" stroke="#7fe0ff" stroke-width="2"/><path d="M110 70 V214 M50 142 H170" stroke="rgba(255,255,255,.5)" stroke-width="1.4"/></g>`
           : `<g><polygon points="150,170 180,152 210,170 210,206 180,224 150,206" fill="#2a3a56" stroke="#5ee0ff" stroke-width="1.6"/>${circ(180,150,14,'#3ea58a')}${circ(172,156,9,'#56c4a0')}</g>`+`<g class="sa-spin" style="transform-origin:90px 150px"><circle cx="90" cy="150" r="34" fill="none" stroke="#9a7aff" stroke-width="2" stroke-dasharray="10 8"/></g>`+`<text x="90" y="156" text-anchor="middle" font-family="Nunito" font-weight="800" font-size="20" fill="#7ff0ff">π</text>`;
      break;
  }
  s += (L? grassTuft(10,214,1.6,'#4a6a3a') : grassTuft(290,214,1.6,'#4a6a3a'));
  return `<svg class="sa-fore sa-fore-${side}" viewBox="0 0 300 220" preserveAspectRatio="${L?'xMinYMax':'xMaxYMax'} meet" aria-hidden="true">${s}</svg>`;
}

/* ============================================================
   PROPS (80×80) — also used for collectible journal cards
   ============================================================ */
const PROPS = {
  basket:()=>`<ellipse cx="40" cy="64" rx="26" ry="6" fill="rgba(0,0,0,.2)"/><path d="M14 40 Q16 66 40 66 Q64 66 66 40Z" fill="#c0904a"/>${[48,54,60].map(y=>`<path d="M16 ${y} Q40 ${y+6} 64 ${y}" stroke="#8a5a28" stroke-width="2" fill="none"/>`).join('')}<ellipse cx="40" cy="40" rx="26" ry="6" fill="#d8aa62"/>${circ(28,34,8,'#d42a2a')}${circ(42,32,8,'#f58a12')}${circ(54,35,7,'#7a2aa8')}${circ(36,38,3,'#4f7a32')}<path d="M12 40 Q40 -4 68 40" stroke="#8a5a28" stroke-width="3" fill="none"/>`,
  papyrus:()=>`<rect x="12" y="20" width="56" height="40" rx="3" fill="#ecd9a0" stroke="#a8823a" stroke-width="2"/><ellipse cx="12" cy="40" rx="5" ry="20" fill="#d8bd78" stroke="#a8823a" stroke-width="2"/><ellipse cx="68" cy="40" rx="5" ry="20" fill="#d8bd78" stroke="#a8823a" stroke-width="2"/><g stroke="#6a3a14" stroke-width="1.6" fill="none"><ellipse cx="24" cy="30" rx="4" ry="2.4"/><path d="M34 28 q3 -4 6 0 t6 0 M52 26 v8 M49 29 h6"/><path d="M22 42 h8 M34 42 q3 -4 6 0 t6 0 M50 42 h10"/><path d="M22 52 q3 -4 6 0 t6 0 M40 50 v6 M54 52 h6"/></g>`,
  tablet:()=>`<path d="M16 18 Q40 8 64 18 L66 62 Q40 72 14 62Z" fill="#c9965a" stroke="#7a5028" stroke-width="2"/><g stroke="#5a3818" stroke-width="2" stroke-linecap="round">${[26,36,46,56].map((y,i)=>[0,1,2,3,4].map(k=>`<path d="M${22+k*9} ${y} l4 -4 M${22+k*9} ${y} l4 3 M${24+k*9} ${y} v-5"/>`).join('')).join('')}</g>`,
  rods:()=>`<g stroke-linecap="round">${[0,1,2,3,4,5].map(i=>`<rect x="${14+i*10}" y="14" width="4" height="52" rx="2" fill="${i%2?'#e8c978':'#d8b85a'}" stroke="#8a6a2a"/>`).join('')}</g><path d="M10 26 h60 M10 54 h60" stroke="#b8352a" stroke-width="3"/><path d="M8 38 Q40 30 72 38" stroke="#a82a22" stroke-width="4" fill="none"/>`,
  diagram:()=>`<rect x="10" y="12" width="60" height="56" rx="3" fill="#f2efe6" stroke="#a9a38c" stroke-width="2"/><polygon points="22,56 22,28 52,56" fill="none" stroke="#2f86c4" stroke-width="2.2"/><rect x="22" y="48" width="8" height="8" fill="none" stroke="#2f86c4" stroke-width="1.4"/><circle cx="46" cy="30" r="12" fill="none" stroke="#c9a050" stroke-width="2"/><path d="M34 30 h24 M46 18 v24" stroke="#c9a050" stroke-width="1.2" stroke-dasharray="3 2"/>`,
  palmleaf:()=>`<g>${[0,1,2].map(i=>`<path d="M8 ${22+i*16} Q40 ${14+i*16} 72 ${22+i*16} L72 ${34+i*16} Q40 ${26+i*16} 8 ${34+i*16}Z" fill="${['#d8c070','#cdb460','#dcc878'][i]}" stroke="#8a7030" stroke-width="1.6"/><path d="M16 ${27+i*16} h44 M16 ${31+i*16} h36" stroke="#6a3a14" stroke-width="1.4" stroke-dasharray="3 2"/>`).join('')}<circle cx="18" cy="40" r="2" fill="#6a4a2a"/><path d="M18 14 V66" stroke="#b8402a" stroke-width="2"/></g>`,
  astrolabe:()=>`<circle cx="40" cy="42" r="28" fill="#d8b04a" stroke="#8a6a1a" stroke-width="3"/><circle cx="40" cy="42" r="22" fill="#e8c960" stroke="#8a6a1a" stroke-width="1.6"/>${[...Array(12)].map((_,i)=>`<line x1="${40+Math.cos(i*.5236)*22}" y1="${42+Math.sin(i*.5236)*22}" x2="${40+Math.cos(i*.5236)*26}" y2="${42+Math.sin(i*.5236)*26}" stroke="#6a4a0a" stroke-width="1.6"/>`).join('')}<path d="M18 42 H62 M40 20 V64" stroke="#8a6a1a" stroke-width="1.2"/><path d="M26 30 Q40 22 54 34 Q44 52 28 54 Q22 42 26 30Z" fill="none" stroke="#2f6aa8" stroke-width="1.6"/><path d="M28 56 L52 28" stroke="#1f7a6a" stroke-width="2.4"/><path d="M34 8 a6 6 0 1 1 12 0" fill="none" stroke="#8a6a1a" stroke-width="3"/><circle cx="40" cy="42" r="3" fill="#6a4a0a"/>`,
  scale:()=>`<path d="M40 14 V62 M28 62 H52" stroke="#6a4a2c" stroke-width="4" stroke-linecap="round"/><path d="M16 24 H64" stroke="#8a6a3a" stroke-width="3.4" stroke-linecap="round"/>${circ(40,14,4,'#c9a24a')}<path d="M16 24 L10 42 M16 24 L24 42 M64 24 L56 42 M64 24 L72 42" stroke="#6a4a2c" stroke-width="1.4"/><path d="M8 42 Q17 52 26 42Z" fill="#c9a24a" stroke="#7a5a1a"/><path d="M54 42 Q63 52 72 42Z" fill="#c9a24a" stroke="#7a5a1a"/>${circ(17,39,4,'#d8402c')}${circ(60,39,3,'#2f4a8a')}`,
  panel:()=>`<rect x="8" y="14" width="64" height="44" rx="4" fill="#0c1530" stroke="#5ee0ff" stroke-width="2.4"/><text x="40" y="43" text-anchor="middle" font-family="Nunito,sans-serif" font-weight="800" font-size="17" fill="#7ff0ff">½+¼=¾</text><path d="M30 66 H50 M40 58 V66" stroke="#8aa0c0" stroke-width="3"/><path d="M12 20 H24" stroke="#9a7aff" stroke-width="2"/>`,
  jar:()=>jar(40,70,2.2),
  book:()=>`<path d="M10 20 Q28 12 40 20 Q52 12 70 20 V62 Q52 54 40 62 Q28 54 10 62Z" fill="#f4ead0" stroke="#8a6a3a" stroke-width="2"/><path d="M40 20 V62" stroke="#8a6a3a" stroke-width="2"/><path d="M16 30 h18 M16 38 h18 M16 46 h14 M46 30 h18 M46 38 h18 M46 46 h12" stroke="#6a3a14" stroke-width="1.6"/>`
};
function propSVG(kind, cls=''){ const fn=PROPS[kind]||PROPS.jar; return `<svg class="sa-prop ${cls}" viewBox="0 0 80 80" aria-hidden="true">${fn()}</svg>`; }

/* ============================================================
   FRUITS — four detailed symbols (apple, grapes, orange, strawberry)
   defined once; every tile/legend row just <use>s them.
   Index order matches the game's M3_FRUITS: 0 apple, 1 grapes, 2 orange, 3 strawberry.
   ============================================================ */
const FRUIT_NAMES = ['Apple','Grapes','Orange','Strawberry'];
function fruitDefs(){
  const r = rng(77);
  const pores = (cx,cy,R,n)=>{ let o=''; for(let i=0;i<n;i++){ const a=r()*6.283, d=Math.sqrt(r())*R*.92; o+=circ(cx+Math.cos(a)*d,cy+Math.sin(a)*d,.7+r()*.5,'#b8560a','opacity=".38"'); } return o; };
  const grape=(x,y,c,i)=>`<circle cx="${x}" cy="${y}" r="6.6" fill="url(#sa-gp${c})"/><ellipse cx="${x-2.2}" cy="${y-2.6}" rx="1.9" ry="1.2" fill="#fff" opacity=".7" transform="rotate(-30 ${x-2.2} ${y-2.6})"/><circle cx="${x+1}" cy="${y+3.8}" r=".9" fill="rgba(30,0,50,.35)"/>`;
  const seeds = [[22,27],[32,25],[42,27],[17,33],[27,32],[37,32],[47,33],[21,40],[32,39],[43,40],[26,46],[38,46],[32,52],[15,28],[49,28],[18,38],[46,38]];
  return `
  <defs>
    <radialGradient id="sa-ap" cx=".36" cy=".3" r=".85"><stop offset="0" stop-color="#ff8f78"/><stop offset=".35" stop-color="#e03a32"/><stop offset=".8" stop-color="#b3141f"/><stop offset="1" stop-color="#7a0c18"/></radialGradient>
    <linearGradient id="sa-ap2" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#f4d24a" stop-opacity=".75"/><stop offset=".5" stop-color="#f4d24a" stop-opacity="0"/></linearGradient>
    <linearGradient id="sa-lf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8fd05a"/><stop offset="1" stop-color="#3f8a2e"/></linearGradient>
    <radialGradient id="sa-gp0" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#c98ae6"/><stop offset=".5" stop-color="#7a36b0"/><stop offset="1" stop-color="#3d1168"/></radialGradient>
    <radialGradient id="sa-gp1" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#b6a0f0"/><stop offset=".5" stop-color="#5f46b8"/><stop offset="1" stop-color="#2c1a74"/></radialGradient>
    <radialGradient id="sa-gp2" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#e2b6f0"/><stop offset=".5" stop-color="#9a50c0"/><stop offset="1" stop-color="#52207a"/></radialGradient>
    <radialGradient id="sa-or" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#ffd26a"/><stop offset=".45" stop-color="#f89a1c"/><stop offset="1" stop-color="#c85a02"/></radialGradient>
    <radialGradient id="sa-st" cx=".38" cy=".3" r=".85"><stop offset="0" stop-color="#ff7468"/><stop offset=".45" stop-color="#e0213a"/><stop offset="1" stop-color="#8a0c22"/></radialGradient>
    <radialGradient id="sa-sh" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".32"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  </defs>
  <symbol id="sa-fr-0" viewBox="0 0 64 64">
    <ellipse cx="32" cy="59" rx="18" ry="3.6" fill="url(#sa-sh)"/>
    <path d="M32 19 C26 12 11 14 9 31 C7 47 19 59 27.5 59 C30 59 31 57.4 32 57.4 C33 57.4 34 59 36.5 59 C45 59 57 47 55 31 C53 14 38 12 32 19Z" fill="url(#sa-ap)" stroke="#6e0a14" stroke-width="1.2"/>
    <path d="M32 19 C26 12 11 14 9 31 C7 47 19 59 27.5 59 C30 59 31 57.4 32 57.4 C33 57.4 34 59 36.5 59 C45 59 57 47 55 31 C53 14 38 12 32 19Z" fill="url(#sa-ap2)"/>
    <path d="M32 20 C32 28 32 34 32 40" stroke="rgba(110,10,20,.35)" stroke-width="1.4" fill="none"/>
    <path d="M17 28 C16 22 21 18 25 18" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".6"/>
    <g fill="#ffd9a0" opacity=".5">${[[20,36],[27,45],[42,40],[46,30],[36,50],[22,46],[40,24],[31,31]].map(p=>circ(p[0],p[1],.9,'#ffd9a0')).join('')}</g>
    <path d="M32 19 C32 14 33 10 36 6" stroke="#6a4020" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path d="M35 12 C39 4 49 5 53 10 C48 17 39 17 35 12Z" fill="url(#sa-lf)" stroke="#2f6a22" stroke-width="1"/>
    <path d="M36 12.4 C41 10.6 46 10.4 51 10.2" stroke="#2f6a22" stroke-width="1" fill="none"/>
  </symbol>
  <symbol id="sa-fr-1" viewBox="0 0 64 64">
    <ellipse cx="32" cy="60" rx="17" ry="3.2" fill="url(#sa-sh)"/>
    <path d="M32 18 V30 M24 20 L28 32 M40 20 L36 32" stroke="#5a8a2a" stroke-width="1.4"/>
    ${grape(20,21,1)+grape(44,21,1)}
    ${grape(26,28,2)+grape(38,28,2)+grape(14,29,0)+grape(50,29,0)}
    ${grape(32,34,0)+grape(21,38,1)+grape(43,38,1)}
    ${grape(27,44,2)+grape(37,44,2)+grape(32,53,0)}
    ${grape(32,22,0)}
    <path d="M32 18 C32 12 34 9 38 6" stroke="#6a4a20" stroke-width="3" stroke-linecap="round" fill="none"/>
    <path d="M35 11 C37 4 46 2 52 6 C50 10 54 13 50 17 C46 15 40 17 35 11Z" fill="url(#sa-lf)" stroke="#2f6a22" stroke-width="1"/>
    <path d="M36 11 C41 9 45 9 50 9" stroke="#2f6a22" stroke-width="1" fill="none"/>
  </symbol>
  <symbol id="sa-fr-2" viewBox="0 0 64 64">
    <ellipse cx="32" cy="59.5" rx="19" ry="3.6" fill="url(#sa-sh)"/>
    <circle cx="32" cy="36" r="23.5" fill="url(#sa-or)" stroke="#a84a00" stroke-width="1.2"/>
    <g>${pores(32,36,22,46)}</g>
    <g fill="#c4640a" opacity=".3">${[[20,28],[44,44],[26,48],[46,26],[34,52]].map(p=>`<ellipse cx="${p[0]}" cy="${p[1]}" rx="2.2" ry="1.4"/>`).join('')}</g>
    <path d="M15 30 C14 22 20 15 28 13.5" stroke="#fff" stroke-width="3.2" stroke-linecap="round" fill="none" opacity=".6"/>
    <path d="M44 55 C52 50 56 42 56 36" stroke="rgba(150,60,0,.3)" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="32" cy="13.2" r="3.2" fill="#a84a00" opacity=".55"/>
    <path d="M32 13 l-3 -3 M32 13 l3 -3 M32 13 l-4 1 M32 13 l4 1" stroke="#3f7a2a" stroke-width="2" stroke-linecap="round"/>
    <path d="M33 11 C38 3 48 4 52 8 C47 14 39 14 33 11Z" fill="url(#sa-lf)" stroke="#2f6a22" stroke-width="1"/>
    <path d="M34 10.6 C39 8.6 44 8.2 50 8" stroke="#2f6a22" stroke-width="1" fill="none"/>
  </symbol>
  <symbol id="sa-fr-3" viewBox="0 0 64 64">
    <ellipse cx="32" cy="60" rx="17" ry="3.2" fill="url(#sa-sh)"/>
    <path d="M32 59 C21 54 8 40 9.5 27 C11 16 24 13 32 20 C40 13 53 16 54.5 27 C56 40 43 54 32 59Z" fill="url(#sa-st)" stroke="#730a1e" stroke-width="1.2"/>
    <path d="M32 58 C27 49 23 42 21 34" stroke="rgba(120,0,20,.18)" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path d="M17 28 C17 22 21 19 25 19" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".55"/>
    ${seeds.map(([x,y])=>`<ellipse cx="${x}" cy="${y}" rx="1.1" ry="1.7" fill="#fff3a8" stroke="rgba(110,0,20,.45)" stroke-width=".6"/>`).join('')}
    <path d="M32 20 C26 14 17 17 18 21 C21 20 24 22 25 24 C27 20 30 22 32 22 C34 22 37 20 39 24 C40 22 43 20 46 21 C47 17 38 14 32 20Z" fill="url(#sa-lf)" stroke="#2f6a22" stroke-width="1"/>
    <path d="M27 17 L32 22 L37 17 M22 18 L30 22 M42 18 L34 22" stroke="#2f6a22" stroke-width=".9" fill="none"/>
    <path d="M32 19 C32 13 33 10 35 6" stroke="#4a8a2a" stroke-width="3" stroke-linecap="round" fill="none"/>
  </symbol>`;
}
let defsReady=false;
function ensureDefs(){
  if(defsReady || typeof document==='undefined') return; defsReady=true;
  const d=document.createElement('div');
  d.setAttribute('aria-hidden','true'); d.style.cssText='position:absolute;width:0;height:0;overflow:hidden';
  const gr = rng(77); let dots='';
  for(let i=0;i<26;i++) dots += `<circle cx="${f(gr()*28)}" cy="${f(gr()*28)}" r="${f(.5+gr()*.9)}" fill="${i%3?'#2a1c0c':'#fff6e0'}" opacity="${i%3?.3:.28}"/>`;
  for(let i=0;i<3;i++) dots += `<path d="M${f(gr()*20)} ${f(gr()*28)} l${f(3+gr()*5)} ${f(gr()*3-1.5)}" stroke="#2a1c0c" stroke-width=".6" opacity=".25" fill="none"/>`;
  d.innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0"><defs><pattern id="sa-grain" width="28" height="28" patternUnits="userSpaceOnUse">${dots}</pattern></defs>${fruitDefs()}</svg>`;
  document.body.appendChild(d);
}
function fruitSVG(i, cls='sa-fruit'){ return `<svg class="${cls}" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><use href="#sa-fr-${i}"/></svg>`; }

/* ============================================================
   BACKDROP BUILDER (sky, sun, clouds, horizon, textured ground, foreground, particles)
   ============================================================ */
const reduceMotion = ()=> { try{ return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } };

function miniPlant(id, rnd){
  let s='';
  switch(id){
    case 'prologue': s=roundTree(40,96,1.3,rnd); break;
    case 'egypt': case 'babylon': s=palm(40,96,1.0,rnd); break;
    case 'china': s=bamboo(30,96,84,rnd,1.2)+bamboo(46,96,70,rnd,1.1)+bamboo(58,96,90,rnd,1.2); break;
    case 'greece': s=oliveTree(40,96,1.5,rnd); break;
    case 'india': s=palm(40,96,1.0,rnd,'#7a5a38','#4c7e3a','#68a048'); break;
    case 'islam': s=cypress(40,96,1.2,rnd,'#2a5a3a'); break;
    case 'europe': s=pine(40,96,1.5,rnd); break;
    case 'modern': s=`<rect x="36" y="30" width="5" height="66" fill="#8aa0c0"/><rect x="28" y="26" width="22" height="7" rx="3" fill="#5ee0ff"/><circle cx="39" cy="31" r="14" fill="rgba(94,224,255,.2)"/>`; break;
    default: s=roundTree(40,96,1.3,rnd);
  }
  return `<svg class="sa-plant" viewBox="0 0 80 100" aria-hidden="true">${s}</svg>`;
}
const SIDE_PROPS = {
  prologue:['basket','jar'], egypt:['papyrus','jar'], babylon:['tablet','jar'], china:['rods','book'],
  greece:['diagram','jar'], india:['palmleaf','jar'], islam:['astrolabe','book'], europe:['scale','book'], modern:['panel','diagram']
};
function sideDecor(id, count){
  const rnd = rng(hashStr(id)+99), pr = SIDE_PROPS[id]||['jar'];
  let o='';
  for(let i=0;i<count;i++){
    const left = i%2===0, edge = 1+rnd()*5, y = 8 + (i/count)*84 + rnd()*5;
    const isProp = i%3===1;
    o += `<div class="sa-side ${isProp?'sa-side-prop':'sa-side-plant'}" style="${left?'left':'right'}:${f(edge)}%;top:${f(y)}%;--r:${f((rnd()-.5)*8)}deg;animation-delay:-${f(rnd()*4)}s">${isProp?propSVG(pr[Math.floor(rnd()*pr.length)]):miniPlant(id,rnd)}</div>`;
  }
  return o;
}
function particlesHTML(kind, rnd, n){
  const glyphs=['½','¼','π','∑','⅓','¾','√','⅖'];
  let o='';
  for(let i=0;i<n;i++){
    const dur=9+rnd()*11;
    o+=`<i class="sa-pt sa-pt-${kind}" style="left:${f(rnd()*100)}%;top:${f(10+rnd()*80)}%;--d:${f(dur)}s;--dl:-${f(rnd()*dur)}s;--dx:${f((rnd()-.5)*120)}px;--dy:${f(-30-rnd()*70)}px;--s:${f(3+rnd()*4)}px">${kind==='data'?glyphs[i%glyphs.length]:''}</i>`;
  }
  return o;
}
function backdrop(id, mode, opts){
  opts = opts || {};
  const T = THEME[id] || THEME.prologue, key = THEME[id] ? id : 'prologue';
  const uid = ++UID, rnd = rng(hashStr(key)+3);
  TEX = key!=='modern'; let scene; try{ scene = (H[key])(uid, rng(hashStr(key)+5)); } finally { TEX = false; }
  const gtile = svgURI(tileSVG(T.tile, T.ground)), gmacro = svgURI(macroSVG(T.tile, T.ground, !!T.night));
  const skyBg = `linear-gradient(180deg,${T.sky[0]} 0,${T.sky[1]} 52%,${T.sky[2]} 100%)`;
  const cloudCol = T.night ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.82)';
  const cr1 = rng(hashStr(key)+21), cr2 = rng(hashStr(key)+22);
  const stars = T.night ? Array.from({length:34},()=>`<i class="sa-star" style="left:${f(rnd()*100)}%;top:${f(rnd()*210)}px;--s:${f(1+rnd()*1.6)}px;animation-delay:-${f(rnd()*4)}s"></i>`).join('') : '';
  const pin = (mode==='map') ? `<g class="sa-pin-g" data-lm="${key}" role="button" tabindex="0" aria-label="About this place: ${T.lm.label}"><circle class="sa-pin-pulse" cx="${T.lm.x}" cy="${T.lm.y}" r="14" fill="rgba(255,255,255,.35)"/><circle cx="${T.lm.x}" cy="${T.lm.y}" r="12" fill="#fff8e0" stroke="#2a1c0c" stroke-width="2.4"/><text x="${T.lm.x}" y="${T.lm.y+5}" text-anchor="middle" font-family="Baloo 2,Nunito,sans-serif" font-weight="800" font-size="15" fill="#2a1c0c">i</text></g>` : '';
  const nPart = mode==='map' ? 9 : 12;
  return `<div class="sa-scene sa-${mode}" data-chapter="${key}" style="--ground:${T.ground};--sunc:${T.sun[2]}">
    <div class="sa-sky" style="background:${skyBg}"></div>
    ${stars}
    <div class="sa-sun" style="left:${T.sun[0]}%;top:${T.sun[1]*4}px"></div>
    <div class="sa-clouds sa-c1"><svg viewBox="0 0 2400 150" preserveAspectRatio="none" aria-hidden="true">${cloudPuffs(cr1,6,cloudCol,40,110)}</svg></div>
    <div class="sa-clouds sa-c2"><svg viewBox="0 0 2400 150" preserveAspectRatio="none" aria-hidden="true">${cloudPuffs(cr2,5,cloudCol,50,120)}</svg></div>
    <div class="sa-hzwrap">
      <div class="sa-horizon"><svg viewBox="0 0 1200 380" preserveAspectRatio="xMidYMax slice" aria-hidden="false">${scene}${pin}</svg></div>
      <div class="sa-ground" style="background-color:${T.ground};background-image:${gmacro},${gtile};background-size:611px 611px,160px 160px"></div>
      ${opts.charHTML?`<div class="sa-char">${opts.charHTML}</div>`:''}
    </div>
    ${mode==='map'?`<div class="sa-sides">${sideDecor(key,6)}</div>`:''}
    <div class="sa-forewrap">${fore(key,'l',rnd)}${fore(key,'r',rnd)}</div>
    <div class="sa-particles">${particlesHTML(T.particle, rnd, nPart)}</div>
    <div class="sa-light"></div>
  </div>`;
}
/* chapter palette → CSS custom properties on any container */
function applyTheme(el, id){
  const T = THEME[id] || THEME.prologue;
  el.dataset.chapter = THEME[id] ? id : 'prologue';
  const st = el.style;
  st.setProperty('--ch-accent', T.accent); st.setProperty('--ch-accent2', T.accent2);
  st.setProperty('--ch-panel', T.panel); st.setProperty('--ch-panel2', T.panel2);
  st.setProperty('--ch-ink', T.ink);
  st.setProperty('--ch-frame0', T.frame[0]); st.setProperty('--ch-frame1', T.frame[1]);
  st.setProperty('--ch-board0', T.board[0]); st.setProperty('--ch-board1', T.board[1]);
  st.setProperty('--ch-frieze', svgURI(friezeSVG(T.frieze, T)));
  st.setProperty('--ch-road0', T.road[0]); st.setProperty('--ch-road1', T.road[1]);
}

/* ============================================================
   SMALL UI HELPERS
   ============================================================ */
function starsHTML(n, total, cls){
  total = total||3; let o='';
  for(let i=0;i<total;i++) o += `<i class="sa-st ${i<n?'on':''} ${cls||''}" style="--i:${i}" aria-hidden="true"></i>`;
  return `<span class="sa-stars" role="img" aria-label="${n} of ${total} stars">${o}</span>`;
}
function burst(el, good){
  if(!el || reduceMotion()) return;
  const b=document.createElement('span'); b.className='sa-burst'+(good?' good':'');
  for(let i=0;i<7;i++){ const p=document.createElement('i'), a=(i/7)*6.283+Math.random()*.6, d=16+Math.random()*12;
    p.style.setProperty('--bx',(Math.cos(a)*d).toFixed(1)+'px'); p.style.setProperty('--by',(Math.sin(a)*d).toFixed(1)+'px'); b.appendChild(p); }
  el.appendChild(b);
}
/* visual-only slide of two neighbouring tiles; game logic is untouched */
function swapOut(a,b){
  if(!a||!b||!a.animate||reduceMotion()) return Promise.resolve(null);
  const ra=a.getBoundingClientRect(), rb=b.getBoundingClientRect(), dx=rb.left-ra.left, dy=rb.top-ra.top;
  const o={duration:140,easing:'ease-in-out',fill:'forwards'};
  a.style.zIndex=4; b.style.zIndex=3;
  const A=a.animate([{transform:'translate(0,0)'},{transform:`translate(${dx}px,${dy}px) scale(1.06)`}],o);
  const B=b.animate([{transform:'translate(0,0)'},{transform:`translate(${-dx}px,${-dy}px)`}],o);
  return Promise.all([A.finished,B.finished]).then(()=>({A,B,a,b})).catch(()=>null);
}
function swapBack(h){
  if(!h) return Promise.resolve();
  return new Promise(res=>{
    let n=0; const done=()=>{ if(++n===2){ try{h.A.cancel();h.B.cancel();}catch(e){} h.a.style.zIndex='';h.b.style.zIndex=''; res(); } };
    h.A.onfinish=done; h.B.onfinish=done; h.A.reverse(); h.B.reverse();
    setTimeout(()=>{ if(n<2){ n=1; done(); } },400);
  });
}
function progressUpdate(score, idx, total){
  const t=document.getElementById('story-score-text'); if(t) t.textContent = `${score} / ${total}`;
  const icons=document.querySelectorAll('#story-star-icons .sa-sti');
  [5,7,9].forEach((th,i)=>{ if(icons[i]) icons[i].classList.toggle('on', score>=th); });
  const dots=document.getElementById('story-task-dots');
  if(dots){
    if(dots.children.length!==total){ dots.innerHTML=Array.from({length:total},()=>'<i></i>').join(''); }
    [...dots.children].forEach((d,i)=>{ d.className = i<idx ? 'done' : (i===idx?'now':''); });
  }
}
const _ios={};
function observe(root,key){
  key=key||'x';
  const list=(root||document).querySelectorAll('.sa-scene');
  if(_ios[key]){ _ios[key].disconnect(); delete _ios[key]; }
  if(!('IntersectionObserver' in window)){ list.forEach(e=>e.classList.add('sa-live')); return; }
  const io=_ios[key]=new IntersectionObserver(es=>es.forEach(e=>e.target.classList.toggle('sa-live', e.isIntersecting)),{rootMargin:'160px'});
  list.forEach(e=>io.observe(e));
}

/* ---------- landmark pins (optional history popups on the map) ---------- */
let _pinBound=false;
function bindPins(){
  if(_pinBound) return; _pinBound=true;
  const close=()=>{ document.querySelectorAll('.sa-lmcard').forEach(c=>c.remove()); };
  const open=(g)=>{
    close();
    const id=g.dataset.lm, T=THEME[id]; if(!T) return;
    const band=g.closest('.chapter-band')||g.closest('.sa-scene'); const br=band.getBoundingClientRect(), gr=g.getBoundingClientRect();
    const c=document.createElement('div'); c.className='sa-lmcard'; c.setAttribute('role','dialog'); c.setAttribute('aria-label',T.lm.label);
    c.innerHTML=`<button class="sa-lmx" aria-label="Close">×</button><h4>${T.lm.label}</h4><small>${T.civ} · ${T.period}</small><p>${T.lm.text}</p>`;
    band.appendChild(c);
    const w=Math.min(300, br.width-24);
    let left=gr.left-br.left+gr.width/2-w/2; left=Math.max(12,Math.min(br.width-w-12,left));
    c.style.width=w+'px'; c.style.left=left+'px'; c.style.top=Math.max(8,gr.top-br.top+gr.height+8)+'px';
    c.querySelector('.sa-lmx').addEventListener('click',e=>{e.stopPropagation();close();});
    c.addEventListener('click',e=>e.stopPropagation());
  };
  document.addEventListener('click',e=>{ const g=e.target.closest && e.target.closest('.sa-pin-g'); if(g){ e.stopPropagation(); open(g); } else close(); });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') close(); if((e.key==='Enter'||e.key===' ') && e.target.classList && e.target.classList.contains('sa-pin-g')){ e.preventDefault(); open(e.target); } });
}

/* ---------- chapter introduction (brief, skippable) ---------- */
function chapterIntro(chapter, number, host, onDone){
  const T = THEME[chapter.id] || THEME.prologue;
  const el=document.createElement('div'); el.className='sa-intro'; el.setAttribute('role','dialog'); el.setAttribute('aria-label',`Chapter ${number}: ${chapter.title}`);
  applyTheme(el, chapter.id);
  el.innerHTML = backdrop(chapter.id,'game') + `<div class="sa-intro-card">
      <div class="sa-intro-kicker">${number===0?'Prologue':'Chapter '+number}</div>
      <h2>${chapter.icon} ${chapter.title}</h2>
      <div class="sa-intro-civ">${T.civ} · ${T.period}</div>
      <p>${T.link}</p>
      <div class="sa-intro-actions"><button class="btn btn-primary" data-go>Continue ▶</button><button class="btn btn-outline" data-skip>Skip</button></div>
    </div>`;
  host.appendChild(el); observe(el,'intro');
  let done=false;
  const end=()=>{ if(done) return; done=true; document.removeEventListener('keydown',key); el.classList.add('leaving'); setTimeout(()=>{ el.remove(); onDone&&onDone(); }, reduceMotion()?0:260); };
  const key=e=>{ if(e.key==='Escape'||e.key==='Enter'){ e.preventDefault(); end(); } };
  document.addEventListener('keydown',key);
  el.querySelector('[data-go]').addEventListener('click',end);
  el.querySelector('[data-skip]').addEventListener('click',end);
  el.querySelector('[data-go]').focus({preventScroll:true});
}

/* ---------- historical journal (collectible illustration cards) ---------- */
function journalCardHTML(id, unlocked, number){
  const T=THEME[id];
  if(!unlocked) return `<article class="sa-jcard locked"><div class="sa-jart">${propSVG(T.card.prop,'sa-silh')}<span class="sa-jlock">🔒</span></div><h4>${T.n}</h4><p>Finish every level in this chapter to unlock its historical illustration.</p></article>`;
  return `<article class="sa-jcard" data-chapter="${id}" style="--a:${T.accent};--b:${T.accent2};--f0:${T.frame[0]};--f1:${T.frame[1]}"><div class="sa-jart" style="background:linear-gradient(180deg,${T.sky[0]},${T.sky[2]})">${propSVG(T.card.prop)}</div><h4>${T.card.title}</h4><small>${T.civ} · ${T.period}</small><p>${T.card.text}</p></article>`;
}
function openJournal(chapters, isDone){
  const el=document.createElement('div'); el.className='sa-journal'; el.setAttribute('role','dialog'); el.setAttribute('aria-label','Historical Journal');
  const n=chapters.filter(c=>isDone(c)).length;
  el.innerHTML=`<div class="sa-journal-box"><header><h3>📜 Historical Journal</h3><span>${n} / ${chapters.length} illustrations collected</span><button class="sa-jx" aria-label="Close">×</button></header><div class="sa-jgrid">${chapters.map((c,i)=>journalCardHTML(c.id,isDone(c),i)).join('')}</div></div>`;
  document.body.appendChild(el);
  const close=()=>{ el.remove(); document.removeEventListener('keydown',k); };
  const k=e=>{ if(e.key==='Escape') close(); };
  document.addEventListener('keydown',k);
  el.addEventListener('click',e=>{ if(e.target===el || e.target.closest('.sa-jx')) close(); });
  el.querySelector('.sa-jx').focus();
}
function chapterCompleteHTML(chapter, number, stats){
  const T=THEME[chapter.id]||THEME.prologue;
  return `<div class="sa-complete"><div class="sa-complete-art" style="background:linear-gradient(180deg,${T.sky[0]},${T.sky[2]})">${propSVG(T.card.prop)}<span class="sa-ribbon">New journal card!</span></div>
    <div class="sa-complete-title">${chapter.icon} ${number===0?'Prologue':'Chapter '+number} complete — ${T.card.title}</div>
    <div class="sa-complete-meta">${stats.levels} levels cleared · ${stats.stars} / ${stats.maxStars} ⭐</div>
    <p>${T.card.text}</p></div>`;
}


/* ============================================================
   LEVEL PATHS — every civilisation gets its own road surface, route shape,
   roadside details and marker plinths. Pure presentation: node positions
   (x %, y px) are passed in by the game and the road passes exactly through them.
   ============================================================ */
const gprop = k => `<g transform="translate(0 14)">${(PROPS[k]||PROPS.jar)()}</g>`;
const ell = (x,y,rx,ry,fill,ex='') => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}" ${ex}/>`;

/* ---- roadside glyphs: drawn in an 80×100 box, feet at (40,96) ---- */
const G = {
  tree:r=>roundTree(40,96,1.25,r),
  palm:r=>palm(40,96,.95,r),
  olive:r=>oliveTree(40,96,1.6,r),
  cypress:r=>cypress(40,96,1.2,r,'#2a5a3a'),
  pine:r=>pine(40,96,1.6,r,'#3a5e3e'),
  bamboo:r=>bamboo(24,96,86,r,1.2)+bamboo(41,96,70,r,1.1)+bamboo(57,96,92,r,1.2),
  bush:r=>circ(26,88,13,'#4f7a3a')+circ(52,87,15,'#4f7a3a')+circ(39,79,15,'#6a9a46')+circ(31,76,5,'#86b35a','opacity=".7"')+circ(48,73,4,'#86b35a','opacity=".7"'),
  shrubdry:r=>circ(27,88,12,'#7a8a4a')+circ(52,88,13,'#7a8a4a')+circ(39,80,13,'#97a65c')+circ(33,76,4,'#b8c070','opacity=".7"'),
  flower:r=>{ let s=''; [[24,.9],[42,1.15],[58,.8]].forEach(([x,k])=>{ const h=26*k+r()*8, c=['#ff8aa0','#ffd23a','#ffffff','#c8a0ff'][Math.floor(r()*4)];
    s+=`<path d="M${x} 96 Q${x+3} ${f(96-h/2)} ${x} ${f(96-h)}" stroke="#4f7a3a" stroke-width="2" fill="none"/>`+[0,72,144,216,288].map(a=>circ(x+Math.cos(a*Math.PI/180)*4.6,96-h+Math.sin(a*Math.PI/180)*4.6,3.6,c)).join('')+circ(x,96-h,2.6,'#e8a020'); }); return s; },
  wheat:r=>wheatPatch(16,96,48,r,2.1),
  grass:r=>grassTuft(40,96,3.2,'#5f8a3f')+grassTuft(22,97,2.2,'#7aa050'),
  grassdry:r=>grassTuft(40,96,3,'#b09a50')+grassTuft(24,97,2,'#c8b468'),
  pebbles:r=>ell(26,93,7,4,'#9a9488')+ell(42,95,9,4.5,'#aaa498')+ell(57,92,5.5,3.2,'#8a8478')+ell(36,91,3.6,2.2,'#bab4a6'),
  petals:r=>[0,1,2,3,4,5].map(i=>ell(14+i*10+r()*4,90+r()*8,3.6,1.8,['#ffd0dc','#ffe9a0','#fff'][i%3],`transform="rotate(${f(r()*90)} ${14+i*10} 94)" opacity=".9"`)).join(''),
  mud:r=>ell(40,93,30,6,'rgba(60,44,28,.45)')+ell(28,92,10,3,'rgba(120,96,64,.5)')+ell(52,94,9,2.6,'rgba(120,96,64,.5)'),
  rock:r=>rock(40,96,1.7,'#8a8478'),
  rockdry:r=>rock(40,96,1.6,'#b8a070'),
  dune:r=>`<path d="M4 92 Q22 80 40 90 T76 88" stroke="#c9a766" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M14 97 Q30 88 46 96 T74 95" stroke="#dcc080" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
  haybale:r=>rect(12,68,56,28,'#d8b24a','rx="12"')+rect(12,68,56,10,'rgba(255,255,255,.22)','rx="8"')+line(28,70,28,96,'#a87a2a',2)+line(52,70,52,96,'#a87a2a',2)+[0,1,2,3,4].map(i=>line(18+i*11,74+i%2*6,26+i*11,80+i%2*6,'rgba(120,80,20,.5)',1.2)).join(''),
  fencepost:r=>rect(8,62,6,34,'#7a5a38')+rect(36,60,6,36,'#7a5a38')+rect(66,62,6,34,'#7a5a38')+rect(4,68,72,5,'#9a7448')+rect(4,80,72,5,'#9a7448')+rect(8,62,2,34,'rgba(255,255,255,.2)'),
  wheatbig:r=>wheatPatch(12,96,56,r,2.5),
  obelisk:r=>poly([[29,96],[34,26],[46,26],[51,96]],'#d9b873')+poly([[34,26],[40,8],[46,26]],'#e8c860')+poly([[40,26],[46,26],[51,96],[40,96]],'rgba(120,80,20,.22)')+rect(28,92,24,5,'#b8923f')+[34,44,54,64,74].map(y=>line(36,y,44,y,'#2fa6b0',1.6)).join(''),
  brazier:r=>poly([[24,60],[56,60],[50,74],[30,74]],'#8a5a1a')+rect(37,74,6,18,'#6a4412')+rect(26,90,28,6,'#6a4412','rx="2"')+rect(22,57,36,5,'#d4a62a','rx="2"')+`<g class="sa-bob" style="transform-origin:40px 56px"><path d="M40 28 Q50 44 44 56 L36 56 Q30 44 40 28Z" fill="#ff8a2a"/><path d="M40 38 Q46 48 42 56 L38 56 Q34 48 40 38Z" fill="#ffd860"/></g>`,
  reeds:r=>[22,32,42,52,60].map((x,i)=>{ const h=48+((i*37)%24); return `<path d="M${x} 96 Q${x+(i%2?4:-4)} ${96-h/2} ${x+(i%2?2:-2)} ${96-h}" stroke="#5f8a3f" stroke-width="2.2" fill="none"/>`+`<g stroke="#6a9a46" stroke-width="1.4" stroke-linecap="round">${[-50,-25,0,25,50].map(a=>`<line x1="${x+(i%2?2:-2)}" y1="${96-h}" x2="${f(x+(i%2?2:-2)+Math.sin(a*Math.PI/180)*9)}" y2="${f(96-h-Math.cos(a*Math.PI/180)*9)}"/>`).join('')}</g>`; }).join(''),
  jar:r=>jar(40,96,2.3,'#b0673a','#e8c07a'),
  jarblue:r=>jar(40,96,2.3,'#2f6aa8','#e0b440'),
  amphora:r=>jar(40,96,2.4,'#c96a3a','#2a1c0c'),
  scroll:r=>gprop('papyrus'), tablet:r=>gprop('tablet'), rods:r=>gprop('rods'), book:r=>gprop('book'),
  diagram:r=>gprop('diagram'), palmleaf:r=>gprop('palmleaf'), basket:r=>gprop('basket'), scale:r=>gprop('scale'),
  panel:r=>gprop('panel'), astrolabe:r=>gprop('astrolabe'),
  brickpile:r=>[0,1,2].map(i=>rect(14,84-i*13,52,12,i%2?'#b08a58':'#c49a64','rx="1.5"')).join('')+[0,1,2].map(i=>line(40+(i%2?-8:8),84-i*13,40+(i%2?-8:8),96-i*13,'rgba(60,36,10,.4)',1.2)).join('')+rect(14,45,52,4,'rgba(0,0,0,.0)'),
  stele:r=>`<path d="M26 96 L26 40 Q26 22 40 22 Q54 22 54 40 L54 96Z" fill="#c9a766"/>`+rect(22,92,36,5,'#a8864a')+[40,50,60,70].map(y=>line(32,y,48,y,'#6a4a1a',1.8)).join('')+[45,55,65].map(y=>line(36,y+3,44,y-1,'#6a4a1a',1.4)).join(''),
  stonelantern:r=>rect(26,90,28,6,'#7d7666','rx="2"')+rect(35,64,10,26,'#9a9484')+rect(24,48,32,16,'#a8a292','rx="2"')+rect(33,52,14,9,'#ffd27a')+poly([[18,48],[40,30],[62,48]],'#7d7666')+circ(40,28,3,'#a8a292'),
  redlantern:r=>rect(37,22,4,74,'#6a4a2a')+rect(37,22,24,3.4,'#6a4a2a')+`<g class="sa-lantern" style="transform-origin:58px 25px"><line x1="58" y1="25" x2="58" y2="34" stroke="#8a6a2a" stroke-width="1.4"/>${ell(58,46,9,12,'#d8402c')}${rect(52,32,12,3,'#d4a62a')}${rect(52,56,12,3,'#d4a62a')}${line(58,59,58,70,'#d4a62a',1.6)}${ell(55,42,2.4,5,'rgba(255,255,255,.35)')}</g>`,
  lotus:r=>ell(30,90,16,5,'#4f8a4a')+ell(54,92,13,4,'#5f9a56')+[-30,0,30].map(a=>`<path d="M42 88 Q${f(42+Math.sin(a*Math.PI/180)*12)} ${f(88-14)} 42 ${f(88-22+Math.abs(a)/5)} Q${f(42-Math.sin(a*Math.PI/180)*2)} 80 42 88Z" fill="${a?'#ff9ab8':'#ffc2d4'}" transform="rotate(${a} 42 88)"/>`).join(''),
  column:r=>rect(24,88,32,8,'#e8e2d2')+rect(30,36,20,52,'#f4efe3')+[34,40,46].map(x=>rect(x,38,1.8,48,'rgba(0,0,0,.1)')).join('')+rect(26,28,28,8,'#e8e2d2')+rect(22,24,36,5,'#f4efe3')+rect(48,38,5,48,'rgba(0,0,0,.08)'),
  brokencolumn:r=>rect(24,88,32,8,'#e8e2d2')+poly([[30,88],[30,56],[34,50],[40,58],[46,48],[50,54],[50,88]],'#f4efe3')+[35,41,45].map(x=>rect(x,60,1.6,28,'rgba(0,0,0,.1)')).join('')+ell(64,94,8,4,'#e8e2d2')+rect(56,88,16,6,'#f4efe3','rx="2"'),
  herm:r=>rect(26,92,28,5,'#d8d1bf')+rect(30,52,20,40,'#f4efe3')+rect(48,54,2.4,38,'rgba(0,0,0,.08)')+circ(40,40,10,'#f4efe3')+circ(40,36,7,'rgba(0,0,0,.04)')+rect(36,48,8,5,'#e8e2d2'),
  mosaic:r=>[0,1,2,3].map(i=>[0,1,2].map(j=>rect(16+i*12,84+j*5,11,4.4,(i+j)%2?'#3d7fb8':'#f4efe3','opacity=".95"')).join('')).join(''),
  pillar:r=>rect(22,90,36,6,'#a8683a')+rect(28,38,24,52,'#c98a52')+[46,58,70].map(y=>rect(26,y,28,4,'#a8683a')).join('')+rect(20,26,40,12,'#b97a44','rx="3"')+rect(16,22,48,6,'#c98a52','rx="2"')+rect(48,40,4,50,'rgba(0,0,0,.12)'),
  lamp:r=>rect(30,90,20,6,'#a8683a')+rect(36,70,8,20,'#c98a52')+poly([[26,70],[54,70],[48,60],[32,60]],'#d8a040')+`<g class="sa-bob" style="transform-origin:40px 58px"><path d="M40 42 Q46 52 42 58 L38 58 Q34 52 40 42Z" fill="#ffb030"/></g>`,
  rangoli:r=>[22,13,5].map((r_,i)=>`<circle cx="40" cy="91" r="${r_}" fill="none" stroke="${['#a12f36','#ffd27a','#e8823a'][i]}" stroke-width="2" stroke-dasharray="${i?'2 3':'4 2'}" transform="translate(0 0) scale(1 .42)" style="transform-origin:40px 91px"/>`).join('')+ell(40,92,3,1.4,'#ffd27a'),
  fountain:r=>ell(40,92,30,8,'#d8d0b4')+ell(40,89,26,6.5,'#5ec8d8')+rect(37,60,6,30,'#e8dfc4')+ell(40,60,10,3,'#e8dfc4')+`<g stroke="#bff0f8" stroke-width="2" fill="none" stroke-linecap="round" class="sa-bob" style="transform-origin:40px 58px"><path d="M40 58 Q32 42 24 62"/><path d="M40 58 Q48 42 56 62"/><path d="M40 58 L40 44"/></g>`,
  lamppost:r=>rect(38,34,4,62,'#c9a040')+rect(32,92,16,5,'#a07a20')+rect(30,18,20,18,'#d8b24a','rx="3"')+rect(33,21,14,12,'#fff0b0')+poly([[28,18],[40,6],[52,18]],'#c9a040')+circ(40,27,16,'rgba(255,230,140,.25)'),
  tilefrag:r=>ell(40,92,16,4.5,'rgba(0,0,0,.12)')+poly([[40,84],[44,89],[50,89],[46,93],[48,98],[40,95],[32,98],[34,93],[30,89],[36,89]],'#1fae8e','opacity=".95"')+circ(40,92,2.6,'#d8b24a'),
  banner:r=>rect(36,24,4,72,'#5a4028')+flag(40,26,30,20,'#a12f36',Math.random)+rect(30,92,16,5,'#6a5038'),
  torch:r=>rect(37,52,5,44,'#6a4a2a')+poly([[32,52],[47,52],[44,60],[35,60]],'#4a3a2a')+`<g class="sa-bob" style="transform-origin:40px 50px"><path d="M40 24 Q50 40 44 52 L36 52 Q30 40 40 24Z" fill="#ff8a2a"/><path d="M40 34 Q46 44 42 52 L38 52 Q34 44 40 34Z" fill="#ffd860"/></g>`,
  barrel:r=>`<path d="M20 94 Q14 78 20 62 L60 62 Q66 78 60 94Z" fill="#9a6a38"/>`+[68,78,88].map(y=>rect(16,y,48,3.4,'#4a3a2a','opacity=".8"')).join('')+ell(40,62,20,4,'#b8844a')+rect(24,66,4,26,'rgba(255,255,255,.14)'),
  crate:r=>rect(16,62,48,34,'#a67c48')+rect(16,62,48,5,'#8a6234')+rect(16,91,48,5,'#8a6234')+rect(16,62,5,34,'#8a6234')+rect(59,62,5,34,'#8a6234')+line(18,66,62,93,'#7a5628',2.4)+line(62,66,18,93,'#7a5628',2.4),
  signpost:r=>rect(37,34,5,62,'#6a4a2a')+poly([[18,38],[56,38],[64,45],[56,52],[18,52]],'#a67c48')+poly([[62,56],[24,56],[16,63],[24,70],[62,70]],'#b98c58')+line(24,45,48,45,'#4a3a2a',1.6)+line(28,63,52,63,'#4a3a2a',1.6),
  lightpost:r=>rect(38,30,4,66,'#7a8aa8')+rect(32,92,16,5,'#4a5a78')+rect(26,22,28,10,'#0c1a30')+rect(28,24,24,4,'#5ee0ff')+circ(40,28,18,'rgba(94,224,255,.2)'),
  antenna:r=>rect(38,40,4,56,'#8aa0c0')+`<path d="M40 40 L22 24 A26 26 0 0 0 58 24Z" fill="#c9d8ee" stroke="#5a6a88" stroke-width="1.6"/>`+line(40,40,40,22,'#5a6a88',2)+circ(40,22,3,'#5ee0ff')+rect(30,92,20,5,'#4a5a78'),
  solar:r=>poly([[10,66],[70,66],[62,86],[2,86]],'#2a5aa8')+[0,1,2,3].map(i=>line(10-i*2.6+i*0,66+i*5,70-i*2.6,66+i*5,'#7ab0ff',.8)).join('')+[1,2,3].map(i=>line(10+i*15-i*1.6,66,2+i*15,86,'#7ab0ff',.8)).join('')+rect(36,86,6,10,'#6a7a98'),
  cube:r=>`<g class="sa-bob">${poly([[40,50],[58,59],[40,68],[22,59]],'#8af0ff')+poly([[22,59],[40,68],[40,88],[22,79]],'#3a9ac8')+poly([[40,68],[58,59],[58,79],[40,88]],'#2a6aa8')}</g>`+ell(40,95,16,3.4,'rgba(94,224,255,.35)'),
  hex:r=>poly([[22,84],[31,70],[49,70],[58,84],[49,98],[31,98]],'rgba(94,224,255,.18)','stroke="#5ee0ff" stroke-width="2.4" transform="translate(0 -6) scale(1 .6)" style="transform-origin:40px 96px"')+circ(40,86,3,'#8af0ff'),
  circuit:r=>`<g stroke="#5ee0ff" stroke-width="1.6" fill="none" opacity=".85"><path d="M8 94 H30 L38 86 H56"/><path d="M26 98 H48 L56 92 H74"/><path d="M40 90 V80"/></g>`+circ(56,86,2.6,'#8af0ff')+circ(74,92,2.6,'#8af0ff')+circ(40,80,2.2,'#8af0ff'),
  glaze:r=>[0,1,2].map(i=>rect(12+i*22,88+(i%2)*3,18,7,['#2f6aa8','#e0b440','#1c4a86'][i],'rx="1.5" opacity=".95"')).join(''),
  ripple:r=>[0,1,2].map(i=>`<path d="M${6+i*3} ${82+i*7} Q${22+i*3} ${76+i*7} ${38+i*2} ${82+i*7} T${74-i*3} ${81+i*7}" stroke="${i%2?'#e6cf94':'#c4a15c'}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".8"/>`).join(''),
  cracks:r=>`<path d="M8 90 L22 86 L30 92 L44 88 M30 92 L34 98 M44 88 L52 84 L66 90 M52 84 L56 78" stroke="rgba(60,40,20,.38)" stroke-width="1.6" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`,
  poppies:r=>[[18,.8],[34,1],[50,.85],[64,.7]].map(([x,k])=>{ const h=16*k+r()*6; return `<path d="M${x} 97 L${x} ${f(96-h)}" stroke="#4f7a3a" stroke-width="1.6"/>`+circ(x,96-h,3.8,'#e0452f')+circ(x,96-h,1.2,'#2a1a14'); }).join(''),
  pavers:r=>poly([[6,90],[26,87],[32,94],[10,98]],'#d6cfbb','stroke="rgba(0,0,0,.18)" stroke-width=".8"')+poly([[32,94],[26,87],[48,85],[54,92]],'#c4bca6','stroke="rgba(0,0,0,.18)" stroke-width=".8"')+poly([[54,92],[48,85],[70,88],[72,96]],'#d6cfbb','stroke="rgba(0,0,0,.18)" stroke-width=".8"')+poly([[10,98],[32,94],[54,92],[50,99],[14,100]],'#b9b19b','stroke="rgba(0,0,0,.18)" stroke-width=".8"'),
  furrow:r=>[0,1,2,3].map(i=>`<path d="M${4+i*2} ${86+i*3.6} L${76-i*2} ${86+i*3.6}" stroke="#6a4a28" stroke-width="2.4" stroke-linecap="round" opacity=".5"/>`).join('')+[14,30,46,62].map((x,i)=>circ(x,84+(i%2)*4,2,'#6f9446')).join(''),
  moss:r=>ell(22,94,16,5,'#5f8a3f','opacity=".55"')+ell(46,92,14,4.4,'#7aa050','opacity=".5"')+ell(60,95,10,3.6,'#4f7a3a','opacity=".5"'),
  datadots:r=>`<path d="M10 92 L24 86 L36 96 L52 88 L66 94" stroke="#5ee0ff" stroke-width="1" fill="none" opacity=".5"/>`+[[10,92],[24,86],[36,96],[52,88],[66,94],[44,80]].map(([x,y],i)=>circ(x,y,i%2?1.6:2.4,i%3?'#5ee0ff':'#b88aff','opacity=".9"')).join(''),
  rubble:r=>ell(40,96,30,4,'rgba(0,0,0,.18)')+rect(12,86,18,10,'#cfc6ae','rx="1.5"')+rect(30,90,14,7,'#bdb39a','rx="1"')+poly([[46,96],[50,84],[60,82],[66,96]],'#d6cdb6')+rect(14,86,18,2.6,'rgba(255,255,255,.3)'),
  sphinx:r=>ell(40,96,34,4,'rgba(0,0,0,.22)')+rect(8,78,52,17,'#dcb56a','rx="6"')+rect(8,88,52,7,'#b8923f','rx="3"')+rect(50,86,24,8,'#dcb56a','rx="3"')+poly([[46,58],[58,48],[70,58],[72,80],[46,80]],'#c9a24a')+rect(51,60,14,18,'#e6c47c','rx="5"')+[52,56,60].map(x=>line(x,50,x+(x-56)*.4,76,'#2fa6b0',1.2,'opacity=".7"')).join('')+circ(58,66,1.3,'#2a1c0c')+rect(55,72,6,1.6,'#a8864a')+rect(10,80,50,2.4,'rgba(255,255,255,.3)','rx="1"')
};
/* which glyphs sway (plants) */
const SWAYERS = new Set(['tree','palm','olive','cypress','pine','bamboo','flower','wheat','wheatbig','grass','grassdry','reeds','bush','shrubdry']);

/* ---- road surfaces (layer = one stroked copy of the route; widths in px) ---- */
const ROAD = {
  prologue:{ geo:{k:'curve',bend:.55,wob:2.2,freq:2},
    layers:[ {w:38,c:'rgba(0,0,0,.24)',sh:1}, {w:37,c:'#6f9446',d:'5 3 9 4 4 7'}, {w:32,c:'#8a6a3c'}, {w:28,c:'#d2ab70'}, {w:21,c:'#b98c55'}, {w:13,c:'#dcb97c'},
             {w:5,c:'#8f6d40',d:'0.1 15 0.1 23 0.1 9'}, {w:3,c:'#f0d89a',d:'0.1 27 0.1 13'} ],
    decor:{ big:['tree','haybale','fencepost','wheatbig'], small:['basket','bush','flower','wheat'], ground:['pebbles','grass','petals'] } },
  egypt:{ geo:{k:'curve',bend:.5,wob:1.6,freq:1},
    layers:[ {w:38,c:'rgba(0,0,0,.24)',sh:1}, {w:36,c:'#7a4f14'}, {w:32,c:'#2fa6b0'}, {w:28,c:'#ecd7a2'}, {w:28,c:'#c9a766',d:'1.6 22',cap:'butt'},
             {w:10,c:'#e0bd6a',d:'12 10',cap:'butt'}, {w:4,c:'#2fa6b0',d:'0.1 22',off:-11} ],
    decor:{ big:['palm','obelisk','brazier','palm'], small:['reeds','jar','scroll','shrubdry'], ground:['pebbles','dune','grassdry','rockdry'] } },
  babylon:{ geo:{k:'curve',bend:.5,wob:0,freq:1},
    layers:[ {w:38,c:'rgba(0,0,0,.26)',sh:1}, {w:36,c:'#0f2f5e'}, {w:31,c:'#e0b440'}, {w:28,c:'#2f6aa8'}, {w:28,c:'#1c4a86',d:'2 18',cap:'butt'},
             {w:9,c:'#e0b440',d:'9 11',cap:'butt'}, {w:4,c:'#fff2c0',d:'0.1 20',off:-10} ],
    decor:{ big:['palm','brickpile','stele','palm'], small:['tablet','jarblue','shrubdry','astrolabe'], ground:['pebbles','glaze','dune'] } },
  china:{ geo:{k:'curve',bend:.28,wob:0,freq:1},
    layers:[ {w:38,c:'rgba(0,0,0,.26)',sh:1}, {w:36,c:'#4a4438'}, {w:32,c:'#8c8576'}, {w:28,c:'#b4ad9c'}, {w:28,c:'#7d7666',d:'2 15',cap:'butt'},
             {w:14,c:'#a79f8e',d:'8 9',cap:'butt',off:8}, {w:6,c:'#c9503f',d:'0.1 32'}, {w:2.4,c:'#4aa88a',d:'10 22',cap:'butt',off:-4} ],
    decor:{ big:['bamboo','stonelantern','redlantern','pine'], small:['rock','bush','lotus','rods'], ground:['pebbles','grass','petals'] } },
  greece:{ geo:{k:'curve',bend:.68,wob:0,freq:1},
    layers:[ {w:38,c:'rgba(0,0,0,.24)',sh:1}, {w:36,c:'#8f8670'}, {w:32,c:'#f4efe3'}, {w:27,c:'#3d7fb8',d:'6 6',cap:'butt'}, {w:17,c:'#f4efe3'},
             {w:17,c:'#d8d1bf',d:'1.6 24',cap:'butt'}, {w:5,c:'#d4a62a',d:'0.1 18'} ],
    decor:{ big:['olive','column','cypress','herm'], small:['amphora','bush','flower','diagram'], ground:['pebbles','mosaic','grass','brokencolumn'] } },
  india:{ geo:{k:'curve',bend:.5,wob:2.4,freq:2},
    layers:[ {w:38,c:'rgba(0,0,0,.26)',sh:1}, {w:36,c:'#6e2216'}, {w:32,c:'#e0a05c'}, {w:26,c:'#a12f36',d:'8 4',cap:'butt'}, {w:16,c:'#e8b070'},
             {w:16,c:'#c9743a',d:'1.6 22',cap:'butt'}, {w:7,c:'#ffd27a',d:'0.1 14'}, {w:4,c:'#a12f36',d:'0.1 14',off:-7} ],
    decor:{ big:['palm','pillar','lamp','tree'], small:['lotus','jar','flower','palmleaf'], ground:['petals','pebbles','rangoli'] } },
  islam:{ geo:{k:'curve',bend:.6,wob:1.8,freq:2},
    layers:[ {w:38,c:'rgba(0,0,0,.24)',sh:1}, {w:36,c:'#0f4a4a'}, {w:32,c:'#d8b24a'}, {w:28,c:'#f3ead0'}, {w:24,c:'#1fae8e',d:'12 12',cap:'butt'},
             {w:24,c:'#2a5aa8',d:'12 12',cap:'butt',off:-12}, {w:6,c:'#d8b24a',d:'0.1 24',off:-6} ],
    decor:{ big:['cypress','palm','fountain','lamppost'], small:['bush','book','jar','flower'], ground:['pebbles','tilefrag','grass'] } },
  europe:{ geo:{k:'curve',bend:.5,wob:3,freq:2},
    layers:[ {w:38,c:'rgba(0,0,0,.26)',sh:1}, {w:37,c:'#4c6a36',d:'6 4 10 5'}, {w:32,c:'#5a4630'}, {w:28,c:'#8a8272'}, {w:28,c:'#a39b88',d:'8 3',cap:'butt'},
             {w:14,c:'#938b79',d:'8 3',cap:'butt',off:5.5}, {w:2,c:'#5a5244',d:'0.1 11'} ],
    decor:{ big:['pine','tree','banner','torch'], small:['barrel','crate','bush','signpost'], ground:['pebbles','grass','mud','flower'] } },
  modern:{ geo:{k:'angular'},
    layers:[ {w:38,c:'rgba(0,0,0,.3)',sh:1}, {w:36,c:'#0a1626'}, {w:32,c:'#1a3a66'}, {w:28,c:'#122848'}, {w:27,c:'#5ee0ff',op:.55}, {w:25,c:'#122848'},
             {w:18,c:'#2a5a9a',d:'2 30',cap:'butt'}, {w:9,c:'#5ee0ff',op:.3,d:'14 10',cap:'butt'}, {w:3,c:'#8af0ff',d:'14 10',cap:'butt'} ],
    decor:{ big:['lightpost','antenna','solar','lightpost'], small:['cube','hex','panel','bush'], ground:['pebbles','circuit','grass'] } }
};
const STEP_FALLBACK = 118;

/* ---- per-chapter lane shapes: where each level marker sits (x in %), following that landscape ---- */
const LANE = {
  prologue:[26,54,30,62],                 // a lazy lane between the field furrows
  egypt:[20,38,58,78,60,40,22],           // one long S along the Nile bank
  babylon:[30,60,34,66,38,68],            // a stepped climb, like a ziggurat ramp
  china:[66,40,62,36,60,34],              // a narrow mountain track
  greece:[18,46,78,52,24],                // terraced landings on a hillside
  india:[22,46,72,78,54,30],              // a long sweep around the courtyard
  islam:[34,62,38,66,40,64],              // gentle garden arcades
  europe:[28,58,38,70,44],                // a country lane
  modern:[24,24,76,76,50]                 // circuit-trace turns
};
function laneX(id,i,W){
  const L = LANE[id] || [22,50,78,50]; let x = L[i % L.length];
  if(W){   // cap the sideways swing in pixels so wide screens don't produce flat hairpins at each marker
    const lo=Math.min(...L), hi=Math.max(...L), mid=(lo+hi)/2, k=Math.min(1, 480/(((hi-lo)*W/100)||1));
    x = mid + (x-mid)*k;
  }
  return Math.round(x*10)/10;
}

/* worn earth shoulder under each road + extra decoration categories */
/* drawn height of each avenue prop, as a fraction of its 100-unit sprite box */
const AVH = { sphinx:.5, column:.72, stele:.75, stonelantern:.68, lamp:.55, lamppost:.9, torch:.72, lightpost:.85, fencepost:.36 };
const VERGE = { prologue:'#7a5a30', egypt:'#b8924a', babylon:'#6a4a2a', china:'#6a7a58', greece:'#a9a07c', india:'#c8a070', islam:'#bba37a', europe:'#4c6a36', modern:'#5ee0ff' };
const DECOR_PLUS = {
  prologue:{ edge:['grass','pebbles','flower','poppies'], scatter:[['furrow','P'],['poppies','P'],['grass','M'],['wheat','M'],['bush','M']], avenue:'fencepost' },
  egypt:   { edge:['pebbles','ripple','grassdry','rockdry'], scatter:[['ripple','P'],['ripple','P'],['cracks','P'],['rubble','M'],['dune','P'],['shrubdry','M']], avenue:'sphinx' },
  babylon: { edge:['pebbles','ripple','glaze','rubble'], scatter:[['ripple','P'],['cracks','P'],['brickpile','M'],['rubble','M'],['shrubdry','M']], avenue:'stele' },
  china:   { edge:['moss','pebbles','grass','petals'], scatter:[['moss','P'],['pavers','P'],['bamboo','L'],['rock','M'],['bush','M']], avenue:'stonelantern' },
  greece:  { edge:['pavers','grass','flower','pebbles'], scatter:[['poppies','P'],['pavers','P'],['rubble','M'],['olive','L'],['brokencolumn','M'],['flower','M']], avenue:'column' },
  india:   { edge:['petals','pebbles','grass'], scatter:[['petals','P'],['rangoli','P'],['pavers','P'],['flower','M'],['bush','M']], avenue:'lamp' },
  islam:   { edge:['tilefrag','pebbles','grass'], scatter:[['tilefrag','P'],['petals','P'],['pavers','P'],['flower','M'],['bush','M']], avenue:'lamppost' },
  europe:  { edge:['grass','mud','pebbles','flower'], scatter:[['moss','P'],['mud','P'],['poppies','P'],['rubble','M'],['bush','M'],['flower','M']], avenue:'torch' },
  modern:  { edge:['circuit','datadots','pebbles'], scatter:[['circuit','P'],['datadots','P'],['hex','M'],['panel','M']], avenue:'lightpost' }
};
/* shoulder + wear layers wrapped around a chapter's road surface */

/* ---- level-marker materials: one consistent size, a material per scenery ---- */
const MARKER = {
  prologue:{ hi:'#e2c48e', lo:'#a47a46', rim:'#6a4a28', edge:'#4a3418', ink:'#3a2810', sh:'0 1px 0 rgba(255,235,190,.6)', grit:'soil'  },
  egypt:   { hi:'#f4dfa4', lo:'#c9a24e', rim:'#2fa6b0', edge:'#7a5a1e', ink:'#4a3210', sh:'0 1px 0 rgba(255,245,210,.7)', grit:'sand'  },
  babylon: { hi:'#4a88c8', lo:'#1c4a86', rim:'#e0b440', edge:'#0f2f5e', ink:'#fff6d0', sh:'0 1px 1px rgba(0,0,0,.65)',    grit:'glaze' },
  china:   { hi:'#cdc7b6', lo:'#8c8576', rim:'#c9503f', edge:'#4a4438', ink:'#2e2a22', sh:'0 1px 0 rgba(255,255,255,.5)', grit:'stone' },
  greece:  { hi:'#fcf9ef', lo:'#d4cdb8', rim:'#3d7fb8', edge:'#9a927c', ink:'#27364e', sh:'0 1px 0 rgba(255,255,255,.8)', grit:'marble'},
  india:   { hi:'#eaaa6c', lo:'#b8622c', rim:'#ffd27a', edge:'#7a2a2a', ink:'#3e160e', sh:'0 1px 0 rgba(255,220,170,.55)',grit:'sand'  },
  islam:   { hi:'#34c8a8', lo:'#0f7a6a', rim:'#e2bf58', edge:'#0a4a48', ink:'#fff6dc', sh:'0 1px 1px rgba(0,0,0,.6)',     grit:'tile'  },
  europe:  { hi:'#b8b2a2', lo:'#7a756a', rim:'#8a3a3a', edge:'#4a463c', ink:'#27231d', sh:'0 1px 0 rgba(255,255,255,.45)',grit:'stone' },
  modern:  { hi:'#3e6296', lo:'#14223c', rim:'#5ee0ff', edge:'#0a1226', ink:'#e4faff', sh:'0 0 6px rgba(94,224,255,.7)',  grit:'tech'  }
};
const GRIT = { soil:[.55,3,'0 0 0 0 .2  0 0 0 0 .12  0 0 0 0 .05  1.5 0 0 0 -.55'], sand:[.8,2,'0 0 0 0 .45  0 0 0 0 .3  0 0 0 0 .1  1.6 0 0 0 -.65'],
  glaze:[.05,3,'0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  2.4 0 0 0 -1.35'], stone:[.7,3,'0 0 0 0 .1  0 0 0 0 .1  0 0 0 0 .1  1.5 0 0 0 -.6'],
  marble:[.012,4,'0 0 0 0 .35  0 0 0 0 .45  0 0 0 0 .55  4 0 0 0 -2.15'], tile:[.45,2,'0 0 0 0 1  0 0 0 0 1  0 0 0 0 .8  1.6 0 0 0 -.95'], tech:[.9,1,'0 0 0 0 .4  0 0 0 0 .9  0 0 0 0 1  1.8 0 0 0 -1.1'] };
function gritURI(kind, seed){
  const g = GRIT[kind] || GRIT.stone;
  return svgURI(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><filter id="g" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="${g[0]}" numOctaves="${g[1]}" seed="${seed}" stitchTiles="stitch"/><feColorMatrix type="matrix" values="${g[2]}"/></filter><rect width="64" height="64" filter="url(#g)" opacity=".55"/></svg>`);
}
const _gritCache = {};
function applyMarker(el, id){
  const M = MARKER[id] || MARKER.prologue, st = el.style;
  st.setProperty('--mk-hi',M.hi); st.setProperty('--mk-lo',M.lo); st.setProperty('--mk-rim',M.rim);
  st.setProperty('--mk-edge',M.edge); st.setProperty('--mk-ink',M.ink); st.setProperty('--mk-sh',M.sh);
  st.setProperty('--mk-grit', _gritCache[id] || (_gritCache[id] = gritURI(M.grit, 3+hashStr(id)%40)));
}

const ROAD_K = .66;   // global road-width scale (keeps every chapter's road the same proportion)
function scaleLayer(L){
  const o = Object.assign({}, L);
  o.w = Math.round(L.w*ROAD_K*10)/10;
  if(L.d) o.d = L.d.split(/\s+/).map(t=>{ const v=parseFloat(t); return v<=0.1 ? t : String(Math.round(v*ROAD_K*10)/10); }).join(' ');
  if(L.off) o.off = Math.round(L.off*ROAD_K*10)/10;
  return o;
}
function roadLayers(key){
  const R = ROAD[key] || ROAD.prologue, v = VERGE[key] || '#8a7a5a', glow = key==='modern';
  const shoulder = [ {w:96,c:v,op:glow?.05:.12}, {w:78,c:v,op:glow?.08:.2}, {w:60,c:v,op:glow?.14:.32} ];
  const wear = glow ? [] : [ {w:3,c:'rgba(40,24,8,.28)',d:'0.1 13 0.1 31 0.1 9 0.1 37',off:5}, {w:2.4,c:'rgba(255,255,255,.35)',d:'0.1 21 0.1 11 0.1 29'} ];
  return shoulder.concat(R.layers, wear).map(scaleLayer);
}


function layerSVG(d, L){
  return `<path d="${d}" fill="none" stroke="${L.c}" stroke-width="${L.w}" stroke-linecap="${L.cap||'round'}" stroke-linejoin="round" vector-effect="non-scaling-stroke"` +
    `${L.d?` stroke-dasharray="${L.d}"`:''}${L.off?` stroke-dashoffset="${L.off}"`:''}${L.op?` opacity="${L.op}"`:''}${L.sh?' transform="translate(0 3.5)"':''}/>`;
}
function polyD(pts){ return pts.map((p,i)=>(i?'L':'M')+f(p[0])+' '+f(p[1])).join(' '); }

/* sample the route through the node centres: x in %, y in px */
function routePoints(geo, xs, ys, tailUp, tailDown){
  const pts=[], n=xs.length;
  for(let y=-tailUp; y<ys[0]; y+=40) pts.push([xs[0],y]);
  for(let s=1;s<n;s++){
    const x0=xs[s-1], y0=ys[s-1], x1=xs[s], y1=ys[s], d=y1-y0, sign=(s%2?1:-1);
    if(geo.k==='angular'){
      const a=[[x0,y0],[x0,y0+d*.3],[x1,y1-d*.3],[x1,y1]];
      for(let i=0;i<3;i++) for(let k=(i||s>1?1:0);k<=10;k++){ const t=k/10; pts.push([lerp(a[i][0],a[i+1][0],t), lerp(a[i][1],a[i+1][1],t)]); }
    } else {
      const bend=Math.max(geo.bend,.8), c0=y0+d*bend, c1=y1-d*bend, N=28;
      for(let k=(s>1?1:0);k<=N;k++){ const t=k/N, m=1-t;
        let x = m*m*m*x0 + 3*m*m*t*x0 + 3*m*t*t*x1 + t*t*t*x1;
        const y = m*m*m*y0 + 3*m*m*t*c0 + 3*m*t*t*c1 + t*t*t*y1;
        if(geo.wob) x += geo.wob*Math.sin(Math.PI*(geo.freq||1)*t)*sign;
        pts.push([x,y]);
      }
    }
  }
  const last=n-1; for(let y=ys[last]+40; y<=ys[last]+tailDown; y+=40) pts.push([xs[last],y]);
  pts.push([xs[last], ys[last]+tailDown]);
  return pts;
}

/* the road, its roadside decoration, and the marker positions */

/* ---- scenery boundary: the road lives only on the terrain and dissolves where the terrain ends ---- */
const EDGE = {                    // [amplitude px, shape] of each scenery's far (horizon) and near contour
  prologue:[9,'roll'], egypt:[12,'dune'], babylon:[5,'flat'], china:[8,'terrace'], greece:[8,'roll'],
  india:[6,'roll'], islam:[9,'scallop'], europe:[10,'roll'], modern:[8,'step']
};
function edgeProfile(key, x, ph){
  const A = (EDGE[key]||EDGE.prologue), a=A[0], u=x/100*Math.PI*2+ph;
  switch(A[1]){
    case 'dune':    return a*(Math.abs(Math.sin(u*1.1))-.5);
    case 'scallop': return -a*Math.abs(Math.sin(u*2.2))+a*.5;
    case 'terrace': return a*(Math.round(Math.sin(u)*2.2)/2.2);
    case 'step':    return a*(Math.round(Math.sin(u*1.3)*1.6)/1.6);
    case 'flat':    return a*Math.sin(u*.8)*.5;
    default:        return a*(Math.sin(u)*.6+Math.sin(u*2.3+1)*.4);
  }
}
let _rcUID = 0;
function boundaryClip(key, yTop, yBot, fadeT, fadeB, y0, H){
  const id='rc'+(++_rcUID), ph=hashStr(key)%7, X0=1.5, X1=98.5, pts=[];
  const top=x=>yTop+edgeProfile(key,x,ph), bot=x=>yBot+edgeProfile(key,x,ph+2)*.6;
  for(let x=X0;x<=X1+.01;x+=4.25) pts.push([x,top(x)]);
  for(let x=X1;x>=X0-.01;x-=4.25) pts.push([x,bot(x)]);
  const poly = pts.map(p=>f(p[0])+','+f(p[1])).join(' ');
  const defs = `<defs><clipPath id="${id}c" clipPathUnits="userSpaceOnUse"><polygon points="${poly}"/></clipPath>`+
    `<linearGradient id="${id}g" gradientUnits="userSpaceOnUse" x1="0" y1="${f(y0)}" x2="0" y2="${f(y0+H)}">`+
      `<stop offset="${f((yTop-y0-12)/H)}" stop-color="#000"/><stop offset="${f((yTop+fadeT-y0)/H)}" stop-color="#fff"/>`+
      `<stop offset="${f((yBot-fadeB-y0)/H)}" stop-color="#fff"/><stop offset="${f((yBot+8-y0)/H)}" stop-color="#000"/></linearGradient>`+
    `<mask id="${id}m" maskUnits="userSpaceOnUse" x="0" y="${f(y0)}" width="100" height="${f(H)}"><rect x="0" y="${f(y0)}" width="100" height="${f(H)}" fill="url(#${id}g)"/></mask></defs>`;
  return { defs, open:`<g clip-path="url(#${id}c)"><g mask="url(#${id}m)">`, close:'</g></g>', top, bot };
}
function buildRoad(id, xs, W, stepY){
  const key = ROAD[id] ? id : 'prologue', R = ROAD[key];
  const step = stepY || STEP_FALLBACK, n = xs.length;
  const ys = xs.map((_,i)=>i*step), tailUp = 700, tailDown = 140;
  /* the road arrives from behind the chapter sign (centre of the band) and sweeps out below it to level 1 */
  const vw = (typeof window!=='undefined' && window.innerWidth) || W;
  const E = Math.min(250, Math.max(36, .17*vw)) + 18;           // node 0 → bottom edge of the sign card
  const headY = -(E+40);
  const xsAll = [xs[0]].concat(xs), ysAll = [headY].concat(ys);
  const pts = routePoints(R.geo, xsAll, ysAll, tailUp, tailDown);
  const H = tailUp + ys[n-1] + tailDown, d = polyD(pts);
  /* the road runs from the first marker to the last one only,
     inside the scenery's own contour (never up into the sky, behind the sign or into the next chapter) */
  const yTop = -20, yBot = ys[n-1] + 20;
  const BC = boundaryClip(key, yTop, yBot, 12, 12, -tailUp, H);
  const svg = `<svg class="band-road" viewBox="0 ${-tailUp} 100 ${H}" preserveAspectRatio="none" style="top:${-tailUp}px;height:${H}px" aria-hidden="true">${BC.defs}${BC.open}${roadLayers(key).map(L=>layerSVG(d,L)).join('')}${BC.close}</svg>`;

  /* ---- roadside decoration ---- */
  const rnd = rng(hashStr(key)+777);
  const px = pts.map(p=>[p[0]*W/100, p[1]]);
  const lo = yTop+16, hi = yBot-10;
  const idx = []; px.forEach((p,i)=>{ if(p[1]>=lo && p[1]<=hi) idx.push(i); });
  const route = idx.map(i=>px[i]);
  const cum = [0]; for(let i=1;i<route.length;i++) cum.push(cum[i-1]+Math.hypot(route[i][0]-route[i-1][0], route[i][1]-route[i-1][1]));
  const total = cum[cum.length-1] || 0;
  const nodesPx = xs.map((x,i)=>[x*W/100, ys[i]+20]);
  const placed = [], out = [];
  const DP = DECOR_PLUS[key] || {};
  /* ground starts a little below the horizon artwork; ground-type details stay on the ground */
  const gmin = Math.max(60, 112 + .317*W - (22 + 140 + Math.min(250, Math.max(36, .17*vw)))) + 20;
  const CFG = { big:{cls:'L',off:[52,86],road:40,node:90,gap:50}, small:{cls:'M',off:[42,72],road:30,node:72,gap:36}, ground:{cls:'G',off:[26,44],road:20,node:56,gap:26} };
  const cycle = ['big','ground','small','ground','small','big','ground','small'];
  let dist = 26, n_i = 0;
  const locate = (dd)=>{ let j=1; while(j<cum.length-1 && cum[j]<dd) j++; const a=route[j-1], b=route[j], dx=b[0]-a[0], dy=b[1]-a[1], l=Math.hypot(dx,dy)||1, t=(dd-cum[j-1])/((cum[j]-cum[j-1])||1);
    return { x:lerp(a[0],b[0],Math.max(0,Math.min(1,t))), y:lerp(a[1],b[1],Math.max(0,Math.min(1,t))), nx:-dy/l, ny:dx/l, i:j }; };
  /* matching pairs of landmarks flanking the road between each pair of markers */
  if(DP.avenue){
    for(let s=0;s<n-1;s++){
      const ym = (ys[s]+ys[s+1])/2;
      let j=1; while(j<route.length-1 && route[j][1]<ym) j++;
      const a=route[j-1], b=route[j], dx=b[0]-a[0], dy=b[1]-a[1], l=Math.hypot(dx,dy)||1, nx=-dy/l, ny=dx/l;
      const cx=(a[0]+b[0])/2, cy=(a[1]+b[1])/2;
      /* push each prop out far enough that its drawn body clears the road, whatever the road's direction */
      const Hpx = (AVH[DP.avenue]||.7)*75;
      const pair = [1,-1].map(sd=>{
        const off = 19 + (ny*sd>0 ? Hpx*Math.abs(ny) : 0) + 30*Math.abs(nx);
        return { sd, off, ix:cx+nx*off*sd, iy:cy+ny*off*sd };
      });
      /* a pair only makes sense when both sides fit */
      if(pair.some(q=> q.ix<24 || q.ix>W-24 || nodesPx.some(n2=>Math.hypot(n2[0]-q.ix, n2[1]-q.iy) < 66))) continue;
      pair.forEach(q=>{
        placed.push([q.ix,q.iy]);
        out.push({ y:q.iy, glyph:DP.avenue, cls:'A', flip: q.ix>cx, left:`calc(${f(cx/W*100)}% + ${f(nx*q.off*q.sd)}px)`, top:f(q.iy) });
      });
    }
  }
  while(dist < total-20 && n_i < 60){
    const cat = cycle[n_i % cycle.length]; n_i++;
    const C = CFG[cat], list = R.decor[cat], glyph = list[Math.floor(rnd()*list.length)];
    const pref = (n_i%2?1:-1)*(rnd()<.2?-1:1);
    const P = locate(dist);
    for(const side of [pref,-pref]){
      const off = C.off[0] + rnd()*(C.off[1]-C.off[0]);
      const ix = P.x + P.nx*off*side, iy = P.y + P.ny*off*side;
      if(ix < 16 || ix > W-16) continue;
      if(nodesPx.some(q=>Math.hypot(q[0]-ix, q[1]-iy) < C.node)) continue;
      if(route.some(q=>Math.hypot(q[0]-ix, q[1]-iy) < C.road)) continue;
      if(placed.some(q=>Math.hypot(q[0]-ix, q[1]-iy) < C.gap)) continue;
      placed.push([ix,iy]);
      out.push({ y:iy, glyph, cls:C.cls, left:`calc(${f(P.x/W*100)}% + ${f(P.nx*off*side)}px)`, top:f(iy) });
      break;
    }
    dist += 54 + rnd()*44;
  }
  /* small details hugging the road edge */
  if(DP.edge){
    let dd = 30, k = 0;
    while(dd < total-20 && k < 90){
      k++;
      const g = DP.edge[Math.floor(rnd()*DP.edge.length)], P = locate(dd), side = rnd()<.5?1:-1;
      for(const sd of [side,-side]){
        const off = 25 + rnd()*12, ix = P.x + P.nx*off*sd, iy = P.y + P.ny*off*sd;
        if(ix < 14 || ix > W-14 || iy < gmin) continue;
        if(nodesPx.some(q=>Math.hypot(q[0]-ix, q[1]-iy) < 62)) continue;
        if(route.some(q=>Math.hypot(q[0]-ix, q[1]-iy) < 19)) continue;
        if(placed.some(q=>Math.hypot(q[0]-ix, q[1]-iy) < 22)) continue;
        placed.push([ix,iy]);
        out.push({ y:iy, glyph:g, cls:'G', left:`calc(${f(P.x/W*100)}% + ${f(P.nx*off*sd)}px)`, top:f(iy) });
        break;
      }
      dd += 34 + rnd()*30;
    }
  }
  /* ground patches and scattered culture/vegetation across the open ground */
  if(DP.scatter){
    const want = Math.round(Math.max(6, Math.min(18, W/70))), yMax = ys[n-1] + 120;
    let got = 0, tries = 0;
    while(got < want && tries < 300){
      tries++;
      const [g,cls] = DP.scatter[Math.floor(rnd()*DP.scatter.length)];
      const ix = W*.12 + rnd()*W*.76, iy = gmin + rnd()*(yMax-gmin);
      if(nodesPx.some(q=>Math.hypot(q[0]-ix, q[1]-iy) < 84)) continue;
      if(route.some(q=>Math.hypot(q[0]-ix, q[1]-iy) < 50)) continue;
      if(placed.some(q=>Math.hypot(q[0]-ix, q[1]-iy) < 46)) continue;
      placed.push([ix,iy]);
      out.push({ y:iy, glyph:g, cls, left:`${f(ix/W*100)}%`, top:f(iy) });
      got++;
    }
  }
  /* props stay inside the same contour as the road (tall ones need more headroom below the far edge) */
  const room = {L:60, A:60, M:44, G:6};
  for(let i=out.length-1;i>=0;i--){ const o=out[i], xp=(parseFloat(String(o.left).match(/([\d.]+)%/)||[50])[1]);
    if(o.y < BC.top(xp)+(room[o.cls]||6) || o.y > BC.bot(xp)-4) out.splice(i,1); }
  out.sort((a,b)=>a.y-b.y);
  const gr = rng(hashStr(key)+909);
  const decor = out.map(o=>{
    const fn = G[o.glyph] || G.pebbles;
    const sway = SWAYERS.has(o.glyph) ? ' pd-sway' : '';
    const tone = sway ? `;filter:hue-rotate(${f(gr()*20-10)}deg) saturate(${f(.9+gr()*.25)}) brightness(${f(.93+gr()*.14)})` : '';
    return `<div class="pd pd-${o.cls}${sway}${o.flip?' pd-flip':''}" style="left:${o.left};top:${o.top}px${tone}" aria-hidden="true"><svg viewBox="0 0 80 100">${o.cls==='G'?'':ell(40,96,22,4.2,'rgba(0,0,0,.2)')}${fn(gr)}</svg></div>`;
  }).join('');
  return { svg, decor, ys };
}

/* a road section that blends the end of one chapter into the start of the next */
let _brUID = 0;
function bridgeSVG(prevId, nextId, xFrom, xTo, BH){
  const A = ROAD[prevId]||ROAD.prologue, B = ROAD[nextId]||ROAD.prologue, id = 'brc'+(++_brUID);
  const pts=[]; const c0=BH*.5;
  for(let k=0;k<=24;k++){ const t=k/24, m=1-t; pts.push([ m*m*m*xFrom+3*m*m*t*xFrom+3*m*t*t*xTo+t*t*t*xTo, 3*m*m*t*c0 + 3*m*t*t*c0 + t*t*t*BH ]); }
  const d = polyD(pts);
  return `<svg class="bridge-road" viewBox="0 0 100 ${BH}" preserveAspectRatio="none" aria-hidden="true"><defs><clipPath id="${id}a"><rect x="-10" y="-20" width="120" height="${BH/2+20}"/></clipPath><clipPath id="${id}b"><rect x="-10" y="${BH/2}" width="120" height="${BH/2+20}"/></clipPath></defs>`+
    `<g clip-path="url(#${id}a)">${roadLayers(ROAD[prevId]?prevId:'prologue').map(L=>layerSVG(d,L)).join('')}</g><g clip-path="url(#${id}b)">${roadLayers(ROAD[nextId]?nextId:'prologue').map(L=>layerSVG(d,L)).join('')}</g></svg>`;
}

/* ---- level-marker plinths (the platform each medallion stands on) ---- */
const PLINTH = {
  prologue:{ shape:'round', top:'#b98a52', side:'#7a5530', rim:'#6a4a28', dash:'2 4', inner:'#9a6a38',
    flank:x=>grassTuft(x,50,1.5,'#5f8a3f')+wheatPatch(x-6,50,12,Math.random,.6) },
  egypt:{ shape:'hex', top:'#ecd29a', side:'#b8883a', rim:'#2fa6b0', dash:'3 3', inner:'#d8bb7a',
    flank:x=>poly([[x-4,50],[x-2,30],[x+2,30],[x+4,50]],'#d9b873')+poly([[x-2,30],[x,23],[x+2,30]],'#e8c860') },
  babylon:{ shape:'rect', top:'#2f6aa8', side:'#163e72', rim:'#e0b440', dash:'3 3', inner:'#1c4a86',
    flank:x=>circ(x,42,6,'#e0b440')+[0,60,120,180,240,300].map(a=>circ(x+Math.cos(a*Math.PI/180)*6,42+Math.sin(a*Math.PI/180)*6,2.2,'#fff2c0')).join('')+rect(x-1.4,48,2.8,5,'#a87a1a') },
  china:{ shape:'round', top:'#b8b2a2', side:'#6a6458', rim:'#c9503f', dash:'2 4', inner:'#9c9686',
    flank:x=>line(x,26,x,52,'#6a4a2a',2)+ell(x,38,6,8,'#d8402c')+rect(x-4,29,8,2.4,'#d4a62a')+line(x,46,x,52,'#d4a62a',1.4) },
  greece:{ shape:'round', top:'#f3eee2', side:'#b9b2a0', rim:'#3d7fb8', dash:'5 3', inner:'#e0d9c6',
    flank:x=>rect(x-5,46,10,5,'#e8e2d2')+rect(x-3.4,31,6.8,15,'#f4efe3')+rect(x-5,28,10,3.4,'#e8e2d2') },
  india:{ shape:'round', top:'#d9955a', side:'#a12f36', rim:'#ffd27a', dash:'1.5 3.5', inner:'#c9743a',
    flank:x=>[-40,0,40].map(a=>`<path d="M${x} 50 Q${f(x+Math.sin(a*Math.PI/180)*9)} 40 ${x} ${f(35+Math.abs(a)/8)} Q${f(x-Math.sin(a*Math.PI/180)*2)} 42 ${x} 50Z" fill="${a?'#ff9ab8':'#ffc2d4'}" transform="rotate(${a} ${x} 50)"/>`).join('')+ell(x,51,8,2.4,'#4f8a4a') },
  islam:{ shape:'star', top:'#1fae8e', side:'#0f5a5a', rim:'#d8b24a', dash:'3 3', inner:'#168a70',
    flank:x=>rect(x-1,30,2,8,'#a07a20')+ell(x,44,7,6,'#d8b24a')+ell(x,43,4,3.6,'#fff0b0')+rect(x-4,49,8,2.4,'#a07a20') },
  europe:{ shape:'round', top:'#9a9282', side:'#5a5446', rim:'#6a8a4a', dash:'4 3', inner:'#8a8272',
    flank:x=>rect(x-1.6,34,3.2,18,'#6a4a2a')+`<path d="M${x} 20 Q${x+6} 28 ${x+3} 34 L${x-3} 34 Q${x-6} 28 ${x} 20Z" fill="#ff8a2a"/>`+`<path d="M${x} 26 Q${x+3} 30 ${x+1.6} 34 L${x-1.6} 34 Q${x-3} 30 ${x} 26Z" fill="#ffd860"/>` },
  modern:{ shape:'hex', top:'#162a48', side:'#0a1a2e', rim:'#5ee0ff', dash:'', inner:'#0e2038',
    flank:x=>rect(x-1.4,28,2.8,24,'#4a5a78')+circ(x,28,6,'rgba(94,224,255,.3)')+circ(x,28,3,'#8af0ff') }
};
function plinthSVG(id){
  const P = PLINTH[id]||PLINTH.prologue, cx=62, cy=34, RX=52, RY=17;
  const sh = (dy,k,fill,ex='')=>{
    const rx=RX*k, ry=RY*k, y=cy+dy;
    if(P.shape==='hex') return poly([[cx-rx,y],[cx-rx/2,y-ry],[cx+rx/2,y-ry],[cx+rx,y],[cx+rx/2,y+ry],[cx-rx/2,y+ry]],fill,ex);
    if(P.shape==='rect') return rect(cx-rx,y-ry,rx*2,ry*2,fill,`rx="7" ${ex}`);
    if(P.shape==='star'){ let p=[]; for(let i=0;i<16;i++){ const a=i/16*6.2832, r=(i%2?.8:1); p.push([cx+Math.cos(a)*rx*r, y+Math.sin(a)*ry*r]); } return poly(p,fill,ex); }
    return ell(cx,y,rx,ry,fill,ex);
  };
  return `<svg viewBox="0 0 124 64" aria-hidden="true">${ell(cx,cy+14,RX+18,22,VERGE[id]||'#8a7a5a','opacity=".30"')}${ell(cx,cy+14,RX+8,15,VERGE[id]||'#8a7a5a','opacity=".34"')}${ell(cx,cy+17,RX+4,15,'rgba(0,0,0,.3)')}${sh(10,1,P.side)}${sh(0,1,P.top)}`+
    `${sh(0,.97,'url(#sa-grain)','opacity=".6"')}${sh(0,.86,'none',`stroke="${P.rim}" stroke-width="2.2"${P.dash?` stroke-dasharray="${P.dash}"`:''}`)}${sh(0,.62,P.inner,'opacity=".55"')}${sh(-1,.96,'none','stroke="rgba(255,255,255,.35)" stroke-width="1"')}`+
    `${P.flank(11)}${P.flank(113)}</svg>`;
}

window.StoryArt = { THEME, backdrop, applyTheme, ensureDefs, fruitSVG, FRUIT_NAMES, starsHTML, propSVG, burst, swapOut, swapBack,
  progressUpdate, observe, bindPins, chapterIntro, openJournal, chapterCompleteHTML, friezeSVG, svgURI, reduceMotion, buildRoad, bridgeSVG, plinthSVG, laneX, LANE, applyMarker };
})();


(function(){
"use strict";

/* ============================================================
   STATE / PERSISTENCE
   ============================================================ */
const LEVEL_THRESHOLDS = [500,1000,1600,2300,3100,4000,5000,6200,7500]; // exp needed per level-up
const MAX_LEVEL = 10;
const STORAGE_KEY = "fractionQuestMangoGrove_v1";

let state = loadState();

function defaultState(){
  return {
    exp:0, level:1, coins:15, streak:0, lastPlayDate:null,
    usedQuestions:{} // "game_diff" -> array of used prompt keys
  };
}
function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return Object.assign(defaultState(), parsed);
  }catch(e){ return defaultState(); }
}
function saveState(){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){}
}

function expNeededForLevel(level){
  if(level > LEVEL_THRESHOLDS.length) return null; // maxed
  return LEVEL_THRESHOLDS[level-1];
}

function addExp(amount){
  if(state.level >= MAX_LEVEL){ return; }
  state.exp += amount;
  let leveled = false;
  let needed = expNeededForLevel(state.level);
  while(needed !== null && state.exp >= needed && state.level < MAX_LEVEL){
    state.exp -= needed;
    state.level += 1;
    leveled = true;
    needed = expNeededForLevel(state.level);
  }
  if(state.level >= MAX_LEVEL){ state.exp = 0; }
  saveState();
  renderExpBar();
  if(leveled) showLevelUp();
}
function addCoins(amount){ state.coins += amount; saveState(); renderTopBadges(); }
function spendCoins(amount){
  if(state.coins < amount) return false;
  state.coins -= amount; saveState(); renderTopBadges(); return true;
}

function renderExpBar(){
  document.getElementById('lvl-num').textContent = state.level;
  const needed = expNeededForLevel(state.level);
  const curEl = document.getElementById('exp-current');
  const needEl = document.getElementById('exp-needed');
  const fill = document.getElementById('exp-fill');
  const mango = document.getElementById('exp-mango');
  if(needed === null){
    curEl.textContent = "MAX"; needEl.textContent = "LEVEL";
    fill.style.width = "100%";
    mango.style.filter = "hue-rotate(0deg) saturate(1.4)";
    return;
  }
  curEl.textContent = state.exp;
  needEl.textContent = needed;
  const pct = Math.min(100, Math.round((state.exp/needed)*100));
  fill.style.width = pct + "%";
  // ripen mango: green (unripe) -> orange/red (ripe) as pct climbs
  const hue = 100 - Math.round(pct*1.0); // 100(green)->0(red-ish)
  mango.style.filter = `hue-rotate(${-(100-hue)}deg) saturate(1.3)`;
}
function renderTopBadges(){
  document.getElementById('coin-count').textContent = state.coins;
  document.getElementById('streak-count').textContent = state.streak;
}
function showLevelUp(){
  document.getElementById('levelup-text').textContent = `You reached level ${state.level}!`;
  document.getElementById('levelup-modal').classList.remove('hidden');
}
document.getElementById('btn-levelup-close').addEventListener('click', ()=>{
  document.getElementById('levelup-modal').classList.add('hidden');
});

function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._h);
  toast._h = setTimeout(()=>t.classList.remove('show'), 2200);
}

/* ============================================================
   SCREEN ROUTER
   ============================================================ */
function show(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}
document.querySelectorAll('[data-back]').forEach(b=>{
  b.addEventListener('click', ()=> show(b.getAttribute('data-back')) );
});

document.getElementById('btn-play').addEventListener('click', ()=> show('screen-play'));
document.getElementById('btn-mechanics').addEventListener('click', ()=> show('screen-mechanics'));
document.getElementById('btn-knowledge').addEventListener('click', ()=> show('screen-knowledge'));
document.getElementById('btn-credits').addEventListener('click', ()=> show('screen-credits'));
document.getElementById('btn-exit').addEventListener('click', ()=>{
  document.getElementById('exit-modal').classList.remove('hidden');
});
document.getElementById('btn-exit-cancel').addEventListener('click', ()=>{
  document.getElementById('exit-modal').classList.add('hidden');
});
document.getElementById('btn-exit-confirm').addEventListener('click', ()=>{
  document.body.innerHTML = `<div style="height:100vh;display:flex;align-items:center;justify-content:center;
    background:#23392E;color:#FBF3E3;font-family:'Baloo 2',sans-serif;font-size:22px;text-align:center;padding:20px;">
    🥭 Thanks for playing Fraction Quest: Mango Grove!<br>You can close this tab now.</div>`;
  try{ window.close(); }catch(e){}
});

let selectedGame = null; // 'match' | 'mango' | 'fish'
document.querySelectorAll('[data-game]').forEach(b=>{
  b.addEventListener('click', ()=>{
    selectedGame = b.getAttribute('data-game');
    document.getElementById('diff-header').textContent =
      "Choose Difficulty — " + GAME_NAMES[selectedGame];
    show('screen-difficulty');
  });
});

let selectedDifficulty = null;
document.querySelectorAll('[data-diff]').forEach(b=>{
  b.addEventListener('click', ()=>{
    selectedDifficulty = b.getAttribute('data-diff');
    window.fracStartAfterTutorial(selectedGame, startRound);
  });
});

document.getElementById('btn-play-again').addEventListener('click', startRound);
document.getElementById('btn-change-diff').addEventListener('click', ()=> show('screen-difficulty'));
document.getElementById('btn-quit-game').addEventListener('click', ()=> openQuitDialog());
// The original quit behaviour, unchanged; it now runs only after the player confirms.
function performQuitGame(){
  clearTimers();
  show('screen-menu');
}

/* ============================================================
   FRACTION / QUESTION GENERATION
   ============================================================ */
function gcd(a,b){ a=Math.abs(a); b=Math.abs(b); while(b){[a,b]=[b,a%b];} return a || 1; }
function lcm(a,b){ return Math.abs(a*b) / gcd(a,b); }
function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; }
  return arr;
}
function fracStr(n,d){ return `${n}/${d}`; }
function simplify(n,d){ const g=gcd(n,d); return [n/g, d/g]; }
function properFrac(maxDen){
  const d = randInt(2,maxDen);
  const n = randInt(1,d-1);
  return [n,d];
}
function toMixedStr(n,d){
  const whole = Math.floor(n/d);
  const rem = n % d;
  if(rem === 0) return `${whole}`;
  return `${whole} ${rem}/${d}`;
}

const DIFF_CONFIG = {
  easy:    { time:15, maxDen:10 },
  medium:  { time:20, maxDen:12 },
  hard:    { time:25, maxDen:15 },
  insane:  { time:30, maxDen:20 },
  // Story Mode tiers — five bands of ten levels each, gradually introducing
  // harder fraction types as the player moves through history.
  storyT1: { time:22, maxDen:6 },
  storyT2: { time:20, maxDen:8 },
  storyT3: { time:20, maxDen:10 },
  storyT4: { time:18, maxDen:12 },
  storyT5: { time:16, maxDen:15 }
};
const EXP_PER_CORRECT = { easy:20, medium:35, hard:55, insane:80, storyT1:12, storyT2:16, storyT3:20, storyT4:26, storyT5:32 };
// Coins are no longer paid per question — a whole round now pays out only
// 0-3 coins total (based on how many were answered correctly), so players
// can't just farm endless hints instead of actually thinking. See coinsForScore().
function coinsForScore(score){
  if(score >= 9) return 3;
  if(score >= 6) return 2;
  if(score >= 3) return 1;
  return 0;
}
const GAME_NAMES = { match:'Fraction Match', mango:'Mango Falling', fish:'Fishtions', snake:'S-Frac' };
const FISH_LIVES_START = 5;

/* ============================================================
   FRACTION MATCH — 4 AI CLASSMATES + YOU (5-seat showdown)
   Each bot "thinks" for a random slice of the question's timer,
   then locks in an answer with a difficulty-scaled accuracy.
   ============================================================ */
// Fresh classmate names — distinct from the NAMES cast used in the
// situational word-problem bank / credits, so nobody is reused.
const MATCH_BOTS = [
  { name:'Jinky',   avatar:'👧', accMod:-0.08, speedMod:-0.14 }, // fast but sloppier
  { name:'Dodong',  avatar:'🧒', accMod: 0.04, speedMod: 0.06 },
  { name:'Boyet',   avatar:'🧑', accMod: 0.00, speedMod: 0.00 },
  { name:'Marites', avatar:'👩', accMod: 0.10, speedMod: 0.16 }  // slow but sharp
];
// Base accuracy / think-time window (as a fraction of the question's timer)
// per difficulty — bots get noticeably better and faster the harder you go,
// so Fraction Match stays a real challenge at Insane.
const AI_BASE = {
  easy:   { acc:0.50, speedMin:0.35, speedMax:0.85 },
  medium: { acc:0.62, speedMin:0.28, speedMax:0.75 },
  hard:   { acc:0.74, speedMin:0.22, speedMax:0.65 },
  insane: { acc:0.85, speedMin:0.16, speedMax:0.55 }
};
let matchAITimers = [];
let matchAIAnswers = [null,null,null,null];
let matchAIFinalized = false;
let matchPlayerAnswered = false;
let matchPlayerCorrect = false;
let matchRoundEnded = false;
let matchSafetyTimer = null;

function clamp01(v){ return Math.max(0.05, Math.min(0.97, v)); }

function initMatchOpponents(){
  round.aiScores = [0,0,0,0];
  renderMatchSeats();
}

// Player sits in the middle seat, flanked by two classmates on each side —
// reads more like an actual seated row than a plain left-to-right list.
function renderMatchSeats(){
  const wrap = document.getElementById('match-seats');
  if(!wrap) return;
  const botSeat = (bot,i)=>`
    <div class="m-seat" id="m-seat-${i}">
      <div class="m-seat-tag">
        <div class="m-seat-name">${bot.name}</div>
        <div class="m-seat-score">✔ <span id="m-seat-score-${i}">0</span></div>
        <div class="m-seat-status" id="m-seat-status-${i}">—</div>
      </div>
      <div class="m-seat-figure">
        <div class="m-seat-avatar">${bot.avatar}</div>
        <div class="m-seat-chairback"></div>
        <div class="m-seat-desk"></div>
      </div>
    </div>`;
  const youSeat = `
    <div class="m-seat you" id="m-seat-you">
      <div class="m-seat-tag">
        <div class="m-seat-name">YOU</div>
        <div class="m-seat-score">✔ <span id="m-seat-score-you">0</span></div>
        <div class="m-seat-status" id="m-seat-status-you">Your turn!</div>
      </div>
      <div class="m-seat-figure">
        <div class="m-seat-avatar">🙂</div>
        <div class="m-seat-chairback"></div>
        <div class="m-seat-desk"></div>
      </div>
    </div>`;
  wrap.innerHTML = botSeat(MATCH_BOTS[0],0) + botSeat(MATCH_BOTS[1],1) + youSeat
    + botSeat(MATCH_BOTS[2],2) + botSeat(MATCH_BOTS[3],3);
}

function setSeatStatus(i, mode, text){
  const seat = document.getElementById(i==='you' ? 'm-seat-you' : `m-seat-${i}`);
  const status = document.getElementById(i==='you' ? 'm-seat-status-you' : `m-seat-status-${i}`);
  if(!seat || !status) return;
  seat.classList.remove('thinking','answered','right','wrong');
  if(mode) seat.classList.add(mode);
  if(text !== undefined) status.textContent = text;
}


function startAIAnswering(){
  matchAITimers.forEach(t=>pClear(t));
  matchAITimers = [];
  matchAIAnswers = [null,null,null,null];
  matchAIFinalized = false;
  matchPlayerAnswered = false;
  matchPlayerCorrect = false;
  matchRoundEnded = false;
  if(matchSafetyTimer){ pClear(matchSafetyTimer); matchSafetyTimer = null; }
  const conf = AI_BASE[selectedDifficulty] || AI_BASE.easy;
  MATCH_BOTS.forEach((bot,i)=>{
    setSeatStatus(i, 'thinking', '🤔 thinking…');
    const minT = Math.max(0.12, conf.speedMin + bot.speedMod*0.5);
    const maxT = Math.max(minT+0.08, conf.speedMax + bot.speedMod);
    const delaySec = Math.min(timeTotal - 0.4, (minT + Math.random()*(maxT-minT)) * timeTotal);
    const t = pTimeout(()=>{
      if(!currentQuestion) return;
      const acc = clamp01(conf.acc + bot.accMod);
      let ans;
      if(Math.random() < acc){
        ans = currentQuestion.correct;
      } else {
        const wrongs = currentQuestion.options.filter(o=>o!==currentQuestion.correct);
        ans = wrongs.length ? wrongs[randInt(0,wrongs.length-1)] : currentQuestion.correct;
      }
      matchAIAnswers[i] = ans;
      // Reveal this classmate's own result the moment THEY finish thinking —
      // never all-at-once — so early player answers don't cut anyone's turn short.
      const isRight = ans === currentQuestion.correct;
      if(isRight) round.aiScores[i] = (round.aiScores[i]||0) + 1;
      setSeatStatus(i, isRight ? 'right' : 'wrong', isRight ? '✅ correct!' : '❌ missed it');
      const scoreEl = document.getElementById(`m-seat-score-${i}`);
      if(scoreEl) scoreEl.textContent = round.aiScores[i]||0;
      checkMatchRoundComplete();
    }, Math.max(150, delaySec*1000));
    matchAITimers.push(t);
  });
}

// Once the player has locked in an answer AND every classmate has finished
// answering on their own, the round is free to move on. If the player
// answers first, we simply wait — each classmate's timer above still fires
// naturally and reveals its own result — instead of forcing everyone to an
// instant, all-at-once verdict.
function checkMatchRoundComplete(){
  if(matchRoundEnded) return;
  if(!matchPlayerAnswered) return;
  if(matchAIAnswers.some(a => a === null)) return;
  matchRoundEnded = true;
  if(matchSafetyTimer){ pClear(matchSafetyTimer); matchSafetyTimer = null; }
  onRoundQuestionEnd(matchPlayerCorrect);
}

// Safety net only — if a classmate's timer somehow never fires (e.g. a
// backgrounded/throttled mobile tab), don't leave the round stuck forever.
// Gives real thinking time first, then resolves whoever's left after a
// generous grace period.
function finalizeAIAnswers(){
  if(matchAIFinalized) return;
  matchAIFinalized = true;
  matchAITimers.forEach(t=>pClear(t));
  matchAITimers = [];
  const conf = AI_BASE[selectedDifficulty] || AI_BASE.easy;
  MATCH_BOTS.forEach((bot,i)=>{
    if(matchAIAnswers[i] === null){
      const acc = clamp01(conf.acc + bot.accMod);
      if(Math.random() < acc){
        matchAIAnswers[i] = currentQuestion.correct;
      } else {
        const wrongs = currentQuestion.options.filter(o=>o!==currentQuestion.correct);
        matchAIAnswers[i] = wrongs.length ? wrongs[randInt(0,wrongs.length-1)] : currentQuestion.correct;
      }
    }
    const isRight = matchAIAnswers[i] === currentQuestion.correct;
    if(isRight){ round.aiScores[i] = (round.aiScores[i]||0) + 1; }
    setSeatStatus(i, isRight ? 'right' : 'wrong', isRight ? '✅ correct!' : '❌ missed it');
    const scoreEl = document.getElementById(`m-seat-score-${i}`);
    if(scoreEl) scoreEl.textContent = round.aiScores[i]||0;
  });
}

function buildMatchLeaderboard(){
  const wrap = document.getElementById('match-leaderboard');
  if(!wrap) return;
  const rows = MATCH_BOTS.map((bot,i)=>({ name:bot.name, avatar:bot.avatar, score:round.aiScores[i]||0, you:false }));
  rows.push({ name:'You', avatar:'🙂', score:round.score, you:true });
  rows.sort((a,b)=> b.score - a.score);
  const rowsEl = document.getElementById('match-leaderboard-rows');
  rowsEl.innerHTML = rows.map((r,i)=>`
    <div class="lb-row">
      <span class="lb-rank">#${i+1}</span>
      <span class="lb-avatar">${r.avatar}</span>
      <span class="lb-name ${r.you?'you':''}">${r.name}</span>
      <span class="lb-score">${r.score} / ${ROUND_LENGTH}</span>
    </div>
  `).join('');
  const youRank = rows.findIndex(r=>r.you) + 1;
  const beat = rows.filter(r=>!r.you && round.score > r.score).length;
  let summary;
  if(youRank === 1) summary = `🏆 You topped the class! Best score in the room.`;
  else if(beat >= 2) summary = `👏 Solid round — you outscored ${beat} of your 4 classmates.`;
  else summary = `📚 The class edged you out this time — review the Knowledge Grove and try again!`;
  document.getElementById('match-leaderboard-summary').textContent = summary;
  wrap.classList.remove('hidden');
}

/* ============================================================
   FRACDASH QUESTION ENGINE  (shared by every game mode)
   - exact rational arithmetic ([numerator, denominator] pairs)
   - Grade 7 focus: ~78 % fraction addition/subtraction, ~14 % basic skills
     (simplify, equivalent, compare), ~8 % short word problems
   - four profiles (Easy/Medium/Hard/Insane) shared by every game and Story tier
   - distractors built from real misconceptions, never random noise
   - every question is re-verified with independent float maths before it is shown
   - anti-repeat memory: exact questions, correct answers, answer sets, wording,
     kinds of question and the correct answer's position (shared across all games)
   ============================================================ */
const NAMES = ['Wilson','Lorraine','Rusty','Ate Sol','Kuya Ben','Nena'];
const WP_NAMES = ['Wilson','Lorraine','Rusty','Ate Sol','Kuya Ben','Nena','Mang Tonyo','Aling Rosa','Tala','Migo','Bea','Carlo','Lani','Paolo'];
function randChoice(arr){ return arr[randInt(0,arr.length-1)]; }
function otherName(exclude){ let n = randChoice(WP_NAMES); while(n===exclude) n = randChoice(WP_NAMES); return n; }
function pickNames(k){ return shuffle(WP_NAMES.slice()).slice(0,k); }

/* ---- exact rationals ---- */
const QM = (n,d)=>{ if(d<0){ n=-n; d=-d; } const g=gcd(n,d)||1; return [n/g, d/g]; };
const qAdd=(a,b)=>QM(a[0]*b[1]+b[0]*a[1], a[1]*b[1]);
const qSub=(a,b)=>QM(a[0]*b[1]-b[0]*a[1], a[1]*b[1]);
const qMul=(a,b)=>QM(a[0]*b[0], a[1]*b[1]);
const qDiv=(a,b)=>QM(a[0]*b[1], a[1]*b[0]);
const qEq=(a,b)=>a[0]===b[0] && a[1]===b[1];
const qVal=a=>a[0]/a[1];
const qInt=n=>[n,1];
/* display: whole numbers are plain integers, never 1/1 or 8/4 */
function fmtQ(q, style){
  const n=q[0], d=q[1];
  if(d===1) return String(n);
  if(style==='improper' || n<d) return `${n}/${d}`;
  const w=Math.floor(n/d), r=n%d;
  return `${w} ${r}/${d}`;
}
function parseQ(s){
  s = String(s).trim(); let m;
  if((m=s.match(/^(\d+)$/))) return [parseInt(m[1],10),1];
  if((m=s.match(/^(\d+)\/(\d+)$/))) return QM(parseInt(m[1],10),parseInt(m[2],10));
  if((m=s.match(/^(\d+) (\d+)\/(\d+)$/))) return QM(parseInt(m[1],10)*parseInt(m[3],10)+parseInt(m[2],10), parseInt(m[3],10));
  return null;
}
const pf = (n,d)=>`${n}/${d}`;                       // raw operand shown in a prompt (not reduced)
const pm = (w,n,d)=> n===0 ? `${w}` : `${w} ${n}/${d}`; // mixed operand shown in a prompt
const rI = randInt, pick = randChoice;
const coin = p => Math.random() < p;

/* a numerator already in lowest terms with its denominator (so prompts never show 3/9 by accident) */
function pn(d, lo, hi){ lo=lo||1; hi=hi||d-1; for(let t=0;t<40;t++){ const n=rI(lo,hi); if(gcd(n,d)===1) return n; } for(let n=lo;n<=hi;n++) if(gcd(n,d)===1) return n; return lo; }
/* ---- anti-repeat memory ---- */
const QH = { ans:[], fam:[], sig:[], prm:[], pos:[0,0,0,0], lastPos:[], phr:{} };
function pickPhrase(famId, arr){
  const last = QH.phr[famId]; let i = rI(0,arr.length-1);
  if(arr.length>1) for(let g=0; g<6 && i===last; g++) i = rI(0,arr.length-1);
  QH.phr[famId] = i; return arr[i];
}
function choosePos(){
  let cands = [0,1,2,3].filter(i=> !QH.lastPos.slice(-2).includes(i));
  if(!cands.length) cands = [0,1,2,3];
  const min = Math.min(...cands.map(i=>QH.pos[i]));
  const best = cands.filter(i=>QH.pos[i] <= min+1);
  return pick(best);
}
function arrange(correctStr, others){
  const idx = choosePos(), arr = shuffle(others.slice());
  arr.splice(idx,0,correctStr);
  return { options:arr, idx };
}
function notePos(idx){ QH.pos[idx]++; QH.lastPos.push(idx); if(QH.lastPos.length>6) QH.lastPos.shift(); if(QH.pos.reduce((a,b)=>a+b,0)>400) QH.pos=QH.pos.map(v=>Math.round(v/2)); }

/* ---- distractor assembly ---- */
const NMAX = 150;
function neighborsOf(c){
  const [n,d]=c, out=[];
  [[1,0],[-1,0],[2,0],[-2,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]].forEach(([a,b])=>{ if(d+b>=1 && n+a>=1) out.push(QM(n+a,d+b)); });
  out.push(QM(n+d,d), QM(Math.max(1,n-d),d), QM(d,n), [n+1,1], [Math.max(1,n-1),1]);
  return out;
}
/* tiers = [[misconception answers], [other plausible answers]]  (as rationals) */
function numericQ(o){
  const style = o.style||'mixed', correct = o.correct, cs = fmtQ(correct,style);
  const seen = new Set([correct[0]+'/'+correct[1]]), chosen = [];
  const ok = q=>{
    if(!q || !Number.isInteger(q[0]) || !Number.isInteger(q[1]) || q[1]<1 || q[0]<(o.allowZero?0:1)) return false;
    if(q[0]>NMAX || q[1]>NMAX) return false;
    if(style==='improper' && !o.proper && (q[1]===1 || q[0]<q[1])) return false;
    if(o.maxVal && qVal(q)>o.maxVal) return false;
    if(qVal(correct)<1 && qVal(q)>=1 && !o.anySize) return false;       // an answer below 1 keeps its distractors below 1 too
    return true;
  };
  const take = (list, limit)=>{
    for(const raw of shuffle(list.slice())){
      if(chosen.length>=limit) break;
      if(!raw) continue;
      const q = QM(raw[0],raw[1]), k=q[0]+'/'+q[1];
      if(seen.has(k) || !ok(q)) continue;
      seen.add(k); chosen.push(q);
    }
  };
  const t0 = o.tiers && o.tiers[0] || [], t1 = o.tiers && o.tiers[1] || [];
  take(t0, 2); take(t1, 3); take(t0, 3); take(neighborsOf(correct), 3);
  if(chosen.length<3) return null;
  const others = chosen.map(q=>fmtQ(q,style));
  const A = arrange(cs, others);
  return { prompt:o.prompt, correct:cs, options:A.options, _idx:A.idx, key:o.key, fam:o.fam, meta:o.meta, style, canon:o.canon!==false, topic:o.topic||o.fam };
}
function textQ(o){
  const pool = Array.from(new Set(o.others.filter(x=>x!==o.correct)));
  if(pool.length<3) return null;
  const A = arrange(o.correct, shuffle(pool).slice(0,3));
  return { prompt:o.prompt, correct:o.correct, options:A.options, _idx:A.idx, key:o.key, fam:o.fam, meta:o.meta, style:'text', canon:false, topic:o.topic||o.fam };
}

/* ---- independent verification (floats, written separately from the generators) ---- */
const fv = a => a[0]/a[1];
function numOf(s){ const q = parseQ(s); return q ? q[0]/q[1] : NaN; }
function expectedOf(m){
  switch(m.k){
    case 'add': return fv(m.a)+fv(m.b);
    case 'sub': return fv(m.a)-fv(m.b);
    case 'chain': return m.terms.reduce((t,x)=> t + x[0]*fv(x[1]), 0);
    case 'simp': return fv(m.a);
    case 'equivNum': return m.a[0]*m.d2/m.a[1];
    case 'equivDen': return m.a[1]*m.n2/m.a[0];
    case 'miss': switch(m.form){
      case 'plus': return fv(m.t)-fv(m.a);      // a + ? = t
      case 'minusR': return fv(m.t)-fv(m.r);    // t - ? = r
      case 'minusL': return fv(m.a)+fv(m.r);    // ? - a = r
      case 'plusNum': return m.t[0]-m.a[0];     // a/d + ?/d = t/d
      case 'minusNum': return m.t[0]-m.r[0];    // t/d - ?/d = r/d
    } break;
  }
  return NaN;
}
/* what each difficulty may contain — checked on every question before it is shown */
const GUARD = {
  easy:   { den:10, val:2,  lcm:10 },      // same denominators only
  medium: { den:18, val:5,   lcm:18 },
  hard:   { den:36, val:9,  lcm:36 },
  insane: { den:60, val:14, lcm:60 }
};
function verifyQ(q){
  if(!q || !q.prompt || !q.options || q.options.length!==4 || !q.meta) return false;
  const opts=q.options, m=q.meta, eps=1e-9;
  if(new Set(opts).size!==4) return false;                              // unique choices
  if(opts.filter(o=>o===q.correct).length!==1) return false;            // exactly one correct, and present
  if(q.options[q._idx]!==q.correct) return false;
  if(opts.some(o=>/(^|[^\d])\d+\/1($|[^\d])/.test(o))) return false;   // no 1/1, 2/1 …
  if(q.style!=='text'){
    const vals = opts.map(numOf);
    if(vals.some(v=>!isFinite(v))) return false;
    for(let i=0;i<4;i++) for(let j=i+1;j<4;j++) if(Math.abs(vals[i]-vals[j])<eps) return false;
    if(q.canon){
      for(const o of opts){ const pq = parseQ(o); if(!pq || fmtQ(pq, q.style)!==o) return false; }
    }
    const e = expectedOf(m);
    if(!isNaN(e) && Math.abs(numOf(q.correct)-e)>1e-7) return false;
  }
  switch(m.k){
    case 'equivSet': {
      const same = opts.map(o=>{ const p=o.split('/').map(Number); return Math.abs(p[0]/p[1]-fv(m.base))<eps; });
      const n = same.filter(Boolean).length;
      if(m.mode==='is' && !(n===1 && same[opts.indexOf(q.correct)])) return false;
      if(m.mode==='not' && !(n===3 && !same[opts.indexOf(q.correct)])) return false;
      break; }
    case 'extreme': {
      const vals = opts.map(o=>fv(o.split('/').map(Number)));
      const best = m.mode==='max' ? Math.max(...vals) : Math.min(...vals);
      if(vals.filter(v=>Math.abs(v-best)<eps).length!==1) return false;
      if(Math.abs(fv(q.correct.split('/').map(Number))-best)>eps) return false;
      break; }
    case 'add': case 'sub': case 'chain': {
      const G = GUARD[m.P]; if(!G) return false;
      const c = parseQ(q.correct); if(!c) return false;
      if(c[1]>G.den || qVal(c)>G.val) return false;
      const dens = m.k==='chain' ? m.terms.map(t=>t[1][1]) : [m.a[1], m.b[1]];
      const L = dens.reduce((x,y)=>lcm(x,y),1);
      if(L>G.lcm) return false;
      if(m.P==='easy' && m.k!=='chain' && m.a[1]!==m.b[1] && !m.allowUnlike) return false;
      if(qVal(c)<=0) return false;
      break; }
  }
  return true;
}

/* ============================================================
   DIFFICULTY PROFILES (Grade 7)
   Every game and every Story tier draws from the same four profiles,
   so "Hard" means the same amount of maths in every game.
   cat = [addition & subtraction, other basic skills, short word problems]
   ============================================================ */
const PROFILES = {
  easy:   { id:'easy',   cat:[.78,.14,.08] },
  medium: { id:'medium', cat:[.78,.14,.08] },
  hard:   { id:'hard',   cat:[.78,.14,.08] },
  insane: { id:'insane', cat:[.78,.14,.08] }
};
/* Story chapters ramp up with the same profiles: gentle start, then the four levels */
const DIFF_MIX = {
  easy:[['easy',1]], medium:[['medium',1]], hard:[['hard',1]], insane:[['insane',1]],
  storyT1:[['easy',1]], storyT2:[['easy',.5],['medium',.5]], storyT3:[['medium',1]],
  storyT4:[['hard',1]], storyT5:[['hard',.5],['insane',.5]]
};
function chooseProfile(diff){
  const mix = DIFF_MIX[diff] || DIFF_MIX.medium; let r=Math.random();
  for(const [id,w] of mix){ r-=w; if(r<=0) return PROFILES[id]; }
  return PROFILES[mix[mix.length-1][0]];
}
function wpick(list){                    // list of [value, weight]
  let r=Math.random()*list.reduce((a,b)=>a+b[1],0);
  for(const [v,w] of list){ r-=w; if(r<=0) return v; }
  return list[list.length-1][0];
}

/* ---- denominators ---- */
function pickDens(P, mode){
  const cfg = {
    medium:{ max:12, lcm:12, lcmAny:15 },
    hard:  { max:12, lcm:36, lcmAny:36 },
    insane:{ max:20, lcm:60, lcmAny:60 }
  }[P.id];
  for(let t=0;t<200;t++){
    const a=rI(2,cfg.max), b=rI(2,cfg.max);
    if(a===b) continue;
    const L=lcm(a,b), related=(a%b===0||b%a===0);
    if(mode==='related'){ if(!related || L>cfg.lcm) continue; }
    else if(mode==='any'){ if(related || L>cfg.lcmAny) continue; if(P.id==='medium' && L>cfg.lcmAny) continue; }
    else if(mode==='hidden'){ if(related || gcd(a,b)===1 || L>cfg.lcm) continue; }   // shared factor, "less obvious" common multiple
    if(P.id==='hard' && related && mode==='any') continue;
    return [a,b];
  }
  return null;
}
/* operands: {q:[n,d] (improper form), s:display text, w,r,d,type} */
function mkOperand(type, d, P){
  if(type==='mixed'){ const w=rI(1, P.id==='insane'?6:4), r=pn(d); return { q:[w*d+r,d], s:pm(w,r,d), w,r,d,type }; }
  if(type==='improper'){ const n=pn(d,d+1,d*2-1); return { q:[n,d], s:pf(n,d), w:0, r:n,d,type }; }
  const n=pn(d); return { q:[n,d], s:pf(n,d), w:0, r:n, d, type:'proper' };
}
function asTiers(op, A, B, res){
  const a=A.q, b=B.q, tiers=[[],[]];
  const sumN = a[0]+b[0];
  if(op==='+'){
    tiers[0].push([a[0]+b[0], a[1]+b[1]]);                                  // add tops and bottoms
    if(a[1]!==b[1]){ tiers[0].push([a[0]+b[0], Math.max(a[1],b[1])], [a[0]+b[0], lcm(a[1],b[1])]); }
    else tiers[0].push([a[0]+b[0], a[1]*2]);
    if(A.type==='mixed'||B.type==='mixed'){
      const ws=(A.w||0)+(B.w||0);
      tiers[0].push([ws*lcm(a[1],b[1])+ (A.r*(lcm(a[1],b[1])/a[1]) + B.r*(lcm(a[1],b[1])/b[1])) + lcm(a[1],b[1]), lcm(a[1],b[1])]);   // carried one too many
      tiers[0].push([ws*(a[1]+b[1])+A.r+B.r, a[1]+b[1]]);
    }
  } else {
    tiers[0].push([Math.abs(a[0]-b[0]), Math.abs(a[1]-b[1])||a[1]+b[1]]);   // subtract tops and bottoms
    if(a[1]!==b[1]) tiers[0].push([Math.abs(a[0]-b[0]), Math.max(a[1],b[1])]);
    if(A.type==='mixed' && B.type==='mixed'){                                // "borrowing" slips
      const L=lcm(a[1],b[1]), f1=A.r*(L/a[1]), f2=B.r*(L/b[1]);
      tiers[0].push([ (A.w-B.w)*L + Math.abs(f1-f2), L ]);
      tiers[0].push([ (A.w-B.w)*L + f1 + f2, L ]);
    }
  }
  tiers[0].push([res[0]+1,res[1]],[Math.max(1,res[0]-1),res[1]]);
  tiers[1].push([res[0],res[1]+1],[res[0]+2,res[1]],[res[0]+res[1],res[1]]);
  return tiers;
}
function phrases(op){
  return op==='+'
    ? [(A,B)=>`Add: ${A} + ${B} = ?`,(A,B)=>`What is ${A} + ${B}?`,(A,B)=>`Find the sum of ${A} and ${B}.`,(A,B)=>`Solve: ${A} + ${B}`,(A,B)=>`Increase ${A} by ${B}.`,(A,B)=>`Evaluate: ${A} + ${B}`]
    : [(A,B)=>`Subtract: ${A} − ${B} = ?`,(A,B)=>`What is ${A} − ${B}?`,(A,B)=>`Find the difference: ${A} − ${B}`,(A,B)=>`Solve: ${A} − ${B}`,(A,B)=>`How much more is ${A} than ${B}?`,(A,B)=>`Decrease ${A} by ${B}.`];
}
/* two operands -> an addition/subtraction fact with positive result, or null */
function asFact(op, A, B){
  if(op==='-'){ if(qVal(A.q)<qVal(B.q)){ const t=A; A=B; B=t; } if(qVal(A.q)===qVal(B.q)) return null; }
  const res = op==='+' ? qAdd(A.q,B.q) : qSub(A.q,B.q);
  if(res[0]<=0) return null;
  return { op, A, B, res };
}
function asQuestion(P, fam, f, prompt, key, extra){
  const meta = { k: f.op==='+'?'add':'sub', a:f.A.q, b:f.B.q, P:P.id };
  if(extra) Object.assign(meta, extra);
  return numericQ({ prompt, correct:f.res, tiers:asTiers(f.op,f.A,f.B,f.res), fam, topic:'addsub', key, meta });
}

/* ============================================================
   ADDITION & SUBTRACTION   (75–80 % of every round)
   ============================================================ */
function asLike(P){                         // same denominators
  const op = coin(.5) ? '+' : '-';
  const dMin = P.id==='easy' ? 3 : 4, dMax = P.id==='easy' ? 10 : 12;
  const d=rI(dMin,dMax);
  let A,B;
  if(P.id==='easy'){
    if(op==='+'){
      const toWhole = coin(.3); const n1=pn(d);
      const n2 = toWhole ? d-n1 : pn(d,1,Math.max(1,d-n1)); if(n2<1 || n1+n2>d) return null;
      A=mkOperand('proper',d,P); A.q=[n1,d]; A.s=pf(n1,d); B=mkOperand('proper',d,P); B.q=[n2,d]; B.s=pf(n2,d);
    } else { const n1=pn(d,2,d-1), n2=pn(d,1,n1-1); if(n1<=n2) return null;
      A={q:[n1,d],s:pf(n1,d),type:'proper',r:n1,w:0,d}; B={q:[n2,d],s:pf(n2,d),type:'proper',r:n2,w:0,d}; }
  } else {
    // medium+: sums may pass 1 (mixed answers) and a subtraction may start from an improper fraction
    A=mkOperand(op==='-' && coin(.35)?'improper':'proper',d,P); B=mkOperand('proper',d,P);
    if(op==='-' && coin(.35)){ const n2=pn(d), n1=n2+d; A={q:[n1,d],s:pf(n1,d),type:'improper',r:n1,w:0,d}; B={q:[n2,d],s:pf(n2,d),type:'proper',r:n2,w:0,d}; }
  }
  const f=asFact(op,A,B); if(!f) return null;
  const fam='as-like';
  const prompt=pickPhrase(fam+op,phrases(op))(f.A.s,f.B.s);
  return asQuestion(P,fam,f,prompt,`al-${op}-${f.A.s}-${f.B.s}`);
}
function asUnlike(P){                       // different denominators, proper fractions
  const op = coin(.5) ? '+' : '-';
  const mode = P.id==='medium' ? wpick([['related',.66],['any',.34]])
             : P.id==='hard'   ? wpick([['any',.7],['related',.3]])
             : wpick([['hidden',.6],['any',.4]]);
  const dp=pickDens(P,mode); if(!dp) return null;
  const A=mkOperand('proper',dp[0],P);
  let B;
  if(P.id!=='medium' && op==='+' && coin(.12)){          // a pair that lands exactly on a whole number
    const rest=QM(A.d-A.q[0],A.d), mult=rI(2,4), d2=rest[1]*mult;
    if(d2===A.d || d2>20 || rest[1]===1) return null;
    B={q:[rest[0]*mult,d2],s:pf(rest[0]*mult,d2),type:'proper',r:rest[0]*mult,w:0,d:d2};
  } else B=mkOperand('proper',dp[1],P);
  const f=asFact(op,A,B); if(!f) return null;
  if(P.id==='medium' && op==='+' && qVal(f.res)>1 && coin(.6)) return null;      // medium: mostly sums that stay under 1
  const fam='as-unlike';
  const prompt=pickPhrase(fam+op,phrases(op))(f.A.s,f.B.s);
  return asQuestion(P,fam,f,prompt,`au-${op}-${f.A.s}-${f.B.s}`);
}
function asMixed(P){                        // mixed numbers (and improper fractions) — hard & insane
  const op = coin(.5) ? '+' : '-';
  const sameDen = coin(.2);
  const dp = sameDen ? (()=>{ const d=rI(4,12); return [d,d]; })() : pickDens(P, P.id==='hard' ? wpick([['any',.75],['related',.25]]) : wpick([['hidden',.6],['any',.4]]));
  if(!dp) return null;
  const kind = wpick([['MM',.6],['MP',.25],['IP',.15]]);
  let A,B;
  if(kind==='MM'){ A=mkOperand('mixed',dp[0],P); B=mkOperand('mixed',dp[1],P); }
  else if(kind==='MP'){ A=mkOperand('mixed',dp[0],P); B=mkOperand('proper',dp[1],P); }
  else { A=mkOperand('improper',dp[0],P); B=mkOperand('proper',dp[1],P); }
  if(op==='-'){                              // control borrowing: hard ≈ 40 %, insane ≈ 65 %
    const wantBorrow = coin(P.id==='hard'?.4:.65);
    if(kind==='MM'){
      if(A.w<B.w) { const t=A; A=B; B=t; }
      const borrows = qVal([A.r,A.d]) < qVal([B.r,B.d]);
      if(A.w===B.w) return null;
      if(borrows!==wantBorrow && coin(.75)) return null;
    }
  }
  const f=asFact(op,A,B); if(!f) return null;
  const fam= kind==='IP' ? 'as-improper' : 'as-mixed';
  const prompt=pickPhrase(fam+op,phrases(op))(f.A.s,f.B.s);
  return asQuestion(P,fam,f,prompt,`am-${op}-${f.A.s}-${f.B.s}`);
}
function asChain(P){                         // three fractions, two operations — insane only
  const Ls=[12,18,20,24,30,36], L=pick(Ls);
  const divs=[]; for(let d=2;d<=L;d++) if(L%d===0 && d<=20) divs.push(d);
  const ds=[pick(divs),pick(divs),pick(divs)];
  if(new Set(ds).size<2) return null;
  const ops = pick([['+','-'],['+','-'],['-','+'],['+','+']]);
  const ts=ds.map(d=>mkOperand('proper',d,P));
  let run=ts[0].q;
  const terms=[[1,ts[0].q]];
  for(let i=1;i<3;i++){
    run = ops[i-1]==='+' ? qAdd(run,ts[i].q) : qSub(run,ts[i].q);
    if(run[0]<=0) return null;
    terms.push([ops[i-1]==='+'?1:-1, ts[i].q]);
  }
  if(run[1]>36 || qVal(run)>5) return null;
  const sym=o=>o==='+'?'+':'−';
  const text=`${ts[0].s} ${sym(ops[0])} ${ts[1].s} ${sym(ops[1])} ${ts[2].s}`;
  const prompt=pickPhrase('as-chain',[`Solve: ${text}`,`What is ${text}?`,`Evaluate: ${text}`]);
  const sumAll=qAdd(qAdd(ts[0].q,ts[1].q),ts[2].q), a_b=qSub(ts[0].q,ts[1].q);
  const tiers=[[sumAll, qVal(a_b)>0?qSub(a_b,ts[2].q):null, [run[0]+1,run[1]], [Math.max(1,run[0]-1),run[1]]].filter(x=>x&&x[0]>0),[[run[0],run[1]+1],[run[0]+2,run[1]]]];
  return numericQ({ prompt, correct:run, tiers, fam:'as-chain', topic:'addsub', key:`ac-${text}`, meta:{k:'chain', terms, P:P.id} });
}
function asMissing(P){                       // "fill the blank" addition/subtraction
  const fam='as-missing';
  if(P.id==='easy' || (P.id==='medium' && coin(.4))){
    const d=rI(P.id==='easy'?4:5, P.id==='easy'?9:12);
    if(coin(.5)){ const n1=pn(d,1,d-2), t=rI(n1+1,d-1); if(t<=n1) return null; const ans=t-n1;
      const prompt=pickPhrase(fam+'pn',[`Find the missing number: ${pf(n1,d)} + ?/${d} = ${pf(t,d)}`,`What numerator makes this true? ${pf(n1,d)} + ?/${d} = ${pf(t,d)}`]);
      return numericQ({ prompt, correct:qInt(ans), tiers:[[qInt(t+n1),qInt(ans+1),qInt(Math.max(1,ans-1)),qInt(t)],[qInt(ans+2),qInt(n1),qInt(d-ans)]], fam, topic:'addsub', key:`mpn-${n1}-${t}-${d}`, meta:{k:'miss',form:'plusNum',a:[n1,d],t:[t,d],P:P.id} }); }
    const t=rI(3,d-1), r=rI(1,t-1), ans=t-r;
    const prompt=pickPhrase(fam+'mn',[`Find the missing number: ${pf(t,d)} − ?/${d} = ${pf(r,d)}`,`What numerator makes this true? ${pf(t,d)} − ?/${d} = ${pf(r,d)}`]);
    return numericQ({ prompt, correct:qInt(ans), tiers:[[qInt(t+r),qInt(ans+1),qInt(Math.max(1,ans-1)),qInt(t)],[qInt(ans+2),qInt(r),qInt(d-ans)]], fam, topic:'addsub', key:`mmn-${t}-${r}-${d}`, meta:{k:'miss',form:'minusNum',t:[t,d],r:[r,d],P:P.id} });
  }
  // fraction answers
  const mode = P.id==='medium' ? 'related' : (P.id==='hard' ? 'any' : 'hidden');
  const dp=pickDens(P,mode); if(!dp) return null;
  const type = P.id==='medium' ? 'proper' : wpick([['proper',.5],['mixed',.5]]);
  const A=mkOperand(type,dp[0],P), B=mkOperand(type,dp[1],P);
  const t=qAdd(A.q,B.q); if(qVal(t)>(P.id==='medium'?3:9)) return null;
  const T=fmtQ(t), sA=A.s, sB=B.s;
  const form=pick(['plus','minusR','minusL']);
  if(form==='plus'){
    const prompt=pickPhrase(fam+'p',[`What fraction completes this? ${sA} + ? = ${T}`,`Find the missing value: ${sA} + ? = ${T}`]);
    return numericQ({ prompt, correct:B.q, tiers:[[qAdd(t,A.q),[t[0]-A.q[0],Math.max(1,Math.abs(t[1]-A.q[1])||t[1])],[B.q[0]+1,B.q[1]],[Math.max(1,B.q[0]-1),B.q[1]]],[[B.q[0],B.q[1]+1]]], fam, topic:'addsub', key:`mp-${sA}-${sB}`, meta:{k:'miss',form:'plus',a:A.q,t,P:P.id} });
  }
  if(form==='minusR'){
    const prompt=pickPhrase(fam+'mr',[`What fraction completes this? ${T} − ? = ${sA}`,`Find the missing value: ${T} − ? = ${sA}`]);
    return numericQ({ prompt, correct:B.q, tiers:[[qAdd(t,A.q),[B.q[0]+1,B.q[1]],[Math.max(1,B.q[0]-1),B.q[1]]],[[B.q[0],B.q[1]+1]]], fam, topic:'addsub', key:`mmr-${T}-${sA}`, meta:{k:'miss',form:'minusR',t,r:A.q,P:P.id} });
  }
  const prompt=pickPhrase(fam+'ml',[`What fraction completes this? ? − ${sB} = ${sA}`,`Find the missing value: ? − ${sB} = ${sA}`]);
  return numericQ({ prompt, correct:t, tiers:[[qSub(A.q,B.q)[0]>0?qSub(A.q,B.q):null,[A.q[0]+B.q[0],A.q[1]+B.q[1]],[t[0]+1,t[1]]].filter(Boolean),[[t[0],t[1]+1],[Math.max(1,t[0]-1),t[1]]]], fam, topic:'addsub', key:`mml-${sB}-${sA}`, meta:{k:'miss',form:'minusL',a:B.q,r:A.q,P:P.id} });
}
function asKinds(P){
  switch(P.id){
    case 'easy':   return [[asLike,.84],[asMissing,.16]];
    case 'medium': return [[asLike,.14],[asUnlike,.66],[asMissing,.14],[asMixedLikeMedium,.06]];
    case 'hard':   return [[asUnlike,.38],[asMixed,.42],[asMissing,.12],[asLike,.08]];
    default:       return [[asUnlike,.2],[asMixed,.44],[asChain,.2],[asMissing,.12],[asLike,.04]];
  }
}
/* medium: now and then a mixed number with the SAME denominator (no borrowing) */
function asMixedLikeMedium(P){
  const op = coin(.5) ? '+' : '-', d=rI(4,8);
  let A=mkOperand('mixed',d,{id:'hard'}), B=mkOperand('mixed',d,{id:'hard'});
  A.w=rI(1,3); B.w=rI(1,3);
  A.q=[A.w*d+A.r,d]; A.s=pm(A.w,A.r,d); B.q=[B.w*d+B.r,d]; B.s=pm(B.w,B.r,d);
  if(op==='-' && (A.w<B.w || A.r<B.r)){ const t=A; A=B; B=t; if(A.r<B.r) return null; }
  const f=asFact(op,A,B); if(!f) return null;
  const fam='as-mixedLike', prompt=pickPhrase(fam+op,phrases(op))(f.A.s,f.B.s);
  return asQuestion(P,fam,f,prompt,`aml-${op}-${f.A.s}-${f.B.s}`,{allowUnlike:false});
}

/* ============================================================
   OTHER BASIC SKILLS   (10–15 %)
   ============================================================ */
function tSimplify(P){
  const fam='simplify';
  const cfg={easy:{b:[2,6],k:[2,4]},medium:{b:[2,6],k:[2,4]},hard:{b:[2,9],k:[2,5]},insane:{b:[3,12],k:[2,4]}}[P.id];
  let a,b,k,t=0;
  do{ b=rI(cfg.b[0],cfg.b[1]); a=pn(b); k=rI(cfg.k[0],cfg.k[1]); t++; } while((gcd(a,b)!==1 || b*k>(P.id==='easy'?12:P.id==='medium'?24:48)) && t<60);
  if(gcd(a,b)!==1) return null;
  let n=a*k, d=b*k;
  const whole = P.id!=='easy' && coin(.12);
  if(whole){ d=rI(2,9); n=d*rI(2,6); }
  else if(P.id==='hard' || P.id==='insane'){ if(coin(P.id==='hard'?.25:.4)) n+=d*rI(1,2); }   // improper → mixed number
  const q=QM(n,d), imp=!whole && q[0]>q[1];
  const tiers=[[]];
  if(!whole) tiers[0].push([q[0]+1,q[1]],[Math.max(1,q[0]-1),q[1]],[q[0],q[1]+1],[q[0],Math.max(2,q[1]-1)],[q[0]+1,q[1]+1]);
  else tiers[0].push([q[0]+1,1],[Math.max(1,q[0]-1),1],[n,d+1]);
  const ph = whole ? [`Simplify ${pf(n,d)}.`,`What whole number is equal to ${pf(n,d)}?`]
                   : [`Simplify ${pf(n,d)} to lowest terms.`,`Write ${pf(n,d)} in simplest form.`,`Reduce ${pf(n,d)} to its simplest form.`,`Which fraction is ${pf(n,d)} in lowest terms?`];
  return numericQ({ prompt:pickPhrase(fam+(whole?'W':''),ph)+(imp?' Give a mixed number.':''), correct:q, tiers, fam, topic:'simplify', key:`simp-${n}-${d}`, meta:{k:'simp',a:[n,d],P:P.id} });
}
function tEquiv(P){
  const fam='equiv';
  const cfg={easy:{d:[2,6],k:[2,4]},medium:{d:[2,8],k:[2,5]},hard:{d:[3,10],k:[2,6]},insane:{d:[4,12],k:[2,6]}}[P.id];
  let n,d,t=0; do{ d=rI(cfg.d[0],cfg.d[1]); n=pn(d); t++; } while(gcd(n,d)!==1 && t<40);
  if(gcd(n,d)!==1) return null;
  const k0=rI(cfg.k[0],cfg.k[1]);
  if(coin(.4)){                                                  // missing numerator / denominator
    const wantNum=coin(.55);
    if(wantNum){ const ans=n*k0, d2=d*k0;
      return numericQ({ prompt:pickPhrase(fam+'a',[`Find the missing numerator: ${pf(n,d)} = ?/${d2}`,`What number makes this true? ${pf(n,d)} = ?/${d2}`]), correct:qInt(ans),
        tiers:[[qInt(ans+k0),qInt(Math.max(1,ans-k0)),qInt(n+k0),qInt(d2-d+n)],[qInt(ans+1),qInt(Math.max(1,ans-1)),qInt(ans+2),qInt(k0)]], fam:'equivMiss', topic:'equiv', key:`eqm-n-${n}-${d}-${k0}`, meta:{k:'equivNum',a:[n,d],d2,P:P.id} }); }
    const ans=d*k0, n2=n*k0;
    return numericQ({ prompt:pickPhrase(fam+'b',[`Find the missing denominator: ${pf(n,d)} = ${n2}/?`,`What number makes this true? ${pf(n,d)} = ${n2}/?`]), correct:qInt(ans),
      tiers:[[qInt(ans+k0),qInt(Math.max(1,ans-k0)),qInt(d+k0),qInt(n2+d-n)],[qInt(ans+1),qInt(Math.max(1,ans-1)),qInt(ans+2),qInt(k0)]], fam:'equivMiss', topic:'equiv', key:`eqm-d-${n}-${d}-${k0}`, meta:{k:'equivDen',a:[n,d],n2,P:P.id} });
  }
  const notMode = P.id!=='easy' && coin(.3), s=a=>`${a[0]}/${a[1]}`;
  const eqs=[]; for(let t2=0;t2<30 && eqs.length<(notMode?3:1);t2++){ const k=rI(cfg.k[0],cfg.k[1]); if(!eqs.some(x=>x[2]===k)) eqs.push([n*k,d*k,k]); }
  if(eqs.length<(notMode?3:1)) return null;
  const kk=eqs[0][2];
  const pool=[[n*kk+1,d*kk],[n*kk,d*kk+1],[n+kk,d+kk],[n*kk,d*(kk+1)],[n*(kk+1),d*kk],[n*kk-1,d*kk],[n*kk,Math.max(2,d*kk-1)],[n+1,d*kk]];
  const bad=pool.filter(w=>w[0]>=1&&w[1]>=2&&w[0]<w[1]&&w[0]*d!==w[1]*n);
  if(notMode){
    if(!bad.length) return null; const cor=pick(bad);
    return textQ({ prompt:pickPhrase(fam+'N',[`Which fraction is NOT equivalent to ${pf(n,d)}?`,`Three of these equal ${pf(n,d)}. Which one does not?`]), correct:s(cor), others:eqs.slice(0,3).map(s), fam:'equiv', topic:'equiv', key:`eqn-${n}-${d}-${s(cor)}`, meta:{k:'equivSet',base:[n,d],mode:'not',P:P.id} });
  }
  if(bad.length<3) return null;
  return textQ({ prompt:pickPhrase(fam,[`Which fraction is equivalent to ${pf(n,d)}?`,`Which fraction has the same value as ${pf(n,d)}?`,`Which of these equals ${pf(n,d)}?`]), correct:s(eqs[0]), others:shuffle(bad.slice()).slice(0,3).map(s), fam:'equiv', topic:'equiv', key:`eq-${n}-${d}-${kk}`, meta:{k:'equivSet',base:[n,d],mode:'is',P:P.id} });
}
function distinctFracs(count, genFn, minGap){
  const out=[], vals=[];
  for(let t=0;t<120 && out.length<count;t++){
    const f=genFn(), v=f[0]/f[1];
    if(v>=1 || vals.some(x=>Math.abs(x-v)<minGap) || out.some(x=>x[0]===f[0]&&x[1]===f[1])) continue;
    out.push(f); vals.push(v);
  }
  return out.length===count ? out : null;
}
function tCompare(P){
  const fam='compare', mode=coin(.5)?'max':'min';
  let gen, gap=.03;
  if(P.id==='easy'){ if(coin(.65)){ const d=rI(5,9); gen=()=>[rI(1,d-1),d]; } else { const n=rI(1,3); gen=()=>[n,rI(n+2,9)]; } }
  else if(P.id==='medium'){ gen=()=>{ const d=pick([2,3,4,5,6,8,10,12]); return [pn(d),d]; }; }
  else { gen=()=>{ const d=rI(3,P.id==='hard'?12:16); return [pn(d),d]; }; gap=P.id==='hard'?.025:.012; }
  const fr=distinctFracs(4,gen,gap); if(!fr) return null;
  const vals=fr.map(f=>f[0]/f[1]), best=mode==='max'?Math.max(...vals):Math.min(...vals), ci=vals.indexOf(best), s=f=>`${f[0]}/${f[1]}`;
  const ph = mode==='max' ? ['Which of these fractions is the greatest?','Which fraction is the largest?','Which is the biggest fraction?']
                          : ['Which of these fractions is the smallest?','Which fraction is the least?','Which is the smallest fraction?'];
  return textQ({ prompt:pickPhrase(fam+mode,ph), correct:s(fr[ci]), others:fr.filter((_,i)=>i!==ci).map(s), fam, topic:'compare', key:`cmp-${mode}-${fr.map(s).sort().join(',')}`, meta:{k:'extreme',mode,P:P.id} });
}
function basicKinds(P){ return [[tSimplify,.4],[tEquiv,.25],[tCompare,.35]]; }

/* ============================================================
   SHORT WORD PROBLEMS   (5–10 %)   — same maths as the profile, one or two short sentences
   ============================================================ */
const WP_PART_ADD = [
  (n,A,B)=>`${n} ate ${A} of a pizza at lunch and ${B} of the same pizza at dinner. How much of the pizza did ${n} eat?`,
  (n,A,B)=>`A tank was ${A} full. Then ${B} of the tank was filled. How full is the tank now?`,
  (n,A,B)=>`${n} painted ${A} of a wall on Monday and ${B} of it on Tuesday. How much of the wall is painted?`
];
const WP_PART_SUB = [
  (n,A,B)=>`A jug is ${A} full. ${n} drinks ${B} of the jug. How much of the jug is left?`,
  (n,A,B)=>`${n} had ${A} of a cake and gave ${B} of the cake to a friend. How much of the cake does ${n} still have?`,
  (n,A,B)=>`A tank is ${A} full. ${B} of the tank is used up. How much of the tank is left?`
];
const WP_AMT_ADD = [
  (n,A,B)=>`${n} bought ${A} kg of rice and ${B} kg of sugar. How many kilograms did ${n} buy in all?`,
  (n,A,B)=>`Two ribbons are ${A} m and ${B} m long. How long are they together?`,
  (n,A,B)=>`${n} walked ${A} km to school and ${B} km to the market. How far did ${n} walk?`
];
const WP_AMT_SUB = [
  (n,A,B)=>`A ribbon is ${A} m long. ${n} cuts off ${B} m. How long is the ribbon now?`,
  (n,A,B)=>`${n} had ${A} kg of flour and used ${B} kg. How many kilograms are left?`,
  (n,A,B)=>`A pitcher holds ${A} L of juice. ${n} pours out ${B} L. How much juice is left?`
];
function wordAS(P){
  const nm=pick(WP_NAMES), op=coin(.5)?'+':'-', part = (P.id==='easy'||P.id==='medium') ? coin(.6) : coin(.2);
  let A,B;
  if(P.id==='easy'){ const d=rI(4,10); A=mkOperand('proper',d,P); B=mkOperand('proper',d,P); }
  else if(P.id==='medium'){ const dp=pickDens(P, coin(.7)?'related':'any'); if(!dp) return null; A=mkOperand('proper',dp[0],P); B=mkOperand('proper',dp[1],P); }
  else if(P.id==='hard'){ const dp=pickDens(P,'any'); if(!dp) return null; const mixed=!part&&coin(.5); A=mkOperand(mixed?'mixed':'proper',dp[0],P); B=mkOperand(mixed?'mixed':'proper',dp[1],P); }
  else { const dp=pickDens(P,'hidden'); if(!dp) return null; const mixed=!part&&coin(.7); A=mkOperand(mixed?'mixed':'proper',dp[0],P); B=mkOperand(mixed?'mixed':'proper',dp[1],P); }
  const f=asFact(op,A,B); if(!f) return null;
  if(part && op==='+' && qVal(f.res)>1) return null;          // parts of one whole can't pass the whole
  const list = part ? (op==='+'?WP_PART_ADD:WP_PART_SUB) : (op==='+'?WP_AMT_ADD:WP_AMT_SUB);
  const fam='word-'+(op==='+'?'add':'sub');
  const prompt=pickPhrase(fam+(part?'P':'A'),list)(nm,f.A.s,f.B.s);
  return asQuestion(P,fam,f,prompt,`w-${op}-${f.A.s}-${f.B.s}-${prompt.length}`);
}
function wordRemain(P){                      // "what fraction is left?"
  const nm=pick(WP_NAMES), fam='word-remain';
  if(P.id==='hard' || P.id==='insane'){      // two parts used
    const dp=pickDens(P, P.id==='hard'?'related':'any'); if(!dp) return null;
    const A=mkOperand('proper',dp[0],P), B=mkOperand('proper',dp[1],P);
    const used=qAdd(A.q,B.q); if(qVal(used)>=.95) return null;
    const res=qSub([1,1],used);
    const prompt=pickPhrase(fam+'2',[`${nm} used ${A.s} of a ribbon for a gift and ${B.s} of it for a bow. What fraction of the ribbon is left?`,`${nm} ate ${A.s} of a cake and a friend ate ${B.s} of it. What fraction of the cake is left?`]);
    return numericQ({ prompt, correct:res, tiers:[[[used[0],used[1]],[res[0]+1,res[1]],[Math.max(1,res[0]-1),res[1]],qSub([1,1],A.q),qSub([1,1],B.q)],[[res[0],res[1]+1]]], fam, topic:'addsub', key:`wr2-${A.s}-${B.s}`, meta:{k:'chain',terms:[[1,[1,1]],[-1,A.q],[-1,B.q]],P:P.id} });
  }
  const d=P.id==='easy' ? rI(4,9) : rI(5,12), n=pn(d,1,d-1);
  const res=QM(d-n,d);
  const prompt=pickPhrase(fam,[`${nm} used ${pf(n,d)} of a roll of ribbon. What fraction of the roll is left?`,`${nm} ate ${pf(n,d)} of a ${pick(['pizza','cake','pie'])}. What fraction is left?`,`A bottle is ${pf(n,d)} empty. What fraction of the bottle is full?`]);
  return numericQ({ prompt, correct:res, tiers:[[[n,d],[d-n+1,d],[Math.max(1,d-n-1),d],[1,d]],[[d-n,d+1]]], fam, topic:'addsub', key:`wr-${n}-${d}-${prompt.length}`, meta:{k:'sub',a:[1,1],b:[n,d],P:P.id,allowUnlike:true} });
}
function wordKinds(P){ return [[wordAS,.7],[wordRemain,.3]]; }

/* ============================================================
   SELECTION + HISTORY
   ============================================================ */
function usedKey(gameId, diff){ return `${gameId}_${diff}`; }
function getUsedSet(gameId, diff){
  const k = usedKey(gameId,diff);
  if(!state.usedQuestions[k]) state.usedQuestions[k] = [];
  return state.usedQuestions[k];
}
function markUsed(gameId, diff, key){
  const arr = getUsedSet(gameId,diff);
  arr.push(key);
  if(arr.length > 300) arr.splice(0, arr.length-300);
  saveState();
}
function sigOf(q){ return q.options.slice().sort().join('|'); }
function nextCandidate(diff, attempt, fixedCat){
  const P = chooseProfile(diff);
  const cat = fixedCat && attempt<260 ? fixedCat : wpick([['as',P.cat[0]],['basic',P.cat[1]],['word',P.cat[2]]]);
  const kinds = cat==='as' ? asKinds(P) : cat==='basic' ? basicKinds(P) : wordKinds(P);
  let fn = wpick(kinds), cand=null;
  try{ cand = fn(P); }catch(e){ cand=null; }
  if(cand){ cand.cat=cat; cand.meta=cand.meta||{}; cand.meta.P=cand.meta.P||P.id; }
  return cand;
}
function generateUniqueQuestion(gameId, diff){
  const used = getUsedSet(gameId, diff);
  let q=null;
  const P0 = chooseProfile(diff), fixedCat = wpick([['as',P0.cat[0]],['basic',P0.cat[1]],['word',P0.cat[2]]]);   // the mix stays 78/14/8 even when a pool is tight
  for(let attempt=0; attempt<400; attempt++){
    const cand = nextCandidate(diff, attempt, fixedCat);
    if(!cand) continue;
    if(!verifyQ(cand)) continue;                                   // never show an invalid question
    if(attempt<300 && used.includes(cand.key)) continue;           // same exact question
    const run = diff==='easy'||diff==='storyT1' ? 5 : 4, lastN = QH.fam.slice(-run);
    if(attempt<250 && lastN.length===run && lastN.every(f=>f===cand.fam)) continue;     // no long runs of one kind
    if(attempt<250 && cand.cat!=='as' && QH.fam.slice(-2).includes(cand.fam)) continue; // spread the extras out
    if(attempt<200 && QH.ans.slice(-9).includes(cand.correct)) continue;                // same correct answer lately
    if(attempt<260 && QH.prm.slice(-14).includes(cand.prompt)) continue;                // same wording lately
    if(attempt<230 && QH.sig.slice(-40).includes(sigOf(cand))) continue;                // same answer set lately
    q=cand; break;
  }
  if(!q){                                                           // practically unreachable: guarantee a valid question
    for(let g=0; g<500 && !q; g++){ const c=asLike(PROFILES.easy); if(c){ c.cat='as'; if(verifyQ(c)) q=c; } }
    if(used.length>250) used.length=0;
  }
  QH.fam.push(q.fam); if(QH.fam.length>12) QH.fam.shift();
  QH.ans.push(q.correct); if(QH.ans.length>24) QH.ans.shift();
  QH.prm.push(q.prompt); if(QH.prm.length>30) QH.prm.shift();
  QH.sig.push(sigOf(q)); if(QH.sig.length>80) QH.sig.shift();
  notePos(q._idx);
  markUsed(gameId, diff, q.key);
  return q;
}

/* ============================================================
   ROUND / GAME ENGINE
   ============================================================ */
const ROUND_LENGTH = 10;
let round = { qIndex:0, score:0, expGained:0, coinsGained:0, hintUsed:false, lives:FISH_LIVES_START, snakeSize:1 };
let timerInterval = null, timerTimeout = null, timeLeft = 0, timeTotal = 0;
let timerEndAt = 0, timerActive = false;
let currentQuestion = null;
let mangoAnswered = false;
let fishAnswered = false;
let snakeAnswered = false;
let mangoRAF = null, fishRAF = null, snakeRAF = null;

function clearRoundTimer(){
  clearInterval(timerInterval); pClear(timerTimeout); timerActive = false;
  const tb = document.getElementById('timer-box'); if(tb) tb.className = 'timer-box';
}
function clearTimers(){
  clearRoundTimer();
  matchAITimers.forEach(t=>pClear(t));
  matchAITimers = [];
  if(matchSafetyTimer){ pClear(matchSafetyTimer); matchSafetyTimer = null; }
  document.querySelectorAll('.mango-obj').forEach(m=>m.remove());
  document.querySelectorAll('.fish-obj:not(.struggle)').forEach(m=>m.remove()); // the hooked fish stays to thrash until the next question renders
  document.querySelectorAll('.avocado-obj').forEach(m=>m.remove());
  if(mangoRAF){ cancelAnimationFrame(mangoRAF); mangoRAF = null; }
  if(fishRAF){ cancelAnimationFrame(fishRAF); fishRAF = null; }
  if(snakeRAF){ cancelAnimationFrame(snakeRAF); snakeRAF = null; }
}


/* ============================================================
   PAUSE SYSTEM + QUIT CONFIRMATION (opened by the HUD Quit button)
   pauseGame() freezes: the round timer + bar, pending question/AI timers,
   the Mango/Fishtions/S-Frac loops, every CSS animation on the game screen,
   and all gameplay input. resumeGame() continues exactly where it stopped.
   ============================================================ */
let gamePaused = false, pauseAt = 0, pausedLoops = null;
const pTimers = new Map(); let pTimerId = 1;
// setTimeout that can be frozen and resumed with its remaining time
function pTimeout(fn, ms){
  const id = pTimerId++, e = { left:ms, t0:0, h:null };
  e.arm = ()=>{ e.t0 = performance.now(); e.h = setTimeout(()=>{ pTimers.delete(id); fn(); }, e.left); };
  pTimers.set(id, e);
  if(!gamePaused) e.arm();
  return id;
}
function pClear(id){
  const e = pTimers.get(id); if(!e) return;
  clearTimeout(e.h); pTimers.delete(id);
}
function pauseGame(){
  if(gamePaused) return;
  gamePaused = true; pauseAt = performance.now();
  pTimers.forEach(e=>{ clearTimeout(e.h); e.left = Math.max(0, e.left - (pauseAt - e.t0)); });
  clearInterval(timerInterval);
  const fill = document.getElementById('timer-fill');
  if(fill){ const w = getComputedStyle(fill).width; fill.style.transition = 'none'; fill.style.width = w; }
  pausedLoops = { mango:!!mangoRAF, fish:!!fishRAF, snake:!!snakeRAF };
  if(mangoRAF){ cancelAnimationFrame(mangoRAF); mangoRAF = null; }
  if(fishRAF){ cancelAnimationFrame(fishRAF); fishRAF = null; }
  if(snakeRAF){ cancelAnimationFrame(snakeRAF); snakeRAF = null; }
  farmerMoveDir = fisherMoveDir = snakeMoveDir = snakeMoveY = 0;
  farmerDragActive = fisherDragActive = snakeDragActive = false;
  const scr = document.getElementById('screen-game');
  scr.classList.add('game-paused'); scr.inert = true;
}
function resumeGame(){
  if(!gamePaused) return;
  const away = performance.now() - pauseAt;
  gamePaused = false;
  const scr = document.getElementById('screen-game');
  scr.classList.remove('game-paused'); scr.inert = false;
  mangoFallStart += away; fishSwimStart += away; dnStart += away; timerEndAt += away;
  pTimers.forEach(e=>e.arm());
  if(timerActive){
    const fill = document.getElementById('timer-fill');
    if(fill){ const left = Math.max(0,(timerEndAt - performance.now())/1000); void fill.offsetWidth; fill.style.transition = `width ${left}s linear`; fill.style.width = '0%'; }
    startTimerReadout();
  }
  if(pausedLoops){
    if(pausedLoops.mango && selectedGame === 'mango'){ mangoLastTs = 0; mangoRAF = requestAnimationFrame(mangoTick); }
    if(pausedLoops.fish && selectedGame === 'fish'){ fishLastTs = 0; fishRAF = requestAnimationFrame(fishTick); }
    if(pausedLoops.snake && selectedGame === 'snake'){ snakeLastTs = 0; snakeRAF = requestAnimationFrame(snakeTick); }
  }
  pausedLoops = null;
}

let quitOpen = false, quitOpenedAt = 0, quitReturnFocus = null, quitJungleCache = null, quitCloseTimer = 0;
const QUIT_THEMES = {
  match:{ icon:'🎒', tag:'Fraction Match' },
  mango:{ icon:'🥭', tag:'Mango Falling' },
  fish: { icon:'🎣', tag:'Fishtions' },
  snake:{ icon:'🐍', tag:'S-Frac' }
};
function applyQuitTheme(){
  const modal = document.getElementById('quit-modal'), th = QUIT_THEMES[selectedGame] || QUIT_THEMES.mango;
  modal.setAttribute('data-theme', selectedGame || 'mango');
  document.getElementById('quit-icon').textContent = '🚪';
  document.getElementById('quit-emblem').textContent = th.icon;
  const done = Math.min(round && round.qIndex != null ? round.qIndex : 0, ROUND_LENGTH);
  document.getElementById('quit-game-tag').textContent = `${th.tag} · ${done} of ${ROUND_LENGTH} questions done · Score ${round ? round.score : 0}`;
  const decos = { match:['✏️','➗','✖️','📐'], mango:['🍃','🥭','🍃','🥭'], fish:['🫧','🐟','🫧','🐠'], snake:['🌿','🍃','🍓','🌿'] }[selectedGame] || ['🍃','🥭','🍃','🥭'];
  modal.querySelectorAll('.qd').forEach((el,i)=>{ el.textContent = decos[i]; });
  const banner = document.getElementById('quit-banner');
  let img = '';
  try{
    if(selectedGame === 'mango') img = 'var(--mango-scene-url)';
    else if(selectedGame === 'fish') img = 'var(--fish-scene-url)';
    else if(selectedGame === 'snake'){
      if(!quitJungleCache) quitJungleCache = paintSnakeJungle(440,110,Math.min(window.devicePixelRatio||1,2)).url;
      img = `url(${quitJungleCache})`;
    }
  }catch(err){ img = ''; }
  banner.style.setProperty('--quit-banner', img || 'none');
}
function openQuitDialog(){
  if(quitOpen) return;                         // never stack two dialogs
  quitOpen = true; quitOpenedAt = performance.now();
  clearTimeout(quitCloseTimer);
  pauseGame();
  applyQuitTheme();
  const modal = document.getElementById('quit-modal');
  quitReturnFocus = document.activeElement;
  modal.classList.remove('hidden','closing');
  void modal.offsetWidth; modal.classList.add('opening');
  document.getElementById('btn-quit-continue').focus({preventScroll:true});
}
function closeQuitDialog(after){
  if(!quitOpen) return;
  quitOpen = false;
  const modal = document.getElementById('quit-modal');
  modal.classList.remove('opening'); modal.classList.add('closing');
  quitCloseTimer = setTimeout(()=>{ modal.classList.add('hidden'); modal.classList.remove('closing'); if(after) after(); }, 220);
}
function quitContinue(){
  if(!quitOpen || performance.now() - quitOpenedAt < 300) return;   // ignore accidental instant presses
  resumeGame();
  closeQuitDialog(()=>{ if(quitReturnFocus && quitReturnFocus.focus){ try{ quitReturnFocus.focus({preventScroll:true}); }catch(e){} } });
}
function quitConfirm(){
  if(!quitOpen || performance.now() - quitOpenedAt < 300) return;
  // leave the paused state without resuming play, drop every frozen timer, then run the original quit
  gamePaused = false; pausedLoops = null;
  const scr = document.getElementById('screen-game'); scr.classList.remove('game-paused'); scr.inert = false;
  pTimers.forEach(e=>clearTimeout(e.h)); pTimers.clear();
  closeQuitDialog();
  performQuitGame();
}
document.getElementById('btn-quit-continue').addEventListener('click', quitContinue);
document.getElementById('btn-quit-confirm').addEventListener('click', quitConfirm);
document.getElementById('quit-modal').addEventListener('keydown', e=>{
  if(!quitOpen) return;
  if(e.key === 'Escape'){ e.preventDefault(); quitContinue(); return; }       // Esc = keep playing, never quit
  if(e.key === 'Tab'){                                                         // keep focus inside the dialog
    const a = document.getElementById('btn-quit-continue'), b = document.getElementById('btn-quit-confirm');
    const first = e.shiftKey ? b : a, last = e.shiftKey ? a : b;
    if(document.activeElement === last || !document.getElementById('quit-modal').contains(document.activeElement)){ e.preventDefault(); first.focus(); }
  }
  if((e.key === 'Enter' || e.key === ' ') && e.repeat) e.preventDefault();
});
// clicking the dimmed background does nothing (no accidental quit or resume)
document.getElementById('quit-modal').addEventListener('pointerdown', e=>{ if(e.target.id === 'quit-modal') e.preventDefault(); });

function startRound(){
  round = { qIndex:0, score:0, expGained:0, coinsGained:0, lives:FISH_LIVES_START, snakeSize:1 };
  document.getElementById('hud-game-name').textContent = GAME_NAMES[selectedGame];
  document.getElementById('hud-diff-name').textContent = selectedDifficulty.toUpperCase();
  document.getElementById('lives-row').classList.toggle('hidden', selectedGame !== 'fish');
  document.getElementById('snake-ending').classList.add('hidden');
  document.getElementById('match-leaderboard').classList.add('hidden');
  if(selectedGame === 'fish'){ renderLives(); startDayNight(); }
  if(selectedGame === 'snake') applySnakeSize();
  if(selectedGame === 'match') initMatchOpponents();
  buildProgressDots();
  show('screen-game');
  nextQuestion();
}

function renderLives(){
  const wrap = document.getElementById('lives-hearts');
  if(!wrap) return;
  let html = '';
  for(let i=0;i<FISH_LIVES_START;i++){
    html += `<span class="${i < round.lives ? '' : 'lost'}">♥</span>`;
  }
  wrap.innerHTML = html;
}

function buildProgressDots(){
  const wrap = document.getElementById('progress-dots');
  wrap.innerHTML = '';
  for(let i=0;i<ROUND_LENGTH;i++){
    const dot = document.createElement('span');
    dot.dataset.i = i;
    wrap.appendChild(dot);
  }
  updateProgressDots();
}
function updateProgressDots(){
  document.querySelectorAll('#progress-dots span').forEach((d,i)=>{
    d.classList.toggle('done', i < round.qIndex);
    d.classList.toggle('current', i === round.qIndex);
  });
}

// Renders a fraction string like "3/4" (or "2 3/4") in stacked scientific form for on-screen display.
// Uses the sciFrac() helper defined in the Knowledge section further down this file.
function formatFracDisplay(str){
  if(str === null || str === undefined) return '';
  return String(str).replace(/(\d+|\?)\/(\d+|\?)(?![\d])/g, (m, n, d) => sciFrac(n, d));
}

function nextQuestion(){
  clearTimers();
  if(round.qIndex >= ROUND_LENGTH){ finishRound(); return; }
  updateProgressDots();
  currentQuestion = generateUniqueQuestion(selectedGame, selectedDifficulty);
  document.getElementById('question-box').innerHTML = formatFracDisplay(currentQuestion.prompt);
  document.getElementById('btn-hint').disabled = false;
  document.getElementById('btn-hint').textContent = '💡 Hint · 15 🪙';

  timeTotal = DIFF_CONFIG[selectedDifficulty].time;
  timeLeft = timeTotal;
  startTimerBar();

  document.getElementById('match-answers').classList.add('hidden');
  document.getElementById('classroom-scene').classList.add('hidden');
  document.getElementById('screen-game').classList.remove('match-mode');
  document.getElementById('mango-field').classList.add('hidden');
  document.getElementById('screen-game').classList.remove('mango-mode');
  document.getElementById('fish-field').classList.add('hidden');
  document.getElementById('screen-game').classList.remove('fish-mode');
  document.getElementById('screen-game').classList.remove('snake-mode');
  document.getElementById('snake-field').classList.add('hidden');

  if(selectedGame === 'match'){
    document.getElementById('match-answers').classList.remove('hidden');
    document.getElementById('classroom-scene').classList.remove('hidden');
    document.getElementById('screen-game').classList.add('match-mode');
    renderMatchAnswers();
    setSeatStatus('you', null, 'Your turn!');
    document.getElementById('m-seat-you').classList.remove('right','wrong','answered');
    startAIAnswering();
  } else if(selectedGame === 'mango'){
    document.getElementById('mango-field').classList.remove('hidden');
    document.getElementById('screen-game').classList.add('mango-mode');
    renderMangoField();
  } else if(selectedGame === 'fish'){
    document.getElementById('fish-field').classList.remove('hidden');
    document.getElementById('screen-game').classList.add('fish-mode');
    renderFishField();
  } else {
    document.getElementById('snake-field').classList.remove('hidden');
    document.getElementById('screen-game').classList.add('snake-mode');
    renderSnakeField();
  }
}

function startTimerBar(){
  const fill = document.getElementById('timer-fill');
  fill.style.transition = 'none';
  fill.style.width = '100%';
  requestAnimationFrame(()=>{
    fill.style.transition = `width ${timeTotal}s linear`;
    fill.style.width = '0%';
  });
  timerEndAt = performance.now() + timeTotal*1000; timerActive = true;
  timerTimeout = pTimeout(()=> handleTimeout(), timeTotal*1000);
  // numeric readout + final-5-seconds warning, driven by timerEndAt (shifted on resume after a pause)
  const box = document.getElementById('timer-box'), txt = document.getElementById('timer-text');
  box.className = 'timer-box'; txt.textContent = Math.ceil(timeTotal);
  startTimerReadout();
}
function startTimerReadout(){
  clearInterval(timerInterval);
  const box = document.getElementById('timer-box'), txt = document.getElementById('timer-text');
  let lastShown = -1;
  timerInterval = setInterval(()=>{
    const left = Math.max(0, Math.ceil((timerEndAt - performance.now())/1000));
    if(left === lastShown) return;
    lastShown = left; txt.textContent = left;
    if(left <= 5 && left >= 1) box.className = 'timer-box warn w'+left; // classes only change once per second, so the pulse never restarts mid-second
    else if(left === 0) box.className = 'timer-box';
    if(left === 0) clearInterval(timerInterval);
  },150);
}

function handleTimeout(){
  if(selectedGame==='match'){
    revealMatchAnswer(null);
  } else if(selectedGame==='mango'){
    mangoAnswered = true;
    if(mangoRAF){ cancelAnimationFrame(mangoRAF); mangoRAF = null; }
    animateFarmer(false);
    onRoundQuestionEnd(false);
  } else if(selectedGame==='fish'){
    fishAnswered = true;
    if(fishRAF){ cancelAnimationFrame(fishRAF); fishRAF = null; }
    animateFisherman(false);
    onRoundQuestionEnd(false);
  } else {
    snakeAnswered = true;
    if(snakeRAF){ cancelAnimationFrame(snakeRAF); snakeRAF = null; }
    animateSnake(false);
    onRoundQuestionEnd(false);
  }
}

function onRoundQuestionEnd(correct){
  clearTimers();
  if(correct){
    round.score++;
    const exp = EXP_PER_CORRECT[selectedDifficulty];
    round.expGained += exp;
  }
  round.qIndex++;
  // Fishtions ends early if all 5 lives are lost, regardless of remaining questions.
  if(selectedGame === 'fish' && round.lives <= 0){
    pTimeout(finishRound, 900);
    return;
  }
  pTimeout(nextQuestion, 850);
}

/* ---- Fraction Match rendering ---- */
function renderMatchAnswers(){
  const wrap = document.getElementById('match-answers');
  wrap.innerHTML = '';
  currentQuestion.options.forEach(opt=>{
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.dataset.value = opt; // raw value kept for logic; display below is stacked "scientific form"
    btn.innerHTML = formatFracDisplay(opt);
    btn.addEventListener('click', ()=> revealMatchAnswer(opt, btn));
    wrap.appendChild(btn);
  });
}
function revealMatchAnswer(chosen, btnEl){
  if(matchPlayerAnswered) return; // already locked in — ignore extra clicks
  clearRoundTimer();
  const buttons = document.querySelectorAll('#match-answers .answer-btn');
  buttons.forEach(b=>{
    b.disabled = true;
    if(b.dataset.value === currentQuestion.correct) b.classList.add('correct');
    else if(b === btnEl) b.classList.add('wrong');
  });
  const correct = chosen === currentQuestion.correct;
  matchPlayerAnswered = true;
  matchPlayerCorrect = correct;
  setSeatStatus('you', correct ? 'right' : 'wrong', correct ? '✅ correct!' : '❌ missed it');
  const youScoreEl = document.getElementById('m-seat-score-you');
  if(youScoreEl) youScoreEl.textContent = round.score + (correct ? 1 : 0);
  if(!correct && chosen!==null) toast('Not quite — check the highlighted answer!');
  if(correct) toast('Correct! 🥭');
  // Don't force the round forward — classmates who are still "thinking" get
  // to finish naturally (see startAIAnswering); we only advance once every
  // seat, including yours, has an answer locked in.
  if(matchSafetyTimer){ pClear(matchSafetyTimer); matchSafetyTimer = null; }
  matchSafetyTimer = pTimeout(()=>{
    finalizeAIAnswers();
    checkMatchRoundComplete();
  }, 3000);
  checkMatchRoundComplete();
}

/* ============================================================
   MANGO FALLING — 2D CARTOON GAME-ART RENDERER
   Every visual (sky, sun, clouds, mountains, ground, tree trunk,
   farmer, basket, mangoes) is drawn as smooth, softly-shaded 2D
   cartoon art on offscreen canvases, then published as CSS custom
   properties / per-element backgrounds so the DOM/physics code
   underneath doesn't have to change.
   ============================================================ */
function makeCanvas(w,h){
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  if('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'high';
  return { c, ctx };
}
function roundRectPath(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}
// union of several overlapping ellipses — used for soft puffy clouds/leaf clumps
function blobCluster(ctx, parts){
  ctx.beginPath();
  parts.forEach(([x,y,rx,ry])=>{ ctx.moveTo(x+rx,y); ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2); });
  ctx.fill();
}
// smooth rolling ridge through a set of points, filled down to baseY
function drawHillLayer(ctx,W,pts,baseY,color){
  ctx.beginPath();
  ctx.moveTo(0,baseY);
  ctx.lineTo(pts[0][0],pts[0][1]);
  for(let i=0;i<pts.length-1;i++){
    const [x0,y0]=pts[i], [x1,y1]=pts[i+1];
    ctx.quadraticCurveTo(x0,y0,(x0+x1)/2,(y0+y1)/2);
  }
  ctx.lineTo(pts[pts.length-1][0], pts[pts.length-1][1]);
  ctx.lineTo(W,baseY);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}
function drawHillTree(ctx,x,y,scale){
  ctx.save(); ctx.translate(x,y); ctx.scale(scale,scale);
  ctx.fillStyle='#2F6432';
  ctx.beginPath(); ctx.ellipse(0,-9,9,11,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#3E7A3F';
  ctx.beginPath(); ctx.ellipse(-3,-5,6,7,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#6B4A2E';
  ctx.fillRect(-1.5,-3,3,9);
  ctx.restore();
}
function drawCloud(ctx,x,y,scale){
  ctx.save(); ctx.translate(x,y); ctx.scale(scale,scale);
  ctx.fillStyle='rgba(165,202,218,0.5)';
  blobCluster(ctx,[[0,11,30,17],[24,5,22,15],[-24,7,20,14],[10,-5,24,16],[-8,-3,18,13]]);
  ctx.fillStyle='#FFFFFF';
  blobCluster(ctx,[[0,8,30,17],[24,2,22,15],[-24,4,20,14],[10,-8,24,16],[-8,-6,18,13]]);
  ctx.restore();
}
function drawGrassTuft(ctx,x,y,h,color,scale){
  scale = scale || 1;
  ctx.strokeStyle=color; ctx.lineWidth=2.6*scale; ctx.lineCap='round';
  for(let i=-1;i<=1;i++){
    ctx.beginPath();
    ctx.moveTo(x+i*3*scale,y);
    ctx.quadraticCurveTo(x+i*7*scale,y-h*0.6,x+i*2.5*scale,y-h);
    ctx.stroke();
  }
}
function drawRock(ctx,x,y,s){
  ctx.save(); ctx.translate(x,y);
  ctx.fillStyle='#9BA6A2';
  ctx.beginPath(); ctx.ellipse(0,0,15*s,10*s,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#828E8A';
  ctx.beginPath(); ctx.ellipse(4*s,3.5*s,9*s,5.5*s,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.45)';
  ctx.beginPath(); ctx.ellipse(-4*s,-3.5*s,4.5*s,2.4*s,0,0,Math.PI*2); ctx.fill();
  ctx.restore();
}
function drawFlower(ctx,x,y,petal,scale){
  scale = scale || 1;
  ctx.save(); ctx.translate(x,y); ctx.scale(scale,scale);
  ctx.strokeStyle='#3d6b2c'; ctx.lineWidth=2; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(2,-6,0,-11); ctx.stroke();
  ctx.fillStyle=petal;
  for(let a=0;a<5;a++){
    const ang=a*(Math.PI*2/5);
    ctx.beginPath();
    ctx.ellipse(Math.cos(ang)*4.4,-11+Math.sin(ang)*4.4,3.6,2.3,ang,0,Math.PI*2);
    ctx.fill();
  }
  ctx.fillStyle='#FFD54A';
  ctx.beginPath(); ctx.arc(0,-11,2.4,0,Math.PI*2); ctx.fill();
  ctx.restore();
}
function drawFallenLeaf(ctx,x,y,color,rot,scale){
  scale = scale || 1;
  ctx.save(); ctx.translate(x,y); ctx.rotate(rot); ctx.scale(scale,scale);
  ctx.fillStyle=color;
  ctx.beginPath();
  ctx.moveTo(0,-6); ctx.quadraticCurveTo(6.5,0,0,6.5); ctx.quadraticCurveTo(-6.5,0,0,-6);
  ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,0.18)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(0,-5); ctx.lineTo(0,5.5); ctx.stroke();
  ctx.restore();
}
function drawBranch(ctx,x,y,dx,dy,scale){
  scale = scale || 1;
  ctx.strokeStyle='#5A3E22'; ctx.lineWidth=11*scale; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(x,y); ctx.quadraticCurveTo(x+dx*0.5,y+dy*0.5-12*scale,x+dx,y+dy); ctx.stroke();
  ctx.strokeStyle='#8A6339'; ctx.lineWidth=4*scale; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(x,y-2*scale); ctx.quadraticCurveTo(x+dx*0.5,y+dy*0.5-14*scale,x+dx,y+dy-2*scale); ctx.stroke();
}
function drawLeafCluster(ctx,x,y,r){
  const shades=['#2E8A3C','#3FA24B','#4CB358'];
  for(let i=0;i<4;i++){
    ctx.fillStyle= shades[i%shades.length];
    const ox=(i-1.5)*r*0.38, oy=Math.sin(i*1.4)*r*0.22;
    ctx.beginPath();
    ctx.ellipse(x+ox,y+oy, r*0.56, r*0.4, i*0.55, 0, Math.PI*2);
    ctx.fill();
  }
}

/* ---- background scene: sky, sun, clouds, hills, ground, tree trunk ----
   Rewritten to be aspect-ratio-independent: every position is a fraction
   of the *actual* canvas width/height (so it always reaches every edge,
   full-bleed, on any screen shape), while sizes use a height-based unit
   `u` so hills/trees/sun keep sensible proportions instead of ballooning
   on ultra-wide screens or shrinking on tall ones. */
function drawMangoScene(ctx,targetW,targetH){
  ctx.clearRect(0,0,targetW,targetH);
  const W = targetW, H = targetH;
  // baseline unit — capped to the *more restrictive* of width/height so
  // trunk width, hill height etc. never balloon out of proportion on a
  // very tall/narrow (portrait) screen the way a pure height-based unit would.
  const u = Math.min(W,H)/400;
  const horizonY = H*0.60;

  // sky
  const sky = ctx.createLinearGradient(0,0,0,horizonY);
  sky.addColorStop(0,'#4EB6EA'); sky.addColorStop(0.55,'#8DD7F2'); sky.addColorStop(1,'#DCF3F1');
  ctx.fillStyle = sky; ctx.fillRect(0,0,W,horizonY+8*u);

  // soft haze band along the horizon for a touch of atmospheric depth
  const haze = ctx.createLinearGradient(0,horizonY-40*u,0,horizonY+10*u);
  haze.addColorStop(0,'rgba(255,255,255,0)'); haze.addColorStop(1,'rgba(255,255,255,0.55)');
  ctx.fillStyle = haze; ctx.fillRect(0,horizonY-40*u,W,50*u);

  // sun with soft glow
  const sunX = W*0.15, sunY = H*0.16;
  ctx.save();
  ctx.shadowColor='rgba(255,199,61,0.65)'; ctx.shadowBlur=38*u;
  const sunGrad = ctx.createRadialGradient(sunX,sunY,2,sunX,sunY,30*u);
  sunGrad.addColorStop(0,'#FFF7DC'); sunGrad.addColorStop(0.55,'#FFDD6C'); sunGrad.addColorStop(1,'#FFC53D');
  ctx.fillStyle = sunGrad;
  ctx.beginPath(); ctx.arc(sunX,sunY,26*u,0,Math.PI*2); ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.globalAlpha=0.35; ctx.strokeStyle='#FFE9A8'; ctx.lineWidth=3*u;
  ctx.beginPath(); ctx.arc(sunX,sunY,36*u,0,Math.PI*2); ctx.stroke();
  ctx.restore();

  // clouds — spread proportionally across the full width so wide screens
  // never look empty on the sides
  drawCloud(ctx, W*0.30, H*0.15, 0.9*u);
  drawCloud(ctx, W*0.58, H*0.09, 0.72*u);
  drawCloud(ctx, W*0.82, H*0.22, 0.55*u);
  drawCloud(ctx, W*0.06, H*0.30, 0.5*u);

  // a couple of tiny birds for life, drawn once (static — costs nothing at runtime)
  ctx.strokeStyle='rgba(60,60,60,0.55)'; ctx.lineWidth=1.6*u; ctx.lineCap='round';
  [[W*0.40,H*0.10],[W*0.44,H*0.13],[W*0.68,H*0.28]].forEach(([bx,by])=>{
    ctx.beginPath();
    ctx.moveTo(bx-6*u,by); ctx.quadraticCurveTo(bx-2*u,by-5*u,bx,by);
    ctx.quadraticCurveTo(bx+2*u,by-5*u,bx+6*u,by);
    ctx.stroke();
  });

  // rolling hills — procedurally spread across the full width (far, then near)
  // so the silhouette always spans edge-to-edge regardless of aspect ratio
  const farPts = [];
  const farN = Math.max(6, Math.round(W/90));
  for(let i=0;i<=farN;i++){
    const x = (i/farN)*W;
    const y = horizonY - (34 + Math.sin(i*1.7)*16 + Math.cos(i*0.6)*8) * u;
    farPts.push([x,y]);
  }
  drawHillLayer(ctx,W,farPts,horizonY+H*0.14,'#AFCBC7');
  for(let i=1;i<farPts.length-1;i+=2) drawHillTree(ctx,farPts[i][0],farPts[i][1]+8*u,0.8*u);

  const nearPts = [];
  const nearN = Math.max(6, Math.round(W/80));
  for(let i=0;i<=nearN;i++){
    const x = (i/nearN)*W;
    const y = horizonY - (2 + Math.abs(Math.sin(i*1.3+1))*40 + Math.cos(i*0.8)*10) * u;
    nearPts.push([x,y]);
  }
  drawHillLayer(ctx,W,nearPts,horizonY+H*0.14,'#7FA860');
  for(let i=0;i<nearPts.length;i+=2) drawHillTree(ctx,nearPts[i][0],nearPts[i][1]+4*u,1.0*u);

  // ground
  const ground = ctx.createLinearGradient(0,horizonY,0,H);
  ground.addColorStop(0,'#8FCB6C'); ground.addColorStop(0.35,'#6FB454'); ground.addColorStop(1,'#4E9640');
  ctx.fillStyle = ground; ctx.fillRect(0,horizonY,W,H-horizonY);
  // dirt path hinting depth near the base of the scene
  ctx.save();
  ctx.globalAlpha=0.5; ctx.fillStyle='#7A5A34';
  ctx.beginPath();
  ctx.moveTo(0,H-14*u); ctx.quadraticCurveTo(W*0.3,H-40*u,W*0.55,H-18*u); ctx.quadraticCurveTo(W*0.8,H,W,H-30*u);
  ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.closePath(); ctx.fill();
  ctx.restore();

  // grass tufts scattered across the full width of the ground
  for(let x=10*u; x<W-8*u; x+=22*u){
    const span = Math.max(20*u, H-horizonY-30*u);
    const gy = horizonY + 18*u + ((x*13)%span);
    const h = 9*u + (x*7 % (10*u));
    drawGrassTuft(ctx, x + (x%(5*u)), gy, h, (Math.round(x/u)%44<22) ? '#8FCB6C' : '#4C8836', u);
  }
  // rocks, flowers, fallen leaves scattered across the ground (fractional
  // x positions so they spread across whatever width the screen has)
  [0.05,0.24,0.50,0.70,0.90].forEach((fx,i)=> drawRock(ctx, fx*W, horizonY + (58+i*14)*u, u));
  [0.03,0.14,0.20,0.36,0.47,0.60,0.78,0.88].forEach((fx,i)=>
    drawFlower(ctx, fx*W, horizonY + (42+ (i*9)%40)*u, ['#FFE24A','#FFFFFF','#F281B0'][i%3], u));
  [0.58,0.63,0.67,0.72,0.76,0.80,0.84,0.92,0.96].forEach((fx,i)=>
    drawFallenLeaf(ctx, fx*W, horizonY + (58+(i*11)%40)*u, (i%2===0)?'#C9A24A':'#B5651D', (i*37)%6, u));

  // ---- mango tree trunk: anchored near the right edge, height scaled to
  //      the viewport so it always reaches from the ground up off-canvas ----
  const bx = W*0.90, baseY = H*0.78;
  ctx.save();
  ctx.fillStyle='rgba(0,0,0,0.16)';
  ctx.beginPath(); ctx.ellipse(bx+8*u, baseY+6*u, 48*u,11*u,0,0,Math.PI*2); ctx.fill();

  const barkGrad = ctx.createLinearGradient(bx-40*u,0,bx+40*u,0);
  barkGrad.addColorStop(0,'#8A6339'); barkGrad.addColorStop(0.5,'#6B4A2E'); barkGrad.addColorStop(1,'#4E3620');
  ctx.fillStyle = barkGrad;
  ctx.beginPath();
  ctx.moveTo(bx-34*u, baseY+10*u);
  ctx.bezierCurveTo(bx-42*u,baseY-90*u, bx-26*u,baseY-190*u, bx-20*u,baseY-340*u);
  ctx.lineTo(bx+24*u,baseY-340*u);
  ctx.bezierCurveTo(bx+30*u,baseY-190*u, bx+40*u,baseY-90*u, bx+34*u,baseY+10*u);
  ctx.closePath();
  ctx.fill();

  // bark texture
  ctx.strokeStyle='rgba(0,0,0,0.16)'; ctx.lineWidth=2*u; ctx.lineCap='round';
  for(let i=0;i<7;i++){
    const x = bx-18*u+i*8*u + (i%2===0?4*u:0);
    ctx.beginPath();
    ctx.moveTo(x, baseY-6*u-i*8*u);
    ctx.quadraticCurveTo(x+4*u, baseY-100*u-i*10*u, x-2*u, baseY-200*u-i*6*u);
    ctx.stroke();
  }
  ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.lineWidth=1.5*u;
  for(let i=0;i<5;i++){
    const x = bx-10*u+i*11*u;
    ctx.beginPath(); ctx.moveTo(x, baseY-20*u-i*10*u); ctx.lineTo(x-2*u, baseY-160*u-i*8*u); ctx.stroke();
  }

  // branches reaching toward the gameplay area, with leaf clusters at their ends
  drawBranch(ctx, bx-16*u, baseY-256*u, -78*u, -26*u, u);
  drawBranch(ctx, bx-4*u,  baseY-288*u, -54*u, -36*u, u);
  drawBranch(ctx, bx+22*u, baseY-242*u, 44*u, -20*u, u);
  const leafSpots = [
    [bx-94*u,baseY-284*u],[bx-58*u,baseY-310*u],[bx-38*u,baseY-268*u],[bx+50*u,baseY-258*u],
    [bx+18*u,baseY-314*u],[bx-8*u,baseY-328*u],[bx+40*u,baseY-292*u],[bx-2*u,baseY-346*u]
  ];
  leafSpots.forEach(([lx,ly],i)=> drawLeafCluster(ctx,lx,ly, (22+(i%3)*4)*u));
  ctx.restore();
}

/* ---- farmer + basket sprite ---- */
function drawFarmerSprite(ctx,targetW,targetH){
  ctx.clearRect(0,0,targetW,targetH);
  ctx.save();
  // Drawn in a fixed 88x128 logical space, then scaled uniformly to the
  // farmer element's actual rendered size — so a bigger farmer on a bigger
  // screen is just crisper, never stretched out of proportion.
  ctx.scale(targetW/88, targetH/128);
  const W = 88, H = 128;
  const cx = W/2;

  // legs
  ctx.fillStyle='#5C4023';
  roundRectPath(ctx,cx-15,92,12,32,4); ctx.fill();
  roundRectPath(ctx,cx+3,92,12,32,4); ctx.fill();
  // boots
  ctx.fillStyle='#2E2115';
  roundRectPath(ctx,cx-17,116,16,12,4); ctx.fill();
  roundRectPath(ctx,cx+1,116,16,12,4); ctx.fill();

  // torso (shirt)
  const shirtGrad = ctx.createLinearGradient(cx-20,0,cx+20,0);
  shirtGrad.addColorStop(0,'#5FA669'); shirtGrad.addColorStop(1,'#3F7A48');
  ctx.fillStyle = shirtGrad;
  roundRectPath(ctx,cx-20,50,40,44,10); ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,0.12)'; ctx.lineWidth=1.4;
  ctx.beginPath(); ctx.moveTo(cx,54); ctx.lineTo(cx,86); ctx.stroke();

  // arms (hands are drawn later, on top of the basket rim)
  ctx.fillStyle='#5FA669';
  roundRectPath(ctx,cx-30,54,12,30,6); ctx.fill();
  roundRectPath(ctx,cx+18,54,12,30,6); ctx.fill();

  // basket, held out in front of the torso — lighter/warmer tone so it
  // reads as a separate object rather than blending into the trousers
  ctx.save();
  ctx.fillStyle='#C9975A';
  roundRectPath(ctx,cx-27,78,54,24,8); ctx.fill();
  ctx.strokeStyle='rgba(90,60,20,0.4)'; ctx.lineWidth=1.5;
  for(let i=-21;i<=21;i+=8){ ctx.beginPath(); ctx.moveTo(cx+i,81); ctx.lineTo(cx+i,99); ctx.stroke(); }
  ctx.strokeStyle='rgba(90,60,20,0.3)';
  ctx.beginPath(); ctx.moveTo(cx-27,90); ctx.lineTo(cx+27,90); ctx.stroke();
  // a couple of mangoes peeking over the rim, for flavor
  ctx.fillStyle='#F0973A';
  ctx.beginPath(); ctx.ellipse(cx-9,77,7,6,0.3,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx+8,75,7,6,-0.2,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#3FA24B';
  ctx.beginPath(); ctx.ellipse(cx-6,71,2.4,4,0.4,0,Math.PI*2); ctx.fill();
  // rim
  ctx.strokeStyle='#7A5230'; ctx.lineWidth=3;
  ctx.beginPath(); ctx.ellipse(cx,79,27,5,0,0,Math.PI*2); ctx.stroke();
  ctx.restore();

  // hands, resting on the basket rim
  ctx.fillStyle='#F0C29B';
  ctx.beginPath(); ctx.arc(cx-24,84,7,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx+24,84,7,0,Math.PI*2); ctx.fill();

  // neck
  ctx.fillStyle='#E8B78E';
  roundRectPath(ctx,cx-6,40,12,12,3); ctx.fill();

  // head
  ctx.fillStyle='#F0C29B';
  ctx.beginPath(); ctx.arc(cx,26,19,0,Math.PI*2); ctx.fill();
  ctx.save(); ctx.globalAlpha=0.35; ctx.fillStyle='#E68272';
  ctx.beginPath(); ctx.arc(cx-10,30,3.6,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx+10,30,3.6,0,Math.PI*2); ctx.fill();
  ctx.restore();
  // eyes
  ctx.fillStyle='#2A1E12';
  ctx.beginPath(); ctx.arc(cx-6.5,24,2.3,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx+6.5,24,2.3,0,Math.PI*2); ctx.fill();
  // eyebrows
  ctx.strokeStyle='#4A3018'; ctx.lineWidth=2; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(cx-10,19); ctx.lineTo(cx-3,18); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx+3,18); ctx.lineTo(cx+10,19); ctx.stroke();
  // nose
  ctx.strokeStyle='#D8A876'; ctx.lineWidth=2; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(cx,25); ctx.quadraticCurveTo(cx+3,30,cx,32); ctx.stroke();
  // smiling mouth
  ctx.strokeStyle='#8B4A3A'; ctx.lineWidth=2; ctx.lineCap='round';
  ctx.beginPath(); ctx.arc(cx,31,5,0.15*Math.PI,0.85*Math.PI); ctx.stroke();

  // straw farmer hat
  ctx.fillStyle='#D8B36A';
  ctx.beginPath(); ctx.ellipse(cx,10,25,7.5,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#C9A24A';
  ctx.beginPath(); ctx.ellipse(cx,4,14,10,0,Math.PI,0); ctx.fill();
  ctx.fillStyle='#A6802E';
  ctx.beginPath(); ctx.ellipse(cx,9,14,2.6,0,0,Math.PI*2); ctx.fill();
  ctx.restore(); // matches the uniform-scale save() at the top of this function
}

/* ---- mango sprite: a scalable, recognizable mango silhouette that keeps
   its proportions no matter the size it's drawn at (see computeMangoLayout).
   Shape is deliberately asymmetric (wide "cheek" on one side, narrower on
   the other, tapering to a beak near the stem and a rounded point at the
   base) so it reads as a real mango rather than a ball/egg. ---- */
function drawMangoSprite(ctx,W,H){
  ctx.clearRect(0,0,W,H);
  const cx = W*0.50, cy = H*0.58, rx = W*0.40, ry = H*0.38;
  const topX = cx - rx*0.30, topY = cy - ry*1.08; // beak point, near the stem

  const outline = ()=>{
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    // right side: bulges out to a wide "cheek", then rounds toward the base
    ctx.bezierCurveTo(cx+rx*0.28, cy-ry*1.04, cx+rx*1.10, cy-ry*0.34, cx+rx*0.94, cy+ry*0.30);
    ctx.bezierCurveTo(cx+rx*0.82, cy+ry*0.80, cx+rx*0.32, cy+ry*1.16, cx-rx*0.04, cy+ry*1.08);
    // rounded (not pointed) base, curving back up the left side
    ctx.bezierCurveTo(cx-rx*0.36, cy+ry*1.01, cx-rx*0.64, cy+ry*0.68, cx-rx*0.74, cy+ry*0.18);
    // left side: narrower, slightly concave, back up to the beak
    ctx.bezierCurveTo(cx-rx*0.86, cy-ry*0.32, cx-rx*0.44, cy-ry*0.80, topX, topY);
    ctx.closePath();
  };

  const grad = ctx.createLinearGradient(cx-rx,cy-ry,cx+rx*0.8,cy+ry);
  grad.addColorStop(0,   '#D7E85A'); // green shoulder near the stem
  grad.addColorStop(0.32,'#F9D34A');
  grad.addColorStop(0.62,'#F5A93A');
  grad.addColorStop(1,   '#D8472E'); // red-orange cheek
  ctx.fillStyle = grad; outline(); ctx.fill();

  ctx.save(); outline(); ctx.clip(); // keep every extra detail confined to the fruit's silhouette

  // red "cheek" blush, on the wide/bulging side — a real mango's sun-facing side
  ctx.save(); ctx.globalAlpha=0.55; ctx.fillStyle='#C6382A';
  ctx.beginPath(); ctx.ellipse(cx+rx*0.42, cy+ry*0.22, rx*0.46, ry*0.5, 0.55, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  // soft light highlight on the opposite (shaded/green) side
  ctx.save(); ctx.globalAlpha=0.5; ctx.fillStyle='#FFF6D6';
  ctx.beginPath(); ctx.ellipse(cx-rx*0.34, cy-ry*0.42, rx*0.24, ry*0.34, -0.3, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  // faint vertical seam, slightly off-center, like a real mango's suture line
  ctx.save(); ctx.globalAlpha=0.16; ctx.strokeStyle='#7A2E14'; ctx.lineWidth=Math.max(1,W*0.012);
  ctx.beginPath();
  ctx.moveTo(cx-rx*0.06, cy-ry*0.9);
  ctx.quadraticCurveTo(cx+rx*0.02, cy+ry*0.1, cx-rx*0.02, cy+ry*0.95);
  ctx.stroke();
  ctx.restore();

  // tiny skin speckles (lenticels) — deterministic pseudo-random scatter so
  // every mango of a given size looks the same, not re-randomized per frame
  ctx.save(); ctx.fillStyle='rgba(90,45,20,0.28)';
  let seed = Math.round(W*7+H*13);
  const rnd = ()=>{ seed = (seed*9301+49297) % 233280; return seed/233280; };
  for(let i=0;i<16;i++){
    const px = cx + (rnd()-0.5)*rx*1.6;
    const py = cy + (rnd()-0.5)*ry*1.8;
    ctx.beginPath(); ctx.arc(px,py, Math.max(0.6,W*0.006),0,Math.PI*2); ctx.fill();
  }
  ctx.restore();

  ctx.restore(); // release the outline() clip

  ctx.lineWidth = Math.max(1.4, W*0.016);
  ctx.strokeStyle='rgba(120,50,10,0.5)';
  outline(); ctx.stroke();

  // stem
  ctx.fillStyle='#6B4423';
  ctx.beginPath();
  ctx.moveTo(topX-2, topY+3); ctx.lineTo(topX+3, topY+3);
  ctx.lineTo(topX+2, topY-H*0.08); ctx.lineTo(topX-1, topY-H*0.08);
  ctx.closePath(); ctx.fill();

  // leaf
  ctx.fillStyle='#3FA24B';
  ctx.beginPath();
  ctx.moveTo(topX+2, topY-H*0.05);
  ctx.quadraticCurveTo(topX+W*0.22, topY-H*0.13, topX+W*0.27, topY-H*0.01);
  ctx.quadraticCurveTo(topX+W*0.14, topY+H*0.02, topX+2, topY-H*0.05);
  ctx.fill();
  ctx.strokeStyle='#2E7A38'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(topX+3,topY-H*0.045); ctx.lineTo(topX+W*0.22,topY-H*0.05); ctx.stroke();
}
window.__drawMangoSprite = drawMangoSprite; // shared with the hub-world painter

/* ---- dynamic per-word mango sizing ----
   The mango's on-screen box is derived from the rendered size of the word
   that has to sit inside it, then a fresh silhouette is drawn at exactly
   that box size (width & height computed together, in a fixed ratio) so
   the shape scales instead of stretching like a rectangle. ---- */
const MANGO_ASPECT = 1.14;   // mango height = mango width * this ratio, at any size
const MANGO_MIN_W = 64;
const MANGO_MAX_W_ABS = 220;
const MANGO_SAFE_W = 0.58;   // fraction of mango width treated as safe for text
const MANGO_SAFE_H = 0.40;   // fraction of mango height treated as safe for text
const MANGO_FONT_BASE = 16;
const MANGO_FONT_MIN = 10;
const MANGO_PAD = 8;

let _mangoMeasureEl = null;
function mangoMeasureEl(){
  if(_mangoMeasureEl) return _mangoMeasureEl;
  const el = document.createElement('div');
  el.className = 'fruit-label mango-measure';
  Object.assign(el.style, { position:'fixed', left:'-9999px', top:'-9999px', visibility:'hidden', pointerEvents:'none' });
  document.body.appendChild(el);
  _mangoMeasureEl = el;
  return el;
}
function measureLabel(html, fontSize, maxWidth){
  const el = mangoMeasureEl();
  el.style.fontSize = fontSize + 'px';
  if(maxWidth){ el.style.whiteSpace='normal'; el.style.maxWidth = maxWidth+'px'; }
  else { el.style.whiteSpace='nowrap'; el.style.maxWidth='none'; }
  el.innerHTML = html;
  const r = el.getBoundingClientRect();
  return { width:r.width, height:r.height };
}
// Returns {mangoW, mangoH, fontSize, wrapMaxWidth} sized so `html` fits
// comfortably inside the mango without touching its edges. Growing the
// mango is tried first; the font is only shrunk if it would otherwise
// need to become excessively large for the space available. A single
// word that still can't fit even at the smallest font (CSS is not
// allowed to fracture it mid-letter — see .fruit-label) grows the mango
// past the ordinary cap as a last resort, since the word must never
// overflow, clip, or break apart.
function computeMangoLayout(html, availMaxW){
  const hardMaxW = Math.max(MANGO_MIN_W, Math.min(MANGO_MAX_W_ABS, availMaxW));
  const single = measureLabel(html, MANGO_FONT_BASE, null);
  const neededWSingle = single.width/MANGO_SAFE_W + MANGO_PAD;
  if(neededWSingle <= hardMaxW){
    const mangoW = Math.max(MANGO_MIN_W, neededWSingle);
    const mangoH = Math.max(mangoW*MANGO_ASPECT, single.height/MANGO_SAFE_H + MANGO_PAD);
    return { mangoW, mangoH: Math.min(mangoH, mangoW*1.9), fontSize:MANGO_FONT_BASE, wrapMaxWidth:0 };
  }
  for(let fs = MANGO_FONT_BASE; fs >= MANGO_FONT_MIN; fs--){
    const innerW = hardMaxW*MANGO_SAFE_W;
    const wrapped = measureLabel(html, fs, innerW);
    // CSS never fractures a single word mid-letter (see word-break:normal), so
    // if an unbreakable word is still wider than innerW at this font size, grow
    // the mango to match its real rendered width instead of letting it clip.
    const contentW = Math.max(wrapped.width, innerW);
    const mangoW = Math.min(MANGO_MAX_W_ABS, Math.max(hardMaxW, contentW/MANGO_SAFE_W + MANGO_PAD));
    const neededH = wrapped.height/MANGO_SAFE_H + MANGO_PAD;
    const mangoH = Math.max(mangoW*MANGO_ASPECT, neededH);
    const capH = mangoW*1.55; // keep proportions mango-like rather than a tall banana
    const fits = mangoH <= capH && wrapped.width <= innerW + 0.5;
    if(fits){
      return { mangoW, mangoH: Math.min(mangoH, capH), fontSize:fs, wrapMaxWidth:innerW };
    }
    if(fs === MANGO_FONT_MIN){
      // last resort: uncap width so the word is guaranteed to fit, never clipped
      const finalW = Math.max(mangoW, contentW/MANGO_SAFE_W + MANGO_PAD);
      const finalH = Math.max(finalW*MANGO_ASPECT, neededH);
      return { mangoW:finalW, mangoH: Math.min(finalH, finalW*1.55), fontSize:fs, wrapMaxWidth:innerW };
    }
  }
}

function renderMangoArt(){
  const field = document.getElementById('mango-field');
  const farmerEl = document.getElementById('mango-farmer');
  if(!field) return;
  // Measure the field/farmer's *actual* rendered pixel size (they're sized
  // responsively via CSS to fill the screen) and draw the art at exactly
  // that resolution, so it's always crisp and never CSS-stretched.
  const fw = field.clientWidth || 700, fh = field.clientHeight || 400;
  const scene = makeCanvas(fw, fh);
  drawMangoScene(scene.ctx, fw, fh);

  const farmerW = (farmerEl && farmerEl.clientWidth) || 88;
  const farmerH = (farmerEl && farmerEl.clientHeight) || 128;
  const farmer = makeCanvas(farmerW, farmerH);
  drawFarmerSprite(farmer.ctx, farmerW, farmerH);

  const root = document.documentElement.style;
  root.setProperty('--mango-scene-url', `url(${scene.c.toDataURL()})`);
  root.setProperty('--mango-farmer-url', `url(${farmer.c.toDataURL()})`);
}

// Keep the scene/farmer crisp if the player resizes the window mid-game,
// without redrawing on every single resize tick.
let mangoArtResizeTimer = null;
window.addEventListener('resize', ()=>{
  if(selectedGame !== 'mango') return;
  const screenGame = document.getElementById('screen-game');
  if(!screenGame || !screenGame.classList.contains('active')) return;
  clearTimeout(mangoArtResizeTimer);
  mangoArtResizeTimer = setTimeout(()=>{ renderMangoArt(); measureFarmerWidth(); applyFarmerX(); }, 150);
});

/* ---- Mango Falling: player-controlled farmer & basket-catch physics ---- */
const FARMER_SPEED_PCT = 58; // % of field width per second — slowed down for controllable, precise movement
const MANGO_FALL_DISTANCE = 460; // px, matches the CSS fallDown keyframes
const CATCH_PROGRESS_START = 0.55; // catching becomes possible once mango is this far through its fall
let farmerXPct = 50;
let farmerMoveDir = 0; // -1, 0, 1 from keyboard
let farmerDragActive = false;
let mangoFallStart = 0;
let mangoList = []; // {el, opt, left(px)}
let farmerWidthPx = 88; // cached so per-frame positioning never forces a layout read

// Positions the farmer with a single GPU-composited transform instead of
// animating `left` (which forces a layout every frame) — keeps movement
// smooth even on lower-end devices.
function measureFarmerWidth(){
  const el = document.getElementById('mango-farmer');
  if(el) farmerWidthPx = el.getBoundingClientRect().width || farmerWidthPx;
}
function applyFarmerX(){
  const field = document.getElementById('mango-field');
  const farmerEl = document.getElementById('mango-farmer');
  if(!field || !farmerEl) return;
  const px = (farmerXPct/100) * field.clientWidth - farmerWidthPx/2;
  farmerEl.style.transform = `translateX(${px}px)`;
}

function renderMangoField(){
  const field = document.getElementById('mango-field');
  field.querySelectorAll('.mango-obj').forEach(m=>m.remove());
  renderMangoArt(); // (re)draw the scene/farmer at the field's current on-screen size
  mangoAnswered = false;
  farmerXPct = 50;
  measureFarmerWidth();
  applyFarmerX();
  const opts = currentQuestion.options;
  const fieldWidth = field.clientWidth || 700;
  const fieldHeight = field.clientHeight || 400;
  const fallDistance = fieldHeight + 60; // travel a bit past the bottom so it visibly reaches/passes the basket
  const slotW = fieldWidth / opts.length;
  mangoList = [];
  opts.forEach((opt,i)=>{
    const html = formatFracDisplay(opt);
    // Each mango is sized to the word it holds, capped to the width of its
    // falling lane so neighboring mangoes never overlap.
    const layout = computeMangoLayout(html, slotW - 14);
    const mw = Math.round(layout.mangoW), mh = Math.round(layout.mangoH);

    const el = document.createElement('div');
    el.className = 'mango-obj';
    el.dataset.value = opt; // raw value kept for logic (hint lookups etc.)
    el.style.width = mw + 'px';
    el.style.top = -mh + 'px'; // start just above the field, whatever this mango's height is
    el.style.setProperty('--fall-distance', fallDistance + 'px');
    const left = Math.max(4, Math.min(fieldWidth - mw - 4, slotW*i + (slotW-mw)/2));
    el.style.left = left + 'px';
    el.style.animationDuration = timeTotal + 's';

    const sprite = makeCanvas(mw, mh);
    drawMangoSprite(sprite.ctx, mw, mh);
    const fruit = document.createElement('div');
    fruit.className = 'fruit';
    fruit.style.setProperty('--fd', '-' + (Math.random()*3.5).toFixed(2) + 's'); // desync idle float between mangoes
    fruit.style.width = mw + 'px';
    fruit.style.height = mh + 'px';
    fruit.style.paddingTop = Math.round(mh*0.12) + 'px'; // nudge the label toward the mango's visual belly
    fruit.style.backgroundImage = `url(${sprite.c.toDataURL()})`;
    const label = document.createElement('span');
    label.className = 'fruit-label';
    label.style.fontSize = layout.fontSize + 'px';
    if(layout.wrapMaxWidth) label.style.maxWidth = layout.wrapMaxWidth + 'px';
    label.innerHTML = html;
    fruit.appendChild(label);
    el.appendChild(fruit);

    // Tapping/clicking a mango is just a mobile-friendly assist that snaps the
    // farmer under it — the actual answer is decided by the basket catch below.
    el.addEventListener('click', ()=>{
      if(mangoAnswered) return;
      farmerXPct = Math.min(94, Math.max(6, ((left+mw/2)/fieldWidth)*100));
      applyFarmerX();
    });
    field.appendChild(el);
    requestAnimationFrame(()=> el.classList.add('fall'));
    mangoList.push({ el, opt, left, width:mw, catchRadius: Math.min(mw/2 + 16, slotW/2 - 6) });
  });
  mangoFallStart = performance.now();
  if(mangoRAF) cancelAnimationFrame(mangoRAF);
  mangoRAF = requestAnimationFrame(mangoTick);
}

let mangoLastTs = 0;
function mangoTick(ts){
  if(!mangoLastTs) mangoLastTs = ts;
  const dt = Math.min(0.05, (ts - mangoLastTs)/1000);
  mangoLastTs = ts;

  const field = document.getElementById('mango-field');
  const farmerEl = document.getElementById('mango-farmer');
  if(!field || !farmerEl || mangoAnswered){ mangoLastTs = 0; return; }

  if(farmerMoveDir !== 0){
    farmerXPct += farmerMoveDir * FARMER_SPEED_PCT * dt;
    farmerXPct = Math.min(94, Math.max(6, farmerXPct));
    applyFarmerX();
  }

  const fieldWidth = field.clientWidth;
  const elapsed = performance.now() - mangoFallStart;
  const progress = elapsed / (timeTotal*1000);

  if(progress >= CATCH_PROGRESS_START){
    const farmerCenterPx = (farmerXPct/100) * fieldWidth;
    for(const m of mangoList){
      if(m.caught) continue;
      const mangoCenterPx = m.left + m.width/2;
      if(Math.abs(mangoCenterPx - farmerCenterPx) < m.catchRadius){
        resolveMangoCatch(m);
        break;
      }
    }
  }

  if(!mangoAnswered){
    mangoRAF = requestAnimationFrame(mangoTick);
  } else {
    mangoLastTs = 0;
  }
}

function resolveMangoCatch(m){
  if(mangoAnswered) return;
  mangoAnswered = true;
  const correct = m.opt === currentQuestion.correct;
  m.caught = true;
  m.el.classList.add(correct ? 'correctclick' : 'wrongclick');
  m.el.style.animationPlayState = 'paused';
  document.querySelectorAll('.mango-obj').forEach(x=> x.style.pointerEvents='none');
  animateFarmer(correct);
  if(correct) toast('Correct! The farmer catches it! 🥭🧺'); else toast(`Wrong mango in the basket — correct answer was ${currentQuestion.correct}`);
  onRoundQuestionEnd(correct);
}

function animateFarmer(caught){
  const farmer = document.getElementById('mango-farmer');
  if(!farmer) return;
  farmer.classList.remove('catch','miss');
  void farmer.offsetWidth; // restart animation
  farmer.classList.add(caught ? 'catch' : 'miss');
}

/* Keyboard + drag controls for the farmer (Mango Falling) */
document.addEventListener('keydown', (e)=>{
  if(!document.getElementById('screen-game').classList.contains('active')) return;
  if(gamePaused) return; // quit dialog is open: gameplay input is ignored
  if(selectedGame === 'mango'){
    if(e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') farmerMoveDir = -1;
    else if(e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') farmerMoveDir = 1;
  } else if(selectedGame === 'fish'){
    if(e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') fisherMoveDir = -1;
    else if(e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') fisherMoveDir = 1;
  } else if(selectedGame === 'snake'){
    if(e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') snakeMoveDir = -1;
    else if(e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') snakeMoveDir = 1;
    else if(e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') snakeMoveY = -1;
    else if(e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') snakeMoveY = 1;
  }
});
document.addEventListener('keyup', (e)=>{
  if(['ArrowLeft','ArrowRight','a','A','d','D'].includes(e.key)){ farmerMoveDir = 0; snakeMoveDir = 0; }
  if(['ArrowUp','ArrowDown','w','W','s','S'].includes(e.key)){ fisherMoveDir = 0; snakeMoveY = 0; }
});
(function initMangoDrag(){
  const field = document.getElementById('mango-field');
  if(!field) return;
  // Dragging steers direction only — the farmer still moves at the same
  // constant FARMER_SPEED_PCT as keyboard control, rather than snapping
  // straight to the pointer's exact x position (which felt too twitchy).
  function moveTo(clientX){
    const rect = field.getBoundingClientRect();
    const farmerCenterPx = (farmerXPct/100) * rect.width;
    const pointerPx = clientX - rect.left;
    const deadzone = 20;
    if(pointerPx < farmerCenterPx - deadzone) farmerMoveDir = -1;
    else if(pointerPx > farmerCenterPx + deadzone) farmerMoveDir = 1;
    else farmerMoveDir = 0;
  }
  field.addEventListener('pointerdown', (e)=>{ farmerDragActive = true; moveTo(e.clientX); });
  field.addEventListener('pointermove', (e)=>{ if(farmerDragActive) moveTo(e.clientX); });
  window.addEventListener('pointerup', ()=>{ farmerDragActive = false; farmerMoveDir = 0; });
  field.addEventListener('pointerleave', ()=>{ farmerDragActive = false; farmerMoveDir = 0; });
})();

/* ---------- Fishtions texture pack (all drawn once, cached, tiny memory) ---------- */
// seamless caustic network tile: integer frequencies => tiles perfectly, then slid by transform only
let fishCausticUrl = null;
function makeCausticTile(){
  if(fishCausticUrl) return fishCausticUrl;
  const S = 192, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'), img = g.createImageData(S,S), d = img.data, T = Math.PI*2/S;
  for(let y=0;y<S;y++) for(let x=0;x<S;x++){
    const u=x*T, v=y*T;
    const f = (Math.sin(3*u+1.3*Math.sin(2*v+0.7)) + Math.sin(2*v+1.1*Math.sin(3*u+2.1)) + Math.sin(2*(u+v)+0.9*Math.sin(u-2*v)))/3;
    const l = Math.pow(Math.max(0,1-Math.abs(f)*5.5),3), i=(y*S+x)*4;
    d[i]=255; d[i+1]=255; d[i+2]=235; d[i+3]=Math.round(l*150);
  }
  g.putImageData(img,0,0);
  fishCausticUrl = c.toDataURL();
  return fishCausticUrl;
}

const FISH_PAL = {
  'fish-c1':{back:'#1c6fa0',mid:'#3fb0e0',belly:'#d6f3ff',fin:'#1c7fb0',acc:'#0d4d73'},
  'fish-c2':{back:'#2f7a22',mid:'#6fc447',belly:'#e6f8c8',fin:'#3f8f2c',acc:'#1d4d12'},
  'fish-c3':{back:'#5a2a92',mid:'#a666e0',belly:'#f0e0ff',fin:'#6f34a8',acc:'#341560'},
  'fish-c4':{back:'#b8601a',mid:'#f5a742',belly:'#fff0cc',fin:'#c96f1a',acc:'#6e3508'}
};
const FISH_SHAPE = { 'sp-slim':14.5, 'sp-round':21, 'sp-stripe':17.5 };
const fishSpriteCache = {}; // 4 colours x 3 species = 12 tiny sprites, shared by every fish

function drawFishSprite(ctx,W,H,pal,species){
  ctx.clearRect(0,0,W,H); ctx.save(); ctx.scale(W/108,H/56);
  const hh = FISH_SHAPE[species]||17, cy = 28, ink = '#1c2b33';
  const body = ()=>{ ctx.beginPath(); ctx.moveTo(6,cy);
    ctx.bezierCurveTo(12,cy-hh*0.95,44,cy-hh*1.18,90,cy-4); ctx.lineTo(90,cy+4);
    ctx.bezierCurveTo(44,cy+hh*1.18,12,cy+hh*0.95,6,cy); ctx.closePath(); };
  ctx.lineJoin='round'; ctx.lineWidth=1.8; ctx.strokeStyle=ink;
  // forked tail with fin rays
  ctx.fillStyle=pal.fin; ctx.beginPath(); ctx.moveTo(86,cy-3); ctx.lineTo(107,cy-hh*0.95);
  ctx.quadraticCurveTo(99,cy,107,cy+hh*0.95); ctx.lineTo(86,cy+3); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.strokeStyle='rgba(0,0,0,0.25)'; ctx.lineWidth=0.8;
  for(let k=-2;k<=2;k++){ ctx.beginPath(); ctx.moveTo(88,cy+k); ctx.lineTo(102,cy+k*hh*0.36); ctx.stroke(); } ctx.restore();
  // dorsal + anal fins (behind the body)
  ctx.fillStyle=pal.fin;
  ctx.beginPath(); ctx.moveTo(28,cy-hh*0.6); ctx.quadraticCurveTo(36,cy-hh-11,52,cy-hh-8); ctx.quadraticCurveTo(66,cy-hh*0.9,71,cy-hh*0.45); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(52,cy+hh*0.75); ctx.quadraticCurveTo(60,cy+hh+6,74,cy+hh*0.6); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.strokeStyle='rgba(0,0,0,0.22)'; ctx.lineWidth=0.8;
  for(let k=0;k<5;k++){ ctx.beginPath(); ctx.moveTo(34+k*7,cy-hh*0.85); ctx.lineTo(40+k*6,cy-hh-6+Math.abs(k-2)*2.2); ctx.stroke(); } ctx.restore();
  // body: back-to-belly gradient
  const bg = ctx.createLinearGradient(0,cy-hh*1.2,0,cy+hh*1.2);
  bg.addColorStop(0,pal.back); bg.addColorStop(0.45,pal.mid); bg.addColorStop(1,pal.belly);
  ctx.fillStyle=bg; body(); ctx.fill();
  ctx.save(); body(); ctx.clip();
  if(species==='sp-stripe'){ // curved dark bands
    ctx.strokeStyle=pal.acc; ctx.globalAlpha=0.38; ctx.lineWidth=4.2; ctx.lineCap='round';
    [32,44,56,68].forEach(x=>{ ctx.beginPath(); ctx.moveTo(x,cy-hh*1.3); ctx.quadraticCurveTo(x+6,cy,x-2,cy+hh*1.3); ctx.stroke(); });
    ctx.globalAlpha=1;
  }
  // overlapping scales (half-arcs, offset every other row)
  ctx.lineWidth=0.8; let row=0;
  for(let y=cy-hh*1.1; y<cy+hh*1.2; y+=4.3, row++){
    for(let x=24+(row%2)*3.1; x<92; x+=6.2){
      ctx.strokeStyle='rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.arc(x,y,3.3,Math.PI*0.5,Math.PI*1.5); ctx.stroke();
      ctx.strokeStyle='rgba(0,0,0,0.10)'; ctx.beginPath(); ctx.arc(x+0.8,y+0.4,3.3,Math.PI*0.55,Math.PI*1.45); ctx.stroke();
    }
  }
  ctx.strokeStyle='rgba(0,0,0,0.20)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(26,cy-1); ctx.quadraticCurveTo(56,cy-3,88,cy); ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,0.30)'; ctx.beginPath(); ctx.ellipse(44,cy-hh*0.62,23,hh*0.2,-0.05,0,Math.PI*2); ctx.fill();
  const sh = ctx.createLinearGradient(0,cy,0,cy+hh*1.2); sh.addColorStop(0,'rgba(0,0,0,0)'); sh.addColorStop(1,'rgba(0,0,0,0.14)');
  ctx.fillStyle=sh; ctx.fillRect(0,cy,W,hh*1.3);
  ctx.restore();
  ctx.lineWidth=2; ctx.strokeStyle=ink; body(); ctx.stroke();
  // pectoral fin, gill, mouth, eye
  ctx.fillStyle=pal.fin; ctx.lineWidth=1.2; ctx.beginPath(); ctx.ellipse(37,cy+hh*0.25,8,3.6,0.55,0,Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle='rgba(0,0,0,0.32)'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.arc(24,cy,hh*0.78,-0.85,0.85); ctx.stroke();
  ctx.strokeStyle=ink; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(6.4,cy+1.5); ctx.lineTo(10.5,cy+2.4); ctx.stroke();
  ctx.fillStyle='#fff'; ctx.strokeStyle=ink; ctx.beginPath(); ctx.arc(15,cy-hh*0.22,4.3,0,Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#0a1a22'; ctx.beginPath(); ctx.arc(15.6,cy-hh*0.22,2.4,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(14.6,cy-hh*0.22-1,0.9,0,Math.PI*2); ctx.fill();
  ctx.restore();
}
function getFishSprite(colorCls,species){
  const key = colorCls+'|'+species;
  if(!fishSpriteCache[key]){
    const c = document.createElement('canvas'); c.width = 216; c.height = 112; // 2x for crisp edges, ~100KB total for all 12
    drawFishSprite(c.getContext('2d'),216,112,FISH_PAL[colorCls]||FISH_PAL['fish-c1'],species);
    fishSpriteCache[key] = `url(${c.toDataURL()})`;
  }
  return fishSpriteCache[key];
}

/* ---------- scene texture helpers (called from drawFishScene) ---------- */
function drawIsland(ctx,W,H,u,rnd){
  const x0=W*0.58, x1=W*0.98, yb=H*0.35, yt=H*0.235, w=x1-x0;
  // shallow turquoise halo + soft shadow under the island (water looks see-through near the shore)
  const halo = ctx.createRadialGradient((x0+x1)/2,yb,w*0.05,(x0+x1)/2,yb,w*0.62);
  halo.addColorStop(0,'rgba(120,235,225,0.55)'); halo.addColorStop(1,'rgba(120,235,225,0)');
  ctx.fillStyle=halo; ctx.beginPath(); ctx.ellipse((x0+x1)/2,yb+3*u,w*0.62,16*u,0,0,Math.PI*2); ctx.fill();
  const dune = ()=>{ ctx.beginPath(); ctx.moveTo(x0,yb); ctx.bezierCurveTo(x0+w*0.08,yt+4*u,x0+w*0.30,yt,x0+w*0.52,yt+2*u);
    ctx.bezierCurveTo(x0+w*0.78,yt+3*u,x0+w*0.95,yt+14*u,x1,yb); ctx.closePath(); };
  const sand = ctx.createLinearGradient(0,yt,0,yb);
  sand.addColorStop(0,'#F6E7B8'); sand.addColorStop(0.55,'#E8CF93'); sand.addColorStop(1,'#C9A96B');
  ctx.fillStyle=sand; dune(); ctx.fill();
  ctx.save(); dune(); ctx.clip();
  // dry grass / shrubs on the crest, sand grain speckle, darker wet-sand band at the waterline
  ctx.fillStyle='rgba(70,120,60,0.85)';
  for(let i=0;i<26;i++){ const px=x0+w*(0.12+rnd()*0.76), py=yt+(2+rnd()*5)*u; ctx.beginPath(); ctx.ellipse(px,py,(3+rnd()*5)*u,(1.5+rnd()*2)*u,0,0,Math.PI*2); ctx.fill(); }
  ctx.fillStyle='rgba(120,90,40,0.35)';
  for(let i=0;i<260;i++){ ctx.fillRect(x0+rnd()*w, yt+rnd()*(yb-yt), 1.1*u, 1.1*u); }
  ctx.fillStyle='rgba(255,255,255,0.35)';
  for(let i=0;i<120;i++){ ctx.fillRect(x0+rnd()*w, yt+rnd()*(yb-yt)*0.8, 1*u, 1*u); }
  const wet = ctx.createLinearGradient(0,yb-9*u,0,yb); wet.addColorStop(0,'rgba(90,70,40,0)'); wet.addColorStop(1,'rgba(90,70,40,0.55)');
  ctx.fillStyle=wet; ctx.fillRect(x0,yb-9*u,w,9*u);
  ctx.restore();
  ctx.strokeStyle='rgba(255,255,255,0.8)'; ctx.lineWidth=2*u; ctx.lineCap='round';
  ctx.beginPath(); for(let x=x0;x<x1;x+=14*u){ ctx.moveTo(x,yb+1*u); ctx.quadraticCurveTo(x+7*u,yb-2*u,x+14*u,yb+1*u); } ctx.stroke();
  [[0.05,2],[0.31,1.3],[0.88,1.6]].forEach(([fx,s])=>{ // rocks with a lit top face
    const rx=x0+w*fx, ry=yb-2*u; ctx.fillStyle='#8a8a84'; ctx.beginPath(); ctx.ellipse(rx,ry,6*u*s,3.6*u*s,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.ellipse(rx-1.5*u,ry-1.4*u*s,3.4*u*s,1.5*u*s,0,0,Math.PI*2); ctx.fill(); });
}
function drawSeabed(ctx,W,H,u,rnd){
  const top = H*0.93;
  ctx.fillStyle='rgba(20,40,40,0.22)'; ctx.fillRect(0,top-10*u,W,H-top+10*u);
  const g = ctx.createLinearGradient(0,top,0,H); g.addColorStop(0,'#6c6a52'); g.addColorStop(1,'#2a2c25');
  ctx.fillStyle=g; ctx.beginPath(); ctx.moveTo(0,H);
  for(let x=0;x<=W;x+=W/16) ctx.lineTo(x, top+Math.sin(x*0.011)*5*u+(rnd()*3)*u);
  ctx.lineTo(W,H); ctx.closePath(); ctx.fill();
  for(let i=0;i<150;i++){ ctx.fillStyle=rnd()<0.5?'rgba(255,255,255,0.12)':'rgba(0,0,0,0.2)'; ctx.fillRect(rnd()*W, top+rnd()*(H-top), (1+rnd()*2.5)*u, 1.2*u); }
  for(let i=0;i<14;i++){ const px=rnd()*W, py=top+(4+rnd()*(H-top-6)); ctx.fillStyle='#5b6358'; ctx.beginPath(); ctx.ellipse(px,py,(3+rnd()*4)*u,(2+rnd()*2)*u,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.ellipse(px-u,py-u,1.8*u,0.9*u,0,0,Math.PI*2); ctx.fill(); }
}
function drawLightRays(ctx,W,H,u,sunX,horizonY){
  ctx.save();
  for(let i=0;i<6;i++){
    const bx=sunX+(i-2.5)*W*0.07, ex=bx-W*0.18+i*W*0.02;
    const g=ctx.createLinearGradient(0,horizonY,0,H*0.85); g.addColorStop(0,'rgba(255,248,210,0.16)'); g.addColorStop(1,'rgba(255,248,210,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.moveTo(bx-6*u,horizonY); ctx.lineTo(bx+6*u,horizonY); ctx.lineTo(ex+30*u,H*0.85); ctx.lineTo(ex-30*u,H*0.85); ctx.closePath(); ctx.fill();
  } ctx.restore();
}

/* ============================================================
   FISHTIONS ART — canvas-drawn ocean scene + rowboat/fisherman sprite.
   Drawn once at the field's real pixel size (and again on resize), never
   per frame; moving bits (rod/line/hook, clouds, gulls, palms, bubbles,
   splashes) stay lightweight CSS/DOM on top.
   ============================================================ */
let fishRidges = []; // mountain silhouettes, reused to mask the sun/moon/stars behind them
function drawFishScene(ctx,W,H){
  ctx.clearRect(0,0,W,H); fishRidges = [];
  const u = Math.min(W,H)/400, horizonY = H*0.30;
  let seed = Math.round(W*3+H*11); const rnd=()=>{ seed=(seed*9301+49297)%233280; return seed/233280; };
  const sky = ctx.createLinearGradient(0,0,0,horizonY);
  sky.addColorStop(0,'#5FC3E8'); sky.addColorStop(0.6,'#9FDCEE'); sky.addColorStop(1,'#D8F1E8');
  ctx.fillStyle = sky; ctx.fillRect(0,0,W,horizonY);
  // sun, glitter and light rays are separate moving layers (see drawSunLayer / updateDayNight)
  ctx.save(); ctx.globalAlpha=0.16; ctx.fillStyle='#fff'; for(let i=0;i<7;i++) ctx.beginPath(), ctx.ellipse(W*(0.1+rnd()*0.8),H*(0.03+rnd()*0.18),(50+rnd()*90)*u,(1.6+rnd()*2.4)*u,-0.05,0,Math.PI*2), ctx.fill(); ctx.restore();
  drawCloud(ctx,W*0.18,H*0.08,0.7*u); drawCloud(ctx,W*0.42,H*0.05,0.5*u); drawCloud(ctx,W*0.62,H*0.13,0.42*u);
  // hazy mountain ridges for atmospheric depth (far = paler, near = bolder).
  // Each peak's height also gets its own random jitter on top of the base
  // sine wave, so peaks vary irregularly in height/shape rather than
  // repeating a uniform silhouette.
  const ridge = (n,amp,base,color,alpha,jag)=>{
    jag = jag||0;
    const pts=[]; for(let i=0;i<=n;i++){
      const h = base+Math.abs(Math.sin(i*1.7+amp))*amp + (rnd()-0.3)*amp*jag;
      pts.push([(i/n)*W, horizonY-Math.max(base*0.4,h)*u]);
    }
    fishRidges.push({pts,alpha});
    ctx.save(); ctx.globalAlpha=alpha; drawHillLayer(ctx,W,pts,horizonY+6*u,color); ctx.restore();
    ctx.fillStyle='rgba(32,72,62,'+(alpha*0.45)+')';
    for(let i=0;i<pts.length-1;i++) for(let k=0;k<9;k++){ const t=k/9, x=pts[i][0]+(pts[i+1][0]-pts[i][0])*t, y=pts[i][1]+(pts[i+1][1]-pts[i][1])*t; if(rnd()<0.55){ ctx.beginPath(); ctx.arc(x+(rnd()-0.5)*5*u,y+(0.5+rnd()*2.5)*u,(0.7+rnd()*1.0)*u,0,Math.PI*2); ctx.fill(); } }
  };
  // a very distant, tall, steep-peaked range — further back and paler than
  // the two ridges below, for real depth and more dramatic silhouettes
  ridge(Math.max(4,Math.round(W/190)),34,4,'#A9C9D4',0.3,0.5);
  ridge(Math.max(5,Math.round(W/140)),9,8,'#8FB9C9',0.5,0.3);
  ridge(Math.max(5,Math.round(W/110)),22,6,'#6FA2B0',0.75,0.35);
  // distant low island with tiny palms
  ctx.save(); ctx.globalAlpha=0.55; ctx.fillStyle='#7FA8B8';
  ctx.beginPath(); ctx.ellipse(W*0.09,horizonY-2*u,40*u,7*u,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='rgba(40,60,60,0.5)';
  [[-0.03,0],[0.02,-3]].forEach(([dx,dy])=>{
    const px=W*0.09+dx*W, py=horizonY-2*u+dy*u;
    ctx.fillRect(px-u,py-10*u,1.6*u,10*u); ctx.beginPath(); ctx.ellipse(px,py-11*u,5*u,3*u,0,0,Math.PI*2); ctx.fill();
  }); ctx.restore();
  // water: shallow turquoise near the horizon -> deep navy
  const water = ctx.createLinearGradient(0,horizonY,0,H);
  [[0,'#4FC2D8'],[0.1,'#1B93BE'],[0.38,'#0E6E98'],[0.7,'#0A4F72'],[1,'#052E48']].forEach(([s,c])=>water.addColorStop(s,c));
  ctx.fillStyle = water; ctx.fillRect(0,horizonY,W,H-horizonY);
  for(let i=0;i<26;i++) rnd(); // keep the random sequence (and so the wave layout) unchanged
  // wave bands: tight near the horizon, wide & sparse near the viewer, each
  // row nudged by a touch of per-row jitter so the waves feel naturally
  // irregular instead of a perfectly repeating pattern
  ctx.save(); ctx.globalAlpha=0.16; ctx.strokeStyle='#fff'; ctx.lineCap='round';
  for(let row=0;row<14;row++){
    const t=row/13, y=horizonY+t*t*(H-horizonY), wl=(24+t*40)*u*(0.85+rnd()*0.3);
    const amp = 3*u*(1-t*0.6)*(0.7+rnd()*0.6);
    ctx.lineWidth=(1+t*2)*u; ctx.beginPath();
    for(let x=-wl;x<W+wl;x+=wl){ ctx.moveTo(x,y); ctx.quadraticCurveTo(x+wl*0.5,y-amp,x+wl,y); }
    ctx.stroke();
  } ctx.restore();
  // whitecap foam flecks scattered on the nearer, choppier rows — small bright
  // dabs that read as light catching the crest of a wave
  ctx.save(); ctx.fillStyle='rgba(255,255,255,0.5)';
  for(let i=0;i<34;i++){
    const t = 0.35+rnd()*0.65, y = horizonY+t*t*(H-horizonY);
    const fx = rnd()*W, fw2 = (3+rnd()*5)*u*(0.6+t);
    ctx.globalAlpha = 0.18+rnd()*0.22;
    ctx.beginPath(); ctx.ellipse(fx,y,fw2,fw2*0.32,0,0,Math.PI*2); ctx.fill();
  } ctx.restore();
  drawIsland(ctx,W,H,u,rnd);
  drawSeabed(ctx,W,H,u,rnd);
  const ds = ctx.createLinearGradient(0,horizonY,0,H);
  ds.addColorStop(0,'rgba(0,10,20,0)'); ds.addColorStop(1,'rgba(0,10,20,0.25)');
  ctx.fillStyle = ds; ctx.fillRect(0,horizonY,W,H-horizonY);
}

/* rowboat + seated fisherman (vest, cap, boots, rod hand) in a 100x150 logical box */
function drawFishermanBoatSprite(ctx,tw,th){
  ctx.clearRect(0,0,tw,th); ctx.save(); ctx.scale(tw/100,th/150);
  const cx=46, R=(x,y,w,h,r)=>roundRectPath(ctx,x,y,w,h,r);
  ctx.save(); ctx.globalAlpha=0.25; ctx.fillStyle='#03202f';
  ctx.beginPath(); ctx.ellipse(cx+2,132,42,8,0,0,Math.PI*2); ctx.fill(); ctx.restore();
  const hg = ctx.createLinearGradient(6,110,cx+40,132);
  hg.addColorStop(0,'#A9713E'); hg.addColorStop(0.55,'#8A5A2E'); hg.addColorStop(1,'#6B431F');
  ctx.fillStyle=hg; ctx.beginPath(); ctx.moveTo(4,112); ctx.quadraticCurveTo(2,128,16,134); ctx.lineTo(80,134);
  ctx.quadraticCurveTo(93,128,90,111); ctx.quadraticCurveTo(48,120,4,112); ctx.closePath(); ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,0.35)'; ctx.lineWidth=1.6; ctx.stroke();
  ctx.strokeStyle='rgba(0,0,0,0.22)'; ctx.lineWidth=1;
  [118,124,129].forEach(py=>{ ctx.beginPath(); ctx.moveTo(8,py); ctx.quadraticCurveTo(46,py+5,88,py); ctx.stroke(); });
  ctx.fillStyle='#C08B52'; ctx.beginPath(); ctx.moveTo(4,112); ctx.quadraticCurveTo(48,120,90,111); ctx.lineTo(90,107);
  ctx.quadraticCurveTo(48,116,4,108); ctx.closePath(); ctx.fill(); ctx.strokeStyle='rgba(0,0,0,0.3)'; ctx.lineWidth=1.4; ctx.stroke();
  ctx.fillStyle='#7a5230'; R(26,106,34,6,2); ctx.fill();
  ctx.save(); ctx.translate(14,109); ctx.strokeStyle='#D8B36A'; ctx.lineWidth=2; ctx.lineCap='round';
  for(let r=1;r<=3;r++){ ctx.beginPath(); ctx.arc(0,0,r*2.1,0,Math.PI*1.7); ctx.stroke(); } ctx.restore();
  ctx.fillStyle='#4a7a68'; R(72,98,13,11,2); ctx.fill(); ctx.strokeStyle='rgba(0,0,0,0.35)'; ctx.lineWidth=1.4; R(72,98,13,11,2); ctx.stroke();
  ctx.fillStyle='#3F9FD6'; ctx.beginPath(); ctx.moveTo(76,97); ctx.lineTo(80,92); ctx.lineTo(81,97); ctx.closePath(); ctx.fill();
  // fisherman
  ctx.fillStyle='#3a5b6e'; R(cx-14,96,11,16,3); ctx.fill(); R(cx+2,96,11,16,3); ctx.fill();
  ctx.fillStyle='#2E2115'; R(cx-16,108,13,8,3); ctx.fill(); R(cx+1,108,13,8,3); ctx.fill();
  const vg = ctx.createLinearGradient(cx-18,0,cx+18,0); vg.addColorStop(0,'#E8A23F'); vg.addColorStop(1,'#C97F27');
  ctx.fillStyle=vg; R(cx-18,60,36,42,9); ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,0.18)'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(cx,64); ctx.lineTo(cx,96); ctx.stroke();
  ctx.strokeStyle='rgba(90,55,10,0.55)'; ctx.lineWidth=1.4; R(cx-13,78,11,9,2); ctx.stroke();
  ctx.fillStyle='#5FA6C9'; R(cx-9,56,18,10,3); ctx.fill(); R(cx-27,64,11,26,5); ctx.fill();
  ctx.save(); ctx.translate(cx+17,66); ctx.rotate(0.35); R(-5,0,11,28,5); ctx.fill(); ctx.restore();
  ctx.fillStyle='#E8B98A'; ctx.beginPath(); ctx.arc(cx-24,90,6,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+29,83,6,0,Math.PI*2); ctx.fill();
  // neck: a tapered trapezoid (narrow under the chin, flared at the shoulders)
  // that overlaps the collar below it, so there's no gap or hard step between
  // the head and the torso at any sprite size.
  ctx.beginPath();
  ctx.moveTo(cx-6.5,44); ctx.lineTo(cx+6.5,44);
  ctx.quadraticCurveTo(cx+7.2,52,cx+9.5,58);
  ctx.lineTo(cx-9.5,58);
  ctx.quadraticCurveTo(cx-7.2,52,cx-6.5,44);
  ctx.closePath(); ctx.fill();
  // head group sits 8 units lower so the neck is short; it still overlaps the neck top
  ctx.save(); ctx.translate(0,8);
  ctx.beginPath(); ctx.arc(cx,24,17,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#5A3E22'; ctx.beginPath(); ctx.ellipse(cx-13,20,3.4,7,0.2,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx+13,20,3.4,7,-0.2,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#2A1E12'; ctx.beginPath(); ctx.arc(cx-6,23,2.1,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+6,23,2.1,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#8B4A3A'; ctx.lineWidth=1.8; ctx.lineCap='round'; ctx.beginPath(); ctx.arc(cx,29,4.4,0.15*Math.PI,0.85*Math.PI); ctx.stroke();
  ctx.fillStyle='#2F4538'; ctx.beginPath(); ctx.ellipse(cx,10,17,9,0,Math.PI,0); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx,13.5,17,3.6,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#24352A'; ctx.beginPath(); ctx.ellipse(cx+9,14,9,2.6,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#E85D2D'; ctx.beginPath(); ctx.arc(cx-9,12,1.6,0,Math.PI*2); ctx.fill();
  ctx.restore();
  // ---- material pass: cloth shading/folds, skin shading, leather gloves, wood grain, wet waterline ----
  ctx.save(); R(cx-18,60,36,42,9); ctx.clip();
  const vs = ctx.createLinearGradient(cx-18,0,cx+18,0); vs.addColorStop(0,'rgba(255,230,160,0.25)'); vs.addColorStop(0.5,'rgba(0,0,0,0)'); vs.addColorStop(1,'rgba(60,25,0,0.35)');
  ctx.fillStyle=vs; ctx.fillRect(cx-18,60,36,42);
  ctx.strokeStyle='rgba(90,45,5,0.35)'; ctx.lineWidth=1;
  [[-9,70,-7,84],[7,68,10,86],[-3,88,2,98]].forEach(([x1,y1,x2,y2])=>{ ctx.beginPath(); ctx.moveTo(cx+x1,y1); ctx.quadraticCurveTo(cx+(x1+x2)/2+2,(y1+y2)/2,cx+x2,y2); ctx.stroke(); });
  ctx.restore();
  ctx.fillStyle='rgba(70,45,20,0.9)'; [[cx-24,90],[cx+29,83]].forEach(([gx,gy])=>{ ctx.beginPath(); ctx.arc(gx,gy,6.4,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='rgba(255,220,160,0.4)'; ctx.lineWidth=0.9; ctx.beginPath(); ctx.arc(gx,gy,4.2,0.3,Math.PI*1.4); ctx.stroke(); });
  ctx.save(); ctx.translate(0,8);
  ctx.fillStyle='rgba(190,110,90,0.35)'; ctx.beginPath(); ctx.arc(cx-8,28,3,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+8,28,3,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='rgba(120,70,40,0.55)'; ctx.lineWidth=1.3; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(cx+1,24); ctx.quadraticCurveTo(cx+3.5,28,cx,29); ctx.stroke();
  ctx.strokeStyle='#3b2a1c'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(cx-9,19); ctx.lineTo(cx-3,18.2); ctx.moveTo(cx+3,18.2); ctx.lineTo(cx+9,19); ctx.stroke();
  const fs = ctx.createLinearGradient(cx-17,0,cx+17,0); fs.addColorStop(0,'rgba(255,255,255,0.10)'); fs.addColorStop(1,'rgba(60,20,0,0.18)');
  ctx.save(); ctx.beginPath(); ctx.arc(cx,24,17,0,Math.PI*2); ctx.clip(); ctx.fillStyle=fs; ctx.fillRect(cx-17,7,34,34); ctx.restore();
  ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.moveTo(4,112); ctx.quadraticCurveTo(2,128,16,134); ctx.lineTo(80,134); ctx.quadraticCurveTo(93,128,90,111); ctx.quadraticCurveTo(48,120,4,112); ctx.closePath(); ctx.clip();
  ctx.strokeStyle='rgba(60,30,10,0.22)'; ctx.lineWidth=0.7;
  for(let i=0;i<22;i++){ const gy=113+i*1.05; ctx.beginPath(); ctx.moveTo(4,gy); ctx.bezierCurveTo(30,gy+4+(i%3),62,gy+4-(i%2),92,gy); ctx.stroke(); }
  ctx.fillStyle='rgba(30,20,10,0.45)'; for(let x=14;x<90;x+=14){ ctx.beginPath(); ctx.arc(x,116+Math.sin(x)*0.6,0.9,0,Math.PI*2); ctx.fill(); }
  const wl = ctx.createLinearGradient(0,122,0,134); wl.addColorStop(0,'rgba(10,40,60,0)'); wl.addColorStop(1,'rgba(10,40,60,0.5)');
  ctx.fillStyle=wl; ctx.fillRect(0,122,100,14);
  const hl = ctx.createLinearGradient(0,108,0,118); hl.addColorStop(0,'rgba(255,230,180,0.35)'); hl.addColorStop(1,'rgba(255,230,180,0)');
  ctx.fillStyle=hl; ctx.fillRect(0,108,100,10);
  ctx.restore();
  ctx.restore();
}

/* glitter column + light rays, drawn once centred on the canvas; updateDayNight slides it under the sun */
function drawSunLayer(ctx,W,H,u){
  ctx.clearRect(0,0,W,H);
  const horizonY=H*0.30, sx=W/2;
  ctx.save(); ctx.globalAlpha=0.35;
  const gg = ctx.createLinearGradient(sx-30*u,0,sx+30*u,0);
  gg.addColorStop(0,'rgba(255,255,255,0)'); gg.addColorStop(0.5,'rgba(255,244,200,0.9)'); gg.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle = gg; ctx.beginPath();
  ctx.moveTo(sx-26*u,horizonY); ctx.lineTo(sx+26*u,horizonY); ctx.lineTo(sx+7*u,H); ctx.lineTo(sx-7*u,H); ctx.closePath(); ctx.fill(); ctx.restore();
  let seed=7; const r=()=>{ seed=(seed*9301+49297)%233280; return seed/233280; };
  ctx.save(); ctx.globalAlpha=0.55; ctx.fillStyle='#FFFBE8';
  for(let i=0;i<26;i++){ const gy=horizonY+r()*(H-horizonY)*0.7, sp=10*u+(gy-horizonY)*0.12; ctx.fillRect(sx+(r()-0.5)*sp*2,gy,(2+r()*4)*u,1.4*u); }
  ctx.restore();
  drawLightRays(ctx,W,H,u,sx,horizonY);
}
/* sky mask: opaque everywhere except where the mountain ridges are (weighted by each ridge's
   opacity), so the sun, moon and stars sit behind the mountains and are occluded by them */
function applySkyMask(fw,fh){
  const sky = document.getElementById('dn-sky'); if(!sky) return;
  const hz = Math.max(1,Math.round(fh*0.30)), m = makeCanvas(fw,hz), c = m.ctx;
  c.fillStyle='#000'; c.fillRect(0,0,fw,hz); c.globalCompositeOperation='destination-out';
  fishRidges.forEach(r=>{ c.globalAlpha=r.alpha; drawHillLayer(c,fw,r.pts,hz+20,'#000'); });
  const url = `url(${m.c.toDataURL()})`;
  sky.style.webkitMaskImage = sky.style.maskImage = url;
  sky.style.webkitMaskSize = sky.style.maskSize = '100% 100%';
  sky.style.webkitMaskRepeat = sky.style.maskRepeat = 'no-repeat';
}
let fisherWidthPx = 78, fisherHeightPx = 117;
function renderFishArt(){
  const field = document.getElementById('fish-field'), fisherEl = document.getElementById('fisherman');
  if(!field) return;
  const fw = field.clientWidth || 700, fh = field.clientHeight || 400;
  const scene = makeCanvas(fw,fh); drawFishScene(scene.ctx,fw,fh);
  applySkyMask(fw,fh);
  const sl = makeCanvas(fw,fh); drawSunLayer(sl.ctx,fw,fh,Math.min(fw,fh)/400);
  const slEl = document.getElementById('dn-sunlayer'); if(slEl) slEl.style.backgroundImage = `url(${sl.c.toDataURL()})`;
  field.style.setProperty('--dn-u', (Math.min(fw,fh)/400)+'px'); buildIslandLights();
  const bw = (fisherEl && fisherEl.clientWidth) || 100, bh = (fisherEl && fisherEl.clientHeight) || 150;
  const boat = makeCanvas(bw,bh); drawFishermanBoatSprite(boat.ctx,bw,bh);
  const root = document.documentElement.style;
  root.setProperty('--caustic-url',`url(${makeCausticTile()})`);
  root.setProperty('--fish-scene-url',`url(${scene.c.toDataURL()})`);
  root.setProperty('--fisherman-boat-url',`url(${boat.c.toDataURL()})`);
  if(fisherEl){ fisherWidthPx = bw; fisherHeightPx = bh; }
}
// single GPU-composited transform instead of animating `top` (no per-frame layout)
function applyFisherY(){
  const field = document.getElementById('fish-field'), el = document.getElementById('fisherman');
  if(!field || !el) return;
  el.style.transform = `translateY(${(fisherYPct/100)*field.clientHeight - fisherHeightPx*0.5}px)`;
}

/* ============================================================
   DAY-NIGHT CYCLE — one loop = DAY_CYCLE_MS (change it to retime the whole cycle).
   Phase 0 = sunrise; 0.68 = sunset; the rest is dusk/night/dawn. Updated ~5x/sec
   by setting a few CSS values (tint colour, sun/moon position, light opacity),
   so it costs almost nothing per frame.
   ============================================================ */
const DAY_CYCLE_MS = 10*60*1000;
const DN_STOPS = [ // [phase, r,g,b, tintAlpha, night]
  [0,    255,150,100,0.22,0.10],[0.10, 255,190,130,0.10,0],[0.22, 255,255,255,0,0],[0.50, 255,240,200,0.03,0],
  [0.58, 255,150, 90,0.14,0],[0.66, 255,110, 70,0.24,0.15],[0.74, 40, 40,100,0.38,0.70],[0.82, 8,20,58,0.52,1],
  [0.92, 8,20,58,0.52,1],[0.97, 60,50,100,0.38,0.50],[1,    255,150,100,0.22,0.10]
];
let dnStart = 0, dnTimer = null, dnLightsBuilt = false;
function dnSample(p){
  let i=0; while(i<DN_STOPS.length-2 && p>DN_STOPS[i+1][0]) i++;
  const a=DN_STOPS[i], b=DN_STOPS[i+1], t=Math.max(0,Math.min(1,(p-a[0])/(b[0]-a[0]))), e=t*t*(3-2*t);
  return a.slice(1).map((v,k)=> v+(b[k+1]-v)*e);
}
function buildIslandLights(){
  const box = document.getElementById('dn-lights'); if(!box) return;
  let seed=11; const r=()=>{ seed=(seed*9301+49297)%233280; return seed/233280; };
  let h = '<div class="dn-town-glow"></div>';
  for(let i=0;i<22;i++){
    const f = 0.14 + r()*0.78, x = 58 + f*40, y = 30.3 + r()*3.2 - Math.sin(f*Math.PI)*1.6;
    h += `<i class="${r()<0.3?'tall':''}" style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%;opacity:${(0.65+r()*0.35).toFixed(2)}"></i>`;
    if(i%3===0) h += `<i class="refl" style="left:${x.toFixed(1)}%;top:${(35.6+r()*1.5).toFixed(1)}%"></i>`;
  }
  box.innerHTML = h;
  const st = document.getElementById('dn-stars');
  if(st && !st.firstChild){ let s2=''; for(let i=0;i<46;i++) s2 += `<i style="left:${(r()*100).toFixed(1)}%;top:${(r()*92).toFixed(1)}%;opacity:${(0.4+r()*0.6).toFixed(2)}"></i>`; st.innerHTML = s2; }
}
function updateDayNight(){
  const field = document.getElementById('fish-field');
  if(!field || field.classList.contains('hidden') || document.hidden) return;
  const p = (((performance.now()-dnStart)/DAY_CYCLE_MS)%1+1)%1;
  const fw = field.clientWidth, fh = field.clientHeight, hz = fh*0.30;
  const [r,g,b,a,n] = dnSample(p);
  document.getElementById('dn-tint').style.backgroundColor = `rgba(${r|0},${g|0},${b|0},${a.toFixed(3)})`;
  document.getElementById('dn-lights').style.opacity = Math.max(0,Math.min(1,(n-0.3)/0.6)).toFixed(2);
  document.getElementById('dn-stars').style.opacity = Math.max(0,(n-0.5)*2).toFixed(2);
  const sp = p/0.68, sun = document.getElementById('dn-sun'), sl = document.getElementById('dn-sunlayer');
  if(sp <= 1){
    const sx = fw*(0.1+0.8*sp), elev = Math.sin(Math.PI*sp);
    sun.style.display = ''; sun.style.transform = `translate(${sx}px,${hz - elev*fh*0.21}px)`;
    sl.style.transform = `translateX(${sx - fw/2}px)`; sl.style.opacity = (Math.pow(elev,0.7)*(1-n)).toFixed(2);
  } else { sun.style.display = 'none'; sl.style.opacity = 0; }
  const q = p<0.2 ? p+1 : p, mp = (q-0.64)/0.40, moon = document.getElementById('dn-moon');
  if(mp > 0 && mp < 1){
    moon.style.transform = `translate(${fw*(0.1+0.8*mp)}px,${hz - Math.sin(Math.PI*mp)*fh*0.2}px)`;
    moon.style.opacity = Math.min(1,n*2).toFixed(2);
  } else moon.style.opacity = 0;
}
window.__dnSetPhase = ph=>{ dnStart = performance.now() - ph*DAY_CYCLE_MS; updateDayNight(); }; // dev/test hook
function startDayNight(){
  dnStart = performance.now();
  if(!dnTimer) dnTimer = setInterval(updateDayNight, 200);
  updateDayNight();
}
let fishArtResizeTimer = null;
document.addEventListener('visibilitychange',()=>{ const f=document.getElementById('fish-field'); if(f) f.classList.toggle('fx-paused',document.hidden); });
if((navigator.hardwareConcurrency||8) <= 4 || (navigator.deviceMemory||8) <= 4) document.documentElement.classList.add('lowfx');
window.addEventListener('resize',()=>{
  if(selectedGame !== 'fish') return;
  clearTimeout(fishArtResizeTimer);
  fishArtResizeTimer = setTimeout(()=>{ renderFishArt(); applyFisherY(); },150);
});

/* ---- Fishtions: player-controlled fisherman & hook-catch physics ---- */
const FISHER_SPEED_PCT = 150; // % of lane-band height per second
let fishSwimDistance = 780; // px — recomputed to match the field's actual width each round (see renderFishField)
const FISH_CATCH_PROGRESS_START = 0.12; // catching possible fairly early since fish cross the whole width
const FISH_CATCH_PROGRESS_END = 0.92;
let fisherYPct = 50; // 0-100 within the water lane band
let fisherMoveDir = 0;
let fisherDragActive = false;
let fishSwimStart = 0;
let fishList = []; // {el, opt, laneYPct}

function renderFishField(){
  renderFishArt();
  const field = document.getElementById('fish-field');
  field.querySelectorAll('.fish-obj').forEach(m=>m.remove());
  const laneWrap = document.getElementById('fish-lanes');
  if(laneWrap) laneWrap.innerHTML = '';
  fishAnswered = false;
  renderLives();

  const opts = currentQuestion.options;
  const laneCount = opts.length;
  // lanes span the water band only (fisherman/hook stay clear of the sky area)
  const laneTop = 40, laneBottom = 90; // % of field height
  const laneStep = laneCount > 1 ? (laneBottom-laneTop)/(laneCount-1) : 0;
  fisherYPct = laneTop + (laneBottom-laneTop)/2;

  const fisherEl = document.getElementById('fisherman');
  applyFisherY();
  fishAimTarget = null;

  ['fish-rod','fish-hook','fish-line'].forEach(id=>{ const e=document.getElementById(id); if(e) e.classList.remove('bend','tug'); });
  fishList = [];
  const fieldWidth = field.clientWidth;
  // Recompute how far a fish needs to swim to cross from the right edge to the
  // fisherman's hook near the left edge, matching however wide the field
  // actually is right now (it scales responsively with the viewport).
  fishSwimDistance = fieldWidth + 80;
  // Shuffle which of the 4 neutral color variants each fish gets — colors are
  // never tied to correctness, so players must actually read the fraction.
  const colorVariants = shuffle(['fish-c1','fish-c2','fish-c3','fish-c4']);
  opts.forEach((opt,i)=>{
    const laneYPct = laneCount > 1 ? laneTop + laneStep*i : (laneTop+laneBottom)/2;
    if(laneWrap){
      const line = document.createElement('div');
      line.className = 'lane-line';
      line.style.top = laneYPct + '%';
      laneWrap.appendChild(line);
    }
    const el = document.createElement('div');
    const isGood = opt === currentQuestion.correct;
    const species = ['sp-slim','sp-round','sp-stripe','sp-slim'][Math.floor(Math.random()*4)];
    el.className = 'fish-obj ' + colorVariants[i % colorVariants.length] + ' ' + species;
    if(isGood) el.dataset.correct = '1';
    el.dataset.value = opt;
    el.style.top = `calc(${laneYPct}% - 22px)`;
    el.style.left = fieldWidth + 'px';
    el.style.setProperty('--swim-distance', (-fishSwimDistance) + 'px');
    el.innerHTML = `<div class="fsprite" style="background-image:${getFishSprite(colorVariants[i % colorVariants.length],species)};animation-delay:-${(Math.random()*0.6).toFixed(2)}s"></div><div class="fbody"><span class="flabel">${formatFracDisplay(opt)}</span></div>`;
    el.style.animationDuration = timeTotal + 's';
    // Tapping/pointing at a fish directly aims the rod at it and snaps the hook
    // to its lane — the actual catch still happens through the hook physics below.
    el.addEventListener('click', ()=>{
      if(fishAnswered) return;
      fisherYPct = laneYPct;
      applyFisherY();
      fishAimTarget = fishObj;
      aimRodAt(fishObj);
    });
    field.appendChild(el);
    requestAnimationFrame(()=> el.classList.add('swim'));
    const fishObj = { el, opt, laneYPct };
    fishList.push(fishObj);
  });

  aimRodAt(pickAimTarget());
  fishSwimStart = performance.now();
  if(fishRAF) cancelAnimationFrame(fishRAF);
  fishRAF = requestAnimationFrame(fishTick);
}

let fishAimTarget = null; // the fish object the rod is currently pointed at

function pickAimTarget(){
  if(fishAimTarget && !fishAimTarget.caught && fishList.includes(fishAimTarget)) return fishAimTarget;
  const field = document.getElementById('fish-field');
  const fieldWidth = field ? field.clientWidth : 600;
  const elapsed = performance.now() - fishSwimStart;
  const progress = Math.max(0, Math.min(1, elapsed/(timeTotal*1000)));
  const traveled = progress * fishSwimDistance;
  let best = null, bestScore = Infinity;
  for(const f of fishList){
    if(f.caught) continue;
    const laneDiff = Math.abs(f.laneYPct - fisherYPct);
    const fishX = fieldWidth - traveled + 42;
    // weight lane match heavily (the fisherman must be roughly level with it to reach it)
    // and horizontal distance lightly, so the rod naturally tracks whichever fish is
    // closest to a real catch.
    const score = laneDiff*4 + Math.abs(fishX-90)/40;
    if(score < bestScore){ bestScore = score; best = f; }
  }
  fishAimTarget = best;
  return best;
}

/* Rotates the rod to point at the target fish and plants the hook right at the
   rod's tip, so the whole rig visibly "aims" wherever the player is pointing or
   has picked. Purely visual — the actual catch collision below is still driven
   by fisherYPct vs. each fish's lane, so this can't desync gameplay. */
function traveledNow(p){ return Math.min(1,Math.max(0,p)) * fishSwimDistance; }
let hookAbsX = 0; // field-absolute hook x, cached so the catch hitbox matches what's drawn
function aimRodAt(target){
  const field = document.getElementById('fish-field'), rodEl = document.getElementById('fish-rod');
  const hookEl = document.getElementById('fish-hook'), lineEl = document.getElementById('fish-line');
  if(!field || !rodEl || !hookEl) return;
  const fw = field.clientWidth, fh = field.clientHeight;
  // pivot = the fisherman's rod hand, drawn at (75,83) of the 100x150 sprite
  const pivot = { x: fisherWidthPx*0.75, y: fisherHeightPx*0.553 };
  const leftPx = fw*0.03; // .fisherman{left:3%}
  const topPx = (fisherYPct/100)*fh - fisherHeightPx*0.5; // same as applyFisherY()
  let t;
  if(target){
    const progress = Math.max(0, Math.min(1, (performance.now()-fishSwimStart)/(timeTotal*1000)));
    t = { x: fw - progress*fishSwimDistance + 42 - leftPx, y: (target.laneYPct/100)*fh - topPx };
  } else {
    t = { x: pivot.x + fisherWidthPx*0.38, y: pivot.y + fisherWidthPx*0.77 };
  }
  const ang = Math.max(8, Math.min(85, Math.atan2(t.y-pivot.y, t.x-pivot.x)*180/Math.PI));
  const len = fisherWidthPx*0.436, hw = fisherWidthPx*0.179, rad = ang*Math.PI/180;
  const tip = { x: pivot.x + len*Math.cos(rad), y: pivot.y + len*Math.sin(rad) };
  const rs = rodEl.style; rs.left = pivot.x+'px'; rs.top = pivot.y+'px'; rs.width = len+'px'; rs.transform = `rotate(${ang}deg)`;
  // the line hangs straight down from the rod tip; the hook's eye sits on the line's end and
  // the hook always dangles below the boat's waterline (waterline ~ 82% of the sprite height)
  const waterY = fisherHeightPx*0.82, hookH = hw*1.57;
  const hookTop = Math.max(tip.y + hw*1.2, waterY + hw*0.25), lineH = hookTop - tip.y;
  const hs = hookEl.style; hs.width = hw+'px'; hs.height = hookH+'px'; hs.left = (tip.x-hw/2)+'px'; hs.top = hookTop+'px';
  if(lineEl){ const ls = lineEl.style; ls.left = (tip.x-0.8)+'px'; ls.top = tip.y+'px'; ls.height = lineH+'px';
    // dry line above the water, slightly tinted/fainter once it is under the surface
    const wp = Math.max(0,Math.min(100,(waterY-tip.y)/lineH*100));
    ls.background = `linear-gradient(180deg,rgba(255,255,255,0.9) 0 ${wp}%,rgba(190,225,245,0.5) ${wp}% 100%)`; }
  hookAbsX = leftPx + tip.x;
}

let fishLastTs = 0;
function fishTick(ts){
  if(!fishLastTs) fishLastTs = ts;
  const dt = Math.min(0.05, (ts - fishLastTs)/1000);
  fishLastTs = ts;

  const field = document.getElementById('fish-field');
  const fisherEl = document.getElementById('fisherman');
  if(!field || !fisherEl || fishAnswered){ fishLastTs = 0; return; }

  if(fisherMoveDir !== 0){
    fisherYPct += fisherMoveDir * FISHER_SPEED_PCT * dt * 0.4;
    fisherYPct = Math.min(90, Math.max(38, fisherYPct));
    applyFisherY();
  }
  aimRodAt(pickAimTarget());

  const fieldHeight = field.clientHeight;
  const elapsed = performance.now() - fishSwimStart;
  const progress = elapsed / (timeTotal*1000);

  // a fish closing in on the hook makes the rod flex — the "it's biting!" cue
  const tr = traveledNow(progress);
  const rodEl = document.getElementById('fish-rod');
  if(rodEl) rodEl.classList.toggle('bend', fishList.some(f=> !f.caught && Math.abs(field.clientWidth - tr + 42 - hookAbsX) < 150 && Math.abs(f.laneYPct - fisherYPct) < 7));

  if(progress >= FISH_CATCH_PROGRESS_START && progress <= FISH_CATCH_PROGRESS_END){
    for(const f of fishList){
      if(f.caught) continue;
      // fish currently swum this far left of its start position
      const traveled = Math.min(1, progress) * fishSwimDistance;
      const fishLeftEdge = field.clientWidth - traveled; // el.style.left is the fish's left edge; swim animation shifts it left by `traveled`
      const fishCenterPx = fishLeftEdge + 42; // + half of the 84px fish width
      const laneDiffPct = Math.abs(f.laneYPct - fisherYPct);
      if(Math.abs(fishCenterPx - hookAbsX) < 46 && laneDiffPct < 7){
        resolveFishCatch(f);
        break;
      }
    }
  }

  if(!fishAnswered){
    fishRAF = requestAnimationFrame(fishTick);
  } else {
    fishLastTs = 0;
  }
}

function spawnSplash(x,y,big){
  const layer = document.getElementById('fish-splash'); if(!layer) return;
  const el = document.createElement('div');
  el.className = 'splash' + (big ? ' splash-big' : '');
  el.style.left = x+'px'; el.style.top = y+'px';
  layer.appendChild(el);
  el.addEventListener('animationend',()=>el.remove());
  setTimeout(()=>{ if(el.parentNode) el.remove(); },900);
}

function resolveFishCatch(f){
  if(fishAnswered) return;
  fishAnswered = true;
  const correct = f.opt === currentQuestion.correct;
  f.caught = true;
  f.el.classList.add(correct ? 'caughtgood' : 'caughtbad');
  f.el.style.animationPlayState = 'paused';
  document.querySelectorAll('.fish-obj').forEach(x=> x.style.pointerEvents='none');
  f.el.classList.add('struggle');
  ['fish-rod','fish-hook','fish-line'].forEach(id=>{ const e=document.getElementById(id); if(e) e.classList.add(id==='fish-rod'?'bend':'tug'); });
  const hk = document.getElementById('fish-hook'), fld = document.getElementById('fish-field');
  if(hk && fld){ const hr=hk.getBoundingClientRect(), fr=fld.getBoundingClientRect(); spawnSplash(hr.left-fr.left+hr.width/2, hr.top-fr.top+hr.height/2, true); }
  animateFisherman(correct);
  if(correct){
    toast('Wonderful fish! Correct catch! 🎣✨');
  } else {
    round.lives = Math.max(0, round.lives - 1);
    renderLives();
    toast(`Ouch — that fish bit back! Correct answer was ${currentQuestion.correct}`);
  }
  onRoundQuestionEnd(correct);
}

function animateFisherman(caught){
  const fisherman = document.getElementById('fisherman');
  if(!fisherman) return;
  fisherman.classList.remove('catch','miss');
  void fisherman.offsetWidth;
  fisherman.classList.add(caught ? 'catch' : 'miss');
}

/* Drag controls for the fisherman's hook (keyboard handled alongside the farmer's, above) */
(function initFishDrag(){
  const field = document.getElementById('fish-field');
  if(!field) return;
  function moveTo(clientY){
    const rect = field.getBoundingClientRect();
    const pct = ((clientY - rect.top) / rect.height) * 100;
    fisherYPct = Math.min(90, Math.max(38, pct));
    const fisherEl = document.getElementById('fisherman');
    applyFisherY();
  }
  field.addEventListener('pointerdown', (e)=>{ fisherDragActive = true; moveTo(e.clientY); });
  field.addEventListener('pointermove', (e)=>{ if(fisherDragActive) moveTo(e.clientY); });
  window.addEventListener('pointerup', ()=>{ fisherDragActive = false; });
  field.addEventListener('pointerleave', ()=>{ fisherDragActive = false; });
})();

/* ============================================================
   S-FRAC — top-down "drone view" jungle arena.
   Ground, foliage, log border and the snake are canvas-drawn (the static
   scene only repaints on resize); sway/dapple/spore effects are tiny CSS
   layers. The snake roams the arena freely (arrows/WASD or drag/tap) and
   eats the avocado carrying the answer; answers are scattered on wooden pads.
   ============================================================ */
const SNAKE_MIN_SIZE = 1, SNAKE_MAX_SIZE = 8;
let snakeMoveDir = 0, snakeMoveY = 0, snakeDragActive = false, snakeTarget = null;
let avocadoList = []; // {el, pad, opt, fx, fy, cx, cy}
let snakeArena = null, snakeBorderT = 16, snakeK = 1, snakeDpr = 1, snakeSk = 1, snakeBgKey = '';
const snakeHead = { x:0, y:0, ang:-Math.PI/2 };
let snakePath = [];

function drawSnakeScene(ctx,W,H,A,T){
  let seed = Math.round(W*7+H*13); const rnd=()=>{ seed=(seed*9301+49297)%233280; return seed/233280; };
  const rr=(a,b)=>a+rnd()*(b-a), pick=a=>a[Math.floor(rnd()*a.length)];
  const aw=A.r-A.l, ah=A.b-A.t, u=Math.min(W,H)/700, TAU=Math.PI*2;
  const blob=(x,y,r,rgb,a)=>{ const g=ctx.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,`rgba(${rgb},${a})`); g.addColorStop(1,`rgba(${rgb},0)`); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,TAU); ctx.fill(); };
  const rrPath=(x,y,w,h,r)=>{ ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); };
  const frond=(x,y,len,ang,w,c1,c2)=>{
    ctx.save(); ctx.translate(x,y); ctx.rotate(ang);
    const g=ctx.createLinearGradient(0,0,len,0); g.addColorStop(0,c1); g.addColorStop(1,c2); ctx.fillStyle=g;
    ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(len*0.4,-w,len,0); ctx.quadraticCurveTo(len*0.4,w,0,0); ctx.fill();
    ctx.strokeStyle='rgba(8,36,14,0.5)'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(len*0.95,0); ctx.stroke();
    ctx.lineWidth=1; for(let k=1;k<6;k++){ const px=len*k/6, pw=w*Math.sin(Math.PI*k/6)*0.8; ctx.beginPath(); ctx.moveTo(px,0); ctx.lineTo(px+len*0.08,-pw); ctx.moveTo(px,0); ctx.lineTo(px+len*0.08,pw); ctx.stroke(); }
    ctx.restore();
  };
  const palm=(x,y,len)=>{
    const n=8, off=rnd()*TAU;
    for(let k=0;k<n;k++) frond(x+5,y+7,len,off+k*TAU/n,len*0.2,'rgba(0,0,0,0.26)','rgba(0,0,0,0.26)');
    for(let k=0;k<n;k++) frond(x,y,len,off+k*TAU/n+rr(-0.12,0.12),len*0.2,pick(['#1f6b2e','#2a7a34','#237030']),pick(['#4fa43e','#5db048','#46963a']));
    blob(x,y,len*0.16,'210,240,150',0.5); ctx.fillStyle='#173f1c'; ctx.beginPath(); ctx.arc(x,y,len*0.07,0,TAU); ctx.fill();
  };
  const crown=(x,y,r)=>{
    blob(x+8,y+12,r*1.05,'0,0,0',0.35);
    for(let k=0;k<9;k++){ const a=rnd()*TAU, d=rnd()*r*0.55, cx=x+Math.cos(a)*d, cy=y+Math.sin(a)*d, cr=r*rr(0.35,0.6);
      const g=ctx.createRadialGradient(cx-cr*0.3,cy-cr*0.3,cr*0.1,cx,cy,cr); g.addColorStop(0,pick(['#3f8a3c','#4c9a40','#357a35'])); g.addColorStop(1,'#154a22');
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,cr,0,TAU); ctx.fill(); }
  };

  // 1. dark jungle floor (everything outside the arena)
  ctx.fillStyle='#1d4426'; ctx.fillRect(0,0,W,H);
  for(let i=0;i<200;i++) blob(rnd()*W,rnd()*H,rr(26,80)*u+18,pick(['12,48,22','40,98,44','8,32,16','70,120,50']),0.35);

  // 2. arena ground: soil, grass, moss, pebbles, leaf litter, flowers
  ctx.save(); ctx.beginPath(); rrPath(A.l,A.t,aw,ah,16); ctx.clip();
  const gg=ctx.createLinearGradient(0,A.t,0,A.b); gg.addColorStop(0,'#a8905c'); gg.addColorStop(1,'#8a7449'); ctx.fillStyle=gg; ctx.fillRect(A.l,A.t,aw,ah);
  const at=()=>[A.l+rnd()*aw, A.t+rnd()*ah];
  for(let i=0;i<150;i++){ const [x,y]=at(); blob(x,y,rr(22,70)*u+12,pick(['110,150,70','90,70,40','70,120,50','140,110,70']),0.34); }
  for(let i=0;i<30;i++){ const [x,y]=at(); blob(x,y,rr(18,46)*u+10,'62,110,48',0.5); } // moss
  for(let i=0;i<2600;i++){ const [x,y]=at(); ctx.fillStyle=rnd()<0.5?'rgba(60,40,15,0.22)':'rgba(255,240,190,0.16)'; ctx.fillRect(x,y,1+rnd()*1.6,1+rnd()*1.6); }
  ctx.lineCap='round';
  for(let i=0;i<240;i++){ const [x,y]=at(), h=rr(5,10)*u+3; ctx.strokeStyle=pick(['#4f8a3a','#7fb04a','#3f7a30','#9cc65a']); ctx.lineWidth=1.4;
    for(let b=-1;b<=1;b++){ ctx.beginPath(); ctx.moveTo(x+b*2,y); ctx.quadraticCurveTo(x+b*3,y-h*0.6,x+b*5,y-h); ctx.stroke(); } }
  for(let i=0;i<40;i++){ const [x,y]=at(), s=rr(2.5,6)*u+1.5; ctx.fillStyle='rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(x+1.5,y+2,s,s*0.7,0,0,TAU); ctx.fill();
    ctx.fillStyle=pick(['#8d8f86','#a39f92','#77796f']); ctx.beginPath(); ctx.ellipse(x,y,s,s*0.72,0,0,TAU); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.ellipse(x-s*0.25,y-s*0.25,s*0.45,s*0.25,0,0,TAU); ctx.fill(); }
  for(let i=0;i<46;i++){ const [x,y]=at(); ctx.save(); ctx.translate(x,y); ctx.rotate(rnd()*TAU); ctx.fillStyle=pick(['#c99a3a','#a8542a','#6b9a3a','#b8742e']);
    ctx.beginPath(); ctx.ellipse(0,0,rr(4,8)*u+2,rr(2,3.5)*u+1,0,0,TAU); ctx.fill(); ctx.restore(); }
  ctx.strokeStyle='#5a3d20'; ctx.lineWidth=2;
  for(let i=0;i<18;i++){ const [x,y]=at(), a=rnd()*TAU, l=rr(10,24)*u+6; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l); ctx.stroke(); }
  for(let i=0;i<16;i++){ const [x,y]=at(), c=pick(['#fff','#ffb6c8','#ffe066']); ctx.fillStyle=c;
    for(let p=0;p<5;p++){ ctx.beginPath(); ctx.arc(x+Math.cos(p*1.256)*2.4,y+Math.sin(p*1.256)*2.4,1.7,0,TAU); ctx.fill(); }
    ctx.fillStyle='#e8a317'; ctx.beginPath(); ctx.arc(x,y,1.5,0,TAU); ctx.fill(); }
  for(let i=0;i<10;i++){ const [x,y]=at(); blob(x,y,rr(70,160)*u+30,'255,240,170',0.12); }  // dappled light
  for(let i=0;i<8;i++){ const [x,y]=at(); blob(x,y,rr(60,130)*u+26,'5,25,5',0.16); }      // canopy shade
  const vg=ctx.createRadialGradient(A.l+aw/2,A.t+ah/2,Math.min(aw,ah)*0.35,A.l+aw/2,A.t+ah/2,Math.max(aw,ah)*0.62);
  vg.addColorStop(0,'rgba(10,30,10,0)'); vg.addColorStop(1,'rgba(10,30,10,0.34)'); ctx.fillStyle=vg; ctx.fillRect(A.l,A.t,aw,ah);
  ctx.restore();

  // 3. dense foliage, only outside the arena
  ctx.save(); ctx.beginPath(); ctx.rect(0,0,W,H); rrPath(A.l-T*0.3,A.t-T*0.3,aw+T*0.6,ah+T*0.6,18); ctx.clip('evenodd');
  [[0,0],[W,0],[0,H],[W,H]].forEach(([x,y])=>crown(x,y,(95*u+55)));
  for(let x=W*0.15;x<W;x+=W*0.28) crown(x+rr(-30,30),rr(0,A.t*0.55),rr(60,85)*u+30);
  for(let x=0;x<W;x+=rr(80,130)*u+30) palm(x,rr(8,Math.max(12,A.t-26)),rr(52,84)*u+26);
  if(H-A.b>40) for(let x=0;x<W;x+=rr(80,130)*u+30) palm(x,rr(A.b+24,H-6),rr(44,70)*u+22);
  for(let y=A.t;y<A.b;y+=rr(70,110)*u+30){ palm(rr(4,Math.max(8,A.l-16)),y,rr(44,66)*u+22); palm(rr(Math.min(W-8,A.r+16),W-4),y+rr(-20,20),rr(44,66)*u+22); }
  ctx.restore();

  // 4. log border with moss, stone corner posts, vines
  ctx.save(); ctx.shadowColor='rgba(0,0,0,0.55)'; ctx.shadowBlur=10; ctx.shadowOffsetY=4;
  const logSeg=(cx,cy,len,horiz)=>{
    ctx.save(); ctx.translate(cx,cy); if(!horiz) ctx.rotate(Math.PI/2);
    const g=ctx.createLinearGradient(0,-T/2,0,T/2); g.addColorStop(0,'#b88650'); g.addColorStop(0.5,'#8a5a2e'); g.addColorStop(1,'#5b3a1f');
    ctx.fillStyle=g; ctx.strokeStyle='#25150a'; ctx.lineWidth=2; ctx.beginPath(); rrPath(-len/2,-T/2,len,T,T*0.42); ctx.fill(); ctx.stroke();
    ctx.shadowColor='transparent'; ctx.strokeStyle='rgba(40,20,5,0.35)'; ctx.lineWidth=1;
    [-0.22,0.04,0.28].forEach(f=>{ ctx.beginPath(); ctx.moveTo(-len/2+T*0.4,f*T); ctx.lineTo(len/2-T*0.4,f*T+rr(-1,1)); ctx.stroke(); });
    ctx.fillStyle='#4a2c14'; ctx.beginPath(); ctx.ellipse(rr(-len*0.3,len*0.3),rr(-T*0.15,T*0.15),T*0.18,T*0.12,0,0,TAU); ctx.fill();
    for(let m=0;m<2;m++){ const mx=rr(-len*0.4,len*0.4); ctx.fillStyle='rgba(90,165,60,0.9)'; ctx.beginPath(); ctx.ellipse(mx,-T*0.28,rr(7,15),T*0.2,0,0,TAU); ctx.fill();
      ctx.fillStyle='rgba(150,210,100,0.8)'; ctx.beginPath(); ctx.ellipse(mx-3,-T*0.32,4,T*0.09,0,0,TAU); ctx.fill(); }
    ctx.restore();
  };
  const edge=(x0,y0,x1,y1,horiz)=>{ const total=Math.hypot(x1-x0,y1-y0); let pos=0;
    while(pos<total){ const len=Math.min(rr(90,140),total-pos); if(len<20) break; const t=(pos+len/2)/total; logSeg(x0+(x1-x0)*t,y0+(y1-y0)*t,len+2,horiz); pos+=len; } };
  edge(A.l,A.t,A.r,A.t,true); edge(A.l,A.b,A.r,A.b,true); edge(A.l,A.t,A.l,A.b,false); edge(A.r,A.t,A.r,A.b,false);
  [[A.l,A.t],[A.r,A.t],[A.l,A.b],[A.r,A.b]].forEach(([x,y])=>{
    const R=T*1.2, g=ctx.createRadialGradient(x-R*0.3,y-R*0.3,R*0.1,x,y,R); g.addColorStop(0,'#cfd2c8'); g.addColorStop(1,'#6a6f67');
    ctx.fillStyle=g; ctx.strokeStyle='#22261f'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(x,y,R,0,TAU); ctx.fill(); ctx.stroke();
    ctx.shadowColor='transparent'; ctx.strokeStyle='rgba(30,35,28,0.5)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(x-R*0.5,y-R*0.1); ctx.lineTo(x+R*0.1,y+R*0.5); ctx.stroke();
    ctx.fillStyle='rgba(90,165,60,0.9)'; ctx.beginPath(); ctx.ellipse(x+R*0.25,y-R*0.55,R*0.5,R*0.22,0.4,0,TAU); ctx.fill();
  });
  ctx.restore();
  ctx.strokeStyle='rgba(20,10,0,0.5)'; ctx.lineWidth=2; ctx.beginPath(); rrPath(A.l+T/2,A.t+T/2,aw-T,ah-T,6); ctx.stroke();
  const vine=(x,y,dx,dy)=>{ // wavy vine hugging the border, with small leaves
    ctx.strokeStyle='#2e7a30'; ctx.lineWidth=2.4; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(x,y);
    const n=7, L=rr(80,150); let px=x,py=y; const pts=[[x,y]];
    for(let k=1;k<=n;k++){ const nx=x+dx*L*k/n+(dy?Math.sin(k*1.3)*8:0), ny=y+dy*L*k/n+(dx?Math.sin(k*1.3)*8:0); ctx.quadraticCurveTo(px,py,(px+nx)/2,(py+ny)/2); px=nx; py=ny; pts.push([nx,ny]); }
    ctx.stroke();
    pts.forEach(([lx,ly],k)=>{ if(k%1===0){ ctx.save(); ctx.translate(lx,ly); ctx.rotate(rnd()*TAU); ctx.fillStyle=pick(['#4fa83f','#3f9438','#68bb4c']); ctx.beginPath(); ctx.ellipse(5,0,6,2.8,0,0,TAU); ctx.fill(); ctx.restore(); } });
  };
  for(let i=0;i<4;i++){ vine(rr(A.l+30,A.r-170),A.t,1,0); vine(rr(A.l+30,A.r-170),A.b,1,0); }
  for(let i=0;i<3;i++){ vine(A.l,rr(A.t+30,A.b-170),0,1); vine(A.r,rr(A.t+30,A.b-170),0,1); }
  // a few leaves overhanging the corners (drawn last so they sit over the posts)
  [[A.l-4,A.t-4,-2.4],[A.r+4,A.t-4,-0.7],[A.l-4,A.b+4,2.4],[A.r+4,A.b+4,0.7]].forEach(([x,y,a])=>{
    for(let k=0;k<3;k++) frond(x,y,rr(46,70)*u+18,a+rr(-0.5,0.5),14*u+5,'#1f6b2e','#4fa43e'); });
}

function snakeLayoutMetrics(field){
  const W=field.clientWidth, H=field.clientHeight;
  const padX=Math.max(22,W*0.05), top=Math.max(116,H*(W<640?0.27:0.17)), bot=Math.max(54,H*0.085);
  snakeArena={ l:padX, r:W-padX, t:top, b:H-bot, W, H };
  snakeBorderT=Math.max(13,Math.min(22,Math.min(W,H)*0.022));
  snakeK=Math.max(0.7,Math.min(1.4,Math.min(W,H)/620));
  snakeDpr=Math.min(window.devicePixelRatio||1,1.5);
}
function snakeLayoutScene(field){
  snakeLayoutMetrics(field);
  const key = snakeArena.W+'x'+snakeArena.H;
  if(key === snakeBgKey) return false;
  snakeBgKey = key;
  ['snake-bg','snake-canvas'].forEach(id=>{ const c=document.getElementById(id); c.width=Math.round(snakeArena.W*snakeDpr); c.height=Math.round(snakeArena.H*snakeDpr); });
  const ctx=document.getElementById('snake-bg').getContext('2d'); ctx.setTransform(snakeDpr,0,0,snakeDpr,0,0);
  drawSnakeScene(ctx,snakeArena.W,snakeArena.H,snakeArena,snakeBorderT);
  buildSnakeFx();
  return true;
}
function buildSnakeFx(){
  const box=document.getElementById('jg-fx'); if(!box||!snakeArena) return;
  const A=snakeArena; let seed=5; const r=()=>{ seed=(seed*9301+49297)%233280; return seed/233280; };
  let h='';
  const fr=(x,y,ang,len)=>{ h+=`<i class="jg-frond" style="left:${x.toFixed(0)}px;top:${y.toFixed(0)}px;width:${len.toFixed(0)}px;--r:${ang}deg;animation-duration:${(4+r()*3).toFixed(1)}s;animation-delay:-${(r()*5).toFixed(1)}s"></i>`; };
  const L=Math.max(46,Math.min(A.W,A.H)*0.09);
  for(let x=A.l+40;x<A.r-20;x+=140+r()*40){ fr(x,A.t-4,-90+(r()-0.5)*50,L*(0.8+r()*0.5)); fr(x+60,A.b+4,90+(r()-0.5)*50,L*(0.8+r()*0.5)); }
  for(let y=A.t+50;y<A.b-20;y+=140+r()*40){ fr(A.l-4,y,180+(r()-0.5)*50,L*(0.8+r()*0.5)); fr(A.r+4,y+50,(r()-0.5)*50,L*(0.8+r()*0.5)); }
  for(let i=0;i<5;i++) h+=`<i class="jg-dapple" style="left:${(r()*80).toFixed(0)}%;top:${(r()*80).toFixed(0)}%;width:${(18+r()*14).toFixed(0)}%;height:${(22+r()*16).toFixed(0)}%;animation-duration:${(16+r()*10).toFixed(0)}s;animation-delay:-${(r()*14).toFixed(0)}s"></i>`;
  for(let i=0;i<14;i++) h+=`<i class="jg-spore" style="left:${(A.l+r()*(A.r-A.l)).toFixed(0)}px;top:${(A.t+40+r()*(A.b-A.t-60)).toFixed(0)}px;animation-duration:${(9+r()*7).toFixed(0)}s;animation-delay:-${(r()*12).toFixed(0)}s"></i>`;
  box.innerHTML=h;
}

function snakeR(){ return (9 + (round.snakeSize||1)*0.9) * snakeK; }
function snakeBounds(){
  const m = snakeBorderT/2 + snakeR()*1.45 + 3, A = snakeArena;
  return { l:A.l+m, r:A.r-m, t:A.t+m, b:A.b-m };
}
function applySnakeSize(){ if(snakeArena && snakePath.length) drawSnake(performance.now()); }

function initSnakeHead(){
  const B=snakeBounds(), A=snakeArena;
  snakeHead.x=(A.l+A.r)/2; snakeHead.y=(A.t+A.b)/2; snakeHead.ang=-Math.PI/2;
  // lay the tail out behind the head (down, then left/right, then up) so it always starts inside the arena
  snakePath=[{x:snakeHead.x,y:snakeHead.y}];
  let x=snakeHead.x, y=snakeHead.y, dx=0, dy=1, turns=0;
  const sideDx = snakeHead.x < (A.l+A.r)/2+1 ? -1 : 1;
  for(let i=0;i<170;i++){
    let nx=x+dx*3, ny=y+dy*3;
    if(nx<B.l||nx>B.r||ny<B.t||ny>B.b){ turns++; if(turns===1){ dx=sideDx; dy=0; } else if(turns===2){ dx=0; dy=-1; } else { dx=-dx; dy=0; } nx=x+dx*3; ny=y+dy*3; }
    x=Math.max(B.l,Math.min(B.r,nx)); y=Math.max(B.t,Math.min(B.b,ny)); snakePath.push({x,y});
  }
}
function pickSlotPositions(n){
  const A=snakeArena, T=snakeBorderT;
  const cols = n<=2 ? n : (n<=4 ? 2 : 3), rows = n<=2 ? 1 : 2;
  const sk = Math.max(0.55,Math.min(1,Math.min((A.r-A.l-2*T)/cols,(A.b-A.t-2*T)/rows)/135));
  const m = 58*sk, Pl=A.l+T+m, Pr=A.r-T-m, Pt=A.t+T+m, Pb=A.b-T-m;
  const cw=(Pr-Pl)/cols, ch=(Pb-Pt)/rows, cx0=(A.l+A.r)/2, cy0=(A.t+A.b)/2;
  const cells=[]; for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) cells.push([c,r]);
  const sh=shuffle(cells).slice(0,n), pts=[];
  sh.forEach(([c,r])=>{
    let x=0,y=0;
    for(let t=0;t<30;t++){
      x=Pl+(c+0.5+(Math.random()-0.5)*0.44)*cw; y=Pt+(r+0.5+(Math.random()-0.5)*0.44)*ch;
      const okSpread = pts.every(p=>Math.hypot(p.x-x,p.y-y)>=112*sk);
      if(okSpread && Math.hypot(x-cx0,y-cy0)>=100) break;
    }
    pts.push({x,y});
  });
  return { sk, pts:pts.map(p=>({ fx:(p.x-A.l)/(A.r-A.l), fy:(p.y-A.t)/(A.b-A.t) })) };
}
function positionSnakeSlots(){
  const A=snakeArena, field=document.getElementById('snake-field'); if(!field) return;
  field.style.setProperty('--sk',snakeSk);
  avocadoList.forEach(a=>{
    a.cx=A.l+a.fx*(A.r-A.l); a.cy=A.t+a.fy*(A.b-A.t);
    a.el.style.left=(a.cx-32)+'px'; a.el.style.top=(a.cy-34)+'px';
    const d=104*snakeSk; a.pad.style.left=a.cx+'px'; a.pad.style.top=(a.cy+10*snakeSk)+'px'; a.pad.style.width=a.pad.style.height=d+'px';
  });
}

/* ============================================================
   S-FRAC FRUIT COLLECTION
   Each answer pad gets its own fruit. The avocado is the original
   CSS fruit; the others are small stylized SVG sprites that all live
   in the same 64x72 box so sizes stay consistent from the top-down view.
   Fruit choice is cosmetic only: scoring/collision never look at it.
   ============================================================ */
let _fruitUid = 0;
const SNAKE_FRUIT_ART = {
  apple:(u)=>`<defs><radialGradient id="a${u}" cx="36%" cy="32%" r="75%"><stop offset="0" stop-color="#ff7a6b"/><stop offset=".45" stop-color="#e0262f"/><stop offset="1" stop-color="#9c1220"/></radialGradient></defs>
    <path d="M32 24C26 15 8 18 8 41C8 58 20 68 32 66C44 68 56 58 56 41C56 18 38 15 32 24Z" fill="url(#a${u})" stroke="#5b0d16" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M32 24C30 28 31 31 32 33" stroke="#7a0f1b" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/>
    <ellipse cx="19" cy="34" rx="5" ry="9" transform="rotate(18 19 34)" fill="#fff" opacity=".35"/>
    <g fill="#ffd9a0" opacity=".55"><circle cx="44" cy="36" r="1"/><circle cx="40" cy="50" r="1"/><circle cx="48" cy="46" r="1"/><circle cx="24" cy="54" r="1"/><circle cx="36" cy="58" r="1"/><circle cx="50" cy="32" r="1"/></g>
    <path d="M32 24C32 18 33 12 36 6" stroke="#6b4423" stroke-width="3.4" fill="none" stroke-linecap="round"/>
    <path d="M36 11C42 3 52 4 55 9C50 15 41 15 36 11Z" fill="#43a84a" stroke="#256b2d" stroke-width="1.6" stroke-linejoin="round"/><path d="M38 11C44 8 49 8 53 9" stroke="#2d7d35" stroke-width="1" fill="none"/>`,
  grapes:(u)=>{
    const pts=[[14,27],[26,26],[38,26],[50,27],[20,37],[32,37],[44,37],[26,48],[38,48],[32,59]];
    let g=`<defs><radialGradient id="g${u}" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#b58be0"/><stop offset=".55" stop-color="#6d3aa8"/><stop offset="1" stop-color="#3b1a66"/></radialGradient></defs>
    <path d="M32 20C32 14 33 10 38 6" stroke="#6b4423" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M36 9C42 2 52 3 55 8C50 14 41 14 36 9Z" fill="#43a84a" stroke="#256b2d" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M14 27L32 21L50 27M20 37L32 22L44 37M26 48L32 22L38 48" stroke="#6b4423" stroke-width="1.4" fill="none" opacity=".8"/>`;
    pts.slice().reverse().forEach(([x,y])=>{ g+=`<circle cx="${x}" cy="${y}" r="8.4" fill="url(#g${u})" stroke="#2a114a" stroke-width="1.6"/><circle cx="${x-3}" cy="${y-3.2}" r="2.4" fill="#fff" opacity=".55"/><circle cx="${x+2.5}" cy="${y+3}" r="3" fill="#d9bdf5" opacity=".18"/>`; });
    return g; },
  strawberry:(u)=>{
    let seeds='';
    [[20,34],[32,30],[44,34],[14,44],[26,42],[38,42],[50,44],[20,52],[32,52],[44,52],[26,60],[38,60]].forEach(([x,y])=>{ seeds+=`<ellipse cx="${x}" cy="${y}" rx="1.3" ry="2" fill="#ffe27a" stroke="#a3651a" stroke-width=".5"/><circle cx="${x+1.8}" cy="${y+2.2}" r="1.6" fill="#8e1224" opacity=".35"/>`; });
    return `<defs><radialGradient id="s${u}" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#ff6a73"/><stop offset=".5" stop-color="#e0213a"/><stop offset="1" stop-color="#97122a"/></radialGradient></defs>
    <path d="M32 67C20 59 6 46 8 31C10 20 22 18 32 24C42 18 54 20 56 31C58 46 44 59 32 67Z" fill="url(#s${u})" stroke="#5e0c1d" stroke-width="2.4" stroke-linejoin="round"/>
    ${seeds}<ellipse cx="17" cy="32" rx="4" ry="7" transform="rotate(20 17 32)" fill="#fff" opacity=".3"/>
    <path d="M32 24L22 13L28 19L26 8L32 17L38 8L36 19L42 13Z" fill="#3fa24b" stroke="#23672c" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M32 22L14 18L26 25ZM32 22L50 18L38 25Z" fill="#4fb85a" stroke="#23672c" stroke-width="1.6" stroke-linejoin="round"/>`; },
  pear:(u)=>`<defs><linearGradient id="p${u}" x1="0.2" y1="0" x2="0.8" y2="1"><stop offset="0" stop-color="#a9cf4a"/><stop offset=".55" stop-color="#d6d94a"/><stop offset="1" stop-color="#eec440"/></linearGradient></defs>
    <path d="M32 13C38 13 40 22 42 29C44 35 57 41 57 52C57 63 46 69 32 69C18 69 7 63 7 52C7 41 20 35 22 29C24 22 26 13 32 13Z" fill="url(#p${u})" stroke="#6a6a14" stroke-width="2.4" stroke-linejoin="round"/>
    <ellipse cx="22" cy="48" rx="5" ry="9" transform="rotate(14 22 48)" fill="#fff" opacity=".35"/>
    <g fill="#8a7a1c" opacity=".4"><circle cx="42" cy="46" r="1"/><circle cx="46" cy="56" r="1"/><circle cx="36" cy="60" r="1"/><circle cx="29" cy="62" r="1"/><circle cx="40" cy="36" r="1"/><circle cx="14" cy="56" r="1"/></g>
    <path d="M32 14C32 9 34 5 37 2" stroke="#6b4423" stroke-width="3.4" fill="none" stroke-linecap="round"/>`,
  papaya:(u)=>{
    let seeds=''; [[32,26],[30,32],[34,34],[31,40],[35,44],[30,48],[33,52],[29,38],[36,29],[31,56],[34,60]].forEach(([x,y])=>{ seeds+=`<ellipse cx="${x}" cy="${y}" rx="2" ry="2.6" fill="#1b1b1b"/><circle cx="${x-.6}" cy="${y-.8}" r=".6" fill="#fff" opacity=".6"/>`; });
    return `<defs><linearGradient id="y${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb347"/><stop offset="1" stop-color="#f28a1e"/></linearGradient></defs>
    <g transform="rotate(-16 32 38)">
      <ellipse cx="32" cy="38" rx="21" ry="33" fill="#e9a52c" stroke="#7a4a0c" stroke-width="2.4"/>
      <path d="M13 28C11 36 12 44 17 52C15 44 14 36 16 28Z" fill="#7fae3c" opacity=".7"/><path d="M48 48C51 40 50 33 47 27C47 36 47 42 44 52Z" fill="#7fae3c" opacity=".55"/>
      <ellipse cx="32" cy="38" rx="17.5" ry="29.5" fill="url(#y${u})" stroke="#c7691a" stroke-width="1.4"/>
      <ellipse cx="32" cy="40" rx="8.5" ry="19" fill="#d8641a" opacity=".85"/>
      ${seeds}
      <ellipse cx="22" cy="24" rx="3" ry="8" fill="#fff" opacity=".25"/>
    </g>`; },
  guava:(u)=>{
    let seeds=''; for(let i=0;i<16;i++){ const a=i/16*Math.PI*2, r=i%2?9:14; seeds+=`<ellipse cx="${(32+Math.cos(a)*r*1.0).toFixed(1)}" cy="${(40+Math.sin(a)*r*1.05).toFixed(1)}" rx="1.1" ry="1.6" transform="rotate(${(a*57.3).toFixed(0)} ${(32+Math.cos(a)*r).toFixed(1)} ${(40+Math.sin(a)*r*1.05).toFixed(1)})" fill="#f3e6a0" stroke="#a08a3a" stroke-width=".4"/>`; }
    return `<defs><radialGradient id="u${u}" cx="50%" cy="50%" r="55%"><stop offset="0" stop-color="#f79aa6"/><stop offset=".6" stop-color="#fbb9bf"/><stop offset="1" stop-color="#fde6d3"/></radialGradient></defs>
    <ellipse cx="32" cy="40" rx="26" ry="28" fill="#a9d36a" stroke="#4e7a22" stroke-width="2.4"/>
    <ellipse cx="32" cy="40" rx="23" ry="25" fill="#d6e89a" stroke="#7fa23c" stroke-width="1.2"/>
    <ellipse cx="32" cy="40" rx="20.5" ry="22.5" fill="url(#u${u})"/>
    <ellipse cx="32" cy="40" rx="10" ry="11" fill="#fbd0d4" opacity=".7"/>${seeds}
    <g fill="#5f8a2a" opacity=".5"><circle cx="12" cy="30" r="1"/><circle cx="10" cy="46" r="1"/><circle cx="52" cy="28" r="1"/><circle cx="54" cy="48" r="1"/><circle cx="26" cy="66" r="1"/></g>
    <path d="M32 13C32 9 33 6 36 3" stroke="#6b4423" stroke-width="3.2" fill="none" stroke-linecap="round"/><path d="M27 13L32 17L37 13" stroke="#5b3a1c" stroke-width="2" fill="none" stroke-linecap="round"/>`; },
  lemon:(u)=>`<defs><radialGradient id="l${u}" cx="38%" cy="32%" r="80%"><stop offset="0" stop-color="#fff58a"/><stop offset=".55" stop-color="#fbe135"/><stop offset="1" stop-color="#d9b11a"/></radialGradient></defs>
    <g transform="rotate(-28 32 40)">
    <path d="M3 40C3 38 6 37 8 34C14 20 22 15 32 15C42 15 50 20 56 34C58 37 61 38 61 40C61 42 58 43 56 46C50 60 42 65 32 65C22 65 14 60 8 46C6 43 3 42 3 40Z" fill="url(#l${u})" stroke="#8a6d08" stroke-width="2.4" stroke-linejoin="round"/>
    <ellipse cx="24" cy="29" rx="9" ry="4.5" transform="rotate(-20 24 29)" fill="#fff" opacity=".4"/>
    <g fill="#b8940f" opacity=".5"><circle cx="40" cy="30" r=".9"/><circle cx="46" cy="40" r=".9"/><circle cx="38" cy="52" r=".9"/><circle cx="28" cy="56" r=".9"/><circle cx="18" cy="48" r=".9"/><circle cx="14" cy="38" r=".9"/><circle cx="34" cy="22" r=".9"/><circle cx="48" cy="52" r=".9"/><circle cx="22" cy="22" r=".9"/><circle cx="52" cy="34" r=".9"/></g>
    </g>`,
  peach:(u)=>`<defs><radialGradient id="h${u}" cx="62%" cy="55%" r="70%"><stop offset="0" stop-color="#ff7d6a"/><stop offset=".45" stop-color="#ffa45a"/><stop offset="1" stop-color="#f7c25c"/></radialGradient></defs>
    <path d="M32 20C20 13 6 23 8 41C10 58 22 68 32 66C42 68 54 58 56 41C58 23 44 13 32 20Z" fill="url(#h${u})" stroke="#9a4a1e" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M32 20C28 30 28 52 33 65" stroke="#b5502a" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".55"/>
    <ellipse cx="18" cy="35" rx="4.5" ry="8" transform="rotate(16 18 35)" fill="#fff" opacity=".35"/>
    <g fill="#fff" opacity=".35"><circle cx="40" cy="30" r=".8"/><circle cx="46" cy="42" r=".8"/><circle cx="42" cy="54" r=".8"/><circle cx="22" cy="54" r=".8"/><circle cx="14" cy="46" r=".8"/><circle cx="26" cy="28" r=".8"/><circle cx="50" cy="34" r=".8"/><circle cx="36" cy="62" r=".8"/></g>
    <path d="M32 21C32 15 33 11 36 7" stroke="#6b4423" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M36 11C42 3 53 4 56 9C51 15 42 15 36 11Z" fill="#43a84a" stroke="#256b2d" stroke-width="1.6" stroke-linejoin="round"/>`,
  blueberry:(u)=>`<defs><radialGradient id="b${u}" cx="36%" cy="30%" r="78%"><stop offset="0" stop-color="#7a86e0"/><stop offset=".5" stop-color="#3b3fa3"/><stop offset="1" stop-color="#1c1a5a"/></radialGradient></defs>
    <circle cx="32" cy="40" r="26.5" fill="url(#b${u})" stroke="#13123f" stroke-width="2.4"/>
    <circle cx="32" cy="40" r="26" fill="#cfd8ff" opacity=".16"/><ellipse cx="22" cy="28" rx="9" ry="6" transform="rotate(-30 22 28)" fill="#e6ebff" opacity=".3"/>
    <circle cx="32" cy="22" r="8" fill="#1a1850" opacity=".9"/>
    <path d="M32 14L34.4 19.6L40.4 18.6L36.9 23.4L40.4 28.2L34.4 27.2L32 32L29.6 27.2L23.6 28.2L27.1 23.4L23.6 18.6L29.6 19.6Z" fill="#3a3d95" stroke="#0f0e33" stroke-width="1.2" stroke-linejoin="round" transform="translate(0 -1) scale(1 1)" opacity=".95"/>`,
  kiwi:(u)=>{
    let seeds='', rays='';
    for(let i=0;i<14;i++){ const a=i/14*Math.PI*2; const x=32+Math.cos(a)*11.5, y=38+Math.sin(a)*14; seeds+=`<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="1.1" ry="2" transform="rotate(${(a*57.3+90).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="#1b1b1b"/>`; }
    for(let i=0;i<20;i++){ const a=i/20*Math.PI*2+0.1; rays+=`<line x1="${(32+Math.cos(a)*8).toFixed(1)}" y1="${(38+Math.sin(a)*10).toFixed(1)}" x2="${(32+Math.cos(a)*19).toFixed(1)}" y2="${(38+Math.sin(a)*23).toFixed(1)}"/>`; }
    return `<defs><radialGradient id="k${u}" cx="50%" cy="50%" r="55%"><stop offset="0" stop-color="#e9f5b8"/><stop offset=".3" stop-color="#9ed44a"/><stop offset="1" stop-color="#5aa62e"/></radialGradient></defs>
    <ellipse cx="32" cy="38" rx="26" ry="31" fill="#8a5a2b" stroke="#4a2c10" stroke-width="2.4"/>
    <ellipse cx="32" cy="38" rx="26" ry="31" fill="none" stroke="#c39a62" stroke-width="2" stroke-dasharray="1.2 2.2" opacity=".8"/>
    <ellipse cx="32" cy="38" rx="22.5" ry="27.5" fill="url(#k${u})" stroke="#3f7a1c" stroke-width="1.2"/>
    <g stroke="#d7ef9a" stroke-width=".9" opacity=".55">${rays}</g>
    <ellipse cx="32" cy="38" rx="8" ry="10" fill="#f4f8d2" opacity=".85"/>${seeds}`; }
};
window.__fruitArt = { art:SNAKE_FRUIT_ART, uid:()=>++_fruitUid }; // shared with the hub-world decorations
const SNAKE_FRUITS = ['avocado','apple','grapes','strawberry','pear','papaya','guava','lemon','peach','blueberry','kiwi'];
let _fruitDeck = [], _fruitRecent = [];
// Shuffled-deck draw: every fruit shows up once before any repeats, and a fresh
// deck keeps the last few fruits shown at the back so none returns too soon.
function nextSnakeFruit(){
  if(!_fruitDeck.length){
    _fruitDeck = shuffle(SNAKE_FRUITS.slice());
    const rec = _fruitRecent.slice(-4);
    _fruitDeck.sort((a,b)=> rec.includes(b) - rec.includes(a)); // recent first = drawn last (pop)
  }
  const f = _fruitDeck.pop();
  _fruitRecent.push(f); if(_fruitRecent.length > 8) _fruitRecent.shift();
  return f;
}
function snakeFruitHTML(fruit, label, fd){
  if(fruit === 'avocado' || !SNAKE_FRUIT_ART[fruit]) return `<div class="avo" style="--fd:-${fd}s">${label}</div>`;
  const svg = `<svg class="fa" viewBox="0 0 64 72" width="64" height="72" aria-hidden="true">${SNAKE_FRUIT_ART[fruit](++_fruitUid)}</svg>`;
  return `<div class="avo fruit-art f-${fruit}" style="--fd:-${fd}s">${svg}<span class="fl">${label}</span></div>`;
}

function renderSnakeField(){
  const field = document.getElementById('snake-field');
  field.querySelectorAll('.avocado-obj,.slot-pad').forEach(a=>a.remove());
  snakeAnswered = false; snakeTarget = null; snakeLastTs = 0;
  snakeLayoutScene(field);
  const snakeEl = document.getElementById('the-snake');
  if(snakeEl) snakeEl.classList.remove('catch','miss');

  const opts = currentQuestion.options, place = pickSlotPositions(opts.length);
  snakeSk = place.sk; avocadoList = [];
  opts.forEach((opt,i)=>{
    const pad = document.createElement('div'); pad.className='slot-pad'; field.appendChild(pad);
    const el = document.createElement('div');
    el.className = 'avocado-obj'; el.dataset.value = opt;
    el.style.animationDelay = '-' + (Math.random()*2).toFixed(2) + 's';
    el.innerHTML = snakeFruitHTML(nextSnakeFruit(), formatFracDisplay(opt), (Math.random()*4).toFixed(2));
    const a = { el, pad, opt, fx:place.pts[i].fx, fy:place.pts[i].fy, cx:0, cy:0 };
    // Tapping an avocado slithers the snake toward it — the catch still happens through collision.
    el.addEventListener('click', ()=>{ if(!snakeAnswered) snakeTarget = { x:a.cx, y:a.cy }; });
    field.appendChild(el); avocadoList.push(a);
  });
  positionSnakeSlots();
  initSnakeHead();
  drawSnake(performance.now());
  if(snakeRAF) cancelAnimationFrame(snakeRAF);
  snakeRAF = requestAnimationFrame(snakeTick);
}

function snakeSegments(n,sp){
  const out=[{x:snakePath[0].x,y:snakePath[0].y}]; let acc=0,target=sp;
  for(let i=1;i<snakePath.length && out.length<n;i++){
    const a=snakePath[i-1], b=snakePath[i], d=Math.hypot(b.x-a.x,b.y-a.y); if(d<=0) continue;
    while(acc+d>=target && out.length<n){ const t=(target-acc)/d; out.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t}); target+=sp; }
    acc+=d;
  }
  return out;
}
function drawSnake(ts){
  const cv=document.getElementById('snake-canvas'); if(!cv||!snakeArena||!snakePath.length) return;
  const ctx=cv.getContext('2d'); ctx.setTransform(snakeDpr,0,0,snakeDpr,0,0); ctx.clearRect(0,0,snakeArena.W,snakeArena.H);
  const s=round.snakeSize||1, k=snakeK, R=snakeR(), sp=R*0.72, len=(60+s*30)*k, n=Math.max(6,Math.round(len/sp)+1);
  const seg=snakeSegments(n,sp), TAU=Math.PI*2, m=seg.length;
  const rad=i=>R*(1-0.6*Math.pow(i/Math.max(1,m-1),2.4));
  ctx.fillStyle='rgba(0,0,0,0.24)'; for(let i=m-1;i>=0;i--){ ctx.beginPath(); ctx.ellipse(seg[i].x+4*k,seg[i].y+6*k,(i?rad(i):R*1.4)+1,(i?rad(i):R*1.4)*0.9,0,0,TAU); ctx.fill(); }
  ctx.fillStyle='#10301a'; for(let i=m-1;i>=1;i--){ ctx.beginPath(); ctx.arc(seg[i].x,seg[i].y,rad(i)+2.2,0,TAU); ctx.fill(); }
  ctx.fillStyle='#2fa845'; for(let i=m-1;i>=1;i--){ ctx.beginPath(); ctx.arc(seg[i].x,seg[i].y,rad(i),0,TAU); ctx.fill(); }
  ctx.lineCap='round'; ctx.strokeStyle='rgba(190,255,150,0.28)'; // lit spine
  for(let i=m-1;i>=1;i--){ ctx.lineWidth=rad(i)*0.7; ctx.beginPath(); ctx.moveTo(seg[i].x-rad(i)*0.18,seg[i].y-rad(i)*0.22); const q=seg[i-1]; ctx.lineTo(q.x-rad(i)*0.18,q.y-rad(i)*0.22); ctx.stroke(); }
  for(let i=m-2;i>=1;i--){ // yellow diamonds + dark side blotches
    const p=seg[i-1], q=seg[Math.min(m-1,i+1)], a=Math.atan2(p.y-q.y,p.x-q.x), r=rad(i);
    ctx.save(); ctx.translate(seg[i].x,seg[i].y); ctx.rotate(a);
    if(i%2===0){ ctx.fillStyle='#f2c94c'; ctx.strokeStyle='#7a5a10'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(r*0.62,0); ctx.lineTo(0,r*0.5); ctx.lineTo(-r*0.62,0); ctx.lineTo(0,-r*0.5); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else { ctx.fillStyle='rgba(12,70,32,0.55)'; ctx.beginPath(); ctx.ellipse(0,r*0.62,r*0.32,r*0.2,0,0,TAU); ctx.ellipse(0,-r*0.62,r*0.32,r*0.2,0,0,TAU); ctx.fill(); }
    ctx.restore();
  }
  // head: clearly larger and rounder, with eyes, nostrils and a flicking forked tongue
  const h=seg[0], HR=R*1.45+2, ph=(ts%2400)/2400, flick=ph>0.72&&ph<0.92;
  ctx.save(); ctx.translate(h.x,h.y); ctx.rotate(snakeHead.ang);
  if(flick){ const ext=Math.sin((ph-0.72)/0.2*Math.PI); ctx.strokeStyle='#d8324b'; ctx.lineWidth=Math.max(2,R*0.16); ctx.beginPath();
    ctx.moveTo(HR,0); ctx.lineTo(HR*(1+0.7*ext),0); ctx.moveTo(HR*(1+0.7*ext),0); ctx.lineTo(HR*(1+0.95*ext),-HR*0.22*ext); ctx.moveTo(HR*(1+0.7*ext),0); ctx.lineTo(HR*(1+0.95*ext),HR*0.22*ext); ctx.stroke(); }
  ctx.fillStyle='#10301a'; ctx.beginPath(); ctx.ellipse(HR*0.15,0,HR*1.2+2.2,HR*0.92+2.2,0,0,TAU); ctx.fill();
  const g=ctx.createRadialGradient(HR*0.1,-HR*0.3,HR*0.1,HR*0.15,0,HR*1.2); g.addColorStop(0,'#86e37c'); g.addColorStop(1,'#238f3a');
  ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(HR*0.15,0,HR*1.2,HR*0.92,0,0,TAU); ctx.fill();
  ctx.fillStyle='rgba(12,70,32,0.5)'; ctx.beginPath(); ctx.moveTo(-HR*0.5,0); ctx.lineTo(-HR*0.1,-HR*0.38); ctx.lineTo(HR*0.3,0); ctx.lineTo(-HR*0.1,HR*0.38); ctx.closePath(); ctx.fill();
  [-1,1].forEach(sd=>{
    ctx.fillStyle='#fff2b0'; ctx.strokeStyle='#10301a'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.arc(HR*0.5,sd*HR*0.55,HR*0.27,0,TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#1a1200'; ctx.beginPath(); ctx.ellipse(HR*0.54,sd*HR*0.55,HR*0.07,HR*0.19,0,0,TAU); ctx.fill();
    ctx.fillStyle='rgba(10,40,16,0.8)'; ctx.beginPath(); ctx.arc(HR*1.08,sd*HR*0.2,HR*0.055,0,TAU); ctx.fill();
  });
  ctx.restore();
}

let snakeLastTs = 0;
function snakeTick(ts){
  if(!snakeLastTs) snakeLastTs = ts;
  const dt = Math.min(0.05, (ts - snakeLastTs)/1000);
  snakeLastTs = ts;
  const field = document.getElementById('snake-field');
  if(!field || !snakeArena || snakeAnswered){ snakeLastTs = 0; return; }

  const A=snakeArena, B=snakeBounds();
  let vx=snakeMoveDir, vy=snakeMoveY, step=0, speed=((A.r-A.l)+(A.b-A.t))/2*0.7;
  if(vx||vy){ const l=Math.hypot(vx,vy); vx/=l; vy/=l; step=speed*dt; snakeTarget=null; }
  else if(snakeTarget){
    const dx=snakeTarget.x-snakeHead.x, dy=snakeTarget.y-snakeHead.y, d=Math.hypot(dx,dy);
    if(d>4){ vx=dx/d; vy=dy/d; step=Math.min(speed*1.25*dt,d); } else snakeTarget=null;
  }
  if(step>0){
    const nx=Math.max(B.l,Math.min(B.r,snakeHead.x+vx*step)), ny=Math.max(B.t,Math.min(B.b,snakeHead.y+vy*step));
    const moved=Math.hypot(nx-snakeHead.x,ny-snakeHead.y);
    if(moved>0.01){
      const want=Math.atan2(ny-snakeHead.y,nx-snakeHead.x); let diff=want-snakeHead.ang;
      while(diff>Math.PI) diff-=2*Math.PI; while(diff<-Math.PI) diff+=2*Math.PI;
      snakeHead.ang += diff*Math.min(1,dt*14);
      snakeHead.x=nx; snakeHead.y=ny;
      if(snakePath.length>1 && Math.hypot(nx-snakePath[1].x,ny-snakePath[1].y)<3){ snakePath[0]={x:nx,y:ny}; }
      else { snakePath.unshift({x:nx,y:ny}); if(snakePath.length>175) snakePath.length=175; }
    }
  }
  drawSnake(ts);

  const hitR = 24*snakeSk + snakeR()*0.9;
  for(const a of avocadoList){
    if(a.caught) continue;
    if(Math.hypot(a.cx-snakeHead.x,a.cy-snakeHead.y) < hitR){ resolveSnakeCatch(a); break; }
  }
  if(!snakeAnswered){ snakeRAF = requestAnimationFrame(snakeTick); } else { snakeLastTs = 0; }
}

function resolveSnakeCatch(a){
  if(snakeAnswered) return;
  snakeAnswered = true;
  const correct = a.opt === currentQuestion.correct;
  a.caught = true;
  a.el.classList.add(correct ? 'correctclick' : 'wrongclick');
  a.el.classList.add('eaten');
  document.querySelectorAll('.avocado-obj').forEach(x=> x.style.pointerEvents='none');
  round.snakeSize = Math.max(SNAKE_MIN_SIZE, Math.min(SNAKE_MAX_SIZE, (round.snakeSize||1) + (correct ? 1 : -1)));
  applySnakeSize();
  animateSnake(correct);
  if(correct) toast('Yum! The snake grows! 🐍🥑'); else toast(`The snake shrinks — correct answer was ${currentQuestion.correct}`);
  onRoundQuestionEnd(correct);
}

function animateSnake(caught){
  const snake = document.getElementById('the-snake');
  if(!snake) return;
  snake.classList.remove('catch','miss');
  void snake.offsetWidth;
  snake.classList.add(caught ? 'catch' : 'miss');
}

(function initSnakeDrag(){
  const field = document.getElementById('snake-field');
  if(!field) return;
  function steer(e){
    if(!snakeArena) return;
    const r=field.getBoundingClientRect(), B=snakeBounds();
    snakeTarget = { x:Math.max(B.l,Math.min(B.r,e.clientX-r.left)), y:Math.max(B.t,Math.min(B.b,e.clientY-r.top)) };
  }
  field.addEventListener('pointerdown', (e)=>{ snakeDragActive = true; steer(e); });
  field.addEventListener('pointermove', (e)=>{ if(snakeDragActive) steer(e); });
  window.addEventListener('pointerup', ()=>{ snakeDragActive = false; });
  field.addEventListener('pointerleave', ()=>{ snakeDragActive = false; });
})();
let snakeResizeTimer = null;
window.addEventListener('resize',()=>{
  if(selectedGame !== 'snake') return;
  clearTimeout(snakeResizeTimer);
  snakeResizeTimer = setTimeout(()=>{
    const field=document.getElementById('snake-field'), old=snakeArena;
    if(!field || !old || !field.clientWidth) return;
    const oldPath=snakePath.map(p=>({fx:(p.x-old.l)/(old.r-old.l),fy:(p.y-old.t)/(old.b-old.t)}));
    snakeLayoutScene(field); const A=snakeArena;
    snakePath=oldPath.map(p=>({x:A.l+p.fx*(A.r-A.l),y:A.t+p.fy*(A.b-A.t)}));
    snakeHead.x=snakePath[0].x; snakeHead.y=snakePath[0].y; snakeTarget=null;
    positionSnakeSlots(); drawSnake(performance.now());
  },150);
});

/* ---- S-Frac tiered ending: fireworks / confetti / dance / explode ---- */
const SNAKE_TIERS = [
  { min:10, title:'Congratulations, you got it all the correct answers!', fx:'fireworks', snakeFx:null },
  { min:8,  title:'Good Job, Keep up the Good Work!!!', fx:'confetti', snakeFx:null },
  { min:5,  title:"Needs more improvements, don't give up!!!", fx:null, snakeFx:'dance' },
  { min:0,  title:'Needs more acknowledgement — better luck next time.', fx:null, snakeFx:'explode' },
];
function pickSnakeTier(score){
  return SNAKE_TIERS.find(t => score >= t.min);
}

function spawnFireworks(container){
  const colors = ['#FFD84D','#FF6F59','#5FD068','#4FB0E8','#C77DFF','#FFA5D8'];
  for(let burst=0; burst<5; burst++){
    setTimeout(()=>{
      if(!container.isConnected) return;
      const cx = randInt(15,85), cy = randInt(15,58);
      for(let i=0;i<14;i++){
        const p = document.createElement('div');
        p.className = 'fw-burst';
        const angle = (Math.PI*2*i)/14;
        const dist = randInt(40,92);
        p.style.setProperty('--fx', Math.round(Math.cos(angle)*dist)+'px');
        p.style.setProperty('--fy', Math.round(Math.sin(angle)*dist)+'px');
        p.style.left = cx+'%'; p.style.top = cy+'%';
        p.style.background = colors[randInt(0,colors.length-1)];
        container.appendChild(p);
        setTimeout(()=> p.remove(), 1200);
      }
    }, burst*260);
  }
}

function spawnConfetti(container){
  const colors = ['#FFD84D','#FF6F59','#5FD068','#4FB0E8','#C77DFF','#FF9F45'];
  for(let i=0;i<44;i++){
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.left = randInt(0,100) + '%';
    p.style.background = colors[randInt(0,colors.length-1)];
    p.style.animationDuration = (randInt(18,32)/10) + 's';
    p.style.animationDelay = '-' + (Math.random()*2).toFixed(2) + 's';
    container.appendChild(p);
  }
}

function showSnakeEnding(score){
  const tier = pickSnakeTier(score);
  const overlay = document.getElementById('snake-ending');
  const fx = document.getElementById('ending-fx');
  if(!overlay || !fx) return;
  fx.innerHTML = '';
  document.getElementById('ending-title').textContent = tier.title;
  document.getElementById('ending-score').textContent = score;
  overlay.classList.remove('hidden');

  const snakeEl = document.getElementById('the-snake');
  if(snakeEl){
    snakeEl.classList.remove('dance','explode','catch','miss');
    if(tier.snakeFx){ void snakeEl.offsetWidth; snakeEl.classList.add(tier.snakeFx); }
  }

  if(tier.fx === 'fireworks') spawnFireworks(fx);
  else if(tier.fx === 'confetti') spawnConfetti(fx);

  overlay.onclick = ()=>{
    overlay.classList.add('hidden');
    fx.innerHTML = '';
    if(snakeEl) snakeEl.classList.remove('dance','explode');
    show('screen-results');
  };
}

/* ---- Hint ---- */
document.getElementById('btn-hint').addEventListener('click', ()=>{
  if(!spendCoins(15)){ toast("Not enough coins for a hint!"); return; }
  document.getElementById('btn-hint').disabled = true;
  document.getElementById('btn-hint').textContent = 'Hint used';
  const wrongOptions = currentQuestion.options.filter(o=>o!==currentQuestion.correct);
  const toRemove = shuffle(wrongOptions).slice(0,2);
  if(selectedGame==='match'){
    document.querySelectorAll('#match-answers .answer-btn').forEach(b=>{
      if(toRemove.includes(b.dataset.value)){ b.disabled = true; b.style.opacity='0.25'; }
    });
  } else if(selectedGame==='mango'){
    document.querySelectorAll('.mango-obj').forEach(m=>{
      if(toRemove.includes(m.dataset.value)){ m.style.opacity='0.2'; m.style.pointerEvents='none'; }
    });
    mangoList.forEach(m=>{ if(toRemove.includes(m.opt)) m.hinted = true; });
  } else if(selectedGame==='fish'){
    document.querySelectorAll('.fish-obj').forEach(m=>{
      if(toRemove.includes(m.dataset.value)){ m.style.opacity='0.2'; m.style.pointerEvents='none'; }
    });
    fishList.forEach(f=>{ if(toRemove.includes(f.opt)) f.hinted = true; });
  } else {
    document.querySelectorAll('.avocado-obj').forEach(a=>{
      if(toRemove.includes(a.dataset.value)){ a.style.opacity='0.2'; a.style.pointerEvents='none'; }
    });
    avocadoList.forEach(a=>{ if(toRemove.includes(a.opt)) a.hinted = true; });
  }
});


function finishRound(){
  round.coinsGained = coinsForScore(round.score);
  addExp(round.expGained);
  addCoins(round.coinsGained);
  document.getElementById('res-score').textContent = `${round.score} / ${ROUND_LENGTH}`;
  document.getElementById('res-exp').textContent = round.expGained;
  document.getElementById('res-coins').textContent = round.coinsGained;
  if(selectedGame === 'snake'){
    showSnakeEnding(round.score);
  } else {
    if(selectedGame === 'match') buildMatchLeaderboard();
    show('screen-results');
  }
}

/* ============================================================
   DAILY STREAK
   Reuses the same real-life situational question bank as
   Fraction Match / Mango Falling, mixing easy & medium contexts.
   ============================================================ */
function buildSituationalQuestion(){
  return generateUniqueQuestion('streak', randChoice(['easy','medium']));
}

let streakQuestions = [], streakIndex = 0, streakScore = 0;

function checkDailyStreak(){
  const today = new Date().toISOString().slice(0,10);
  if(state.lastPlayDate === today){ return; } // already played today
  let newStreak;
  if(!state.lastPlayDate){ newStreak = 1; }
  else{
    const prev = new Date(state.lastPlayDate);
    const now = new Date(today);
    const diffDays = Math.round((now - prev)/(1000*60*60*24));
    newStreak = (diffDays === 1) ? state.streak + 1 : 1;
  }
  state._pendingStreak = newStreak; // apply once modal completes
  streakQuestions = Array.from({length:5}, ()=> buildSituationalQuestion());
  streakIndex = 0; streakScore = 0;
  document.getElementById('streak-title').textContent = `Day ${newStreak} Streak!`;
  document.getElementById('streak-modal').classList.remove('hidden');
  renderStreakQuestion();
}

function renderStreakQuestion(){
  const area = document.getElementById('streak-question-area');
  if(streakIndex >= streakQuestions.length){
    const bonusExp = 40 + streakScore*15;
    const bonusCoins = Math.min(5, 1 + streakScore); // keep the whole economy scarce, even for the once-a-day streak
    state.lastPlayDate = new Date().toISOString().slice(0,10);
    state.streak = state._pendingStreak;
    saveState();
    renderTopBadges();
    addExp(bonusExp);
    addCoins(bonusCoins);
    area.innerHTML = `
      <p style="font-weight:800;color:var(--pine);">You got ${streakScore}/5 correct!</p>
      <p style="font-weight:700;color:#5b5443;">Bonus: +${bonusExp} EXP, +${bonusCoins} 🪙</p>
      <button class="btn btn-primary" id="btn-streak-done">Enter Grove</button>`;
    document.getElementById('btn-streak-done').addEventListener('click', ()=>{
      document.getElementById('streak-modal').classList.add('hidden');
    });
    return;
  }
  const q = streakQuestions[streakIndex];
  area.innerHTML = `
    <p style="font-weight:700;color:var(--pine);margin:14px 0;">${formatFracDisplay(q.prompt)}</p>
    <div class="answers-grid" style="justify-content:center;margin:0 auto;" id="streak-answers"></div>
    <p style="margin-top:10px;font-size:12px;color:#8a8168;">Question ${streakIndex+1} of 5</p>
  `;
  const wrap = document.getElementById('streak-answers');
  q.options.forEach(opt=>{
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.style.minWidth = '110px';
    btn.dataset.value = opt;
    btn.innerHTML = formatFracDisplay(opt);
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('#streak-answers .answer-btn').forEach(b=>{
        b.disabled = true;
        if(b.dataset.value === q.correct) b.classList.add('correct');
        else if(b===btn) b.classList.add('wrong');
      });
      if(opt === q.correct) streakScore++;
      streakIndex++;
      setTimeout(renderStreakQuestion, 700);
    });
    wrap.appendChild(btn);
  });
}

/* ============================================================
   ENGAGING MENU BACKGROUND — fractions, mangoes, symbols, stars
   ============================================================ */
function buildFloatingFractions(){
  const layer = document.getElementById('float-frac-layer');
  if(!layer) return;
  const pairs = [[1,2],[3,4],[2,5],[5,8],[3,7],[1,3],[4,9],[2,3],[5,6],[7,10]];
  const decoEmojis = ['🍍','🍌','🍎','🥧','⭐','🪙'];
  const symbols = ['+','−','×','÷','='];

  // drifting fraction bars
  for(let i=0;i<9;i++){
    const [n,d] = pairs[randInt(0,pairs.length-1)];
    const el = document.createElement('div');
    el.className = 'float-frac';
    el.style.left = randInt(2,92) + 'vw';
    el.style.animationDuration = randInt(14,26) + 's';
    el.style.animationDelay = '-' + randInt(0,20) + 's';
    el.innerHTML = `<span>${n}</span><div class="bar"></div><span>${d}</span>`;
    layer.appendChild(el);
  }
  // drifting mango emoji (hero fruit — a bit bigger/brighter)
  for(let i=0;i<5;i++){
    const el = document.createElement('div');
    el.className = 'float-frac mango-emoji';
    el.style.left = randInt(2,92) + 'vw';
    el.style.animationDuration = randInt(16,30) + 's';
    el.style.animationDelay = '-' + randInt(0,24) + 's';
    el.textContent = '🥭';
    layer.appendChild(el);
  }
  // other fruits, stars & coins for extra variety and color
  for(let i=0;i<8;i++){
    const el = document.createElement('div');
    el.className = 'float-frac deco-emoji';
    el.style.left = randInt(2,92) + 'vw';
    el.style.animationDuration = randInt(15,28) + 's';
    el.style.animationDelay = '-' + randInt(0,24) + 's';
    el.textContent = decoEmojis[randInt(0,decoEmojis.length-1)];
    layer.appendChild(el);
  }
  // drifting math operator symbols
  for(let i=0;i<7;i++){
    const el = document.createElement('div');
    el.className = 'float-frac symbol';
    el.style.left = randInt(2,92) + 'vw';
    el.style.animationDuration = randInt(15,28) + 's';
    el.style.animationDelay = '-' + randInt(0,22) + 's';
    el.textContent = symbols[randInt(0,symbols.length-1)];
    layer.appendChild(el);
  }

  // gentle parallax on mouse move for extra depth
  const menu = document.getElementById('screen-menu');
  if(menu){
    menu.addEventListener('mousemove', (e)=>{
      const dx = (e.clientX / window.innerWidth - 0.5) * 16;
      const dy = (e.clientY / window.innerHeight - 0.5) * 16;
      layer.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    menu.addEventListener('mouseleave', ()=>{ layer.style.transform = 'translate(0,0)'; });
  }
}

// One entry per FRACTION_TYPES card (same order) so the dashboard preview
// always matches whatever the Knowledge Grove currently teaches.
const TYPE_CHIP_META = [
  {label:'Proper',      ratio:[3,5]},
  {label:'Improper',    ratio:[7,4]},
  {label:'Mixed',       ratio:[7,4]},
  {label:'Unit',        ratio:[1,6]},
  {label:'Equivalent',  ratio:[2,4]},
  {label:'Like Frac.',  ratio:[2,7]},
  {label:'Unlike Frac.',ratio:[1,3]},
  {label:'Decimal',     ratio:[45,100]},
  {label:'Complex',     ratio:[1,2]},
  {label:'Common',      ratio:[5,9]},
  {label:'Reducible',   ratio:[8,12]},
  {label:'Irreducible', ratio:[5,9]}
];

// Colorful, varied "type chips" drifting up through the menu — a mini
// preview of every fraction type taught in the Knowledge Grove, each in
// its own color so the dashboard feels lively instead of one repeated shape.
function buildTypeDecorations(){
  const layer = document.getElementById('type-deco-layer');
  if(!layer) return;
  layer.innerHTML = '';
  const count = 14;
  for(let i=0;i<count;i++){
    const idx = i % TYPE_CHIP_META.length;
    const meta = TYPE_CHIP_META[idx];
    const pct = Math.min(100, Math.round((meta.ratio[0]/meta.ratio[1])*100));
    const el = document.createElement('div');
    el.className = `type-chip c${idx}`;
    el.style.left = randInt(2,88) + 'vw';
    el.style.animationDuration = randInt(20,34) + 's';
    el.style.animationDelay = '-' + randInt(0,30) + 's';
    el.innerHTML = `<span class="tc-pie" style="background:conic-gradient(#fff 0% ${pct}%, rgba(255,255,255,0.32) ${pct}% 100%);"></span><span>${meta.label}</span>`;
    layer.appendChild(el);
  }
}

function buildTwinkleStars(){
  const layer = document.getElementById('stars-layer');
  if(!layer) return;
  for(let i=0;i<28;i++){
    const el = document.createElement('div');
    el.className = 'twinkle-star';
    const size = randInt(2,4);
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    el.style.left = randInt(0,98) + 'vw';
    el.style.top = randInt(0,95) + 'vh';
    el.style.animationDuration = randInt(2,5) + 's';
    el.style.animationDelay = '-' + (Math.random()*4).toFixed(2) + 's';
    layer.appendChild(el);
  }
}

function buildFishBubbles(){
  const layer = document.getElementById('fish-bubbles');
  if(!layer) return;
  layer.innerHTML = '';
  for(let i=0;i<16;i++){
    const el = document.createElement('div');
    el.className = 'bubble';
    const size = randInt(4,11);
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    el.style.left = randInt(4,96) + '%';
    el.style.animationDuration = randInt(4,9) + 's';
    el.style.animationDelay = '-' + randInt(0,9) + 's';
    layer.appendChild(el);
  }
}

function buildSnakeLeaves(){
  const layer = document.getElementById('snake-leaves');
  if(!layer) return;
  layer.innerHTML = '';
  for(let i=0;i<10;i++){
    const el = document.createElement('div');
    el.className = 'leaf';
    el.style.left = randInt(2,96) + '%';
    el.style.animationDuration = randInt(7,13) + 's';
    el.style.animationDelay = '-' + randInt(0,12) + 's';
    if(Math.random() < 0.4) el.style.background = '#C9A24A';
    layer.appendChild(el);
  }
}

function buildFishClouds(){
  const layer = document.getElementById('fish-clouds'); if(!layer) return;
  layer.innerHTML = '';
  for(let i=0;i<5;i++){
    const el = document.createElement('div'); el.className = 'fish-cloud';
    const s = randInt(20,44);
    el.style.width = s+'px'; el.style.height = Math.round(s*0.55)+'px';
    el.style.top = randInt(4,70)+'%'; el.style.left = randInt(-10,100)+'%';
    el.style.animationDuration = randInt(38,64)+'s'; el.style.animationDelay = '-'+randInt(0,50)+'s';
    layer.appendChild(el);
  }
}

function buildFishGulls(){
  const layer = document.getElementById('fish-gulls');
  if(!layer) return;
  layer.innerHTML = '';
  for(let i=0;i<3;i++){
    const el = document.createElement('div');
    el.className = 'gull';
    el.style.top = randInt(6,60) + '%';
    el.style.animationDuration = randInt(20,34) + 's';
    el.style.animationDelay = '-' + randInt(0,26) + 's';
    layer.appendChild(el);
  }
}

function buildFishBackgroundSchool(){
  const layer = document.getElementById('fish-bg-fish');
  if(!layer) return;
  layer.innerHTML = '';
  for(let i=0;i<7;i++){
    const el = document.createElement('div');
    el.className = 'bg-fish';
    // Size varies via width/height (not transform) since the swim animation
    // already owns `transform` for the translateX motion — an inline transform
    // here would get silently overwritten by the animation every frame.
    const scale = 0.6 + Math.random()*0.8;
    el.style.width = Math.round(24*scale) + 'px';
    el.style.height = Math.round(12*scale) + 'px';
    el.style.top = randInt(6,84) + '%';
    el.style.left = randInt(0,90) + '%';
    el.style.animationDuration = randInt(16,30) + 's';
    el.style.animationDelay = '-' + randInt(0,26) + 's';
    layer.appendChild(el);
  }
}

function buildMangoStrip(){
  const strip = document.getElementById('mango-strip');
  if(!strip) return;
  for(let i=0;i<8;i++){
    const el = document.createElement('span');
    el.textContent = '🥭';
    el.style.animationDuration = randInt(16,26) + 's';
    el.style.animationDelay = '-' + randInt(0,22) + 's';
    strip.appendChild(el);
  }
}

/* interactive touches: bouncy banner icon + a little sparkle burst on button clicks */

/* ============================================================
   MINIGAMES HUB: themed card previews (UI only)
   Reuses the game's own sprite generators so each selection card
   shows the real mango, farmer, fish and fruit artwork.
   ============================================================ */
function buildHubCards(){
  const grid = document.querySelector('.game-grid');
  if(!grid) return;
  try{
    const mango = makeCanvas(68,84); drawMangoSprite(mango.ctx,68,84);
    const farmer = makeCanvas(88,128); drawFarmerSprite(farmer.ctx,88,128);
    const set = (card,vars)=>{ if(card) Object.keys(vars).forEach(k=>card.style.setProperty(k,vars[k])); };
    set(grid.querySelector('.gc-mango'),{ '--spr-mango':`url(${mango.c.toDataURL()})`, '--spr-farmer':`url(${farmer.c.toDataURL()})` });
    set(grid.querySelector('.gc-fish'),{
      '--spr-fish1':getFishSprite('fish-c1','sp-slim'),
      '--spr-fish2':getFishSprite('fish-c4','sp-round'),
      '--spr-fish3':getFishSprite('fish-c2','sp-stripe')
    });
  }catch(err){ /* previews are decoration only; never block the game */ }
  try{ buildSnakeCardObjects(grid); renderHubScenes(grid); }catch(err){}

  // The whole card is a big tap target; the Play button keeps the real behaviour.
  grid.querySelectorAll('.game-card').forEach(card=>{
    card.addEventListener('click', e=>{
      if(e.target.closest('.btn')) return;
      const b = card.querySelector('[data-game]'); if(b) b.click();
    });
    const b = card.querySelector('[data-game]');
    if(b) b.addEventListener('click', ()=>{
      const g = b.getAttribute('data-game');
      grid.querySelectorAll('.game-card').forEach(c=>c.classList.toggle('last-played', c===card));
      const d = document.getElementById('screen-difficulty');
      if(d){
        d.setAttribute('data-game', g);
        const ic = d.querySelector('.diff-panel-icon');
        if(ic) ic.textContent = {match:'🃏',mango:'🥭',fish:'🎣',snake:'🐍'}[g] || '🥭';
      }
    });
  });
}


/* ============================================================
   MINIGAMES HUB: Mango Falling orchard + S-Frac jungle previews
   Painted once per size onto canvases (cached as images), reusing the
   game's own helpers: drawCloud / drawHillLayer / drawHillTree /
   drawFlower / drawBranch / drawLeafCluster / drawMangoSprite for the
   orchard and drawSnakeScene / SNAKE_FRUIT_ART / .slot-pad / .jg-* for S-Frac.
   ============================================================ */
function hubCanvas(w,h,dpr){
  const c=document.createElement('canvas'); c.width=Math.round(w*dpr); c.height=Math.round(h*dpr);
  const x=c.getContext('2d'); x.setTransform(dpr,0,0,dpr,0,0); return {c,x};
}
function hubRng(seed){ let s=seed; const r=()=>{ s=(s*9301+49297)%233280; return s/233280; }; r.rr=(a,b)=>a+r()*(b-a); r.pick=a=>a[Math.floor(r()*a.length)]; return r; }

function paintMangoOrchard(W,H,dpr){
  const rnd=hubRng(7), rr=rnd.rr, pick=rnd.pick, TAU=Math.PI*2;
  const u=H/156, hz=H*0.54;
  const bgC=hubCanvas(W,H,dpr), x=bgC.x;
  const mangoSpr=hubCanvas(68,84,1); drawMangoSprite(mangoSpr.x,68,84);
  const ell=(c,px,py,a,b,rot)=>{ c.beginPath(); c.ellipse(px,py,a,b,rot||0,0,TAU); c.fill(); };
  const haze=(y0,y1,a)=>{ const g=x.createLinearGradient(0,y0,0,y1); g.addColorStop(0,'rgba(236,248,244,0)'); g.addColorStop(0.6,`rgba(236,248,244,${a})`); g.addColorStop(1,'rgba(236,248,244,0)'); x.fillStyle=g; x.fillRect(0,y0,W,y1-y0); };

  // ---- sky: warm daylight + sun glow ----
  let g=x.createLinearGradient(0,0,0,hz+8*u); g.addColorStop(0,'#58B1EC'); g.addColorStop(0.55,'#A6DCF5'); g.addColorStop(1,'#FFEFC4');
  x.fillStyle=g; x.fillRect(0,0,W,hz+8*u);
  const sx=W*0.16, sy=H*0.2;
  g=x.createRadialGradient(sx,sy,0,sx,sy,44*u); g.addColorStop(0,'rgba(255,248,200,.95)'); g.addColorStop(0.25,'rgba(255,236,150,.5)'); g.addColorStop(1,'rgba(255,236,150,0)');
  x.fillStyle=g; x.fillRect(0,0,W,hz+8*u);
  x.fillStyle='#FFF7D2'; x.beginPath(); x.arc(sx,sy,7*u,0,TAU); x.fill();
  // soft painted clouds (static ones; two more drift on top)
  drawCloud(x,W*0.42,H*0.13,0.5*u); drawCloud(x,W*0.88,H*0.2,0.36*u);

  // ---- distant mountains: layered silhouettes with a lit and a shaded face ----
  const ridge=(baseY,n,hMin,hMax)=>{ const p=[]; for(let i=0;i<=n;i++){ const peak=i%2===1; const px=i/n*W+(peak?rr(-W*0.02,W*0.02):0); p.push([px,baseY-(peak?rr(hMin,hMax):rr(hMin*0.2,hMin*0.5))*u]); } return p; };
  const mountain=(p,baseY,lit,shade)=>{
    x.fillStyle=lit; x.beginPath(); x.moveTo(0,baseY); p.forEach(([px,py])=>x.lineTo(px,py)); x.lineTo(W,baseY); x.closePath(); x.fill();
    for(let i=1;i<p.length-1;i+=2){
      const [px,py]=p[i], [vx,vy]=p[i+1], [lx,ly]=p[i-1];
      x.fillStyle=shade; x.beginPath(); x.moveTo(px,py); x.lineTo(vx,vy); x.lineTo(vx,baseY); x.lineTo(px+(vx-px)*0.35,baseY); x.lineTo(px+(vx-px)*0.1,py+(baseY-py)*0.5); x.closePath(); x.fill();
      x.strokeStyle='rgba(255,255,255,.35)'; x.lineWidth=1*u; x.beginPath(); x.moveTo(px,py); x.lineTo(px+(lx-px)*0.55,py+(ly-py)*0.55); x.stroke();
    }
  };
  mountain(ridge(hz+4*u,6,38,56),hz+4*u,'#B2C9DF','rgba(60,95,140,.30)');
  haze(hz-34*u,hz+8*u,0.38);
  mountain(ridge(hz+6*u,8,22,34),hz+6*u,'#8FB3AE','rgba(25,70,70,.28)');
  haze(hz-16*u,hz+12*u,0.28);

  // ---- rolling hills with far trees (softer, bluer = further away) ----
  const hillPts=(off,amp,k,ph)=>{ const a=[]; for(let i=0;i<=8;i++) a.push([i/8*W, hz+off*u-(amp+Math.sin(i*k+ph)*amp*0.6)*u]); return a; };
  const h1=hillPts(8,7,1.3,0.4); drawHillLayer(x,W,h1,hz+34*u,'#A5CC84');
  for(let i=1;i<h1.length-1;i+=2) drawHillTree(x,h1[i][0],h1[i][1]+3*u,0.5*u);
  haze(hz-4*u,hz+22*u,0.22);
  const h2=hillPts(14,6,1.1,2.1); drawHillLayer(x,W,h2,hz+36*u,'#8CBF68');
  for(let i=0;i<h2.length;i+=3) drawHillTree(x,h2[i][0]+8*u,h2[i][1]+4*u,0.75*u);

  // ---- countryside: round trees, a palm, and thatched-roof huts (bahay kubo) ----
  const roundTree=(cx,gy,s)=>{ x.save(); x.translate(cx,gy); x.scale(s,s);
    x.fillStyle='rgba(0,0,0,.16)'; ell(x,0,1,13,3);
    x.fillStyle='#6B4A2E'; x.fillRect(-1.6,-15,3.2,15);
    [['#2F7A38',0,-24,11],['#3E8E42',-7,-19,8],['#3E8E42',7,-19,8],['#5BAE55',-2,-28,7]].forEach(([c,ax,ay,r])=>{ x.fillStyle=c; x.beginPath(); x.arc(ax,ay,r,0,TAU); x.fill(); });
    x.fillStyle='rgba(255,255,200,.22)'; ell(x,-4,-29,4,2.6); x.restore(); };
  const palm=(cx,gy,s)=>{ x.save(); x.translate(cx,gy); x.scale(s,s);
    x.strokeStyle='#7A5632'; x.lineWidth=2.6; x.lineCap='round'; x.beginPath(); x.moveTo(0,0); x.quadraticCurveTo(3,-16,-1,-30); x.stroke();
    for(let k=0;k<7;k++){ const a=-Math.PI/2+(k-3)*0.62; x.save(); x.translate(-1,-30); x.rotate(a);
      x.fillStyle=k%2?'#3E8E42':'#2F7A38'; x.beginPath(); x.moveTo(0,0); x.quadraticCurveTo(8,-5,18,2); x.quadraticCurveTo(8,1,0,0); x.fill(); x.restore(); }
    x.fillStyle='#5a3d22'; x.beginPath(); x.arc(-1,-29,2,0,TAU); x.fill(); x.restore(); };
  const hut=(cx,gy,s)=>{ x.save(); x.translate(cx,gy); x.scale(s,s);
    x.fillStyle='rgba(0,0,0,.2)'; ell(x,0,1,23,3.2);
    x.fillStyle='#6B4A2E'; [-13,-5,5,13].forEach(px=>x.fillRect(px-1,-9,2,9));            // stilts
    x.fillStyle='#8A6339'; x.fillRect(-16,-11,32,2.4);                                       // floor beam
    x.fillStyle='#D8B97B'; x.fillRect(-14,-25,28,14);                                        // bamboo wall
    x.strokeStyle='rgba(110,75,30,.5)'; x.lineWidth=.8; for(let k=-13;k<=14;k+=3){ x.beginPath(); x.moveTo(k,-25); x.lineTo(k,-11); x.stroke(); }
    x.fillStyle='#4a3320'; x.fillRect(4,-22,6,5); x.fillStyle='#7a5a34'; x.fillRect(4,-22,6,1.2);   // window + sill
    x.fillStyle='#5a3d22'; x.fillRect(-9,-23,6,12);                                          // door
    x.strokeStyle='#6B4A2E'; x.lineWidth=1.2; x.beginPath(); x.moveTo(-3,-11); x.lineTo(-7,0); x.moveTo(1,-11); x.lineTo(-3,0); x.stroke();
    for(let k=0;k<3;k++){ x.beginPath(); x.moveTo(-6.4+k*1.1,-9+k*3); x.lineTo(-1.6+k*1.1,-9+k*3); x.stroke(); }   // ladder rungs
    const rg=x.createLinearGradient(0,-48,0,-22); rg.addColorStop(0,'#E6C466'); rg.addColorStop(1,'#A8782C');
    x.fillStyle=rg; x.beginPath(); x.moveTo(-23,-22); x.lineTo(0,-48); x.lineTo(23,-22); x.closePath(); x.fill();            // thatched roof
    x.strokeStyle='rgba(120,78,20,.55)'; x.lineWidth=.9; for(let k=0;k<20;k++){ const t=k/19; const bx=-22+t*44; const tx=bx*(0.35)*0+ (bx*0.42); x.beginPath(); x.moveTo(bx,-22.5); x.lineTo(tx,-46+Math.abs(bx)*0.05); x.stroke(); }
    x.strokeStyle='rgba(255,236,160,.5)'; x.lineWidth=.7; for(let k=0;k<12;k++){ const bx=-19+k*3.5; x.beginPath(); x.moveTo(bx,-23.5); x.lineTo(bx*0.55,-40); x.stroke(); }
    x.fillStyle='#8A5E22'; x.beginPath(); for(let k=-23;k<=23;k+=3){ x.lineTo(k,-22+(k%2?2.2:0)); } x.lineTo(23,-22.5); x.lineTo(-23,-22.5); x.fill();   // ragged eave
    x.strokeStyle='#5a3d22'; x.lineWidth=1.3; x.beginPath(); x.moveTo(0,-48); x.lineTo(0,-53); x.moveTo(-2.5,-51); x.lineTo(2.5,-51); x.stroke(); x.restore(); };
  roundTree(W*0.05,hz+19*u,0.8*u); palm(W*0.2,hz+17*u,0.85*u); roundTree(W*0.43,hz+17*u,0.7*u);
  hut(W*0.10,hz+16*u,0.62*u);
  hut(W*0.31,hz+22*u,0.9*u);
  roundTree(W*0.47,hz+25*u,0.85*u);
  haze(hz+4*u,hz+24*u,0.12);

  // ---- foreground meadow ----
  const gy0=hz+20*u;
  const groundPath=()=>{ x.beginPath(); x.moveTo(0,H); x.lineTo(0,gy0); for(let px=0;px<=W;px+=8) x.lineTo(px,gy0+Math.sin(px*0.045)*2.5*u); x.lineTo(W,H); x.closePath(); };
  g=x.createLinearGradient(0,gy0,0,H); g.addColorStop(0,'#97CE6A'); g.addColorStop(0.45,'#72B652'); g.addColorStop(1,'#4B9040');
  groundPath(); x.fillStyle=g; x.fill();
  x.save(); groundPath(); x.clip();
  for(let i=0;i<46;i++){ const px=rnd()*W, py=gy0+rnd()*(H-gy0), r=rr(14,34)*u; const rg=x.createRadialGradient(px,py,0,px,py,r);
    const col=pick(['150,210,100','60,130,60','190,225,120','40,100,50']); rg.addColorStop(0,`rgba(${col},.32)`); rg.addColorStop(1,`rgba(${col},0)`); x.fillStyle=rg; x.fillRect(px-r,py-r,r*2,r*2); }
  // worn dirt path along the bottom, where the farmer walks
  x.fillStyle='rgba(190,152,98,.6)'; x.beginPath(); x.moveTo(-5,H*0.93); x.quadraticCurveTo(W*0.35,H*0.84,W*0.62,H*0.9); x.quadraticCurveTo(W*0.85,H*0.94,W+5,H*0.88); x.lineTo(W+5,H+5); x.lineTo(-5,H+5); x.closePath(); x.fill();
  x.fillStyle='rgba(120,88,50,.35)'; for(let i=0;i<26;i++) ell(x,rnd()*W,H*0.92+rnd()*H*0.08,rr(.6,1.6)*u,rr(.4,1)*u);
  // grass blades: bigger and brighter toward the viewer
  const cols=['#B7E27F','#8FCB5E','#6FB04C','#4E9A3C','#3A8236','#D3EC8B'];
  const nBl=Math.round(W*H/58); x.lineCap='round';
  for(let i=0;i<nBl;i++){ const py=gy0+rnd()*(H-gy0), t=(py-gy0)/(H-gy0), hh=(2.2+t*6.5)*u*(0.7+rnd()*0.6), px=rnd()*W;
    x.strokeStyle=pick(cols); x.lineWidth=(0.8+t*0.9)*u; x.beginPath(); x.moveTo(px,py); x.quadraticCurveTo(px+rr(-2,2)*u,py-hh*0.6,px+rr(-3,3)*u,py-hh); x.stroke(); }
  x.restore();
  const bush=(cx,cy,r)=>{ x.fillStyle='rgba(0,0,0,.18)'; ell(x,cx+2*u,cy+r*0.55,r*1.15,r*0.34);
    [[-.7,-.1,.62],[.7,-.1,.6],[-.3,-.5,.62],[.3,-.45,.58],[0,-.1,.75]].forEach(([ox,oy,k],i)=>{ const br=r*k, bx=cx+ox*r, by=cy+oy*r; const rg=x.createRadialGradient(bx-br*.3,by-br*.35,br*.1,bx,by,br);
      rg.addColorStop(0,i%2?'#7CC862':'#6DBB58'); rg.addColorStop(1,'#2F7A36'); x.fillStyle=rg; x.beginPath(); x.arc(bx,by,br,0,TAU); x.fill(); });
    for(let k=0;k<5;k++){ x.fillStyle=pick(['#F281B0','#FFFFFF','#FFE24A']); x.beginPath(); x.arc(cx+rr(-.9,.9)*r,cy+rr(-.9,.2)*r,1.1*u,0,TAU); x.fill(); } };
  bush(W*0.04,H*0.84,13*u); bush(W*0.40,hz+34*u,8*u); bush(W*0.58,H*0.82,8*u); bush(W*0.98,H*0.86,12*u);
  const sprout=(px,py,s)=>{ x.save(); x.translate(px,py); x.scale(s,s); [-0.8,0,0.8].forEach(a=>{ x.save(); x.rotate(a); x.fillStyle='#4FA24B'; x.strokeStyle='#24662e'; x.lineWidth=.7; x.beginPath(); x.ellipse(0,-5,2.2,5,0,0,TAU); x.fill(); x.stroke(); x.restore(); }); x.restore(); };
  [[.16,.88],[.30,.8],[.5,.9],[.66,.76],[.92,.78],[.22,.7]].forEach(([fx,fy])=>sprout(W*fx,H*fy,0.8*u));
  for(let i=0;i<22;i++){ const py=gy0+8*u+rnd()*(H-gy0-10*u), t=(py-gy0)/(H-gy0); drawFlower(x,rnd()*W,py,pick(['#FFE24A','#FFFFFF','#F281B0','#FF8A3D','#B58CFF']),(0.38+t*0.38)*u); }
  for(let i=0;i<9;i++) drawFallenLeaf(x,W*rr(0.45,0.98),H*rr(0.82,0.97),pick(['#C9A24A','#B5651D','#D98A3A']),rnd()*6,0.7*u);

  // ---- mango tree: ground shadow on the meadow, tree drawn on its own layer so it can sway ----
  const bx=W*0.74, by=H*0.9, tw=W*0.05, cy=H*0.31, rx=W*0.27, ry=H*0.25;
  x.fillStyle='rgba(20,50,10,.28)'; ell(x,bx+8*u,by+4*u,W*0.2,5.5*u);
  [[0.62,0.93,.4],[0.87,0.95,-.6]].forEach(([fx,fy,rot])=>{ x.save(); x.translate(W*fx,H*fy); x.rotate(rot); x.drawImage(mangoSpr.c,-6*u,-7*u,12*u,15*u); x.restore(); });

  const trC=hubCanvas(W,H,dpr), t=trC.x;
  const trunk=()=>{ t.beginPath(); t.moveTo(bx-tw*1.7,by+3*u); t.quadraticCurveTo(bx-tw*1.1,by-2*u,bx-tw*0.95,by-14*u);
    t.bezierCurveTo(bx-tw*0.8,by-45*u,bx-tw*0.62,cy+ry*0.7,bx-tw*0.55,cy+ry*0.45); t.lineTo(bx+tw*0.55,cy+ry*0.45);
    t.bezierCurveTo(bx+tw*0.7,cy+ry*0.7,bx+tw*0.9,by-45*u,bx+tw*0.95,by-14*u); t.quadraticCurveTo(bx+tw*1.15,by-2*u,bx+tw*1.8,by+3*u);
    t.quadraticCurveTo(bx,by+7*u,bx-tw*1.7,by+3*u); t.closePath(); };
  let bg2=t.createLinearGradient(bx-tw*1.3,0,bx+tw*1.3,0); bg2.addColorStop(0,'#A57845'); bg2.addColorStop(0.5,'#74502F'); bg2.addColorStop(1,'#4A321C');
  trunk(); t.fillStyle=bg2; t.fill();
  t.save(); trunk(); t.clip();
  t.lineCap='round';
  for(let i=0;i<16;i++){ const x0=bx-tw*0.95+rnd()*tw*1.9, y0=rr(cy+ry*0.55,by), L=rr(10,30)*u; t.strokeStyle=`rgba(35,20,8,${rr(.25,.5)})`; t.lineWidth=rr(.6,1.4)*u;
    t.beginPath(); t.moveTo(x0,y0); t.bezierCurveTo(x0+rr(-2,2)*u,y0-L*.35,x0+rr(-2,2)*u,y0-L*.7,x0+rr(-1.5,1.5)*u,y0-L); t.stroke(); }
  for(let i=0;i<12;i++){ const x0=bx-tw*0.8+rnd()*tw*1.5, y0=rr(cy+ry*0.55,by-6*u); t.strokeStyle='rgba(35,20,8,.32)'; t.lineWidth=.8*u; t.beginPath(); t.moveTo(x0,y0); t.lineTo(x0+rr(3,6)*u,y0+rr(-1,1)*u); t.stroke(); }
  t.strokeStyle='rgba(255,225,170,.24)'; t.lineWidth=1.1*u; for(let i=0;i<5;i++){ const x0=bx-tw*0.7+i*tw*0.22; t.beginPath(); t.moveTo(x0,by-4*u); t.lineTo(x0+rr(-1,1)*u,rr(cy+ry*0.6,by-30*u)); t.stroke(); }
  t.fillStyle='#3a2410'; t.beginPath(); t.ellipse(bx+tw*0.12,by-46*u,2.4*u,3.4*u,0,0,TAU); t.fill(); t.strokeStyle='rgba(20,10,0,.5)'; t.lineWidth=.8*u; t.stroke();
  for(let i=0;i<4;i++){ const rg=t.createRadialGradient(bx+rr(-tw,tw),by-rr(0,16)*u,0,bx,by-8*u,tw*1.2); rg.addColorStop(0,'rgba(100,170,70,.38)'); rg.addColorStop(1,'rgba(100,170,70,0)'); t.fillStyle=rg; t.fillRect(bx-tw*2,by-30*u,tw*4,36*u); }
  t.restore();
  t.strokeStyle='rgba(35,20,8,.55)'; t.lineWidth=1*u; trunk(); t.stroke();

  drawBranch(t,bx-tw*0.4,cy+ry*0.85,-W*0.22,-H*0.2,u*0.6);
  drawBranch(t,bx+tw*0.4,cy+ry*0.8,W*0.2,-H*0.22,u*0.6);
  drawBranch(t,bx-tw*0.2,cy+ry*0.55,-W*0.08,-H*0.2,u*0.55);
  drawBranch(t,bx+tw*0.2,cy+ry*0.5,W*0.1,-H*0.18,u*0.55);

  const inEll=(k)=>{ const a=rnd()*TAU, d=Math.sqrt(rnd())*k; return [bx+Math.cos(a)*rx*d, cy+Math.sin(a)*ry*d]; };
  for(let i=0;i<15;i++){ const [px,py]=inEll(0.95); t.fillStyle=pick(['#1F5E2C','#256A30','#1B5527']); t.beginPath(); t.arc(px,py,rr(10,16)*u,0,TAU); t.fill(); }   // dark back layer
  for(let i=0;i<22;i++){ const [px,py]=inEll(0.85); t.fillStyle=pick(['#2F7F3A','#388A41','#2A7335']); t.beginPath(); t.arc(px,py,rr(8,13)*u,0,TAU); t.fill(); } // mid layer
  const leaf=(px,py,len,ang,col)=>{ t.save(); t.translate(px,py); t.rotate(ang); t.fillStyle=col; t.beginPath(); t.moveTo(0,0); t.quadraticCurveTo(len*.5,-len*.34,len,0); t.quadraticCurveTo(len*.5,len*.34,0,0); t.fill();
    t.strokeStyle='rgba(15,60,20,.5)'; t.lineWidth=.6*u; t.beginPath(); t.moveTo(0,0); t.lineTo(len*.9,0); t.stroke(); t.restore(); };
  for(let i=0;i<140;i++){ const [px,py]=inEll(0.97); const lit=Math.max(0,Math.min(1,0.5+((bx-px)/rx*0.5+(cy-py)/ry*0.5)*0.6));   // light from upper-left
    const cA=[45,122,53], cB=[124,207,94]; const m=(k)=>Math.round(cA[k]+(cB[k]-cA[k])*lit*rr(.6,1));
    leaf(px,py,rr(7,11)*u,rnd()*TAU,`rgb(${m(0)},${m(1)},${m(2)})`); }
  for(let i=0;i<12;i++){ const [px,py]=inEll(0.9); drawLeafCluster(t,px,py,rr(11,16)*u); }                                        // layered leaf clusters
  for(let i=0;i<7;i++){ const px=bx-rx*rr(.3,.9), py=cy-ry*rr(.3,.85), r=rr(12,22)*u; const rg=t.createRadialGradient(px,py,0,px,py,r); rg.addColorStop(0,'rgba(210,255,150,.28)'); rg.addColorStop(1,'rgba(210,255,150,0)'); t.fillStyle=rg; t.fillRect(px-r,py-r,r*2,r*2); }
  t.save(); t.globalCompositeOperation='source-atop';
  const sg=t.createRadialGradient(bx+rx*0.35,cy+ry*0.5,ry*0.2,bx+rx*0.35,cy+ry*0.5,ry*1.3); sg.addColorStop(0,'rgba(6,36,16,.34)'); sg.addColorStop(1,'rgba(6,36,16,0)'); t.fillStyle=sg; t.fillRect(0,0,W,H); t.restore();
  // hanging mangoes: the game's own mango sprite on stems
  [[-0.78,0.58],[-0.42,0.74],[0.05,0.7],[0.46,0.76],[0.82,0.52]].forEach(([fx,fy])=>{
    const mx=bx+rx*fx, my=cy+ry*fy, mw=15*u, mh=19*u;
    t.strokeStyle='#4E7A2C'; t.lineWidth=1.1*u; t.beginPath(); t.moveTo(mx,my-mh*0.25); t.quadraticCurveTo(mx+2*u,my-mh*0.6,mx+rr(-4,4)*u,my-mh*0.95); t.stroke();
    t.drawImage(mangoSpr.c,mx-mw/2,my-mh*0.3,mw,mh);
    leaf(mx+1*u,my-mh*0.25,6*u,-0.5,'#3f9a45'); });

  // ---- one reusable cloud sprite for the drifting clouds ----
  const clC=hubCanvas(100,50,2); drawCloud(clC.x,50,26,0.85);
  return { bg:bgC.c.toDataURL('image/jpeg',0.92), tree:trC.c.toDataURL('image/png'), cloud:clC.c.toDataURL('image/png') };
}

function paintSnakeCardSprite(dpr){
  // 6-frame slither sheet drawn like the real snake (dark outline, green body, yellow diamonds, big head)
  const FW=112, FH=34, F=6, TAU=Math.PI*2;
  const sh=hubCanvas(FW,FH*F,dpr), c=sh.x;
  for(let f=0;f<F;f++){
    c.save(); c.translate(0,f*FH);
    const phase=f/F*TAU, R=6.2, sp=5, m=18, cy=FH/2, headX=FW-16;
    const seg=[]; for(let i=0;i<m;i++) seg.push({x:headX-i*sp, y:cy+Math.sin(i*0.5+phase)*4.2*(0.45+0.55*i/m)});
    const rad=i=>R*(1-0.6*Math.pow(i/(m-1),2.4));
    c.fillStyle='rgba(0,0,0,.24)'; for(let i=m-1;i>=0;i--){ c.beginPath(); c.ellipse(seg[i].x+2,seg[i].y+3,(i?rad(i):R*1.4)+1,(i?rad(i):R*1.4)*0.9,0,0,TAU); c.fill(); }
    c.fillStyle='#10301a'; for(let i=m-1;i>=1;i--){ c.beginPath(); c.arc(seg[i].x,seg[i].y,rad(i)+1.6,0,TAU); c.fill(); }
    c.fillStyle='#2fa845'; for(let i=m-1;i>=1;i--){ c.beginPath(); c.arc(seg[i].x,seg[i].y,rad(i),0,TAU); c.fill(); }
    c.lineCap='round'; c.strokeStyle='rgba(190,255,150,.28)';
    for(let i=m-1;i>=1;i--){ c.lineWidth=rad(i)*0.7; c.beginPath(); c.moveTo(seg[i].x-rad(i)*0.18,seg[i].y-rad(i)*0.22); c.lineTo(seg[i-1].x-rad(i)*0.18,seg[i-1].y-rad(i)*0.22); c.stroke(); }
    for(let i=m-2;i>=1;i--){ const p=seg[i-1], q=seg[Math.min(m-1,i+1)], a=Math.atan2(p.y-q.y,p.x-q.x), r=rad(i);
      c.save(); c.translate(seg[i].x,seg[i].y); c.rotate(a);
      if(i%2===0){ c.fillStyle='#f2c94c'; c.strokeStyle='#7a5a10'; c.lineWidth=.7; c.beginPath(); c.moveTo(r*0.62,0); c.lineTo(0,r*0.5); c.lineTo(-r*0.62,0); c.lineTo(0,-r*0.5); c.closePath(); c.fill(); c.stroke(); }
      else { c.fillStyle='rgba(12,70,32,.55)'; c.beginPath(); c.ellipse(0,r*0.62,r*0.32,r*0.2,0,0,TAU); c.ellipse(0,-r*0.62,r*0.32,r*0.2,0,0,TAU); c.fill(); }
      c.restore(); }
    const h=seg[0], HR=R*1.45+1, ang=Math.atan2(seg[0].y-seg[2].y,seg[0].x-seg[2].x);
    c.save(); c.translate(h.x,h.y); c.rotate(ang);
    if(f===2||f===3){ c.strokeStyle='#d8324b'; c.lineWidth=1.3; c.beginPath(); c.moveTo(HR,0); c.lineTo(HR*1.7,0); c.moveTo(HR*1.7,0); c.lineTo(HR*1.95,-HR*0.2); c.moveTo(HR*1.7,0); c.lineTo(HR*1.95,HR*0.2); c.stroke(); }
    c.fillStyle='#10301a'; c.beginPath(); c.ellipse(HR*0.15,0,HR*1.2+1.6,HR*0.92+1.6,0,0,TAU); c.fill();
    const g=c.createRadialGradient(HR*0.1,-HR*0.3,HR*0.1,HR*0.15,0,HR*1.2); g.addColorStop(0,'#86e37c'); g.addColorStop(1,'#238f3a');
    c.fillStyle=g; c.beginPath(); c.ellipse(HR*0.15,0,HR*1.2,HR*0.92,0,0,TAU); c.fill();
    c.fillStyle='rgba(12,70,32,.5)'; c.beginPath(); c.moveTo(-HR*0.5,0); c.lineTo(-HR*0.1,-HR*0.38); c.lineTo(HR*0.3,0); c.lineTo(-HR*0.1,HR*0.38); c.closePath(); c.fill();
    [-1,1].forEach(sd=>{ c.fillStyle='#fff2b0'; c.strokeStyle='#10301a'; c.lineWidth=1; c.beginPath(); c.arc(HR*0.5,sd*HR*0.55,HR*0.27,0,TAU); c.fill(); c.stroke();
      c.fillStyle='#1a1200'; c.beginPath(); c.ellipse(HR*0.54,sd*HR*0.55,HR*0.07,HR*0.19,0,0,TAU); c.fill(); });
    c.restore(); c.restore();
  }
  return sh.c.toDataURL('image/png');
}

function paintSnakeJungle(W,H,dpr){
  const cv=hubCanvas(W,H,dpr);
  const T=Math.max(8,Math.min(11,H*0.06));
  const A={ l:16, r:W-16, t:22, b:H-14, W, H };
  drawSnakeScene(cv.x,W,H,A,T);   // the game's real jungle floor, foliage, log border, vines and stone posts
  return { url:cv.c.toDataURL('image/jpeg',0.9), A };
}

function buildSnakeCardObjects(grid){
  const card=grid.querySelector('.gc-snake'); if(!card) return;
  const spec=[['strawberry','5/8'],['grapes','6/4'],['avocado','5/4']];
  card.querySelectorAll('.gcs-obj').forEach((el,i)=>{ el.innerHTML = snakeFruitHTML(spec[i][0], formatFracDisplay(spec[i][1]), 0); });
  const q=card.querySelector('.gcs-q'); if(q) q.innerHTML = `Solve: ${sciFrac('3','4')} + ${sciFrac('2','4')} = ?`;
}

function renderHubScenes(grid){
  const dpr=Math.min(window.devicePixelRatio||1,2);
  let snakeSheet=null;
  const jobs=[
    ['.gc-mango',(card,w,h)=>{
      const r=paintMangoOrchard(w,h,dpr), st=card.style;
      st.setProperty('--gcg-bg',`url(${r.bg})`); st.setProperty('--gcg-tree',`url(${r.tree})`); st.setProperty('--gcg-cloud',`url(${r.cloud})`);
    }],
    ['.gc-snake',(card,w,h)=>{
      const r=paintSnakeJungle(w,h,dpr), st=card.style;
      if(!snakeSheet) snakeSheet=paintSnakeCardSprite(dpr);
      st.setProperty('--gcs-bg',`url(${r.url})`); st.setProperty('--spr-snake',`url(${snakeSheet})`);
      st.setProperty('--gcs-path',`path('M -40 ${(h*0.88).toFixed(1)} C ${(w*0.22).toFixed(1)} ${(h*0.95).toFixed(1)}, ${(w*0.46).toFixed(1)} ${(h*0.86).toFixed(1)}, ${(w*0.62).toFixed(1)} ${(h*0.76).toFixed(1)} S ${(w*0.74).toFixed(1)} ${(h*0.62).toFixed(1)}, ${(w*0.8).toFixed(1)} ${(h*0.57).toFixed(1)}')`);
      // the game's own animated jungle details: swaying fronds, drifting light, floating spores
      const box=card.querySelector('.jg-fx'); if(!box) return;
      const rnd=hubRng(5); let html='';
      const L=Math.max(30,Math.min(w,h)*0.2);
      for(let px=r.A.l+24;px<r.A.r-10;px+=70+rnd()*20){ html+=`<i class="jg-frond" style="left:${px.toFixed(0)}px;top:${(r.A.t-3).toFixed(0)}px;width:${(L*(0.8+rnd()*0.5)).toFixed(0)}px;--r:${(-90+(rnd()-0.5)*50).toFixed(0)}deg;animation-duration:${(4+rnd()*3).toFixed(1)}s;animation-delay:-${(rnd()*5).toFixed(1)}s"></i>`; }
      for(let i=0;i<3;i++) html+=`<i class="jg-dapple" style="left:${(rnd()*70).toFixed(0)}%;top:${(rnd()*60).toFixed(0)}%;width:${(24+rnd()*14).toFixed(0)}%;height:${(40+rnd()*20).toFixed(0)}%;animation-duration:${(14+rnd()*8).toFixed(0)}s;animation-delay:-${(rnd()*10).toFixed(0)}s"></i>`;
      for(let i=0;i<6;i++) html+=`<i class="jg-spore" style="left:${(r.A.l+rnd()*(r.A.r-r.A.l)).toFixed(0)}px;top:${(r.A.t+30+rnd()*(r.A.b-r.A.t-40)).toFixed(0)}px;animation-duration:${(8+rnd()*6).toFixed(0)}s;animation-delay:-${(rnd()*10).toFixed(0)}s"></i>`;
      box.innerHTML=html;
    }]
  ];
  jobs.forEach(([sel,fn])=>{
    const card=grid.querySelector(sel), scene=card&&card.querySelector('.gc-scene'); if(!scene) return;
    let last='', timer=0;
    const run=()=>{
      const w=Math.round(scene.clientWidth), h=Math.round(scene.clientHeight);
      if(w<60||h<60) return;                       // hub screen is hidden: wait until it is shown
      const key=w+'x'+h; if(key===last) return; last=key;
      card.style.setProperty('--sw',w+'px'); card.style.setProperty('--sh',h+'px');
      try{ fn(card,w,h); }catch(err){}
    };
    if('ResizeObserver' in window) new ResizeObserver(()=>{ clearTimeout(timer); timer=setTimeout(run,120); }).observe(scene);
    run();
  });
}

function initInteractiveTouches(){
  const bannerIcon = document.getElementById('banner-icon');
  if(bannerIcon){
    bannerIcon.addEventListener('click', ()=>{
      bannerIcon.classList.remove('bounce');
      void bannerIcon.offsetWidth;
      bannerIcon.classList.add('bounce');
      toast("🥭 FracDash — let's go!");
    });
  }
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('.btn');
    if(!btn) return;
    spawnSparkles(e.clientX, e.clientY);
  });
}
function spawnSparkles(x,y){
  const bits = ['✦','✧','⭐','🥭'];
  for(let i=0;i<5;i++){
    const s = document.createElement('div');
    s.className = 'sparkle-particle';
    s.textContent = bits[randInt(0,bits.length-1)];
    s.style.left = x + 'px';
    s.style.top = y + 'px';
    const angle = Math.random()*Math.PI*2;
    const dist = 30 + Math.random()*30;
    s.style.setProperty('--sx', Math.cos(angle)*dist + 'px');
    s.style.setProperty('--sy', Math.sin(angle)*dist + 'px');
    document.body.appendChild(s);
    setTimeout(()=> s.remove(), 600);
  }
}

/* ============================================================
   KNOWLEDGE VISUALS — scientific-form fractions, pies, grids
   ============================================================ */

// Stacked "scientific form" fraction: numerator / bar / denominator.
// num/den can be plain text OR another sciFrac(...) string, so fractions can nest
// (used for Complex Fractions: a fraction whose numerator/denominator are fractions).
function sciFrac(num, den, cls){
  return `<span class="sci-frac ${cls||''}"><span class="sf-num">${num}</span><span class="sf-den">${den}</span></span>`;
}

// Pie-chart visual: shades `shaded` slices out of `total` equal slices.
function pieSVG(shaded, total, size){
  size = size || 92;
  const cx = size/2, cy = size/2, r = size/2 - 4;
  if(total <= 1){
    const cls = shaded >= 1 ? 'pie-slice-mango' : 'pie-slice-empty';
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle class="${cls}" cx="${cx}" cy="${cy}" r="${r}"/></svg>`;
  }
  const anglePer = 360/total;
  function polar(angleDeg){
    const rad = (angleDeg - 90) * Math.PI/180;
    return { x:(cx + r*Math.cos(rad)).toFixed(2), y:(cy + r*Math.sin(rad)).toFixed(2) };
  }
  let paths = '';
  for(let i=0;i<total;i++){
    const start = i*anglePer, end = start + anglePer;
    const p1 = polar(start), p2 = polar(end);
    const largeArc = anglePer > 180 ? 1 : 0;
    const d = `M ${cx} ${cy} L ${p1.x} ${p1.y} A ${r} ${r} 0 ${largeArc} 1 ${p2.x} ${p2.y} Z`;
    const cls = i < shaded ? 'pie-slice-mango' : 'pie-slice-empty';
    paths += `<path class="${cls}" d="${d}"/>`;
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${paths}</svg>`;
}

// A row of pies (and/or arrow / plus separators) with captions underneath each pie.
// items: [{shaded,total,label}] or [{sep:'arrow'|'plus'}]
function pieGroup(items){
  const inner = items.map(it=>{
    if(it.sep === 'arrow') return `<div class="pie-arrow">→</div>`;
    if(it.sep === 'plus')  return `<div class="pie-arrow">+</div>`;
    return `<div class="pie-item">${pieSVG(it.shaded, it.total, it.size||88)}<div class="pie-cap">${it.label||''}</div></div>`;
  }).join('');
  return `<div class="pie-row">${inner}</div>`;
}

// A shaded-square grid model, used for decimal fractions (tenths / hundredths).
function gridVisual(shaded, total, cols){
  cols = cols || (total <= 10 ? total : 10);
  let cells = '';
  for(let i=0;i<total;i++){
    cells += `<div class="grid-cell ${i<shaded?'filled':''}"></div>`;
  }
  return `<div class="grid-visual" style="grid-template-columns:repeat(${cols},1fr);">${cells}</div>`;
}

// The 12 fraction types: formula (scientific form), a worked visual, and step-by-step process.
const FRACTION_TYPES = [
  {
    name:'Proper Fraction',
    formula: `${sciFrac('a','b')} <span>&nbsp;where&nbsp;</span> a &lt; b`,
    desc:'The numerator is smaller than the denominator, so the value is less than one whole.',
    visual: pieGroup([{shaded:3,total:5,label:'3/5'}]),
    steps:['Identify the numerator (a) and denominator (b).','Check if a is smaller than b.','If true, the fraction is proper — its value is less than 1.'],
    examples:['1/2 — one of two equal parts.','3/8 — three of eight equal parts.','5/9 — five of nine equal parts.']
  },
  {
    name:'Improper Fraction',
    formula: `${sciFrac('a','b')} <span>&nbsp;where&nbsp;</span> a &ge; b`,
    desc:'The numerator is equal to or larger than the denominator, so the value is 1 whole or more.',
    visual: pieGroup([{shaded:1,total:1,label:'1 whole'},{shaded:3,total:4,label:'¾'}]),
    steps:['Compare the numerator to the denominator.','If a ≥ b, the fraction represents at least one whole.','Example: 7/4 = one full pie + ¾ of another pie.'],
    examples:['9/4 — more than two wholes.','7/3 — more than two wholes.','5/5 — exactly one whole (a=b still counts).']
  },
  {
    name:'Mixed Fraction',
    formula: `w <span>&nbsp;+&nbsp;</span> ${sciFrac('r','b')} <span style="font-size:11px;">&nbsp;(w = whole, r = remainder)</span>`,
    desc:'A whole number combined with a proper fraction — another way to write an improper fraction.',
    visual: pieGroup([{shaded:1,total:1,label:'1'},{shaded:3,total:4,label:'¾'}]),
    steps:['Divide the numerator by the denominator: 7 ÷ 4 = 1 remainder 3.','The quotient (1) becomes the whole number.','The remainder (3) becomes the new numerator, same denominator → 1 ¾.'],
    examples:['2 1/3 — two wholes plus 1/3.','3 3/4 — three wholes plus 3/4.','1 5/6 — one whole plus 5/6.']
  },
  {
    name:'Unit Fraction',
    formula: sciFrac('1','n'),
    desc:'Any fraction with exactly 1 as the numerator — a single equal part of the whole.',
    visual: pieGroup([{shaded:1,total:6,label:'1/6'}]),
    steps:['Check that the numerator equals 1.','The denominator (n) can be any whole number greater than 0.','Example: 1/6 is one slice out of six equal slices.'],
    examples:['1/2 — half of the whole.','1/7 — one of seven equal parts.','1/10 — one of ten equal parts.']
  },
  {
    name:'Equivalent Fractions',
    formula: `${sciFrac('a','b')} = ${sciFrac('a×k','b×k')}`,
    desc:'Different-looking fractions that represent the exact same value.',
    visual: pieGroup([{shaded:1,total:2,label:'1/2'},{sep:'arrow'},{shaded:2,total:4,label:'2/4'},{sep:'arrow'},{shaded:3,total:6,label:'3/6'}]),
    steps:['Pick any non-zero whole number k.','Multiply both numerator and denominator by k.','The new fraction looks different but has the same shaded area / value.'],
    examples:['2/3 = 4/6 (k = 2).','1/4 = 3/12 (k = 3).','3/5 = 6/10 (k = 2).']
  },
  {
    name:'Like (Similar) Fractions',
    formula: `${sciFrac('a','b')} , ${sciFrac('c','b')} <span style="font-size:11px;">&nbsp;(same b)</span>`,
    desc:'Two or more fractions that share the same denominator.',
    visual: pieGroup([{shaded:2,total:7,label:'2/7'},{shaded:5,total:7,label:'5/7'}]),
    steps:['Compare the denominators of both fractions.','If the denominators match, they are like fractions.','Like fractions can be added/subtracted directly by combining numerators.'],
    examples:['2/9 and 5/9 — both have denominator 9.','1/4 and 3/4 — both have denominator 4.','7/12 and 11/12 — both have denominator 12.']
  },
  {
    name:'Unlike (Dissimilar) Fractions',
    formula: `${sciFrac('a','b')} , ${sciFrac('c','d')} <span style="font-size:11px;">&nbsp;(b ≠ d)</span>`,
    desc:'Two or more fractions with different denominators.',
    visual: pieGroup([{shaded:1,total:3,label:'1/3'},{shaded:2,total:5,label:'2/5'}]),
    steps:['Compare the denominators of both fractions.','If they differ, the fractions are unlike (dissimilar).','Convert to a common denominator (LCD) before adding, subtracting, or comparing.'],
    examples:['1/2 and 1/3 — denominators 2 and 3 differ.','3/8 and 2/5 — denominators 8 and 5 differ.','5/6 and 1/4 — denominators 6 and 4 differ.']
  },
  {
    name:'Decimal Fraction',
    formula: `${sciFrac('a','10ⁿ')} <span>&nbsp;=&nbsp;</span> 0.45`,
    desc:'A fraction whose denominator is a power of 10 (10, 100, 1000…), easily written as a decimal.',
    visual: gridVisual(45,100,10) + `<div class="pie-cap">45/100 = 0.45</div>`,
    steps:['Check that the denominator is 10, 100, 1000, etc.','Count the zeros in the denominator — that\'s how many decimal places to use.','Write the numerator with the decimal point shifted that many places: 45/100 = 0.45.'],
    examples:['7/10 = 0.7 — one decimal place.','23/100 = 0.23 — two decimal places.','9/10 = 0.9 — one decimal place.']
  },
  {
    name:'Complex Fraction',
    formula: `${sciFrac(sciFrac('a','b','nested'), sciFrac('c','d','nested'))} <span>&nbsp;=&nbsp;</span> ${sciFrac('a','b')} × ${sciFrac('d','c')}`,
    desc:'A fraction that has a fraction in its numerator, denominator, or both.',
    visual: pieGroup([{shaded:1,total:2,label:'1/2 (top)'},{sep:'arrow'},{shaded:3,total:4,label:'3/4 (bottom)'},{sep:'arrow'},{shaded:2,total:3,label:'= 2/3'}]),
    steps:['Keep the top fraction as-is.','Change the division to multiplication.','Flip (find the reciprocal of) the bottom fraction, then multiply straight across.','Example: (1/2)/(3/4) = 1/2 × 4/3 = 4/6 = 2/3.'],
    examples:['(2/3) / (1/6) = 2/3 × 6/1 = 4.','(3/4) / 5 = 3/4 × 1/5 = 3/20.','(1/2) / (2/5) = 1/2 × 5/2 = 5/4.']
  },
  {
    name:'Common Fraction',
    formula: `${sciFrac('a','b')} <span style="font-size:11px;">&nbsp;a, b ∈ ℤ, b ≠ 0</span>`,
    desc:'The standard, simple form of a fraction — two integers written as numerator over denominator.',
    visual: pieGroup([{shaded:5,total:9,label:'5/9'}]),
    steps:['Both the numerator and denominator must be whole integers.','The denominator can never be zero.','This is the general fraction form used before classifying it further (proper, improper, etc.).'],
    examples:['4/7 — a common (simple) fraction.','9/11 — a common (simple) fraction.','13/4 — still common, even though it\'s improper.']
  },
  {
    name:'Reducible Fraction',
    formula: `GCF(a,b) ≠ 1 <span>&nbsp;→&nbsp;</span> ${sciFrac('a÷g','b÷g')}`,
    desc:'A fraction that can still be simplified because its numerator and denominator share a common factor.',
    visual: pieGroup([{shaded:8,total:12,label:'8/12'},{sep:'arrow'},{shaded:2,total:3,label:'2/3 (simplified)'}]),
    steps:['Find the Greatest Common Factor (GCF) of the numerator and denominator.','If the GCF is greater than 1, the fraction is reducible.','Divide both numerator and denominator by the GCF: 8/12 → GCF 4 → 2/3.'],
    examples:['6/8 → GCF 2 → 3/4.','10/15 → GCF 5 → 2/3.','12/18 → GCF 6 → 2/3.']
  },
  {
    name:'Irreducible Fraction',
    formula: `GCF(a,b) = 1`,
    desc:'A fraction that is already in its simplest (lowest) form — it cannot be reduced any further.',
    visual: pieGroup([{shaded:5,total:9,label:'5/9 ✓ simplest form'}]),
    steps:['Find the GCF of the numerator and denominator.','If the GCF equals 1, no further simplification is possible.','The fraction is already in lowest terms.'],
    examples:['3/7 — GCF is 1, already simplest.','5/12 — GCF is 1, already simplest.','7/9 — GCF is 1, already simplest.']
  }
];

function buildKnowledgeSection(){
  const defEl = document.getElementById('def-frac-formula');
  if(defEl) defEl.innerHTML = sciFrac('a','b','big');

  const grid = document.getElementById('type-grid');
  if(!grid) return;
  grid.innerHTML = FRACTION_TYPES.map((t,i)=>`
    <div class="type-card">
      <span class="type-num">TYPE ${i+1}</span>
      <h4>${t.name}</h4>
      <p class="type-desc">${t.desc}</p>
      <div class="formula-row">${t.formula}</div>
      ${t.visual}
      <ol class="type-steps">${t.steps.map(s=>`<li>${s}</li>`).join('')}</ol>
      ${(t.examples && t.examples.length) ? `
      <div class="type-examples">
        <span class="ex-label">More Examples</span>
        <ul>${t.examples.map(ex=>`<li>${formatFracDisplay(ex)}</li>`).join('')}</ul>
      </div>` : ''}
    </div>
  `).join('');
}

/* ============================================================
   STORY MODE — "The Fraction Chronicles"
   A 50-level, Candy-Crush-style journey through the real history
   of fractions. The story is told gradually: each chapter spans
   a range of levels, and each level reveals just one small piece
   of that chapter's tale before its 10-question quiz begins.
   ============================================================ */
const HEART_MAX = 5;
const HEART_REGEN_MS = 15 * 60 * 1000; // one heart regrows every 15 minutes
const STORY_TOTAL_LEVELS = 50;
const STORY_PASS_SCORE = 5; // out of 10 — below this, the level is not completed

const STORY_CHAPTERS = [
  { id:'prologue', icon:'🌾', title:'Sharing the Harvest', start:1, end:4, segments:[
    "Long, long before schools, calculators, or textbooks existed, people already faced a simple problem: how could something be shared equally?",
    "Picture a family slicing one loaf of bread among several hungry children, or farmers trying to measure out land fairly between neighbors.",
    "Whole numbers like 1, 2, and 3 just weren't enough for jobs like these — you can't hand someone \"one and a half\" using only whole numbers.",
    "So people needed a way to describe *parts* of a whole. That simple need, thousands of years ago, gave birth to something we now call fractions."
  ]},
  { id:'egypt', icon:'🏺', title:'Scribes of the Nile', start:5, end:11, segments:[
    "Our story truly begins in ancient Egypt, more than four thousand years ago, beside the Nile River.",
    "Egyptian scribes carefully recorded numbers on papyrus scrolls, using fractions whenever they distributed food, measured grain, or planned great monuments.",
    "Egyptian fractions looked different from ours, though. They almost always used *unit fractions* — fractions where the numerator is always one, like 1/2 or 1/7.",
    "Instead of writing 3/4 the way we do, an Egyptian scribe would write it as 1/2 + 1/4 — a sum of unit fractions.",
    "It took real skill to break any fraction down that way, and scribes trained for years to master it.",
    "One especially famous scroll, the Rhind Mathematical Papyrus, is packed with examples of this clever unit-fraction system.",
    "From bread rations to the stones of the pyramids, Egypt shows us fractions were, from the very start, a tool for solving real, everyday problems."
  ]},
  { id:'babylon', icon:'🕐', title:'Sixty Suns of Babylon', start:12, end:17, segments:[
    "Around that same time, in the land between two rivers called Mesopotamia, the Babylonians were solving the same problem in a very different way.",
    "The Babylonians built their entire number system on the number 60 instead of the 10 we use today — mathematicians call this a \"base-60\" system.",
    "That unusual choice let them do very advanced calculations. Their way of writing fractions worked much like our decimals — just built on sixty instead of ten.",
    "Here's the amazing part: this ancient system never really disappeared. It survives every single day, hiding in plain sight.",
    "Whenever you check a clock and see 60 seconds in a minute, or 60 minutes in an hour, you're using a Babylonian idea that's thousands of years old.",
    "Even the 360 degrees in a full circle trace back to this same base-60 tradition. Babylon's fractions never really left us."
  ]},
  { id:'china', icon:'🐉', title:'Nine Chapters of China', start:18, end:23, segments:[
    "Centuries later, across the mountains in ancient China, fractions became essential for the everyday business of running a kingdom.",
    "Chinese mathematicians used fractions constantly — in trade, in collecting taxes, in engineering projects, and in measuring farmland fairly.",
    "Much of their knowledge was collected into a famous book called The Nine Chapters on the Mathematical Art.",
    "Inside it, scholars laid out clear methods for adding, subtracting, multiplying, and dividing fractions.",
    "What's remarkable is how familiar these methods feel — many of the steps described in that ancient book are strikingly similar to what students learn in school today.",
    "China proved that fractions weren't just an Egyptian or Babylonian idea — they were a tool great civilizations kept re-discovering, again and again."
  ]},
  { id:'greece', icon:'🏛️', title:'Ratios of Greece', start:24, end:28, segments:[
    "Meanwhile, in ancient Greece, great thinkers became fascinated by something a little different: not just sharing objects, but understanding the relationships between quantities.",
    "Philosophers and mathematicians such as Pythagoras and Euclid studied ratios and proportions while exploring geometry and the movement of the stars.",
    "To them, a fraction wasn't only \"a piece of pie\" — it was a way to compare one length, area, or distance to another.",
    "This shift in thinking helped make mathematics more logical and systematic, built on careful reasoning rather than just practical measuring.",
    "The Greeks remind us that fractions grew into more than a tool for sharing bread — they became a way of understanding the world itself."
  ]},
  { id:'india', icon:'🪷', title:'Scholars of India', start:29, end:34, segments:[
    "The next great leap forward came from India, sometime between the fifth and twelfth centuries.",
    "Indian mathematicians developed a notation for fractions that was much closer to the one we use today — clean, compact, and easy to work with.",
    "Brilliant scholars such as Aryabhata and Brahmagupta created clearer rules for calculating with fractions.",
    "Their work made fractions far easier to use in astronomy, in trade and commerce, and in the growing sciences of the time.",
    "News of these discoveries didn't stay in one place — through traders and travelers, India's mathematical ideas began spreading to other civilizations.",
    "Without knowing it, Aryabhata and Brahmagupta were laying groundwork that would shape mathematics for the rest of human history."
  ]},
  { id:'islam', icon:'☪️', title:'Golden Age of Islam', start:35, end:40, segments:[
    "From about the eighth to the fourteenth century, a remarkable era began across the Middle East, North Africa, and beyond: the Islamic Golden Age.",
    "Scholars in this era translated great mathematical works from Greece and from India into Arabic.",
    "But they didn't just copy the old ideas down — they studied them closely, tested them, and improved on them.",
    "Fractions became essential to everyday life: merchants used them for trade, families used them to divide inheritance fairly, architects used them to design buildings, and astronomers used them to track the stars.",
    "Through busy trade routes and centers of scholarship, these refined mathematical ideas began traveling even further — toward Europe.",
    "By the end of this golden age, fraction knowledge from three continents — Greece, India, and the Islamic world — had merged into one shared, more powerful tradition."
  ]},
  { id:'europe', icon:'🏰', title:'The Fraction Bar of Europe', start:41, end:45, segments:[
    "In medieval Europe, merchants, scholars, and students slowly began adopting the Hindu-Arabic numeral system that had traveled all the way from India and the Islamic world.",
    "Along with it came a small but powerful idea: the horizontal fraction bar — the simple line still drawn between a numerator and a denominator today.",
    "Suddenly, writing three-quarters as 3/4 became far simpler and quicker than any of the older, clunkier methods.",
    "As schools and trade expanded across Europe, fractions became a normal, expected part of everyday arithmetic — something every merchant's apprentice needed to know.",
    "That one small horizontal line — the fraction bar — is the very same symbol you still write in your notebook every time you solve a fraction problem today."
  ]},
  { id:'modern', icon:'🚀', title:'Fractions Today', start:46, end:50, segments:[
    "The story didn't end in medieval Europe. During the Scientific Revolution and the centuries that followed, fractions became deeply woven into algebra, calculus, physics, and engineering.",
    "Scientists used fractions to describe motion, electricity, probability, and countless other patterns hidden in nature.",
    "Today, fractions are everywhere: in recipes, in construction blueprints, in medicine dosages, in finance, and even inside the code that runs computers and phones.",
    "From a single loaf of bread shared among an ancient family, all the way to the equations powering modern science, fractions have traveled through more than four thousand years of human history.",
    "Every single time you write a fraction like 1/2, 3/4, or 5/8, you're using an idea shaped by Egyptian scribes, Babylonian astronomers, Chinese scholars, Greek philosophers, Indian mathematicians, Islamic scientists, and European thinkers — and now, by you. 🥭"
  ]}
];

function chapterForLevel(level){
  return STORY_CHAPTERS.find(c => level >= c.start && level <= c.end) || STORY_CHAPTERS[STORY_CHAPTERS.length-1];
}
function tierForLevel(level){
  if(level <= 10) return 'storyT1';
  if(level <= 20) return 'storyT2';
  if(level <= 30) return 'storyT3';
  if(level <= 40) return 'storyT4';
  return 'storyT5';
}
function starsForScore(score){
  if(score >= 9) return 3;
  if(score >= 7) return 2;
  if(score >= STORY_PASS_SCORE) return 1;
  return 0;
}

/* ---- Hearts (lives) system: 5 max, lose 1 on a failed level, regrow 1 every 15 min ---- */
function ensureStoryState(){
  if(!state.story){
    state.story = { levels:{}, hearts:HEART_MAX, nextHeartAt:null };
    saveState();
  }
}
function refreshHearts(){
  ensureStoryState();
  const s = state.story;
  if(s.hearts >= HEART_MAX){
    if(s.nextHeartAt){ s.nextHeartAt = null; saveState(); }
    return;
  }
  if(!s.nextHeartAt){ s.nextHeartAt = Date.now() + HEART_REGEN_MS; saveState(); return; }
  let changed = false;
  const now = Date.now();
  while(s.hearts < HEART_MAX && now >= s.nextHeartAt){
    s.hearts++;
    s.nextHeartAt += HEART_REGEN_MS;
    changed = true;
  }
  if(s.hearts >= HEART_MAX){ s.nextHeartAt = null; changed = true; }
  if(changed) saveState();
}
function loseHeart(){
  ensureStoryState();
  refreshHearts();
  const s = state.story;
  if(s.hearts > 0) s.hearts--;
  if(s.hearts < HEART_MAX && !s.nextHeartAt) s.nextHeartAt = Date.now() + HEART_REGEN_MS;
  saveState();
}
function heartCountdownText(){
  ensureStoryState();
  const s = state.story;
  if(s.hearts >= HEART_MAX || !s.nextHeartAt) return '';
  const ms = Math.max(0, s.nextHeartAt - Date.now());
  const mm = Math.floor(ms/60000), ss = Math.floor((ms%60000)/1000);
  return `next ❤️ in ${mm}:${String(ss).padStart(2,'0')}`;
}
function renderHeartsEverywhere(){
  refreshHearts();
  const s = state.story || { hearts:HEART_MAX };
  const iconsHtml = Array.from({length:HEART_MAX}, (_,i)=> `<span class="heart-icon ${i<s.hearts?'':'lost'}">❤️</span>`).join('');
  const timerText = heartCountdownText();
  ['heart-badge-icons','heart-badge-icons-map'].forEach(id=>{
    const el = document.getElementById(id); if(el) el.innerHTML = iconsHtml;
  });
  ['heart-badge-timer','heart-badge-timer-map'].forEach(id=>{
    const el = document.getElementById(id); if(el) el.textContent = timerText;
  });
  const hr = document.getElementById('story-hearts-hearts');
  if(hr) hr.innerHTML = Array.from({length:HEART_MAX}, (_,i)=> `<span class="heart-icon ${i<s.hearts?'':'lost'}">❤️</span>`).join('');
  const nh = document.getElementById('no-hearts-timer');
  if(nh && state.story){
    const ms = Math.max(0, (state.story.nextHeartAt || Date.now()) - Date.now());
    const mm = Math.floor(ms/60000), ss = Math.floor((ms%60000)/1000);
    nh.textContent = `${mm}:${String(ss).padStart(2,'0')}`;
  }
}
setInterval(renderHeartsEverywhere, 1000);

/* ---- Level progress / unlocking ---- */
function levelData(n){
  ensureStoryState();
  if(!state.story.levels[n]) state.story.levels[n] = { stars:0, passed:false };
  return state.story.levels[n];
}
function isLevelUnlocked(n){
  if(n === 1) return true;
  return !!levelData(n-1).passed;
}

/* ---- Level map screen: one continuous scrollable page, each chapter its
   own full-bleed flat-2D backdrop band with a zigzag Candy-Crush-style path
   of level nodes drawn right over that scenery (no separate divider bar —
   the background itself tells you which era/location you're in). ---- */
let storyActiveChapterId = null;

// Flat 2D art per chapter: sky gradient stops, ground color, and a landmark
// silhouette (built from plain CSS shapes — no shading/perspective).
const CHAPTER_ART = {
  prologue: { sky:['#cfe3a0','#8fae5c'], ground:'#6d8f45', landmark:'field' },
  egypt:    { sky:['#f7dfa0','#e2a95c'], ground:'#d8b46a', landmark:'pyramid' },
  babylon:  { sky:['#a9c9e6','#4a77a8'], ground:'#5c7a95', landmark:'ziggurat' },
  china:    { sky:['#f3c9c0','#c9503f'], ground:'#8a5a3a', landmark:'pagoda' },
  greece:   { sky:['#bfe0f5','#5faee3'], ground:'#d8cfae', landmark:'columns' },
  india:    { sky:['#f5c98a','#e8823a'], ground:'#7a4a86', landmark:'dome' },
  islam:    { sky:['#9fe0cf','#1fae8e'], ground:'#3a7a6c', landmark:'dome' },
  europe:   { sky:['#c7cfda','#8a95a5'], ground:'#5c6a7a', landmark:'castle' },
  modern:   { sky:['#8fa3c9','#3a4a63'], ground:'#232d3d', landmark:'city' }
};
const CHAPTER_NARRATORS = {
  prologue:"Lola Mangga, the Storyteller", egypt:"Sesha, Scribe of the Nile",
  babylon:"Enki, the Star-Counter", china:"Mei, Keeper of Nine Chapters",
  greece:"Theron the Philosopher", india:"Aryaka, Scholar of Numbers",
  islam:"Hakim, the Golden Scholar", europe:"Brother Aldric the Merchant-Monk",
  modern:"Dr. Nova, Scientist of Today"
};
// Small scattered props (in addition to the one big landmark) that fill out
// each band with detail so the setting reads clearly at a glance.
const CHAPTER_PROPS = {
  prologue: ['🌾','🍞','🧺','🏡','🌻','🐐','🪣','🌾'],
  egypt:    ['🌴','📜','🏺','🐫','☀️','🪨','🌴','🦅'],
  babylon:  ['🌙','⭐','📊','🏛️','🌿','🪶','⭐','🌙'],
  china:    ['🎋','🏮','☁️','🐉','🧧','🎍','☁️','🏮'],
  greece:   ['🏺','🫒','📐','🌿','🏛️','🍇','📏','🫒'],
  india:    ['🪷','🦚','🐘','🌶️','📿','🪷','🌸','🦚'],
  islam:    ['🕌','⭐','📚','🪔','🐫','✨','📚','🪔'],
  europe:   ['🏰','⛪','🌾','📖','🕯️','🍞','⛪','📖'],
  modern:   ['🚀','⚙️','💡','🔭','🛰️','⚛️','⚙️','💡']
};

function landmarkHTML(type, col){
  const c = `style="--lmcol:${col}"`;
  switch(type){
    case 'pyramid': return `<div class="lm lm-pyramid" ${c}></div>`;
    case 'ziggurat': return `<div class="lm lm-ziggurat"><span ${c} style="width:130px;height:16px;--lmcol:${col}"></span><span ${c} style="width:100px;height:16px;--lmcol:${col}"></span><span ${c} style="width:70px;height:16px;--lmcol:${col}"></span><span ${c} style="width:40px;height:16px;--lmcol:${col}"></span></div>`;
    case 'pagoda': return `<div class="lm lm-pagoda"><span style="width:70px;height:10px;--lmcol:${col}"></span><span style="width:56px;height:10px;--lmcol:${col}"></span><span style="width:42px;height:10px;--lmcol:${col}"></span><span style="width:8px;height:20px;--lmcol:${col};border-radius:0;"></span></div>`;
    case 'columns': return `<div class="lm lm-columns">${'<span style="--lmcol:'+col+'"></span>'.repeat(5)}</div>`;
    case 'dome': return `<div class="lm lm-dome" style="--lmcol:${col}"></div>`;
    case 'castle': return `<div class="lm lm-castle" style="--lmcol:${col}"></div>`;
    case 'city': return `<div class="lm lm-rocket-city"><span style="height:50px;--lmcol:${col}"></span><span style="height:80px;--lmcol:${col}"></span><span style="height:34px;--lmcol:${col}"></span><span style="height:64px;--lmcol:${col}"></span></div>`;
    case 'field': default: return `<div class="lm" style="width:60px;height:40px;background:${col};border:2px solid rgba(0,0,0,0.3);border-radius:50% 50% 0 0;"></div>`;
  }
}

function characterHTML(chapterId){
  return `<div class="story-char" data-chapter="${chapterId}">
    <div class="ch-headwear"></div>
    <div class="ch-head">
      <div class="ch-eye ch-eye-l"></div>
      <div class="ch-eye ch-eye-r"></div>
      <div class="ch-mouth"></div>
    </div>
    <div class="ch-arm ch-arm-l"></div>
    <div class="ch-arm ch-arm-r"></div>
    <div class="ch-body"><div class="ch-sash"></div></div>
    <div class="ch-item"></div>
    <div class="ch-legs"></div>
  </div>`;
}

function zigzagX(i){
  const stops = [22, 50, 78, 50];
  return stops[i % stops.length];
}

// Plain fallback road, used only if the art layer failed to load.
function fallbackRoad(count, stepY){
  let d = `M ${zigzagX(0)} 0`;
  for(let i=1;i<count;i++){
    const x0=zigzagX(i-1), y0=(i-1)*stepY, x1=zigzagX(i), y1=i*stepY, m=(y0+y1)/2;
    d += ` C ${x0} ${m}, ${x1} ${m}, ${x1} ${y1}`;
  }
  return `<svg viewBox="0 0 100 ${(count-1)*stepY}" preserveAspectRatio="none" aria-hidden="true"><path d="${d}" fill="none" stroke="#f4e2b8" stroke-width="22" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>`;
}

/* ---- Story art layer (story-art.js) — presentation only. If it ever fails to
   load, the game still plays; it just falls back to plain emoji tiles. ---- */
const SA = window.StoryArt || null;

const laneOf = (id,i,W)=> SA ? SA.laneX(id,i,W) : zigzagX(i);

function chapterProgress(ch){
  let done = 0, stars = 0;
  for(let n=ch.start;n<=ch.end;n++){ const d = levelData(n); if(d.passed) done++; stars += d.stars || 0; }
  return { done, total: ch.end-ch.start+1, stars };
}
function chapterIsDone(ch){ const p = chapterProgress(ch); return p.done === p.total; }
function chapterState(ch){
  if(!isLevelUnlocked(ch.start)) return 'locked';
  return chapterIsDone(ch) ? 'done' : 'current';
}
const CHAPTER_STATE_LABEL = { locked:'🔒 Locked', current:'▶ In progress', done:'✓ Completed' };

function buildChapterBand(chapter, idx){
  const count = chapter.end - chapter.start + 1;
  const stepY = 118;
  const pathHeight = (count-1)*stepY + 70; // + bottom padding so the last node isn't flush with the band edge
  const T = SA ? (SA.THEME[chapter.id] || SA.THEME.prologue) : { civ:'', period:'' };
  const st = chapterState(chapter), prog = chapterProgress(chapter);
  const pct = Math.round(prog.done / prog.total * 100);
  const mapW = (document.getElementById('story-map-scroll').clientWidth) || window.innerWidth;
  const xs = Array.from({length:count}, (_,i)=> laneOf(chapter.id, i, mapW));
  const road = SA ? SA.buildRoad(chapter.id, xs, mapW, stepY) : null;

  const band = document.createElement('div');
  band.className = 'chapter-band';
  band.id = 'band-' + chapter.id;
  band.dataset.chapter = chapter.id;
  band.dataset.state = st;
  if(SA){ SA.applyTheme(band, chapter.id); SA.applyMarker(band, chapter.id); }
  band.innerHTML = `
    ${SA ? SA.backdrop(chapter.id, 'map') : ''}
    <div class="band-sign">
      <div class="sign-num"><small>${idx===0?'Intro':'Ch.'}</small>${idx===0?chapter.icon:idx}</div>
      <h3>${chapter.title}</h3>
      <div class="sign-sub">${T.civ}${T.period?' · '+T.period:''}</div>
      <div class="sign-meta">
        <span class="sign-state">${CHAPTER_STATE_LABEL[st]}</span>
        <span class="sign-prog" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${pct}%"></i></span>
        <span class="sign-count">${prog.done}/${prog.total} levels · ${prog.stars}/${prog.total*3} ⭐</span>
      </div>
    </div>
    <div class="band-path" style="height:${pathHeight}px;">${road ? road.svg + road.decor : fallbackRoad(count, stepY)}</div>
  `;

  const pathWrap = band.querySelector('.band-path');
  for(let i=0;i<count;i++){
    const n = chapter.start + i;
    const data = levelData(n);
    const unlocked = isLevelUnlocked(n);
    if(SA){
      const base = document.createElement('div');
      base.className = 'lv-base' + (unlocked?' unlocked':' locked') + (data.passed?' passed':'') + (unlocked && !data.passed ? ' current':'');
      base.style.left = xs[i] + '%'; base.style.top = (i*stepY) + 'px';
      base.innerHTML = SA.plinthSVG(chapter.id);
      pathWrap.appendChild(base);
    }
    const node = document.createElement('div');
    node.className = 'level-node' + (unlocked?' unlocked':' locked') + (data.passed?' passed':'') + (unlocked && !data.passed ? ' current':'');
    node.style.left = xs[i] + '%';
    node.style.top = (i*stepY) + 'px';
    node.setAttribute('role','button');
    node.tabIndex = 0;
    node.setAttribute('aria-label', unlocked
      ? `Level ${n}, ${data.passed ? data.stars+' of 3 stars' : 'not completed yet'}`
      : `Level ${n}, locked`);
    if(!unlocked) node.setAttribute('aria-disabled','true');
    const starsMarkup = SA ? SA.starsHTML(data.stars||0, 3) : ('⭐'.repeat(data.stars)+'☆'.repeat(3-data.stars));
    node.innerHTML = unlocked
      ? `<span class="lv-go">${data.passed?'REPLAY':'GO!'}</span><span class="lv-num">${n}</span><span class="lv-stars">${starsMarkup}</span>`
      : `<span class="lv-num">${n}</span><span class="lv-lock-badge">🔒</span>`;
    const activate = ()=>{
      if(!unlocked){ toast('Finish the level before this one first!'); return; }
      openStoryDialogue(n);
    };
    node.addEventListener('click', activate);
    node.addEventListener('keydown', e=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); activate(); } });
    pathWrap.appendChild(node);
  }
  return band;
}

function buildStoryTimeline(){
  const tl = document.getElementById('story-timeline');
  if(!tl) return;
  let nowIdx = 0;
  STORY_CHAPTERS.forEach((ch,i)=>{ if(chapterState(ch) !== 'locked') nowIdx = i; });
  const frac = STORY_CHAPTERS.length > 1 ? nowIdx/(STORY_CHAPTERS.length-1) : 0;
  tl.innerHTML = `<span class="tl-fill" style="width:calc((100% - 40px) * ${frac.toFixed(3)})"></span>` +
    STORY_CHAPTERS.map((ch,i)=>{
      const stt = chapterState(ch);
      const cls = stt==='done' ? 'done' : (i===nowIdx ? 'now' : '');
      const T = SA ? (SA.THEME[ch.id]||{}) : {};
      return `<button type="button" class="tl-dot ${cls}" data-go="${ch.id}" aria-label="${ch.title}${stt==='locked'?' (locked)':''}"><span>${ch.icon}</span><em>${T.n||ch.title}</em></button>`;
    }).join('');
}
document.getElementById('story-timeline').addEventListener('click', e=>{
  const b = e.target.closest('.tl-dot'); if(!b) return;
  const band = document.getElementById('band-' + b.dataset.go);
  if(band) band.scrollIntoView({ block:'start', behavior: (SA && SA.reduceMotion()) ? 'auto' : 'smooth' });
});

function buildStoryMap(){
  ensureStoryState();
  renderHeartsEverywhere();
  document.getElementById('coin-count-map').textContent = state.coins;

  const scroll = document.getElementById('story-map-scroll');
  scroll.innerHTML = '';
  STORY_CHAPTERS.forEach((ch,i)=>{
    scroll.appendChild(buildChapterBand(ch, i));
    const next = STORY_CHAPTERS[i+1];
    if(next && SA){
      const nt = SA.THEME[next.id] || {}, pt = SA.THEME[ch.id] || {};
      const br = document.createElement('div');
      br.className = 'band-bridge';
      br.style.setProperty('--pg', pt.ground || '#5c7a45');
      br.style.setProperty('--ns', (nt.sky && nt.sky[0]) || '#8fc9ee');
      br.innerHTML = `<span>⏳ Onward to ${nt.civ||next.title} · ${nt.period||''}</span>`;
      scroll.appendChild(br);
    }
  });
  buildStoryTimeline();
  if(SA){ SA.observe(scroll, 'map'); SA.bindPins(); }

  // auto-scroll to the player's current chapter so they aren't dropped at level 1 every time
  let targetChapter = STORY_CHAPTERS[0];
  for(const ch of STORY_CHAPTERS){ if(isLevelUnlocked(ch.start)) targetChapter = ch; else break; }
  storyActiveChapterId = targetChapter.id;
  const targetBand = scroll.querySelector(`.chapter-band[data-chapter="${targetChapter.id}"]`);
  if(targetBand) requestAnimationFrame(()=> targetBand.scrollIntoView({ block:'start' }));
}

document.getElementById('btn-story').addEventListener('click', ()=>{
  show('screen-story-map');
  buildStoryMap();
});
document.getElementById('btn-story-journal').addEventListener('click', ()=>{
  if(SA) SA.openJournal(STORY_CHAPTERS, chapterIsDone);
});



/* ---- Dialogue screen: reveals one story segment before the level begins ---- */
let storyCurrentLevel = null;
function openStoryDialogue(n){
  storyCurrentLevel = n;
  const chapter = chapterForLevel(n);
  const segIndex = n - chapter.start;
  document.getElementById('story-dialogue-chapter-title').textContent = `${chapter.icon} ${chapter.title}`;
  document.getElementById('story-dialogue-level-tag').textContent = `Level ${n} of ${STORY_TOTAL_LEVELS}`;
  document.getElementById('story-dialogue-text').textContent = chapter.segments[segIndex];
  document.getElementById('story-narrator-icon').textContent = chapter.icon;
  document.getElementById('story-narrator-name').textContent = CHAPTER_NARRATORS[chapter.id] || 'Lola Mangga, the Storyteller';
  document.getElementById('story-dialogue-char').innerHTML = characterHTML(chapter.id);
  if(SA){
    SA.applyTheme(document.getElementById('screen-story-dialogue'), chapter.id);
    const dbg = document.getElementById('story-dialogue-bg');
    dbg.innerHTML = SA.backdrop(chapter.id, 'game');
    SA.observe(dbg, 'dlg');
  }

  refreshHearts();
  const actions = document.getElementById('story-dialogue-actions');
  if(state.story.hearts <= 0){
    actions.innerHTML = `<p class="story-no-hearts-note">💔 No hearts left — wait for one to regrow, or come back later.</p>
      <button class="btn btn-outline" id="btn-story-nohearts-back">Back to Map</button>`;
    document.getElementById('btn-story-nohearts-back').addEventListener('click', ()=>{ show('screen-story-map'); buildStoryMap(); });
  } else {
    actions.innerHTML = `<button class="btn btn-primary" id="btn-story-begin">▶ Begin Level</button>
      <button class="btn btn-outline" id="btn-story-notnow">Not Now</button>`;
    document.getElementById('btn-story-begin').addEventListener('click', ()=> startStoryLevel(n));
    document.getElementById('btn-story-notnow').addEventListener('click', ()=>{ show('screen-story-map'); buildStoryMap(); });
  }
  show('screen-story-dialogue');
  // brief, skippable chapter introduction the first time a chapter's opening level is visited
  if(SA && n === chapter.start && !levelData(n).passed && state.story.hearts > 0){
    SA.chapterIntro(chapter, STORY_CHAPTERS.indexOf(chapter), document.body);
  }
}

/* ---- Story gameplay: a 10x10 match-3 board. Every task assigns the current
   question's up-to-4 answer options to the 4 fruit types already on the board
   (the tiles themselves don't move between tasks — only which fruit currently
   "means" the correct answer changes). Matching 3+ of the correct fruit fills
   the star bar; matching a wrong fruit still pops normally but doesn't. ---- */
let storyQuiz = { level:null, taskIndex:0, score:0 };
let storyCurrentQuestion = null;
const M3_SIZE = 10;
const M3_FRUITS = ['🍎','🍇','🍊','🍓'];
let m3Board = [];       // [r][c] -> type index 0..3
let m3Selected = null;  // {r,c} | null
let m3Busy = false;     // blocks input while animating
let m3CorrectType = 0;
const FRAC_BASE = 100;                     // board value 100+n = fraction tile n
const storyFrac = { items:[], correctVal:-1, hint:false, won:false };
const isFracVal = v => v !== null && v !== undefined && v >= FRAC_BASE;

function sleep(ms){ return new Promise(res=> setTimeout(res, ms)); }

function m3RandType(){ return randInt(0, M3_FRUITS.length-1); }
let m3PrevBoard = null;
const m3LastRefill = [];
/* one candidate board: random type weights so the mix of fruit differs every time */
function m3BuildBoard(){
  const w = [0,1,2,3].map(()=> 0.6 + Math.random()*0.9);
  const wSum = w.reduce((a,b)=>a+b,0);
  const rand = ()=>{ let x = Math.random()*wSum; for(let i=0;i<4;i++){ x -= w[i]; if(x<=0) return i; } return 3; };
  const board = [];
  for(let r=0;r<M3_SIZE;r++){
    const row = [];
    for(let c=0;c<M3_SIZE;c++){
      let t, guard = 0;
      do{
        t = rand(); guard++;
      } while(guard < 30 && (
        (c>=2 && row[c-1]===t && row[c-2]===t) ||
        (r>=2 && board[r-1][c]===t && board[r-2][c]===t)
      ));
      row.push(t);
    }
    board.push(row);
  }
  return board;
}
function m3HasMove(board){
  for(let r=0;r<M3_SIZE;r++) for(let c=0;c<M3_SIZE;c++){
    for(const [dr,dc] of [[0,1],[1,0]]){
      const r2 = r+dr, c2 = c+dc;
      if(r2>=M3_SIZE || c2>=M3_SIZE) continue;
      if(isFracVal(board[r][c]) || isFracVal(board[r2][c2]) || board[r][c] === null || board[r2][c2] === null) continue;
      const t = board[r][c]; board[r][c] = board[r2][c2]; board[r2][c2] = t;
      const hit = m3FindMatches(board).matched.size > 0;
      board[r2][c2] = board[r][c]; board[r][c] = t;
      if(hit) return true;
    }
  }
  return false;
}
/* a new board must start with no ready-made matches, offer at least one move,
   and look clearly different from the previous board */
function m3GenerateBoard(){
  let best = null;
  for(let i=0;i<40;i++){
    const b = m3BuildBoard();
    if(m3FindMatches(b).matched.size > 0 || !m3HasMove(b)) continue;
    best = b;
    if(!m3PrevBoard) break;
    let same = 0;
    for(let r=0;r<M3_SIZE;r++) for(let c=0;c<M3_SIZE;c++) if(b[r][c] === m3PrevBoard[r][c]) same++;
    if(same < 45) break;   // random chance is ~25 of 100; 45+ means too similar
  }
  m3Board = best || m3BuildBoard();
  m3PrevBoard = m3Board.map(r=> r.slice());
  m3Selected = null;
}
/* refill: avoid dropping the same fruit again and again into the same column */
function m3RefillType(c){
  let t = m3RandType();
  if(m3LastRefill[c] === t && Math.random() < 0.7) t = (t + randInt(1,3)) % M3_FRUITS.length;
  m3LastRefill[c] = t;
  return t;
}

function m3Render(drops){
  const board = document.getElementById('match3-board');
  board.innerHTML = '';
  for(let r=0;r<M3_SIZE;r++){
    for(let c=0;c<M3_SIZE;c++){
      const el = document.createElement('div');
      el.className = 'm3-tile';
      el.dataset.r = r; el.dataset.c = c;
      const t = m3Board[r][c];
      el.dataset.alt = (r+c)%2;
      if(t===null) el.textContent = '';
      else if(isFracVal(t)){
        el.classList.add('frac'); if(m3FracText(t).length > 4) el.classList.add('long');
        el.innerHTML = `<span class="m3-frac-face">${formatFracDisplay(m3FracText(t).replace(/[&<>]/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch])))}</span>`;
        el.setAttribute('aria-label', 'Fraction ' + m3FracText(t));
        if(storyFrac.hint && t === storyFrac.correctVal) el.classList.add('hint-glow');
      }
      else if(SA) el.innerHTML = SA.fruitSVG(t);
      else el.textContent = M3_FRUITS[t];
      const dist = drops && drops[r+','+c];
      if(dist){ el.classList.add('falling'); el.style.setProperty('--drop', dist); }
      board.appendChild(el);
    }
  }
}
function m3TileEl(r,c){ return document.querySelector(`.m3-tile[data-r="${r}"][data-c="${c}"]`); }
function m3SetSelectedVisual(){
  document.querySelectorAll('.m3-tile.selected').forEach(el=> el.classList.remove('selected'));
  if(m3Selected) { const el = m3TileEl(m3Selected.r, m3Selected.c); if(el) el.classList.add('selected'); }
}

document.getElementById('match3-board').addEventListener('click', (e)=>{
  const tile = e.target.closest('.m3-tile');
  if(!tile || m3Busy) return;
  const r = parseInt(tile.dataset.r,10), c = parseInt(tile.dataset.c,10);
  if(isFracVal(m3Board[r][c])){
    tile.classList.add('shake'); setTimeout(()=> tile.classList.remove('shake'), 320);
    toast('Fractions stay put. Clear the fruit under them!');
    return;
  }
  if(!m3Selected){ m3Selected = {r,c}; m3SetSelectedVisual(); return; }
  if(m3Selected.r===r && m3Selected.c===c){ m3Selected = null; m3SetSelectedVisual(); return; }
  const adjacent = (Math.abs(m3Selected.r-r) + Math.abs(m3Selected.c-c)) === 1;
  if(!adjacent){ m3Selected = {r,c}; m3SetSelectedVisual(); return; }
  const from = m3Selected; m3Selected = null; m3SetSelectedVisual();
  m3TrySwap(from.r, from.c, r, c);
});

function m3FindMatches(board){
  const matched = new Set();
  const types = new Set();
  for(let r=0;r<M3_SIZE;r++){
    let runStart = 0;
    for(let c=1;c<=M3_SIZE;c++){
      const same = c<M3_SIZE && board[r][c]===board[r][runStart] && board[r][runStart]!==null;
      if(!same){
        if(c-runStart >= 3){
          for(let k=runStart;k<c;k++){ matched.add(r+','+k); types.add(board[r][runStart]); }
        }
        runStart = c;
      }
    }
  }
  for(let c=0;c<M3_SIZE;c++){
    let runStart = 0;
    for(let r=1;r<=M3_SIZE;r++){
      const same = r<M3_SIZE && board[r][c]===board[runStart][c] && board[runStart][c]!==null;
      if(!same){
        if(r-runStart >= 3){
          for(let k=runStart;k<r;k++){ matched.add(k+','+c); types.add(board[runStart][c]); }
        }
        runStart = r;
      }
    }
  }
  return { matched, types };
}

async function m3TrySwap(r1,c1,r2,c2){
  m3Busy = true;
  const swapH = SA ? await SA.swapOut(m3TileEl(r1,c1), m3TileEl(r2,c2)) : null; // visual slide only
  const tmp = m3Board[r1][c1]; m3Board[r1][c1] = m3Board[r2][c2]; m3Board[r2][c2] = tmp;
  const { matched } = m3FindMatches(m3Board);
  if(matched.size === 0){
    // invalid move — swap back with a little shake feedback
    m3Board[r2][c2] = m3Board[r1][c1]; m3Board[r1][c1] = tmp;
    if(swapH) await SA.swapBack(swapH);
    const elA = m3TileEl(r1,c1), elB = m3TileEl(r2,c2);
    [elA,elB].forEach(el=>{ if(el){ el.classList.add('shake'); setTimeout(()=> el.classList.remove('shake'), 320); } });
    await sleep(320);
    m3Busy = false;
    return;
  }
  m3Render();
  const allMatchedTypes = new Set();
  await m3ResolveCascade(allMatchedTypes);
  if(storyFrac.won){ m3OnCorrectLanded(); return; }
  // if the cascade leaves no possible move, re-deal the fruit (fractions stay in place)
  let redealt = false;
  if(!m3HasMove(m3Board)){ m3ReshuffleFruits(); redealt = true; }
  if(m3EnsurePath()) redealt = true;
  if(redealt){ m3Render(); toast('Fresh fruit dealt so you can keep going!'); }
  m3Busy = false;
}

/* the correct fraction reached the bottom row: count it and go to the next task */
function m3OnCorrectLanded(){
  const el = (()=>{ for(let c=0;c<M3_SIZE;c++) if(m3Board[M3_SIZE-1][c] === storyFrac.correctVal) return m3TileEl(M3_SIZE-1,c); return null; })();
  if(el){ el.classList.add('landed'); if(SA){ try{ SA.burst(el, true); }catch(e){} } }
  storyQuiz.score++;
  toast('The correct fraction reached the bottom! 🎉');
  storyQuiz.taskIndex++;
  setTimeout(loadStoryTask, 900);       // input stays locked until the next task is dealt
}

/* visual-only: flag which legend rows were just matched (green = answer, red = not the answer) */
function storyMarkLegend(types){
  document.querySelectorAll('#story-task-legend .task-legend-item').forEach(el=>{
    const t = Number(el.dataset.type);
    if(!types.has(t)) return;
    if(t === m3CorrectType) el.classList.add('correct');
    else { el.classList.add('wrong'); setTimeout(()=> el.classList.remove('wrong'), 1100); }
  });
}

async function m3ResolveCascade(allMatchedTypes){
  let guard = 0;
  while(guard < 40){
    guard++;
    // the correct fraction on the bottom row = answer found (checked before anything else)
    if(m3Board[M3_SIZE-1].some(v=> v === storyFrac.correctVal && storyFrac.correctVal >= 0)){
      storyFrac.won = true; break;
    }
    const { matched, types } = m3FindMatches(m3Board);
    // a wrong fraction on the bottom row is swept away, which reopens its column
    const swept = [];
    for(let c=0;c<M3_SIZE;c++) if(isFracVal(m3Board[M3_SIZE-1][c])) swept.push((M3_SIZE-1)+','+c);
    if(matched.size === 0 && swept.length === 0) break;
    types.forEach(t=> allMatchedTypes.add(t));
    const removing = new Set([...matched, ...swept]);
    removing.forEach(key=>{
      const [r,c] = key.split(',').map(Number);
      const el = m3TileEl(r,c);
      if(el){ el.classList.add('popping'); if(SA) SA.burst(el, false); }
    });
    if(swept.length) toast('Not the answer — that fraction was cleared. Keep going!');
    await sleep(280);
    removing.forEach(key=>{
      const [r,c] = key.split(',').map(Number);
      m3Board[r][c] = null;
    });
    // visual only: how far each surviving / new tile will travel (for the falling animation)
    const drops = {};
    for(let c=0;c<M3_SIZE;c++){
      let gaps = 0;
      for(let r=M3_SIZE-1;r>=0;r--){
        if(m3Board[r][c] === null) gaps++;
        else if(gaps > 0) drops[(r+gaps)+','+c] = gaps;
      }
      for(let r=0;r<gaps;r++) drops[r+','+c] = gaps;
    }
    // gravity: every tile (fruit AND fraction) drops only into space that was cleared below it
    for(let c=0;c<M3_SIZE;c++){
      const col = [];
      for(let r=0;r<M3_SIZE;r++){ if(m3Board[r][c] !== null) col.push(m3Board[r][c]); }
      const missing = M3_SIZE - col.length;
      const filled = Array.from({length:missing}, ()=> m3RefillType(c)).concat(col);
      for(let r=0;r<M3_SIZE;r++) m3Board[r][c] = filled[r];
    }
    m3Render(drops);
    await sleep(300);
  }
}

function m3HintHighlight(){
  storyFrac.hint = true;
  for(let r=0;r<M3_SIZE;r++) for(let c=0;c<M3_SIZE;c++){
    const el = m3TileEl(r,c);
    if(el) el.classList.toggle('hint-glow', m3Board[r][c] === storyFrac.correctVal);
  }
}

function updateStoryHud(){
  const c = document.getElementById('story-hud-coins'); if(c) c.textContent = state.coins;
  const l = document.getElementById('story-hud-lvl'); if(l) l.textContent = state.level;
  const bar = document.getElementById('story-hud-expbar');
  if(bar){
    const needed = expNeededForLevel(state.level);
    bar.style.width = (needed === null ? 100 : Math.min(100, Math.round(state.exp/needed*100))) + '%';
  }
  renderHeartsEverywhere();
}

function startStoryLevel(n){
  refreshHearts();
  if(state.story.hearts <= 0){
    document.getElementById('no-hearts-modal').classList.remove('hidden');
    return;
  }
  storyQuiz = { level:n, taskIndex:0, score:0 };
  const chapter = chapterForLevel(n);
  const art = CHAPTER_ART[chapter.id] || CHAPTER_ART.prologue;
  document.getElementById('story-hud-chapter').textContent = `${chapter.icon} ${chapter.title}`;
  document.getElementById('story-hud-level').textContent = `Level ${n}`;
  if(SA){
    SA.applyTheme(document.getElementById('screen-story-quiz'), chapter.id);
    SA.applyTheme(document.getElementById('story-result-modal'), chapter.id);
    SA.applyTheme(document.getElementById('story-quit-modal'), chapter.id);
    const gbg = document.getElementById('story-game-bg');
    gbg.innerHTML = SA.backdrop(chapter.id, 'game');
    SA.observe(gbg, 'game');
  } else {
    document.getElementById('story-game-bg').style.background = `linear-gradient(180deg, ${art.sky[0]}, ${art.sky[1]} 60%, ${art.ground})`;
  }
  updateStoryHud();
  document.getElementById('story-game-char').innerHTML = characterHTML(chapter.id);
  document.getElementById('story-task-total').textContent = ROUND_LENGTH;
  m3GenerateBoard();
  m3Render();
  show('screen-story-quiz');
  loadStoryTask();
  if(window.fracStartAfterTutorial) window.fracStartAfterTutorial('story', function(){});
}

/* ============================================================
   STORY MODE — fractions hidden among the fruit
   Fraction tiles sit still inside the fruit box. They never move on their
   own: they only drop (with gravity, like the fruit) when the tiles under
   them are cleared by matching fruit. When the CORRECT fraction reaches the
   bottom row, the answer is recognised automatically. A wrong fraction that
   reaches the bottom row is cleared away, which reopens that column.
   ============================================================ */

/* extra random fractions so the box holds more than just the 4 answer choices */
function storyExtraFractions(q, count){
  const correctQ = parseQ(q.correct);
  if(!correctQ || q.style === 'text') return [];
  // questions whose answer depends on the choice set itself (least/greatest, compare, equivalent,
  // missing value…) keep their original choices only, so no extra fraction can become a second right answer
  if(/which|least|greatest|smallest|largest|biggest|compare|order|bigger|smaller|more than|less than|equivalent|equal|missing|same as|[?]\s*\/|\/\s*[?]/i.test(String(q.prompt))) return [];
  const shapeOf = f => f[1]===1 ? 'int' : (f[0] < f[1] ? 'prop' : 'mix');
  const wantShape = shapeOf(correctQ);
  const have = new Set(q.options.map(o=>{ const p = parseQ(o); return p ? p[0]+'/'+p[1] : o; }));
  have.add(correctQ[0]+'/'+correctQ[1]);
  const style = q.style || 'mixed';
  const out = [];
  const tryAdd = raw=>{
    if(out.length >= count || !raw) return;
    const f = QM(raw[0], raw[1]), k = f[0]+'/'+f[1];
    if(have.has(k) || f[0] < 1 || f[1] < 1 || f[0] > 60 || f[1] > 40) return;
    if(shapeOf(f) !== wantShape) return;
    if(qVal(correctQ) < 1 && qVal(f) >= 1) return;       // keep "below 1" answers' company below 1
    have.add(k); out.push(fmtQ(f, style));
  };
  shuffle(neighborsOf(correctQ).slice()).forEach(tryAdd);
  const maxD = Math.max(correctQ[1] + 3, 8);
  for(let i=0; i<40 && out.length < count; i++){
    const d = randInt(2, Math.min(maxD, 24));
    tryAdd([randInt(1, Math.max(1, Math.round(qVal(correctQ) * d * 1.6) + 1)), d]);
  }
  return out;
}


/* put the answers and some extra random fractions on the board, each in its own
   column; the correct one starts well above the bottom so it has to be guided down */
function m3PlaceFractions(q){
  const items = q.options.map(o=> ({ text:o, correct: o === q.correct }));
  if(q.style !== 'text') storyExtraFractions(q, 2).forEach(t=> items.push({ text:t, correct:false }));
  shuffle(items);
  const cols = shuffle(Array.from({length:M3_SIZE}, (_,i)=> i));
  storyFrac.items = items;
  storyFrac.correctVal = -1;
  storyFrac.hint = false;
  storyFrac.won = false;
  items.forEach((it, n)=>{
    const c = cols[n];
    const r = it.correct ? randInt(1, 5) : randInt(0, 7);   // correct: 4–8 rows to travel
    it.val = FRAC_BASE + n;
    if(it.correct) storyFrac.correctVal = it.val;
    m3Board[r][c] = it.val;
  });
}
/* where is the correct fraction? -> {r,c} or null */
function m3CorrectPos(){
  for(let r=0;r<M3_SIZE;r++) for(let c=0;c<M3_SIZE;c++) if(m3Board[r][c] === storyFrac.correctVal) return {r,c};
  return null;
}
/* is there a legal swap that clears a tile somewhere under the correct fraction (in its column)? */
function m3PathMoveExists(){
  const p = m3CorrectPos(); if(!p) return true;
  for(let r=0;r<M3_SIZE;r++) for(let c=0;c<M3_SIZE;c++){
    for(const [dr,dc] of [[0,1],[1,0]]){
      const r2 = r+dr, c2 = c+dc;
      if(r2>=M3_SIZE || c2>=M3_SIZE) continue;
      const a = m3Board[r][c], b = m3Board[r2][c2];
      if(isFracVal(a) || isFracVal(b) || a === null || b === null) continue;
      m3Board[r][c] = b; m3Board[r2][c2] = a;
      let ok = false;
      m3FindMatches(m3Board).matched.forEach(k=>{ const [mr,mc] = k.split(',').map(Number); if(mc === p.c && mr > p.r) ok = true; });
      m3Board[r][c] = a; m3Board[r2][c2] = b;
      if(ok) return true;
    }
  }
  return false;
}
/* Fruit can only change by matching, so a quiet pocket of fruit could leave the correct fraction
   stuck for good. If no move can clear anything under it, refresh the fruit around and below it
   (never the fractions) until a real match under the fraction is possible. Returns true if it re-dealt. */
function m3EnsurePath(){
  const p = m3CorrectPos();
  if(!p || p.r >= M3_SIZE-1 || m3PathMoveExists()) return false;
  const c0 = Math.max(0, p.c-2), c1 = Math.min(M3_SIZE-1, p.c+2);
  const cells = [];
  for(let r=Math.max(0,p.r-1); r<M3_SIZE; r++) for(let c=c0;c<=c1;c++) if(!isFracVal(m3Board[r][c])) cells.push([r,c]);
  for(let i=0;i<300;i++){
    cells.forEach(([r,c])=>{ m3Board[r][c] = m3RandType(); });
    if(m3FindMatches(m3Board).matched.size === 0 && m3PathMoveExists()) return true;
  }
  return true;
}
function m3FracText(v){ const it = storyFrac.items[v - FRAC_BASE]; return it ? it.text : ''; }

/* only fruit can be swapped: fraction tiles stay where they are */
function m3ReshuffleFruits(){
  const cells = [];
  for(let r=0;r<M3_SIZE;r++) for(let c=0;c<M3_SIZE;c++) if(!isFracVal(m3Board[r][c])) cells.push([r,c]);
  for(let i=0;i<80;i++){
    cells.forEach(([r,c])=>{ m3Board[r][c] = m3RandType(); });
    if(m3FindMatches(m3Board).matched.size === 0 && m3HasMove(m3Board)) return;
  }
  // very unlikely fallback: repair matches by re-rolling matched cells
  for(let g=0; g<200; g++){
    const { matched } = m3FindMatches(m3Board);
    if(matched.size === 0 && m3HasMove(m3Board)) return;
    (matched.size ? [...matched].map(k=>k.split(',').map(Number)) : cells.slice(0,6)).forEach(([r,c])=>{ m3Board[r][c] = m3RandType(); });
  }
}

function loadStoryTask(){
  if(storyQuiz.taskIndex >= ROUND_LENGTH){ finishStoryLevel(); return; }
  document.getElementById('story-task-index').textContent = storyQuiz.taskIndex + 1;

  const tier = tierForLevel(storyQuiz.level);
  storyCurrentQuestion = generateUniqueQuestion('story', tier);
  document.getElementById('story-task-question').innerHTML = formatFracDisplay(storyCurrentQuestion.prompt);

  // fruit no longer stands for an answer: a fresh, different fruit box every task,
  // and the answers fall through it as fractions
  m3CorrectType = -1;
  m3GenerateBoard();
  m3PlaceFractions(storyCurrentQuestion);
  if(!m3HasMove(m3Board) || m3FindMatches(m3Board).matched.size) m3ReshuffleFruits();
  m3EnsurePath();
  m3Busy = false;
  m3Render();

  const hintBtn = document.getElementById('btn-story-hint');
  if(storyQuiz.level < 10){
    hintBtn.disabled = true;
    hintBtn.textContent = '💡 Hint · Level 10';
  } else {
    hintBtn.disabled = false;
    hintBtn.textContent = '💡 Hint · 15 🪙';
  }

  const pct = Math.min(100, Math.round((storyQuiz.score / ROUND_LENGTH) * 100));
  document.getElementById('story-star-fill').style.width = pct + '%';
  if(SA) SA.progressUpdate(storyQuiz.score, storyQuiz.taskIndex, ROUND_LENGTH);
  updateStoryHud();
}

document.getElementById('btn-story-hint').addEventListener('click', ()=>{
  if(storyQuiz.level < 10) return;
  if(!spendCoins(15)){ toast('Not enough coins for a hint!'); return; }
  m3HintHighlight();
  updateStoryHud();
});
document.getElementById('btn-quit-story').addEventListener('click', ()=>{
  document.getElementById('story-quit-modal').classList.remove('hidden');
  document.getElementById('btn-story-quit-stay').focus();
});
document.getElementById('btn-story-quit-stay').addEventListener('click', ()=>{
  document.getElementById('story-quit-modal').classList.add('hidden');
});
document.getElementById('btn-story-quit-leave').addEventListener('click', ()=>{
  document.getElementById('story-quit-modal').classList.add('hidden');
  show('screen-story-map');
  buildStoryMap();
});
document.addEventListener('keydown', e=>{
  if(e.key === 'Escape') document.getElementById('story-quit-modal').classList.add('hidden');
});
document.getElementById('btn-no-hearts-ok').addEventListener('click', ()=>{
  document.getElementById('no-hearts-modal').classList.add('hidden');
});

/* ---- Level results: pass/fail, stars, minimal coin/EXP reward, heart loss ---- */
function finishStoryLevel(){
  const n = storyQuiz.level;
  const score = storyQuiz.score;
  const stars = starsForScore(score);
  const passed = score >= STORY_PASS_SCORE;
  const data = levelData(n);
  const chapter = chapterForLevel(n);
  const chapterWasDone = chapterIsDone(chapter);

  let coins = 0, exp = 0;
  if(passed){
    if(stars > data.stars) data.stars = stars;
    data.passed = true;
    // Rewards are kept deliberately small so coins stay meaningful for hints.
    coins = stars;
    exp = 10 + stars*8;
    addCoins(coins);
    addExp(exp);
  } else {
    loseHeart();
  }
  saveState();
  renderHeartsEverywhere();

  const resIcon = document.getElementById('story-result-icon');
  resIcon.textContent = passed ? '⭐' : '💔';
  resIcon.classList.toggle('fail', !passed);
  document.getElementById('story-result-title').textContent = passed ? 'Level Complete!' : 'Level Not Completed';
  const starsEl = document.getElementById('story-result-stars');
  if(SA) starsEl.innerHTML = SA.starsHTML(passed ? stars : 0, 3);
  else starsEl.textContent = passed ? ('⭐'.repeat(stars)+'☆'.repeat(3-stars)) : '☆☆☆';
  // celebratory confetti + (first time only) the chapter-complete journal card
  const conf = document.getElementById('story-confetti');
  conf.innerHTML = '';
  if(passed && SA && !SA.reduceMotion()){
    const cols = ['#ffd23a','#8cf0b8','#ff8aa0','#7cc8ff','#fff6c0'];
    for(let i=0;i<22;i++){
      const p = document.createElement('i');
      p.style.left = (Math.random()*100).toFixed(1)+'%';
      p.style.background = cols[i % cols.length];
      p.style.animationDelay = (Math.random()*0.8).toFixed(2)+'s';
      p.style.animationDuration = (1.8+Math.random()*1.2).toFixed(2)+'s';
      conf.appendChild(p);
    }
  }
  const extra = document.getElementById('story-result-extra');
  extra.innerHTML = '';
  if(passed && SA && !chapterWasDone && chapterIsDone(chapter)){
    const cp = chapterProgress(chapter);
    extra.innerHTML = SA.chapterCompleteHTML(chapter, STORY_CHAPTERS.indexOf(chapter), { levels:cp.total, stars:cp.stars, maxStars:cp.total*3 });
  }
  updateStoryHud();
  document.getElementById('story-result-sub').textContent = `Score: ${score} / ${ROUND_LENGTH}`;
  document.getElementById('story-result-reward').textContent = passed
    ? `+${exp} EXP, +${coins} 🪙`
    : `Need at least ${STORY_PASS_SCORE}/10 correct to pass. 1 heart lost — hearts regrow every 15 minutes.`;

  const nextBtn = document.getElementById('btn-story-next');
  const nextLevelExists = n < STORY_TOTAL_LEVELS;
  nextBtn.classList.toggle('hidden', !(passed && nextLevelExists));
  nextBtn.onclick = ()=>{
    document.getElementById('story-result-modal').classList.add('hidden');
    if(nextLevelExists) openStoryDialogue(n+1);
  };
  document.getElementById('btn-story-retry').onclick = ()=>{
    document.getElementById('story-result-modal').classList.add('hidden');
    openStoryDialogue(n);
  };
  document.getElementById('btn-story-tomap').onclick = ()=>{
    document.getElementById('story-result-modal').classList.add('hidden');
    show('screen-story-map');
    buildStoryMap();
  };
  document.getElementById('story-result-modal').classList.remove('hidden');
}

/* ============================================================
   INIT
   ============================================================ */
function init(){
  if(SA) SA.ensureDefs();
  buildFloatingFractions();
  buildTypeDecorations();
  buildTwinkleStars();
  buildMangoStrip();
  renderMangoArt();
  buildHubCards();
  buildFishBubbles();
  buildFishClouds();
  buildFishGulls();
  buildFishBackgroundSchool();
  buildSnakeLeaves();
  buildKnowledgeSection();
  initInteractiveTouches();
  renderExpBar();
  renderTopBadges();
  ensureStoryState();
  renderHeartsEverywhere();
  checkDailyStreak();
}
init();



/* ============================================================
   HOW TO PLAY — guide, first-time tutorials and Help buttons
   Every rule below mirrors a rule that really exists in the game code.
   ============================================================ */
(function(){
  const $ = id => document.getElementById(id);
  const esc = t => String(t).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));

  const ROOT = {
    title:'What is FracDash?',
    intro:'FracDash is a learning game. Every question is a small fraction exercise, so each answer you give is practice — not just points.',
    skills:[
      ['🧩','Understand how fractions work'],
      ['➕','Add and subtract fractions'],
      ['🔗','Find a common denominator'],
      ['✂️','Simplify fractions'],
      ['🟰','Spot equivalent fractions (like 1/2 = 2/4)'],
      ['📖','Use fractions in simple word problems']
    ],
    tip:'A wrong answer is okay. The game shows you the correct answer, so you can learn from it.'
  };

  const LEVELS = [
    ['🌱','Easy','Practice basic fraction problems.','15 seconds'],
    ['🍊','Medium','Solve slightly more challenging fraction problems.','20 seconds'],
    ['🔥','Hard','Work with more complicated fraction calculations.','25 seconds'],
    ['💀','Insane','Test your fraction skills with the most challenging questions.','30 seconds']
  ];
  const ICONS = [
    ['❓','Help','Opens this guide any time.'],
    ['⏱','Timer','Time left for the question. At 0, the question counts as wrong.'],
    ['💡','Hint','Costs 15 🪙. Takes away 2 wrong answers.'],
    ['❤','Lives / Hearts','Fishtions lives and Story hearts.'],
    ['⭐','Stars & EXP','Earn EXP for correct answers. Stars are for Story levels.'],
    ['🪙','Coins','Earned at the end of a round. Spend them on hints.']
  ];

  const HELP = {
    match:{ icon:'🃏', name:'Fraction Match', theme:'match',
      goal:'Answer 10 fraction questions correctly. You sit in a classroom with 4 classmates who answer the same questions.',
      controls:[['👆','Tap an answer (A, B, C or D)']],
      steps:['Read the fraction question on the board.','Work it out on paper or in your head.','Tap the answer you think is correct.','Green means right. Red means wrong — and the right answer is shown.','Wait for your classmates. The next question comes up.','After 10 questions, see your score and the classroom ranking.'],
      challenge:['A new question shows up with 4 answers (A–D).','Only one answer is correct.','Each correct answer moves you toward a higher score.'],
      rewards:['⭐ EXP for every correct answer: Easy 20, Medium 35, Hard 55, Insane 80.','🪙 Coins at the end: 3–5 correct = 1 coin, 6–8 = 2 coins, 9–10 = 3 coins.'],
      mistakes:['A wrong answer or running out of time gives no points for that question.','No lives are lost. You simply go on to the next question.','💡 Hint (15 🪙) removes 2 wrong answers.','The round is finished after 10 questions.'] },
    mango:{ icon:'🥭', name:'Mango Falling', theme:'mango',
      goal:'Catch the mango that has the correct answer. Do this for 10 questions.',
      controls:[['⬅ ➡','Arrow keys or A / D'],['👆','Or drag / tap in the field']],
      steps:['Read the question at the top.','Mangoes fall from the tree. Each one shows an answer.','Move the farmer left or right.','Put the basket under the mango with the correct answer.','The mango that lands in the basket is your answer.'],
      challenge:['Solve the question first, then look for that answer on the mangoes.','Only one mango has the correct answer.','You do not tap the mangoes — you move the basket.'],
      rewards:['⭐ EXP for every correct catch: Easy 20, Medium 35, Hard 55, Insane 80.','🪙 Coins at the end: 3–5 correct = 1 coin, 6–8 = 2 coins, 9–10 = 3 coins.'],
      mistakes:['A wrong mango, or running out of time, gives no points for that question.','No lives are lost. The correct answer is shown, then the next question starts.','💡 Hint (15 🪙) removes 2 wrong mangoes.','The round is finished after 10 questions.'] },
    fish:{ icon:'🎣', name:'Fishtions', theme:'fish',
      goal:'Catch the fish that carries the correct answer. Keep your hearts safe for all 10 questions.',
      controls:[['⬆ ⬇','Arrow keys or W / S'],['👆','Or drag up and down']],
      steps:['Read the question at the top.','Fish swim across the sea. Each one shows an answer.','Move the hook up or down.','Line the hook up with the fish that has the correct answer.','The hook catches the fish it reaches.'],
      challenge:['Solve the question first, then look for that answer on a fish.','Only one fish has the correct answer.'],
      rewards:['⭐ EXP for every correct catch: Easy 20, Medium 35, Hard 55, Insane 80.','🪙 Coins at the end: 3–5 correct = 1 coin, 6–8 = 2 coins, 9–10 = 3 coins.'],
      mistakes:['❤ You start with 5 lives. Catching a wrong fish costs 1 life.','If you run out of time, you get no points, but you do not lose a life.','If all 5 lives are gone, the round ends early.','💡 Hint (15 🪙) removes 2 wrong fish.'] },
    snake:{ icon:'🐍', name:'S-Frac', theme:'snake',
      goal:'Steer the snake to the fruit with the correct answer. Try to finish all 10 questions with a long snake.',
      controls:[['⬅ ⬆ ⬇ ➡','Arrow keys or W A S D'],['👆','Or drag / tap in the field']],
      steps:['Read the question at the top.','Fruits are spread around the forest. Each one shows an answer.','Move the snake with the arrow keys or by dragging.','Slither to the fruit with the correct answer and eat it.'],
      challenge:['Solve the question first, then look for that answer on a fruit.','Read every answer carefully before you move.'],
      rewards:['📈 Eating the correct fruit makes the snake grow.','⭐ EXP for every correct answer: Easy 20, Medium 35, Hard 55, Insane 80.','🪙 Coins at the end: 3–5 correct = 1 coin, 6–8 = 2 coins, 9–10 = 3 coins.','🎉 Your final score decides the ending animation.'],
      mistakes:['Eating a wrong fruit makes the snake shrink, and you get no points for that question.','Running out of time also gives no points.','💡 Hint (15 🪙) removes 2 wrong fruits.','The round is finished after 10 questions.'] },
    story:{ icon:'📖', name:'Story Mode', theme:'story',
      goal:'Travel through the history of fractions. In each task, guide the correct fraction down to the bottom of the fruit box.',
      controls:[['🍎','Tap a fruit, then tap the fruit next to it to swap them'],['🎯','Fractions never move by themselves']],
      steps:['Pick the next level on the map.','Read a short piece of the story.','Each level has 10 tasks. Read the question and solve it.','Fractions sit still among the fruit. Only one is the correct answer.','Swap fruit to line up 3 or more of the same fruit. They disappear.','The tiles above fall into the empty space — fractions too.','Keep clearing fruit under the correct fraction until it reaches the bottom row.'],
      challenge:['Solve the question first, then find your answer among the fractions.','A fraction only drops when the tiles under it are cleared.','Fractions cannot be swapped. Clear the fruit below them instead.','When the correct fraction reaches the bottom, the game counts it and shows the next task.'],
      rewards:['⭐ 5–6 correct = 1 star, 7–8 = 2 stars, 9–10 = 3 stars.','Score 5 or more to pass and unlock the next level.','🪙 A small number of coins and EXP when you finish a level.'],
      mistakes:['A wrong fraction that reaches the bottom is cleared away. Nothing is lost, and its column opens up.','If no fruit can be swapped, the fruit is reshuffled for you.','❤ You have 5 hearts. If you score below 5, you lose 1 heart.','A lost heart grows back in 15 minutes.','💡 Hint (15 🪙) makes the correct fraction glow. It unlocks at Level 10.'] }
  };

  const SECTIONS = [
    ['🎯','Goal',null],
    ['🕹','How to play','steps'],
    ['➗','Fraction challenge','challenge'],
    ['⭐','Points & rewards','rewards'],
    ['💡','Mistakes & progress','mistakes']
  ];

  function list(items, ordered){
    const tag = ordered ? 'ol' : 'ul';
    return `<${tag}>` + items.map(i => `<li>${esc(i)}</li>`).join('') + `</${tag}>`;
  }
  function controlChips(h){
    return `<div class="hp-controls">` + h.controls.map(c => `<span class="hp-chip"><b>${c[0]}</b> ${esc(c[1])}</span>`).join('') + `</div>`;
  }
  function gameGuide(id){
    const h = HELP[id];
    let out = `<section class="hp-game hp-${h.theme}"><h3 class="hp-title" id="help-modal-title"><span>${h.icon}</span> ${esc(h.name)}</h3>`;
    out += `<div class="hp-sec"><h4>🎯 Goal</h4><p>${esc(h.goal)}</p></div>`;
    out += `<div class="hp-sec"><h4>🕹 How to play</h4>${controlChips(h)}${list(h.steps, true)}</div>`;
    out += `<div class="hp-sec"><h4>➗ Fraction challenge</h4>${list(h.challenge)}
      <div class="hp-example"><span class="hp-q">Example: ${formatFracDisplay('1/4')} + ${formatFracDisplay('2/4')} = ?</span><span class="hp-arrow">→</span><span class="hp-a">${formatFracDisplay('3/4')}</span></div>
      <p class="hp-note">Same bottom number? Add the top numbers. Keep the bottom number.</p></div>`;
    out += `<div class="hp-sec"><h4>⭐ Points & rewards</h4>${list(h.rewards)}</div>`;
    out += `<div class="hp-sec"><h4>💡 Mistakes & progress</h4>${list(h.mistakes)}</div>`;
    return out + `</section>`;
  }

  /* ---------- The How to Play screen ---------- */
  function buildHub(){
    const hub = $('help-hub'); if(!hub) return;
    const tabs = ['match','mango','fish','snake','story'];
    hub.innerHTML = `
      <div class="card-panel hp-root">
        <h3>🥭 ${esc(ROOT.title)}</h3>
        <p>${esc(ROOT.intro)}</p>
        <div class="hp-skills">${ROOT.skills.map(s => `<span class="hp-skill"><b>${s[0]}</b>${esc(s[1])}</span>`).join('')}</div>
        <p class="hp-note">💚 ${esc(ROOT.tip)}</p>
      </div>
      <div class="card-panel">
        <h3>🌱 The 4 levels</h3>
        <div class="hp-levels">${LEVELS.map(l => `<div class="hp-level"><b>${l[0]} ${l[1]}</b><span>${esc(l[2])}</span><em>⏱ ${l[3]} per question</em></div>`).join('')}</div>
        <p class="hp-note">Harder levels give you more time, because the problems take longer.</p>
      </div>
      <div class="card-panel">
        <h3>🔎 Icons you will see</h3>
        <div class="hp-icons">${ICONS.map(i => `<div class="hp-icon"><b>${i[0]}</b><span><u>${i[1]}</u> ${esc(i[2])}</span></div>`).join('')}</div>
      </div>
      <div class="card-panel hp-tabs-panel">
        <h3>🎮 Pick a game to learn</h3>
        <div class="hp-tabs" role="tablist">${tabs.map((t,i) => `<button class="hp-tab${i?'':' on'}" role="tab" data-hp-tab="${t}">${HELP[t].icon} ${esc(HELP[t].name)}</button>`).join('')}</div>
        <div id="hp-tab-body">${gameGuide('match')}</div>
        <button class="btn btn-leaf" id="hp-try" data-hp-try="match">▶ Try the tutorial</button>
      </div>`;
    hub.querySelectorAll('[data-hp-tab]').forEach(b => b.addEventListener('click', () => {
      hub.querySelectorAll('.hp-tab').forEach(x => x.classList.toggle('on', x === b));
      const id = b.getAttribute('data-hp-tab');
      $('hp-tab-body').innerHTML = gameGuide(id).replace(' id="help-modal-title"','');
      $('hp-try').setAttribute('data-hp-try', id);
    }));
    $('hp-try').addEventListener('click', e => openTutorial(e.currentTarget.getAttribute('data-hp-try'), null, true));
  }
  buildHub();
  /* keep the guide screen as the target of the menu button */
  const menuBtn = $('btn-mechanics'); if(menuBtn) menuBtn.addEventListener('click', buildHub);

  /* ---------- tutorial memory (never blocks play if storage fails) ---------- */
  function seen(id){ try{ return !!(state.tutorialsSeen && state.tutorialsSeen[id]); }catch(e){ return false; } }
  function markSeen(id){ try{ state.tutorialsSeen = state.tutorialsSeen || {}; state.tutorialsSeen[id] = true; saveState(); }catch(e){} }
  window.fracTutorialSeen = seen;

  /* ---------- Help modal ---------- */
  let helpGame = null, helpPaused = false, helpReturn = null;
  function openHelp(id){
    if(!HELP[id]) return;
    helpGame = id;
    $('help-modal-body').innerHTML = gameGuide(id);
    $('help-modal').classList.remove('hidden');
    $('btn-help-close').focus({preventScroll:true});
    const hb = document.querySelector('#help-modal .help-box'); if(hb) hb.scrollTop = 0;
  }
  function closeHelp(){
    $('help-modal').classList.add('hidden');
    if(helpPaused){ helpPaused = false; resumeGame(); }
    if(helpReturn && helpReturn.focus){ try{ helpReturn.focus({preventScroll:true}); }catch(e){} }
  }
  function openHelpFromGame(id, pauseIt){
    helpReturn = document.activeElement;
    if(pauseIt && !gamePaused && !quitOpen){ pauseGame(); helpPaused = true; }
    openHelp(id);
  }
  $('btn-help-close').addEventListener('click', closeHelp);
  $('btn-help-tutorial').addEventListener('click', () => {
    const id = helpGame; $('help-modal').classList.add('hidden');
    openTutorial(id, () => openHelp(id), true);
  });
  const hg = $('btn-help-game'); if(hg) hg.addEventListener('click', () => openHelpFromGame(selectedGame, true));
  const hs = $('btn-help-story'); if(hs) hs.addEventListener('click', () => openHelpFromGame('story', false));
  document.querySelectorAll('[data-help-game]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); openHelpFromGame(b.getAttribute('data-help-game'), false); }));
  document.querySelectorAll('[data-help-game-current]').forEach(b => b.addEventListener('click', () => openHelpFromGame(selectedGame || 'match', false)));

  /* ---------- Tutorial ---------- */
  const PRACTICE = { q:['1/4','2/4'], correct:'3/4', options:['3/4','3/8','1/2','1/4'] };
  const T = {
    match:{ item:'', mover:'', how:'tap' },
    mango:{ item:'🥭', mover:'🧺', how:'h', verb:'Catch it!' },
    fish:{ item:'🐟', mover:'🎣', how:'v', verb:'Catch it!' },
    snake:{ item:'🍓', mover:'🐍', how:'h', verb:'Eat it!' }
  };
  const TUT_STEPS = ['Goal','Controls','Watch','Fractions','Your turn'];
  let tut = null;

  function demoHTML(id){
    if(id === 'story'){
      return `<div class="td-stage td-story" aria-hidden="true"><span class="tds-board"><i class="f">3/4</i><i>🍎</i><i>🍇</i><i>🍊</i><i class="x">🍓</i><i>🍎</i><i class="x">🍓</i><i>🍇</i><i class="x">🍓</i><i>🍊</i><i>🍎</i><i>🍇</i></span></div>`;
    }
    if(id === 'match'){
      return `<div class="td-stage td-match" aria-hidden="true"><span class="tdm-q">${formatFracDisplay('1/4')} + ${formatFracDisplay('2/4')}</span><span class="tdm-row"><i>A</i><i class="pick">B ✔</i><i>C</i><i>D</i></span><span class="tdm-finger">👆</span></div>`;
    }
    const t = T[id];
    return `<div class="td-stage td-${id}" aria-hidden="true"><span class="td-item td-i1">${t.item}</span><span class="td-item td-i2 good">${t.item}<b>✔</b></span><span class="td-item td-i3">${t.item}</span><span class="td-mover">${t.mover}</span></div>`;
  }

  function stepHTML(i){
    const id = tut.id, h = HELP[id];
    if(i === 0){
      return `<h3 id="tut-title">${h.icon} ${esc(h.name)}</h3><p class="tut-big">${esc(h.goal)}</p>
        <p class="tut-small">🥭 FracDash helps you practise fractions: adding, subtracting, common denominators, simplifying and equivalent fractions. Each answer is practice, not just points.</p>`;
    }
    if(i === 1){
      return `<h3 id="tut-title">${h.icon} Controls</h3>${controlChips(h)}
        <div class="tut-icons"><span>⏱ <small>Timer</small></span><span>💡 <small>Hint</small></span>${id==='fish'?'<span>❤ <small>Lives</small></span>':''}${id==='story'?'<span>❤ <small>Hearts</small></span>':''}<span>❓ <small>Help</small></span></div>
        <p class="tut-small">Look for the <b>? Help</b> button at the top any time you want to read this again.</p>`;
    }
    if(i === 2){
      const txt = { match:'Read the question, then tap the correct answer.', mango:'Move the basket under the mango with the correct answer.', fish:'Move the hook up or down to the fish with the correct answer.', snake:'Steer the snake to the fruit with the correct answer.', story:'Match fruit to clear a path. Guide the correct fraction to the bottom.' }[id];
      return `<h3 id="tut-title">👀 Watch</h3>${demoHTML(id)}<p class="tut-big">${txt}</p>`;
    }
    if(i === 3){
      return `<h3 id="tut-title">➗ How a fraction question works</h3>
        <div class="td-math"><div class="tdm-line">${formatFracDisplay('1/4')} <b>+</b> ${formatFracDisplay('2/4')} <b>=</b> <span class="tdm-qm">?</span></div></div>
        <ol class="tut-steps"><li>The bottom numbers are the same (4).</li><li>Add the top numbers: 1 + 2 = 3.</li><li>Keep the bottom number: <b>3/4</b>.</li></ol>
        <p class="tut-small">Always solve first, then choose the answer.</p>`;
    }
    return practiceHTML(id);
  }

  function practiceHTML(id){
    const t = T[id];
    const opts = PRACTICE.options.slice();
    // fixed shuffle so the answer is not always first
    const order = [2,0,3,1]; const o = order.map(k => opts[k]);
    tut.opts = o;
    let body = `<h3 id="tut-title">✋ Your turn</h3><p class="tut-big">${formatFracDisplay('1/4')} + ${formatFracDisplay('2/4')} = ?</p>`;
    if(id === 'match' || id === 'story'){
      body += `<p class="tut-small">${id==='story'?'In Story Mode you also solve the question to know which fraction to guide down. Here, just tap the right answer.':'Tap the correct answer.'}</p>
        <div class="tut-opts">${o.map((v,k)=>`<button class="tut-opt" data-v="${v}"><i>${'ABCD'[k]}</i>${formatFracDisplay(v)}</button>`).join('')}</div>`;
    } else {
      const vert = t.how === 'v';
      body += `<p class="tut-small">${vert?'Use ⬆ ⬇ (or the buttons) to move the hook.':'Use ⬅ ➡ (or the buttons) to move.'} Then press <b>${t.verb}</b>.</p>
        <div class="tut-arena ${vert?'v':'h'}" id="tut-arena">${o.map((v,k)=>`<span class="tut-slot" data-k="${k}"><em>${t.item}</em>${formatFracDisplay(v)}</span>`).join('')}<span class="tut-me" id="tut-me">${t.mover}</span></div>
        <div class="tut-pad"><button class="btn small" id="tut-l" aria-label="${vert?'Up':'Left'}">${vert?'⬆':'⬅'}</button><button class="btn small btn-primary" id="tut-go">${t.verb}</button><button class="btn small" id="tut-r" aria-label="${vert?'Down':'Right'}">${vert?'⬇':'➡'}</button></div>`;
    }
    return body + `<p class="tut-feedback" id="tut-feedback" role="status"></p>`;
  }

  function wirePractice(){
    const id = tut.id, fb = $('tut-feedback');
    const win = () => { tut.done = true; fb.className='tut-feedback good'; fb.textContent = '🎉 Correct! 1 + 2 = 3, so the answer is 3/4. You are ready!'; updateNav(); };
    const lose = v => { fb.className='tut-feedback bad'; fb.textContent = `Not quite. Add only the top numbers (1 + 2 = 3) and keep the bottom number 4. Try again!`; };
    if(id === 'match' || id === 'story'){
      document.querySelectorAll('.tut-opt').forEach(b => b.addEventListener('click', () => {
        if(tut.done) return;
        if(b.dataset.v === PRACTICE.correct){ b.classList.add('right'); win(); } else { b.classList.add('wrong'); lose(); }
      }));
      return;
    }
    let pos = 0; const n = 4;
    const move = d => { if(tut.done) return; pos = Math.max(0, Math.min(n-1, pos+d)); draw(); };
    const draw = () => {
      const me = $('tut-me'), slot = document.querySelector(`.tut-slot[data-k="${pos}"]`);
      document.querySelectorAll('.tut-slot').forEach(s => s.classList.toggle('on', s === slot));
      if(me && slot){
        if(T[id].how === 'v'){ me.style.top = slot.offsetTop + 'px'; me.style.left = ''; }
        else { me.style.left = (slot.offsetLeft + slot.offsetWidth/2 - me.offsetWidth/2) + 'px'; me.style.top = ''; }
      }
    };
    $('tut-l').addEventListener('click', () => move(-1));
    $('tut-r').addEventListener('click', () => move(1));
    $('tut-go').addEventListener('click', () => {
      if(tut.done) return;
      const slot = document.querySelector(`.tut-slot[data-k="${pos}"]`);
      if(tut.opts[pos] === PRACTICE.correct){ slot.classList.add('right'); win(); } else { slot.classList.add('wrong'); lose(); }
    });
    tut.key = e => {
      const k = e.key.toLowerCase(), v = T[id].how === 'v';
      if((v && (k==='arrowup'||k==='w')) || (!v && (k==='arrowleft'||k==='a'))){ move(-1); e.preventDefault(); }
      else if((v && (k==='arrowdown'||k==='s')) || (!v && (k==='arrowright'||k==='d'))){ move(1); e.preventDefault(); }
      else if(k==='enter' && document.activeElement && document.activeElement.id!=='btn-tut-next'){ /* let buttons work */ }
    };
    setTimeout(draw, 30);
  }

  function updateNav(){
    const last = tut.step === TUT_STEPS.length - 1;
    $('btn-tut-back').style.visibility = tut.step === 0 ? 'hidden' : 'visible';
    const nx = $('btn-tut-next');
    nx.textContent = last ? (tut.replay ? 'Done ✔' : '▶ Start playing') : 'Next →';
    nx.disabled = last && !tut.done;
    $('tut-step').textContent = `Step ${tut.step+1} of ${TUT_STEPS.length} · ${TUT_STEPS[tut.step]}`;
    $('tut-dots').innerHTML = TUT_STEPS.map((_,i)=>`<i class="${i===tut.step?'on':i<tut.step?'past':''}"></i>`).join('');
  }
  function renderStep(){
    tut.done = tut.done || false; tut.key = null;
    $('tut-body').innerHTML = stepHTML(tut.step);
    if(tut.step === TUT_STEPS.length - 1) wirePractice();
    updateNav();
  }
  function openTutorial(id, onDone, replay){
    if(!HELP[id]){ onDone && onDone(); return; }
    tut = { id, step:0, done:false, onDone, replay: !!replay };
    $('tutorial-modal').classList.remove('hidden');
    renderStep();
    $('btn-tut-next').focus({preventScroll:true});
  }
  function closeTutorial(finished){
    if(!tut) return;
    const t = tut; tut = null;
    $('tutorial-modal').classList.add('hidden');
    markSeen(t.id);
    if(t.onDone) t.onDone(finished);
  }
  $('btn-tut-next').addEventListener('click', () => {
    if(!tut) return;
    if(tut.step < TUT_STEPS.length - 1){ tut.step++; renderStep(); }
    else if(tut.done) closeTutorial(true);
  });
  $('btn-tut-back').addEventListener('click', () => { if(tut && tut.step > 0){ tut.step--; renderStep(); } });
  $('btn-tut-skip').addEventListener('click', () => closeTutorial(false));

  window.addEventListener('keydown', e => {
    const tutOpen = !$('tutorial-modal').classList.contains('hidden');
    const helpOpen = !$('help-modal').classList.contains('hidden');
    if(!tutOpen && !helpOpen) return;
    const arrows = ['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d',' '];
    if(arrows.indexOf(e.key.toLowerCase()) >= 0){
      if(tutOpen && tut && tut.key) tut.key(e);
      if(!(e.target && e.target.tagName === 'BUTTON' && e.key === ' ')) e.stopImmediatePropagation();
    }
    if(e.key === 'Escape'){
      e.stopImmediatePropagation();
      if(tutOpen) closeTutorial(false); else closeHelp();
    }
  }, true);

  /* ---------- hook into the real game flow ---------- */
  window.fracStartAfterTutorial = function(id, go){
    if(seen(id)) go(); else openTutorial(id, go, false);
  };
  window.fracOpenTutorial = openTutorial;
})();
})();

/* ============================================================
   MINIGAMES HUB WORLD — a single painted landscape behind the game cards:
   Fishtions sea on the left, a Mango Falling orchard in the middle, the S-Frac
   jungle on the right, all over one meadow. The static scene is painted once
   on a canvas (reusing the real mango sprite); the sway / drift / glow layers
   are small CSS elements (fewer on low-power devices, off for reduced motion).
   ============================================================ */
function drawHubWorld(ctx,W,H){
  let seed=Math.floor(Math.random()*200000)+7; const rnd=()=>{ seed=(seed*9301+49297)%233280; return seed/233280; };
  const rr=(a,b)=>a+rnd()*(b-a), pick=a=>a[Math.floor(rnd()*a.length)], TAU=Math.PI*2, u=W/1600;
  const swayList=[], mangoStats=[];
  const lg=(x0,y0,x1,y1,st)=>{ const g=ctx.createLinearGradient(x0,y0,x1,y1); st.forEach(([o,c])=>g.addColorStop(o,c)); return g; };
  const blob=(x,y,r,rgb,a)=>{ const g=ctx.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,`rgba(${rgb},${a})`); g.addColorStop(1,`rgba(${rgb},0)`); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,TAU); ctx.fill(); };

  /* ---- mango variation system (percentages are applied per tree, largest-remainder rounding) ---- */
  const split=(n,fr)=>{ const raw=fr.map(f=>f*n), out=raw.map(Math.floor); let rem=n-out.reduce((a,b)=>a+b,0);
    raw.map((v,i)=>[v-Math.floor(v),i]).sort((a,b)=>b[0]-a[0]).slice(0,rem).forEach(([_,i])=>out[i]++); return out; };
  const deal=(n,names,fr)=>{ const c=split(n,fr), pool=[]; names.forEach((nm,i)=>{ for(let k=0;k<c[i];k++) pool.push(nm); });
    for(let i=pool.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); [pool[i],pool[j]]=[pool[j],pool[i]]; } return pool; };
  const SIZES={small:0.70,medium:0.90,standard:1.00,large:1.20}, BASE_W=54*u, BASE_H=58*u;
  const mangoPath=(c,W_,H_)=>{ const cx=W_*0.5, cy=H_*0.58, rx=W_*0.40, ry=H_*0.38, tx=cx-rx*0.30, ty=cy-ry*1.08;
    c.beginPath(); c.moveTo(tx,ty); c.bezierCurveTo(cx+rx*0.28,cy-ry*1.04,cx+rx*1.10,cy-ry*0.34,cx+rx*0.94,cy+ry*0.30);
    c.bezierCurveTo(cx+rx*0.82,cy+ry*0.80,cx+rx*0.32,cy+ry*1.16,cx-rx*0.04,cy+ry*1.08);
    c.bezierCurveTo(cx-rx*0.36,cy+ry*1.01,cx-rx*0.64,cy+ry*0.68,cx-rx*0.74,cy+ry*0.18);
    c.bezierCurveTo(cx-rx*0.86,cy-ry*0.32,cx-rx*0.44,cy-ry*0.80,tx,ty); c.closePath(); return {tx,ty,cx,cy,rx,ry}; };
  const PAL={ // gradient stops per ripeness stage
    unripe:['#4c9a40','#35813a','#27672d'], developing:['#9fcb46','#d3dc4a','#e6d94c'],
    ripe:['#f8de55','#f5c630','#ecae2a'], full:['#f7c840','#f0923a','#d6422e'], mixed:['#8fc43f','#f4c42e','#ee8a30'] };
  const drawVarMango=(c,bw,bh,o)=>{
    let sd=o.sv; const q=()=>{ sd=(sd*9301+49297)%233280; return sd/233280; };
    const sh={elong:[0.84,1.2],std:[1,1],round:[1.12,0.92],curved:[1,1]}[o.shape], W_=bw*sh[0], H_=bh*sh[1];
    c.save(); c.rotate(o.tilt);
    c.strokeStyle='#6B4423'; c.lineWidth=Math.max(1.6,bw*0.07); c.lineCap='round'; c.beginPath(); c.moveTo(0,0); c.quadraticCurveTo(bw*0.06,o.stem*0.5,0,o.stem); c.stroke();
    c.fillStyle='#3FA24B'; c.strokeStyle='#2E7A38'; c.lineWidth=1; c.beginPath(); c.moveTo(0,o.stem*0.35); c.quadraticCurveTo(bw*0.34,o.stem*0.1,bw*0.46,o.stem*0.5); c.quadraticCurveTo(bw*0.2,o.stem*0.7,0,o.stem*0.35); c.fill(); c.stroke();
    c.translate(0,o.stem);
    const g0=mangoPath(c,W_,H_); c.translate(-g0.tx,-g0.ty);
    if(o.shape==='curved') c.transform(1,0,0.22,1,-0.22*g0.ty,0);
    const {cx,cy,rx,ry}=mangoPath(c,W_,H_), pal=PAL[o.ripe];
    const grad=c.createLinearGradient(cx-rx,cy-ry,cx+rx*0.8,cy+ry); grad.addColorStop(0,pal[0]); grad.addColorStop(0.5,pal[1]); grad.addColorStop(1,pal[2]);
    c.fillStyle=grad; c.fill(); c.save(); c.clip();
    const blob2=(x,y,r,col,a)=>{ const g=c.createRadialGradient(x,y,0,x,y,r); g.addColorStop(0,col); g.addColorStop(1,'rgba(0,0,0,0)'); c.globalAlpha=a; c.fillStyle=g; c.beginPath(); c.arc(x,y,r,0,6.283); c.fill(); c.globalAlpha=1; };
    for(let k=0;k<4;k++) blob2(cx+(q()-0.5)*rx*1.6,cy+(q()-0.5)*ry*1.7,rx*(0.35+q()*0.3),pal[Math.floor(q()*3)],0.55); // irregular colour transitions
    if(o.ripe==='full') blob2(cx+rx*0.45,cy+ry*0.25,rx*0.7,'#C6382A',0.6);
    if(o.ripe==='mixed'){ blob2(cx+rx*0.4,cy+ry*0.3,rx*0.4,'#C6382A',0.55); blob2(cx-rx*0.3,cy-ry*0.35,rx*0.35,'#4a9a3f',0.7); blob2(cx+rx*0.1,cy+ry*0.7,rx*0.35,'#ee8a30',0.7); }
    if(o.ripe==='ripe') blob2(cx-rx*0.4,cy-ry*0.7,rx*0.35,'#bfd64a',0.4);
    blob2(cx-rx*0.34,cy-ry*0.42,rx*0.3,'#FFF6D6',0.5);
    c.fillStyle='rgba(90,45,20,0.26)'; for(let k=0;k<9;k++){ c.beginPath(); c.arc(cx+(q()-0.5)*rx*1.5,cy+(q()-0.5)*ry*1.7,Math.max(0.6,W_*0.018),0,6.283); c.fill(); }
    c.restore();
    c.lineWidth=Math.max(1.2,W_*0.05); c.strokeStyle='rgba(90,45,15,0.55)'; mangoPath(c,W_,H_); c.stroke();
    c.restore();
  };
  // one tree: draws its branches, then places n mangoes on them following the size / ripeness / shape / clustering rules
  const hangMangoes=(branches,n,allowSway)=>{
    const sizeL=deal(n,['small','medium','standard','large'],[0.25,0.45,0.20,0.10]);
    const ripeL=deal(n,['unripe','developing','ripe','full','mixed'],[0.20,0.25,0.30,0.15,0.10]);
    const shapeL=deal(n,['elong','std','round','curved'],[0.35,0.35,0.20,0.10]);
    // 1. visible branches with twigs
    const cand=[];
    branches.forEach((b,bi)=>{
      ctx.strokeStyle='#5a3a1d'; ctx.lineCap='round'; ctx.lineWidth=7*u; ctx.beginPath(); ctx.moveTo(b.a.x,b.a.y); ctx.quadraticCurveTo(b.c.x,b.c.y,b.b.x,b.b.y); ctx.stroke();
      ctx.strokeStyle='#7a5230'; ctx.lineWidth=3*u; ctx.beginPath(); ctx.moveTo(b.a.x,b.a.y-1); ctx.quadraticCurveTo(b.c.x,b.c.y-1,b.b.x,b.b.y-1); ctx.stroke();
      for(let t=0.3;t<=1.001;t+=0.14){ const x=(1-t)*(1-t)*b.a.x+2*(1-t)*t*b.c.x+t*t*b.b.x, y=(1-t)*(1-t)*b.a.y+2*(1-t)*t*b.c.y+t*t*b.b.y; cand.push({x,y,bi}); }
    });
    // 2. groups: ~60% individual mangoes, ~40% clusters of 2-3
    let clustered=Math.round(n*0.4); const groups=[]; let left=n;
    while(clustered>=2){ const sz=(clustered===2||clustered===4)?2:3; groups.push(sz); clustered-=sz; left-=sz; }
    for(let i=0;i<left;i++) groups.push(1);
    for(let i=groups.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); [groups[i],groups[j]]=[groups[j],groups[i]]; }
    const placed=[], used=[], mangoes=[]; let rr_=0;
    const ok=(x,y,r)=>placed.every(p=>Math.hypot(p.x-x,p.y-y)>=(p.r+r)*1.05) && (!allowSway || (!(x>W*0.04&&x<W*0.46&&y>H*0.105&&y<H*0.165) && y<H*0.31)); // overhead trees keep clear of the header text and stay in the open gap
    groups.forEach(gsz=>{
      for(let tries=0;tries<260;tries++){
        const order=cand.filter(cd=>cd.bi===rr_%branches.length); rr_++;
        const pool=order.length?order:cand, a=pool[Math.floor(rnd()*pool.length)];
        if(used.some(p=>Math.hypot(p.x-a.x,p.y-a.y)<(gsz>1?64:40)*u*(tries<130?1:0.6))) continue;
        const node=gsz>1?{x:a.x,y:a.y+rr(6,10)*u}:{x:a.x,y:a.y}, items=[];
        let good=true;
        for(let k=0;k<gsz && good;k++){
          const ang=gsz>1?(k-(gsz-1)/2)*0.55+rr(-0.12,0.12):rr(-0.2,0.2), stem=rr(7,13)*u, bh=BASE_H, bw=BASE_W;
          items.push({ax:node.x,ay:node.y,ang,stem,gsz});
        }
        items.forEach((m,k)=>{ // provisional radius from standard size, refined once sizes are dealt
          m.cx=m.ax+Math.sin(-m.ang)*(m.stem+BASE_H*0.5), m.cy=m.ay+Math.cos(m.ang)*(m.stem+BASE_H*0.5); });
        if(!items.every(m=>ok(m.cx,m.cy,BASE_W*0.62))) continue;
        items.forEach(m=>placed.push({x:m.cx,y:m.cy,r:BASE_W*0.62})); used.push({x:a.x,y:a.y}); mangoes.push(...items); break;
      }
    });
    // small leaves at the branch nodes, kept off the fruit
    branches.forEach(b=>{ for(let t=0.2;t<=1;t+=0.16){ const x=(1-t)*(1-t)*b.a.x+2*(1-t)*t*b.c.x+t*t*b.b.x, y=(1-t)*(1-t)*b.a.y+2*(1-t)*t*b.c.y+t*t*b.b.y;
      ctx.fillStyle=pick(['#4fa83f','#3f9438','#68bb4c']); ctx.save(); ctx.translate(x,y-4*u); ctx.rotate(-1.2+rnd()*0.6+(rnd()<0.5?0:2.2)); ctx.beginPath(); ctx.ellipse(9*u,0,11*u,3.8*u,0,0,TAU); ctx.fill(); ctx.restore(); } });
    // 3. assign independent size / ripeness / shape, avoiding the same look next to each other
    mangoes.sort((p,q2)=>p.ax-q2.ax);
    const m2=mangoes.length; const sizes=deal(m2,['small','medium','standard','large'],[0.25,0.45,0.20,0.10]), ripes=deal(m2,['unripe','developing','ripe','full','mixed'],[0.20,0.25,0.30,0.15,0.10]), shapes=deal(m2,['elong','std','round','curved'],[0.35,0.35,0.20,0.10]); // re-dealt for the number that actually fit
    for(let pass=0;pass<6;pass++) for(let i=1;i<m2;i++){
      [[sizes],[ripes],[shapes]].forEach(([arr])=>{ if(arr[i]===arr[i-1]){ const j=arr.findIndex((v,k)=>k>i&&v!==arr[i]&&v!==arr[i-1]); if(j>0) [arr[i],arr[j]]=[arr[j],arr[i]]; } }); }
    const stat={n:m2,sizes:{},ripe:{},shape:{},clusters:groups.filter(g=>g>1).length,single:groups.filter(g=>g===1).length}; mangoStats.push(stat);
    mangoes.forEach((m,i)=>{
      const sc=SIZES[sizes[i]]*(0.95+rnd()*0.10), bw=BASE_W*sc, bh=BASE_H*sc;
      stat.sizes[sizes[i]]=(stat.sizes[sizes[i]]||0)+1; stat.ripe[ripes[i]]=(stat.ripe[ripes[i]]||0)+1; stat.shape[shapes[i]]=(stat.shape[shapes[i]]||0)+1;
      const o={ripe:ripes[i],shape:shapes[i],stem:m.stem,tilt:m.ang,sv:Math.floor(rnd()*200000)+3};
      if(allowSway && m.gsz===1 && rnd()<0.4){ // this mango becomes a gently swinging DOM sprite
        const cw=Math.ceil(bw*1.9+14), ch=Math.ceil(m.stem+bh*1.45+8), sc2=document.createElement('canvas'); sc2.width=cw; sc2.height=ch;
        const sx=sc2.getContext('2d'); sx.translate(cw/2,3); drawVarMango(sx,bw,bh,o);
        swayList.push({url:sc2.toDataURL(),left:(m.ax-cw/2)/W*100,top:(m.ay-3)/H*100,w:cw/W*100,h:ch/H*100});
      } else { ctx.save(); ctx.translate(m.ax,m.ay); drawVarMango(ctx,bw,bh,o); ctx.restore(); }
    });
  };
  const ridge=(base,amp,color,alpha)=>{ ctx.save(); ctx.globalAlpha=alpha; ctx.fillStyle=color; ctx.beginPath(); ctx.moveTo(0,H);
    const p1=rnd()*9,p2=rnd()*9; for(let i=0;i<=80;i++){ const x=W*i/80; ctx.lineTo(x,base-amp*(0.55*Math.sin(x*0.004+p1)+0.3*Math.sin(x*0.011+p2)+0.15*Math.sin(x*0.029+p1*2))); }
    ctx.lineTo(W,H); ctx.closePath(); ctx.fill(); ctx.restore(); };
  const frond=(x,y,len,ang,w,c1,c2)=>{ ctx.save(); ctx.translate(x,y); ctx.rotate(ang); ctx.fillStyle=lg(0,0,len,0,[[0,c1],[1,c2]]);
    ctx.beginPath(); ctx.moveTo(0,0); ctx.quadraticCurveTo(len*0.4,-w,len,0); ctx.quadraticCurveTo(len*0.4,w,0,0); ctx.fill();
    ctx.strokeStyle='rgba(8,36,14,0.45)'; ctx.lineWidth=1.2*u; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(len*0.95,0); ctx.stroke(); ctx.restore(); };
  const palm=(x,y,len,lean)=>{ // trunk + crown of fronds
    ctx.strokeStyle='#6b4a2a'; ctx.lineWidth=len*0.09; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(x,y); ctx.quadraticCurveTo(x+lean*0.3,y-len*0.7,x+lean,y-len*1.35); ctx.stroke();
    const tx=x+lean, ty=y-len*1.35;
    for(let k=0;k<8;k++) frond(tx,ty,len*0.95,k*TAU/8+rr(-0.15,0.15)+0.2,len*0.2,pick(['#1f6b2e','#2a7a34']),pick(['#4fa43e','#5db048']));
    ctx.fillStyle='#4a2f14'; ctx.beginPath(); ctx.arc(tx,ty,len*0.06,0,TAU); ctx.fill(); };
  const tree=(x,y,s)=>{
    ctx.fillStyle='rgba(20,50,15,0.28)'; ctx.beginPath(); ctx.ellipse(x+14*s,y+4*s,78*s,13*s,0,0,TAU); ctx.fill();
    ctx.fillStyle=lg(x-12*s,0,x+12*s,0,[[0,'#7a5230'],[1,'#4e3119']]); ctx.beginPath(); ctx.moveTo(x-13*s,y); ctx.quadraticCurveTo(x-8*s,y-60*s,x-6*s,y-110*s); ctx.lineTo(x+6*s,y-110*s); ctx.quadraticCurveTo(x+9*s,y-60*s,x+13*s,y); ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#5a3a1d'; ctx.lineWidth=7*s; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(x,y-90*s); ctx.lineTo(x-42*s,y-135*s); ctx.moveTo(x,y-95*s); ctx.lineTo(x+46*s,y-140*s); ctx.stroke();
    for(let k=0;k<17;k++){ const cx=x+rr(-66,66)*s, cy=y-rr(105,185)*s, r=rr(28,47)*s;
      const g=ctx.createRadialGradient(cx-r*0.3,cy-r*0.35,r*0.1,cx,cy,r); g.addColorStop(0,pick(['#7cc650','#68b845','#8fd25c'])); g.addColorStop(1,pick(['#2f6f2c','#357a30']));
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,r,0,TAU); ctx.fill(); }
    for(let k=0;k<70;k++){ const cx=x+rr(-80,80)*s, cy=y-rr(100,200)*s; ctx.save(); ctx.translate(cx,cy); ctx.rotate(rnd()*TAU); ctx.fillStyle=pick(['#9ad65f','#3f8f35','#2a6a2a','#b4e070']); ctx.beginPath(); ctx.ellipse(0,0,rr(6,11)*s,rr(2,3.5)*s,0,0,TAU); ctx.fill(); ctx.restore(); }
    // branches fork from the trunk into the crown; the mangoes hang from them
    const br=[]; for(let k=0;k<5;k++){ const dir=(k-2)/2, sx=x+dir*6*s, sy=y-rr(100,118)*s; br.push({a:{x:sx,y:sy},c:{x:sx+dir*50*s,y:sy+8*s},b:{x:x+dir*rr(84,100)*s+rr(-8,8)*s,y:y-rr(104,150)*s}}); }
    hangMangoes(br,8,false); };

  // sky, sun, haze
  ctx.fillStyle=lg(0,0,0,H*0.6,[[0,'#5fb4e6'],[0.38,'#a7dbf1'],[1,'#fdeec3']]); ctx.fillRect(0,0,W,H);
  blob(W*0.14,H*0.15,W*0.3,'255,244,190',0.85); ctx.fillStyle='#FFF4C2'; ctx.beginPath(); ctx.arc(W*0.14,H*0.15,38*u,0,TAU); ctx.fill();
  ctx.save(); ctx.globalAlpha=0.07; ctx.fillStyle='#fff6c8'; for(let k=0;k<6;k++){ const a=0.25+k*0.2; ctx.beginPath(); ctx.moveTo(W*0.14,H*0.15); ctx.lineTo(W*0.14+Math.cos(a)*W,H*0.15+Math.sin(a)*W); ctx.lineTo(W*0.14+Math.cos(a+0.07)*W,H*0.15+Math.sin(a+0.07)*W); ctx.fill(); } ctx.restore();
  ridge(H*0.5,H*0.1,'#8db6cc',0.7); ridge(H*0.54,H*0.07,'#6ea39f',0.8);

  // Fishtions: sea band with glitter, island palm and a tiny fishing boat
  const seaT=H*0.53, seaB=H*0.74;
  ctx.fillStyle=lg(0,seaT,0,seaB,[[0,'#58c0dc'],[1,'#1f7fb0']]); ctx.fillRect(0,seaT,W,seaB-seaT);
  for(let i=0;i<150;i++){ const y=rr(seaT,seaB), x=rr(0,W*0.55); ctx.strokeStyle=`rgba(255,255,255,${(0.12+rnd()*0.2).toFixed(2)})`; ctx.lineWidth=1.4*u; ctx.beginPath(); ctx.moveTo(x,y); ctx.quadraticCurveTo(x+14*u,y-3*u,x+28*u,y); ctx.stroke(); }
  ctx.fillStyle='rgba(255,246,200,0.5)'; for(let i=0;i<26;i++) ctx.fillRect(W*0.14+rr(-70,70)*u,rr(seaT,seaB),rr(6,18)*u,1.6*u);
  ctx.fillStyle='#c9b27a'; ctx.beginPath(); ctx.ellipse(W*0.31,seaT+4*u,70*u,12*u,0,0,TAU); ctx.fill(); ctx.fillStyle='#4f8f3a'; ctx.beginPath(); ctx.ellipse(W*0.31,seaT-1*u,52*u,9*u,0,Math.PI,TAU); ctx.fill();
  palm(W*0.31,seaT+2*u,34*u,10*u);
  { const bx=W*0.2, by=H*0.64; ctx.fillStyle='rgba(0,40,70,0.25)'; ctx.beginPath(); ctx.ellipse(bx,by+9*u,46*u,5*u,0,0,TAU); ctx.fill();
    ctx.fillStyle='#8a5a2e'; ctx.strokeStyle='#3a210d'; ctx.lineWidth=2*u; ctx.beginPath(); ctx.moveTo(bx-44*u,by-8*u); ctx.lineTo(bx+44*u,by-8*u); ctx.lineTo(bx+30*u,by+8*u); ctx.lineTo(bx-30*u,by+8*u); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#f3e6c4'; ctx.fillRect(bx-8*u,by-24*u,20*u,16*u); ctx.strokeRect(bx-8*u,by-24*u,20*u,16*u);
    ctx.strokeStyle='#4a2f14'; ctx.lineWidth=2*u; ctx.beginPath(); ctx.moveTo(bx-18*u,by-8*u); ctx.lineTo(bx-52*u,by-34*u); ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,0.8)'; ctx.lineWidth=1*u; ctx.beginPath(); ctx.moveTo(bx-52*u,by-34*u); ctx.lineTo(bx-52*u,by+6*u); ctx.stroke(); }

  // Mango Falling: orchard hills and mango trees
  ctx.fillStyle=lg(0,H*0.56,0,H*0.78,[[0,'#a6d55f'],[1,'#6aa83c']]); ctx.beginPath(); ctx.moveTo(W*0.2,H*0.76);
  for(let i=0;i<=60;i++){ const x=W*0.2+W*0.8*i/60, t=i/60, s=Math.min(1,t/0.26), lift=s*s*(3-2*s); ctx.lineTo(x,H*0.76-lift*H*0.19+Math.sin(x*0.008)*H*0.012); }
  ctx.lineTo(W,H); ctx.lineTo(W*0.2,H); ctx.closePath(); ctx.fill();
  [[0.37,0.67,0.8],[0.5,0.64,0.95],[0.63,0.645,0.85]].forEach(([fx,fy,s])=>tree(W*fx,H*fy,s*u*1.05));

  // S-Frac: jungle on the right (canopy, palms, hanging vines, ferns)
  const jx=W*0.72;
  for(let k=0;k<26;k++){ const cx=rr(jx,W+30), cy=rr(H*0.1,H*0.6), r=rr(60,120)*u;
    const g=ctx.createRadialGradient(cx-r*0.3,cy-r*0.3,r*0.1,cx,cy,r); g.addColorStop(0,pick(['#2f8a3c','#27793a','#3a9a42'])); g.addColorStop(1,'#0f4a25'); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,r,0,TAU); ctx.fill(); }
  palm(W*0.8,H*0.74,130*u,-24*u); palm(W*0.92,H*0.78,150*u,22*u);
  for(let k=0;k<12;k++){ const vx=rr(W*0.62,W), vl=rr(H*0.22,H*0.42); ctx.strokeStyle='#2e7a30'; ctx.lineWidth=2.6*u; ctx.beginPath(); ctx.moveTo(vx,0);
    let px=vx,py=0; for(let s=1;s<=8;s++){ const nx=vx+Math.sin(s*1.2+k)*10*u, ny=vl*s/8; ctx.quadraticCurveTo(px,py,(px+nx)/2,(py+ny)/2); px=nx; py=ny; } ctx.stroke();
    for(let s=1;s<=8;s++){ ctx.save(); ctx.translate(vx+Math.sin(s*1.2+k)*10*u,vl*s/8); ctx.rotate(rnd()*TAU); ctx.fillStyle=pick(['#4fa83f','#3f9438','#68bb4c']); ctx.beginPath(); ctx.ellipse(6*u,0,8*u,3.4*u,0,0,TAU); ctx.fill(); ctx.restore(); } }
  for(let k=0;k<14;k++){ const fx=rr(W*0.66,W), fy=rr(H*0.74,H*0.84); for(let j=0;j<6;j++) frond(fx,fy,rr(50,90)*u,-Math.PI/2+rr(-1.1,1.1),12*u,'#1f6b2e','#58b048'); }

  // foreground meadow with grass, flowers, mossy rocks, S-Frac log
  ctx.fillStyle=lg(0,H*0.74,0,H,[[0,'#78b843'],[1,'#3d7a2b']]); ctx.beginPath(); ctx.moveTo(0,H*0.78);
  for(let i=0;i<=40;i++){ const x=W*i/40; ctx.lineTo(x,H*0.78+Math.sin(x*0.006+1)*H*0.014); } ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.fill();
  for(let i=0;i<40;i++) blob(rr(0,W),rr(H*0.78,H),rr(40,110)*u,pick(['120,180,70','50,110,40','160,200,80']),0.3);
  ctx.lineCap='round';
  for(let i=0;i<520;i++){ const x=rr(0,W), y=rr(H*0.78,H), h=rr(8,20)*u*(0.6+(y-H*0.78)/H*2); ctx.strokeStyle=pick(['#4f8a3a','#7fb04a','#3f7a30','#9cc65a']); ctx.lineWidth=1.6*u;
    for(let b=-1;b<=1;b++){ ctx.beginPath(); ctx.moveTo(x+b*3*u,y); ctx.quadraticCurveTo(x+b*4*u,y-h*0.6,x+b*7*u,y-h); ctx.stroke(); } }
  for(let i=0;i<80;i++){ const x=rr(0,W), y=rr(H*0.8,H*0.99), s=(2.2+(y-H*0.78)/H*10)*u, c=pick(['#ffffff','#ffd1dc','#ffe066','#ff9a4a']);
    ctx.fillStyle=c; for(let p=0;p<5;p++){ ctx.beginPath(); ctx.arc(x+Math.cos(p*1.256)*s,y+Math.sin(p*1.256)*s,s*0.75,0,TAU); ctx.fill(); } ctx.fillStyle='#e8a317'; ctx.beginPath(); ctx.arc(x,y,s*0.6,0,TAU); ctx.fill(); }
  const rock=(x,y,s)=>{ ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(x+6*s,y+8*s,62*s,14*s,0,0,TAU); ctx.fill();
    ctx.fillStyle=lg(x-60*s,y-50*s,x+60*s,y+10*s,[[0,'#b4b8ad'],[1,'#6c7168']]); ctx.strokeStyle='#2f332c'; ctx.lineWidth=2.4*u; ctx.beginPath(); ctx.moveTo(x-62*s,y+6*s); ctx.quadraticCurveTo(x-60*s,y-46*s,x-14*s,y-52*s); ctx.quadraticCurveTo(x+40*s,y-60*s,x+62*s,y+6*s); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#5fa043'; ctx.beginPath(); ctx.ellipse(x-8*s,y-48*s,40*s,12*s,-0.1,0,TAU); ctx.fill(); ctx.fillStyle='#86c25c'; ctx.beginPath(); ctx.ellipse(x-16*s,y-52*s,18*s,5*s,-0.1,0,TAU); ctx.fill(); };
  rock(W*0.09,H*0.93,1.5*u); rock(W*0.2,H*0.98,0.8*u);
  { const lx=W*0.62, ly=H*0.965, len=W*0.3, T=26*u; ctx.fillStyle='rgba(0,0,0,0.25)'; ctx.fillRect(lx,ly+T*0.5,len,6*u);
    ctx.fillStyle=lg(0,ly-T/2,0,ly+T/2,[[0,'#b88650'],[0.5,'#8a5a2e'],[1,'#5b3a1f']]); ctx.strokeStyle='#25150a'; ctx.lineWidth=2.4*u; ctx.beginPath(); ctx.roundRect(lx,ly-T/2,len,T,T*0.4); ctx.fill(); ctx.stroke();
    ctx.strokeStyle='rgba(40,20,5,0.35)'; ctx.lineWidth=1.2*u; [-0.25,0.05,0.3].forEach(f=>{ ctx.beginPath(); ctx.moveTo(lx+12*u,ly+f*T); ctx.lineTo(lx+len-12*u,ly+f*T); ctx.stroke(); });
    for(let m=0;m<5;m++){ ctx.fillStyle='rgba(90,165,60,0.9)'; ctx.beginPath(); ctx.ellipse(lx+rr(0.1,0.9)*len,ly-T*0.38,rr(12,26)*u,T*0.22,0,0,TAU); ctx.fill(); } }
  // overhead mango tree canopies: leaf masses along the top edge with branches arching down into the open gap above the cards
  [0.1,0.5,0.9].forEach((fx,ti)=>{
    const cx=W*fx, span=W*0.17;
    for(let k=0;k<22;k++){ const x=cx+rr(-span,span), y=rr(-H*0.03,H*0.075), r=rr(34,60)*u;
      const g=ctx.createRadialGradient(x-r*0.3,y-r*0.3,r*0.1,x,y,r); g.addColorStop(0,pick(['#7cc650','#68b845','#8fd25c'])); g.addColorStop(1,pick(['#2f6f2c','#357a30'])); ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,TAU); ctx.fill(); }
    for(let k=0;k<60;k++){ ctx.save(); ctx.translate(cx+rr(-span,span),rr(-H*0.02,H*0.11)); ctx.rotate(rnd()*TAU); ctx.fillStyle=pick(['#9ad65f','#3f8f35','#2a6a2a','#b4e070']); ctx.beginPath(); ctx.ellipse(0,0,rr(8,14)*u,rr(2.6,4.2)*u,0,0,TAU); ctx.fill(); ctx.restore(); }
    const br=[]; for(let k=0;k<4;k++){ const sx=cx+(k-1.5)*span*0.5+rr(-20,20)*u, sy=H*0.07, ex=sx+rr(-0.07,0.07)*W, ey=H*rr(0.21,0.28);
      br.push({a:{x:sx,y:sy},c:{x:(sx+ex)/2+rr(-40,40)*u,y:sy+(ey-sy)*0.25},b:{x:ex,y:ey}}); }
    hangMangoes(br,9,true);
  });
  for(let i=0;i<8;i++) blob(rr(0,W),rr(H*0.1,H*0.9),rr(90,190)*u,'255,244,180',0.1);
  blob(W*0.5,H*0.52,W*0.5,'255,250,230',0.12); // soft haze through the middle
  return { sway:swayList, stats:mangoStats };
}

(function initHubWorld(){
  const FRUITS = [['strawberry',6.6,88.5],['apple',9.8,91.5],['kiwi',68.5,89.4],['grapes',74.5,90.2]];
  let worldReady = false, swayMangoes = [];
  function paint(){
    if(worldReady) return; worldReady = true;
    try{
      const c=document.createElement('canvas'); c.width=1600; c.height=900; const res=drawHubWorld(c.getContext('2d'),1600,900); swayMangoes=res.sway; window.__hubMangoStats=res.stats;
      c.toBlob(b=>{ if(b) document.documentElement.style.setProperty('--hub-world',`url(${URL.createObjectURL(b)})`); },'image/jpeg',0.9);
    }catch(e){ console.warn('hub world paint failed',e); }
    document.querySelectorAll('.hub-world').forEach(build);
  }
  function build(host){
    const low=document.documentElement.classList.contains('lowfx'); let r=3; const rd=()=>{ r=(r*9301+49297)%233280; return r/233280; };
    let h='<div class="hw-stage"><div class="hw-bg"></div><div class="hw-shimmer"></div>';
    for(let i=0;i<(low?2:4);i++) h+=`<i class="hw-cloud" style="top:${4+i*7}%;width:${18+rd()*10}%;animation-duration:${150+rd()*90}s;animation-delay:-${(rd()*150).toFixed(0)}s"></i>`;
    swayMangoes.forEach((m,i)=>{ h+=`<span class="hw-hang" style="left:${m.left.toFixed(2)}%;top:${m.top.toFixed(2)}%;width:${m.w.toFixed(2)}%;height:${m.h.toFixed(2)}%;animation-duration:${(4+rd()*3).toFixed(1)}s;animation-delay:-${(rd()*5).toFixed(1)}s"><i style="background-image:url(${m.url})"></i></span>`; });
    [[88,60,200],[95,62,330],[78,52,215],[91,70,160]].forEach(([x,y,a])=>{ h+=`<i class="jg-frond hw-frond" style="left:${x}%;top:${y}%;width:calc(var(--sw)*0.07);--r:${a}deg;animation-duration:${(4+rd()*3).toFixed(1)}s;animation-delay:-${(rd()*5).toFixed(1)}s"></i>`; });
    for(let i=0;i<(low?4:9);i++) h+=`<i class="hw-leaf" style="left:${(rd()*100).toFixed(0)}%;animation-duration:${(16+rd()*10).toFixed(0)}s;animation-delay:-${(rd()*20).toFixed(0)}s;--lc:${['#7bbf45','#a6d45a','#d8b43a','#4fa83f'][i%4]}"></i>`;
    for(let i=0;i<(low?4:10);i++) h+=`<i class="hw-spore" style="left:${(60+rd()*38).toFixed(0)}%;top:${(30+rd()*45).toFixed(0)}%;animation-duration:${(5+rd()*5).toFixed(1)}s;animation-delay:-${(rd()*8).toFixed(1)}s"></i>`;
    for(let i=0;i<3;i++) h+=`<i class="jg-dapple" style="left:${(rd()*70).toFixed(0)}%;top:${(rd()*50).toFixed(0)}%;width:26%;height:34%;animation-duration:${(18+rd()*10).toFixed(0)}s"></i>`;
    if(!low){ h+='<span class="hw-fly f1">🦋</span><span class="hw-fly f2">🦋</span>'; }
    FRUITS.forEach(([f,x,y],i)=>{ if(!window.__fruitArt||!window.__fruitArt.art[f]) return;
      h+=`<svg class="hw-fruit" viewBox="0 0 64 72" style="left:${x}%;top:${y}%;animation-delay:-${i*0.9}s">${window.__fruitArt.art[f](window.__fruitArt.uid())}</svg>`; });
    h+='</div><div class="hw-scrim"></div>';
    host.innerHTML=h;
  }
  setTimeout(paint,30);
})();

