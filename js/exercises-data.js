const EXERCISES=[
  {
    id:"it_comun",
    title:"Cálculo IT Enfermedad Común",
    icon:"💊",
    headBg:"#e8f5e9",
    headBorder:"#4caf50",
    headText:"#2e7d32",
    description:"Calcula la prestación por incapacidad temporal por enfermedad común según días de baja.",
    inputs:[
      {l:"Base de Cotización CC mes anterior (€):",t:"number",n:"base",d:"1800",min:"500",max:"5100"},
      {l:"Días de baja (carencia: 3 días sin cobro):",t:"number",n:"dias",d:"20",min:"1",max:"545"},
      {l:"¿Hay conflicto colectivo? (0=No, 1=Sí):",t:"number",n:"conflicto",d:"0",min:"0",max:"1"},
    ],
    solve:function(inputs){
      const {base, dias, conflicto} = inputs;
      if(!base||!dias||conflicto===undefined)return{NO_DERECHO:!0,msg:"Rellena todos los campos."};
      const diarios=base/30;
      let acumulado=0,desglose=[];
      if(dias<=3){
        desglose.push("Días 1–3: 0 % (carencia, no se cobra)");
        return{NO_DERECHO:!0,msg:"Menos de 4 días: solo carencia, sin prestación.",desglose}
      }
      dias>=4&&dias<=15&&(acumulado+=Math.min(dias-3,12)*diarios*0.6,desglose.push(`Días 4–${Math.min(dias,15)}: 60 % (pagada por empresario)`));
      dias>15&&dias<=20&&(acumulado+=5*diarios*0.6,desglose.push("Días 16–20: 60 % (pagada por INSS)"));
      dias>20&&(acumulado+=5*diarios*0.6+(dias-20)*diarios*0.75,desglose.push("Días 16–20: 60 %"),desglose.push(`Días 21–${dias}: 75 %`));
      conflicto&&(acumulado*=1.2,desglose.push("Conflicto colectivo: +20 %"));
      return{
        resultado:acumulado.toFixed(2),
        diarios:diarios.toFixed(2),
        desglose,
        calculo:`Días con cobro: ${Math.max(0,dias-3)} × ${diarios.toFixed(2)} €/día × % → ${acumulado.toFixed(2)} €`
      }
    }
  },
  {
    id:"it_at",
    title:"Cálculo IT por AT/EP",
    icon:"⚠️",
    headBg:"#fff3e0",
    headBorder:"#ff9800",
    headText:"#e65100",
    description:"Calcula la prestación por incapacidad temporal por accidente de trabajo o enfermedad profesional (100 % primer día, 75 % a partir del segundo).",
    inputs:[
      {l:"Base de Cotización CP mes anterior (€):",t:"number",n:"bccp",d:"1900",min:"500",max:"5100"},
      {l:"Horas extraordinarias año anterior (€):",t:"number",n:"horas_extra",d:"300",min:"0",max:"5000"},
      {l:"Días de baja:",t:"number",n:"dias",d:"30",min:"1",max:"365"},
      {l:"¿Baja parcial? (0=No, 1=Sí):",t:"number",n:"parcial",d:"0",min:"0",max:"1"},
    ],
    solve:function(inputs){
      const {bccp, horas_extra, dias, parcial} = inputs;
      if(!bccp||horas_extra===undefined||!dias||parcial===undefined)return{NO_DERECHO:!0,msg:"Rellena todos los campos."};
      const br=(bccp+horas_extra)/365,diarios=br/1;
      let acumulado=0;
      acumulado=diarios*100/100;
      acumulado+=diarios*(dias-1)*75/100;
      parcial&&(acumulado*=0.5);
      return{
        resultado:acumulado.toFixed(2),
        diarios:diarios.toFixed(2),
        br:br.toFixed(2),
        desglose:[
          `Primer día (100 %): ${diarios.toFixed(2)} €`,
          `Días 2–${dias} (75 %): ${(diarios*(dias-1)*0.75).toFixed(2)} €`,
          parcial?`Baja parcial (50 %): Total × 0,5`:"Sin baja parcial"
        ],
        calculo:`Día 1: ${diarios.toFixed(2)} + Días 2–${dias}: ${(diarios*(dias-1)*0.75).toFixed(2)} = ${acumulado.toFixed(2)} €`
      }
    }
  },
  {
    id:"desempleo",
    title:"Cálculo Desempleo",
    icon:"📉",
    headBg:"#f3e5f5",
    headBorder:"#9c27b0",
    headText:"#6a1b9a",
    description:"Calcula la duración de la prestación por desempleo según días cotizados y la cuantía mensual.",
    inputs:[
      {l:"Días cotizados en últimos 6 años:",t:"number",n:"dias_cotiz",d:"1260",min:"360",max:"2500"},
      {l:"Base de Cotización CP últimos 180 días (€):",t:"number",n:"base_180",d:"1800",min:"500",max:"5100"},
      {l:"Meses a calcular:",t:"number",n:"meses",d:"6",min:"1",max:"24"},
    ],
    solve:function(inputs){
      const {dias_cotiz, base_180, meses} = inputs;
      if(!dias_cotiz||!base_180||!meses)return{NO_DERECHO:!0,msg:"Rellena todos los campos."};
      if(dias_cotiz<360)return{NO_DERECHO:!0,msg:"Necesita ≥ 360 días. Actualmente: "+dias_cotiz+" días."};
      const br=base_180;
      let duracion;
      dias_cotiz<540?duracion=120:dias_cotiz<720?duracion=180:dias_cotiz<900?duracion=210:dias_cotiz<1080?duracion=240:dias_cotiz<1260?duracion=300:dias_cotiz<1440?duracion=330:dias_cotiz<1620?duracion=360:dias_cotiz<1800?duracion=420:dias_cotiz<1980?duracion=480:dias_cotiz<2160?duracion=540:duracion=720;
      const prestacion_m1=br*0.7,prestacion_m2=br*0.6;
      let acumulado=0,desglose=[];
      let mes_actual=1;
      for(;mes_actual<=meses;mes_actual++)mes_actual<=Math.ceil(duracion/30)?acumulado+=prestacion_m1:mes_actual<=Math.ceil(duracion/30)+6?acumulado+=prestacion_m2:desglose.push(`Mes ${mes_actual}: SIN COBRO (prestación agotada)`);
      desglose=[
        `Duración total: ${duracion} días = ${(duracion/30).toFixed(1)} meses (aprox.)`,
        `Primeros ${Math.ceil(duracion/30)} meses: 70 % × ${br.toFixed(2)} = ${prestacion_m1.toFixed(2)} €/mes`,
        `Meses ${Math.ceil(duracion/30)+1}–${Math.ceil(duracion/30)+6}: 60 % × ${br.toFixed(2)} = ${prestacion_m2.toFixed(2)} €/mes`,
        `Total ${meses} meses: ${acumulado.toFixed(2)} €`
      ];
      return{
        resultado:acumulado.toFixed(2),
        br:br.toFixed(2),
        duracion,
        desglose,
        calculo:`${duracion} días de duración. ${meses} meses × ${((meses<=Math.ceil(duracion/30))?70:60)}% = ${acumulado.toFixed(2)} €`
      }
    }
  },
  {
    id:"nacimiento",
    title:"Cálculo Nacimiento/Maternidad",
    icon:"👶",
    headBg:"#fce4ec",
    headBorder:"#e91e63",
    headText:"#880e4f",
    description:"Calcula la prestación por maternidad, paternidad, adopción o acogimiento análogo.",
    inputs:[
      {l:"Base de Cotización CC mes anterior (€):",t:"number",n:"base",d:"1800",min:"500",max:"5100"},
      {l:"Edad del progenitor:",t:"number",n:"edad",d:"28",min:"18",max:"65"},
      {l:"Días cotizados en toda la vida:",t:"number",n:"dias_vida",d:"1000",min:"0",max:"15000"},
      {l:"Semanas de licencia a cobrar:",t:"number",n:"semanas",d:"16",min:"6",max:"40"},
      {l:"¿Adopción o acogimiento? (0=No, 1=Sí):",t:"number",n:"adopcion",d:"0",min:"0",max:"1"},
    ],
    solve:function(inputs){
      const {base, edad, dias_vida, semanas, adopcion} = inputs;
      if(!base||!edad||dias_vida===undefined||!semanas||adopcion===undefined)return{NO_DERECHO:!0,msg:"Rellena todos los campos."};
      let carencia_ok=!1;
      edad<21?carencia_ok=!0:edad<26?carencia_ok=dias_vida>=90:carencia_ok=dias_vida>=180;
      if(!carencia_ok)return{NO_DERECHO:!0,msg:`Edad ${edad}: necesita ${edad<21?0:edad<26?90:180} días cotizados. Tiene: ${dias_vida} días.`};
      const br=base,diarios=br/30,acumulado=diarios*semanas*7;
      return{
        resultado:acumulado.toFixed(2),
        br:br.toFixed(2),
        diarios:diarios.toFixed(2),
        desglose:[
          `Carencia: SÍ (cumple requisito para edad ${edad})`,
          `BR = ${br.toFixed(2)} € ÷ 30 = ${diarios.toFixed(2)} €/día`,
          `Semanas de licencia: ${semanas} × 7 días = ${semanas*7} días`,
          `Total: ${semanas*7} días × ${diarios.toFixed(2)} €/día = ${acumulado.toFixed(2)} €`,
          adopcion?"Tipo: Adopción o acogimiento":`Tipo: Maternidad/Paternidad biológica (desde 2023: 16 semanas por progenitor)`
        ],
        calculo:`${semanas} semanas (${semanas*7} días) × ${diarios.toFixed(2)} €/día = ${acumulado.toFixed(2)} €`
      }
    }
  },
];
