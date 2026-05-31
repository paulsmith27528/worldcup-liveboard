"use client";
import { useEffect, useState, useCallback, useRef } from "react";

/* ═══════════════════════════ CSS ANIMATIONS ═══════════════════════════════ */
const GLOBAL_CSS = `
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{background:#020810;color:#fff;font-family:'SF Pro Display','Arial',sans-serif;overflow-x:hidden}
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-track{background:rgba(0,0,0,.3)}
  ::-webkit-scrollbar-thumb{background:rgba(34,211,238,.3);border-radius:2px}

  @keyframes livePulse    {0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(239,68,68,.7)}  70%{box-shadow:0 0 0 10px rgba(239,68,68,0)}}
  @keyframes dotBlink     {0%,100%{opacity:1}  50%{opacity:.2}}
  @keyframes neonGlow     {0%,100%{box-shadow:0 0 20px rgba(34,211,238,.25),0 0 40px rgba(34,211,238,.1)} 50%{box-shadow:0 0 35px rgba(34,211,238,.5),0 0 60px rgba(34,211,238,.2)}}
  @keyframes goldGlow     {0%,100%{box-shadow:0 0 20px rgba(255,213,74,.2),0 0 40px rgba(255,213,74,.08)} 50%{box-shadow:0 0 40px rgba(255,213,74,.45),0 0 70px rgba(255,213,74,.2)}}
  @keyframes trophyFloat  {0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-8px) scale(1.04)}}
  @keyframes trophyGlow   {0%,100%{filter:drop-shadow(0 0 20px rgba(255,213,74,.6)) drop-shadow(0 0 40px rgba(255,180,0,.3))} 50%{filter:drop-shadow(0 0 35px rgba(255,213,74,1)) drop-shadow(0 0 60px rgba(255,180,0,.6))}}
  @keyframes particleRise {0%{transform:translateY(0) translateX(0) scale(1);opacity:.6} 100%{transform:translateY(-80px) translateX(20px) scale(0);opacity:0}}
  @keyframes shimmer      {0%{background-position:-200% 0} 100%{background-position:200% 0}}
  @keyframes fadeIn       {from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)}}
  @keyframes slideInLeft  {from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)}}
  @keyframes connectorDraw{from{stroke-dashoffset:400} to{stroke-dashoffset:0}}
  @keyframes scanLine     {0%{top:-20%} 100%{top:110%}}
  @keyframes borderRotate {0%{background-position:0% 50%} 100%{background-position:200% 50%}}

  .anim-fadein   { animation: fadeIn .4s ease forwards }
  .anim-slidein  { animation: slideInLeft .35s ease forwards }
  .live-ring     { animation: livePulse 1.8s ease-in-out infinite }
  .live-dot      { animation: dotBlink 1.2s ease-in-out infinite }
  .trophy-anim   { animation: trophyFloat 3.5s ease-in-out infinite, trophyGlow 3.5s ease-in-out infinite }
  .neon-card     { animation: neonGlow 3s ease-in-out infinite }
  .gold-card     { animation: goldGlow 3s ease-in-out infinite }
  .connector-svg path { animation: connectorDraw 1.2s ease-out forwards; stroke-dasharray: 400; stroke-dashoffset: 400 }

  .hoverable { transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease !important }
  .hoverable:hover { transform: translateY(-2px) !important; border-color: rgba(34,211,238,.5) !important; box-shadow: 0 8px 32px rgba(34,211,238,.18), 0 0 0 1px rgba(34,211,238,.2) !important; cursor: pointer }
  .team-row-h { transition: background .15s ease !important }
  .team-row-h:hover { background: rgba(34,211,238,.09) !important; cursor: pointer }
  .tab-h { transition: all .2s ease !important }
  .tab-h:hover { color: #22d3ee !important }
  .gold-hover:hover { border-color: rgba(255,213,74,.6) !important; box-shadow: 0 8px 32px rgba(255,213,74,.2) !important }
  .btn-h { transition: all .18s ease !important }
  .btn-h:hover { transform: scale(1.04) !important; box-shadow: 0 0 30px rgba(34,211,238,.5) !important }
`;

/* ═══════════════════════════════ DATA ════════════════════════════════════ */
type Team    = { name:string; abbr:string; flag:string; p:number; w:number; d:number; l:number; gs:number; ga:number; pts:number; form:string[] };
type Group   = { id:string; teams:Team[] };
type BMatch  = { h:string; hf:string; hs:string|null; a:string; af:string; as_:string|null; status:string; venue:string };
type LMatch  = { id:number; status:string; minute:number|null; homeTeam:string; homeFlag:string; awayTeam:string; awayFlag:string; homeScore:number|null; awayScore:number|null; venue:string; scorers?:string[] };

