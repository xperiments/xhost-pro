/*
 MIT

 @param  {string} selector    CSS selector
 @return {object}             Single or multiple DOM Nodes
*/
const $=(selector,root=document)=>{const matches={"#":"getElementById",".":"getElementsByClassName","@":"getElementsByName","=":"getElementsByTagName","?":"querySelectorAll"};const rex=/[?=#@.*]/.exec(selector)[0];const nodes=root[matches[rex]](selector.split(rex)[1]);if(nodes.length==1)return nodes[0];return nodes};
const notify=(text,level=0,delay=0,duration=5E3)=>{const notifyLevel={0:"",1:" -error"};setTimeout(()=>{$("?.xhost__notification-container").innerHTML=`<div class="xhost__notification ${notifyLevel[level]}">${text}</div>`},delay);setTimeout(()=>{$("?.xhost__notification-container").innerHTML=""},delay+duration)};window.notify=notify;
if(window.applicationCache){window.applicationCache.addEventListener("updateready",e=>{if(window.applicationCache.status==window.applicationCache.UPDATEREADY){notify("CACHE UPDATED<br/>RELOADING",1);setTimeout(()=>{window.location.reload()},3E3)}},false);window.applicationCache.ondownloading=()=>{$(".xhost__cache").style.display="block";notify("CACHING STARTED",1)};window.applicationCache.onprogress=a=>{let w=Math.round(100*(a.loaded/a.total));if(w>100||isNaN(w))w=100;$(".xhost__payload-autoload-bar").style.width=
w+"%"};window.applicationCache.oncached=()=>{$(".xhost__cache").style.display="none";notify("CACHING COMPLETED",1)}}
const HashStorage=()=>{const encodeHash=()=>{return"#"+btoa(JSON.stringify(hashStore))};let hashStore;return{initialize(callback){const hash=(new URL(window.location.href)).hash===""?"#"+btoa("{}"):(new URL(window.location.href)).hash;try{hashStore=JSON.parse(atob(hash.substring(1)))}catch(e){throw new Error("Unable to parse hash");}callback(hashStore)},getItem(name){return hashStore[name]||null},setItem(name,value){hashStore[name]=value;history.replaceState(undefined,undefined,encodeHash())}}};
const hashStorage=HashStorage();const queryParams=new URLSearchParams(window.location.search);window.autoloadGoldHen=false;if(queryParams.has("autoload-hen"))window.autoloadGoldHen=true;window.kernelReady=()=>{};
