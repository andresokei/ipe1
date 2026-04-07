const {useState, useEffect} = React;

function pickWeightedQuestions(pool,count){
  const remaining=pool.slice();
  const chosen=[];

  while(remaining.length&&chosen.length<count){
    const totalWeight=remaining.reduce((sum,q)=>sum+(q.exam?4:1),0);
    let target=Math.random()*totalWeight;
    let idx=0;

    for(;idx<remaining.length;idx++){
      target-=remaining[idx].exam?4:1;
      if(target<=0) break;
    }

    chosen.push(remaining.splice(idx,1)[0]);
  }

  return chosen;
}

function Welcome({onEnter}){
  const [val,setVal]=useState("");
  const clean=val.trim();
  return React.createElement("div",{className:"welcome-overlay"},
    React.createElement("div",{className:"welcome-card"},
      React.createElement("div",{className:"welcome-emoji"},"👋"),
      React.createElement("h2",null,"¡Bienvenido/a!"),
      React.createElement("p",null,"Elige un apodo para identificarte en la clasificación del test (opcional)."),
      React.createElement("input",{className:"welcome-input",placeholder:"Tu apodo… (opcional)",maxLength:20,value:val,onChange:e=>setVal(e.target.value),onKeyDown:e=>{if(e.key==="Enter")onEnter(clean||"Anónimo");},autoFocus:true}),
      React.createElement("button",{className:"welcome-btn",onClick:()=>onEnter(clean||"Anónimo")},"Entrar →")));
}

function QuestionCount({onSelect,totalQuestions}){
  const [val,setVal]=useState(Math.ceil(totalQuestions/2));
  return React.createElement("div",{className:"welcome-overlay"},
    React.createElement("div",{className:"welcome-card",style:{maxWidth:"480px"}},
      React.createElement("div",{className:"welcome-emoji"},"📝"),
      React.createElement("h2",null,"¿Cuántas preguntas?"),
      React.createElement("p",null,"Usa el slider para seleccionar el número de preguntas que deseas responder."),
      React.createElement("div",{style:{margin:"32px 0"}},
        React.createElement("input",{
          type:"range",
          min:1,
          max:totalQuestions,
          value:val,
          onChange:e=>setVal(parseInt(e.target.value)),
          style:{width:"100%",height:"6px",borderRadius:"3px",background:"var(--border)",outline:"none",WebkitAppearance:"none",appearance:"none",cursor:"pointer"}
        }),
        React.createElement("div",{style:{textAlign:"center",marginTop:"24px"}},
          React.createElement("div",{style:{fontFamily:"'Playfair Display',serif",fontSize:"56px",fontWeight:"800",color:"var(--gold)"}},val),
          React.createElement("div",{style:{fontSize:"14px",color:"var(--muted)",marginTop:"8px"}},"de "+totalQuestions+" preguntas"))),
      React.createElement("button",{className:"welcome-btn",onClick:()=>onSelect(val),style:{marginTop:"24px"}},"Comenzar →")));
}

function Block({section}){
  return React.createElement(React.Fragment,null,section.content.map((b,i)=>
    b.t==="text"?React.createElement("p",{key:i,className:"block-text"},b.v):
    b.t==="sub"?React.createElement("div",{key:i,className:"block-sub"},b.v):
    b.t==="formula"?React.createElement("div",{key:i,className:"block-formula"},React.createElement("span",{className:"block-icon"},"📐"),b.v):
    b.t==="tip"?React.createElement("div",{key:i,className:"block-tip"},React.createElement("span",{className:"block-icon"},"💡"),b.v):
    b.t==="table"?React.createElement("div",{key:i,className:"tbl-wrap"},React.createElement("table",null,
      React.createElement("thead",null,React.createElement("tr",null,b.h.map((h,j)=>React.createElement("th",{key:j},h)))),
      React.createElement("tbody",null,b.r.map((r,j)=>React.createElement("tr",{key:j},r.map((c,k)=>React.createElement("td",{key:k},c))))))):null));
}

