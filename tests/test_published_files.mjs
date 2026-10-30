import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { verifyPublishedFile } from '../scripts/verify_published_file.mjs';

const bytes=Buffer.from('verified original file');
const hash=createHash('sha256').update(bytes).digest('hex');
const base='https://example.test/audio-book/';
const wait=async()=>{};

test('published assets request their exact revision and return verified full bytes',async()=>{
  const data=await verifyPublishedFile(base,'pages/story.jpg',hash,{wait,fetch:async(url,options)=>{
    assert.equal(url.searchParams.get('verify'),hash);assert.equal(options.cache,'no-store');
    return new Response(bytes,{status:200,headers:{'content-type':'image/jpeg'}});
  }});
  assert.deepEqual(data,bytes);
});

test('a transient server error cannot be mistaken for an original image',async()=>{
  let calls=0;
  const data=await verifyPublishedFile(base,'pages/story.jpg',hash,{wait,fetch:async()=>{
    calls++;return calls===1?new Response('temporarily unavailable',{status:503}):new Response(bytes,{status:200});
  }});
  assert.equal(calls,2);assert.deepEqual(data,bytes);
});

test('persistent changed content still fails with its path, status and both hashes',async()=>{
  let calls=0;
  await assert.rejects(()=>verifyPublishedFile(base,'pages/story.jpg',hash,{wait,fetch:async()=>{
    calls++;return new Response('wrong image',{status:200});
  }}),error=>error.message.includes('pages/story.jpg: HTTP 200') && error.message.includes(hash) && error.message.includes('received'));
  assert.equal(calls,4);
});

test('access denial is reported immediately rather than retried',async()=>{
  let calls=0;
  await assert.rejects(()=>verifyPublishedFile(base,'pages/story.jpg',hash,{wait,fetch:async()=>{
    calls++;return new Response('denied',{status:403});
  }}),/HTTP 403/);
  assert.equal(calls,1);
});
