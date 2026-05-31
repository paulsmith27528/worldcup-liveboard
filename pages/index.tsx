"use client";
import { useEffect, useState } from "react";

/* ═══════════════════════ GLOBAL CSS ═══════════════════════════════════════ */
const CSS = `
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{background:#020810;color:#fff;font-family:'Arial',sans-serif;overflow-x:hidden}
  ::-webkit-scrollbar{width:3px;height:3px}
  ::-webkit-scrollbar-thumb{background:rgba(34,211,238,.3);border-radius:2px}

  @keyframes blink   {0%,100%{opacity:1}50%{opacity:.15}}
  @keyframes tFloat  {0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
  @keyframes tGlow   {0%,100%{filter:drop-shadow(0 0 18px rgba(255,213,74,.7))}50%{filter:drop-shadow(0 0 36px rgba(255,213,74,1)) drop-shadow(0 0 60px rgba(255,180,0,.6))}}
  @keyframes neonPulse{0%,100%{box-shadow:0 0 18px rgba(34,211,238,.2)}50%{box-shadow:0 0 35px rgba(34,211,238,.45)}}
  @keyframes goldPulse{0%,100%{box-shadow:0 0 25px rgba(255,213,74,.18)}50%{box-shadow:0 0 50px rgba(255,213,74,.45)}}
  @keyframes fadeUp  {from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes connDraw{from{stroke-dashoffset:600}to{stroke-dashoffset:0}}
  @keyframes livering{0%{box-shadow:0 0 0 0 rgba(239,68,68,.7)}70%{box-shadow:0 0 0 8px rgba(239,68,68,0)}100%{box-shadow:0 0 0 0 rgba(239,68,68,0)}}

  .fadein      {animation:fadeUp .4s ease forwards}
  .trophy      {animation:tFloat 3.5s ease-in-out infinite,tGlow 3.5s ease-in-out infinite}
  .neon-box    {animation:neonPulse 3s ease-in-out infinite}
  .gold-box    {animation:goldPulse 3s ease-in-out infinite}
  .blink       {animation:blink 1.2s ease-in-out infinite}
  .live-ring   {animation:livering 1.8s ease-in-out infinite}
  .conn-path   {animation:connDraw 1.4s ease-out forwards;stroke-dasharray:600;stroke-dashoffset:600}

  .hov{transition:transform .16s ease,border-color .16s ease,box-shadow .16s ease !important}
  .hov:hover{transform:translateY(-2px) !important;border-color:rgba(34,211,238,.55) !important;box-shadow:0 6px 28px rgba(34,211,238,.2) !important;cursor:pointer}
  .ghov{transition:background .12s ease !important}
  .ghov:hover{background:rgba(34,211,238,.08) !important;cursor:pointer}
  .tbtn{transition:all .18s ease !important;cursor:pointer}
  .tbtn:hover{color:#22d3ee !important}
  .abtn{transition:all .18s ease !important}
  .abtn:hover{transform:scale(1.05) !important;box-shadow:0 0 32px rgba(34,211,238,.6) !important}
`;

/* ═══════════════════════ TYPES ════════════════════════════════════════════ */
type Team   = {name:string;abbr:string;flag:string;p:number;w:number;d:number;l:number;gs:number;ga:number;pts:number;form:string[]};
type Group  = {id:string;teams:Team[]};
type BM     = {h:string;hf:string;hs:string|null;a:string;af:string;as_:string|null;st:string;venue:string};
type LM     = {id:number;status:string;minute:number|null;hTeam:string;hFlag:string;aTeam:string;aFlag:string;hScore:number|null;aScore:number|null;venue:string;scorers:string[]};

