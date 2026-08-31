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

test('shortener returns the is.gd URL from a successful response',async()=>{
  const fetchImpl=async()=>({ok:true,json:async()=>({shorturl:'https://is.gd/abc123'})});
  assert.equal(await shortenUrl('https://example.com/share',fetchImpl),'https://is.gd/abc123');
});

test('shortener rejects API errors and unexpected URLs',async()=>{
  await assert.rejects(()=>shortenUrl('https://example.com',async()=>({ok:true,json:async()=>({errorcode:1,errormessage:'Please enter a URL'})})),/Please enter a URL/);
  await assert.rejects(()=>shortenUrl('https://example.com',async()=>({ok:true,json:async()=>({shorturl:'https://evil.example/abc'})})),/invalid short URL/);
});
