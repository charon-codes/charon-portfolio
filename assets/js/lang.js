/* lang.js — remembers the chosen language and offers (never forces) the other version */
(function(){
var cur=APP.lang,other=cur==="fa"?"en":"fa",sw=document.querySelector("a.lang");
if(!sw)return;
sw.addEventListener("click",function(){try{localStorage.setItem("lang",other)}catch(e){}});
var saved=null,dismissed=null;
try{saved=localStorage.getItem("lang");dismissed=sessionStorage.getItem("langhint")}catch(e){}
var pref=saved||((navigator.language||"").slice(0,2).toLowerCase()==="fa"?"fa":null);
if(!pref||pref===cur||dismissed)return;
var box=document.createElement("div");box.className="langhint";box.lang=other;box.dir=other==="fa"?"rtl":"ltr";
var a=document.createElement("a");a.href=sw.href;a.hreflang=other;a.textContent=LOCALES[other].hint;
var x=document.createElement("button");x.type="button";x.textContent="×";x.setAttribute("aria-label","Close");
x.addEventListener("click",function(){box.remove();try{sessionStorage.setItem("langhint","1")}catch(e){}});
box.appendChild(a);box.appendChild(x);document.body.appendChild(box);
})();
