/* nav.js — mobile menu + scroll-spy (marks the section in view with aria-current) */
(function(){
var btn=document.getElementById("menu"),links=document.getElementById("links");
function close(){links.classList.remove("open");btn.setAttribute("aria-expanded","false")}
btn.addEventListener("click",function(e){e.stopPropagation();var o=links.classList.toggle("open");btn.setAttribute("aria-expanded",String(o))});
links.addEventListener("click",function(e){if(e.target.closest("a"))close()});
document.addEventListener("click",function(e){if(!e.target.closest("header"))close()});
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&links.classList.contains("open")){close();btn.focus()}});
matchMedia("(min-width:761px)").addEventListener("change",close);
if(!("IntersectionObserver" in window))return;
var map={};links.querySelectorAll("a").forEach(function(a){map[a.getAttribute("href").slice(1)]=a});
var io=new IntersectionObserver(function(es){es.forEach(function(e){var a=map[e.target.id];if(!a)return;
 if(e.isIntersecting){Object.keys(map).forEach(function(k){map[k].removeAttribute("aria-current")});a.setAttribute("aria-current","true")}
 else a.removeAttribute("aria-current")})},{rootMargin:"-45% 0px -50% 0px"});
Object.keys(map).forEach(function(id){var s=document.getElementById(id);if(s)io.observe(s)});
})();
