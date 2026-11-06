(function(){
'use strict';
/* CDN libs are injected here (not blocking <script defer>), awaited max 9s. Slow CDN => intro waits on the glowing loader ring, not removed. */
const CDN='https://cdn.jsdelivr.net/npm/';
const load=u=>new Promise(r=>{const e=document.createElement('script');e.src=CDN+u;e.onload=()=>r(1);e.onerror=()=>r(0);document.head.append(e)});
window.__ready=1;
Promise.race([load('gsap@3.12.5/dist/gsap.min.js').then(()=>Promise.all([load('three@0.149.0/build/three.min.js'),load('gsap@3.12.5/dist/ScrollTrigger.min.js'),load('lenis@1.1.13/dist/lenis.min.js')])),new Promise(r=>setTimeout(r,9000))]).then(start);
function start(){'use strict';
/* Classic script (NO modules): works even by double-clicking index.html. GSAP/Three/Lenis are optional globals from the CDN <script> tags. */
let THREE=window.THREE||null,gsap=window.gsap||null,ScrollTrigger=window.ScrollTrigger||null,Lenis=window.Lenis?(window.Lenis.default||window.Lenis):null;
try{if(gsap&&ScrollTrigger)gsap.registerPlugin(ScrollTrigger);else gsap=null}catch(e){gsap=null}
const HAS_GSAP=!!gsap;
if(!HAS_GSAP){const t={to(){return t},from(){return t},set(){return t},fromTo(){return t},add(){return t},progress(){}};gsap={...t,timeline:()=>t,ticker:{add(){},remove(){},lagSmoothing(){}}};ScrollTrigger={update(){},refresh(){},killAll(){}};document.documentElement.classList.add('nolib')}
window.__ready=1;

/* Content is written in index.html and read by js/data.js into window.PORTFOLIO. Arabic text = data-ar="..." attributes in index.html. */
const CONFIG=window.PORTFOLIO;CONFIG.projects.forEach(p=>{p.img=p.cover;p.tools=p.tags});
let lang=localStorage.getItem('lang')||'en';
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));   // text from index.html goes through esc() before it is placed in innerHTML (titles with quotes or < no longer break the page)
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
function applyLang(){document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';
  $$('[data-ar]').forEach(e=>{if(e.dataset.en===undefined)e.dataset.en=e.textContent;e.textContent=lang==='ar'&&e.dataset.ar?e.dataset.ar:e.dataset.en});$('#lang').textContent=lang==='ar'?'EN':'AR';localStorage.setItem('lang',lang)}
$('#lang').onclick=()=>{lang=lang==='en'?'ar':'en';applyLang()};
$$('[data-link]').forEach(a=>{const u=CONFIG.links[a.dataset.link];if(u){a.href=u;a.target='_blank';a.rel='noopener'}else{a.classList.add('off');a.setAttribute('aria-disabled','true');a.title='Add this link in index.html [EDIT-1B]'}});
$$('[data-show]').forEach(e=>e.textContent=CONFIG.display[e.dataset.show]||'');
const ICONS=((window.MEDIA&&MEDIA.intro&&MEDIA.intro.tools)||[['photoshop','Photoshop','assets/icons/photoshop.png'],['premiere-pro','Premiere Pro','assets/icons/premiere-pro.png'],['after-effects','After Effects','assets/icons/after-effects.png'],['capcut','CapCut','assets/icons/capcut.png']]).map(([f,n,s])=>`<span class="sw" title="${n}"><img src="${s}" alt="${n}"></span>`).join('');
$$('.sw-row').forEach(r=>r.innerHTML=ICONS);

/* ===== THREE.JS: rings + particles + camera (guarded; CSS fallback ring if WebGL fails) ===== */
const S={energy:0,ring:1,mx:0,my:0},rings=[];
let cam={position:{x:0,y:0,z:9}},renderer,scene,pts,raf=0,lenis=null;
const ac=new AbortController(),sig={signal:ac.signal};   // one controller removes every global listener on destroy()
const speed=reduce?0:1;
function initGL(){
  renderer=new THREE.WebGLRenderer({canvas:$('#gl'),antialias:true,alpha:true});   // throws without WebGL
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  scene=new THREE.Scene();cam=new THREE.PerspectiveCamera(60,1,.1,100);cam.position.z=9;
  /* Organized rings: wide ellipse whose top/bottom arcs frame the screen (like the reference video), plus soft glow layers */
  
  /* Round twinkling stars in 3D depth (custom shader) */
  const N=innerWidth<800?700:1500,pos=new Float32Array(N*3),col=new Float32Array(N*3),siz=new Float32Array(N),ph=new Float32Array(N),pal=[[1,1,1],[.7,.8,1],[.8,.7,1],[1,.9,.8]];
  for(let i=0;i<N;i++){pos.set([(Math.random()-.5)*60,(Math.random()-.5)*34,-2-Math.random()*45],i*3);col.set(pal[i%4],i*3);siz[i]=Math.random()<.06?3.2:.6+Math.random()*1.6;ph[i]=Math.random()*6.28}
  const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(pos,3));pg.setAttribute('color',new THREE.BufferAttribute(col,3));pg.setAttribute('size',new THREE.BufferAttribute(siz,1));pg.setAttribute('phase',new THREE.BufferAttribute(ph,1));
  pts=new THREE.Points(pg,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uTime:{value:0},uOp:{value:0},uPx:{value:renderer.getPixelRatio()}},
    vertexShader:'attribute float size;attribute float phase;attribute vec3 color;varying vec3 vC;varying float vT;uniform float uTime;uniform float uPx;void main(){vC=color;vT=.65+.35*sin(uTime*1.4+phase);vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=size*uPx*vT*(70./-mv.z);gl_Position=projectionMatrix*mv;}',
    fragmentShader:'varying vec3 vC;varying float vT;uniform float uOp;void main(){float d=length(gl_PointCoord-.5);float a=1.-smoothstep(0.,.5,d);gl_FragColor=vec4(vC,a*a*vT*uOp);}'}));
  scene.add(pts);

  const resize=()=>{renderer.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()};
  resize();addEventListener('resize',resize,sig);
  const t0=performance.now();
  let lt=0;const loop=()=>{raf=requestAnimationFrame(loop);const t=(performance.now()-t0)/1000,dt=Math.min(.05,t-lt);lt=t;
    rings.forEach(r=>{r.rotation.x=1.18+Math.sin(t*.3)*.03*speed;r.rotation.y=.12;r.rotation.z=-.2+t*.02*speed;r.material.opacity=S.energy*S.ring*r.userData.op});
    pts.rotation.y=t*.008*speed;pts.position.y=scrollY*.0008;pts.material.uniforms.uTime.value=t*speed;pts.material.uniforms.uOp.value=S.energy;
    cam.position.x+=(S.mx*.6-cam.position.x)*.04;cam.position.y+=(-S.my*.4-cam.position.y)*.04;cam.lookAt(0,0,0);renderer.render(scene,cam)};
  loop();
  document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);if(!document.hidden)loop()},sig);
}
try{if(!THREE)throw new Error('no three');initGL()}catch(e){console.warn('WebGL unavailable, CSS fallback',e);document.documentElement.classList.add('nogl');S.energy=1}
const cursorEl=$('.cursor');
addEventListener('pointermove',e=>{S.mx=e.clientX/innerWidth-.5;S.my=e.clientY/innerHeight-.5;cursorEl.style.left=e.clientX+'px';cursorEl.style.top=e.clientY+'px'},sig);