const GROUPS: Group[] = [
  { id:"A", teams:[
    {name:"Mexico",     abbr:"MEX",flag:"🇲🇽",p:3,w:2,d:1,l:0,gs:7,ga:2,pts:7,form:["W","W","D"]},
    {name:"Ecuador",    abbr:"ECU",flag:"🇪🇨",p:3,w:1,d:2,l:0,gs:4,ga:3,pts:5,form:["D","W","D"]},
    {name:"S. Korea",   abbr:"KOR",flag:"🇰🇷",p:3,w:1,d:0,l:2,gs:3,ga:5,pts:3,form:["L","W","L"]},
    {name:"Sweden",     abbr:"SWE",flag:"🇸🇪",p:3,w:0,d:1,l:2,gs:2,ga:6,pts:1,form:["D","L","L"]},
  ]},
  { id:"B", teams:[
    {name:"Canada",     abbr:"CAN",flag:"🇨🇦",p:3,w:2,d:1,l:0,gs:5,ga:2,pts:7,form:["W","D","W"]},
    {name:"Italy",      abbr:"ITA",flag:"🇮🇹",p:3,w:1,d:1,l:1,gs:4,ga:3,pts:4,form:["W","D","L"]},
    {name:"Ecuador",    abbr:"ECU",flag:"🇪🇨",p:3,w:1,d:0,l:2,gs:3,ga:5,pts:3,form:["L","W","L"]},
    {name:"Croatia",    abbr:"CRO",flag:"🇭🇷",p:3,w:0,d:2,l:1,gs:2,ga:4,pts:2,form:["D","L","D"]},
  ]},
  { id:"C", teams:[
    {name:"Brazil",     abbr:"BRA",flag:"🇧🇷",p:3,w:3,d:0,l:0,gs:9,ga:2,pts:9,form:["W","W","W"]},
    {name:"Morocco",    abbr:"MAR",flag:"🇲🇦",p:3,w:1,d:1,l:1,gs:4,ga:4,pts:4,form:["W","D","L"]},
    {name:"Scotland",   abbr:"SCO",flag:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",p:3,w:1,d:0,l:2,gs:3,ga:6,pts:3,form:["W","L","L"]},
    {name:"Haiti",      abbr:"HAI",flag:"🇭🇹",p:3,w:0,d:1,l:2,gs:2,ga:6,pts:1,form:["D","L","L"]},
  ]},
  { id:"D", teams:[
    {name:"USA",        abbr:"USA",flag:"🇺🇸",p:3,w:2,d:1,l:0,gs:6,ga:2,pts:7,form:["W","D","W"]},
    {name:"Netherlands",abbr:"NED",flag:"🇳🇱",p:3,w:1,d:1,l:1,gs:4,ga:4,pts:4,form:["D","W","L"]},
    {name:"Japan",      abbr:"JPN",flag:"🇯🇵",p:3,w:1,d:0,l:2,gs:4,ga:5,pts:3,form:["W","L","L"]},
    {name:"Gambia",     abbr:"GAM",flag:"🇬🇲",p:3,w:0,d:0,l:3,gs:1,ga:4,pts:0,form:["L","L","L"]},
  ]},
  { id:"E", teams:[
    {name:"Germany",    abbr:"GER",flag:"🇩🇪",p:3,w:2,d:1,l:0,gs:7,ga:3,pts:7,form:["W","W","D"]},
    {name:"Spain",      abbr:"ESP",flag:"🇪🇸",p:3,w:1,d:1,l:1,gs:5,ga:4,pts:4,form:["D","L","W"]},
    {name:"Uruguay",    abbr:"URU",flag:"🇺🇾",p:3,w:1,d:0,l:2,gs:4,ga:6,pts:3,form:["W","L","L"]},
    {name:"Tunisia",    abbr:"TUN",flag:"🇹🇳",p:3,w:0,d:0,l:3,gs:1,ga:4,pts:0,form:["L","L","L"]},
  ]},
  { id:"F", teams:[
    {name:"Colombia",   abbr:"COL",flag:"🇨🇴",p:3,w:1,d:2,l:0,gs:5,ga:4,pts:5,form:["D","W","D"]},
    {name:"Portugal",   abbr:"POR",flag:"🇵🇹",p:3,w:1,d:2,l:0,gs:5,ga:4,pts:5,form:["D","D","W"]},
    {name:"Ivory Coast",abbr:"CIV",flag:"🇨🇮",p:3,w:0,d:2,l:1,gs:3,ga:4,pts:2,form:["D","L","D"]},
    {name:"S. Arabia",  abbr:"KSA",flag:"🇸🇦",p:3,w:0,d:0,l:3,gs:1,ga:7,pts:0,form:["L","L","L"]},
  ]},
  { id:"G", teams:[
    {name:"Belgium",    abbr:"BEL",flag:"🇧🇪",p:3,w:2,d:0,l:1,gs:6,ga:4,pts:6,form:["W","L","W"]},
    {name:"Iran",       abbr:"IRN",flag:"🇮🇷",p:3,w:1,d:2,l:0,gs:3,ga:2,pts:5,form:["D","W","D"]},
    {name:"Egypt",      abbr:"EGY",flag:"🇪🇬",p:3,w:1,d:1,l:1,gs:3,ga:3,pts:4,form:["W","D","L"]},
    {name:"New Zealand",abbr:"NZL",flag:"🇳🇿",p:3,w:0,d:1,l:2,gs:2,ga:5,pts:1,form:["D","L","L"]},
  ]},
  { id:"H", teams:[
    {name:"France",     abbr:"FRA",flag:"🇫🇷",p:3,w:3,d:0,l:0,gs:8,ga:1,pts:9,form:["W","W","W"]},
    {name:"Austria",    abbr:"AUT",flag:"🇦🇹",p:3,w:1,d:1,l:1,gs:3,ga:3,pts:4,form:["W","D","L"]},
    {name:"Senegal",    abbr:"SEN",flag:"🇸🇳",p:3,w:1,d:0,l:2,gs:3,ga:5,pts:3,form:["W","L","L"]},
    {name:"Qatar",      abbr:"QAT",flag:"🇶🇦",p:3,w:0,d:1,l:2,gs:1,ga:6,pts:1,form:["L","D","L"]},
  ]},
  { id:"I", teams:[
    {name:"Argentina",  abbr:"ARG",flag:"🇦🇷",p:3,w:3,d:0,l:0,gs:8,ga:2,pts:9,form:["W","W","W"]},
    {name:"Peru",       abbr:"PER",flag:"🇵🇪",p:3,w:1,d:1,l:1,gs:4,ga:4,pts:4,form:["D","W","L"]},
    {name:"Nigeria",    abbr:"NGA",flag:"🇳🇬",p:3,w:0,d:2,l:1,gs:2,ga:4,pts:2,form:["D","L","D"]},
    {name:"Israel",     abbr:"ISR",flag:"🇮🇱",p:3,w:0,d:1,l:2,gs:2,ga:6,pts:1,form:["D","L","L"]},
  ]},
  { id:"J", teams:[
    {name:"England",    abbr:"ENG",flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",p:3,w:2,d:1,l:0,gs:6,ga:2,pts:7,form:["W","W","D"]},
    {name:"Denmark",    abbr:"DEN",flag:"🇩🇰",p:3,w:1,d:1,l:1,gs:4,ga:3,pts:4,form:["W","D","L"]},
    {name:"Serbia",     abbr:"SRB",flag:"🇷🇸",p:3,w:1,d:0,l:2,gs:3,ga:5,pts:3,form:["W","L","L"]},
    {name:"Panama",     abbr:"PAN",flag:"🇵🇦",p:3,w:0,d:0,l:3,gs:1,ga:4,pts:0,form:["L","L","L"]},
  ]},
  { id:"K", teams:[
    {name:"Portugal",   abbr:"POR",flag:"🇵🇹",p:3,w:2,d:1,l:0,gs:7,ga:2,pts:7,form:["W","D","W"]},
    {name:"Uzbekistan", abbr:"UZB",flag:"🇺🇿",p:3,w:1,d:1,l:1,gs:3,ga:3,pts:4,form:["D","W","L"]},
    {name:"Chile",      abbr:"CHI",flag:"🇨🇱",p:3,w:1,d:0,l:2,gs:3,ga:5,pts:3,form:["W","L","L"]},
    {name:"Ghana",      abbr:"GHA",flag:"🇬🇭",p:3,w:0,d:0,l:3,gs:1,ga:4,pts:0,form:["L","L","L"]},
  ]},
  { id:"L", teams:[
    {name:"Croatia",    abbr:"CRO",flag:"🇭🇷",p:3,w:2,d:1,l:0,gs:6,ga:2,pts:7,form:["W","D","W"]},
    {name:"Belarus",    abbr:"BLR",flag:"🇧🇾",p:3,w:1,d:1,l:1,gs:3,ga:3,pts:4,form:["D","W","L"]},
    {name:"Algeria",    abbr:"ALG",flag:"🇩🇿",p:3,w:1,d:0,l:2,gs:3,ga:5,pts:3,form:["W","L","L"]},
    {name:"China",      abbr:"CHN",flag:"🇨🇳",p:3,w:0,d:0,l:3,gs:0,ga:1,pts:0,form:["L","L","L"]},
  ]},
];

const LIVE_MATCHES: LMatch[] = [
  { id:1, status:"LIVE", minute:78, homeTeam:"Brazil",    homeFlag:"🇧🇷", awayTeam:"Argentina",   awayFlag:"🇦🇷", homeScore:2, awayScore:1, venue:"MetLife Stadium, NJ", scorers:["Vini Jr. 27'","Raphinha 72'","M. Álvarez 45+1'"] },
  { id:2, status:"HT",   minute:45, homeTeam:"France",    homeFlag:"🇫🇷", awayTeam:"England",     awayFlag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", homeScore:1, awayScore:1, venue:"AT&T Stadium, TX",   scorers:["Mbappé 22'","Bellingham 38'"] },
  { id:3, status:"LIVE", minute:34, homeTeam:"Germany",   homeFlag:"🇩🇪", awayTeam:"Spain",       awayFlag:"🇪🇸", homeScore:1, awayScore:0, venue:"SoFi Stadium, LA",    scorers:["Havertz 29'"] },
  { id:4, status:"TODAY",minute:null,homeTeam:"USA",      homeFlag:"🇺🇸", awayTeam:"Netherlands", awayFlag:"🇳🇱", homeScore:null,awayScore:null, venue:"Levi's Stadium, SF", scorers:[] },
];

const LEFT_BRACKET_R32: BMatch[] = [
  {h:"🇲🇽 MEX",hf:"🇲🇽",hs:"2",a:"🇲🇦 MAR",af:"🇲🇦",as_:"1",status:"FT",venue:"MetLife"},
  {h:"🇨🇴 COL",hf:"🇨🇴",hs:"3",a:"🇪🇸 ESP",af:"🇪🇸",as_:"2",status:"FT",venue:"AT&T"},
  {h:"🇨🇦 CAN",hf:"🇨🇦",hs:"1",a:"🇿🇦 RSA",af:"🇿🇦",as_:"0",status:"FT",venue:"SoFi"},
  {h:"🇳🇱 NED",hf:"🇳🇱",hs:"2",a:"🇵🇪 PER",af:"🇵🇪",as_:"0",status:"FT",venue:"Levi's"},
  {h:"🇩🇪 GER",hf:"🇩🇪",hs:"2",a:"🇦🇹 AUT",af:"🇦🇹",as_:"1",status:"FT",venue:"Rose Bowl"},
  {h:"🇫🇷 FRA",hf:"🇫🇷",hs:"3",a:"🇮🇷 IRN",af:"🇮🇷",as_:"1",status:"FT",venue:"Allegiant"},
  {h:"🇧🇷 BRA",hf:"🇧🇷",hs:"4",a:"🇯🇵 JPN",af:"🇯🇵",as_:"1",status:"FT",venue:"Seattle"},
  {h:"🇺🇸 USA",hf:"🇺🇸",hs:"2",a:"🇧🇾 BLR",af:"🇧🇾",as_:"0",status:"FT",venue:"Kansas City"},
];
const RIGHT_BRACKET_R32: BMatch[] = [
  {h:"🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENG",hf:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",hs:"2",a:"🇵🇹 POR",af:"🇵🇹",as_:"1",status:"FT",venue:"Dallas"},
  {h:"🇦🇷 ARG",hf:"🇦🇷",hs:"2",a:"🇩🇰 DEN",af:"🇩🇰",as_:"0",status:"FT",venue:"Miami"},
  {h:"🇧🇪 BEL",hf:"🇧🇪",hs:"1",a:"🇷🇸 SRB",af:"🇷🇸",as_:"0",status:"FT",venue:"Philadelphia"},
  {h:"🇮🇹 ITA",hf:"🇮🇹",hs:"2",a:"🇺🇿 UZB",af:"🇺🇿",as_:"1",status:"FT",venue:"Boston"},
  {h:"🇭🇷 CRO",hf:"🇭🇷",hs:"1",a:"🇮🇹 ITA",af:"🇮🇹",as_:"0",status:"FT",venue:"Toronto"},
  {h:"🇺🇾 URU",hf:"🇺🇾",hs:"0",a:"🇵🇹 POR",af:"🇵🇹",as_:"1",status:"FT",venue:"Vancouver"},
  {h:"🇵🇹 POR",hf:"🇵🇹",hs:"3",a:"🇰🇷 KOR",af:"🇰🇷",as_:"1",status:"FT",venue:"Guadalajara"},
  {h:"🇪🇬 EGY",hf:"🇪🇬",hs:"1",a:"🇸🇳 SEN",af:"🇸🇳",as_:"3",status:"FT",venue:"Monterrey"},
];
const L_R16: BMatch[] = [
  {h:"🇲🇽 MEX",hf:"🇲🇽",hs:"1",a:"🇨🇴 COL",af:"🇨🇴",as_:"2",status:"FT",venue:"MetLife"},
  {h:"🇨🇦 CAN",hf:"🇨🇦",hs:"1(4)",a:"🇳🇱 NED",af:"🇳🇱",as_:"1(2)",status:"PEN",venue:"SoFi"},
  {h:"🇩🇪 GER",hf:"🇩🇪",hs:"2",a:"🇫🇷 FRA",af:"🇫🇷",as_:"3",status:"FT",venue:"AT&T"},
  {h:"🇧🇷 BRA",hf:"🇧🇷",hs:"3",a:"🇺🇸 USA",af:"🇺🇸",as_:"1",status:"FT",venue:"Rose Bowl"},
];
const R_R16: BMatch[] = [
  {h:"🏴󠁧󠁢󠁥󠁮󠁧󠁿 ENG",hf:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",hs:"1",a:"🇦🇷 ARG",af:"🇦🇷",as_:"2",status:"FT",venue:"Dallas"},
  {h:"🇧🇪 BEL",hf:"🇧🇪",hs:"0",a:"🇮🇹 ITA",af:"🇮🇹",as_:"2",status:"FT",venue:"Miami"},
  {h:"🇵🇹 POR",hf:"🇵🇹",hs:"2",a:"🇭🇷 CRO",af:"🇭🇷",as_:"1",status:"FT",venue:"Boston"},
  {h:"🇸🇳 SEN",hf:"🇸🇳",hs:"1(3)",a:"🇵🇹 POR",af:"🇵🇹",as_:"1(1)",status:"PEN",venue:"Toronto"},
];
const L_QF: BMatch[] = [
  {h:"🇨🇴 COL",hf:"🇨🇴",hs:"1",a:"🇨🇦 NED",af:"🇳🇱",as_:"2",status:"FT",venue:"MetLife"},
  {h:"🇫🇷 FRA",hf:"🇫🇷",hs:"2",a:"🇧🇷 BRA",af:"🇧🇷",as_:"3",status:"FT",venue:"SoFi"},
];
const R_QF: BMatch[] = [
  {h:"🇦🇷 ARG",hf:"🇦🇷",hs:"3",a:"🇮🇹 ITA",af:"🇮🇹",as_:"1",status:"FT",venue:"AT&T"},
  {h:"🇵🇹 POR",hf:"🇵🇹",hs:"2",a:"🇺🇾 URU",af:"🇺🇾",as_:"0",status:"FT",venue:"Dallas"},
];
const L_SF: BMatch[] = [{h:"🇳🇱 NED",hf:"🇳🇱",hs:"0",a:"🇧🇷 BRA",af:"🇧🇷",as_:"2",status:"FT",venue:"MetLife"}];
const R_SF: BMatch[] = [{h:"🇦🇷 ARG",hf:"🇦🇷",hs:"2",a:"🇵🇹 POR",af:"🇵🇹",as_:"1",status:"FT",venue:"AT&T"}];

const TOP_SCORERS = [
  {name:"K. Mbappé",  country:"France",    flag:"🇫🇷",goals:7,assists:3,mins:630},
  {name:"L. Messi",   country:"Argentina", flag:"🇦🇷",goals:6,assists:5,mins:600},
  {name:"Vini Jr.",   country:"Brazil",    flag:"🇧🇷",goals:6,assists:4,mins:630},
  {name:"H. Kane",    country:"England",   flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",goals:5,assists:2,mins:590},
  {name:"M. Álvarez", country:"Argentina", flag:"🇦🇷",goals:5,assists:1,mins:545},
  {name:"C. Pulisic", country:"USA",       flag:"🇺🇸",goals:4,assists:3,mins:600},
  {name:"R. Lukaku",  country:"Belgium",   flag:"🇧🇪",goals:4,assists:1,mins:580},
  {name:"C.Ronaldo",  country:"Portugal",  flag:"🇵🇹",goals:3,assists:4,mins:570},
];

/* ═══════════════════════════ SUB-COMPONENTS ═══════════════════════════════ */
function FormBadge({ result }: { result: string }) {
  const c = result === "W" ? "#4ade80" : result === "D" ? "#fbbf24" : "#f87171";
  return <span style={{ width:18,height:18,borderRadius:"50%",background:c,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:900,color:"#000",flexShrink:0 }}>{result}</span>;
}

function GroupCard({ g, onTeamClick }: { g: Group; onTeamClick: (t: Team) => void }) {
  return (
    <div className="hoverable" style={gS.box}>
      <div style={gS.header}>
        <span style={gS.groupLetter}>GROUP {g.id}</span>
        <div style={{ display:"flex", gap:4 }}>
          <span style={gS.colHd}>P</span><span style={gS.colHd}>W</span><span style={gS.colHd}>D</span><span style={gS.colHd}>L</span><span style={gS.colHd}>GD</span><span style={gS.colHd}>PTS</span>
        </div>
      </div>
      {g.teams.map((t, i) => (
        <div key={t.abbr} className="team-row-h" onClick={() => onTeamClick(t)} style={{ ...gS.row, borderTop: i===0?"none":"1px solid rgba(255,255,255,.05)", background: i<2?"rgba(34,211,238,.03)":"transparent" }}>
          <span style={{ display:"flex", alignItems:"center", gap:5, flex:1 }}>
            <span style={{ width:6,height:6,borderRadius:"50%",background:i<2?"#22d3ee":"rgba(255,255,255,.12)",boxShadow:i<2?"0 0 8px #22d3ee":"none",flexShrink:0 }} />
            <span style={{ fontSize:14 }}>{t.flag}</span>
            <span style={{ fontWeight: i<2?700:400, color: i<2?"#e2e8f0":"#94a3b8", fontSize:10 }}>{t.abbr}</span>
          </span>
          <span style={gS.cell}>{t.p}</span>
          <span style={gS.cell}>{t.w}</span>
          <span style={gS.cell}>{t.d}</span>
          <span style={gS.cell}>{t.l}</span>
          <span style={{ ...gS.cell, color: (t.gs-t.ga)>0?"#4ade80":(t.gs-t.ga)<0?"#f87171":"#94a3b8" }}>{t.gs-t.ga>0?"+":""}{t.gs-t.ga}</span>
          <span style={{ ...gS.cell, fontWeight:700, color:i<2?"#22d3ee":"#fff" }}>{t.pts}</span>
        </div>
      ))}
    </div>
  );
}
const gS = {
  box: { background:"linear-gradient(145deg,rgba(6,22,42,.95),rgba(3,12,24,.98))", border:"1px solid rgba(34,211,238,.16)", borderRadius:12, padding:"9px 10px", marginBottom:8 } as React.CSSProperties,
  header: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:7, paddingBottom:5, borderBottom:"1px solid rgba(34,211,238,.1)" } as React.CSSProperties,
  groupLetter: { color:"#38dfff", fontWeight:900, fontSize:10, letterSpacing:3 } as React.CSSProperties,
  colHd: { width:22, textAlign:"center" as const, color:"#1e3a5f", fontSize:8, letterSpacing:0.5 },
  row: { display:"flex", alignItems:"center", gap:2, padding:"4px 0", fontSize:10 } as React.CSSProperties,
  cell: { width:22, textAlign:"center" as const, color:"#94a3b8", fontSize:9 } as React.CSSProperties,
};

function BracketCard({ m, gold, compact }: { m: BMatch; gold?: boolean; compact?: boolean }) {
  const hScore = parseInt(m.hs || "0"), aScore = parseInt(m.as_ || "0");
  const hWin = hScore > aScore, aWin = aScore > hScore;
  const accent = gold ? "#ffd54a" : "#22d3ee";
  const borderCol = gold ? "rgba(255,213,74,.45)" : "rgba(34,211,238,.25)";
  return (
    <div className="hoverable" style={{ background:"rgba(0,0,0,.65)", border:`1px solid ${borderCol}`, borderRadius:9, padding: compact?"4px 7px":"6px 8px", marginBottom:4, backdropFilter:"blur(8px)" }}>
      {([{team:m.h,score:m.hs,win:hWin},{team:m.a,score:m.as_,win:aWin}] as const).map((side, i) => (
        <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"2px 0", fontSize: compact?8.5:9.5 }}>
          <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const, flex:1, color: side.win?"#fff":"rgba(255,255,255,.42)", fontWeight:side.win?700:400 }}>{side.team}</span>
          <strong style={{ color: side.win?accent:"rgba(255,255,255,.28)", minWidth:16, textAlign:"right" as const, flexShrink:0 }}>{side.score}</strong>
        </div>
      ))}
      <div style={{ fontSize:7.5, color:"#1e3a5f", letterSpacing:1, marginTop:2, display:"flex", gap:4 }}>
        <span>{m.status}</span>
        {m.venue && <span>·</span>}
        {m.venue && <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const, maxWidth:70, color:"#1e293b" }}>{m.venue}</span>}
      </div>
    </div>
  );
}

