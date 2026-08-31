const IS_GD_ENDPOINT='https://is.gd/create.php';

export function isGdRequestUrl(longUrl,callback){
  const request=new URL(IS_GD_ENDPOINT);
  request.searchParams.set('format','json');
  request.searchParams.set('url',longUrl);
  if(callback)request.searchParams.set('callback',callback);
  return request.href;
}

function readShortUrl(result){
  if(result.errorcode||typeof result.shorturl!=='string')throw Error(result.errormessage||'is.gd returned an invalid response');
  const shortUrl=new URL(result.shorturl);
  if(shortUrl.protocol!=='https:'||shortUrl.hostname!=='is.gd')throw Error('is.gd returned an invalid short URL');
  return shortUrl.href;
}

async function shortenWithFetch(longUrl,fetchImpl){
  const response=await fetchImpl(isGdRequestUrl(longUrl),{headers:{Accept:'application/json'}});
  if(!response.ok)throw Error(`is.gd request failed (${response.status})`);
  return readShortUrl(await response.json());
}

function shortenWithJsonp(longUrl){
  return new Promise((resolve,reject)=>{
    const callback=`routineBeaconShortUrl_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script=document.createElement('script');
    const cleanup=()=>{clearTimeout(timer);script.remove();delete globalThis[callback]};
    const fail=error=>{cleanup();reject(error)};
    globalThis[callback]=result=>{
      try{const shortUrl=readShortUrl(result);cleanup();resolve(shortUrl)}
      catch(error){fail(error)}
    };
    script.onerror=()=>fail(Error('is.gd request failed'));
    script.src=isGdRequestUrl(longUrl,callback);
    const timer=setTimeout(()=>fail(Error('is.gd request timed out')),10000);
    document.head.append(script);
  });
}

export function shortenUrl(longUrl,fetchImpl){
  // is.gd does not opt in to browser CORS, so its supported JSONP response is
  // required in the static app. Keep fetch injection for non-browser callers.
  if(fetchImpl||typeof document==='undefined')return shortenWithFetch(longUrl,fetchImpl||fetch);
  return shortenWithJsonp(longUrl);
}