/* ===== Smooth scroll: Lenis (only if GSAP+Lenis loaded, not reduced-motion) ===== */
const lenisRaf=t=>lenis&&lenis.raf(t*1000);
try{if(Lenis&&HAS_GSAP&&!reduce){lenis=new Lenis({duration:1.5,easing:t=>1-Math.pow(1-t,4),wheelMultiplier:.9});lenis.on('scroll',ScrollTrigger.update);gsap.ticker.add(lenisRaf);gsap.ticker.lagSmoothing(0)}}catch(e){lenis=null}
function goY(y,imm){lenis?lenis.scrollTo(y,{immediate:!!imm,duration:1.8}):scrollTo({top:y,behavior:imm?'auto':'smooth'})}
$$('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{const t=$(a.getAttribute('href'));if(!t)return;e.preventDefault();goY(t.getBoundingClientRect().top+scrollY)}));
if(lenis){const sm=HTMLDialogElement.prototype.showModal;HTMLDialogElement.prototype.showModal=function(){lenis.stop();sm.call(this)};
  $$('dialog').forEach(d=>{d.setAttribute('data-lenis-prevent','');d.addEventListener('close',()=>lenis.start())})}

/* ===== Magnetic hover ===== */
$$('.mag').forEach(el=>{el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();gsap.to(el,{x:(e.clientX-r.left-r.width/2)*.3,y:(e.clientY-r.top-r.height/2)*.3,duration:.3})});
  el.addEventListener('pointerleave',()=>gsap.to(el,{x:0,y:0,duration:.5,ease:'elastic.out(1,.4)'}))});

/* ===== Natural media ratio (automatic): real video size > real image size > data-ratio (only a fallback) ===== */
const RC=new Map();
const pr=s=>{const m=/^\s*(\d+(?:\.\d+)?)\s*[:\/x]\s*(\d+(?:\.\d+)?)\s*$/.exec(String(s||''));return m&&+m[2]?m[1]/m[2]:0};
function imgRatio(src){if(!src)return Promise.resolve(0);const k='i|'+src;if(RC.has(k))return RC.get(k);
  const pm=new Promise(r=>{const i=new Image();i.onload=()=>r(i.naturalWidth&&i.naturalHeight?i.naturalWidth/i.naturalHeight:0);i.onerror=()=>r(0);i.src=src});RC.set(k,pm);return pm}
function vidRatio(src){if(!src)return Promise.resolve(0);const k='v|'+src;if(RC.has(k))return RC.get(k);
  const pm=new Promise(r=>{const v=document.createElement('video');let done=0;const end=x=>{if(done)return;done=1;clearTimeout(t);v.removeAttribute('src');try{v.load()}catch(e){}r(x)};
    const t=setTimeout(()=>end(0),12000);v.preload='metadata';v.muted=true;v.playsInline=true;
    v.onloadedmetadata=()=>end(v.videoWidth&&v.videoHeight?v.videoWidth/v.videoHeight:0);v.onerror=()=>end(0);v.src=src});RC.set(k,pm);return pm}