function RCol({ matches, gold, compact }: { matches: BMatch[]; gold?: boolean; compact?: boolean }) {
  return (
    <div style={{ display:"flex", flexDirection:"column" as const, gap:4, justifyContent:"space-around", height:"100%" }}>
      {matches.map((m, i) => <BracketCard key={i} m={m} gold={gold} compact={compact} />)}
    </div>
  );
}

function LiveCard({ m }: { m: LMatch }) {
  const live = m.status === "LIVE", ht = m.status === "HT", today = m.status === "TODAY";
  return (
    <div className="hoverable" style={{ background:"linear-gradient(145deg,rgba(6,20,38,.95),rgba(3,12,24,.98))", border:`1px solid ${live?"rgba(239,68,68,.4)":ht?"rgba(251,191,36,.3)":"rgba(34,211,238,.2)"}`, borderRadius:14, padding:"14px 16px", boxShadow: live?"0 0 30px rgba(239,68,68,.15)":"none", position:"relative" as const, overflow:"hidden" as const }}>
      {live && <div style={{ position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,#ef4444,transparent)" }} />}
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
        <span style={{ display:"flex", alignItems:"center", gap:6 }}>
          {live && <span className="live-dot" style={{ width:7,height:7,borderRadius:"50%",background:"#ef4444",display:"inline-block" }} />}
          <span style={{ background:live?"#ef4444":ht?"#f59e0b":"#1d4ed8", color:"#fff", fontWeight:700, fontSize:9, padding:"3px 9px", borderRadius:4, letterSpacing:1.5 }}>
            {live ? `LIVE ${m.minute}'` : ht ? "HALF TIME" : today ? "TODAY" : "FT"}
          </span>
        </span>
        <span style={{ color:"#334155", fontSize:9, letterSpacing:1 }}>{m.venue}</span>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", alignItems:"center", gap:10 }}>
        <div style={{ textAlign:"center" as const }}>
          <div style={{ fontSize:32 }}>{m.homeFlag}</div>
          <div style={{ fontWeight:700, fontSize:12, marginTop:4, letterSpacing:1 }}>{m.homeTeam}</div>
        </div>
        <div style={{ textAlign:"center" as const }}>
          {m.homeScore !== null
            ? <div style={{ fontSize:30, fontWeight:900, color:"#fff", letterSpacing:2 }}>{m.homeScore}&nbsp;—&nbsp;{m.awayScore}</div>
            : <div style={{ fontSize:18, color:"#334155", fontWeight:700 }}>VS</div>
          }
        </div>
        <div style={{ textAlign:"center" as const }}>
          <div style={{ fontSize:32 }}>{m.awayFlag}</div>
          <div style={{ fontWeight:700, fontSize:12, marginTop:4, letterSpacing:1 }}>{m.awayTeam}</div>
        </div>
      </div>
      {m.scorers && m.scorers.length > 0 && (
        <div style={{ marginTop:10, display:"flex", gap:8, flexWrap:"wrap" as const }}>
          {m.scorers.map((sc, i) => (
            <span key={i} style={{ fontSize:9, color:"#64748b", display:"flex", alignItems:"center", gap:3 }}>⚽ {sc}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function TeamPopup({ team, onClose }: { team: Team; onClose: () => void }) {
  return (
    <div style={{ position:"fixed" as const, inset:0, background:"rgba(0,0,0,.7)", backdropFilter:"blur(10px)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" as const }} onClick={onClose}>
      <div className="anim-fadein" onClick={e => e.stopPropagation()} style={{ background:"linear-gradient(145deg,#0a1929,#061220)", border:"1px solid rgba(34,211,238,.35)", borderRadius:20, padding:28, width:360, maxWidth:"90vw", boxShadow:"0 0 60px rgba(34,211,238,.2)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
          <div>
            <div style={{ fontSize:42, marginBottom:4 }}>{team.flag}</div>
            <div style={{ fontWeight:900, fontSize:20, letterSpacing:1 }}>{team.name}</div>
            <div style={{ color:"#22d3ee", fontSize:11, letterSpacing:2, marginTop:2 }}>{team.abbr}</div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)", color:"#fff", borderRadius:8, padding:"6px 10px", cursor:"pointer", fontSize:13 }}>✕</button>
        </div>

        {/* Stats grid */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:18 }}>
          {[["P", team.p], ["W", team.w], ["D", team.d], ["L", team.l], ["GF", team.gs], ["GA", team.ga]].map(([label, val]) => (
            <div key={label as string} style={{ background:"rgba(34,211,238,.06)", border:"1px solid rgba(34,211,238,.12)", borderRadius:10, padding:"10px 0", textAlign:"center" as const }}>
              <div style={{ fontSize:20, fontWeight:900, color:"#22d3ee" }}>{val}</div>
              <div style={{ fontSize:9, color:"#475569", letterSpacing:1, marginTop:2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Form */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:9, color:"#475569", letterSpacing:2, marginBottom:8 }}>RECENT FORM</div>
          <div style={{ display:"flex", gap:6 }}>{team.form.map((f, i) => <FormBadge key={i} result={f} />)}</div>
        </div>

        {/* Points */}
        <div style={{ background:"linear-gradient(135deg,rgba(34,211,238,.1),rgba(14,165,233,.05))", border:"1px solid rgba(34,211,238,.2)", borderRadius:12, padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:11, color:"#64748b", letterSpacing:1 }}>GROUP POINTS</span>
          <span style={{ fontSize:28, fontWeight:900, color:"#22d3ee" }}>{team.pts}</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════ MAIN PAGE ════════════════════════════════════ */
export default function HomePage() {
  const [clock,      setClock]      = useState("--:--:--");
  const [tab,        setTab]        = useState<"bracket"|"groups"|"live"|"stats">("bracket");
  const [matches,    setMatches]    = useState<LMatch[]>(LIVE_MATCHES);
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [lastUpdate, setLastUpdate] = useState("");

  // Tick
  useEffect(() => {
    const tick = () => {
      setClock(new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}));
      setLastUpdate(new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:true}));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Score fetch
  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch("/api/live-scores");
        const d = await r.json();
        setMatches(d.matches);
      } catch { setMatches(LIVE_MATCHES); }
    };
    load();
    const id = setInterval(load, 20_000);
    return () => clearInterval(id);
  }, []);

  const liveCount = matches.filter(m => m.status === "LIVE").length;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />

      {activeTeam && <TeamPopup team={activeTeam} onClose={() => setActiveTeam(null)} />}

      <main style={{ minHeight:"100vh", background:"radial-gradient(ellipse at 30% 0%, #0d2847 0%, #061428 35%, #030b18 65%, #010408 100%)", color:"#fff", fontFamily:"'SF Pro Display','Arial',sans-serif", overflowX:"hidden" as const }}>

        {/* ════ ATMOSPHERIC BACKGROUND ════ */}
        <div style={{ position:"fixed" as const, inset:0, pointerEvents:"none" as const, zIndex:0, overflow:"hidden" }}>
          <div style={{ position:"absolute", top:"-20%", left:"30%", width:"60vw", height:"60vw", borderRadius:"50%", background:"radial-gradient(circle,rgba(34,211,238,.04),transparent 65%)" }} />
          <div style={{ position:"absolute", top:"10%",  right:"10%", width:"40vw", height:"40vw", borderRadius:"50%", background:"radial-gradient(circle,rgba(255,213,74,.03),transparent 65%)" }} />
          <div style={{ position:"absolute", bottom:"5%",left:"5%",  width:"30vw", height:"30vw", borderRadius:"50%", background:"radial-gradient(circle,rgba(14,165,233,.04),transparent 65%)" }} />
        </div>

        {/* ════ HEADER ════ */}
        <header style={{ position:"sticky" as const, top:0, zIndex:90, background:"rgba(1,5,14,.85)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(34,211,238,.14)", padding:"0 18px" }}>

          {/* Top strip */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid rgba(34,211,238,.06)", padding:"6px 0" }}>
            <div style={{ display:"flex", gap:12, alignItems:"center" }}>
              {liveCount > 0 && <span style={{ display:"flex", alignItems:"center", gap:5, background:"rgba(239,68,68,.12)", border:"1px solid rgba(239,68,68,.3)", borderRadius:5, padding:"2px 8px", fontSize:9, fontWeight:700, letterSpacing:1.5 }}>
                <span className="live-dot" style={{ width:5,height:5,borderRadius:"50%",background:"#ef4444",display:"inline-block" }} />
                {liveCount} LIVE {liveCount>1?"MATCHES":"MATCH"}
              </span>}
              <span style={{ fontSize:9, color:"#334155" }}>Updated: {lastUpdate}</span>
            </div>
            <div style={{ display:"flex", gap:12, fontSize:9, color:"#334155" }}>
              <span>🌐 Auto-timezone</span>
              <span>🌍 EN | ES | FR | PT</span>
              <span>📡 Live Sync</span>
            </div>
          </div>

          {/* Main header row */}
          <div style={{ display:"grid", gridTemplateColumns:"auto 1fr auto", alignItems:"center", gap:16, padding:"10px 0" }}>

            {/* Logo */}
            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              <div style={{ background:"linear-gradient(135deg,#1d4ed8,#1e3a8a)", border:"1px solid rgba(34,211,238,.4)", borderRadius:10, padding:"8px 12px", textAlign:"center" as const, lineHeight:1.3 }}>
                <div style={{ fontWeight:900, fontSize:14, letterSpacing:2 }}>FIFA</div>
                <div style={{ fontSize:8, color:"#ffd54a", letterSpacing:1 }}>WORLD CUP</div>
                <div style={{ fontSize:11, fontWeight:700, color:"#38dfff" }}>2026</div>
              </div>
              <div>
                <div style={{ fontSize:9, color:"#38dfff", letterSpacing:3 }}>OFFICIAL</div>
                <div style={{ fontSize:10, color:"#334155" }}>TOURNAMENT DASHBOARD</div>
              </div>
            </div>

            {/* Title */}
            <div style={{ textAlign:"center" as const }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center" as const, gap:10, fontWeight:900 }}>
                <span style={{ fontSize:42, color:"#ffd54a", lineHeight:1, textShadow:"0 0 30px rgba(255,213,74,.5)" }}>20</span>
                <div>
                  <div style={{ fontSize:22, letterSpacing:6, background:"linear-gradient(90deg,#38dfff,#fff,#ffd54a)", WebkitBackgroundClip:"text" as const, WebkitTextFillColor:"transparent" as const }}>FIFA WORLD CUP</div>
                  <div style={{ fontSize:10, color:"#38dfff", letterSpacing:8, marginTop:1 }}>UNITED STATES · <span style={{ color:"#f87171" }}>CANADA</span> · MEXICO</div>
                </div>
                <span style={{ fontSize:42, color:"#ffd54a", lineHeight:1, textShadow:"0 0 30px rgba(255,213,74,.5)" }}>26</span>
              </div>
            </div>

            {/* Clock + CTA */}
            <div style={{ display:"flex", flexDirection:"column" as const, alignItems:"flex-end" as const, gap:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(0,0,0,.5)", border:"1px solid rgba(34,211,238,.18)", borderRadius:8, padding:"6px 12px" }}>
                <span className="live-dot" style={{ width:6,height:6,borderRadius:"50%",background:"#22c55e",display:"inline-block" }} />
                <span style={{ fontWeight:700, fontVariantNumeric:"tabular-nums", fontSize:14, letterSpacing:1 }}>{clock}</span>
                <span style={{ color:"#334155", fontSize:9 }}>LOCAL</span>
              </div>
              <a href="https://buy.stripe.com/test_eVq5kw6FVfCk9cL97K6oo00" target="_blank" rel="noopener noreferrer" className="btn-h" style={{ display:"inline-block", background:"linear-gradient(135deg,#22d3ee,#0ea5e9)", color:"#000", fontWeight:900, fontSize:12, padding:"9px 20px", borderRadius:24, textDecoration:"none", boxShadow:"0 0 28px rgba(34,211,238,.55)", letterSpacing:0.5, whiteSpace:"nowrap" as const }}>
                Get Access — £4.99
              </a>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:"flex", gap:2, paddingBottom:0, borderTop:"1px solid rgba(34,211,238,.06)" }}>
            {(["bracket","groups","live","stats"] as const).map(t => (
              <button key={t} className="tab-h" onClick={() => setTab(t)} style={{ padding:"10px 20px", background:"transparent", border:"none", color: tab===t?"#22d3ee":"#334155", fontWeight: tab===t?700:400, fontSize:11, letterSpacing:2, cursor:"pointer", borderBottom: tab===t?"2px solid #22d3ee":"2px solid transparent", textTransform:"uppercase" as const, transition:"all .2s" }}>
                {t==="bracket"?"🏟 Bracket":t==="groups"?"📊 Groups":t==="live"?"⚽ Live":"📈 Stats"}
              </button>
            ))}
          </div>
        </header>

        {/* ════ CONTENT ════ */}
        <div style={{ position:"relative" as const, zIndex:1 }}>

          {/* ── BRACKET TAB ── */}
          {tab === "bracket" && (
            <div style={{ display:"grid", gridTemplateColumns:"200px minmax(0,1fr) 200px", gap:10, padding:"10px 10px" }} className="anim-fadein">

              {/* Left groups */}
              <aside style={{ paddingTop:4 }}>
                <div style={labelStyle}>GROUP STAGE · A–F</div>
                {GROUPS.slice(0,6).map(g => <GroupCard key={g.id} g={g} onTeamClick={setActiveTeam} />)}
              </aside>

              {/* Centre bracket */}
              <section>
                <div style={labelStyle}>KNOCKOUT STAGE</div>

                <div className="neon-card" style={{ border:"1px solid rgba(34,211,238,.15)", borderRadius:16, padding:"10px 8px", background:"linear-gradient(180deg,rgba(3,10,22,.95),rgba(1,5,12,.98))" }}>

                  {/* Round labels */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr) 160px repeat(4,1fr)", gap:4, color:"#1e3a5f", fontSize:8, letterSpacing:1, marginBottom:8, textAlign:"center" as const, textTransform:"uppercase" as const }}>
                    <span>Round of 32</span><span>Round of 16</span><span>Quarters</span><span>Semis</span>
                    <span style={{ color:"rgba(255,213,74,.5)", fontWeight:700 }}>FINAL</span>
                    <span>Semis</span><span>Quarters</span><span>Round of 16</span><span>Round of 32</span>
                  </div>

                  {/* Bracket grid */}
                  <div style={{ display:"grid", gridTemplateColumns:"1fr .82fr .68fr .58fr 160px .58fr .68fr .82fr 1fr", gap:5, alignItems:"stretch", minHeight:420 }}>
                    <RCol matches={LEFT_BRACKET_R32} compact />
                    <RCol matches={L_R16} compact />
                    <RCol matches={L_QF} />
                    <RCol matches={L_SF} />

                    {/* TROPHY FINAL */}
                    <div className="gold-card" style={{ border:"1px solid rgba(255,213,74,.5)", borderRadius:16, textAlign:"center" as const, padding:"16px 10px", background:"radial-gradient(ellipse at 50% 30%,rgba(255,213,74,.14),rgba(0,0,0,.65))", display:"flex", flexDirection:"column" as const, alignItems:"center", justifyContent:"center" }}>
                      <div className="trophy-anim" style={{ fontSize:38, lineHeight:1 }}>🏆</div>
                      <div style={{ color:"#ffd54a", fontWeight:900, fontSize:13, letterSpacing:3, marginTop:8 }}>FINAL</div>
                      <div style={{ color:"#475569", fontSize:8, marginTop:3 }}>JULY 19, 2026</div>
                      <div style={{ color:"#334155", fontSize:8 }}>METLIFE STADIUM</div>
                      <div style={{ marginTop:12, width:"100%" }}>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", alignItems:"center", gap:4 }}>
                          <div style={{ textAlign:"center" as const }}><div style={{ fontSize:20 }}>🇧🇷</div><div style={{ fontWeight:700, fontSize:9, marginTop:2 }}>BRA</div></div>
                          <div style={{ fontSize:18, fontWeight:900, color:"#ffd54a" }}>2—1</div>
                          <div style={{ textAlign:"center" as const }}><div style={{ fontSize:20 }}>🇦🇷</div><div style={{ fontWeight:700, fontSize:9, marginTop:2 }}>ARG</div></div>
                        </div>
                        <div style={{ color:"#334155", fontSize:8, marginTop:8, lineHeight:1.9 }}>
                          <div>⚽ Vini Jr. 27' · Raphinha 72'</div>
                          <div>⚽ M. Álvarez 45+1'</div>
                        </div>
                        <div style={{ marginTop:8, borderTop:"1px solid rgba(255,213,74,.12)", paddingTop:7, fontSize:8, color:"#334155" }}>
                          3RD · 🇵🇹 POR 2–1 URU 🇺🇾
                        </div>
                        <div style={{ marginTop:6, color:"#22d3ee", fontSize:8, letterSpacing:2, fontWeight:700 }}>🇧🇷 CHAMPIONS</div>
                      </div>
                    </div>

                    <RCol matches={R_SF} />
                    <RCol matches={R_QF} />
                    <RCol matches={R_R16} compact />
                    <RCol matches={RIGHT_BRACKET_R32} compact />
                  </div>
                </div>

                {/* ── BOTTOM PANELS ── */}
                <div style={{ display:"grid", gridTemplateColumns:"1.5fr 1fr 1fr 0.9fr 1fr", gap:8, marginTop:10 }}>

                  {/* Live match */}
                  <div style={{ background:"linear-gradient(145deg,rgba(6,20,40,.95),rgba(3,12,24,.98))", border:"1px solid rgba(34,211,238,.18)", borderRadius:14, padding:"12px 14px" }}>
                    <div style={panelTitle}>⚽ LIVE MATCH CENTER</div>
                    {matches.filter(m=>m.status==="LIVE"||m.status==="HT").slice(0,1).map(m => (
                      <div key={m.id}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                          <span style={{ background:"#ef4444", color:"#fff", fontWeight:700, fontSize:9, padding:"3px 9px", borderRadius:4, letterSpacing:1.5, display:"flex", alignItems:"center", gap:5 }}>
                            <span className="live-dot" style={{ width:5,height:5,borderRadius:"50%",background:"#fff",display:"inline-block" }} />
                            {m.status === "HT" ? "HALF TIME" : `LIVE ${m.minute}'`}
                          </span>
                          <span style={{ fontSize:8, color:"#334155" }}>{m.venue}</span>
                        </div>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", alignItems:"center", gap:6 }}>
                          <div style={{ textAlign:"center" as const }}><div style={{ fontSize:28 }}>{m.homeFlag}</div><div style={{ fontWeight:700, fontSize:10, marginTop:3 }}>{m.homeTeam}</div></div>
                          <div style={{ textAlign:"center" as const, fontSize:26, fontWeight:900, color:"#fff", letterSpacing:2 }}>{m.homeScore}—{m.awayScore}</div>
                          <div style={{ textAlign:"center" as const }}><div style={{ fontSize:28 }}>{m.awayFlag}</div><div style={{ fontWeight:700, fontSize:10, marginTop:3 }}>{m.awayTeam}</div></div>
                        </div>
                        {m.scorers && <div style={{ marginTop:8, display:"flex", flexWrap:"wrap" as const, gap:6 }}>{m.scorers.map((s,i) => <span key={i} style={{ fontSize:8, color:"#475569" }}>⚽ {s}</span>)}</div>}
                        <div style={{ marginTop:10, display:"grid", gridTemplateColumns:"1fr auto 1fr", alignItems:"center", gap:4 }}>
                          <div style={{ height:4, background:"rgba(34,211,238,.6)", borderRadius:2, width:"56%" }} />
                          <span style={{ fontSize:8, color:"#334155", letterSpacing:1 }}>POSS</span>
                          <div style={{ height:4, background:"rgba(248,113,113,.6)", borderRadius:2, width:"44%", marginLeft:"auto" as const }} />
                        </div>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:8, color:"#475569", marginTop:2 }}><span>56%</span><span>44%</span></div>
                      </div>
                    ))}
                  </div>

                  {/* Top scorers */}
                  <div style={{ background:"linear-gradient(145deg,rgba(6,20,40,.95),rgba(3,12,24,.98))", border:"1px solid rgba(34,211,238,.18)", borderRadius:14, padding:"12px 14px" }}>
                    <div style={panelTitle}>👟 TOP SCORERS</div>
                    {TOP_SCORERS.slice(0,5).map((s,i) => (
                      <div key={s.name} style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 0", borderTop:i===0?"none":"1px solid rgba(255,255,255,.05)", fontSize:10 }}>
                        <span style={{ color:"#1e3a5f", minWidth:14, fontWeight:700, fontSize:9 }}>{i+1}</span>
                        <span style={{ fontSize:12 }}>{s.flag}</span>
                        <span style={{ flex:1, fontSize:9 }}>{s.name}</span>
                        <span style={{ color:"#ffd54a", fontWeight:700 }}>{s.goals}</span>
                        <span style={{ fontSize:9 }}>⚽</span>
                      </div>
                    ))}
                    <button style={{ marginTop:8, width:"100%", background:"rgba(34,211,238,.07)", border:"1px solid rgba(34,211,238,.2)", color:"#22d3ee", borderRadius:6, padding:"5px", fontSize:9, fontWeight:700, cursor:"pointer", letterSpacing:1 }}>VIEW ALL</button>
                  </div>

                  {/* Tournament stats */}
                  <div style={{ background:"linear-gradient(145deg,rgba(6,20,40,.95),rgba(3,12,24,.98))", border:"1px solid rgba(34,211,238,.18)", borderRadius:14, padding:"12px 14px" }}>
                    <div style={panelTitle}>📊 TOURNAMENT STATS</div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7, marginTop:6 }}>
                      {[["48","MATCHES"],["128","GOALS"],["2.67","AVG GOALS"],["312","YELLOW CARDS"],["14","RED CARDS"],["22","CLEAN SHEETS"]].map(([v,l]) => (
                        <div key={l} style={{ background:"rgba(0,0,0,.35)", borderRadius:9, padding:"8px 10px", border:"1px solid rgba(255,255,255,.06)" }}>
                          <div style={{ fontSize:18, fontWeight:900, color:"#22d3ee" }}>{v}</div>
                          <div style={{ fontSize:8, color:"#334155", letterSpacing:1, marginTop:1 }}>{l}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Features */}
                  <div style={{ background:"linear-gradient(145deg,rgba(6,20,40,.95),rgba(3,12,24,.98))", border:"1px solid rgba(34,211,238,.18)", borderRadius:14, padding:"12px 14px" }}>
                    <div style={panelTitle}>✨ FEATURES</div>
                    {["🔴 Live Scores","📈 Team Stats","👤 Player Stats","📅 Fixtures","🏆 Standings","📰 News Feed","🔔 Alerts","🌍 Multi-lang"].map((f,i) => (
                      <div key={f} style={{ padding:"4px 0", fontSize:9, color:"#64748b", borderTop:i===0?"none":"1px solid rgba(255,255,255,.04)", display:"flex", alignItems:"center", gap:5 }}>{f}</div>
                    ))}
                  </div>

                  {/* Mobile preview */}
                  <div style={{ background:"linear-gradient(145deg,rgba(6,20,40,.95),rgba(3,12,24,.98))", border:"1px solid rgba(34,211,238,.18)", borderRadius:14, padding:"12px 14px" }}>
                    <div style={panelTitle}>📱 MOBILE APP</div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                      {[{l:"Home",c:"🇧🇷 2–1 🇦🇷",s:"78' LIVE"},{l:"Bracket",c:"FINAL",s:"MetLife"},{l:"Groups",c:"A–L",s:"All 12"},{l:"Brazil",c:"🏆 #1",s:"Champions"}].map(ph => (
                        <div key={ph.l} className="hoverable" style={{ background:"rgba(0,0,0,.4)", border:"1px solid rgba(34,211,238,.15)", borderRadius:10, padding:"10px 8px", textAlign:"center" as const }}>
                          <div style={{ fontSize:8, color:"#38dfff", fontWeight:700, letterSpacing:1, marginBottom:5 }}>{ph.l}</div>
                          <div style={{ fontSize:12, fontWeight:900 }}>{ph.c}</div>
                          <div style={{ fontSize:8, color:"#334155", marginTop:2 }}>{ph.s}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Right groups */}
              <aside style={{ paddingTop:4 }}>
                <div style={labelStyle}>GROUP STAGE · G–L</div>
                {GROUPS.slice(6,12).map(g => <GroupCard key={g.id} g={g} onTeamClick={setActiveTeam} />)}
              </aside>
            </div>
          )}

          {/* ── GROUPS TAB ── */}
          {tab === "groups" && (
            <div style={{ padding:"14px" }} className="anim-fadein">
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:12 }}>
                {GROUPS.map(g => <GroupCard key={g.id} g={g} onTeamClick={setActiveTeam} />)}
              </div>
            </div>
          )}

          {/* ── LIVE TAB ── */}
          {tab === "live" && (
            <div style={{ padding:"14px", maxWidth:900, margin:"0 auto" }} className="anim-fadein">
              <div style={{ display:"grid", gap:12 }}>
                {matches.map(m => <LiveCard key={m.id} m={m} />)}
              </div>
            </div>
          )}

          {/* ── STATS TAB ── */}
          {tab === "stats" && (
            <div style={{ padding:"14px" }} className="anim-fadein">
              <div style={{ display:"grid", gridTemplateColumns:"1.2fr 1fr", gap:14, maxWidth:900, margin:"0 auto" }}>
                {/* Top scorers full */}
                <div style={{ background:"linear-gradient(145deg,rgba(6,20,40,.95),rgba(3,12,24,.98))", border:"1px solid rgba(34,211,238,.18)", borderRadius:16, padding:"18px 18px" }}>
                  <div style={{ ...panelTitle, fontSize:12, marginBottom:14 }}>👟 TOP SCORERS</div>
                  {TOP_SCORERS.map((s, i) => (
                    <div key={s.name} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 0", borderTop:i===0?"none":"1px solid rgba(255,255,255,.06)" }}>
                      <span style={{ color:"#1e3a5f", minWidth:20, fontWeight:900, fontSize:13 }}>{i+1}</span>
                      <span style={{ fontSize:22 }}>{s.flag}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, fontSize:12 }}>{s.name}</div>
                        <div style={{ fontSize:9, color:"#475569" }}>{s.country}</div>
                      </div>
                      <div style={{ textAlign:"right" as const }}>
                        <div style={{ fontWeight:900, fontSize:18, color:"#ffd54a" }}>{s.goals}</div>
                        <div style={{ fontSize:8, color:"#334155" }}>GOALS</div>
                      </div>
                      <div style={{ textAlign:"right" as const, marginLeft:10 }}>
                        <div style={{ fontWeight:700, fontSize:14, color:"#22d3ee" }}>{s.assists}</div>
                        <div style={{ fontSize:8, color:"#334155" }}>AST</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tournament stats */}
                <div style={{ display:"flex", flexDirection:"column" as const, gap:12 }}>
                  <div style={{ background:"linear-gradient(145deg,rgba(6,20,40,.95),rgba(3,12,24,.98))", border:"1px solid rgba(34,211,238,.18)", borderRadius:16, padding:"18px 18px" }}>
                    <div style={{ ...panelTitle, fontSize:12, marginBottom:14 }}>📊 TOURNAMENT OVERVIEW</div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                      {[["48","PLAYED","#22d3ee"],["128","GOALS","#ffd54a"],["2.67","AVG/GAME","#4ade80"],["312","YELLOWS","#fbbf24"],["14","REDS","#f87171"],["2.1M+","ATTENDANCE","#a78bfa"]].map(([v,l,c]) => (
                        <div key={l} style={{ background:"rgba(0,0,0,.4)", border:"1px solid rgba(255,255,255,.07)", borderRadius:12, padding:"14px 12px", textAlign:"center" as const }}>
                          <div style={{ fontSize:24, fontWeight:900, color:c }}>{v}</div>
                          <div style={{ fontSize:9, color:"#334155", letterSpacing:1, marginTop:4 }}>{l}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ background:"linear-gradient(145deg,rgba(6,20,40,.95),rgba(3,12,24,.98))", border:"1px solid rgba(255,213,74,.2)", borderRadius:16, padding:"18px 18px" }}>
                    <div style={{ ...panelTitle, fontSize:12, marginBottom:12, color:"#ffd54a" }}>🏆 CHAMPIONS</div>
                    <div style={{ display:"grid", gridTemplateColumns:"auto 1fr", gap:14, alignItems:"center" }}>
                      <div style={{ fontSize:52, filter:"drop-shadow(0 0 20px rgba(255,213,74,.6))" }}>🇧🇷</div>
                      <div>
                        <div style={{ fontWeight:900, fontSize:22 }}>BRAZIL</div>
                        <div style={{ color:"#ffd54a", fontSize:11, letterSpacing:2, marginTop:3 }}>FIFA WORLD CUP 2026</div>
                        <div style={{ color:"#475569", fontSize:10, marginTop:4 }}>🏆 6th World Cup title</div>
                        <div style={{ display:"flex", gap:6, marginTop:8 }}>
                          {["W","W","W","W","W","W","W"].map((f,i) => <FormBadge key={i} result={f} />)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ════ FOOTER ════ */}
        <footer style={{ marginTop:12, borderTop:"1px solid rgba(34,211,238,.1)", padding:"12px 18px", background:"rgba(0,0,0,.6)", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap" as const, gap:12 }}>
          <div style={{ display:"flex", gap:18, alignItems:"center", flexWrap:"wrap" as const }}>
            <strong style={{ color:"#38dfff", fontSize:10, letterSpacing:2 }}>DATA SOURCES</strong>
            {["FIFA API","Opta","Sportradar","API-Football"].map(s => <span key={s} style={{ color:"#334155", fontSize:10 }}>{s}</span>)}
            <span style={{ color:"#22c55e", fontWeight:700, fontSize:10 }}>● LIVE SYNC</span>
            <span style={{ color:"#1e293b", fontSize:9 }}>Auto-updates every 20s</span>
          </div>
          <div style={{ display:"flex", gap:20, alignItems:"center" }}>
            <div style={{ fontSize:9, color:"#334155" }}>
              <div style={{ letterSpacing:1, marginBottom:2, color:"#1e3a5f" }}>MULTI-LANGUAGE</div>
              <div style={{ display:"flex", gap:8 }}>{["EN","ES","FR","PT"].map(l => <span key={l} style={{ color:l==="EN"?"#22d3ee":"#334155" }}>{l}</span>)}</div>
            </div>
            <div style={{ fontSize:9, color:"#334155" }}>
              <div style={{ letterSpacing:1, marginBottom:2, color:"#1e3a5f" }}>FOLLOW</div>
              <div style={{ display:"flex", gap:8 }}>{"𝕏 f ▶ 📸".split(" ").map(ic => <span key={ic} style={{ cursor:"pointer", fontSize:12 }}>{ic}</span>)}</div>
            </div>
            <div style={{ fontSize:9, color:"#1e293b" }}>© 2026 World Cup LiveBoard</div>
          </div>
        </footer>
      </main>
    </>
  );
}

const labelStyle: React.CSSProperties = { color:"#38dfff", fontSize:9, letterSpacing:4, textAlign:"center", marginBottom:8, fontWeight:700, textTransform:"uppercase" };
const panelTitle: React.CSSProperties = { color:"#67e8f9", fontWeight:700, fontSize:10, letterSpacing:2, marginBottom:6, textTransform:"uppercase" };
