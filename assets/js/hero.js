/* hero.js — typed roles, live candlestick chart, particle name */
(function(){
var reduce=APP.reduce,roles=APP.t.roles,root=document.documentElement;
var el=document.getElementById("type"),ri=0,ci=0,del=false;
if(reduce){el.textContent=roles[0]}else{(function tick(){
 var w=roles[ri];ci+=del?-1:1;el.textContent=w.slice(0,ci);
 var d=del?30:70;if(!del&&ci===w.length){del=true;d=1400}else if(del&&ci===0){del=false;ri=(ri+1)%roles.length;d=300}
 setTimeout(tick,d)})()}
/* candlestick chart (always drawn left-to-right, like a real chart) */
var cv=document.getElementById("chart"),cx=cv.getContext("2d"),W=0,H=0,mx=-1,t0=performance.now(),C=[],s=11;
function rnd(){s=s*16807%2147483647;return s/2147483647}
var p0=100;for(var i=0;i<60;i++){var o=p0,c=o+(rnd()-.4)*7+.4;C.push({o:o,c:c,h:Math.max(o,c)+rnd()*3,l:Math.min(o,c)-rnd()*3});p0=c}
var CV={};function refresh(){var cs=getComputedStyle(root);["--up","--down","--line","--gold","--on-gold","--ink"].forEach(function(n){CV[n]=cs.getPropertyValue(n).trim()})}
function v(n){return CV[n]}refresh();
new MutationObserver(refresh).observe(root,{attributes:true,attributeFilter:["data-theme"]});
matchMedia("(prefers-color-scheme: dark)").addEventListener("change",refresh);
var vis=true,raf=0;
function loop(now){if(!vis||document.hidden){raf=0;return}frame(now);if(P.length)pl();raf=requestAnimationFrame(loop)}
function start(){if(!raf)raf=requestAnimationFrame(loop)}
document.addEventListener("visibilitychange",start);
function size(){var r=cv.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);W=r.width;H=r.height;cv.width=W*d;cv.height=H*d;cx.setTransform(d,0,0,d,0,0)}
size();addEventListener("resize",size);
cv.parentNode.addEventListener("pointermove",function(e){var r=cv.getBoundingClientRect();mx=e.clientX-r.left});
cv.parentNode.addEventListener("pointerleave",function(){mx=-1});
function frame(now){
 var t=reduce?1:Math.min(1,(now-t0)/3000),n=Math.max(2,Math.floor(C.length*(1-Math.pow(1-t,3))));
 cx.clearRect(0,0,W,H);
 var lo=1e9,hi=-1e9;C.forEach(function(k){lo=Math.min(lo,k.l);hi=Math.max(hi,k.h)});
 var top=H*.18,bot=H*.14,Y=function(q){return H-bot-(q-lo)/(hi-lo)*(H-top-bot)};
 var cw=W/C.length,up=v("--up"),dn=v("--down"),ln=v("--line");
 cx.strokeStyle=ln;cx.lineWidth=1;
 for(var g=1;g<6;g++){var gy=H*g/6;cx.beginPath();cx.moveTo(0,gy);cx.lineTo(W,gy);cx.stroke()}
 var hot=mx>=0?Math.min(C.length-1,Math.max(0,Math.floor(mx/cw))):-1;
 for(var i=0;i<n;i++){var k=C[i],x=i*cw+cw/2,col=k.c>=k.o?up:dn;
  cx.globalAlpha=hot<0||i===hot?1:.55;cx.strokeStyle=col;cx.fillStyle=col;cx.lineWidth=1.5;
  cx.beginPath();cx.moveTo(x,Y(k.h));cx.lineTo(x,Y(k.l));cx.stroke();
  var a=Y(Math.max(k.o,k.c)),b=Y(Math.min(k.o,k.c));cx.fillRect(x-cw*.3,a,cw*.6,Math.max(2,b-a))}
 cx.globalAlpha=1;
 if(hot>=0&&hot<n){var k=C[hot],x=hot*cw+cw/2,y=Y(k.c);
  cx.setLineDash([4,5]);cx.strokeStyle=v("--gold");cx.lineWidth=1;
  cx.beginPath();cx.moveTo(x,0);cx.lineTo(x,H);cx.moveTo(0,y);cx.lineTo(W,y);cx.stroke();cx.setLineDash([]);
  cx.fillStyle=v("--gold");cx.fillRect(W-74,y-12,74,24);cx.fillStyle=v("--on-gold");cx.font="700 13px Arial";cx.textAlign="center";cx.fillText(k.c.toFixed(2),W-37,y+4.5)}
 var L=C[n-1],ly=Y(L.c),lc=L.c>=L.o?up:dn;cx.setLineDash([2,4]);cx.strokeStyle=lc;cx.lineWidth=1;cx.beginPath();cx.moveTo(0,ly);cx.lineTo(W,ly);cx.stroke();cx.setLineDash([]);cx.fillStyle=lc;cx.fillRect(W-74,ly-11,74,22);cx.fillStyle="#04110f";cx.font="700 13px Arial";cx.textAlign="center";cx.fillText(L.c.toFixed(2),W-37,ly+4.5);
 }

setInterval(function(){if(reduce||document.hidden||!vis)return;var l=C[C.length-1],o=l.c,c=o+(rnd()-.5)*7+(100-o)*.01;C.push({o:o,c:c,h:Math.max(o,c)+rnd()*3,l:Math.min(o,c)-rnd()*3});C.shift()},1100);
/* particle name — measures the real text box, so it works in LTR and RTL pages */
var pc=document.getElementById("parts"),px=pc.getContext("2d"),P=[],hero=pc.parentNode,h1=hero.querySelector("h1"),pm={x:-999,y:-999},HW=0,HH=0;
hero.addEventListener("pointermove",function(e){var r=hero.getBoundingClientRect();pm.x=e.clientX-r.left;pm.y=e.clientY-r.top});
hero.addEventListener("pointerleave",function(){pm.x=pm.y=-999});
function build(){
 var hr=hero.getBoundingClientRect(),rg=document.createRange();rg.selectNodeContents(h1);var r=rg.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);HW=hr.width;HH=hr.height;
 pc.width=HW*d;pc.height=HH*d;px.setTransform(d,0,0,d,0,0);
 var w=Math.ceil(r.width),h=Math.ceil(r.height),o=document.createElement("canvas");o.width=w;o.height=h;
 var ox=o.getContext("2d"),fs=parseFloat(getComputedStyle(h1).fontSize);
 ox.font="700 "+fs+"px 'Space Grotesk',Arial,sans-serif";ox.textBaseline="middle";ox.textAlign="left";ox.fillStyle="#000";
 var txt=h1.textContent.trim(),ls=parseFloat(getComputedStyle(h1).letterSpacing)||0;
 if("letterSpacing" in ox){ox.letterSpacing=ls+"px";ox.fillText(txt,0,h/2)}
 else{var gx=0;for(var q=0;q<txt.length;q++){ox.fillText(txt[q],gx,h/2);gx+=ox.measureText(txt[q]).width+ls}}
 var data=ox.getImageData(0,0,w,h).data,st=w<500?3:5;
 do{P=[];for(var y=0;y<h;y+=st)for(var x=0;x<w;x+=st)if(data[(y*w+x)*4+3]>128)P.push({x:Math.random()*HW,y:Math.random()*HH,hx:r.left-hr.left+x,hy:r.top-hr.top+y,vx:0,vy:0});st++}while(P.length>2400&&st<10);
 if(P.length)hero.classList.add("pz")}