async function resolveRatio(p){if(p.rOk)return p.r;let r=0;if(p.video)r=await vidRatio(p.video);if(!r)r=await imgRatio(p.cover);if(!r)r=pr(p.ratio)||(p.type==='video'?16/9:.75);p.r=r;p.rOk=1;return r}
/* carousel card = biggest box that fits inside a max frame, keeping the media's own proportions */
function fitBox(r){const m=innerWidth<800,bw=m?240:440,bh=m?330:420;let w=bw,h=w/r;if(h>bh){h=bh;w=h*r}return[Math.round(w),Math.round(h)]}
function sizeCard(p){if(!p.el)return;const[w,h]=fitBox(p.r||.75);p.cw=w;p.ch=h;p.el.style.setProperty('--w',w+'px');p.el.style.setProperty('--h',h+'px')}

/* ===== Work: real 3D coverflow carousel (click side cards, arrows, swipe, keys) ===== */
let filt='all',list=[],ci=0,cDrag=false,cMoved=false,cx0=0,wheelT=0;
const stage=$('#track');stage.tabIndex=0;stage.setAttribute('role','region');stage.setAttribute('aria-label','Projects');
function renderCards(){list=CONFIG.projects.filter(p=>filt==='all'||p.type===filt);ci=Math.max(0,Math.min(ci,list.length-1));stage.innerHTML='';
  list.forEach((p,i)=>{const c=document.createElement('article');c.className='card';c.tabIndex=0;p.el=c;if(!p.r)p.r=pr(p.ratio)||(p.type==='video'?16/9:.75);sizeCard(p);resolveRatio(p).then(()=>{if(p.el===c){sizeCard(p);layout()}});
    c.innerHTML=`<div class="card-in"><img src="${esc(p.img)}" alt="${esc(p.title)}" draggable="false"><div class="meta"><b>${esc(p.title)}</b><small>${esc(p.label)}</small></div>${p.type==='video'?'<i class="play">▶</i>':''}</div>`;
    const inn=c.firstChild;
    c.onclick=()=>{if(cMoved)return;i===ci?openDetail(p):go(i)};c.onkeydown=e=>{if(e.key==='Enter')c.onclick()};
    c.onpointermove=e=>{if(i!==ci||cDrag||!HAS_GSAP)return;const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;gsap.to(inn,{rotateY:x*14,rotateX:-y*14,transformPerspective:900,duration:.9,ease:'power3.out',overwrite:'auto'})};
    c.onpointerleave=()=>HAS_GSAP&&gsap.to(inn,{rotateY:0,rotateX:0,duration:1.4,ease:'power3.out',overwrite:'auto'});
    stage.append(c)});layout()}
function layout(){const m=innerWidth<800,ov=m?25:45,k=m?.18:.27,W=list.map(p=>p.cw||290),off={};
  const vis=(i,a)=>W[i]*.79*Math.max(.6,.88-a*.06);
  [-1,1].forEach(sg=>{let pv=0,x=0;for(let a=1;ci+sg*a>=0&&ci+sg*a<list.length;a++){const i=ci+sg*a,v=vis(i,a);x=a===1?W[ci]/2+v/2-ov:x+k*(pv+v);off[i]=sg*x;pv=v}});
  $$('.card',stage).forEach((c,i)=>{const d=i-ci,a=Math.abs(d),sg=Math.sign(d);
    c.style.transform=`translateX(${d?off[i]:0}px) translateZ(${d?-a*140:90}px) rotateY(${-sg*Math.min(a,1)*38}deg) scale(${d?Math.max(.6,.88-a*.06):1})`;
    c.style.opacity=a>3?0:1-a*.18;c.style.zIndex=10-a;c.style.pointerEvents=a>3?'none':'auto';c.classList.toggle('on',!d)});
  $('#count').textContent=list.length?pad(ci+1)+' / '+pad(list.length):''}
function go(i){if(!list.length)return;ci=(i+list.length)%list.length;layout()}
$('#next').onclick=()=>go(ci+1);$('#prev').onclick=()=>go(ci-1);
stage.addEventListener('keydown',e=>{if(e.key==='ArrowRight')go(ci+1);if(e.key==='ArrowLeft')go(ci-1)});
stage.addEventListener('pointerdown',e=>{cDrag=true;cMoved=false;cx0=e.clientX});
addEventListener('pointerup',e=>{if(!cDrag)return;cDrag=false;const dx=e.clientX-cx0;if(Math.abs(dx)>50){cMoved=true;go(ci+(dx<0?1:-1));setTimeout(()=>cMoved=false,60)}},sig);
stage.addEventListener('wheel',e=>{if(Math.abs(e.deltaX)>Math.abs(e.deltaY)&&Math.abs(e.deltaX)>25){e.preventDefault();if(Date.now()-wheelT>700){wheelT=Date.now();go(ci+Math.sign(e.deltaX))}}},{passive:false});
addEventListener('resize',()=>{list.forEach(sizeCard);layout()},sig);

