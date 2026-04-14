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
      {l:"Días de baja:",t:"number",n:"dias",d:"20",min:"1",max:"545"},
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
      
      const dias_1_3=Math.min(dias,3);
      pasos.push({
        label:`Días 1–3: 0% (periodo de espera)`,
        formula:"Importe = Días × BR diaria × 0%",
        operation:`${dias_1_3} × ${diarios.toFixed(2)} × 0,00`,
        val:"0,00 €",
        explanation:"Los primeros 3 días son periodo de espera y no generan prestación"
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
    ],
    solve:function(inputs){
      const {bccp, horas_extra, dias} = inputs;
      if(!bccp||horas_extra===undefined||!dias)return{NO_DERECHO:!0,msg:"Rellena todos los campos."};
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
      
      // Resultado final
      pasos.push({
        label:"Total a cobrar",
        val:`${acumulado.toFixed(2)} €`,
        hl:true,
        explanation:`Prestación por IT por AT/EP: ${importe_dia1.toFixed(2)} € (día 1) + ${importe_dias_75.toFixed(2)} € (días 2-${dias})`
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
    ],
    solve:function(inputs){
      const {dias_cotiz, base_180} = inputs;
      if(!dias_cotiz||!base_180)return{NO_DERECHO:!0,msg:"Rellena todos los campos."};
      if(dias_cotiz<360)return{NO_DERECHO:!0,msg:"Necesita ≥ 360 días. Actualmente: "+dias_cotiz+" días."};
      
      let pasos=[];
      
      pasos.push({
        label:"Comprobar requisito de cotización",
        formula:"Mínimo: 360 días en últimos 6 años",
        operation:`Días cotizados: ${dias_cotiz}`,
        val:`${dias_cotiz>=360?"SÍ cumple":"NO cumple"}`,
        explanation:"Es obligatorio haber cotizado al menos 360 días en los últimos 6 años"
      });
      
      // Calcular duración (tabla oficial SEPE art. 269 LGSS)
      let duracion;
      if(dias_cotiz<540)duracion=120;
      else if(dias_cotiz<720)duracion=180;
      else if(dias_cotiz<900)duracion=240;
      else if(dias_cotiz<1080)duracion=300;
      else if(dias_cotiz<1260)duracion=360;
      else if(dias_cotiz<1440)duracion=420;
      else if(dias_cotiz<1620)duracion=480;
      else if(dias_cotiz<1800)duracion=540;
      else if(dias_cotiz<1980)duracion=600;
      else if(dias_cotiz<2160)duracion=660;
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
      
      const total_meses=Math.ceil(duracion/30);
      const meses_60=Math.max(0,total_meses-6); // resto al 60%
      const prestacion_m1=base_180*0.7;
      const prestacion_m2=base_180*0.6;

      pasos.push({
        label:"Primeros 6 meses: 70%",
        formula:"Importe = Base × 70%",
        operation:`${base_180.toFixed(2)} × 0,70`,
        val:`${prestacion_m1.toFixed(2)} €/mes`,
        explanation:"Durante los primeros 180 días (6 meses) se cobra el 70% de la BR"
      });

      if(meses_60>0){
        pasos.push({
          label:`Meses 7–${total_meses}: 60%`,
          formula:"Importe = Base × 60%",
          operation:`${base_180.toFixed(2)} × 0,60`,
          val:`${prestacion_m2.toFixed(2)} €/mes`,
          explanation:`Desde el día 181 en adelante se cobra el 60% de la BR`
        });
      }

      let acumulado=0;
      let desglose_meses=[];
      for(let mes=1;mes<=total_meses;mes++){
        if(mes<=6){
          acumulado+=prestacion_m1;
          desglose_meses.push({
            label:`Mes ${mes}`,
            operation:`70% de ${base_180.toFixed(2)}`,
            val:`${prestacion_m1.toFixed(2)} €`
          });
        }else{
          acumulado+=prestacion_m2;
          desglose_meses.push({
            label:`Mes ${mes}`,
            operation:`60% de ${base_180.toFixed(2)}`,
            val:`${prestacion_m2.toFixed(2)} €`
          });
        }
      }

      pasos.push(...desglose_meses);

      pasos.push({
        label:`Total por ${total_meses} meses`,
        formula:"Suma de prestaciones mensuales",
        val:`${acumulado.toFixed(2)} €`,
        hl:true,
        explanation:`Cantidad total a cobrar por desempleo durante los ${total_meses} meses de prestación`
      });
      
      return{
        resultado:acumulado.toFixed(2),
        br:base_180.toFixed(2),
        duracion,
        desglose:pasos
      }
    }
  },
];
