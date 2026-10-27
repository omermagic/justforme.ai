// The page itself is network-first: every normal visit checks GitHub Pages for
// the newest release. Assets stay cache-first so the app still opens offline.
const CACHE_PREFIX='palavra-quest-shell-';
const CACHE=CACHE_PREFIX+'v19';
const SHELL=['./','./index.html','./manifest.webmanifest','./icon.svg'];

self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  const oldCaches=keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE);
  await Promise.all(oldCaches.map(key=>caches.delete(key)));
  await self.clients.claim();
  // If this activation replaced an older release, refresh every open app tab.
  // This makes the new HTML visible immediately instead of waiting for a
  // second manual reload of a page served by the previous worker.
  if(oldCaches.length){
   const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
   await Promise.all(windows.map(client=>client.navigate(client.url).catch(()=>undefined)));
  }
 })());
});

async function freshPage(request){
 try{
  const response=await fetch(request);
  if(response.ok){const cache=await caches.open(CACHE);await cache.put('./index.html',response.clone())}
  return response;
 }catch{
  return (await caches.match('./index.html'))||Response.error();
 }
}

async function cachedAsset(request){
 const cached=await caches.match(request);
 if(cached)return cached;
 try{
  const response=await fetch(request);
  if(response.ok){const cache=await caches.open(CACHE);await cache.put(request,response.clone())}
  return response;
 }catch{return Response.error()}
}

self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
 event.respondWith(request.mode==='navigate'?freshPage(request):cachedAsset(request));
});