/* ===== Project detail view ===== */
function openDetail(p){const d=$('#detail'),m=$('.d-media',d),tk=m._tk=(m._tk||0)+1;let cur='';
  const setR=r=>{if(r>0)m.style.setProperty('--r',r)};setR(p.r||pr(p.ratio)||16/9);
  resolveRatio(p).then(r=>{if(m._tk===tk&&cur===p.cover)setR(r)});
  $('h3',d).textContent=p.title;$('.cat',d).textContent=p.label||'';$('.desc',d).textContent=p[lang]||p.en||'';
  $('.chips',d).innerHTML=(p.tags||[]).map(t=>`<span>${esc(t)}</span>`).join('');
  const imgs=[p.cover,...(p.gallery||[])],th=$('.thumbs',d);
  const show=src=>{cur=src;
    if(src===p.cover)setR(p.r);else{const c=RC.get('i|'+src);imgRatio(src).then(r=>{if(m._tk===tk&&cur===src)setR(r)});}
    m.innerHTML=`<img src="${esc(src)}" alt="${esc(p.title)}">`+(p.type==='video'&&p.video&&src===p.cover?'<button class="playbtn" aria-label="Play video">▶</button><p class="d-hint"></p>':'');
    const pb=$('.playbtn',m);if(pb)pb.onclick=()=>{if(p.video){m.innerHTML=`<video src="${esc(p.video)}" ${p.poster?`poster="${esc(p.poster)}"`:''} controls autoplay playsinline preload="metadata"></video>`;const v=$('video',m);
        v&&v.addEventListener('loadedmetadata',()=>{if(v.videoWidth&&v.videoHeight&&m._tk===tk){p.r=v.videoWidth/v.videoHeight;p.rOk=1;setR(p.r)}},{once:true});
        v&&v.addEventListener('error',()=>{show(p.cover);const h=$('.d-hint',m);if(h)h.textContent=lang==='ar'?'ملف الفيديو غير موجود':'Video file not found'},{once:true})}else $('.d-hint',m).textContent=lang==='ar'?'أضف ملف الفيديو في index.html (EDIT-1D)':'Add your video file in index.html (EDIT-1D)'};
    $$('img',th).forEach(t=>t.classList.toggle('on',t.dataset.s===src));const im=$('img',m);im&&gsap.fromTo(im,{opacity:0,scale:1.04},{opacity:1,scale:1,duration:1.1,ease:'power3.out'})};
  th.innerHTML='';if(imgs.length>1)imgs.forEach(src=>{const t=new Image();t.src=src;t.dataset.s=src;t.alt='';t.onclick=()=>show(src);th.append(t)});
  show(p.cover);
  const was=d.open;if(!was){d.showModal();dlgAnim(d,[{opacity:0,transform:'translateY(40px) scale(.92)'},{opacity:1,transform:'none'}],1300,'cubic-bezier(.16,1,.3,1)')}}
/* FIX: GSAP tweened <dialog> directly; a modal is position:fixed so GSAP re-parented it, which dropped it out of the top layer (pop-ups appeared at the page bottom). Dialogs use the Web Animations API instead. */
function dlgAnim(d,frames,ms,easing){try{d.animate&&d.animate(frames,{duration:reduce?1:ms,easing})}catch(e){}}
function smoothClose(d){if(!d.open)return;if(!d.animate||reduce){d.close();return}if(d._c)return;d._c=1;
  const a=d.animate([{opacity:1,transform:'none'},{opacity:0,transform:'translateY(24px) scale(.96)'}],{duration:900,easing:'cubic-bezier(.65,0,.35,1)',fill:'forwards'});
  a.onfinish=()=>{a.cancel();d.close();d._c=0}}
$$('dialog .close,#detail .back').forEach(b=>b.onclick=()=>smoothClose(b.closest('dialog')));
$$('dialog').forEach(d=>{d.addEventListener('cancel',e=>{e.preventDefault();smoothClose(d)});d.addEventListener('click',e=>e.target===d&&smoothClose(d))});
/* soft "press" feedback: slow squeeze, gentle elastic release */
const pressSel='.btn,.filters button,.card-in,.rail-btn,#lang,.social a,.grid figure,.thumbs img,.car-wrap>button,.lb';let pressed=null;
document.addEventListener('pointerdown',e=>{const t=e.target.closest(pressSel);if(t){pressed=t;gsap.to(t,{scale:.94,duration:.6,ease:'power3.out',overwrite:'auto'})}},sig);
['pointerup','pointercancel'].forEach(ev=>document.addEventListener(ev,()=>{if(pressed){gsap.to(pressed,{scale:1,duration:1.4,ease:'elastic.out(1,.55)',overwrite:'auto'});pressed=null}},sig));
$$('.filters').forEach(f=>f.onclick=e=>{const b=e.target.closest('button');if(!b)return;$$('button',f).forEach(x=>x.classList.toggle('on',x===b));
  if(f.dataset.target==='work'){filt=b.dataset.f;ci=0;renderCards()}else renderGrid(b.dataset.f)});

