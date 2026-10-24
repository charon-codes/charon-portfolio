/* ui.js — progress bar, cursor glow, tile tilt, magnetic buttons, scroll reveal, copy-email */
(function(){
var reduce=APP.reduce,t=APP.t;
var bar=document.getElementById("bar"),root=document.documentElement;
addEventListener("scroll",function(){var h=root.scrollHeight-innerHeight;bar.style.width=(h>0?scrollY/h*100:0)+"%"},{passive:true});
document.querySelectorAll(".tile").forEach(function(el){
 el.addEventListener("pointermove",function(e){var r=el.getBoundingClientRect();el.style.setProperty("--x",(e.clientX-r.left)+"px");el.style.setProperty("--y",(e.clientY-r.top)+"px");if(!reduce)el.style.transform="perspective(700px) rotateX("+(((e.clientY-r.top)/r.height-.5)*-8)+"deg) rotateY("+(((e.clientX-r.left)/r.width-.5)*8)+"deg)"});
 el.addEventListener("pointerleave",function(){el.style.transform=""});
});
var cp=document.getElementById("copy");
cp.addEventListener("click",function(){var s=cp.textContent;try{navigator.clipboard.writeText(s)}catch(e){}cp.textContent=t.copied;setTimeout(function(){cp.textContent=s},1600)});
var gl=document.getElementById("glow");
addEventListener("pointermove",function(e){gl.style.transform="translate("+e.clientX+"px,"+e.clientY+"px)"},{passive:true});
if(!reduce&&"IntersectionObserver" in window){
 var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}})},{threshold:.15});
 document.querySelectorAll("section h2,.sub,.about>div,.tl li,.contact h2").forEach(function(el){el.classList.add("rv");io.observe(el)});
}
document.querySelectorAll(".btn,.hire").forEach(function(b){
 b.addEventListener("pointermove",function(e){if(reduce)return;var r=b.getBoundingClientRect();b.style.transform="translate("+((e.clientX-r.left-r.width/2)*.25)+"px,"+((e.clientY-r.top-r.height/2)*.35)+"px)"});
 b.addEventListener("pointerleave",function(){b.style.transform=""});
});
})();
