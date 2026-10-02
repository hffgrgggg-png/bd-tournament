
const express = require("express");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || "CHANGE_THIS_SECRET_IN_PRODUCTION";
const DB = path.join(__dirname,"data.json");

app.use(express.json());
app.use(express.static(path.join(__dirname,"public")));

function readDB(){
  if(!fs.existsSync(DB)){
    const initial = {
      users: [],
      tournaments: [
        {id:1,game:"Free Fire",name:"Free Fire Solo Cup",date:"2026-10-12",time:"19:00",maxPlayers:100,joined:0,status:"upcoming"},
        {id:2,game:"Free Fire",name:"Free Fire Squad Battle",date:"2026-10-13",time:"20:00",maxPlayers:200,joined:0,status:"upcoming"},
        {id:3,game:"Free Fire",name:"Free Fire Daily Cup",date:"2026-10-02",time:"21:00",maxPlayers:50,joined:0,status:"live"},
        {id:4,game:"Ludo",name:"Ludo Classic Cup",date:"2026-10-02",time:"20:30",maxPlayers:64,joined:0,status:"upcoming"},
        {id:5,game:"Carrom",name:"Carrom Open",date:"2026-10-02",time:"19:30",maxPlayers:32,joined:0,status:"upcoming"}
      ],
      joins:[]
    };
    fs.writeFileSync(DB,JSON.stringify(initial,null,2));
  }
  return JSON.parse(fs.readFileSync(DB,"utf8"));
}
function saveDB(db){fs.writeFileSync(DB,JSON.stringify(db,null,2));}
function auth(req,res,next){
  try{
    const h=req.headers.authorization||"";
    const token=h.startsWith("Bearer ")?h.slice(7):null;
    if(!token) return res.status(401).json({error:"Login required"});
    req.user=jwt.verify(token,SECRET);
    next();
  }catch(e){res.status(401).json({error:"Invalid or expired login"});}
}

app.get("/api/health",(req,res)=>res.json({ok:true,name:"BD Tournament"}));
app.post("/api/register",async(req,res)=>{
  const {name,email,password}=req.body||{};
  if(!name||!email||!password||password.length<6) return res.status(400).json({error:"Name, email and a 6+ character password are required"});
  const db=readDB(), exists=db.users.find(u=>u.email.toLowerCase()===email.toLowerCase());
  if(exists) return res.status(409).json({error:"This email is already registered"});
  const user={id:Date.now(),name,email:email.toLowerCase(),password:await bcrypt.hash(password,10),role:"user"};
  db.users.push(user); saveDB(db);
  const token=jwt.sign({id:user.id,name:user.name,email:user.email,role:user.role},SECRET,{expiresIn:"7d"});
  res.json({token,user:{id:user.id,name:user.name,email:user.email}});
});
app.post("/api/login",async(req,res)=>{
  const {email,password}=req.body||{}, db=readDB();
  const user=db.users.find(u=>u.email===String(email||"").toLowerCase());
  if(!user||!(await bcrypt.compare(password||"",user.password))) return res.status(401).json({error:"Email or password is incorrect"});
  const token=jwt.sign({id:user.id,name:user.name,email:user.email,role:user.role},SECRET,{expiresIn:"7d"});
  res.json({token,user:{id:user.id,name:user.name,email:user.email,role:user.role}});
});
app.get("/api/me",auth,(req,res)=>res.json({user:req.user}));
app.get("/api/tournaments",(req,res)=>{
  const db=readDB(), game=req.query.game;
  res.json(game?db.tournaments.filter(t=>t.game===game):db.tournaments);
});
app.post("/api/tournaments/:id/join",auth,(req,res)=>{
  const db=readDB(), id=Number(req.params.id), t=db.tournaments.find(x=>x.id===id);
  if(!t) return res.status(404).json({error:"Tournament not found"});
  if(t.joined>=t.maxPlayers) return res.status(400).json({error:"Tournament is full"});
  if(db.joins.some(j=>j.userId===req.user.id&&j.tournamentId===id)) return res.status(409).json({error:"Already joined"});
  db.joins.push({userId:req.user.id,tournamentId:id,joinedAt:new Date().toISOString()});
  t.joined++;
  saveDB(db);
  res.json({ok:true,message:"Tournament joined successfully",tournament:t});
});
app.get("/api/my-tournaments",auth,(req,res)=>{
  const db=readDB(), ids=db.joins.filter(j=>j.userId===req.user.id).map(j=>j.tournamentId);
  res.json(db.tournaments.filter(t=>ids.includes(t.id)));
});
app.post("/api/tournaments",auth,(req,res)=>{
  if(req.user.role!=="admin") return res.status(403).json({error:"Admin only"});
  const {game,name,date,time,maxPlayers}=req.body||{};
  if(!game||!name||!date||!time||!maxPlayers) return res.status(400).json({error:"Missing tournament fields"});
  const db=readDB(), t={id:Date.now(),game,name,date,time,maxPlayers:Number(maxPlayers),joined:0,status:"upcoming"};
  db.tournaments.push(t); saveDB(db); res.json(t);
});
app.delete("/api/tournaments/:id",auth,(req,res)=>{
  if(req.user.role!=="admin") return res.status(403).json({error:"Admin only"});
  const db=readDB(); db.tournaments=db.tournaments.filter(t=>t.id!==Number(req.params.id)); saveDB(db); res.json({ok:true});
});

app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,()=>console.log(`BD Tournament running on port ${PORT}`));