function Calc({ex}){
  const normalizedInputs=ex.inputs.map(i=>({
    id:i.id||i.n,
    label:i.label||i.l,
    placeholder:i.placeholder||i.d||"",
    min:i.min,
    max:i.max
  }));
  const [inputs,setInputs]=useState(Object.fromEntries(normalizedInputs.map(i=>[i.id,i.placeholder])));
  const [results,setResults]=useState(null);
  const calc=()=>{
    const vals=Object.entries(inputs).reduce((a,[k,v])=>{a[k]=parseFloat(v)||0;return a},{});
    const rawResults=(ex.calc||ex.solve)(vals);
    if(Array.isArray(rawResults)){
      setResults(rawResults);
      return;
    }
    if(rawResults&&rawResults.NO_DERECHO){
      setResults([
        {label:"Sin derecho",val:rawResults.msg,hl:true},
        ...(rawResults.desglose||[]).map(item=>({label:"Detalle",val:item})),
      ]);
      return;
    }
    if(rawResults){
      const mappedResults=[];
      if(rawResults.resultado!==undefined)mappedResults.push({label:"Resultado",val:`${rawResults.resultado} €`,hl:true});
      if(rawResults.br!==undefined)mappedResults.push({label:"Base reguladora",val:`${rawResults.br} €`});
      if(rawResults.diarios!==undefined)mappedResults.push({label:"Importe diario",val:`${rawResults.diarios} €`});
      if(rawResults.duracion!==undefined)mappedResults.push({label:"Duracion",val:`${rawResults.duracion} dias`});
      if(rawResults.calculo)mappedResults.push({label:"Calculo",val:rawResults.calculo});
      if(rawResults.desglose)mappedResults.push(...rawResults.desglose.map(item=>({label:"Detalle",val:item})));
      setResults(mappedResults);
      return;
    }
    setResults([]);
  };
  return React.createElement("div",{className:"calc-card"},
    React.createElement("div",{className:"calc-head"},
      React.createElement("span",{className:"calc-icon"},ex.icon),
      React.createElement("div",null,
        React.createElement("div",{className:"calc-head-title"},ex.name||ex.title),
        React.createElement("div",{className:"calc-head-desc"},ex.desc||ex.description))),
    React.createElement("div",{className:"calc-inputs"},
      normalizedInputs.map(i=>React.createElement("div",{key:i.id},
        React.createElement("label",{className:"calc-label"},i.label),
        React.createElement("input",{className:"calc-input",type:"number",placeholder:i.placeholder,min:i.min,max:i.max,value:inputs[i.id],onChange:e=>setInputs({...inputs,[i.id]:e.target.value})})))),
    React.createElement("div",{className:"calc-btn-wrap"},
      React.createElement("button",{className:"calc-btn",onClick:calc},"Calcular")),
    results&&React.createElement("div",{className:"calc-results"},results.map((r,i)=>React.createElement("div",{key:i,className:`step${r.hl?" hl":""}`},
      React.createElement("div",{className:"step-label"},r.label),
      React.createElement("div",{className:"step-val"},r.val),
      r.note&&React.createElement("div",{className:"step-note"},r.note)))));
}

