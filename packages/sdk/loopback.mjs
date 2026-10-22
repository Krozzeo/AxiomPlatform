import {randomInt} from 'node:crypto';
// Automatic ports stay in the private high range, outside browser restricted service ports.
export async function listenLoopback(server,port=0){
 if(!Number.isSafeInteger(port)||port<0||port>65535)throw Error('Choose a valid local port');
 for(let attempt=0;attempt<12;attempt++){
  const selected=port||randomInt(49152,65535);
  try{await new Promise((yes,no)=>{const error=e=>{server.off('listening',ready);no(e);},ready=()=>{server.off('error',error);yes();};server.once('error',error);server.once('listening',ready);server.listen(selected,'127.0.0.1');});return server.address().port;}
  catch(error){if(port||!['EADDRINUSE','EACCES'].includes(error.code)||attempt===11)throw error;}
 }
}
