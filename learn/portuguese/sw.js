// Normal visits check GitHub Pages for a new release, but never leave the app
// hanging on a weak connection. Assets remain available from the local shell.
const CACHE_PREFIX='palavra-quest-shell-';
const RELEASE='28';
const CACHE=CACHE_PREFIX+'v'+RELEASE;
const SHELL=['./index.html','./manifest.webmanifest','./icon.svg'];
const NAVIGATION_TIMEOUT_MS=4500;

self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  // A unique release query bypasses GitHub Pages' short CDN cache. Store the
  // responses under their normal URLs so offline requests still match them.
  await Promise.all(SHELL.map(async path=>{
   const response=await fetch(`${path}?release=${RELEASE}`,{cache:'no-store'});
   if(!response.ok)throw Error(`Could not install ${path}`);
   await cache.put(path,response);
  }));
  await self.skipWaiting();
 })());
});

self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  const oldCaches=keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE);
  await Promise.all(oldCaches.map(key=>caches.delete(key)));
  await self.clients.claim();
 })());
});

async function freshPage(request){
 const cache=await caches.open(CACHE);
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),NAVIGATION_TIMEOUT_MS);
 try{
  const response=await fetch(request,{cache:'no-store',signal:controller.signal});
  if(!response.ok)throw Error('Page request failed');
  await cache.put('./index.html',response.clone());
  return response;
 }catch{
  return (await cache.match('./index.html'))||Response.error();
 }finally{clearTimeout(timeout)}
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
