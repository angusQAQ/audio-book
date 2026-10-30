import { createHash } from 'node:crypto';

export async function verifyPublishedFile(base, path, expectedHash, options={}) {
  const request=options.fetch || globalThis.fetch;
  const wait=options.wait || (ms=>new Promise(resolve=>setTimeout(resolve,ms)));
  let diagnosis='No response';
  for(let attempt=0;attempt<4;attempt++) {
    const url=new URL(path,base);url.searchParams.set('verify',expectedHash);
    url.searchParams.set('verify_attempt',String(attempt));
    try {
      const response=await request(url,{signal:AbortSignal.timeout(15000),cache:'no-store'});
      const bytes=Buffer.from(await response.arrayBuffer());
      const actual=createHash('sha256').update(bytes).digest('hex');
      if(response.status===200 && actual===expectedHash)return bytes;
      diagnosis=`${path}: HTTP ${response.status}, ${response.headers.get('content-type') || 'unknown type'}, ${bytes.length} bytes; expected SHA-256 ${expectedHash}, received ${actual}`;
      if(response.status===401 || response.status===403)break;
    } catch(error) {
      diagnosis=`${path}: ${error.name}: ${error.message}`;
    }
    if(attempt<3)await wait([1000,2500,5000][attempt]);
  }
  throw new Error('Published file did not match its verified source: '+diagnosis);
}
