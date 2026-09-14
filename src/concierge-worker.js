import {MLCEngine} from '@mlc-ai/web-llm';
let engine, system='', busy=false;
const post=(data)=>self.postMessage(data);
self.onmessage=async({data})=>{
 try{
  if(data.type==='stop'){engine?.interruptGenerate();return;}
  if(data.type==='init'){
   system=data.instructions;
   const adapter=await navigator.gpu?.requestAdapter({powerPreference:'low-power'});
   if(!adapter)throw Error('No compatible GPU is available. You can still email your enquiry.');
   const model=adapter.features.has('shader-f16')?'Qwen2.5-1.5B-Instruct-q4f16_1-MLC':'Qwen2.5-1.5B-Instruct-q4f32_1-MLC';
   engine=new MLCEngine({initProgressCallback:p=>post({type:'progress',text:p.text,progress:p.progress}),logLevel:'WARN'});
   await engine.reload(model,{context_window_size:4096});
   post({type:'progress',text:'Warming up the local model…',progress:1});
   await engine.chat.completions.create({messages:[{role:'user',content:'Hello'}],max_tokens:1,temperature:0});
   post({type:'ready',model:'Qwen 2.5 1.5B · local AI'});return;
  }
  if(data.type==='generate'){
   if(busy)throw Error('A reply is already being prepared.');
   busy=true;
   try{
    const stream=await engine.chat.completions.create({messages:[{role:'system',content:system},...data.messages],stream:true,max_tokens:180,temperature:.25,repetition_penalty:1.05});
    for await(const chunk of stream){const text=chunk.choices[0]?.delta?.content;if(text)post({type:'delta',id:data.id,text});}
    post({type:'done',id:data.id});
   }finally{busy=false;}
  }
 }catch(error){post({type:'failed',id:data.id,error:error?.message||'Local model failed to respond.'});}
};
