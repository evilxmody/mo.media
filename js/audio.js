/* MO MEDIA audio: background music (fade-in), greeting voice-over with music ducking, floating player, "Enter Experience" fallback.
   All settings are read from index.html [EDIT-1F] by js/data.js (MEDIA.audio). Missing files never break the site. */
(function(){'use strict';
var noop=function(){},MA=window.MEDIA&&window.MEDIA.audio,mc=MA&&MA.music;
if(!mc||!mc.src){window.MOAudio={gate:function(){return Promise.resolve()},passive:noop,startIntro:noop,stopVoice:noop,state:function(){return{}}};return}
var gc=MA.greeting||{},doc=document,clamp=function(v,a,b){return Math.min(b,Math.max(a,v))};
var st={get:function(k){try{return (k==='mo.vol'?localStorage:sessionStorage).getItem(k)}catch(e){return null}},set:function(k,v){try{(k==='mo.vol'?localStorage:sessionStorage).setItem(k,v)}catch(e){}}};   /* volume is remembered; pause/mute only for this visit */
var vol=parseFloat(st.get('mo.vol'));if(isNaN(vol))vol=mc.volume!=null?mc.volume:.6;vol=clamp(vol,0,1);
var muted=st.get('mo.muted')==='1',userOff=st.get('mo.off')==='1';
var mix={fade:0,duck:1},ramps={},raf=0,voice=null,vt=0,soundOn=false,fadedIn=false,failed=false,waiting=false,hiddenPaused=false,ctx=null,gain=null;
var music=new Audio();music.preload='auto';music.loop=mc.loop!==false;music.setAttribute('playsinline','');music.src=mc.src;
var probe=new Audio();probe.volume=.5;var needGain=probe.volume!==.5;   /* iOS ignores element.volume -> use a Web Audio gain node */

function level(){return muted?0:vol*mix.fade*mix.duck}
function apply(){var v=level();if(gain)gain.gain.value=v;else music.volume=clamp(v,0,1);if(voice)voice.muted=muted}
function ramp(k,to,sec){ramps[k]={from:mix[k],to:to,t0:performance.now(),d:Math.max(.01,sec)*1000};if(!raf)raf=requestAnimationFrame(tickR)}
function tickR(now){var any=false;for(var k in ramps){var r=ramps[k],p=Math.min(1,(now-r.t0)/r.d);mix[k]=r.from+(r.to-r.from)*(p*p*(3-2*p));if(p>=1)delete ramps[k];else any=true}apply();raf=any?requestAnimationFrame(tickR):0}
function unlock(){if(!needGain||ctx)return;try{var AC=window.AudioContext||window.webkitAudioContext;ctx=new AC();gain=ctx.createGain();ctx.createMediaElementSource(music).connect(gain);gain.connect(ctx.destination);music.volume=1}catch(e){ctx=gain=null}
  if(ctx&&ctx.state==='suspended')ctx.resume()}
apply();

/* ---------- voice-over ---------- */
function restore(){ramp('duck',1,gc.restoreFade!=null?gc.restoreFade:1.8)}
function createVoice(){if(voice||!gc.src)return;voice=new Audio();voice.preload='auto';voice.setAttribute('playsinline','');voice.volume=clamp(gc.volume!=null?gc.volume:1,0,1);voice.src=gc.src;
  voice.addEventListener('playing',function(){ramp('duck',gc.duckTo!=null?gc.duckTo:.2,gc.duckFade!=null?gc.duckFade:.6)});   /* music goes down only when the voice really plays */
  ['ended','error','pause','abort'].forEach(function(e){voice.addEventListener(e,restore)})}
var pend=false;
function playVoice(){if(muted||!voice)return;if(!soundOn){pend=true;return}pend=false;var p=voice.play();if(p&&p.catch)p.catch(restore)}
function flushVoice(){if(pend&&doc.body.classList.contains('locked'))playVoice();pend=false}   /* sound unlocked late but the intro is still running: say hello now */
function startIntro(){clearTimeout(vt);if(!voice)return;vt=setTimeout(playVoice,Math.max(0,(gc.startAt||0)*1000))}
function stopVoice(){clearTimeout(vt);if(voice&&!voice.paused)voice.pause()}

/* ---------- music control ---------- */
var resumeReq=false;
function startFromUser(){unlock();resumeReq=fadedIn;if(!music.paused&&fadedIn)ramp('fade',1,.6);var p;try{p=music.play()}catch(e){p=null}
  if(p&&p.catch)p.catch(function(err){if(err&&err.name==='NotAllowedError'){waiting=false;waitGesture()}else{failed=true;ui()}})}   /* blocked again (e.g. a scroll gesture): keep waiting for a real tap */
function toggle(){unlock();if(music.paused||userOff){userOff=false;st.set('mo.off','0');startFromUser()}
  else{userOff=true;st.set('mo.off','1');ramp('fade',0,.4);setTimeout(function(){if(userOff)music.pause();ui()},420);ui()}}
music.addEventListener('playing',function(){soundOn=true;if(!fadedIn){fadedIn=true;ramp('fade',1,mc.fadeIn!=null?mc.fadeIn:3)}else if(resumeReq){resumeReq=false;ramp('fade',1,.6)}flushVoice();ui()});
music.addEventListener('pause',ui);music.addEventListener('error',function(){failed=true;ui();try{console.warn('MO MEDIA: music file not found: '+mc.src)}catch(e){}});

/* first user gesture starts the music when the browser blocked autoplay and no Enter screen was shown */
function waitGesture(){if(waiting)return;waiting=true;tipText();mp.classList.add('hint');var ev=['mousedown','pointerup','touchend','click','keydown'];   /* touch pointerdown does NOT unlock audio on phones: only touchend / pointerup / click do */
  function go(e){if(e&&e.target&&e.target.closest&&e.target.closest('#mp'))return;ev.forEach(function(n){doc.removeEventListener(n,go,true)});waiting=false;if(!userOff&&music.paused&&!failed)startFromUser()}
  ev.forEach(function(n){doc.addEventListener(n,go,true)})}

/* gate(): NO blocking screen. The intro starts at once; music starts now if the browser allows it, otherwise on the first tap/click/key. */
function gate(){createVoice();
  if(!userOff&&!failed){var p;try{p=music.play()}catch(e){p=null}
    if(p&&p.then)p.then(function(){soundOn=true}).catch(function(err){if(err&&err.name==='NotAllowedError')waitGesture();else{failed=true;ui()}})}
  return Promise.resolve()}
function passive(){if(userOff||failed)return;var p;try{p=music.play()}catch(e){return}
  if(p&&p.catch)p.catch(function(err){if(err&&err.name==='NotAllowedError')waitGesture()})}

/* ---------- floating player ---------- */
var ICON={play:'<svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>',pause:'<svg viewBox="0 0 24 24"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor"/></svg>',
  vol:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" fill="currentColor" stroke="none"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
  mute:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" fill="currentColor" stroke="none"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>'};
var mp=doc.createElement('div');mp.id='mp';mp.className='mp';mp.setAttribute('role','region');mp.setAttribute('aria-label','Music player');
mp.innerHTML='<div class="mp-body"><button type="button" class="mp-play" aria-label="Play"></button><div class="mp-mid"><input class="mp-seek" type="range" min="0" max="1000" value="0" step="1" aria-label="Progress" disabled></div>'+
 '<span class="mp-time"><b>0:00</b><em> / 0:00</em></span><div class="mp-vg"><button type="button" class="mp-mute" aria-label="Mute"></button><input class="mp-vol" type="range" min="0" max="100" step="1" aria-label="Volume"></div></div>'+
 '<span class="mp-tip"></span><button type="button" class="mp-t" aria-label="Music player" aria-expanded="false"><span class="eq"><i></i><i></i><i></i></span></button>';
doc.body.appendChild(mp);
var q=function(s){return mp.querySelector(s)},bPlay=q('.mp-play'),bMute=q('.mp-mute'),seek=q('.mp-seek'),vr=q('.mp-vol'),tNow=q('.mp-time b'),tTot=q('.mp-time em'),bT=q('.mp-t'),dragging=false;
mp.title=mc.title||'Music';var tip=q('.mp-tip');function tipText(){var l;try{l=localStorage.getItem('lang')}catch(e){}tip.textContent=(l||doc.documentElement.lang)==='ar'?'اضغط في أي مكان لتشغيل الصوت':'Tap anywhere for sound'}
function fmt(s){s=Math.max(0,Math.floor(s||0));return Math.floor(s/60)+':'+('0'+s%60).slice(-2)}
function fill(el){el.style.setProperty('--v',(el.value/el.max*100)+'%')}
function ui(){var on=!music.paused&&!userOff&&!failed;if(on)mp.classList.remove('hint');mp.classList.toggle('playing',on);mp.classList.toggle('off',failed&&!soundOn);
  bPlay.innerHTML=on?ICON.pause:ICON.play;bPlay.setAttribute('aria-label',on?'Pause':'Play');
  bMute.innerHTML=(muted||vol===0)?ICON.mute:ICON.vol;bMute.setAttribute('aria-label',muted?'Unmute':'Mute');vr.value=muted?0:Math.round(vol*100);fill(vr)}
function tu(){var d=music.duration;if(isFinite(d)&&d>0){tTot.textContent=' / '+fmt(d);seek.disabled=false;if(!dragging){seek.value=music.currentTime/d*1000;fill(seek)}}tNow.textContent=fmt(music.currentTime)}
music.addEventListener('timeupdate',tu);music.addEventListener('loadedmetadata',tu);music.addEventListener('durationchange',tu);
bPlay.onclick=toggle;
bMute.onclick=function(){unlock();muted=!muted;if(!muted&&vol===0)vol=.5;st.set('mo.muted',muted?'1':'0');st.set('mo.vol',vol);apply();ui()};
vr.addEventListener('input',function(){unlock();vol=vr.value/100;muted=false;st.set('mo.muted','0');st.set('mo.vol',vol);apply();ui()});
seek.addEventListener('input',function(){dragging=true;fill(seek);var d=music.duration;if(isFinite(d))music.currentTime=seek.value/1000*d});
['change','pointerup','touchend','blur'].forEach(function(e){seek.addEventListener(e,function(){dragging=false})});
bT.onclick=function(){var o=mp.classList.toggle('open');bT.setAttribute('aria-expanded',o)};
fill(seek);ui();tu();

doc.addEventListener('visibilitychange',function(){if(doc.hidden){if(!music.paused){hiddenPaused=true;music.pause();if(voice&&!voice.paused)voice.pause()}}
  else if(hiddenPaused){hiddenPaused=false;if(ctx&&ctx.state==='suspended')ctx.resume();if(!userOff){var p=music.play();if(p&&p.catch)p.catch(noop)}}});
window.addEventListener('pagehide',function(){music.pause();if(voice)voice.pause()});

window.MOAudio={gate:gate,passive:passive,startIntro:startIntro,stopVoice:stopVoice,state:function(){return{paused:music.paused,t:music.currentTime,level:level(),duck:mix.duck,fade:mix.fade,vol:vol,muted:muted,soundOn:soundOn,failed:failed,voicePlaying:!!voice&&!voice.paused}}};
})();