/* ===== Photo grid + lightbox (arrows, keys, swipe, counter) ===== */
let shown=[],li=0,lx=0;
/* Photo gallery = justified rows: every row is completely full (no ragged / half-empty rows) and every photo keeps its real shape (no cropping). */
let gridGen=0,gridW=0;
function splitRows(r,n){const N=r.length,pre=[0];r.forEach(x=>pre.push(pre[pre.length-1]+x));const t=pre[N]/n,
    dp=Array.from({length:n+1},()=>Array(N+1).fill(Infinity)),cut=Array.from({length:n+1},()=>Array(N+1).fill(0));dp[0][0]=0;
  for(let k=1;k<=n;k++)for(let j=k;j<=N;j++)for(let i=k-1;i<j;i++){const d=pre[j]-pre[i]-t,c=dp[k-1][i]+d*d;if(c<dp[k][j]){dp[k][j]=c;cut[k][j]=i}}
  const rows=[];let j=N;for(let k=n;k>=1;k--){const i=cut[k][j];rows.unshift([i,j]);j=i}return rows}
function buildRows(g){const it=g._items||[];g.innerHTML='';if(!it.length)return;
  const W=g.clientWidth||innerWidth,gap=16,th=W<560?190:W<980?250:300,sum=it.reduce((x,y)=>x+y.r,0),n=Math.max(1,Math.min(it.length,Math.round(sum*th/W)));gridW=W;
  splitRows(it.map(x=>x.r),n).forEach(([i,j])=>{const row=document.createElement('div'),part=it.slice(i,j),rs=part.reduce((x,y)=>x+y.r,0);row.className='row';
    row.style.maxWidth=Math.round(rs*th*1.6+(part.length-1)*gap)+'px';   // a very short row (1-2 photos) never becomes giant
    part.forEach(({p,i:ix,r})=>{const fg=document.createElement('figure');fg.style.flex=r+' 1 0%';fg.style.aspectRatio=r;
      fg.innerHTML=`<img src="${esc(p.src)}" alt="${esc(p.alt||'Photo')}" loading="lazy">`;fg.onclick=()=>openLB(ix);row.append(fg)});g.append(row)})}
async function renderGrid(f='all'){const g=$('#grid'),gen=++gridGen;shown=CONFIG.photos.filter(p=>f==='all'||p.cat===f);
  const rs=await Promise.all(shown.map(p=>imgRatio(p.src)));if(gen!==gridGen)return;
  g._items=shown.map((p,i)=>({p,i,r:rs[i]||4/3}));buildRows(g);
  gsap.from('#grid figure',{clipPath:'inset(100% 0 0 0)',y:30,stagger:.09,duration:1.2,ease:'power3.out'})}
let gridT;addEventListener('resize',()=>{clearTimeout(gridT);gridT=setTimeout(()=>{const g=$('#grid');if(g&&g._items&&Math.abs(g.clientWidth-gridW)>40)buildRows(g)},200)},sig);
function openLB(i){const lb=$('#lightbox'),im=$('img',lb);li=(i+shown.length)%shown.length;
  im.src=shown[li].src;im.alt='Photo '+(li+1);$('figcaption',lb).textContent=pad(li+1)+' / '+pad(shown.length)+' · '+shown[li].cat;
  const was=lb.open;if(!was){lb.showModal();dlgAnim(lb,[{opacity:0},{opacity:1}],900,'cubic-bezier(.5,1,.89,1)')}
  gsap.fromTo(im,{opacity:0,scale:1.06},{opacity:1,scale:1,duration:1.1,ease:'power3.out'})}
$('.lb.p').onclick=e=>{e.stopPropagation();openLB(li-1)};$('.lb.n').onclick=e=>{e.stopPropagation();openLB(li+1)};
$('#lightbox').addEventListener('keydown',e=>{if(e.key==='ArrowLeft')openLB(li-1);if(e.key==='ArrowRight')openLB(li+1)});
$('#lightbox').addEventListener('pointerdown',e=>lx=e.clientX);
$('#lightbox').addEventListener('pointerup',e=>{const dx=e.clientX-lx;if(Math.abs(dx)>60)openLB(li+(dx<0?1:-1))});

/* ===== Scroll reveals (skipped if GSAP missing or reduced motion, so content is never left hidden) ===== */
function initScroll(){if(reduce||!HAS_GSAP)return;
  $$('.rv').forEach(el=>gsap.fromTo(el,{y:60,opacity:0,filter:'blur(10px)'},{y:0,opacity:1,filter:'blur(0px)',duration:1.5,ease:'expo.out',clearProps:'filter',scrollTrigger:{trigger:el,start:'top 85%'}}));
  gsap.to('.fl',{y:-80,scrollTrigger:{trigger:'#hero',scrub:true,start:'top top',end:'bottom top'}});
  gsap.to('#space',{yPercent:-5,ease:'none',scrollTrigger:{trigger:document.body,start:'top top',end:'bottom bottom',scrub:true}})}

/* ===== SIDE SLIDER: draggable rail synced with real scroll ===== */
const rail=$('#rail'),track=$('.rail-track'),thumb=$('.rail-thumb'),lab=$('.rail-label'),marks=$('.rail-marks'),secs=$$('main>section');
const maxS=()=>Math.max(1,document.documentElement.scrollHeight-innerHeight),pad=n=>String(n).padStart(2,'0');
let act=-1;
function place(){marks.innerHTML='';secs.forEach((sec,i)=>{const b=document.createElement('button');b.className='mk';b.setAttribute('aria-label',sec.id);
  b.style.top=Math.min(100,sec.offsetTop/maxS()*100)+'%';b.onclick=()=>goY(sec.offsetTop);marks.append(b)});act=-1;sync()}
