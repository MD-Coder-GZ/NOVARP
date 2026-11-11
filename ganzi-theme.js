(()=>{'use strict';
const body=document.body,theme=document.getElementById('theme');
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover: hover) and (pointer: fine)');
const canvas=document.createElement('canvas');canvas.id='gs-stars';canvas.setAttribute('aria-hidden','true');body.prepend(canvas);
const ctx=canvas.getContext('2d');let points=[],width=0,height=0,frame=0,last=0,moveFrame=0,latest=null;
function moving(){return !reduced.matches&&width>760}
function paint(now){if(!ctx)return;ctx.clearRect(0,0,width,height);for(const p of points){const alpha=moving()?p.a*(.78+.22*Math.sin(now*.0004+p.phase)):p.a;ctx.fillStyle='rgba(220,201,160,'+alpha+')';ctx.beginPath();ctx.arc(p.x*width,p.y*height,p.r,0,Math.PI*2);ctx.fill()}}
function tick(now){frame=0;if(document.hidden||body.classList.contains('light'))return;if(!last||now-last>48){paint(now);last=now}if(moving())frame=requestAnimationFrame(tick)}
function start(){if(frame)cancelAnimationFrame(frame);frame=0;last=0;if(!document.hidden&&!body.classList.contains('light'))tick(performance.now())}
function resize(){width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);canvas.style.width=width+'px';canvas.style.height=height+'px';if(ctx)ctx.setTransform(dpr,0,0,dpr,0,0);points=Array.from({length:width>760?44:20},()=>({x:Math.random(),y:Math.random(),r:Math.random()*.65+.35,a:Math.random()*.22+.12,phase:Math.random()*Math.PI*2}));start()}
function updateTheme(){const paper=body.classList.contains('light');document.documentElement.dataset.theme=paper?'paper':'aurora';if(theme){theme.textContent=paper?'Aurora':'Paper';theme.setAttribute('aria-label',paper?'Включить тёмную тему Aurora':'Включить светлую бумажную тему Paper')}start()}
new MutationObserver(updateTheme).observe(body,{attributes:true,attributeFilter:['class']});
document.addEventListener('pointermove',event=>{if(!fine.matches||reduced.matches)return;latest={x:event.clientX,y:event.clientY,target:event.target};if(moveFrame)return;moveFrame=requestAnimationFrame(()=>{moveFrame=0;if(!latest)return;const {x,y,target}=latest;body.style.setProperty('--gs-x',x+'px');body.style.setProperty('--gs-y',y+'px');const surface=target instanceof Element?target.closest('article,.hero,.toolbar,aside'):null;if(surface){const rect=surface.getBoundingClientRect();surface.style.setProperty('--mx',(x-rect.left)+'px');surface.style.setProperty('--my',(y-rect.top)+'px')}})},{passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(frame)cancelAnimationFrame(frame);frame=0;if(moveFrame)cancelAnimationFrame(moveFrame);moveFrame=0}else start()});
addEventListener('resize',resize,{passive:true});reduced.addEventListener('change',()=>{if(moveFrame)cancelAnimationFrame(moveFrame);moveFrame=0;body.style.removeProperty('--gs-x');body.style.removeProperty('--gs-y');start()});
resize();updateTheme();
})();