function pl(){
 px.clearRect(0,0,HW,HH);var ink=v("--ink"),gd=v("--gold"),cur="";
 for(var i=0;i<P.length;i++){var p=P[i],mx2=p.x-pm.x,my2=p.y-pm.y,md=mx2*mx2+my2*my2;
  if(md<14000){var f=(14000-md)/14000*3/Math.sqrt(md+1);p.vx+=mx2*f;p.vy+=my2*f}
  p.vx=(p.vx+(p.hx-p.x)*.045)*.86;p.vy=(p.vy+(p.hy-p.y)*.045)*.86;p.x+=p.vx;p.y+=p.vy;
  var c=Math.abs(p.vx)+Math.abs(p.vy)>1.6?gd:ink;if(c!==cur){px.fillStyle=c;cur=c}
  px.fillRect(p.x,p.y,2.3,2.3)}
 }
if(!reduce){var rt;document.fonts.load("700 100px 'Space Grotesk'").then(function(){build();start()});
 addEventListener("resize",function(){clearTimeout(rt);rt=setTimeout(build,250)})}
new IntersectionObserver(function(es){vis=es[0].isIntersecting;if(vis)start()},{threshold:0}).observe(hero);
start();
hero.addEventListener("pointerdown",function(e){var r=hero.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;P.forEach(function(p){var dx=p.x-x,dy=p.y-y,d=Math.sqrt(dx*dx+dy*dy)+1,f=Math.max(0,1-d/280)*40;p.vx+=dx/d*f;p.vy+=dy/d*f})});
})();