function sync(){const p=Math.min(1,scrollY/maxS());thumb.style.top=p*100+'%';thumb.setAttribute('aria-valuenow',Math.round(p*100));
  let a=0;secs.forEach((sec,i)=>{if(scrollY+innerHeight*.4>=sec.offsetTop)a=i});
  if(a!==act){act=a;lab.textContent=pad(a+1)+' · '+secs[a].id.toUpperCase();$$('.mk',marks).forEach((m,i)=>m.classList.toggle('on',i===a))}}
addEventListener('scroll',sync,{passive:true,signal:ac.signal});
let drag=false;const ptr=e=>{const r=track.getBoundingClientRect();goY(Math.min(1,Math.max(0,(e.clientY-r.top)/r.height))*maxS(),true)};
track.addEventListener('pointerdown',e=>{if(e.target.closest('.mk'))return;drag=true;track.setPointerCapture(e.pointerId);rail.classList.add('drag');ptr(e)});
track.addEventListener('pointermove',e=>{if(drag)ptr(e)});
['pointerup','pointercancel'].forEach(t=>track.addEventListener(t,()=>{drag=false;rail.classList.remove('drag')}));
rail.addEventListener('pointermove',e=>{const r=thumb.getBoundingClientRect();gsap.to(thumb,{x:Math.max(-8,Math.min(8,(e.clientX-r.left-r.width/2)*.4)),duration:.3})});   // magnetic nudge
rail.addEventListener('pointerleave',()=>gsap.to(thumb,{x:0,duration:.5}));
thumb.addEventListener('keydown',e=>{const st=maxS()*.05,k=e.key;if(k==='ArrowDown'||k==='ArrowUp'){e.preventDefault();goY(scrollY+(k==='ArrowDown'?st:-st))}if(k==='Home')goY(0);if(k==='End')goY(maxS())});
$('#down').onclick=()=>goY(secs[Math.min(secs.length-1,act+1)].offsetTop);$('#up').onclick=()=>goY(secs[Math.max(0,act-1)].offsetTop);
/* ===== Rings: random speed / direction / start angle / tilt clock per visit (back + front copies share values so they stay aligned) ===== */
(function(){if(reduce)return;const R=(a,b)=>a+Math.random()*(b-a);
  [['r1',80,125],['r2',120,175],['r3',170,250],['r4',140,200]].forEach(([k,a,b],i)=>{const sp=R(a,b),ti=R(24,58),dir=Math.random()<.5?'normal':'reverse',d1=-R(0,sp),d2=-R(0,ti*2);
    document.querySelectorAll('.'+k).forEach(el=>{el.style.animationDuration=sp+'s,'+ti+'s';el.style.animationDelay=d1+'s,'+d2+'s';el.style.animationDirection=dir+',alternate'})})})();
/* ===== Rail rides the orbit: arrows, dots, thumb and line follow an arc whose tilt/curve is read live from ring .r2 (same animation clock as the planet rings). Icons stay upright (offsets only, no rotation). ===== */
(function(){const r2=$('.r2'),up=$('#up'),dn=$('#down');if(!r2||!track)return;
  const NS='http://www.w3.org/2000/svg',svg=document.createElementNS(NS,'svg'),path=document.createElementNS(NS,'path');svg.setAttribute('class','rail-arc');svg.append(path);track.prepend(svg);rail.classList.add('rail-orb');
  const PHI=.8727,COS=Math.cos(PHI);let H=0,tT=0,tH=0,tW=0,bu=0,bd=0,psi=0,bulge=20,sg=1,raf=0;
  const measure=()=>{H=rail.offsetHeight;tT=track.offsetTop;tH=track.offsetHeight;tW=track.offsetWidth;bu=up.offsetTop+up.offsetHeight/2-H/2;bd=dn.offsetTop+dn.offsetHeight/2-H/2};
  const pos=ny=>{const f=Math.max(-1,Math.min(1,ny/(H/2||1))),x0=-bulge*(Math.cos(f*PHI)-COS)/(1-COS),s=Math.sin(psi),k=Math.cos(psi);return[x0*k-ny*s,x0*s+ny*k]};
  function frame(){raf=requestAnimationFrame(frame);if(document.hidden||!H||document.body.classList.contains('locked'))return;
    const mt=getComputedStyle(r2).transform;let ang=0,sy=1;if(mt&&mt!=='none'){const v=mt.slice(mt.indexOf('(')+1,-1).split(',').map(parseFloat);sy=Math.hypot(v[2],v[3])||1}
    ang=parseFloat(getComputedStyle(r2).rotate)||0;   // ring spin in degrees (continuous): the rail leans with it, one sway per ring turn
    psi=Math.sin(ang*Math.PI/180)*.16;bulge=20*sy;sg=document.documentElement.dir==='rtl'?-1:1;
    const sh=Math.max(0,pos(-H/2)[0],pos(H/2)[0],pos(0)[0]),y0=tT-H/2;   // sh keeps the arc inside the screen edge
    const put=(el,ny)=>{const p=pos(ny);el.style.setProperty('--dx',(p[0]-sh)*sg+'px');el.style.setProperty('--dy',(p[1]-ny)+'px')};
    put(up,bu);put(dn,bd);for(const mk of marks.children)put(mk,y0+(parseFloat(mk.style.top)||0)/100*tH);put(thumb,y0+(parseFloat(thumb.style.top)||0)/100*tH);
    let d='';for(let i=0;i<=24;i++){const p=pos(y0+tH*i/24);d+=(i?'L':'M')+(tW/2+(p[0]-sh)*sg).toFixed(1)+' '+(p[1]-y0).toFixed(1)}path.setAttribute('d',d)}
  measure();window.ResizeObserver?new ResizeObserver(measure).observe(rail):addEventListener('resize',measure,sig);frame();addEventListener('pagehide',()=>cancelAnimationFrame(raf),sig)})();