/* ═══════════════════════ GROUP DATA ═══════════════════════════════════════ */
const GROUPS: Group[] = [
  {id:"A",teams:[{name:"Mexico",abbr:"MEX",flag:"🇲🇽",p:3,w:2,d:1,l:0,gs:7,ga:2,pts:7,form:["W","W","D"]},{name:"Ecuador",abbr:"ECU",flag:"🇪🇨",p:3,w:1,d:2,l:0,gs:4,ga:3,pts:5,form:["D","W","D"]},{name:"S.Korea",abbr:"KOR",flag:"🇰🇷",p:3,w:1,d:0,l:2,gs:3,ga:5,pts:3,form:["L","W","L"]},{name:"Sweden",abbr:"SWE",flag:"🇸🇪",p:3,w:0,d:1,l:2,gs:2,ga:6,pts:1,form:["D","L","L"]}]},
  {id:"B",teams:[{name:"Canada",abbr:"CAN",flag:"🇨🇦",p:3,w:2,d:1,l:0,gs:5,ga:2,pts:7,form:["W","D","W"]},{name:"Italy",abbr:"ITA",flag:"🇮🇹",p:3,w:1,d:1,l:1,gs:4,ga:3,pts:4,form:["W","D","L"]},{name:"Ecuador",abbr:"ECU",flag:"🇪🇨",p:3,w:1,d:0,l:2,gs:3,ga:5,pts:3,form:["L","W","L"]},{name:"Croatia",abbr:"CRO",flag:"🇭🇷",p:3,w:0,d:2,l:1,gs:2,ga:4,pts:2,form:["D","L","D"]}]},
  {id:"C",teams:[{name:"Brazil",abbr:"BRA",flag:"🇧🇷",p:3,w:3,d:0,l:0,gs:9,ga:2,pts:9,form:["W","W","W"]},{name:"Morocco",abbr:"MAR",flag:"🇲🇦",p:3,w:1,d:1,l:1,gs:4,ga:4,pts:4,form:["W","D","L"]},{name:"Scotland",abbr:"SCO",flag:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",p:3,w:1,d:0,l:2,gs:3,ga:6,pts:3,form:["W","L","L"]},{name:"Haiti",abbr:"HAI",flag:"🇭🇹",p:3,w:0,d:1,l:2,gs:2,ga:6,pts:1,form:["D","L","L"]}]},
  {id:"D",teams:[{name:"USA",abbr:"USA",flag:"🇺🇸",p:3,w:2,d:1,l:0,gs:6,ga:2,pts:7,form:["W","D","W"]},{name:"Netherlands",abbr:"NED",flag:"🇳🇱",p:3,w:1,d:1,l:1,gs:4,ga:4,pts:4,form:["D","W","L"]},{name:"Japan",abbr:"JPN",flag:"🇯🇵",p:3,w:1,d:0,l:2,gs:4,ga:5,pts:3,form:["W","L","L"]},{name:"Gambia",abbr:"GAM",flag:"🇬🇲",p:3,w:0,d:0,l:3,gs:1,ga:4,pts:0,form:["L","L","L"]}]},
  {id:"E",teams:[{name:"Germany",abbr:"GER",flag:"🇩🇪",p:3,w:2,d:1,l:0,gs:7,ga:3,pts:7,form:["W","W","D"]},{name:"Spain",abbr:"ESP",flag:"🇪🇸",p:3,w:1,d:1,l:1,gs:5,ga:4,pts:4,form:["D","L","W"]},{name:"Uruguay",abbr:"URU",flag:"🇺🇾",p:3,w:1,d:0,l:2,gs:4,ga:6,pts:3,form:["W","L","L"]},{name:"Tunisia",abbr:"TUN",flag:"🇹🇳",p:3,w:0,d:0,l:3,gs:1,ga:4,pts:0,form:["L","L","L"]}]},
  {id:"F",teams:[{name:"Colombia",abbr:"COL",flag:"🇨🇴",p:3,w:1,d:2,l:0,gs:5,ga:4,pts:5,form:["D","W","D"]},{name:"Portugal",abbr:"POR",flag:"🇵🇹",p:3,w:1,d:2,l:0,gs:5,ga:4,pts:5,form:["D","D","W"]},{name:"Ivory C.",abbr:"CIV",flag:"🇨🇮",p:3,w:0,d:2,l:1,gs:3,ga:4,pts:2,form:["D","L","D"]},{name:"S.Arabia",abbr:"KSA",flag:"🇸🇦",p:3,w:0,d:0,l:3,gs:1,ga:7,pts:0,form:["L","L","L"]}]},
  {id:"G",teams:[{name:"Belgium",abbr:"BEL",flag:"🇧🇪",p:3,w:2,d:0,l:1,gs:6,ga:4,pts:6,form:["W","L","W"]},{name:"Iran",abbr:"IRN",flag:"🇮🇷",p:3,w:1,d:2,l:0,gs:3,ga:2,pts:5,form:["D","W","D"]},{name:"Egypt",abbr:"EGY",flag:"🇪🇬",p:3,w:1,d:1,l:1,gs:3,ga:3,pts:4,form:["W","D","L"]},{name:"NZealand",abbr:"NZL",flag:"🇳🇿",p:3,w:0,d:1,l:2,gs:2,ga:5,pts:1,form:["D","L","L"]}]},
  {id:"H",teams:[{name:"France",abbr:"FRA",flag:"🇫🇷",p:3,w:3,d:0,l:0,gs:8,ga:1,pts:9,form:["W","W","W"]},{name:"Austria",abbr:"AUT",flag:"🇦🇹",p:3,w:1,d:1,l:1,gs:3,ga:3,pts:4,form:["W","D","L"]},{name:"Senegal",abbr:"SEN",flag:"🇸🇳",p:3,w:1,d:0,l:2,gs:3,ga:5,pts:3,form:["W","L","L"]},{name:"Qatar",abbr:"QAT",flag:"🇶🇦",p:3,w:0,d:1,l:2,gs:1,ga:6,pts:1,form:["L","D","L"]}]},
  {id:"I",teams:[{name:"Argentina",abbr:"ARG",flag:"🇦🇷",p:3,w:3,d:0,l:0,gs:8,ga:2,pts:9,form:["W","W","W"]},{name:"Peru",abbr:"PER",flag:"🇵🇪",p:3,w:1,d:1,l:1,gs:4,ga:4,pts:4,form:["D","W","L"]},{name:"Nigeria",abbr:"NGA",flag:"🇳🇬",p:3,w:0,d:2,l:1,gs:2,ga:4,pts:2,form:["D","L","D"]},{name:"Israel",abbr:"ISR",flag:"🇮🇱",p:3,w:0,d:1,l:2,gs:2,ga:6,pts:1,form:["D","L","L"]}]},
  {id:"J",teams:[{name:"England",abbr:"ENG",flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",p:3,w:2,d:1,l:0,gs:6,ga:2,pts:7,form:["W","W","D"]},{name:"Denmark",abbr:"DEN",flag:"🇩🇰",p:3,w:1,d:1,l:1,gs:4,ga:3,pts:4,form:["W","D","L"]},{name:"Serbia",abbr:"SRB",flag:"🇷🇸",p:3,w:1,d:0,l:2,gs:3,ga:5,pts:3,form:["W","L","L"]},{name:"Panama",abbr:"PAN",flag:"🇵🇦",p:3,w:0,d:0,l:3,gs:1,ga:4,pts:0,form:["L","L","L"]}]},
  {id:"K",teams:[{name:"Portugal",abbr:"POR",flag:"🇵🇹",p:3,w:2,d:1,l:0,gs:7,ga:2,pts:7,form:["W","D","W"]},{name:"Uzbekistan",abbr:"UZB",flag:"🇺🇿",p:3,w:1,d:1,l:1,gs:3,ga:3,pts:4,form:["D","W","L"]},{name:"Chile",abbr:"CHI",flag:"🇨🇱",p:3,w:1,d:0,l:2,gs:3,ga:5,pts:3,form:["W","L","L"]},{name:"Ghana",abbr:"GHA",flag:"🇬🇭",p:3,w:0,d:0,l:3,gs:1,ga:4,pts:0,form:["L","L","L"]}]},
  {id:"L",teams:[{name:"Croatia",abbr:"CRO",flag:"🇭🇷",p:3,w:2,d:1,l:0,gs:6,ga:2,pts:7,form:["W","D","W"]},{name:"Belarus",abbr:"BLR",flag:"🇧🇾",p:3,w:1,d:1,l:1,gs:3,ga:3,pts:4,form:["D","W","L"]},{name:"Algeria",abbr:"ALG",flag:"🇩🇿",p:3,w:1,d:0,l:2,gs:3,ga:5,pts:3,form:["W","L","L"]},{name:"China",abbr:"CHN",flag:"🇨🇳",p:3,w:0,d:0,l:3,gs:0,ga:1,pts:0,form:["L","L","L"]}]},
];

/* ═══════════════════════ BRACKET DATA ═════════════════════════════════════ */
// Format: [homeLabel, homeFlag, homeScore, awayLabel, awayFlag, awayScore, status, venue]
const LR32:BM[] = [
  {h:"MEX",hf:"🇲🇽",hs:"2",a:"MAR",af:"🇲🇦",as_:"1",st:"FT",venue:"MetLife"},
  {h:"COL",hf:"🇨🇴",hs:"3",a:"ESP",af:"🇪🇸",as_:"2",st:"FT",venue:"AT&T"},
  {h:"CAN",hf:"🇨🇦",hs:"1",a:"RSA",af:"🇿🇦",as_:"0",st:"FT",venue:"SoFi"},
  {h:"NED",hf:"🇳🇱",hs:"2",a:"PER",af:"🇵🇪",as_:"0",st:"FT",venue:"Levi's"},
  {h:"GER",hf:"🇩🇪",hs:"2",a:"AUT",af:"🇦🇹",as_:"1",st:"FT",venue:"Rose Bowl"},
  {h:"FRA",hf:"🇫🇷",hs:"3",a:"IRN",af:"🇮🇷",as_:"1",st:"FT",venue:"Allegiant"},
  {h:"BRA",hf:"🇧🇷",hs:"4",a:"JPN",af:"🇯🇵",as_:"1",st:"FT",venue:"Seattle"},
  {h:"USA",hf:"🇺🇸",hs:"2",a:"BLR",af:"🇧🇾",as_:"0",st:"FT",venue:"Kansas City"},
];
const LR16:BM[] = [
  {h:"MEX",hf:"🇲🇽",hs:"1",a:"COL",af:"🇨🇴",as_:"2",st:"FT",venue:"MetLife"},
  {h:"CAN",hf:"🇨🇦",hs:"1(4)",a:"NED",af:"🇳🇱",as_:"1(2)",st:"PEN",venue:"SoFi"},
  {h:"GER",hf:"🇩🇪",hs:"2",a:"FRA",af:"🇫🇷",as_:"3",st:"FT",venue:"AT&T"},
  {h:"BRA",hf:"🇧🇷",hs:"3",a:"USA",af:"🇺🇸",as_:"1",st:"FT",venue:"Rose Bowl"},
];
const LQF:BM[]  = [
  {h:"COL",hf:"🇨🇴",hs:"1",a:"NED",af:"🇳🇱",as_:"2",st:"FT",venue:"MetLife"},
  {h:"FRA",hf:"🇫🇷",hs:"2",a:"BRA",af:"🇧🇷",as_:"3",st:"FT",venue:"SoFi"},
];
const LSF:BM[]  = [{h:"NED",hf:"🇳🇱",hs:"0",a:"BRA",af:"🇧🇷",as_:"2",st:"FT",venue:"MetLife"}];

const RR32:BM[] = [
  {h:"ENG",hf:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",hs:"2",a:"POR",af:"🇵🇹",as_:"1",st:"FT",venue:"Dallas"},
  {h:"ARG",hf:"🇦🇷",hs:"2",a:"DEN",af:"🇩🇰",as_:"0",st:"FT",venue:"Miami"},
  {h:"BEL",hf:"🇧🇪",hs:"1",a:"SRB",af:"🇷🇸",as_:"0",st:"FT",venue:"Philly"},
  {h:"ITA",hf:"🇮🇹",hs:"2",a:"UZB",af:"🇺🇿",as_:"1",st:"FT",venue:"Boston"},
  {h:"CRO",hf:"🇭🇷",hs:"1",a:"ITA",af:"🇮🇹",as_:"0",st:"FT",venue:"Toronto"},
  {h:"URU",hf:"🇺🇾",hs:"0",a:"POR",af:"🇵🇹",as_:"1",st:"FT",venue:"Vancouver"},
  {h:"POR",hf:"🇵🇹",hs:"3",a:"KOR",af:"🇰🇷",as_:"1",st:"FT",venue:"Guadalajara"},
  {h:"EGY",hf:"🇪🇬",hs:"1",a:"SEN",af:"🇸🇳",as_:"3",st:"FT",venue:"Monterrey"},
];
const RR16:BM[] = [
  {h:"ENG",hf:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",hs:"1",a:"ARG",af:"🇦🇷",as_:"2",st:"FT",venue:"Dallas"},
  {h:"BEL",hf:"🇧🇪",hs:"0",a:"ITA",af:"🇮🇹",as_:"2",st:"FT",venue:"Miami"},
  {h:"POR",hf:"🇵🇹",hs:"2",a:"CRO",af:"🇭🇷",as_:"1",st:"FT",venue:"Boston"},
  {h:"SEN",hf:"🇸🇳",hs:"1(3)",a:"POR",af:"🇵🇹",as_:"1(1)",st:"PEN",venue:"Toronto"},
];
const RQF:BM[]  = [
  {h:"ARG",hf:"🇦🇷",hs:"3",a:"ITA",af:"🇮🇹",as_:"1",st:"FT",venue:"AT&T"},
  {h:"POR",hf:"🇵🇹",hs:"2",a:"URU",af:"🇺🇾",as_:"0",st:"FT",venue:"Dallas"},
];
const RSF:BM[]  = [{h:"ARG",hf:"🇦🇷",hs:"2",a:"POR",af:"🇵🇹",as_:"1",st:"FT",venue:"AT&T"}];

const LIVE_MATCHES: LM[] = [
  {id:1,status:"LIVE",minute:78,hTeam:"Brazil",hFlag:"🇧🇷",aTeam:"Argentina",aFlag:"🇦🇷",hScore:2,aScore:1,venue:"MetLife Stadium, New Jersey",scorers:["Vini Jr. 27'","Raphinha 72'","M. Álvarez 45+1'"]},
  {id:2,status:"HT",  minute:45,hTeam:"France", hFlag:"🇫🇷",aTeam:"England",  aFlag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",hScore:1,aScore:1,venue:"AT&T Stadium, Texas",    scorers:["Mbappé 22'","Bellingham 38'"]},
  {id:3,status:"LIVE",minute:34,hTeam:"Germany",hFlag:"🇩🇪",aTeam:"Spain",    aFlag:"🇪🇸",hScore:1,aScore:0,venue:"SoFi Stadium, Los Angeles",scorers:["Havertz 29'"]},
  {id:4,status:"TODAY",minute:null,hTeam:"USA", hFlag:"🇺🇸",aTeam:"Neth.",    aFlag:"🇳🇱",hScore:null,aScore:null,venue:"Levi's Stadium, San Francisco",scorers:[]},
];

const SCORERS = [
  {name:"K. Mbappé",flag:"🇫🇷",nation:"France",   goals:7,assists:3},
  {name:"L. Messi", flag:"🇦🇷",nation:"Argentina",goals:6,assists:5},
  {name:"Vini Jr.", flag:"🇧🇷",nation:"Brazil",   goals:6,assists:4},
  {name:"H. Kane",  flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",nation:"England",   goals:5,assists:2},
  {name:"M.Álvarez",flag:"🇦🇷",nation:"Argentina",goals:5,assists:1},
];

/* ═══════════════════════ CONNECTOR SVG ════════════════════════════════════
   Bracket layout (fixed pixel):
   Col widths: R32=115 R16=100 QF=88 SF=76 Final=180 [mirror] gap=6
   Total width: 938 + 8×6 = 986px, height: 416px (8×52)

   R32 card centers (y): 26,78,130,182,234,286,338,390
   R16 card centers (y): 52,156,260,364
   QF  card centers (y): 104,312
   SF  card center  (y): 208
   Final center     (y): 208

   x right-edges:  LR32=115, LR16=221, LQF=315, LSF=397, Final-L=403
   x left-edges:   RR32=871, RR16=765, RQF=671, RSF=589, Final-R=583
   connector midX: LR32-LR16=118, LR16-LQF=224, LQF-LSF=318, LSF-Final=400
                   RSF-Final=586, RQF-RSF=668, RR16-RQF=762, RR32-RR16=868
════════════════════════════════════════════════════════════════════════════ */
function BracketSVG() {
  const cn = {fill:"none",stroke:"rgba(34,211,238,.65)",strokeWidth:1.5,filter:"url(#cg)"} as React.SVGProps<SVGPathElement>;
  const cn2 = {fill:"none",stroke:"rgba(34,211,238,.75)",strokeWidth:1.8,filter:"url(#cg)"} as React.SVGProps<SVGPathElement>;
  const cn3 = {fill:"none",stroke:"rgba(34,211,238,.85)",strokeWidth:2.2,filter:"url(#cg)"} as React.SVGProps<SVGPathElement>;
  const gd  = {fill:"none",stroke:"rgba(255,213,74,.9)", strokeWidth:2.5,filter:"url(#gg)"} as React.SVGProps<SVGPathElement>;
  return (
    <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:5}} viewBox="0 0 986 416" preserveAspectRatio="none">
      <defs>
        <filter id="cg" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="b"/>
          <feColorMatrix in="b" type="matrix" values="0 0 0 0 .13  0 0 0 0 .83  0 0 0 0 .94  0 0 0 1 0" result="c"/>
          <feMerge><feMergeNode in="c"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="gg" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="b"/>
          <feColorMatrix in="b" type="matrix" values="0 0 0 0 1  0 0 0 0 .84  0 0 0 0 .29  0 0 0 1 0" result="c"/>
          <feMerge><feMergeNode in="c"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {/* ── LEFT R32 → R16 ── */}
      <g {...cn}>
        <path d="M115,26  H118 V52  H121"/><path d="M115,78  H118 V52"/>
        <path d="M115,130 H118 V156 H121"/><path d="M115,182 H118 V156"/>
        <path d="M115,234 H118 V260 H121"/><path d="M115,286 H118 V260"/>
        <path d="M115,338 H118 V364 H121"/><path d="M115,390 H118 V364"/>
      </g>
      {/* ── LEFT R16 → QF ── */}
      <g {...cn2}>
        <path d="M221,52  H224 V104 H227"/><path d="M221,156 H224 V104"/>
        <path d="M221,260 H224 V312 H227"/><path d="M221,364 H224 V312"/>
      </g>
      {/* ── LEFT QF → SF ── */}
      <g {...cn3}>
        <path d="M315,104 H318 V208 H321"/><path d="M315,312 H318 V208"/>
      </g>
      {/* ── LEFT SF → FINAL ── */}
      <path {...gd} d="M397,208 H403"/>
      {/* ── RIGHT R32 → R16 ── */}
      <g {...cn}>
        <path d="M871,26  H868 V52  H865"/><path d="M871,78  H868 V52"/>
        <path d="M871,130 H868 V156 H865"/><path d="M871,182 H868 V156"/>
        <path d="M871,234 H868 V260 H865"/><path d="M871,286 H868 V260"/>
        <path d="M871,338 H868 V364 H865"/><path d="M871,390 H868 V364"/>
      </g>
      {/* ── RIGHT R16 → QF ── */}
      <g {...cn2}>
        <path d="M765,52  H762 V104 H759"/><path d="M765,156 H762 V104"/>
        <path d="M765,260 H762 V312 H759"/><path d="M765,364 H762 V312"/>
      </g>
      {/* ── RIGHT QF → SF ── */}
      <g {...cn3}>
        <path d="M671,104 H668 V208 H665"/><path d="M671,312 H668 V208"/>
      </g>
      {/* ── RIGHT SF → FINAL ── */}
      <path {...gd} d="M589,208 H583"/>
    </svg>
  );
}

/* ═══════════════════════ BRACKET CARD (fixed 44px) ════════════════════════ */
function BC({ m, gold }: { m:BM; gold?:boolean }) {
  const hs = parseInt(m.hs||"0"), as_ = parseInt(m.as_||"0");
  const hw = hs > as_, aw = as_ > hs;
  const acc = gold ? "#ffd54a" : "#22d3ee";
  const bdr = gold ? "rgba(255,213,74,.4)" : "rgba(34,211,238,.22)";
  return (
    <div className="hov" style={{height:44,background:"rgba(2,8,20,.85)",border:`1px solid ${bdr}`,borderRadius:7,padding:"3px 7px",display:"flex",flexDirection:"column",justifyContent:"space-around",backdropFilter:"blur(6px)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:9.5,color:hw?"#e2e8f0":"rgba(255,255,255,.38)",fontWeight:hw?700:400}}>
        <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,flex:1,display:"flex",alignItems:"center",gap:3}}>
          <span style={{fontSize:10}}>{m.hf}</span> {m.h}
        </span>
        <strong style={{color:hw?acc:"rgba(255,255,255,.25)",flexShrink:0,minWidth:16,textAlign:"right" as const}}>{m.hs}</strong>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:9.5,color:aw?"#e2e8f0":"rgba(255,255,255,.38)",fontWeight:aw?700:400}}>
        <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,flex:1,display:"flex",alignItems:"center",gap:3}}>
          <span style={{fontSize:10}}>{m.af}</span> {m.a}
        </span>
        <strong style={{color:aw?acc:"rgba(255,255,255,.25)",flexShrink:0,minWidth:16,textAlign:"right" as const}}>{m.as_}</strong>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:7,color:"#1e3a5f",letterSpacing:0.5}}>
        <span style={{color:"#1e3a5f",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{m.venue}</span>
        <span style={{flexShrink:0,marginLeft:4,color:m.st==="PEN"?"#fbbf24":"#1e3a5f"}}>{m.st}</span>
      </div>
    </div>
  );
}

/* Each round column = 416px tall, items distributed with space-around */
function RCol({ matches, gold }: { matches:BM[]; gold?:boolean }) {
  return (
    <div style={{height:416,display:"flex",flexDirection:"column",justifyContent:"space-around"}}>
      {matches.map((m,i) => <BC key={i} m={m} gold={gold}/>)}
    </div>
  );
}

/* ═══════════════════════ GROUP TABLE ══════════════════════════════════════ */
function GroupCard({ g, onClick }: { g:Group; onClick:(t:Team)=>void }) {
  const gd = (t:Team) => t.gs - t.ga;
  return (
    <div style={{background:"linear-gradient(150deg,rgba(5,18,38,.96),rgba(2,10,22,.98))",border:"1px solid rgba(34,211,238,.16)",borderRadius:11,padding:"8px 9px",marginBottom:7}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,paddingBottom:5,borderBottom:"1px solid rgba(34,211,238,.1)"}}>
        <span style={{color:"#38dfff",fontWeight:900,fontSize:10,letterSpacing:3}}>GROUP {g.id}</span>
        <div style={{display:"flex",gap:3,color:"#1e3a5f",fontSize:8,letterSpacing:0.5}}>
          {["P","W","D","L","GD","PTS"].map(h => <span key={h} style={{width:h==="GD"?20:h==="PTS"?22:16,textAlign:"center" as const}}>{h}</span>)}
        </div>
      </div>
      {/* Teams */}
      {g.teams.map((t,i) => {
        const diff = gd(t);
        return (
          <div key={t.abbr} className="ghov" onClick={() => onClick(t)} style={{display:"flex",alignItems:"center",gap:2,padding:"4px 2px",borderTop:i===0?"none":"1px solid rgba(255,255,255,.05)",borderLeft:`2px solid ${i<2?"rgba(34,211,238,.5)":"transparent"}`,paddingLeft:i<2?6:8,marginLeft:-2,background:i<2?"rgba(34,211,238,.025)":"transparent"}}>
            <span style={{flex:1,display:"flex",alignItems:"center",gap:4,overflow:"hidden"}}>
              <span style={{fontSize:12}}>{t.flag}</span>
              <span style={{fontSize:10,fontWeight:i<2?700:400,color:i<2?"#e2e8f0":"#94a3b8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{t.abbr}</span>
            </span>
            {[t.p,t.w,t.d,t.l].map((v,j) => <span key={j} style={{width:16,textAlign:"center" as const,fontSize:9,color:"#64748b"}}>{v}</span>)}
            <span style={{width:20,textAlign:"center" as const,fontSize:9,color:diff>0?"#4ade80":diff<0?"#f87171":"#64748b"}}>{diff>0?"+":""}{diff}</span>
            <span style={{width:22,textAlign:"center" as const,fontSize:9,fontWeight:700,color:i<2?"#22d3ee":"#e2e8f0"}}>{t.pts}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════ LIVE MATCH CARD ══════════════════════════════════ */
function LiveCard({ m }: { m:LM }) {
  const live = m.status==="LIVE", ht = m.status==="HT";
  return (
    <div className="hov" style={{background:"linear-gradient(150deg,rgba(5,18,38,.96),rgba(2,10,22,.98))",border:`1px solid ${live?"rgba(239,68,68,.4)":ht?"rgba(251,191,36,.3)":"rgba(34,211,238,.18)"}`,borderRadius:14,padding:"14px 16px",boxShadow:live?"0 0 30px rgba(239,68,68,.12)":"none",position:"relative" as const,overflow:"hidden"}}>
      {live && <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,#ef4444,transparent)"}}/>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <span style={{display:"flex",alignItems:"center",gap:6}}>
          {live && <span className="blink" style={{width:7,height:7,borderRadius:"50%",background:"#ef4444",display:"inline-block"}}/>}
          <span style={{background:live?"#ef4444":ht?"#f59e0b":"#1d4ed8",color:"#fff",fontWeight:700,fontSize:9,padding:"3px 9px",borderRadius:4,letterSpacing:1.5}}>
            {live?`LIVE ${m.minute}'`:ht?"HALF TIME":m.status==="TODAY"?"TODAY":"FT"}
          </span>
        </span>
        <span style={{fontSize:9,color:"#334155"}}>{m.venue}</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",gap:10}}>
        <div style={{textAlign:"center" as const}}>
          <div style={{fontSize:34}}>{m.hFlag}</div>
          <div style={{fontWeight:700,fontSize:12,marginTop:4,letterSpacing:1}}>{m.hTeam}</div>
        </div>
        <div style={{textAlign:"center" as const}}>
          {m.hScore!==null
            ? <div style={{fontSize:30,fontWeight:900,color:"#fff",letterSpacing:3}}>{m.hScore}&nbsp;—&nbsp;{m.aScore}</div>
            : <div style={{fontSize:20,color:"#1e3a5f",fontWeight:700,letterSpacing:4}}>VS</div>}
        </div>
        <div style={{textAlign:"center" as const}}>
          <div style={{fontSize:34}}>{m.aFlag}</div>
          <div style={{fontWeight:700,fontSize:12,marginTop:4,letterSpacing:1}}>{m.aTeam}</div>
        </div>
      </div>
      {m.scorers.length>0 && (
        <div style={{marginTop:10,display:"flex",gap:10,flexWrap:"wrap" as const}}>
          {m.scorers.map((s,i) => <span key={i} style={{fontSize:9,color:"#475569"}}>⚽ {s}</span>)}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════ TEAM POPUP ═══════════════════════════════════════ */
function TeamPopup({ t, onClose }: { t:Team; onClose:()=>void }) {
  const gd = t.gs - t.ga;
  return (
    <div style={{position:"fixed" as const,inset:0,background:"rgba(0,0,0,.75)",backdropFilter:"blur(12px)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center" as const}} onClick={onClose}>
      <div className="fadein" onClick={e=>e.stopPropagation()} style={{background:"linear-gradient(150deg,#07182e,#040e1e)",border:"1px solid rgba(34,211,238,.35)",borderRadius:20,padding:28,width:360,maxWidth:"92vw",boxShadow:"0 0 70px rgba(34,211,238,.2)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
          <div>
            <div style={{fontSize:48,marginBottom:6,lineHeight:1}}>{t.flag}</div>
            <div style={{fontWeight:900,fontSize:22,letterSpacing:1}}>{t.name}</div>
            <div style={{color:"#22d3ee",fontSize:11,letterSpacing:3,marginTop:2}}>{t.abbr}</div>
          </div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",color:"#fff",borderRadius:8,padding:"6px 11px",cursor:"pointer",fontSize:14}}>✕</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:18}}>
          {[["P",t.p],["W",t.w],["D",t.d],["L",t.l],["GF",t.gs],["GA",t.ga]].map(([l,v]) => (
            <div key={l as string} style={{background:"rgba(34,211,238,.06)",border:"1px solid rgba(34,211,238,.13)",borderRadius:10,padding:"10px 0",textAlign:"center" as const}}>
              <div style={{fontSize:22,fontWeight:900,color:"#22d3ee"}}>{v}</div>
              <div style={{fontSize:9,color:"#475569",letterSpacing:1,marginTop:2}}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:9,color:"#475569",letterSpacing:2,marginBottom:7}}>RECENT FORM</div>
          <div style={{display:"flex",gap:5}}>
            {t.form.map((f,i) => {
              const c = f==="W"?"#4ade80":f==="D"?"#fbbf24":"#f87171";
              return <span key={i} style={{width:22,height:22,borderRadius:"50%",background:c,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900,color:"#000"}}>{f}</span>;
            })}
          </div>
        </div>
        <div style={{background:"linear-gradient(135deg,rgba(34,211,238,.1),rgba(14,165,233,.05))",border:"1px solid rgba(34,211,238,.2)",borderRadius:12,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:10,color:"#64748b",letterSpacing:1}}>GOAL DIFFERENCE</div>
            <div style={{fontSize:16,fontWeight:700,color:gd>0?"#4ade80":gd<0?"#f87171":"#fff",marginTop:2}}>{gd>0?"+":""}{gd}</div>
          </div>
          <div style={{textAlign:"right" as const}}>
            <div style={{fontSize:10,color:"#64748b",letterSpacing:1}}>POINTS</div>
            <div style={{fontSize:30,fontWeight:900,color:"#22d3ee"}}>{t.pts}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════ LEGEND ════════════════════════════════════════════ */
function Legend() {
  const items = [
    {col:"#ef4444",label:"Live Match"},
    {col:"#f59e0b",label:"Half Time"},
    {col:"#6b7280",label:"Full Time"},
    {col:"#22d3ee",label:"Extra Time"},
    {col:"#a78bfa",label:"Penalties"},
    {col:"#fbbf24",label:"Yellow Card"},
    {col:"#f87171",label:"Red Card"},
    {col:"#4ade80",label:"Goal"},
    {col:"#38bdf8",label:"VAR Review"},
  ];
  return (
    <div style={{display:"flex",gap:12,flexWrap:"wrap" as const,padding:"6px 0",borderTop:"1px solid rgba(34,211,238,.08)",marginTop:8}}>
      {items.map(it => (
        <span key={it.label} style={{display:"flex",alignItems:"center",gap:4,fontSize:9,color:"#475569"}}>
          <span style={{width:7,height:7,borderRadius:"50%",background:it.col,display:"inline-block",flexShrink:0}}/>
          {it.label}
        </span>
      ))}
    </div>
  );
}

/* ═══════════════════════ MAIN PAGE ════════════════════════════════════════ */
export default function Home() {
  const [clock,     setClock]     = useState("--:--:--");
  const [tab,       setTab]       = useState<"bracket"|"groups"|"live"|"stats">("bracket");
  const [liveData,  setLiveData]  = useState<LM[]>(LIVE_MATCHES);
  const [popup,     setPopup]     = useState<Team|null>(null);
  const [lastSync,  setLastSync]  = useState("");
  const liveCount = liveData.filter(m=>m.status==="LIVE").length;

  useEffect(()=>{
    const tick=()=>{
      const now = new Date();
      setClock(now.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}));
      setLastSync(now.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit",hour12:true}));
    };
    tick(); const id=setInterval(tick,1000); return ()=>clearInterval(id);
  },[]);

  useEffect(()=>{
    const load=async()=>{try{const r=await fetch("/api/live-scores");const d=await r.json();setLiveData(d.matches);}catch{}};
    load(); const id=setInterval(load,20000); return ()=>clearInterval(id);
  },[]);

  const liveMain = liveData.find(m=>m.status==="LIVE") || liveData[0];

  return (
    <>
      <style dangerouslySetInnerHTML={{__html:CSS}}/>
      {popup && <TeamPopup t={popup} onClose={()=>setPopup(null)}/>}

      <main style={{minHeight:"100vh",background:"radial-gradient(ellipse at 40% 0%,#0c2340 0%,#051425 30%,#020c1a 60%,#010508 100%)",color:"#fff",fontFamily:"'Arial',sans-serif",overflowX:"hidden" as const}}>

        {/* Background glows */}
        <div style={{position:"fixed" as const,inset:0,pointerEvents:"none" as const,zIndex:0}}>
          <div style={{position:"absolute",top:"-15%",left:"25%",width:"55vw",height:"55vw",borderRadius:"50%",background:"radial-gradient(circle,rgba(34,211,238,.035),transparent 65%)"}}/>
          <div style={{position:"absolute",top:"15%",right:"5%",width:"35vw",height:"35vw",borderRadius:"50%",background:"radial-gradient(circle,rgba(255,213,74,.025),transparent 65%)"}}/>
        </div>

        {/* ════ HEADER ════ */}
        <header style={{position:"sticky" as const,top:0,zIndex:90,background:"rgba(1,4,12,.9)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(34,211,238,.14)"}}>

          {/* Top info bar */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 18px",borderBottom:"1px solid rgba(34,211,238,.06)",fontSize:9}}>
            <div style={{display:"flex",gap:14,alignItems:"center"}}>
              {liveCount>0&&<span style={{display:"flex",alignItems:"center",gap:5,background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.3)",borderRadius:4,padding:"2px 8px",fontWeight:700,letterSpacing:1.5}}>
                <span className="blink" style={{width:5,height:5,borderRadius:"50%",background:"#ef4444",display:"inline-block"}}/>
                {liveCount} LIVE {liveCount>1?"MATCHES":"MATCH"}
              </span>}
              <span style={{color:"#1e3a5f"}}>Updated: {lastSync}</span>
            </div>
            <div style={{display:"flex",gap:16,color:"#1e3a5f"}}>
              <span>🌐 Auto-timezone</span><span>🌍 EN | ES | FR | PT</span><span>📡 Live Sync</span>
            </div>
          </div>

          {/* Main header */}
          <div style={{display:"grid",gridTemplateColumns:"auto 1fr auto",alignItems:"center",gap:16,padding:"10px 18px"}}>
            {/* Logo */}
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <div style={{background:"linear-gradient(135deg,#1d4ed8,#1e3a8a)",border:"1px solid rgba(34,211,238,.4)",borderRadius:10,padding:"8px 12px",textAlign:"center" as const,lineHeight:1.3}}>
                <div style={{fontWeight:900,fontSize:14,letterSpacing:2}}>FIFA</div>
                <div style={{fontSize:8,color:"#ffd54a",letterSpacing:1}}>WORLD CUP</div>
                <div style={{fontSize:11,fontWeight:700,color:"#38dfff"}}>2026</div>
              </div>
              <div>
                <div style={{fontSize:9,color:"#38dfff",letterSpacing:3,fontWeight:700}}>OFFICIAL</div>
                <div style={{fontSize:9,color:"#1e3a5f",letterSpacing:1}}>TOURNAMENT DASHBOARD</div>
              </div>
            </div>
            {/* Title */}
            <div style={{textAlign:"center" as const}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"center" as const,gap:10,lineHeight:1}}>
                <span style={{fontSize:46,fontWeight:900,color:"#ffd54a",textShadow:"0 0 40px rgba(255,213,74,.6)"}}>20</span>
                <div>
                  <div style={{fontSize:24,fontWeight:900,letterSpacing:5,background:"linear-gradient(90deg,#38dfff,#fff,#ffd54a)",WebkitBackgroundClip:"text" as const,WebkitTextFillColor:"transparent" as const}}>FIFA WORLD CUP</div>
                  <div style={{fontSize:10,color:"#38dfff",letterSpacing:7,marginTop:2}}>UNITED STATES&nbsp;·&nbsp;<span style={{color:"#f87171"}}>CANADA</span>&nbsp;·&nbsp;MEXICO</div>
                </div>
                <span style={{fontSize:46,fontWeight:900,color:"#ffd54a",textShadow:"0 0 40px rgba(255,213,74,.6)"}}>26</span>
              </div>
            </div>
            {/* Clock + CTA */}
            <div style={{display:"flex",flexDirection:"column" as const,alignItems:"flex-end" as const,gap:8}}>
              <div style={{display:"flex",alignItems:"center",gap:8,background:"rgba(0,0,0,.5)",border:"1px solid rgba(34,211,238,.18)",borderRadius:8,padding:"6px 13px"}}>
                <span className="blink" style={{width:6,height:6,borderRadius:"50%",background:"#22c55e",display:"inline-block"}}/>
                <span style={{fontWeight:700,fontVariantNumeric:"tabular-nums",fontSize:15,letterSpacing:1}}>{clock}</span>
                <span style={{color:"#1e3a5f",fontSize:9}}>LOCAL</span>
              </div>
              <a href="https://buy.stripe.com/test_eVq5kw6FVfCk9cL97K6oo00" target="_blank" rel="noopener noreferrer" className="abtn" style={{display:"inline-block",background:"linear-gradient(135deg,#22d3ee,#0ea5e9)",color:"#000",fontWeight:900,fontSize:13,padding:"9px 20px",borderRadius:24,textDecoration:"none",boxShadow:"0 0 28px rgba(34,211,238,.5)",letterSpacing:0.5,whiteSpace:"nowrap" as const}}>
                Get Access — £4.99
              </a>
            </div>
          </div>

          {/* Tabs */}
          <div style={{display:"flex",gap:0,borderTop:"1px solid rgba(34,211,238,.07)"}}>
            {(["bracket","groups","live","stats"] as const).map(t=>(
              <button key={t} className="tbtn" onClick={()=>setTab(t)} style={{padding:"10px 22px",background:"transparent",border:"none",color:tab===t?"#22d3ee":"#334155",fontWeight:tab===t?700:400,fontSize:11,letterSpacing:2,borderBottom:tab===t?"2px solid #22d3ee":"2px solid transparent",textTransform:"uppercase" as const}}>
                {t==="bracket"?"🏟 Bracket":t==="groups"?"📊 Groups":t==="live"?"⚽ Live":"📈 Stats"}
              </button>
            ))}
          </div>
        </header>

        <div style={{position:"relative" as const,zIndex:1}}>

          {/* ════ BRACKET TAB ════ */}
          {tab==="bracket"&&(
            <div className="fadein" style={{display:"grid",gridTemplateColumns:"200px minmax(0,1fr) 200px",gap:10,padding:"10px"}}>

              {/* Left groups A–F */}
              <aside>
                <div style={{color:"#38dfff",fontSize:9,letterSpacing:4,textAlign:"center" as const,marginBottom:8,fontWeight:700}}>GROUP STAGE · A–F</div>
                {GROUPS.slice(0,6).map(g=><GroupCard key={g.id} g={g} onClick={setPopup}/>)}
              </aside>

              {/* Centre */}
              <section>
                <div style={{color:"#38dfff",fontSize:9,letterSpacing:4,textAlign:"center" as const,marginBottom:8,fontWeight:700}}>KNOCKOUT STAGE</div>

                {/* Bracket shell */}
                <div className="neon-box" style={{border:"1px solid rgba(34,211,238,.16)",borderRadius:14,padding:"10px 8px",background:"linear-gradient(180deg,rgba(3,10,22,.96),rgba(1,5,12,.98)"}}>

                  {/* Round labels */}
                  <div style={{display:"grid",gridTemplateColumns:"115px 100px 88px 76px 180px 76px 88px 100px 115px",gap:"6px",color:"#1e3a5f",fontSize:8,letterSpacing:1,marginBottom:8,textAlign:"center" as const,textTransform:"uppercase" as const}}>
                    <span>Round of 32</span><span>Round of 16</span><span>Quarters</span><span>Semis</span>
                    <span style={{color:"rgba(255,213,74,.6)",fontWeight:700}}>Final</span>
                    <span>Semis</span><span>Quarters</span><span>Round of 16</span><span>Round of 32</span>
                  </div>

                  {/* Bracket grid with SVG overlay */}
                  <div style={{position:"relative" as const,width:986,minWidth:986}}>
                    <BracketSVG/>
                    <div style={{display:"grid",gridTemplateColumns:"115px 100px 88px 76px 180px 76px 88px 100px 115px",gap:"6px"}}>
                      <RCol matches={LR32}/>
                      <RCol matches={LR16}/>
                      <RCol matches={LQF}/>
                      <RCol matches={LSF}/>

                      {/* FINAL */}
                      <div className="gold-box" style={{height:416,border:"1px solid rgba(255,213,74,.5)",borderRadius:14,background:"radial-gradient(ellipse at 50% 25%,rgba(255,213,74,.16),rgba(0,0,0,.7))",display:"flex",flexDirection:"column" as const,alignItems:"center",justifyContent:"center",textAlign:"center" as const,padding:"14px 12px",gap:4,position:"relative" as const,zIndex:3}}>
                        <div className="trophy" style={{fontSize:42,lineHeight:1}}>🏆</div>
                        <div style={{color:"#ffd54a",fontWeight:900,fontSize:13,letterSpacing:3,marginTop:6}}>FINAL</div>
                        <div style={{color:"#475569",fontSize:8}}>JULY 19, 2026</div>
                        <div style={{color:"#334155",fontSize:7}}>METLIFE STADIUM</div>
                        <div style={{marginTop:10,width:"100%",background:"rgba(0,0,0,.4)",borderRadius:10,padding:"10px 8px",border:"1px solid rgba(255,213,74,.2)"}}>
                          <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",gap:4}}>
                            <div style={{textAlign:"center" as const}}><div style={{fontSize:22}}>🇧🇷</div><div style={{fontWeight:700,fontSize:10,marginTop:2}}>BRAZIL</div></div>
                            <div style={{fontSize:22,fontWeight:900,color:"#ffd54a",letterSpacing:1}}>2—1</div>
                            <div style={{textAlign:"center" as const}}><div style={{fontSize:22}}>🇦🇷</div><div style={{fontWeight:700,fontSize:10,marginTop:2}}>ARGENTINA</div></div>
                          </div>
                          <div style={{marginTop:8,fontSize:8,color:"#475569",lineHeight:1.9}}>
                            <div>⚽ Vini Jr. 27' · Raphinha 72'</div>
                            <div>⚽ M. Álvarez 45+1'</div>
                          </div>
                        </div>
                        <div style={{fontSize:8,color:"#334155",borderTop:"1px solid rgba(255,213,74,.1)",paddingTop:7,width:"100%",marginTop:4}}>3RD · 🇵🇹 POR 2–1 URU 🇺🇾</div>
                        <div style={{color:"#22d3ee",fontSize:8,fontWeight:700,letterSpacing:2}}>🇧🇷 CHAMPIONS</div>
                      </div>

                      <RCol matches={RSF}/>
                      <RCol matches={RQF}/>
                      <RCol matches={RR16}/>
                      <RCol matches={RR32}/>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <Legend/>

                {/* Bottom panels */}
                <div style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 0.85fr 1fr",gap:8,marginTop:10}}>

                  {/* Live Match Center */}
                  <div style={{background:"linear-gradient(150deg,rgba(5,18,38,.96),rgba(2,10,22,.98))",border:"1px solid rgba(34,211,238,.18)",borderRadius:14,padding:"12px 14px"}}>
                    <div style={{color:"#67e8f9",fontWeight:700,fontSize:10,letterSpacing:2,marginBottom:10,textTransform:"uppercase" as const}}>⚽ LIVE MATCH CENTER</div>
                    {liveMain&&(
                      <>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                          <span style={{display:"flex",alignItems:"center",gap:5,background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.35)",borderRadius:4,padding:"3px 9px"}}>
                            <span className="blink" style={{width:6,height:6,borderRadius:"50%",background:"#ef4444",display:"inline-block"}}/>
                            <span style={{fontSize:9,fontWeight:700,color:"#ef4444",letterSpacing:1.5}}>LIVE {liveMain.minute}'</span>
                          </span>
                          <span style={{fontSize:8,color:"#334155"}}>{liveMain.venue}</span>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",gap:8}}>
                          <div style={{textAlign:"center" as const}}><div style={{fontSize:32}}>{liveMain.hFlag}</div><div style={{fontWeight:700,fontSize:11,marginTop:3}}>{liveMain.hTeam}</div></div>
                          <div style={{textAlign:"center" as const,fontSize:28,fontWeight:900,color:"#fff",letterSpacing:3}}>{liveMain.hScore}–{liveMain.aScore}</div>
                          <div style={{textAlign:"center" as const}}><div style={{fontSize:32}}>{liveMain.aFlag}</div><div style={{fontWeight:700,fontSize:11,marginTop:3}}>{liveMain.aTeam}</div></div>
                        </div>
                        {liveMain.scorers.length>0&&<div style={{marginTop:8,display:"flex",flexWrap:"wrap" as const,gap:8}}>{liveMain.scorers.map((s,i)=><span key={i} style={{fontSize:8,color:"#475569"}}>⚽ {s}</span>)}</div>}
                        <div style={{marginTop:10,display:"grid",gridTemplateColumns:"auto 1fr auto",alignItems:"center",gap:6}}>
                          <span style={{fontSize:9,color:"#64748b"}}>56%</span>
                          <div style={{position:"relative" as const,height:5,background:"rgba(255,255,255,.07)",borderRadius:3,overflow:"hidden"}}>
                            <div style={{position:"absolute",left:0,top:0,height:"100%",width:"56%",background:"linear-gradient(90deg,rgba(34,211,238,.8),rgba(34,211,238,.4))",borderRadius:3}}/>
                          </div>
                          <span style={{fontSize:9,color:"#64748b"}}>44%</span>
                        </div>
                        <div style={{fontSize:8,color:"#1e3a5f",textAlign:"center" as const,marginTop:2,letterSpacing:1}}>POSSESSION</div>
                        <div style={{fontSize:8,color:"#334155",textAlign:"center" as const,marginTop:6}}>🏟 {liveMain.venue}</div>
                      </>
                    )}
                  </div>

                  {/* Top Scorers */}
                  <div style={{background:"linear-gradient(150deg,rgba(5,18,38,.96),rgba(2,10,22,.98))",border:"1px solid rgba(34,211,238,.18)",borderRadius:14,padding:"12px 14px"}}>
                    <div style={{color:"#67e8f9",fontWeight:700,fontSize:10,letterSpacing:2,marginBottom:8,textTransform:"uppercase" as const}}>👟 Top Scorers</div>
                    {SCORERS.map((s,i)=>(
                      <div key={s.name} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 0",borderTop:i===0?"none":"1px solid rgba(255,255,255,.05)",fontSize:10}}>
                        <span style={{color:"#1e3a5f",minWidth:16,fontWeight:700,fontSize:9}}>{i+1}</span>
                        <span>{s.flag}</span>
                        <span style={{flex:1,fontSize:9,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{s.name}</span>
                        <span style={{color:"#ffd54a",fontWeight:700}}>{s.goals}</span>
                        <span style={{fontSize:10}}>⚽</span>
                      </div>
                    ))}
                    <button style={{marginTop:8,width:"100%",background:"rgba(34,211,238,.07)",border:"1px solid rgba(34,211,238,.2)",color:"#22d3ee",borderRadius:6,padding:"5px",fontSize:9,fontWeight:700,cursor:"pointer",letterSpacing:1}}>VIEW ALL</button>
                  </div>

                  {/* Tournament Stats */}
                  <div style={{background:"linear-gradient(150deg,rgba(5,18,38,.96),rgba(2,10,22,.98))",border:"1px solid rgba(34,211,238,.18)",borderRadius:14,padding:"12px 14px"}}>
                    <div style={{color:"#67e8f9",fontWeight:700,fontSize:10,letterSpacing:2,marginBottom:8,textTransform:"uppercase" as const}}>📊 Tournament Stats</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
                      {[["48","MATCHES","#22d3ee"],["128","GOALS","#ffd54a"],["2.67","AVG GOALS","#4ade80"],["312","YELLOWS","#fbbf24"],["14","REDS","#f87171"],["2.1M+","ATTENDANCE","#a78bfa"]].map(([v,l,c])=>(
                        <div key={l} style={{background:"rgba(0,0,0,.4)",border:"1px solid rgba(255,255,255,.06)",borderRadius:9,padding:"9px 10px"}}>
                          <div style={{fontSize:20,fontWeight:900,color:c}}>{v}</div>
                          <div style={{fontSize:8,color:"#334155",letterSpacing:1,marginTop:1}}>{l}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Features */}
                  <div style={{background:"linear-gradient(150deg,rgba(5,18,38,.96),rgba(2,10,22,.98))",border:"1px solid rgba(34,211,238,.18)",borderRadius:14,padding:"12px 14px"}}>
                    <div style={{color:"#67e8f9",fontWeight:700,fontSize:10,letterSpacing:2,marginBottom:6,textTransform:"uppercase" as const}}>✨ Features</div>
                    {["🔴 Live Scores","📈 Team Stats","👤 Player Stats","📅 Fixtures","🏆 Standings","📰 News & Highlights"].map((f,i)=>(
                      <div key={f} style={{padding:"5px 0",fontSize:9,color:"#64748b",borderTop:i===0?"none":"1px solid rgba(255,255,255,.04)",display:"flex",alignItems:"center",gap:5}}>{f}</div>
                    ))}
                  </div>

                  {/* Mobile App */}
                  <div style={{background:"linear-gradient(150deg,rgba(5,18,38,.96),rgba(2,10,22,.98))",border:"1px solid rgba(34,211,238,.18)",borderRadius:14,padding:"12px 14px"}}>
                    <div style={{color:"#67e8f9",fontWeight:700,fontSize:10,letterSpacing:2,marginBottom:8,textTransform:"uppercase" as const}}>📱 Mobile App</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                      {[{l:"Home",c:"🇧🇷 2–1 🇦🇷",s:"78' LIVE"},{l:"Bracket",c:"FINAL",s:"MetLife"},{l:"Standings",c:"A–L",s:"All Groups"},{l:"Brazil",c:"🏆 #1",s:"Champions"}].map(ph=>(
                        <div key={ph.l} className="hov" style={{background:"rgba(0,0,0,.4)",border:"1px solid rgba(34,211,238,.15)",borderRadius:10,padding:"10px 8px",textAlign:"center" as const}}>
                          <div style={{fontSize:8,color:"#38dfff",fontWeight:700,letterSpacing:1,marginBottom:5}}>{ph.l}</div>
                          <div style={{fontSize:12,fontWeight:900}}>{ph.c}</div>
                          <div style={{fontSize:8,color:"#334155",marginTop:2}}>{ph.s}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Right groups G–L */}
              <aside>
                <div style={{color:"#38dfff",fontSize:9,letterSpacing:4,textAlign:"center" as const,marginBottom:8,fontWeight:700}}>GROUP STAGE · G–L</div>
                {GROUPS.slice(6,12).map(g=><GroupCard key={g.id} g={g} onClick={setPopup}/>)}
              </aside>
            </div>
          )}

          {/* ════ GROUPS TAB ════ */}
          {tab==="groups"&&(
            <div className="fadein" style={{padding:14}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:12}}>
                {GROUPS.map(g=><GroupCard key={g.id} g={g} onClick={setPopup}/>)}
              </div>
            </div>
          )}

          {/* ════ LIVE TAB ════ */}
          {tab==="live"&&(
            <div className="fadein" style={{padding:14,maxWidth:860,margin:"0 auto"}}>
              <div style={{display:"grid",gap:12}}>
                {liveData.map(m=><LiveCard key={m.id} m={m}/>)}
              </div>
            </div>
          )}

          {/* ════ STATS TAB ════ */}
          {tab==="stats"&&(
            <div className="fadein" style={{padding:14}}>
              <div style={{display:"grid",gridTemplateColumns:"1.2fr 1fr",gap:14,maxWidth:900,margin:"0 auto"}}>
                <div style={{background:"linear-gradient(150deg,rgba(5,18,38,.96),rgba(2,10,22,.98))",border:"1px solid rgba(34,211,238,.18)",borderRadius:16,padding:"18px"}}>
                  <div style={{color:"#67e8f9",fontWeight:700,fontSize:11,letterSpacing:2,marginBottom:14,textTransform:"uppercase" as const}}>👟 Top Scorers</div>
                  {SCORERS.map((s,i)=>(
                    <div key={s.name} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderTop:i===0?"none":"1px solid rgba(255,255,255,.06)"}}>
                      <span style={{color:"#1e3a5f",minWidth:20,fontWeight:900,fontSize:14}}>{i+1}</span>
                      <span style={{fontSize:22}}>{s.flag}</span>
                      <div style={{flex:1}}><div style={{fontWeight:700,fontSize:12}}>{s.name}</div><div style={{fontSize:9,color:"#475569"}}>{s.nation}</div></div>
                      <div style={{textAlign:"right" as const}}><div style={{fontWeight:900,fontSize:20,color:"#ffd54a"}}>{s.goals}</div><div style={{fontSize:8,color:"#334155"}}>GOALS</div></div>
                      <div style={{textAlign:"right" as const,marginLeft:10}}><div style={{fontWeight:700,fontSize:16,color:"#22d3ee"}}>{s.assists}</div><div style={{fontSize:8,color:"#334155"}}>AST</div></div>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",flexDirection:"column" as const,gap:12}}>
                  <div style={{background:"linear-gradient(150deg,rgba(5,18,38,.96),rgba(2,10,22,.98))",border:"1px solid rgba(34,211,238,.18)",borderRadius:16,padding:"18px"}}>
                    <div style={{color:"#67e8f9",fontWeight:700,fontSize:11,letterSpacing:2,marginBottom:14}}>📊 TOURNAMENT OVERVIEW</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                      {[["48","PLAYED","#22d3ee"],["128","GOALS","#ffd54a"],["2.67","AVG/GAME","#4ade80"],["312","YELLOWS","#fbbf24"],["14","REDS","#f87171"],["2.1M+","ATTENDANCE","#a78bfa"]].map(([v,l,c])=>(
                        <div key={l} style={{background:"rgba(0,0,0,.4)",border:"1px solid rgba(255,255,255,.07)",borderRadius:12,padding:"14px 12px",textAlign:"center" as const}}>
                          <div style={{fontSize:24,fontWeight:900,color:c}}>{v}</div>
                          <div style={{fontSize:9,color:"#334155",letterSpacing:1,marginTop:4}}>{l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="gold-box" style={{background:"linear-gradient(150deg,rgba(5,18,38,.96),rgba(2,10,22,.98))",border:"1px solid rgba(255,213,74,.25)",borderRadius:16,padding:"18px"}}>
                    <div style={{color:"#ffd54a",fontWeight:700,fontSize:11,letterSpacing:2,marginBottom:14}}>🏆 CHAMPIONS</div>
                    <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:14,alignItems:"center"}}>
                      <div style={{fontSize:54,filter:"drop-shadow(0 0 20px rgba(255,213,74,.7))"}}>🇧🇷</div>
                      <div><div style={{fontWeight:900,fontSize:24}}>BRAZIL</div><div style={{color:"#ffd54a",fontSize:11,letterSpacing:2,marginTop:3}}>FIFA WORLD CUP 2026</div><div style={{color:"#475569",fontSize:10,marginTop:4}}>🏆 6th World Cup title</div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ════ FOOTER ════ */}
        <footer style={{marginTop:12,borderTop:"1px solid rgba(34,211,238,.1)",padding:"10px 18px",background:"rgba(0,0,0,.65)",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap" as const,gap:12}}>
          <div style={{display:"flex",gap:18,alignItems:"center",flexWrap:"wrap" as const}}>
            <strong style={{color:"#38dfff",fontSize:10,letterSpacing:2}}>DATA SOURCES</strong>
            {["FIFA API","Opta","Sportradar","API-Football"].map(s=><span key={s} style={{color:"#1e3a5f",fontSize:10}}>{s}</span>)}
            <span style={{color:"#22c55e",fontWeight:700,fontSize:10}}>● LIVE SYNC</span>
            <span style={{color:"#1e293b",fontSize:9}}>Auto-updates every 20s</span>
          </div>
          <div style={{display:"flex",gap:20,alignItems:"center"}}>
            <div style={{fontSize:9,color:"#334155"}}>
              <div style={{letterSpacing:1,marginBottom:2,color:"#1e3a5f"}}>TIMEZONE</div>
              <div>Auto-detected</div>
            </div>
            <div style={{fontSize:9,color:"#334155"}}>
              <div style={{letterSpacing:1,marginBottom:2,color:"#1e3a5f"}}>MULTI-LANGUAGE</div>
              <div style={{display:"flex",gap:8}}>{["EN","ES","FR","PT"].map(l=><span key={l} style={{color:l==="EN"?"#22d3ee":"#334155"}}>{l}</span>)}</div>
            </div>
            <div style={{fontSize:9,color:"#334155"}}>
              <div style={{letterSpacing:1,marginBottom:2,color:"#1e3a5f"}}>FOLLOW THE ACTION</div>
              <div style={{display:"flex",gap:8}}>{"𝕏 f ▶ 📸".split(" ").map(ic=><span key={ic} style={{cursor:"pointer",fontSize:13}}>{ic}</span>)}</div>
            </div>
            <div style={{fontSize:8,color:"#0f172a"}}>© 2026 World Cup LiveBoard</div>
          </div>
        </footer>
      </main>
    </>
  );
}