function Quiz({nick,qCount,onRestart}){
  const [qs]=useState(()=>pickWeightedQuestions(QUIZ,qCount));
  const [cur,setCur]=useState(0);
  const [sel,setSel]=useState(null);
  const [show,setShow]=useState(false);
  const [score,setScore]=useState(0);
  const [startMs]=useState(Date.now());
  const [saved,setSaved]=useState(false);
  const [showRanking,setShowRanking]=useState(false);
  const SHEET_URL="https://script.google.com/macros/d/YOUR_SHEET_ID/usercodeapp";

  const pick=i=>{if(show)return;setSel(i);setShow(true);if(i===qs[cur].c)setScore(s=>s+1);};
  const next=()=>{setSel(null);setShow(false);setCur(c=>c+1);};
  const restart=()=>{setSel(null);setShow(false);setCur(0);setScore(0);setSaved(false);setShowRanking(false);if(onRestart)onRestart();};

  useEffect(()=>{
    if(cur>=qs.length&&!saved&&nick){
      const elapsed=Math.round((Date.now()-startMs)/1000);
      const pts=Math.round((score/qs.length)*1000 - elapsed*0.5);
      const entry={nick,score,total:qs.length,pts:Math.max(pts,0),ts:Date.now()};
      fetch(SHEET_URL,{method:"POST",body:JSON.stringify(entry)}).finally(()=>setSaved(true));
    }
  },[cur,saved]);

  if(showRanking) return React.createElement(Ranking,{nick,onBack:()=>setShowRanking(false),onRestart:restart});

  if(cur>=qs.length){
    const pct=Math.round(score/qs.length*100);
    const clr=pct>=70?"var(--green)":pct>=50?"var(--gold)":"var(--terracotta)";
    return React.createElement("div",{className:"quiz-end"},
      React.createElement("div",{className:"quiz-end-emoji"},pct>=70?"🎉":pct>=50?"💪":"📚"),
      React.createElement("div",{className:"quiz-end-pct",style:{color:clr}},pct+"%"),
      React.createElement("div",{className:"quiz-end-label"},`${score} de ${qs.length} correctas`),
      React.createElement("p",{className:"quiz-end-msg"},pct>=70?"¡Excelente! Dominas el tema.":pct>=50?"Buen intento. Repasa los que fallaste.":"Necesitas repasar más. ¡Ánimo!"),
      React.createElement("div",{className:"quiz-end-btns"},
        React.createElement("button",{className:"quiz-restart",onClick:restart},"Repetir test"),
        React.createElement("button",{className:"quiz-ranking-btn",onClick:()=>setShowRanking(true)},"🏆 Ver clasificación")));
  }

  const q=qs[cur];
  return React.createElement("div",null,
    React.createElement("div",{className:"quiz-meta"},
      React.createElement("span",{className:"quiz-counter"},`Pregunta ${cur+1} / ${qs.length}`),
      React.createElement("span",{className:"quiz-score"},`${score} correctas`)),
    React.createElement("div",{className:"quiz-progress"},
      React.createElement("div",{className:"quiz-progress-fill",style:{width:`${cur/qs.length*100}%`}})),
    React.createElement("p",{className:"quiz-q"},q.q),
    React.createElement("div",{className:"quiz-options"},
      q.o.map((opt,i)=>{
        const cls=show?(i===q.c?"quiz-opt correct":i===sel?"quiz-opt wrong":"quiz-opt"):"quiz-opt";
        return React.createElement("button",{key:i,className:cls,onClick:()=>pick(i),disabled:show},
          React.createElement("span",{className:"quiz-letter"},show&&i===q.c?"✓":show&&i===sel?"✗":["A","B","C","D"][i]),opt);})),
    show&&React.createElement("div",{className:`quiz-feedback ${sel===q.c?"ok":"ko"}`},
      React.createElement("strong",null,sel===q.c?"✓ Correcto — ":"✗ Incorrecto — "),q.exp),
    show&&React.createElement("button",{className:"quiz-next",onClick:next},cur+1<qs.length?"Siguiente →":"Ver resultado"));
}

function Ranking({nick,onBack,onRestart}){
  const [rows,setRows]=useState(null);
  const SHEET_URL="https://script.google.com/macros/d/YOUR_SHEET_ID/usercodeapp";
  const load=async()=>{
    setRows(null);
    try{const res=await fetch(SHEET_URL);const data=await res.json();setRows(data);}
    catch(e){setRows([]);}
  };
  useEffect(()=>{load();},[]);
  const medals=["🥇","🥈","🥉"];
  return React.createElement("div",{className:"ranking-wrap"},
    React.createElement("div",{className:"ranking-head"},
      React.createElement("div",null,
        React.createElement("h3",null,"🏆 Clasificación"),
        React.createElement("p",null,"Mejores puntuaciones de la clase")),
      React.createElement("button",{className:"ranking-refresh",onClick:load},"↻ Actualizar")),
    rows===null
      ? React.createElement("div",{className:"ranking-empty"},"Cargando…")
      : rows.length===0
        ? React.createElement("div",{className:"ranking-empty"},"Todavía no hay puntuaciones. ¡Sé el primero!")
        : React.createElement("div",{className:"ranking-list"},
            rows.map((r,i)=>React.createElement("div",{key:r.nick,className:`ranking-row${r.nick===nick?" me":""}`},
              React.createElement("span",{className:`ranking-pos${i<3?" top":""}`},i<3?medals[i]:i+1),
              React.createElement("span",{className:"ranking-name"},r.nick),
              React.createElement("div",{className:"ranking-score"},r.pts),
              React.createElement("div",{className:"ranking-meta"},`${r.score}/${r.total} aciertos`)))),
    React.createElement("div",{style:{padding:"16px 28px",borderTop:"1px solid var(--border)",display:"flex",gap:10}},
      React.createElement("button",{className:"quiz-ranking-btn",style:{flex:1},onClick:onBack},"← Volver al test"),
      React.createElement("button",{className:"quiz-restart",style:{flex:1},onClick:onRestart},"Repetir test")));
}