let rt;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>{place();ScrollTrigger.refresh()},200)},sig);
addEventListener('load',()=>{place();ScrollTrigger.refresh()},sig);

/* ===== INTRO (GSAP timeline ~8.5s) with guaranteed exit ===== */
const nameEl=$('#introName');nameEl.textContent='';let ci0=0;
CONFIG.name.split(' ').forEach(w=>{const wd=document.createElement('span');wd.className='w';[...w].forEach(ch=>{const sp=document.createElement('span');sp.className='ch';sp.textContent=ch;sp.style.setProperty('--i',ci0++);wd.append(sp)});nameEl.append(wd)});
let done=false,tl=null;
function finish(){if(done)return;done=true;const i=$('#intro');i&&i.remove();document.body.classList.remove('locked');
  try{sessionStorage.setItem('introSeen','1')}catch(e){}
  lenis&&lenis.start();
  if(!reduce){gsap.to(cam.position,{z:6,duration:2.2,ease:'power3.out'});
    gsap.from('.hero-in>*',{y:50,opacity:0,stagger:.18,duration:1.6,ease:'expo.out',clearProps:'all'});
    gsap.from('.fl',{opacity:0,scale:.6,stagger:.2,duration:1.8,ease:'power3.out'});
    gsap.to('.fl',{x:'+=10',rotation:2,repeat:-1,yoyo:true,duration:4,ease:'sine.inOut',stagger:{each:.7,from:'random'}})}
  else{cam.position.z=6;S.ring=.3}
  ScrollTrigger.refresh();place()}
function playIntro(){
  window.MOAudio&&MOAudio.startIntro();   // voice-over timing is relative to this moment
  if(!HAS_GSAP){setTimeout(finish,4500);return}
  const hide=()=>{gsap.set('#introName .ch',{opacity:0,y:20,filter:'blur(10px)'});gsap.set(['#introLogo','#introSub','#introIcons .sw'],{opacity:0})};
  if(reduce){   // reduced motion: calm fade-only version
    hide();gsap.set('#introName .ch',{y:0,filter:'none'});tl=gsap.timeline({onComplete:finish});
    tl.to(S,{energy:1,duration:2.5},0).to('#introLogo',{opacity:1,duration:1.4},.3).to('#introName .ch',{opacity:1,stagger:.04,duration:1},2).to('#introSub',{opacity:.9,duration:1},3).to('#introIcons .sw',{opacity:1,stagger:.15,duration:1},3.6).to('#intro',{opacity:0,duration:1.4},6.5);
    setTimeout(finish,12000);return}
  lenis&&lenis.stop();hide();gsap.set('#introLogo',{scale:.85});gsap.set('#introSub',{letterSpacing:'.9em'});gsap.set('#introIcons .sw',{y:20});
  tl=gsap.timeline({onComplete:finish,defaults:{ease:'power3.inOut'}});
  tl.to(S,{energy:1,duration:3,ease:'power2.out'},0)                                         // stars + orbit ring fade in slowly
    .fromTo(cam.position,{z:8},{z:6,duration:7,ease:'power2.out'},0)                          // slow camera drift
    .to('#introLogo',{opacity:1,scale:1,duration:2.2,ease:'power3.out'},.8)                   // MO MEDIA logo
    .to('#introName .ch',{opacity:1,y:0,filter:'blur(0px)',stagger:.06,duration:1.6,ease:'power3.out'},3)
    .to('#introSub',{opacity:.9,letterSpacing:'.5em',duration:1.8,ease:'power3.out'},4.2)
    .to('#introIcons .sw',{opacity:1,y:0,stagger:.25,duration:1.4,ease:'power3.out'},5.4)    // Ps Pr Ae CapCut
    .to(cam.position,{z:3.2,duration:1.8,ease:'power3.in'},8.6)                               // push-through
    .to('#intro',{opacity:0,duration:1.4,ease:'power2.in'},9.2);
  tl.timeScale(.9);setTimeout(finish,20000)}                         // watchdog: never stay stuck
window.__skip=()=>{window.MOAudio&&MOAudio.stopVoice();tl?tl.progress(1):finish()};      // wired to the Skip button by the inline script in index.html

