/* terminal.js — interactive terminal. Commands stay in English; replies come from locales.js */
(function(){
var reduce=APP.reduce,t=APP.t;
var out=document.getElementById("tout"),inp=document.getElementById("tin");
function add(text,cls){var d=document.createElement("div");d.textContent=text;d.dir=(cls==="cmd")?"ltr":(APP.lang==="fa"?"rtl":"ltr");if(cls)d.className=cls;out.appendChild(d);out.scrollTop=out.scrollHeight}
function run(c){c=c.trim().toLowerCase();if(!c)return;add("$ "+c,"cmd");
 if(c==="clear"){out.textContent="";return}
 if(c==="sudo hire-me"){add(t.granted);setTimeout(function(){document.getElementById("contact").scrollIntoView({behavior:reduce?"auto":"smooth"})},900);return}
 add(Object.prototype.hasOwnProperty.call(t.cmd,c)?t.cmd[c]:t.notfound)}
add(t.welcome);
inp.addEventListener("keydown",function(e){if(e.key==="Enter"){run(inp.value);inp.value=""}});
document.querySelectorAll(".qc button").forEach(function(b){b.addEventListener("click",function(){run(b.dataset.c)})});
})();
