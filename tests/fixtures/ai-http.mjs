export const aiMessage=text=>({type:'message',role:'assistant',content:[{type:'output_text',text}]}),aiTool=(name,args,id)=>({type:'function_call',name,call_id:id,arguments:JSON.stringify(args)});
export class AiHTTPFixture {
  constructor(){this.outputs=[];this.requests=[];this.failStatus=null;this.waiting=null;this.release=null;}
  response(output){return {status:'completed',output,usage:{input_tokens:30,output_tokens:20,total_tokens:50}};}
  fetch=async(url,options)=>{
    const body=options.body?JSON.parse(options.body):null;this.requests.push({url,body});
    if(this.failStatus)return new Response(JSON.stringify({error:{message:'upstream private detail'}}),{status:this.failStatus});
    if(url.endsWith('/models'))return new Response(JSON.stringify({data:[{id:'gpt-4.1'}]}));
    if(body.tool_choice==='none')return new Response(JSON.stringify(this.response([aiMessage('OK')])));
    if(this.waiting){const result=await new Promise(r=>this.release=r);return new Response(JSON.stringify(this.response(result)));}
    return new Response(JSON.stringify(this.response(this.outputs.shift()??[aiMessage('Respuesta controlada')])));
  };
}