const TABS=[
  {id:"teoria",   label:"Teoría",       emoji:"📖"},
  {id:"calc",     label:"Calculadora",  emoji:"🧮"},
  {id:"quiz",     label:"Test",         emoji:"✅"},
  {id:"ranking",  label:"Clasificación",emoji:"🏆"},
];
const TAB_TITLES={
  teoria:  {h:"La Seguridad",  em:"Social",        sub:"Selecciona una sección para estudiar el temario."},
  calc:    {h:"Calculadora de",em:"Prestaciones",  sub:"Modifica los valores y pulsa «Calcular» para ver la solución paso a paso."},
  quiz:    {h:"Test de",       em:"Autoevaluación",sub:"Responde a tu test de autoevaluación. ¡Consigue la mejor puntuación!"},
  ranking: {h:"Tabla de",      em:"Clasificación", sub:"Las mejores puntuaciones de la clase."},
};

function App(){
  const [nick,setNick]=useState(null);
  const [qCount,setQCount]=useState(null);
  const [tab,setTab]=useState("teoria");
  const [sec,setSec]=useState("bases");
  const cur=THEORY.find(s=>s.id===sec);
  const tt=TAB_TITLES[tab];

  return React.createElement(React.Fragment,null,
    React.createElement("nav",null,
      React.createElement("div",{className:"nav-brand"},React.createElement("span",{className:"nav-dot"}),"IPE I · Seguridad Social"),
      React.createElement("div",{className:"nav-right"},
        nick&&React.createElement("span",{className:"nav-nick",title:"Haz clic para cambiar de apodo",onClick:()=>setNick(null)},"👤 "+nick),
        React.createElement("span",{className:"nav-tag"},"Curso 2025–2026"))),

    React.createElement("div",{className:"tabs-bar"},
      TABS.map(t=>React.createElement("button",{key:t.id,
        className:`tab-btn${tab===t.id?" active":""}`,
        onClick:()=>setTab(t.id)},t.emoji," ",t.label))),

    React.createElement("main",null,
      React.createElement("div",{key:tab,className:"section-header",style:{animation:"fadeUp .3s ease both"}},
        React.createElement("h2",null,tt.h," ",React.createElement("em",null,tt.em)),
        React.createElement("p",null,tt.sub)),

      tab==="teoria"&&React.createElement(React.Fragment,null,
        React.createElement("div",{className:"eyebrow"},"Secciones"),
        React.createElement("div",{className:"pills"},
          THEORY.map(s=>React.createElement("button",{key:s.id,
            className:`pill${sec===s.id?" active":""}`,
            onClick:()=>setSec(s.id)},s.icon+"  "+s.title))),
        cur&&React.createElement("div",{key:sec,className:"theory-card"},
          React.createElement("div",{className:"theory-card-head"},
            React.createElement("span",{className:"theory-icon"},cur.icon),
            React.createElement("div",null,
              React.createElement("h2",null,cur.title),
              React.createElement("div",{className:"unit-tag"},"Seguridad Social · 2026"))),
          React.createElement("div",{className:"theory-body"},React.createElement(Block,{section:cur})))),

      tab==="calc"&&React.createElement("div",null,
        EXERCISES.map(ex=>React.createElement(Calc,{key:ex.id,ex:ex}))),

      tab==="quiz"&&React.createElement("div",{className:"quiz-wrap"},
        React.createElement("div",{className:"quiz-inner"},
          !nick
            ? React.createElement(Welcome,{onEnter:setNick})
            : !qCount
              ? React.createElement(QuestionCount,{onSelect:setQCount,totalQuestions:QUIZ.length})
              : React.createElement(Quiz,{nick,qCount,onRestart:()=>setQCount(null)}))),

      tab==="ranking"&&React.createElement(Ranking,{nick,onBack:()=>{setNick(null);setQCount(null);setTab("quiz");},onRestart:()=>{setNick(null);setQCount(null);setTab("quiz");}})),

    React.createElement("footer",null,
      React.createElement("div",null,React.createElement("strong",null,"IPE I")," · Seguridad Social"),
      React.createElement("div",null,"Curso 2025–2026")));
}

ReactDOM.render(React.createElement(App,null),document.getElementById("root"));
