const IS_GD_ENDPOINT='https://is.gd/create.php';

export function isGdRequestUrl(longUrl){
  const request=new URL(IS_GD_ENDPOINT);
  request.searchParams.set('format','json');
  request.searchParams.set('url',longUrl);
  return request.href;
}

export async function shortenUrl(longUrl,fetchImpl=fetch){
  const response=await fetchImpl(isGdRequestUrl(longUrl),{headers:{Accept:'application/json'}});
  if(!response.ok)throw Error(`is.gd request failed (${response.status})`);
  const result=await response.json();
  if(result.errorcode||typeof result.shorturl!=='string')throw Error(result.errormessage||'is.gd returned an invalid response');
  const shortUrl=new URL(result.shorturl);
  if(shortUrl.protocol!=='https:'||shortUrl.hostname!=='is.gd')throw Error('is.gd returned an invalid short URL');
  return shortUrl.href;
}
