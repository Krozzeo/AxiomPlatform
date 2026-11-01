// Optional, presentation-only product metadata. No model data or authority crosses this bridge.
export function presentation(data,nonce){
 if(!nonce||!data||Object.keys(data).some(k=>!['kind','nonce','title','iconPng'].includes(k))||data.kind!=='axiom.platform.presentation'||data.nonce!==nonce||typeof data.title!=='string'||!data.title.trim()||data.title.length>128||/[\u0000-\u001f]/.test(data.title)||typeof data.iconPng!=='string'||data.iconPng.length>16384||!/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(data.iconPng))return null;
 try{const bytes=Uint8Array.from(atob(data.iconPng.slice(22)),c=>c.charCodeAt(0)),view=new DataView(bytes.buffer);if(bytes.length<33||![137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v)||String.fromCharCode(...bytes.slice(12,16))!=='IHDR')return null;const w=view.getUint32(16),h=view.getUint32(20);if(!w||!h||w>128||h>128)return null;return {title:data.title,iconPng:data.iconPng};}catch{return null;}
}
