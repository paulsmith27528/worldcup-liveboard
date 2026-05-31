"use client";
import { useEffect, useState } from "react";

/* ─── TYPES ─────────────────────────────────────────────────────────────── */
type Team  = { name:string; abbr:string; flag:string; p:number; w:number; d:number; l:number; gs:number; ga:number; pts:number };
type Group = { id:string; teams:Team[] };
type BM    = { h:string; hf:string; hs:string; a:string; af:string; as:string; st:string; venue:string };
type LM    = { id:number; status:string; minute:number|null; hTeam:string; hFlag:string; aTeam:string; aFlag:string; hScore:number|null; aScore:number|null; venue:string; scorers:string[] };

/* ─── DATA ───────────────────────────────────────────────────────────────── */
const GROUPS: Group[] = [
  {id:"A",teams:[{name:"Mexico",abbr:"MEX",flag:"🇲🇽",p:3,w:2,d:1,l:0,gs:7,ga:2,pts:7},{name:"Ecuador",abbr:"ECU",flag:"🇪🇨",p:3,w:1,d:2,l:0,gs:4,ga:3,pts:5},{name:"S.Korea",abbr:"KOR",flag:"🇰🇷",p:3,w:1,d:0,l:2,gs:3,ga:5,pts:3},{name:"Sweden",abbr:"SWE",flag:"🇸🇪",p:3,w:0,d:1,l:2,gs:2,ga:6,pts:1}]},
  {id:"B",teams:[{name:"Canada",abbr:"CAN",flag:"🇨🇦",p:3,w:2,d:1,l:0,gs:5,ga:2,pts:7},{name:"Italy",abbr:"ITA",flag:"🇮🇹",p:3,w:1,d:1,l:1,gs:4,ga:3,pts:4},{name:"Ecuador",abbr:"ECU",flag:"🇪🇨",p:3,w:1,d:0,l:2,gs:3,ga:5,pts:3},{name:"Croatia",abbr:"CRO",flag:"🇭🇷",p:3,w:0,d:2,l:1,gs:2,ga:4,pts:2}]},
  {id:"C",teams:[{name:"Brazil",abbr:"BRA",flag:"🇧🇷",p:3,w:3,d:0,l:0,gs:9,ga:2,pts:9},{name:"Morocco",abbr:"MAR",flag:"🇲🇦",p:3,w:1,d:1,l:1,gs:4,ga:4,pts:4},{name:"Scotland",abbr:"SCO",flag:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",p:3,w:1,d:0,l:2,gs:3,ga:6,pts:3},{name:"Haiti",abbr:"HAI",flag:"🇭🇹",p:3,w:0,d:1,l:2,gs:2,ga:6,pts:1}]},
  {id:"D",teams:[{name:"USA",abbr:"USA",flag:"🇺🇸",p:3,w:2,d:1,l:0,gs:6,ga:2,pts:7},{name:"Netherlands",abbr:"NED",flag:"🇳🇱",p:3,w:1,d:1,l:1,gs:4,ga:4,pts:4},{name:"Japan",abbr:"JPN",flag:"🇯🇵",p:3,w:1,d:0,l:2,gs:4,ga:5,pts:3},{name:"Gambia",abbr:"GAM",flag:"🇬🇲",p:3,w:0,d:0,l:3,gs:1,ga:4,pts:0}]},
  {id:"E",teams:[{name:"Germany",abbr:"GER",flag:"🇩🇪",p:3,w:2,d:1,l:0,gs:7,ga:3,pts:7},{name:"Spain",abbr:"ESP",flag:"🇪🇸",p:3,w:1,d:1,l:1,gs:5,ga:4,pts:4},{name:"Uruguay",abbr:"URU",flag:"🇺🇾",p:3,w:1,d:0,l:2,gs:4,ga:6,pts:3},{name:"Tunisia",abbr:"TUN",flag:"🇹🇳",p:3,w:0,d:0,l:3,gs:1,ga:4,pts:0}]},
  {id:"F",teams:[{name:"Colombia",abbr:"COL",flag:"🇨🇴",p:3,w:1,d:2,l:0,gs:5,ga:4,pts:5},{name:"Portugal",abbr:"POR",flag:"🇵🇹",p:3,w:1,d:2,l:0,gs:5,ga:4,pts:5},{name:"Ivory C.",abbr:"CIV",flag:"🇨🇮",p:3,w:0,d:2,l:1,gs:3,ga:4,pts:2},{name:"S.Arabia",abbr:"KSA",flag:"🇸🇦",p:3,w:0,d:0,l:3,gs:1,ga:7,pts:0}]},
  {id:"G",teams:[{name:"Belgium",abbr:"BEL",flag:"🇧🇪",p:3,w:2,d:0,l:1,gs:6,ga:4,pts:6},{name:"Iran",abbr:"IRN",flag:"🇮🇷",p:3,w:1,d:2,l:0,gs:3,ga:2,pts:5},{name:"Egypt",abbr:"EGY",flag:"🇪🇬",p:3,w:1,d:1,l:1,gs:3,ga:3,pts:4},{name:"NZealand",abbr:"NZL",flag:"🇳🇿",p:3,w:0,d:1,l:2,gs:2,ga:5,pts:1}]},
  {id:"H",teams:[{name:"France",abbr:"FRA",flag:"🇫🇷",p:3,w:3,d:0,l:0,gs:8,ga:1,pts:9},{name:"Austria",abbr:"AUT",flag:"🇦🇹",p:3,w:1,d:1,l:1,gs:3,ga:3,pts:4},{name:"Senegal",abbr:"SEN",flag:"🇸🇳",p:3,w:1,d:0,l:2,gs:3,ga:5,pts:3},{name:"Qatar",abbr:"QAT",flag:"🇶🇦",p:3,w:0,d:1,l:2,gs:1,ga:6,pts:1}]},
  {id:"I",teams:[{name:"Argentina",abbr:"ARG",flag:"🇦🇷",p:3,w:3,d:0,l:0,gs:8,ga:2,pts:9},{name:"Peru",abbr:"PER",flag:"🇵🇪",p:3,w:1,d:1,l:1,gs:4,ga:4,pts:4},{name:"Nigeria",abbr:"NGA",flag:"🇳🇬",p:3,w:0,d:2,l:1,gs:2,ga:4,pts:2},{name:"Israel",abbr:"ISR",flag:"🇮🇱",p:3,w:0,d:1,l:2,gs:2,ga:6,pts:1}]},
  {id:"J",teams:[{name:"England",abbr:"ENG",flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",p:3,w:2,d:1,l:0,gs:6,ga:2,pts:7},{name:"Denmark",abbr:"DEN",flag:"🇩🇰",p:3,w:1,d:1,l:1,gs:4,ga:3,pts:4},{name:"Serbia",abbr:"SRB",flag:"🇷🇸",p:3,w:1,d:0,l:2,gs:3,ga:5,pts:3},{name:"Panama",abbr:"PAN",flag:"🇵🇦",p:3,w:0,d:0,l:3,gs:1,ga:4,pts:0}]},
  {id:"K",teams:[{name:"Portugal",abbr:"POR",flag:"🇵🇹",p:3,w:2,d:1,l:0,gs:7,ga:2,pts:7},{name:"Uzbekistan",abbr:"UZB",flag:"🇺🇿",p:3,w:1,d:1,l:1,gs:3,ga:3,pts:4},{name:"Chile",abbr:"CHI",flag:"🇨🇱",p:3,w:1,d:0,l:2,gs:3,ga:5,pts:3},{name:"Ghana",abbr:"GHA",flag:"🇬🇭",p:3,w:0,d:0,l:3,gs:1,ga:4,pts:0}]},
  {id:"L",teams:[{name:"Croatia",abbr:"CRO",flag:"🇭🇷",p:3,w:2,d:1,l:0,gs:6,ga:2,pts:7},{name:"Belarus",abbr:"BLR",flag:"🇧🇾",p:3,w:1,d:1,l:1,gs:3,ga:3,pts:4},{name:"Algeria",abbr:"ALG",flag:"🇩🇿",p:3,w:1,d:0,l:2,gs:3,ga:5,pts:3},{name:"China",abbr:"CHN",flag:"🇨🇳",p:3,w:0,d:0,l:3,gs:0,ga:1,pts:0}]},
];

const LR32:BM[]=[
  {h:"MEX",hf:"🇲🇽",hs:"2",a:"MAR",af:"🇲🇦",as:"1",st:"FT",venue:"MetLife"},
  {h:"COL",hf:"🇨🇴",hs:"3",a:"ESP",af:"🇪🇸",as:"2",st:"FT",venue:"AT&T"},
  {h:"CAN",hf:"🇨🇦",hs:"1",a:"RSA",af:"🇿🇦",as:"0",st:"FT",venue:"SoFi"},
  {h:"NED",hf:"🇳🇱",hs:"2",a:"PER",af:"🇵🇪",as:"0",st:"FT",venue:"Rose Bowl"},
  {h:"GER",hf:"🇩🇪",hs:"2",a:"AUT",af:"🇦🇹",as:"1",st:"FT",venue:"Allegiant"},
  {h:"FRA",hf:"🇫🇷",hs:"3",a:"IRN",af:"🇮🇷",as:"1",st:"FT",venue:"Seattle"},
  {h:"BRA",hf:"🇧🇷",hs:"4",a:"JPN",af:"🇯🇵",as:"1",st:"FT",venue:"KC"},
  {h:"USA",hf:"🇺🇸",hs:"2",a:"BLR",af:"🇧🇾",as:"0",st:"FT",venue:"Dallas"},
];
const LR16:BM[]=[
  {h:"MEX",hf:"🇲🇽",hs:"1",a:"COL",af:"🇨🇴",as:"2",st:"FT",venue:"MetLife"},
  {h:"CAN",hf:"🇨🇦",hs:"1(4)",a:"NED",af:"🇳🇱",as:"1(2)",st:"PEN",venue:"SoFi"},
  {h:"GER",hf:"🇩🇪",hs:"2",a:"FRA",af:"🇫🇷",as:"3",st:"FT",venue:"AT&T"},
  {h:"BRA",hf:"🇧🇷",hs:"3",a:"USA",af:"🇺🇸",as:"1",st:"FT",venue:"Dallas"},
];
const LQF:BM[]=[
  {h:"COL",hf:"🇨🇴",hs:"1",a:"NED",af:"🇳🇱",as:"2",st:"FT",venue:"MetLife"},
  {h:"FRA",hf:"🇫🇷",hs:"2",a:"BRA",af:"🇧🇷",as:"3",st:"FT",venue:"SoFi"},
];
const LSF:BM[]=[{h:"NED",hf:"🇳🇱",hs:"0",a:"BRA",af:"🇧🇷",as:"2",st:"FT",venue:"MetLife"}];
const RR32:BM[]=[
  {h:"ENG",hf:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",hs:"2",a:"POR",af:"🇵🇹",as:"1",st:"FT",venue:"Miami"},
  {h:"ARG",hf:"🇦🇷",hs:"2",a:"DEN",af:"🇩🇰",as:"0",st:"FT",venue:"Philly"},
  {h:"BEL",hf:"🇧🇪",hs:"1",a:"SRB",af:"🇷🇸",as:"0",st:"FT",venue:"Boston"},
  {h:"ITA",hf:"🇮🇹",hs:"2",a:"UZB",af:"🇺🇿",as:"1",st:"FT",venue:"Toronto"},
  {h:"CRO",hf:"🇭🇷",hs:"1",a:"ITA",af:"🇮🇹",as:"0",st:"FT",venue:"Vancouver"},
  {h:"URU",hf:"🇺🇾",hs:"0",a:"POR",af:"🇵🇹",as:"1",st:"FT",venue:"Guadalajara"},
  {h:"POR",hf:"🇵🇹",hs:"3",a:"KOR",af:"🇰🇷",as:"1",st:"FT",venue:"Monterrey"},
  {h:"EGY",hf:"🇪🇬",hs:"1",a:"SEN",af:"🇸🇳",as:"3",st:"FT",venue:"Houston"},
];
const RR16:BM[]=[
  {h:"ENG",hf:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",hs:"1",a:"ARG",af:"🇦🇷",as:"2",st:"FT",venue:"Miami"},
  {h:"BEL",hf:"🇧🇪",hs:"0",a:"ITA",af:"🇮🇹",as:"2",st:"FT",venue:"Boston"},
  {h:"POR",hf:"🇵🇹",hs:"2",a:"CRO",af:"🇭🇷",as:"1",st:"FT",venue:"Toronto"},
  {h:"SEN",hf:"🇸🇳",hs:"1(3)",a:"POR",af:"🇵🇹",as:"1(1)",st:"PEN",venue:"Vancouver"},
];
const RQF:BM[]=[
  {h:"ARG",hf:"🇦🇷",hs:"3",a:"ITA",af:"🇮🇹",as:"1",st:"FT",venue:"AT&T"},
  {h:"POR",hf:"🇵🇹",hs:"2",a:"URU",af:"🇺🇾",as:"0",st:"FT",venue:"Dallas"},
];
const RSF:BM[]=[{h:"ARG",hf:"🇦🇷",hs:"2",a:"POR",af:"🇵🇹",as:"1",st:"FT",venue:"AT&T"}];

const LIVE_MATCHES:LM[] = [
  {id:1,status:"LIVE",minute:78,hTeam:"Brazil",hFlag:"🇧🇷",aTeam:"Argentina",aFlag:"🇦🇷",hScore:2,aScore:1,venue:"MetLife Stadium, NJ",scorers:["Vini Jr. 27'","Raphinha 72'","M. Alvarez 45+1'"]},
  {id:2,status:"HT",minute:45,hTeam:"France",hFlag:"🇫🇷",aTeam:"England",aFlag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",hScore:1,aScore:1,venue:"AT&T Stadium, TX",scorers:["Mbappe 22'","Bellingham 38'"]},
  {id:3,status:"LIVE",minute:34,hTeam:"Germany",hFlag:"🇩🇪",aTeam:"Spain",aFlag:"🇪🇸",hScore:1,aScore:0,venue:"SoFi Stadium, LA",scorers:["Havertz 29'"]},
  {id:4,status:"TODAY",minute:null,hTeam:"USA",hFlag:"🇺🇸",aTeam:"Netherlands",aFlag:"🇳🇱",hScore:null,aScore:null,venue:"Rose Bowl, LA",scorers:[]},
];

const SCORERS = [
  {name:"K. Mbappe",flag:"🇫🇷",nation:"France",goals:7,assists:3},
  {name:"L. Messi",flag:"🇦🇷",nation:"Argentina",goals:6,assists:5},
  {name:"Vini Jr.",flag:"🇧🇷",nation:"Brazil",goals:6,assists:4},
  {name:"H. Kane",flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",nation:"England",goals:5,assists:2},
  {name:"M. Alvarez",flag:"🇦🇷",nation:"Argentina",goals:5,assists:1},
];

/* ─── BRACKET CARD ───────────────────────────────────────────────────────── */
function BC({ m, gold }: { m:BM; gold?:boolean }) {
  const hs = parseInt(m.hs), as_ = parseInt(m.as);
  const hw = hs > as_, aw = as_ > hs;
  const acc = gold ? "#ffd54a" : "#22d3ee";
  const bdr = gold ? "rgba(255,213,74,.4)" : "rgba(34,211,238,.22)";
  return (
    <div style={{height:"44px",background:"rgba(2,8,20,.85)",border:"1px solid "+bdr,borderRadius:"7px",padding:"3px 7px",display:"flex",flexDirection:"column",justifyContent:"space-around",marginBottom:"4px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:"9px",color:hw?"#e2e8f0":"rgba(255,255,255,.38)",fontWeight:hw?"bold":"normal"}}>
        <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{m.hf} {m.h}</span>
        <span style={{color:hw?acc:"rgba(255,255,255,.25)",flexShrink:0,minWidth:"16px",textAlign:"right"}}>{m.hs}</span>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:"9px",color:aw?"#e2e8f0":"rgba(255,255,255,.38)",fontWeight:aw?"bold":"normal"}}>
        <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{m.af} {m.a}</span>
        <span style={{color:aw?acc:"rgba(255,255,255,.25)",flexShrink:0,minWidth:"16px",textAlign:"right"}}>{m.as}</span>
      </div>
      <div style={{fontSize:"7px",color:"#1e3a5f",textAlign:"right"}}>{m.st}</div>
    </div>
  );
}

/* Each round column: fixed 416px, items distributed with space-around */
function RCol({ matches, gold }: { matches:BM[]; gold?:boolean }) {
  return (
    <div style={{height:"416px",display:"flex",flexDirection:"column",justifyContent:"space-around"}}>
      {matches.map((m,i) => <BC key={i} m={m} gold={gold} />)}
    </div>
  );
}

/* ─── GROUP TABLE ─────────────────────────────────────────────────────────── */
function GroupCard({ g, onTeamClick }: { g:Group; onTeamClick:(t:Team)=>void }) {
  return (
    <div style={{background:"linear-gradient(150deg,rgba(5,18,38,.96),rgba(2,10,22,.98))",border:"1px solid rgba(34,211,238,.16)",borderRadius:"11px",padding:"8px 9px",marginBottom:"7px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px",paddingBottom:"5px",borderBottom:"1px solid rgba(34,211,238,.1)"}}>
        <span style={{color:"#38dfff",fontWeight:"bold",fontSize:"10px",letterSpacing:"3px"}}>GROUP {g.id}</span>
        <div style={{display:"flex",gap:"3px",color:"#1e3a5f",fontSize:"8px"}}>
          {["P","W","D","L","GD","PTS"].map(h => <span key={h} style={{width:h==="GD"||h==="PTS"?"22px":"16px",textAlign:"center"}}>{h}</span>)}
        </div>
      </div>
      {g.teams.map((t,i) => {
        const gd = t.gs - t.ga;
        return (
          <div key={t.abbr} onClick={() => onTeamClick(t)} style={{display:"flex",alignItems:"center",gap:"2px",padding:"4px 0",borderTop:i===0?"none":"1px solid rgba(255,255,255,.05)",borderLeft:i<2?"2px solid rgba(34,211,238,.5)":"2px solid transparent",paddingLeft:i<2?"6px":"8px",marginLeft:"-2px",cursor:"pointer"}}>
            <span style={{flex:1,display:"flex",alignItems:"center",gap:"4px",overflow:"hidden"}}>
              <span style={{fontSize:"11px"}}>{t.flag}</span>
              <span style={{fontSize:"9px",fontWeight:i<2?"bold":"normal",color:i<2?"#e2e8f0":"#94a3b8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.abbr}</span>
            </span>
            {[t.p,t.w,t.d,t.l].map((v,j) => <span key={j} style={{width:"16px",textAlign:"center",fontSize:"8px",color:"#64748b"}}>{v}</span>)}
            <span style={{width:"22px",textAlign:"center",fontSize:"8px",color:gd>0?"#4ade80":gd<0?"#f87171":"#64748b"}}>{gd>0?"+":""}{gd}</span>
            <span style={{width:"22px",textAlign:"center",fontSize:"8px",fontWeight:"bold",color:i<2?"#22d3ee":"#e2e8f0"}}>{t.pts}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── LIVE CARD ───────────────────────────────────────────────────────────── */
function LiveCard({ m }: { m:LM }) {
  const live = m.status === "LIVE";
  const ht   = m.status === "HT";
  return (
    <div style={{background:"linear-gradient(150deg,rgba(5,18,38,.96),rgba(2,10,22,.98))",border:"1px solid "+(live?"rgba(239,68,68,.4)":ht?"rgba(251,191,36,.3)":"rgba(34,211,238,.18)"),borderRadius:"14px",padding:"14px 16px",marginBottom:"10px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
        <span style={{background:live?"#ef4444":ht?"#f59e0b":"#1d4ed8",color:"#fff",fontWeight:"bold",fontSize:"9px",padding:"3px 9px",borderRadius:"4px",letterSpacing:"1px"}}>
          {live ? "LIVE "+m.minute+"'" : ht ? "HALF TIME" : m.status === "TODAY" ? "TODAY" : "FT"}
        </span>
        <span style={{fontSize:"8px",color:"#334155"}}>{m.venue}</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",gap:"10px"}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:"30px"}}>{m.hFlag}</div>
          <div style={{fontWeight:"bold",fontSize:"11px",marginTop:"3px"}}>{m.hTeam}</div>
        </div>
        <div style={{textAlign:"center",fontSize:"26px",fontWeight:"bold",color:"#fff",letterSpacing:"2px"}}>
          {m.hScore !== null ? m.hScore+" — "+m.aScore : "VS"}
        </div>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:"30px"}}>{m.aFlag}</div>
          <div style={{fontWeight:"bold",fontSize:"11px",marginTop:"3px"}}>{m.aTeam}</div>
        </div>
      </div>
      {m.scorers.length > 0 && (
        <div style={{marginTop:"8px",display:"flex",flexWrap:"wrap",gap:"8px"}}>
          {m.scorers.map((s,i) => <span key={i} style={{fontSize:"8px",color:"#475569"}}>⚽ {s}</span>)}
        </div>
      )}
    </div>
  );
}

/* ─── TEAM POPUP ──────────────────────────────────────────────────────────── */
function TeamPopup({ t, onClose }: { t:Team; onClose:()=>void }) {
  const gd = t.gs - t.ga;
  return (
    <div onClick={onClose} style={{position:"fixed",inset:"0",background:"rgba(0,0,0,.75)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div onClick={(e)=>e.stopPropagation()} style={{background:"linear-gradient(150deg,#07182e,#040e1e)",border:"1px solid rgba(34,211,238,.35)",borderRadius:"20px",padding:"28px",width:"340px",maxWidth:"92vw"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"18px"}}>
          <div>
            <div style={{fontSize:"44px",marginBottom:"6px"}}>{t.flag}</div>
            <div style={{fontWeight:"bold",fontSize:"20px"}}>{t.name}</div>
            <div style={{color:"#22d3ee",fontSize:"11px",letterSpacing:"2px",marginTop:"2px"}}>{t.abbr}</div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",color:"#fff",borderRadius:"8px",padding:"6px 11px",cursor:"pointer",fontSize:"14px"}}>✕</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px",marginBottom:"16px"}}>
          {[["P",t.p],["W",t.w],["D",t.d],["L",t.l],["GF",t.gs],["GA",t.ga]].map(([l,v]) => (
            <div key={String(l)} style={{background:"rgba(34,211,238,.06)",border:"1px solid rgba(34,211,238,.13)",borderRadius:"10px",padding:"10px 0",textAlign:"center"}}>
              <div style={{fontSize:"20px",fontWeight:"bold",color:"#22d3ee"}}>{String(v)}</div>
              <div style={{fontSize:"9px",color:"#475569",letterSpacing:"1px",marginTop:"2px"}}>{String(l)}</div>
            </div>
          ))}
        </div>
        <div style={{background:"linear-gradient(135deg,rgba(34,211,238,.1),rgba(14,165,233,.05))",border:"1px solid rgba(34,211,238,.2)",borderRadius:"12px",padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:"10px",color:"#64748b",letterSpacing:"1px"}}>GOAL DIFF</div>
            <div style={{fontSize:"16px",fontWeight:"bold",color:gd>0?"#4ade80":gd<0?"#f87171":"#fff",marginTop:"2px"}}>{gd>0?"+":""}{gd}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:"10px",color:"#64748b",letterSpacing:"1px"}}>POINTS</div>
            <div style={{fontSize:"28px",fontWeight:"bold",color:"#22d3ee"}}>{t.pts}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── CONNECTOR SVG ───────────────────────────────────────────────────────── */
function ConnectorSVG() {
  return (
    <svg style={{position:"absolute",top:"0",left:"0",width:"100%",height:"100%",pointerEvents:"none",zIndex:5}} viewBox="0 0 986 416" preserveAspectRatio="none">
      <g fill="none" stroke="rgba(34,211,238,.6)" strokeWidth="1.5">
        <path d="M115,26 H118 V52 H121"/><path d="M115,78 H118 V52"/>
        <path d="M115,130 H118 V156 H121"/><path d="M115,182 H118 V156"/>
        <path d="M115,234 H118 V260 H121"/><path d="M115,286 H118 V260"/>
        <path d="M115,338 H118 V364 H121"/><path d="M115,390 H118 V364"/>
      </g>
      <g fill="none" stroke="rgba(34,211,238,.75)" strokeWidth="1.8">
        <path d="M221,52 H224 V104 H227"/><path d="M221,156 H224 V104"/>
        <path d="M221,260 H224 V312 H227"/><path d="M221,364 H224 V312"/>
      </g>
      <g fill="none" stroke="rgba(34,211,238,.9)" strokeWidth="2.2">
        <path d="M315,104 H318 V208 H321"/><path d="M315,312 H318 V208"/>
      </g>
      <path fill="none" stroke="rgba(255,213,74,.9)" strokeWidth="2.5" d="M397,208 H403"/>
      <g fill="none" stroke="rgba(34,211,238,.6)" strokeWidth="1.5">
        <path d="M871,26 H868 V52 H865"/><path d="M871,78 H868 V52"/>
        <path d="M871,130 H868 V156 H865"/><path d="M871,182 H868 V156"/>
        <path d="M871,234 H868 V260 H865"/><path d="M871,286 H868 V260"/>
        <path d="M871,338 H868 V364 H865"/><path d="M871,390 H868 V364"/>
      </g>
      <g fill="none" stroke="rgba(34,211,238,.75)" strokeWidth="1.8">
        <path d="M765,52 H762 V104 H759"/><path d="M765,156 H762 V104"/>
        <path d="M765,260 H762 V312 H759"/><path d="M765,364 H762 V312"/>
      </g>
      <g fill="none" stroke="rgba(34,211,238,.9)" strokeWidth="2.2">
        <path d="M671,104 H668 V208 H665"/><path d="M671,312 H668 V208"/>
      </g>
      <path fill="none" stroke="rgba(255,213,74,.9)" strokeWidth="2.5" d="M589,208 H583"/>
    </svg>
  );
}

/* ─── MAIN PAGE ───────────────────────────────────────────────────────────── */
export default function Home() {
  const [clock,    setClock]    = useState("--:--:--");
  const [tab,      setTab]      = useState("bracket");
  const [matches,  setMatches]  = useState<LM[]>(LIVE_MATCHES);
  const [popup,    setPopup]    = useState<Team|null>(null);
  const [lastSync, setLastSync] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString("en-US", {hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}));
      setLastSync(now.toLocaleTimeString("en-US", {hour:"2-digit",minute:"2-digit",hour12:true}));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch("/api/live-scores");
        const d = await r.json();
        setMatches(d.matches);
      } catch (_) { /* keep default */ }
    };
    load();
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
  }, []);

  const liveCount = matches.filter(m => m.status === "LIVE").length;
  const liveMain  = matches.find(m => m.status === "LIVE") || matches[0];
  const panelTitle = {color:"#67e8f9",fontWeight:"bold",fontSize:"10px",letterSpacing:"2px",marginBottom:"8px",textTransform:"uppercase" as const};
  const panel = {background:"linear-gradient(150deg,rgba(5,18,38,.96),rgba(2,10,22,.98))",border:"1px solid rgba(34,211,238,.18)",borderRadius:"14px",padding:"12px 14px"};

  return (
    <div style={{minHeight:"100vh",background:"radial-gradient(ellipse at 40% 0%,#0c2340,#051425 30%,#020c1a 60%,#010508)",color:"#fff",fontFamily:"Arial,sans-serif",overflowX:"hidden"}}>

      {popup && <TeamPopup t={popup} onClose={() => setPopup(null)} />}

      {/* HEADER */}
      <header style={{position:"sticky",top:"0",zIndex:90,background:"rgba(1,4,12,.9)",borderBottom:"1px solid rgba(34,211,238,.14)"}}>
        {/* Top bar */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 18px",borderBottom:"1px solid rgba(34,211,238,.06)",fontSize:"9px"}}>
          <div style={{display:"flex",gap:"14px",alignItems:"center"}}>
            {liveCount > 0 && (
              <span style={{display:"flex",alignItems:"center",gap:"5px",background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.3)",borderRadius:"4px",padding:"2px 8px",fontWeight:"bold",letterSpacing:"1px",color:"#ef4444"}}>
                ● {liveCount} LIVE
              </span>
            )}
            <span style={{color:"#334155"}}>Updated: {lastSync}</span>
          </div>
          <div style={{display:"flex",gap:"16px",color:"#1e3a5f"}}>
            <span>🌐 Auto-timezone</span>
            <span>🌍 EN | ES | FR | PT</span>
            <span>📡 Live Sync</span>
          </div>
        </div>
        {/* Main row */}
        <div style={{display:"grid",gridTemplateColumns:"auto 1fr auto",alignItems:"center",gap:"16px",padding:"10px 18px"}}>
          {/* Logo */}
          <div style={{display:"flex",gap:"10px",alignItems:"center"}}>
            <div style={{background:"linear-gradient(135deg,#1d4ed8,#1e3a8a)",border:"1px solid rgba(34,211,238,.4)",borderRadius:"10px",padding:"8px 12px",textAlign:"center",lineHeight:"1.3"}}>
              <div style={{fontWeight:"bold",fontSize:"14px",letterSpacing:"2px"}}>FIFA</div>
              <div style={{fontSize:"8px",color:"#ffd54a",letterSpacing:"1px"}}>WORLD CUP</div>
              <div style={{fontSize:"11px",fontWeight:"bold",color:"#38dfff"}}>2026</div>
            </div>
            <div>
              <div style={{fontSize:"9px",color:"#38dfff",letterSpacing:"3px",fontWeight:"bold"}}>OFFICIAL</div>
              <div style={{fontSize:"9px",color:"#1e3a5f"}}>TOURNAMENT DASHBOARD</div>
            </div>
          </div>
          {/* Title */}
          <div style={{textAlign:"center"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"10px"}}>
              <span style={{fontSize:"44px",fontWeight:"bold",color:"#ffd54a"}}>20</span>
              <div>
                <div style={{fontSize:"22px",fontWeight:"bold",letterSpacing:"5px",color:"#fff"}}>FIFA WORLD CUP</div>
                <div style={{fontSize:"10px",color:"#38dfff",letterSpacing:"6px",marginTop:"2px"}}>UNITED STATES · <span style={{color:"#f87171"}}>CANADA</span> · MEXICO</div>
              </div>
              <span style={{fontSize:"44px",fontWeight:"bold",color:"#ffd54a"}}>26</span>
            </div>
          </div>
          {/* Clock + CTA */}
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:"8px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px",background:"rgba(0,0,0,.5)",border:"1px solid rgba(34,211,238,.18)",borderRadius:"8px",padding:"6px 13px"}}>
              <span style={{width:"6px",height:"6px",borderRadius:"50%",background:"#22c55e",display:"inline-block"}} />
              <span style={{fontWeight:"bold",fontSize:"14px",letterSpacing:"1px"}}>{clock}</span>
              <span style={{color:"#1e3a5f",fontSize:"9px"}}>LOCAL</span>
            </div>
            <a href="https://buy.stripe.com/test_eVq5kw6FVfCk9cL97K6oo00" target="_blank" rel="noopener noreferrer" style={{display:"inline-block",background:"linear-gradient(135deg,#22d3ee,#0ea5e9)",color:"#000",fontWeight:"bold",fontSize:"13px",padding:"9px 20px",borderRadius:"24px",textDecoration:"none",whiteSpace:"nowrap"}}>
              Get Access — £4.99
            </a>
          </div>
        </div>
        {/* Tabs */}
        <div style={{display:"flex",borderTop:"1px solid rgba(34,211,238,.07)"}}>
          {["bracket","groups","live","stats"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{padding:"10px 22px",background:"transparent",border:"none",color:tab===t?"#22d3ee":"#334155",fontWeight:tab===t?"bold":"normal",fontSize:"11px",letterSpacing:"2px",borderBottom:tab===t?"2px solid #22d3ee":"2px solid transparent",textTransform:"uppercase",cursor:"pointer"}}>
              {t==="bracket"?"🏟 Bracket":t==="groups"?"📊 Groups":t==="live"?"⚽ Live":"📈 Stats"}
            </button>
          ))}
        </div>
      </header>

      {/* BRACKET TAB */}
      {tab === "bracket" && (
        <div style={{display:"grid",gridTemplateColumns:"200px minmax(0,1fr) 200px",gap:"10px",padding:"10px"}}>
          {/* Left groups */}
          <aside>
            <div style={{color:"#38dfff",fontSize:"9px",letterSpacing:"4px",textAlign:"center",marginBottom:"8px",fontWeight:"bold"}}>GROUP STAGE · A–F</div>
            {GROUPS.slice(0,6).map(g => <GroupCard key={g.id} g={g} onTeamClick={setPopup} />)}
          </aside>

          {/* Centre */}
          <section>
            <div style={{color:"#38dfff",fontSize:"9px",letterSpacing:"4px",textAlign:"center",marginBottom:"8px",fontWeight:"bold"}}>KNOCKOUT STAGE</div>
            <div style={{border:"1px solid rgba(34,211,238,.16)",borderRadius:"14px",padding:"10px 8px",background:"linear-gradient(180deg,rgba(3,10,22,.96),rgba(1,5,12,.98))"}}>
              {/* Round labels */}
              <div style={{display:"grid",gridTemplateColumns:"115px 100px 88px 76px 180px 76px 88px 100px 115px",gap:"6px",color:"#1e3a5f",fontSize:"8px",letterSpacing:"1px",marginBottom:"8px",textAlign:"center",textTransform:"uppercase"}}>
                <span>Round of 32</span><span>Round of 16</span><span>Quarters</span><span>Semis</span>
                <span style={{color:"rgba(255,213,74,.6)",fontWeight:"bold"}}>Final</span>
                <span>Semis</span><span>Quarters</span><span>Round of 16</span><span>Round of 32</span>
              </div>
              {/* Bracket with SVG overlay */}
              <div style={{position:"relative",width:"986px",minWidth:"986px"}}>
                <ConnectorSVG />
                <div style={{display:"grid",gridTemplateColumns:"115px 100px 88px 76px 180px 76px 88px 100px 115px",gap:"6px"}}>
                  <RCol matches={LR32} />
                  <RCol matches={LR16} />
                  <RCol matches={LQF} />
                  <RCol matches={LSF} />
                  {/* FINAL */}
                  <div style={{height:"416px",border:"1px solid rgba(255,213,74,.5)",borderRadius:"14px",background:"radial-gradient(ellipse at 50% 25%,rgba(255,213,74,.15),rgba(0,0,0,.7))",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"14px 12px",position:"relative",zIndex:3}}>
                    <div style={{fontSize:"40px",lineHeight:"1"}}>🏆</div>
                    <div style={{color:"#ffd54a",fontWeight:"bold",fontSize:"13px",letterSpacing:"3px",marginTop:"8px"}}>FINAL</div>
                    <div style={{color:"#475569",fontSize:"8px",marginTop:"2px"}}>JULY 19, 2026</div>
                    <div style={{color:"#334155",fontSize:"7px"}}>METLIFE STADIUM</div>
                    <div style={{marginTop:"12px",width:"100%",background:"rgba(0,0,0,.4)",borderRadius:"10px",padding:"10px 8px",border:"1px solid rgba(255,213,74,.2)"}}>
                      <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",gap:"4px"}}>
                        <div style={{textAlign:"center"}}><div style={{fontSize:"20px"}}>🇧🇷</div><div style={{fontWeight:"bold",fontSize:"9px",marginTop:"2px"}}>BRAZIL</div></div>
                        <div style={{fontSize:"20px",fontWeight:"bold",color:"#ffd54a"}}>2—1</div>
                        <div style={{textAlign:"center"}}><div style={{fontSize:"20px"}}>🇦🇷</div><div style={{fontWeight:"bold",fontSize:"9px",marginTop:"2px"}}>ARGENTINA</div></div>
                      </div>
                      <div style={{marginTop:"8px",fontSize:"8px",color:"#475569",lineHeight:"1.8"}}>
                        <div>⚽ Vini Jr. 27' · Raphinha 72'</div>
                        <div>⚽ M. Alvarez 45+1'</div>
                      </div>
                    </div>
                    <div style={{fontSize:"8px",color:"#334155",borderTop:"1px solid rgba(255,213,74,.1)",paddingTop:"6px",width:"100%",marginTop:"6px"}}>3RD · 🇵🇹 POR 2–1 URU 🇺🇾</div>
                    <div style={{color:"#22d3ee",fontSize:"8px",fontWeight:"bold",letterSpacing:"2px",marginTop:"4px"}}>🇧🇷 CHAMPIONS</div>
                  </div>
                  <RCol matches={RSF} />
                  <RCol matches={RQF} />
                  <RCol matches={RR16} />
                  <RCol matches={RR32} />
                </div>
              </div>
            </div>

            {/* Legend */}
            <div style={{display:"flex",gap:"12px",flexWrap:"wrap",padding:"6px 0",borderTop:"1px solid rgba(34,211,238,.08)",marginTop:"8px"}}>
              {[{c:"#ef4444",l:"Live Match"},{c:"#f59e0b",l:"Half Time"},{c:"#6b7280",l:"Full Time"},{c:"#22d3ee",l:"Extra Time"},{c:"#a78bfa",l:"Penalties"},{c:"#fbbf24",l:"Yellow Card"},{c:"#f87171",l:"Red Card"},{c:"#4ade80",l:"Goal"}].map(it => (
                <span key={it.l} style={{display:"flex",alignItems:"center",gap:"4px",fontSize:"9px",color:"#475569"}}>
                  <span style={{width:"7px",height:"7px",borderRadius:"50%",background:it.c,display:"inline-block"}} />{it.l}
                </span>
              ))}
            </div>

            {/* Bottom panels */}
            <div style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 0.85fr 1fr",gap:"8px",marginTop:"10px"}}>
              {/* Live Match */}
              <div style={panel}>
                <div style={panelTitle}>⚽ Live Match Center</div>
                {liveMain && (
                  <>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:"8px"}}>
                      <span style={{background:"#ef4444",color:"#fff",fontWeight:"bold",fontSize:"9px",padding:"3px 8px",borderRadius:"4px"}}>
                        {liveMain.status === "HT" ? "HALF TIME" : liveMain.status === "LIVE" ? "LIVE "+liveMain.minute+"'" : liveMain.status}
                      </span>
                      <span style={{fontSize:"8px",color:"#334155"}}>{liveMain.venue}</span>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",gap:"8px"}}>
                      <div style={{textAlign:"center"}}><div style={{fontSize:"28px"}}>{liveMain.hFlag}</div><div style={{fontWeight:"bold",fontSize:"10px",marginTop:"3px"}}>{liveMain.hTeam}</div></div>
                      <div style={{textAlign:"center",fontSize:"24px",fontWeight:"bold",color:"#fff"}}>{liveMain.hScore !== null ? liveMain.hScore+"–"+liveMain.aScore : "VS"}</div>
                      <div style={{textAlign:"center"}}><div style={{fontSize:"28px"}}>{liveMain.aFlag}</div><div style={{fontWeight:"bold",fontSize:"10px",marginTop:"3px"}}>{liveMain.aTeam}</div></div>
                    </div>
                    {liveMain.scorers.length > 0 && <div style={{marginTop:"8px",display:"flex",flexWrap:"wrap",gap:"6px"}}>{liveMain.scorers.map((s,i) => <span key={i} style={{fontSize:"8px",color:"#475569"}}>⚽ {s}</span>)}</div>}
                    <div style={{marginTop:"10px",display:"grid",gridTemplateColumns:"auto 1fr auto",alignItems:"center",gap:"6px"}}>
                      <span style={{fontSize:"9px",color:"#64748b"}}>56%</span>
                      <div style={{height:"4px",background:"rgba(255,255,255,.07)",borderRadius:"2px",overflow:"hidden"}}>
                        <div style={{height:"100%",width:"56%",background:"rgba(34,211,238,.7)",borderRadius:"2px"}} />
                      </div>
                      <span style={{fontSize:"9px",color:"#64748b"}}>44%</span>
                    </div>
                    <div style={{fontSize:"8px",color:"#1e3a5f",textAlign:"center",marginTop:"2px",letterSpacing:"1px"}}>POSSESSION</div>
                  </>
                )}
              </div>
              {/* Top Scorers */}
              <div style={panel}>
                <div style={panelTitle}>👟 Top Scorers</div>
                {SCORERS.map((s,i) => (
                  <div key={s.name} style={{display:"flex",alignItems:"center",gap:"5px",padding:"5px 0",borderTop:i===0?"none":"1px solid rgba(255,255,255,.05)",fontSize:"9px"}}>
                    <span style={{color:"#1e3a5f",minWidth:"14px",fontWeight:"bold"}}>{i+1}</span>
                    <span style={{fontSize:"11px"}}>{s.flag}</span>
                    <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</span>
                    <span style={{color:"#ffd54a",fontWeight:"bold"}}>{s.goals}</span>
                    <span>⚽</span>
                  </div>
                ))}
                <button style={{marginTop:"8px",width:"100%",background:"rgba(34,211,238,.07)",border:"1px solid rgba(34,211,238,.2)",color:"#22d3ee",borderRadius:"6px",padding:"5px",fontSize:"9px",fontWeight:"bold",cursor:"pointer",letterSpacing:"1px"}}>VIEW ALL</button>
              </div>
              {/* Stats */}
              <div style={panel}>
                <div style={panelTitle}>📊 Tournament Stats</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"7px",marginTop:"4px"}}>
                  {[["48","MATCHES","#22d3ee"],["128","GOALS","#ffd54a"],["2.67","AVG","#4ade80"],["312","YELLOWS","#fbbf24"],["14","REDS","#f87171"],["2.1M+","ATTEND","#a78bfa"]].map(([v,l,c]) => (
                    <div key={l} style={{background:"rgba(0,0,0,.4)",border:"1px solid rgba(255,255,255,.06)",borderRadius:"9px",padding:"8px 10px"}}>
                      <div style={{fontSize:"18px",fontWeight:"bold",color:c}}>{v}</div>
                      <div style={{fontSize:"8px",color:"#334155",letterSpacing:"1px",marginTop:"1px"}}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Features */}
              <div style={panel}>
                <div style={panelTitle}>✨ Features</div>
                {["🔴 Live Scores","📈 Team Stats","👤 Player Stats","📅 Fixtures","🏆 Standings","📰 News Feed"].map((f,i) => (
                  <div key={f} style={{padding:"4px 0",fontSize:"9px",color:"#64748b",borderTop:i===0?"none":"1px solid rgba(255,255,255,.04)"}}>{f}</div>
                ))}
              </div>
              {/* Mobile */}
              <div style={panel}>
                <div style={panelTitle}>📱 Mobile App</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px"}}>
                  {[{l:"Home",c:"🇧🇷 2–1 🇦🇷",s:"78' LIVE"},{l:"Bracket",c:"FINAL",s:"MetLife"},{l:"Groups",c:"A–L",s:"All 12"},{l:"Brazil",c:"🏆 #1",s:"Champions"}].map(ph => (
                    <div key={ph.l} style={{background:"rgba(0,0,0,.4)",border:"1px solid rgba(34,211,238,.15)",borderRadius:"10px",padding:"10px 8px",textAlign:"center"}}>
                      <div style={{fontSize:"8px",color:"#38dfff",fontWeight:"bold",letterSpacing:"1px",marginBottom:"4px"}}>{ph.l}</div>
                      <div style={{fontSize:"12px",fontWeight:"bold"}}>{ph.c}</div>
                      <div style={{fontSize:"8px",color:"#334155",marginTop:"2px"}}>{ph.s}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Right groups */}
          <aside>
            <div style={{color:"#38dfff",fontSize:"9px",letterSpacing:"4px",textAlign:"center",marginBottom:"8px",fontWeight:"bold"}}>GROUP STAGE · G–L</div>
            {GROUPS.slice(6,12).map(g => <GroupCard key={g.id} g={g} onTeamClick={setPopup} />)}
          </aside>
        </div>
      )}

      {/* GROUPS TAB */}
      {tab === "groups" && (
        <div style={{padding:"14px"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:"12px"}}>
            {GROUPS.map(g => <GroupCard key={g.id} g={g} onTeamClick={setPopup} />)}
          </div>
        </div>
      )}

      {/* LIVE TAB */}
      {tab === "live" && (
        <div style={{padding:"14px",maxWidth:"860px",margin:"0 auto"}}>
          {matches.map(m => <LiveCard key={m.id} m={m} />)}
        </div>
      )}

      {/* STATS TAB */}
      {tab === "stats" && (
        <div style={{padding:"14px",maxWidth:"900px",margin:"0 auto"}}>
          <div style={{display:"grid",gridTemplateColumns:"1.2fr 1fr",gap:"14px"}}>
            <div style={panel}>
              <div style={panelTitle}>👟 Top Scorers</div>
              {SCORERS.map((s,i) => (
                <div key={s.name} style={{display:"flex",alignItems:"center",gap:"10px",padding:"9px 0",borderTop:i===0?"none":"1px solid rgba(255,255,255,.06)"}}>
                  <span style={{color:"#1e3a5f",minWidth:"20px",fontWeight:"bold",fontSize:"14px"}}>{i+1}</span>
                  <span style={{fontSize:"22px"}}>{s.flag}</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:"bold",fontSize:"12px"}}>{s.name}</div>
                    <div style={{fontSize:"9px",color:"#475569"}}>{s.nation}</div>
                  </div>
                  <div style={{textAlign:"right"}}><div style={{fontSize:"20px",fontWeight:"bold",color:"#ffd54a"}}>{s.goals}</div><div style={{fontSize:"8px",color:"#334155"}}>GOALS</div></div>
                  <div style={{textAlign:"right",marginLeft:"10px"}}><div style={{fontSize:"16px",fontWeight:"bold",color:"#22d3ee"}}>{s.assists}</div><div style={{fontSize:"8px",color:"#334155"}}>AST</div></div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
              <div style={panel}>
                <div style={panelTitle}>📊 Tournament Overview</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px",marginTop:"8px"}}>
                  {[["48","PLAYED","#22d3ee"],["128","GOALS","#ffd54a"],["2.67","AVG/GAME","#4ade80"],["312","YELLOWS","#fbbf24"],["14","REDS","#f87171"],["2.1M+","ATTEND","#a78bfa"]].map(([v,l,c]) => (
                    <div key={l} style={{background:"rgba(0,0,0,.4)",border:"1px solid rgba(255,255,255,.07)",borderRadius:"12px",padding:"14px 12px",textAlign:"center"}}>
                      <div style={{fontSize:"22px",fontWeight:"bold",color:c}}>{v}</div>
                      <div style={{fontSize:"9px",color:"#334155",letterSpacing:"1px",marginTop:"4px"}}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{...panel,border:"1px solid rgba(255,213,74,.25)"}}>
                <div style={{...panelTitle,color:"#ffd54a"}}>🏆 Champions</div>
                <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:"14px",alignItems:"center"}}>
                  <div style={{fontSize:"50px"}}>🇧🇷</div>
                  <div>
                    <div style={{fontWeight:"bold",fontSize:"22px"}}>BRAZIL</div>
                    <div style={{color:"#ffd54a",fontSize:"11px",letterSpacing:"2px",marginTop:"3px"}}>FIFA WORLD CUP 2026</div>
                    <div style={{color:"#475569",fontSize:"10px",marginTop:"4px"}}>🏆 6th World Cup title</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={{marginTop:"12px",borderTop:"1px solid rgba(34,211,238,.1)",padding:"10px 18px",background:"rgba(0,0,0,.65)",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"12px"}}>
        <div style={{display:"flex",gap:"18px",alignItems:"center",flexWrap:"wrap"}}>
          <strong style={{color:"#38dfff",fontSize:"10px",letterSpacing:"2px"}}>DATA SOURCES</strong>
          {["FIFA API","Opta","Sportradar","API-Football"].map(s => <span key={s} style={{color:"#1e3a5f",fontSize:"10px"}}>{s}</span>)}
          <span style={{color:"#22c55e",fontWeight:"bold",fontSize:"10px"}}>● LIVE SYNC</span>
          <span style={{color:"#1e293b",fontSize:"9px"}}>Auto-updates every 20s</span>
        </div>
        <div style={{display:"flex",gap:"20px",alignItems:"center"}}>
          <div style={{fontSize:"9px",color:"#334155"}}>
            <div style={{letterSpacing:"1px",marginBottom:"2px",color:"#1e3a5f"}}>MULTI-LANGUAGE</div>
            <div style={{display:"flex",gap:"8px"}}>{["EN","ES","FR","PT"].map(l => <span key={l} style={{color:l==="EN"?"#22d3ee":"#334155"}}>{l}</span>)}</div>
          </div>
          <div style={{fontSize:"8px",color:"#0f172a"}}>© 2026 World Cup LiveBoard</div>
        </div>
      </footer>
    </div>
  );
}
