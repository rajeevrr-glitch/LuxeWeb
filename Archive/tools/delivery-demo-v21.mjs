// Temporary localhost-only QA fixture. Not included in the website handover.
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import handler from "./luxeweb/dist/server/server.js";
import { createProductionServer } from "./luxeweb/scripts/production-server.mjs";
import { createEnquiryDelivery } from "./luxeweb/scripts/enquiry-delivery.mjs";

const directory = await mkdtemp(path.join(tmpdir(), "luxe-local-delivery-qa-"));
let accepted = 0;
const server = createProductionServer({
  delivery: createEnquiryDelivery({enabled:true,directory,origins:["http://127.0.0.1:3001"],notify:async()=>{
    accepted++;
    return {providerMessageId:"wamid.local-qa-only"};
  }}),
  handler:{fetch:async request=>{
    const response=await handler.fetch(request);
    if (!(response.headers.get("content-type")||"").includes("text/html")) return response;
    const body=(await response.text()).replace(/(<body[^>]*>)/,"$1<div style='padding:10px;background:#713f1f;color:white;text-align:center;font:13px system-ui'>LOCAL TEST — automatic notification is simulated. Nothing is sent to WhatsApp.</div>");
    const headers=new Headers(response.headers);
    headers.delete("content-length");
    return new Response(body,{status:response.status,headers});
  }},
});
server.listen(3001,"127.0.0.1",()=>console.log("Local test adapter ready at http://127.0.0.1:3001; no external messaging."));
for (const signal of ["SIGINT","SIGTERM"]) process.on(signal,()=>server.close(async()=>{
  if (path.dirname(directory) === path.resolve(tmpdir()) && path.basename(directory).startsWith("luxe-local-delivery-qa-")) await rm(directory,{recursive:true,force:true});
  console.log(JSON.stringify({testNotifications:accepted,realMessages:0}));
  process.exit(0);
}));