function destroy(){cancelAnimationFrame(raf);ac.abort();ScrollTrigger.killAll&&ScrollTrigger.killAll();gsap.ticker.remove&&gsap.ticker.remove(lenisRaf);lenis&&lenis.destroy();renderer&&renderer.dispose()}
addEventListener('pagehide',destroy);

/* ===== Random shooting stars: 2D canvas (no libs, works without WebGL); max 2 at once; render loop runs only while one is visible ===== */
(function(){const cv=$('#shoot');if(!cv||reduce)return;const g=cv.getContext('2d');let W=0,H=0,list=[],raf=0,tm=0,last=0;
  const rs=()=>{const d=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;cv.width=W*d;cv.height=H*d;g.setTransform(d,0,0,d,0,0)};rs();addEventListener('resize',rs,sig);
  const R=(a,b)=>a+Math.random()*(b-a),sm=()=>innerWidth<800;
  function spawn(){if(list.length>=2||document.hidden)return;const sgn=Math.random()<.5?1:-1,a=R(14,58)*Math.PI/180,sp=R(700,1500)*(sm()?.7:1),len=R(70,210)*(sm()?.7:1);
    const x=sgn>0?R(-.05*W,.65*W):R(.35*W,1.05*W),y=R(-.05*H,.55*H),dist=R(.35,.8)*Math.hypot(W,H);
    list.push({x,y,vx:sgn*Math.cos(a),vy:Math.sin(a),sp,len,w:R(1,2.1),t:0,life:dist/sp});if(!raf)raf=requestAnimationFrame(tick)}
  function tick(now){const dt=Math.min(.05,(now-last)/1000||.016);last=now;g.clearRect(0,0,W,H);
    list=list.filter(o=>{o.t+=dt;const k=o.t/o.life;if(k>=1)return false;const hx=o.x+o.vx*o.sp*o.t,hy=o.y+o.vy*o.sp*o.t,tx=hx-o.vx*o.len,ty=hy-o.vy*o.len,al=Math.min(1,k/.12)*Math.min(1,(1-k)/.35);
      const gr=g.createLinearGradient(tx,ty,hx,hy);gr.addColorStop(0,'rgba(140,170,255,0)');gr.addColorStop(1,`rgba(235,242,255,${.9*al})`);
      g.strokeStyle=gr;g.lineWidth=o.w;g.lineCap='round';g.beginPath();g.moveTo(tx,ty);g.lineTo(hx,hy);g.stroke();
      g.fillStyle=`rgba(255,255,255,${al})`;g.beginPath();g.arc(hx,hy,o.w*.9,0,6.283);g.fill();return true});
    raf=list.length?requestAnimationFrame(tick):0;if(!raf)g.clearRect(0,0,W,H)}
  const next=()=>{tm=setTimeout(()=>{spawn();next()},R(3500,11000)*(sm()?1.4:1))};next();setTimeout(spawn,1800);
  addEventListener('pagehide',()=>{clearTimeout(tm);cancelAnimationFrame(raf)},sig)})();
/* pause CSS space animations when the tab or the hero is not visible (performance) */
{const hero=$('#hero');if('IntersectionObserver'in window)new IntersectionObserver(([e])=>hero.classList.toggle('off',!e.isIntersecting)).observe(hero);
 document.addEventListener('visibilitychange',()=>document.body.classList.toggle('paused',document.hidden),sig)}

/* ===== Boot ===== */
$('#showreel').onclick=()=>openDetail(CONFIG.showreel);
$('#detail').addEventListener('close',()=>{$('.d-media',$('#detail')).innerHTML=''});
/* liquid-glass header: highlight follows the pointer, stronger glass after scrolling, refraction filter only where the browser supports it (Chromium) */
{const nv=$('.nav');if(nv){nv.addEventListener('pointermove',e=>{const r=nv.getBoundingClientRect();nv.style.setProperty('--mx',(e.clientX-r.left)+'px');nv.style.setProperty('--my',(e.clientY-r.top)+'px')},{passive:true});
  nv.addEventListener('pointerleave',()=>{nv.style.setProperty('--mx','50%');nv.style.setProperty('--my','0%')});
  const sc=()=>nv.classList.toggle('sc',scrollY>40);addEventListener('scroll',sc,{passive:true});sc();
  try{if(/Chrome\//.test(navigator.userAgent)&&CSS.supports('backdrop-filter','url(#lg-warp)'))document.documentElement.classList.add('lg-warp')}catch(e){}}}
const burger=$('#burger'),setMenu=o=>{document.body.classList.toggle('menu-open',o);burger.setAttribute('aria-expanded',o)};
burger.onclick=()=>setMenu(!document.body.classList.contains('menu-open'));$$('#menu a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));
applyLang();renderCards();renderGrid();initScroll();place();
let seen=false;if(CONFIG.introOncePerSession){try{seen=!!sessionStorage.getItem('introSeen')}catch(e){}}
$('#replay').onclick=()=>location.reload();
document.documentElement.classList.add('ready');
const A=window.MOAudio;if(seen){S.energy=1;finish();A&&A.passive()}else(A?A.gate():Promise.resolve()).then(playIntro);   // music starts (or the Enter button appears) BEFORE the intro so both are in sync

}
})();