const express=require("express");
const cors=require("cors");
const axios=require("axios");
const app=express();
app.use(cors());
app.use(express.json());

const PORT=Number(process.env.PORT||10000);
const BASE="https://api.upstox.com/v2";
const TTL=Number(process.env.CACHE_TTL_MS||60000);
const cache=new Map();

function token(){
  if(!process.env.UPSTOX_ACCESS_TOKEN) throw Object.assign(new Error("UPSTOX_ACCESS_TOKEN is not configured"),{status:500});
  return process.env.UPSTOX_ACCESS_TOKEN;
}
async function get(path,params={}){
  const r=await axios.get(BASE+path,{params,headers:{Accept:"application/json",Authorization:`Bearer ${token()}`},timeout:15000});
  return r.data;
}
async function cached(key,loader){
  const old=cache.get(key), now=Date.now();
  if(old && now-old.time<TTL) return {data:old.data,cached:true};
  const data=await loader(); cache.set(key,{time:now,data}); return {data,cached:false};
}

app.get("/health",(_q,r)=>r.json({status:"ok",service:"ipo-friends-api",time:new Date().toISOString()}));

app.get("/api/ipos",async(req,res,next)=>{
  try{
    const allowed=["upcoming","open","closed","listed"];
    const status=req.query.status||"open";
    if(!allowed.includes(status)) return res.status(400).json({error:"Invalid status",allowed});
    const page=Math.max(1,Number(req.query.page_number||1));
    const records=Math.min(30,Math.max(1,Number(req.query.records||30)));
    const result=await cached(`ipos:${status}:${page}:${records}`,()=>get("/ipos",{status,issue_type:"regular",page_number:page,records}));
    res.set("X-Cache",result.cached?"HIT":"MISS"); res.json(result.data);
  }catch(e){next(e);}
});

app.get("/api/ipos/:id",async(req,res,next)=>{
  try{
    const id=encodeURIComponent(req.params.id);
    const result=await cached(`ipo:${id}`,()=>get(`/ipos/${id}`));
    res.set("X-Cache",result.cached?"HIT":"MISS"); res.json(result.data);
  }catch(e){next(e);}
});

app.get("/api/ipo-orders",async(req,res,next)=>{
  try{
    const page=Math.max(1,Number(req.query.page_number||1));
    const records=Math.min(30,Math.max(1,Number(req.query.records||30)));
    res.json(await get("/ipos/orders",{page_number:page,records}));
  }catch(e){next(e);}
});

app.use((e,_q,res,_n)=>{
  console.error(e.response?.data||e.message);
  const status=e.response?.status||e.status||500;
  res.status(status).json({
    error:"API request failed",
    message:status===401?"Upstox authentication failed or the access token has expired.":"Unable to retrieve IPO data.",
    upstream:e.response?.data
  });
});

app.listen(PORT,"0.0.0.0",()=>console.log(`IPO Friends API listening on 0.0.0.0:${PORT}`));
