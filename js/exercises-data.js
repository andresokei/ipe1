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
    ],
    solve:function(inputs){
      const {base, dias} = inputs;
      if(!base||!dias)return{NO_DERECHO:!0,msg:"Rellena todos los campos."};
      const diarios=base/30;
      let acumulado=0,pasos=[];
      
      pasos.push({
        label:"Base Reguladora Diaria",
        formula:"BR diaria = Base Cotización CC ÷ 30",
        operation:`${base} € ÷ 30 días`,
        val:`${diarios.toFixed(2)} €/día`,
        explanation:"Se divide la base cotización entre los 30 días del mes"
      });
      
      pasos.push({
        label:"Análisis de días de baja",
        formula:"Carencia primeros 3 días: 0%",
        operation:`Días de baja: ${dias}`,
        val:`${Math.max(0, dias-3)} días cobrados`,
        explanation:"Los 3 primeros días son de carencia y no se cobran"
      });
      
      if(dias<=3){
        return{NO_DERECHO:!0,msg:"Menos de 4 días: sin derecho a prestación",desglose:pasos}
      }
      
      // Calcular tramos
      let dias_4_15=0, importe_4_15=0, dias_16_20=0, importe_16_20=0, dias_21_mas=0, importe_21_mas=0;
      if(dias>=4){
        dias_4_15=Math.min(dias-3,12);
        importe_4_15=dias_4_15*diarios*0.6;
        acumulado+=importe_4_15;
        pasos.push({
          label:`Días 4–${Math.min(dias,15)}: 60% (Empresa)`,
          formula:"Importe = Días × BR diaria × 60%",
          operation:`${dias_4_15} × ${diarios.toFixed(2)} × 0,60`,
          val:`${importe_4_15.toFixed(2)} €`,
          explanation:"Pagado por el empresario. Se aplica el 60% de la BR"
        });
      }
      
      if(dias>15){
        dias_16_20=Math.min(dias-15,5);
        importe_16_20=dias_16_20*diarios*0.6;
        acumulado+=importe_16_20;
        pasos.push({
          label:`Días 16–${15+dias_16_20}: 60% (INSS)`,
          formula:"Importe = Días × BR diaria × 60%",
          operation:`${dias_16_20} × ${diarios.toFixed(2)} × 0,60`,
          val:`${importe_16_20.toFixed(2)} €`,
          explanation:"Pagado por el INSS a partir del día 16"
        });
      }
      
      if(dias>20){
        dias_21_mas=dias-20;
        importe_21_mas=dias_21_mas*diarios*0.75;
        acumulado+=importe_21_mas;
        pasos.push({
          label:`Días 21–${dias}: 75% (INSS)`,
          formula:"Importe = Días × BR diaria × 75%",
          operation:`${dias_21_mas} × ${diarios.toFixed(2)} × 0,75`,
          val:`${importe_21_mas.toFixed(2)} €`,
          explanation:"A partir del día 21 se aplica el 75% de la BR"
        });
      }
      
      pasos.push({
        label:"Total a cobrar",
        formula:"Suma de todos los tramos",
        val:`${acumulado.toFixed(2)} €`,
        hl:true,
        explanation:"Cantidad total que cobrará el trabajador por su IT"
      });
      
      return{
        resultado:acumulado.toFixed(2),
        diarios:diarios.toFixed(2),
        desglose:pasos
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
      const br_diaria=bccp/30+horas_extra/365;
      let acumulado=0,pasos=[];
      
      // Paso 1: Calcular BR
      pasos.push({
        label:"Base Reguladora Diaria",
        formula:"BR = (BCCP ÷ 30) + (Extras año anterior ÷ 365)",
        operation:`(${bccp} ÷ 30) + (${horas_extra} ÷ 365) = ${(bccp/30).toFixed(2)} + ${(horas_extra/365).toFixed(2)}`,
        val:`${br_diaria.toFixed(2)} €/día`,
        explanation:"Se divide BCCP entre 30 días y se suma el complemento de extras anuales dividido entre 365"
      });
      
      // Paso 2: Día 1 al 100%
      let importe_dia1=br_diaria;
      acumulado+=importe_dia1;
      pasos.push({
        label:`Día 1: Salario íntegro (100%)`,
        formula:"Importe día 1 = BR × 100%",
        operation:`${br_diaria.toFixed(2)} × 1,00`,
        val:`${importe_dia1.toFixed(2)} €`,
        explanation:"El primer día de AT/EP el empresario paga el salario completo"
      });
      
      // Paso 3: Días 2 en adelante al 75%
      let dias_restantes=dias-1;
      let importe_dias_75=br_diaria*dias_restantes*0.75;
      acumulado+=importe_dias_75;
      pasos.push({
        label:`Días 2–${dias}: 75% (Mutua/INSS)`,
        formula:"Importe = Días × BR × 75%",
        operation:`${dias_restantes} × ${br_diaria.toFixed(2)} × 0,75`,
        val:`${importe_dias_75.toFixed(2)} €`,
        explanation:"A partir del día 2, la Mutua o INSS paga el 75% de la BR diaria"
      });
      
      // Paso 4: Si hay baja parcial, aplicar 50%
      if(parcial){
        acumulado*=0.5;
        pasos.push({
          label:"Aplicar baja parcial (50%)",
          formula:"Total × 0,50",
          operation:`${(acumulado/0.5).toFixed(2)} × 0,50`,
          val:`${acumulado.toFixed(2)} €`,
          explanation:"Si la baja es parcial, se cobra el 50% de la cantidad total"
        });
      }
      
      // Resultado final
      pasos.push({
        label:"Total a cobrar",
        val:`${acumulado.toFixed(2)} €`,
        hl:true,
        explanation:`Prestación por IT por AT/EP: ${importe_dia1.toFixed(2)} € (día 1) + ${importe_dias_75.toFixed(2)} € (días 2-${dias})${parcial?" (aplicado 50% baja parcial)":""}`
      });
      
      return{
        resultado:acumulado.toFixed(2),
        diarios:br_diaria.toFixed(2),
        br:(bccp+horas_extra).toFixed(2),
        desglose:pasos
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
      
      let pasos=[];
      
      pasos.push({
        label:"Comprobar requisito de cotización",
        formula:"Mínimo: 360 días en últimos 6 años",
        operation:`Días cotizados: ${dias_cotiz}`,
        val:`${dias_cotiz>=360?"SÍ cumple":"NO cumple"}`,
        explanation:"Es obligatorio haber cotizado al menos 360 días en los últimos 6 años"
      });
      
      // Calcular duración
      let duracion;
      if(dias_cotiz<540)duracion=120;
      else if(dias_cotiz<720)duracion=180;
      else if(dias_cotiz<900)duracion=210;
      else if(dias_cotiz<1080)duracion=240;
      else if(dias_cotiz<1260)duracion=300;
      else if(dias_cotiz<1440)duracion=330;
      else if(dias_cotiz<1620)duracion=360;
      else if(dias_cotiz<1800)duracion=420;
      else if(dias_cotiz<1980)duracion=480;
      else if(dias_cotiz<2160)duracion=540;
      else duracion=720;
      
      pasos.push({
        label:"Duración de la prestación",
        formula:"Según tabla de días cotizados",
        operation:`${dias_cotiz} días → tramo ${dias_cotiz<540?"360-539":dias_cotiz<720?"540-719":dias_cotiz<900?"720-899":"..."}`,
        val:`${duracion} días (≈ ${(duracion/30).toFixed(1)} meses)`,
        explanation:"La duración máxima depende de los días totales cotizados según tabla oficial"
      });
      
      pasos.push({
        label:"Base Reguladora Diaria",
        formula:"BR = Base CP ÷ 1 mes",
        operation:`${base_180} € (media últimos 6 meses)`,
        val:`${base_180.toFixed(2)} €/mes`,
        explanation:"Se toma la base media de cotización de los últimos 180 días (6 meses)"
      });
      
      const meses_1_periodo=Math.ceil(duracion/30);
      const meses_2_periodo=Math.min(6,Math.ceil(duracion/30)+6);
      const prestacion_m1=base_180*0.7;
      const prestacion_m2=base_180*0.6;
      
      pasos.push({
        label:`Primeros ${meses_1_periodo} meses: 70%`,
        formula:"Importe = Base × 70%",
        operation:`${base_180.toFixed(2)} × 0,70`,
        val:`${prestacion_m1.toFixed(2)} €/mes`,
        explanation:`Durante los primeros ${meses_1_periodo} meses se cobra el 70% de la BR`
      });
      
      if(meses_2_periodo>meses_1_periodo){
        pasos.push({
          label:`Meses ${meses_1_periodo+1}–${meses_2_periodo}: 60%`,
          formula:"Importe = Base × 60%",
          operation:`${base_180.toFixed(2)} × 0,60`,
          val:`${prestacion_m2.toFixed(2)} €/mes`,
          explanation:`En los siguientes 6 meses se cobra el 60% de la BR`
        });
      }
      
      let acumulado=0;
      let desglose_meses=[];
      for(let mes=1;mes<=meses;mes++){
        if(mes<=meses_1_periodo){
          acumulado+=prestacion_m1;
          desglose_meses.push({
            label:`Mes ${mes}`,
            operation:`70% de ${base_180.toFixed(2)}`,
            val:`${prestacion_m1.toFixed(2)} €`
          });
        }else if(mes<=meses_2_periodo){
          acumulado+=prestacion_m2;
          desglose_meses.push({
            label:`Mes ${mes}`,
            operation:`60% de ${base_180.toFixed(2)}`,
            val:`${prestacion_m2.toFixed(2)} €`
          });
        }else{
          desglose_meses.push({
            label:`Mes ${mes}`,
            operation:"Prestación agotada",
            val:"0 €"
          });
        }
      }
      
      pasos.push(...desglose_meses);
      
      pasos.push({
        label:"Total por " + meses + " meses",
        formula:"Suma de prestaciones mensuales",
        val:`${acumulado.toFixed(2)} €`,
        hl:true,
        explanation:`Cantidad total a cobrar por desempleo en los ${meses} meses solicitados`
      });
      
      return{
        resultado:acumulado.toFixed(2),
        br:base_180.toFixed(2),
        duracion,
        desglose:pasos
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
      
      let pasos=[];
      
      pasos.push({
        label:"Verificar requisito de carencia",
        formula:"Según edad del progenitor",
        operation:`Edad: ${edad} años | Días cotizados: ${dias_vida}`,
        val:edad<21?"−":"Requerido",
        explanation:edad<21?"Menores de 21 años no necesitan período mínimo de cotización":"Verificar requisito según tramo de edad"
      });
      
      let carencia_ok=false, req_dias=0;
      if(edad<21){
        carencia_ok=true;
        req_dias=0;
      }else if(edad<26){
        carencia_ok=dias_vida>=90;
        req_dias=90;
      }else{
        carencia_ok=dias_vida>=180;
        req_dias=180;
      }
      
      if(!carencia_ok){
        const req_texto=edad<21?"sin requisitos":edad<26?"90 días":"180 días";
        return{NO_DERECHO:!0,msg:`Edad ${edad}: necesita ${req_texto} cotizados. Tiene: ${dias_vida} días.`,desglose:pasos};
      }
      
      pasos.push({
        label:"Cumplimiento de carencia",
        formula:"Requisito para edad " + edad,
        operation:`Necesita: ${req_dias} días mínimo | Tiene: ${dias_vida} días`,
        val:"✓ CUMPLE",
        explanation:"Se cumplen los requisitos de cotización para esta edad"
      });
      
      const diarios=base/30;
      pasos.push({
        label:"Base Reguladora Diaria",
        formula:"BR = Base CC mes anterior ÷ 30",
        operation:`${base} € ÷ 30 días`,
        val:`${diarios.toFixed(2)} €/día`,
        explanation:"Se divide la base cotización entre los 30 días del mes"
      });
      
      const dias_licencia=semanas*7;
      const total=diarios*dias_licencia;
      
      pasos.push({
        label:"Duración de la licencia",
        formula:"Semanas × 7 días",
        operation:`${semanas} semanas × 7`,
        val:`${dias_licencia} días`,
        explanation:`${adopcion?"Por adopción o acogimiento":"Maternidad/Paternidad biológica: mínimo 6 semanas obligatorias de forma ininterrumpida"}`
      });
      
      pasos.push({
        label:"Prestación por nacimiento",
        formula:"Importe = Días × BR diaria × 100%",
        operation:`${dias_licencia} × ${diarios.toFixed(2)} × 1,00`,
        val:`${total.toFixed(2)} €`,
        explanation:"Se cobra el 100% de la base reguladora diaria por cada día de licencia"
      });
      
      pasos.push({
        label:"Tipo de prestación",
        formula:adopcion?"Adopción o acogimiento":"Maternidad/Paternidad",
        val:adopcion?"Adopción o acogimiento":`Maternidad/Paternidad (desde 2023: ${semanas} semanas por progenitor)`,
        explanation:adopcion?"Ambos progenitores tienen derecho a 16 semanas ampliables":"Ambos progenitores pueden disfrutar este derecho de forma individual e intransferible"
      });
      
      pasos.push({
        label:"Total a cobrar",
        formula:"Suma total de la prestación",
        val:`${total.toFixed(2)} €`,
        hl:true,
        explanation:`Cantidad total de la prestación de maternidad/paternidad por ${semanas} semanas de licencia`
      });
      
      return{
        resultado:total.toFixed(2),
        br:base.toFixed(2),
        diarios:diarios.toFixed(2),
        desglose:pasos
      }
    }
  },
];
