/* theme.js — loads synchronously in <head> so the saved theme applies before first paint */
(function(){
var root=document.documentElement;
function set(t){if(t)root.setAttribute("data-theme",t)}
function isDark(){var a=root.getAttribute("data-theme");return a?a==="dark":matchMedia("(prefers-color-scheme: dark)").matches}
try{set(localStorage.getItem("theme"))}catch(e){}
document.addEventListener("DOMContentLoaded",function(){
 var b=document.getElementById("theme");if(!b)return;
 b.addEventListener("click",function(){
  var n=isDark()?"light":"dark";set(n);
  try{localStorage.setItem("theme",n)}catch(e){}
 });
});
})();
