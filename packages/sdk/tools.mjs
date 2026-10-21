export const agentError=(code,message)=>Object.assign(new Error(message),{code});
export function validate(schema,value,path='arguments',depth=0) {
 const fail=()=>{throw agentError('AX_AGENT_0001',`Invalid ${path}`);};
 if(depth>24)fail();
 if(Array.isArray(schema.type)){let matched=false;for(const type of schema.type){try{validate({...schema,type},value,path,depth+1);matched=true;break;}catch{}}if(!matched)fail();return;}
 if(schema.const!==undefined&&value!==schema.const)fail();
 if(schema.enum&&!schema.enum.includes(value))fail();
 switch(schema.type){
 case 'null':if(value!==null)fail();break;
 case 'object':
  if(!value||typeof value!=='object'||Array.isArray(value))fail();
  for(const key of schema.required??[])if(!Object.hasOwn(value,key))fail();
  for(const [key,child]of Object.entries(value)){if(['__proto__','constructor','prototype'].includes(key))fail();if(!Object.hasOwn(schema.properties??{},key)){if(schema.additionalProperties===false)fail();}else validate(schema.properties[key],child,`${path}.${key}`,depth+1);}break;
 case 'array':if(!Array.isArray(value)||value.length<(schema.minItems??0)||value.length>(schema.maxItems??4096))fail();if(schema.uniqueItems&&new Set(value.map(v=>JSON.stringify(v))).size!==value.length)fail();for(const child of value)validate(schema.items??{},child,path+'[]',depth+1);break;
 case 'integer':if(!Number.isSafeInteger(value))fail(); // fall through
 case 'number':if(typeof value!=='number'||!Number.isFinite(value)||value<(schema.minimum??-Infinity)||value>(schema.maximum??Infinity))fail();break;
 case 'string':if(typeof value!=='string'||value.length<(schema.minLength??0)||value.length>(schema.maxLength??12000000)||(schema.pattern&&!new RegExp(schema.pattern).test(value)))fail();break;
 case 'boolean':if(typeof value!=='boolean')fail();break;
 }
}
export const size=value=>Buffer.byteLength(JSON.stringify(value));
export function bounded(value,maxBytes=8192){if(size(value)>maxBytes)throw agentError('AX_AGENT_0003','Response exceeds context budget; narrow the query or increase maxBytes');return value;}
export function page(items,args={},extra={}){
 const offset=args.offset??0,limit=args.limit??25,maxBytes=args.maxBytes??8192;
 let selected=items.slice(offset,offset+limit);
 while(true){const nextOffset=offset+selected.length<items.length?offset+selected.length:null,result={...extra,items:selected,total:items.length,nextOffset};if(size(result)<=maxBytes){if(!selected.length&&offset<items.length)throw agentError('AX_AGENT_0003','One item exceeds context budget; increase maxBytes');return result;}if(!selected.length)return bounded(result,maxBytes);selected.pop();}
}

export class ToolRegistry {
 constructor(definitions){this.tools=Object.freeze(definitions.map(t=>structuredClone(t)));this.map=new Map();for(const t of this.tools){if(typeof t.name!=='string'||this.map.has(t.name)||!t.inputSchema)throw agentError('AX_AGENT_0001','Invalid or duplicate tool definition');this.map.set(t.name,t);}}
 get(name){const tool=this.map.get(name);if(!tool)throw agentError('AX_AGENT_0004','Tool unavailable');return tool;}
 validate(name,args){const tool=this.get(name);validate(tool.inputSchema,args);return tool;}
}
