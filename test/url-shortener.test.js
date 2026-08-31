import test from 'node:test';
import assert from 'node:assert/strict';
import {isGdRequestUrl,shortenUrl} from '../url-shortener.js';

test('is.gd request includes the complete share URL',()=>{
  const longUrl='https://example.com/app/?routine=a+b/c?';
  const request=new URL(isGdRequestUrl(longUrl));
  assert.equal(request.origin+request.pathname,'https://is.gd/create.php');
  assert.equal(request.searchParams.get('format'),'json');
  assert.equal(request.searchParams.get('url'),longUrl);
});

test('is.gd request includes a JSONP callback when provided',()=>{
  const request=new URL(isGdRequestUrl('https://example.com/share','routineBeaconShortUrl_1'));
  assert.equal(request.searchParams.get('callback'),'routineBeaconShortUrl_1');
});

test('shortener returns the is.gd URL from a successful response',async()=>{
  const fetchImpl=async()=>({ok:true,json:async()=>({shorturl:'https://is.gd/abc123'})});
  assert.equal(await shortenUrl('https://example.com/share',fetchImpl),'https://is.gd/abc123');
});

test('shortener rejects API errors and unexpected URLs',async()=>{
  await assert.rejects(()=>shortenUrl('https://example.com',async()=>({ok:true,json:async()=>({errorcode:1,errormessage:'Please enter a URL'})})),/Please enter a URL/);
  await assert.rejects(()=>shortenUrl('https://example.com',async()=>({ok:true,json:async()=>({shorturl:'https://evil.example/abc'})})),/invalid short URL/);
});

test('shortener uses JSONP in a browser to avoid CORS',async()=>{
  const originalDocument=globalThis.document;
  let requestedUrl;
  globalThis.document={
    createElement:()=>({remove(){}}),
    head:{append(script){
      requestedUrl=new URL(script.src);
      queueMicrotask(()=>globalThis[requestedUrl.searchParams.get('callback')]({shorturl:'https://is.gd/jsonp1'}));
    }},
  };
  try{
    assert.equal(await shortenUrl('https://example.com/share'),'https://is.gd/jsonp1');
    assert.equal(requestedUrl.searchParams.get('url'),'https://example.com/share');
    assert.match(requestedUrl.searchParams.get('callback'),/^routineBeaconShortUrl_/);
  }finally{
    if(originalDocument===undefined)delete globalThis.document;
    else globalThis.document=originalDocument;
  }
});
