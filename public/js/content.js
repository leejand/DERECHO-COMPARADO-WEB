// Contenido académico: "Las Asociaciones Público-Privadas (APP). Etapas precontractual,
// contractual y postcontractual. Un estudio de derecho comparado: Colombia, Francia y Estados Unidos".
// Autora: Yury Carolina Ochoa Álvarez — Especialización en Derecho Administrativo, 2026.

const COUNTRIES = {
  co: { name: 'Colombia', short: 'CO', tradition: 'Modelo híbrido', color: 'yellow' },
  fr: { name: 'Francia', short: 'FR', tradition: 'Contrato administrativo', color: 'blue' },
  us: { name: 'Estados Unidos', short: 'EE. UU.', tradition: 'Common law', color: 'red' },
};

const STAGE_NAMES = { pre: 'Precontractual', con: 'Contractual', post: 'Postcontractual' };

const ELEMENTS = [
  { n: '01', title: 'Largo plazo', text: 'Los contratos suelen extenderse entre 20 y 30 años, porque la inversión privada debe recuperarse durante la explotación de la infraestructura.' },
  { n: '02', title: 'Financiación privada', text: 'El contratista aporta capital propio y deuda, normalmente a través de una sociedad de propósito especial y con créditos de largo plazo (project finance).' },
  { n: '03', title: 'Distribución de riesgos', text: 'Cada riesgo —diseño, construcción, demanda, operación, cambios regulatorios, fuerza mayor— se asigna a la parte que mejor puede gestionarlo.' },
  { n: '04', title: 'Pago por resultados', text: 'La remuneración depende de que la infraestructura esté disponible y cumpla estándares de calidad: peajes, pagos por disponibilidad o una combinación de ambos.' },
];

const COUNTRY_PROFILES = {
  co: {
    label: 'APP · Ley 1508 de 2012',
    lead: 'Colombia combina ambas influencias: conserva la matriz francesa del contrato estatal e incorpora la lógica anglosajona del pago por disponibilidad y la asignación técnica de riesgos.',
    facts: ['Inversión superior a 6.000 SMMLV', 'Plazo máximo de 30 años, incluidas prórrogas', 'Iniciativa pública o privada; con o sin recursos públicos'],
  },
  fr: {
    label: 'Concesión · Marché de partenariat',
    lead: 'Francia es la cuna del derecho administrativo de los contratos: el Consejo de Estado construyó allí la modificación unilateral y la teoría de la imprevisión.',
    facts: ['Code de la commande publique (2019)', 'Concesión: riesgo de explotación', 'Mercado de asociación: pago escalonado por desempeño'],
  },
  us: {
    label: 'P3 · Public-Private Partnerships',
    lead: 'Estados Unidos representa la tradición del common law: el contrato vale esencialmente por lo que las partes pactan. No hay ley federal general; cada estado decide.',
    facts: ['Leyes estatales habilitantes (enabling legislation)', 'Modelo DBFOM', 'Peajes o pagos por disponibilidad (availability payments)'],
  },
};

const COMPARISON = [
  { k: 'Tradición jurídica', co: 'Derecho continental; contrato estatal de matriz francesa con influencia anglosajona en la APP', fr: 'Derecho continental; cuna del contrato administrativo', us: 'Common law; primacía de la autonomía de la voluntad' },
  { k: 'Fuente normativa', co: 'Ley 1508 de 2012 y Decreto 1082 de 2015; Leyes 80 de 1993 y 1150 de 2007', fr: 'Código de la Contratación Pública (2019): concesión y mercado de asociación', us: 'Leyes estatales habilitantes; programas federales (TIFIA)' },
  { k: 'Concepto', co: 'Contrato de vinculación de capital privado con transferencia de riesgos y pago por disponibilidad y nivel de servicio', fr: 'Concesión (riesgo de explotación) o mercado de asociación (misión global pagada por la administración)', us: 'Contrato de largo plazo DBFOM, con peajes o pagos por disponibilidad' },
  { k: 'Clases', co: 'Iniciativa pública o privada; con o sin recursos públicos', fr: 'Concesión / mercado de asociación', us: 'Propuestas solicitadas / no solicitadas; riesgo de demanda / disponibilidad' },
  { k: 'Requisitos de procedencia', co: 'Más de 6.000 SMMLV; plazo máximo 30 años', fr: 'Umbrales de 2, 5 o 10 millones de euros; balance más favorable', us: 'Autorización en la ley estatal; en ocasiones aprobación legislativa por proyecto' },
  { k: 'Etapa precontractual', co: 'Estudios, justificación del esquema APP, concepto de MinHacienda, vigencias futuras, RUAPP; licitación o selección abreviada', fr: 'Evaluación del modo de realización (Fin Infra) y estudio de sostenibilidad presupuestal; diálogo competitivo', us: 'Value for money; RFQ y RFP; adjudicación por mejor valor; estipendios' },
  { k: 'Poderes de la administración', co: 'Cláusulas excepcionales legales (Ley 80 de 1993)', fr: 'Reglas generales del art. L6 CCP: control, modificación y terminación unilaterales', us: 'Solo los pactados; terminación por conveniencia contractual' },
  { k: 'Imprevistos y equilibrio', co: 'Equilibrio económico y matriz de riesgos', fr: 'Equilibrio financiero e imprevisión', us: 'Eventos de alivio y de compensación pactados' },
  { k: 'Compromiso presupuestal', co: 'Vigencias futuras (normas orgánicas)', fr: 'Estudio de sostenibilidad presupuestal y concepto del Ministerio de Presupuesto', us: 'Riesgo de apropiación anual; cláusulas de no apropiación' },
  { k: 'Límites a modificaciones', co: 'Adiciones hasta el 20 %; prórrogas hasta el 20 % del plazo en iniciativa privada sin recursos públicos', fr: 'Reglas del CCP sobre modificación de contratos; duración ligada a la amortización en concesiones', us: 'Según el contrato y la ley estatal' },
  { k: 'Etapa postcontractual', co: 'Reversión, liquidación (Ley 1150 de 2007, art. 11), fórmula de terminación anticipada (Ley 1882 de 2018)', fr: 'Bienes de retorno (Commune de Douai, 2012); indemnización por terminación', us: 'Handback requirements, vida útil residual, reserva de entrega; compensación pactada' },
  { k: 'Solución de controversias', co: 'Jurisdicción contencioso-administrativa, arbitraje y amigable composición', fr: 'Jurisdicción administrativa; référé précontractuel; recurso Tarn-et-Garonne', us: 'Tribunales estatales, arbitraje, Dispute Resolution Boards' },
  { k: 'Caso ilustrativo', co: 'Ruta del Sol II y Sentencia C-207 de 2019', fr: 'Ecomouv\' (ecotasa, 2014)', us: 'Indiana Toll Road (2014) y Purple Line (2020)' },
];

const CONCLUSIONS = [
  { n: 'Primera', text: 'La APP no es un contrato único con igual contenido en todos los países, sino una técnica de colaboración que cada ordenamiento incorpora según su tradición: Francia en la teoría del contrato administrativo, Estados Unidos en el derecho común de los contratos y Colombia en un modelo híbrido.' },
  { n: 'Segunda', text: 'La etapa precontractual es decisiva en los tres sistemas. La calidad de la estructuración, la justificación del esquema y la correcta asignación de riesgos determinan el éxito o el fracaso del proyecto: Ruta del Sol II, Ecomouv\' e Indiana Toll Road lo demuestran.' },
  { n: 'Tercera', text: 'El modelo colombiano protege más a la administración con sus poderes exorbitantes, lo que puede aumentar la percepción de riesgo del inversionista; el estadounidense ofrece más previsibilidad contractual, pero depende de la negociación y de la voluntad presupuestal anual.' },
  { n: 'Cuarta', text: 'Las APP comprometen recursos públicos durante décadas: su uso exige transparencia, control fiscal y participación ciudadana. Una infraestructura bien estructurada es un medio para hacer efectivos derechos como la salud, la educación y la movilidad.' },
];

// ---------------- Normativa ----------------
// type: ley | decreto | codigo | politica | jurisprudencia | federal | estatal | ue
const SENADO = (f) => `http://www.secretariasenado.gov.co/senado/basedoc/${f}.html`;
const CE_GRANDES = 'https://www.conseil-etat.fr/decisions-de-justice/jurisprudence/les-grandes-decisions-depuis-1873';
const LEGIFRANCE_CCP = 'https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000037701019';

const LAWS = [
  // ---- Colombia ----
  { id: 'ley-1508-2012', country: 'co', type: 'ley', year: 2012, short: 'Ley 1508', title: 'Ley 1508 de 2012',
    subtitle: 'Régimen jurídico de las Asociaciones Público Privadas; normas orgánicas de presupuesto',
    summary: 'Es el núcleo del régimen colombiano. Define las APP como un instrumento de vinculación de capital privado que se materializa en un contrato entre una entidad estatal y un particular, con retención y transferencia de riesgos y pagos ligados a la disponibilidad y al nivel de servicio.',
    stages: ['pre', 'con', 'post'], source: SENADO('ley_1508_2012'), sourceName: 'Secretaría del Senado',
    articles: [
      { ref: 'Art. 1', text: 'Definición de APP: vinculación de capital privado para la provisión de bienes públicos y servicios relacionados, con transferencia de riesgos y pagos por disponibilidad y nivel de servicio.' },
      { ref: 'Art. 2', text: 'Las concesiones del numeral 4 del artículo 32 de la Ley 80 de 1993 quedan comprendidas dentro de los esquemas de APP.' },
      { ref: 'Presupuestos', text: 'Inversión superior a 6.000 SMMLV; plazo máximo de 30 años, incluidas prórrogas, salvo concepto previo favorable del CONPES; retribución condicionada a disponibilidad, niveles de servicio y estándares de calidad, por unidades funcionales.' },
      { ref: 'Art. 11', text: 'Requisitos de las APP de iniciativa pública: estudios técnicos, financieros y jurídicos; justificación del esquema (comparador público-privado); valoración de obligaciones contingentes; vigencias futuras; registro en el RUAPP.' },
      { ref: 'Art. 17', text: 'Iniciativa privada con recursos públicos: licitación pública con bonificación del 3 % al 10 % para el originador; si no gana, el adjudicatario le paga los estudios.' },
      { ref: 'Arts. 19 y 20', text: 'Iniciativa privada sin recursos públicos: publicación en el SECOP; contratación directa si no hay interesados o selección abreviada con precalificación si los hay.' },
      { ref: 'Arts. 26 a 28', text: 'Vigencias futuras para APP, con carácter de normas orgánicas de presupuesto.' },
      { ref: 'Art. 32', text: 'Fórmula de reconocimientos por terminación anticipada o nulidad absoluta (modificado por el art. 20 de la Ley 1882 de 2018).' },
    ] },
  { id: 'ley-80-1993', country: 'co', type: 'ley', year: 1993, short: 'Ley 80', title: 'Ley 80 de 1993',
    subtitle: 'Estatuto General de Contratación de la Administración Pública',
    summary: 'Se aplica de forma supletiva a las APP. Aporta las cláusulas excepcionales heredadas del derecho francés, el deber de mantener el equilibrio económico, la reversión y la liquidación.',
    stages: ['con', 'post'], source: SENADO('ley_0080_1993'), sourceName: 'Secretaría del Senado',
    articles: [
      { ref: 'Arts. 5 y 27', text: 'Equilibrio económico: deber de restablecer la ecuación financiera cuando se rompe por causas no imputables al contratista y no asignadas a él en la matriz de riesgos.' },
      { ref: 'Cláusulas excepcionales', text: 'Interpretación, modificación y terminación unilaterales, caducidad y reversión.' },
      { ref: 'Art. 19', text: 'Reversión: al terminar el contrato, los bienes afectados pasan a la entidad estatal sin compensación alguna.' },
      { ref: 'Art. 32 num. 4', text: 'Contrato de concesión, hoy comprendido dentro de los esquemas de APP.' },
      { ref: 'Art. 60', text: 'Liquidación de los contratos (modificado por el art. 11 de la Ley 1150 de 2007).' },
    ] },
  { id: 'ley-1150-2007', country: 'co', type: 'ley', year: 2007, short: 'Ley 1150', title: 'Ley 1150 de 2007',
    subtitle: 'Medidas para la eficiencia y la transparencia en la Ley 80 de 1993',
    summary: 'Complementa el Estatuto General de Contratación. En las APP es clave por la distribución de riesgos previsibles y por las reglas de liquidación.',
    stages: ['pre', 'con', 'post'], source: SENADO('ley_1150_2007'), sourceName: 'Secretaría del Senado',
    articles: [
      { ref: 'Art. 4', text: 'Distribución de riesgos: los pliegos deben tipificar, estimar y asignar los riesgos previsibles (junto con los CONPES 3107 y 3133 de 2001).' },
      { ref: 'Art. 11', text: 'Liquidación: de mutuo acuerdo en el término pactado o dentro de 4 meses; unilateral dentro de los 2 meses siguientes; y en todo caso dentro de los 2 años siguientes.' },
    ] },
  { id: 'ley-1682-2013', country: 'co', type: 'ley', year: 2013, short: 'Ley 1682', title: 'Ley 1682 de 2013',
    subtitle: 'Medidas y disposiciones para los proyectos de infraestructura de transporte',
    summary: 'Ley de infraestructura de transporte que, entre otras, modificó el régimen de la Ley 1508 de 2012.',
    stages: ['pre', 'con'], source: SENADO('ley_1682_2013'), sourceName: 'Secretaría del Senado',
    articles: [{ ref: 'Relación', text: 'Figura entre las leyes que han modificado la Ley 1508 de 2012.' }] },
  { id: 'ley-1753-2015', country: 'co', type: 'ley', year: 2015, short: 'Ley 1753', title: 'Ley 1753 de 2015',
    subtitle: 'Plan Nacional de Desarrollo 2014-2018',
    summary: 'Modificó el tope de recursos públicos en las APP de iniciativa privada.',
    stages: ['pre'], source: SENADO('ley_1753_2015'), sourceName: 'Secretaría del Senado',
    articles: [{ ref: 'Art. 38', text: 'Elevó del 20 % al 30 % el tope de recursos públicos sobre el presupuesto estimado de inversión en APP de iniciativa privada.' }] },
  { id: 'ley-1882-2018', country: 'co', type: 'ley', year: 2018, short: 'Ley 1882', title: 'Ley 1882 de 2018',
    subtitle: 'Disposiciones para fortalecer la contratación pública en Colombia',
    summary: 'Modificó el artículo 32 de la Ley 1508 para fijar una fórmula de reconocimiento de costos, gastos e inversiones cuando el contrato se termina anticipadamente o se declara su nulidad absoluta.',
    stages: ['post'], source: SENADO('ley_1882_2018'), sourceName: 'Secretaría del Senado',
    articles: [{ ref: 'Art. 20', text: 'Reconocimientos al contratista por terminación anticipada o nulidad, para proteger a los financiadores de buena fe. Condicionado por la Sentencia C-207 de 2019.' }] },
  { id: 'ley-1955-2019', country: 'co', type: 'ley', year: 2019, short: 'Ley 1955', title: 'Ley 1955 de 2019',
    subtitle: 'Plan Nacional de Desarrollo 2018-2022',
    summary: 'Figura entre las leyes que han modificado el régimen de la Ley 1508 de 2012.',
    stages: ['pre', 'con'], source: SENADO('ley_1955_2019'), sourceName: 'Secretaría del Senado',
    articles: [{ ref: 'Relación', text: 'Modificación del régimen de APP en el marco del Plan Nacional de Desarrollo.' }] },
  { id: 'ley-448-1998', country: 'co', type: 'ley', year: 1998, short: 'Ley 448', title: 'Ley 448 de 1998',
    subtitle: 'Obligaciones contingentes de las entidades estatales',
    summary: 'Sustenta la valoración de las obligaciones contingentes del proyecto, con concepto favorable del Ministerio de Hacienda y Crédito Público.',
    stages: ['pre'], source: SENADO('ley_0448_1998'), sourceName: 'Secretaría del Senado',
    articles: [{ ref: 'Aplicación', text: 'Requisito previo de las APP de iniciativa pública: valoración de obligaciones contingentes aprobada por MinHacienda.' }] },
  { id: 'ley-1563-2012', country: 'co', type: 'ley', year: 2012, short: 'Ley 1563', title: 'Ley 1563 de 2012',
    subtitle: 'Estatuto de Arbitraje Nacional e Internacional',
    summary: 'Regula el arbitraje y la amigable composición, mecanismos frecuentes en los grandes contratos de infraestructura, como las concesiones 4G.',
    stages: ['con', 'post'], source: SENADO('ley_1563_2012'), sourceName: 'Secretaría del Senado',
    articles: [{ ref: 'Aplicación', text: 'Solución de controversias mediante arbitraje y amigable composición.' }] },
  { id: 'ley-610-2000', country: 'co', type: 'ley', year: 2000, short: 'Ley 610', title: 'Ley 610 de 2000',
    subtitle: 'Trámite de los procesos de responsabilidad fiscal',
    summary: 'Permite adelantar procesos de responsabilidad fiscal por la gestión del contrato, incluso después de su terminación.',
    stages: ['post'], source: SENADO('ley_0610_2000'), sourceName: 'Secretaría del Senado',
    articles: [{ ref: 'Aplicación', text: 'Responsabilidad fiscal en la etapa postcontractual, junto con la disciplinaria y la penal.' }] },
  { id: 'decreto-1082-2015', country: 'co', type: 'decreto', year: 2015, short: 'Decreto 1082', title: 'Decreto 1082 de 2015',
    subtitle: 'Decreto Único Reglamentario del Sector Administrativo de Planeación Nacional',
    summary: 'Compila el Decreto 1467 de 2012, reglamentario de la Ley 1508. Su contenido sobre APP fue ajustado por el Decreto 438 de 2021.',
    stages: ['pre', 'con', 'post'], source: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=77653', sourceName: 'Gestor Normativo — Función Pública',
    articles: [
      { ref: 'Compilación', text: 'Recoge el Decreto 1467 de 2012 (reglamento original de las APP).' },
      { ref: 'Decreto 438 de 2021', text: 'Ajustó el reglamento de las APP; sus cambios se consultan en la versión compilada del DUR.' },
    ] },
  { id: 'conpes-3107-2001', country: 'co', type: 'politica', year: 2001, short: 'CONPES 3107', title: 'Documento CONPES 3107 de 2001',
    subtitle: 'Política de manejo de riesgo contractual del Estado para procesos de participación privada en infraestructura',
    summary: 'Junto con el CONPES 3133 de 2001, orienta la tipificación, estimación y asignación de riesgos que se plasma en la matriz de riesgos.',
    stages: ['pre', 'con'], source: 'https://colaboracion.dnp.gov.co/CDT/Conpes/Econ%C3%B3micos/3107.pdf', sourceName: 'Departamento Nacional de Planeación',
    articles: [{ ref: 'Aplicación', text: 'Fundamento de la matriz de riesgos: los riesgos asignados al privado no dan lugar, en principio, a reclamaciones por desequilibrio.' }] },
  { id: 'conpes-3133-2001', country: 'co', type: 'politica', year: 2001, short: 'CONPES 3133', title: 'Documento CONPES 3133 de 2001',
    subtitle: 'Modificaciones a la política de manejo de riesgo contractual',
    summary: 'Complementa el CONPES 3107 en la asignación de riesgos en proyectos con participación privada.',
    stages: ['pre', 'con'], source: 'https://colaboracion.dnp.gov.co/CDT/Conpes/Econ%C3%B3micos/3133.pdf', sourceName: 'Departamento Nacional de Planeación',
    articles: [{ ref: 'Aplicación', text: 'Matriz de riesgos del contrato de APP.' }] },
  { id: 'c-207-2019', country: 'co', type: 'jurisprudencia', year: 2019, short: 'C-207/19', title: 'Sentencia C-207 de 2019',
    subtitle: 'Corte Constitucional — 16 de mayo de 2019',
    summary: 'Estudió el art. 20 de la Ley 1882 de 2018 en el contexto de contratos afectados por corrupción, como Ruta del Sol II. Condicionó la norma: los reconocimientos proceden para terceros de buena fe, no para quienes actuaron con dolo o mala fe.',
    stages: ['post'], source: 'https://www.corteconstitucional.gov.co/relatoria/2019/C-207-19.htm', sourceName: 'Relatoría — Corte Constitucional',
    articles: [
      { ref: 'Decisión', text: 'Sin restituciones para el contratista, sus miembros o terceros aparentes que actuaron dolosamente o con conocimiento de la ilicitud; se admite el levantamiento del velo corporativo.' },
      { ref: 'Inexequibilidad', text: 'Declaró inexequibles apartes sobre el pago de cláusulas penales por terminación anticipada y ciertos descuentos sobre las restituciones.' },
    ] },

  // ---- Francia ----
  { id: 'ccp-2019', country: 'fr', type: 'codigo', year: 2019, short: 'CCP', title: 'Code de la commande publique',
    subtitle: 'Código de la Contratación Pública — vigente desde el 1 de abril de 2019',
    summary: 'Codifica la concesión y el mercado de asociación, y recoge las reglas generales de los contratos administrativos construidas por el Consejo de Estado.',
    stages: ['pre', 'con', 'post'], source: LEGIFRANCE_CCP, sourceName: 'Légifrance',
    articles: [
      { ref: 'Art. L1121-1', text: 'Concesión: se confía a un operador la ejecución de obras o la gestión de un servicio con transferencia de un riesgo ligado a la explotación.' },
      { ref: 'Art. L1112-1', text: 'Mercado de asociación: misión global de construcción, transformación o rehabilitación, y todo o parte de su financiación.' },
      { ref: 'Art. L2211-1', text: 'Entidades autorizadas: todos los compradores públicos, salvo ciertos organismos de la administración central y los establecimientos públicos de salud.' },
      { ref: 'Arts. L2211-5 y R2211-1', text: 'Umbrales de 2, 5 o 10 millones de euros (sin impuestos), según el objeto.' },
      { ref: 'Art. L2212-1', text: 'Evaluación del modo de realización en costo completo, con concepto de Fin Infra en seis semanas.' },
      { ref: 'Art. L2212-3', text: 'Estudio de sostenibilidad presupuestal, con concepto del servicio del Estado competente.' },
      { ref: 'Art. L6', text: 'Reglas generales: control, modificación y terminación unilaterales con indemnización, e indemnización por imprevisión.' },
    ] },
  { id: 'ord-2004-559', country: 'fr', type: 'ley', year: 2004, short: 'Ord. 2004-559', title: 'Ordonnance n.° 2004-559',
    subtitle: 'Crea el contrato de asociación (contrat de partenariat)',
    summary: 'Introdujo en 2004 el contrat de partenariat, inspirado en la PFI británica. Fue sustituido por el mercado de asociación.',
    stages: ['pre', 'con'], source: 'https://www.legifrance.gouv.fr/', sourceName: 'Légifrance (buscar «Ordonnance 2004-559»)',
    articles: [{ ref: 'Evolución', text: 'Sustituido en 2015 por el marché de partenariat (Ordenanza 2015-899) y hoy codificado en el CCP.' }] },
  { id: 'ord-2015-899', country: 'fr', type: 'ley', year: 2015, short: 'Ord. 2015-899', title: 'Ordonnance n.° 2015-899',
    subtitle: 'Mercados públicos — crea el mercado de asociación',
    summary: 'Sustituyó el contrato de asociación por el marché de partenariat.',
    stages: ['pre', 'con'], source: 'https://www.legifrance.gouv.fr/', sourceName: 'Légifrance (buscar «Ordonnance 2015-899»)',
    articles: [{ ref: 'Evolución', text: 'Su régimen pasó al Code de la commande publique en 2019.' }] },
  { id: 'ord-2016-65', country: 'fr', type: 'ley', year: 2016, short: 'Ord. 2016-65', title: 'Ordonnance n.° 2016-65',
    subtitle: 'Contratos de concesión',
    summary: 'Reguló los contratos de concesión en transposición de la Directiva 2014/23/UE.',
    stages: ['pre', 'con', 'post'], source: 'https://www.legifrance.gouv.fr/', sourceName: 'Légifrance (buscar «Ordonnance 2016-65»)',
    articles: [{ ref: 'Evolución', text: 'Codificada en el CCP desde el 1 de abril de 2019.' }] },
  { id: 'directiva-2014-23', country: 'fr', type: 'ue', year: 2014, short: 'Dir. 2014/23/UE', title: 'Directiva 2014/23/UE',
    subtitle: 'Adjudicación de contratos de concesión — Unión Europea',
    summary: 'Marco europeo de las concesiones que Francia transpuso mediante la Ordenanza 2016-65.',
    stages: ['pre'], source: 'https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32014L0023', sourceName: 'EUR-Lex',
    articles: [{ ref: 'Aplicación', text: 'Publicidad y competencia en la adjudicación de las concesiones.' }] },
  { id: 'ce-tramways-1910', country: 'fr', type: 'jurisprudencia', year: 1910, short: 'Tramways', title: 'Compagnie générale française des tramways',
    subtitle: 'Consejo de Estado — 11 de marzo de 1910',
    summary: 'Reconoció el poder de modificación unilateral de la administración, institución que luego adoptó Colombia.',
    stages: ['con'], source: CE_GRANDES, sourceName: 'Conseil d\'État — grandes decisiones',
    articles: [{ ref: 'Regla', text: 'Modificación unilateral del contrato con derecho del contratista al equilibrio financiero.' }] },
  { id: 'ce-bordeaux-1916', country: 'fr', type: 'jurisprudencia', year: 1916, short: 'Gaz de Bordeaux', title: 'Compagnie générale d\'éclairage de Bordeaux',
    subtitle: 'Consejo de Estado — 30 de marzo de 1916',
    summary: 'Origen de la teoría de la imprevisión.',
    stages: ['con'], source: CE_GRANDES, sourceName: 'Conseil d\'État — grandes decisiones',
    articles: [{ ref: 'Regla', text: 'Si un acontecimiento imprevisible trastorna temporalmente la economía del contrato, el contratista que sigue ejecutándolo tiene derecho a indemnización.' }] },
  { id: 'ce-douai-2012', country: 'fr', type: 'jurisprudencia', year: 2012, short: 'Commune de Douai', title: 'Commune de Douai',
    subtitle: 'Consejo de Estado, Asamblea — 21 de diciembre de 2012, n.° 342788',
    summary: 'Sistematizó la teoría de los bienes de retorno (biens de retour), equivalente funcional de la reversión colombiana.',
    stages: ['post'], source: CE_GRANDES, sourceName: 'Conseil d\'État — grandes decisiones',
    articles: [
      { ref: 'Bienes de retorno', text: 'Pertenecen a la persona pública desde su construcción y le retornan gratuitamente; si no están amortizados, hay indemnización.' },
      { ref: 'Distinciones', text: 'Bienes de recuperación (la administración puede adquirirlos pagando) y bienes propios del concesionario.' },
    ] },
  { id: 'ce-tarn-2014', country: 'fr', type: 'jurisprudencia', year: 2014, short: 'Tarn-et-Garonne', title: 'Département de Tarn-et-Garonne',
    subtitle: 'Consejo de Estado, Asamblea — 4 de abril de 2014, n.° 358994',
    summary: 'Reconoció a los terceros un recurso para impugnar la validez del contrato administrativo.',
    stages: ['post'], source: CE_GRANDES, sourceName: 'Conseil d\'État — grandes decisiones',
    articles: [{ ref: 'Regla', text: 'Los terceros pueden impugnar la validez del contrato ante el juez administrativo.' }] },

  // ---- Estados Unidos ----
  { id: 'tifia', country: 'us', type: 'federal', year: 1998, short: 'TIFIA', title: 'Transportation Infrastructure Finance and Innovation Act',
    subtitle: '23 U.S.C. § 601 y siguientes',
    summary: 'Principal instrumento federal: otorga préstamos de bajo interés a proyectos de transporte que cumplan ciertos requisitos.',
    stages: ['pre', 'con'], source: 'https://www.law.cornell.edu/uscode/text/23/601', sourceName: 'Legal Information Institute — Cornell',
    articles: [{ ref: '§ 601 y ss.', text: 'Apoyo crediticio federal a proyectos de transporte, incluidas las P3.' }] },
  { id: 'pab-142', country: 'us', type: 'federal', year: 2005, short: 'PABs', title: 'Private Activity Bonds',
    subtitle: 'Bonos de actividad privada exentos de impuestos — 26 U.S.C. § 142',
    summary: 'Bonos exentos de impuestos que permiten financiar carreteras e instalaciones de transporte desarrolladas por privados.',
    stages: ['pre'], source: 'https://www.law.cornell.edu/uscode/text/26/142', sourceName: 'Legal Information Institute — Cornell',
    articles: [{ ref: '§ 142', text: 'Exempt facility bonds: incluye instalaciones de carreteras y transferencia de carga.' }] },
  { id: 'fhwa-p3', country: 'us', type: 'federal', year: null, short: 'FHWA P3', title: 'Política P3 de la Federal Highway Administration',
    subtitle: 'Fondos federales y pagos por disponibilidad',
    summary: 'La FHWA permite usar fondos federales en contratos con pagos por disponibilidad y recomienda el análisis de valor por dinero con un comparador del sector público.',
    stages: ['pre', 'con'], source: 'https://www.fhwa.dot.gov/ipd/p3/', sourceName: 'FHWA — Center for Innovative Finance Support',
    articles: [
      { ref: 'Value for money', text: 'Comparar el costo del proyecto como P3 con el de su ejecución tradicional.' },
      { ref: 'Availability payments', text: 'Uso de fondos federales en contratos con pagos por disponibilidad.' },
    ] },
  { id: 'va-ppta-1995', country: 'us', type: 'estatal', year: 1995, short: 'Virginia PPTA', title: 'Public-Private Transportation Act de Virginia',
    subtitle: 'Code of Virginia, Title 33.2, Chapter 18',
    summary: 'Ejemplo temprano de ley estatal habilitante (enabling legislation). Sin ley habilitante, la entidad no puede celebrar una P3.',
    stages: ['pre'], source: 'https://law.lis.virginia.gov/vacodefull/title33.2/chapter18/', sourceName: 'Code of Virginia — LIS',
    articles: [{ ref: 'Autorización', text: 'Habilita a las entidades del estado a celebrar acuerdos público-privados de transporte, incluidas propuestas no solicitadas.' }] },
];

const TYPE_LABELS = { ley: 'Ley / Ordenanza', decreto: 'Decreto', codigo: 'Código', politica: 'Política CONPES', jurisprudencia: 'Jurisprudencia', federal: 'Norma federal', estatal: 'Ley estatal', ue: 'Derecho UE' };

// ---------------- Etapas ----------------
const STAGES = [
  {
    key: 'pre', ch: 'CH.1', name: 'Precontractual', color: 'yellow',
    tagline: 'Planeación, estructuración y selección del contratista',
    intro: 'Es la etapa decisiva en los tres sistemas: aquí se decide si el proyecto es viable y conveniente como APP. Las deficiencias de planeación —estudios incompletos, riesgos mal asignados, predios o licencias no gestionados— suelen ser la causa de los sobrecostos y conflictos posteriores.',
    countries: {
      co: {
        headline: 'Estudios, vigencias futuras y licitación',
        points: [
          { t: 'Iniciativa pública (art. 11)', d: 'Estudios técnicos, financieros y jurídicos; evaluación costo-beneficio e impacto social, económico y ambiental.' },
          { t: 'Justificación del esquema', d: 'Comparador público-privado o análisis de valor por dinero según la metodología del DNP.' },
          { t: 'Obligaciones contingentes', d: 'Valoración con concepto favorable de MinHacienda (Ley 448 de 1998).' },
          { t: 'Vigencias futuras', d: 'CONFIS para la Nación; asambleas y concejos en lo territorial (arts. 26 a 28).' },
          { t: 'RUAPP', d: 'Registro del proyecto en el Registro Único de APP del DNP.' },
          { t: 'Iniciativa privada', d: 'El originador estructura a su riesgo (prefactibilidad y factibilidad). Con recursos públicos: licitación con bonificación del 3 % al 10 % y tope del 30 %. Sin recursos públicos: SECOP y contratación directa o selección abreviada.' },
        ],
      },
      fr: {
        headline: 'Controles previos estrictos',
        points: [
          { t: 'Entidades autorizadas', d: 'Todos los compradores públicos, salvo ciertos organismos (art. L2211-1 CCP).' },
          { t: 'Umbrales mínimos', d: '2, 5 o 10 millones de euros según el objeto (art. L2211-5 y R2211-1).' },
          { t: 'Balance más favorable', d: 'La administración demuestra que el mercado de asociación es financieramente mejor que otros modos.' },
          { t: 'Evaluación del modo de realización', d: 'Análisis en costo completo con concepto de Fin Infra en seis semanas (art. L2212-1).' },
          { t: 'Sostenibilidad presupuestal', d: 'Estudio sobre las finanzas públicas con concepto del ministro de presupuesto (art. L2212-3).' },
          { t: 'Selección', d: 'Licitación, procedimiento con negociación o diálogo competitivo; référé précontractuel para los competidores.' },
        ],
      },
      us: {
        headline: 'Ley habilitante, value for money y RFQ/RFP',
        points: [
          { t: 'Autorización legal previa', d: 'Sin ley habilitante no hay P3; algunas leyes exigen aprobación legislativa por proyecto.' },
          { t: 'Value for money', d: 'La FHWA recomienda un comparador del sector público.' },
          { t: 'Propuestas no solicitadas', d: 'Análogas a la iniciativa privada colombiana; se someten a competencia.' },
          { t: 'Dos pasos: RFQ + RFP', d: 'Precalificación y adjudicación por mejor valor (best value); estipendio a los no ganadores.' },
          { t: 'Cierre comercial y financiero', d: 'Firma del contrato y de los contratos de crédito; bid protests según la ley estatal.' },
        ],
      },
    },
    caseStudy: null,
  },
  {
    key: 'con', ch: 'CH.2', name: 'Contractual', color: 'blue',
    tagline: 'Ejecución, poderes de la administración, remuneración y riesgos',
    intro: 'Aquí aparece la diferencia más profunda: en Francia y Colombia la administración conserva prerrogativas que provienen de la ley; en Estados Unidos solo existen si se pactan.',
    countries: {
      co: {
        headline: 'Patrimonio autónomo y cláusulas excepcionales',
        points: [
          { t: 'Patrimonio autónomo', d: 'Maneja todos los recursos del proyecto, públicos y privados, y facilita la vigilancia.' },
          { t: 'Remuneración condicionada', d: 'Pago por unidad funcional disponible y conforme a indicadores; el incumplimiento genera descuentos.' },
          { t: 'Matriz de riesgos', d: 'Ley 1150 de 2007, art. 4, y CONPES 3107 y 3133 de 2001.' },
          { t: 'Cláusulas excepcionales', d: 'Interpretación, modificación y terminación unilaterales, caducidad y reversión (Ley 80).' },
          { t: 'Equilibrio económico', d: 'Restablecimiento por causas no imputables ni asignadas al contratista (arts. 5 y 27 Ley 80).' },
          { t: 'Límites', d: 'Adiciones hasta el 20 %; prórrogas hasta el 20 % del plazo en iniciativa privada sin recursos públicos.' },
          { t: 'Vigilancia', d: 'Interventoría, supervisión y control fiscal de la Contraloría.' },
        ],
      },
      fr: {
        headline: 'Reglas generales del contrato administrativo (art. L6)',
        points: [
          { t: 'Poder de control', d: 'La administración controla la ejecución.' },
          { t: 'Modificación unilateral', d: 'Con derecho del contratista al equilibrio financiero e indemnización.' },
          { t: 'Terminación por interés general', d: 'Con indemnización al contratista.' },
          { t: 'Imprevisión', d: 'Indemnización cuando un hecho imprevisible trastorna temporalmente la economía del contrato.' },
          { t: 'Remuneración', d: 'Mercado de asociación: pagos escalonados por desempeño, cesibles a los bancos. Concesión: tarifas de usuarios.' },
          { t: 'Control', d: 'Juez administrativo y Cour des comptes (informe de 2015).' },
        ],
      },
      us: {
        headline: 'Todo depende de lo pactado',
        points: [
          { t: 'Relief y compensation events', d: 'Regulan imprevistos: cumplen la función del equilibrio económico.' },
          { t: 'Termination for convenience', d: 'Solo si se pactó y pagando la compensación contractual.' },
          { t: 'Deducciones y puntos', d: 'Por incumplir niveles de servicio; pueden llevar a la terminación.' },
          { t: 'Step-in rights', d: 'Los financiadores pueden intervenir el proyecto si el concesionario incumple.' },
          { t: 'Riesgo de apropiación', d: 'Los pagos por disponibilidad dependen de la apropiación legislativa anual.' },
        ],
      },
    },
    caseStudy: { country: 'us', year: '2014 · 2020', title: 'Indiana Toll Road y Purple Line', text: 'El concesionario de la Indiana Toll Road quebró en 2014 por un tráfico inferior al proyectado; el tren ligero Purple Line de Maryland se reestructuró tras el retiro del constructor en 2020 por sobrecostos y retrasos.' },
  },
  {
    key: 'post', ch: 'CH.3', name: 'Postcontractual', color: 'red',
    tagline: 'Terminación, reversión o entrega, liquidación y controversias',
    intro: 'Francia y Colombia cuentan con instituciones generales —bienes de retorno y reversión—; Estados Unidos lo resuelve contractualmente con requisitos técnicos de entrega muy precisos.',
    countries: {
      co: {
        headline: 'Reversión, liquidación y C-207 de 2019',
        points: [
          { t: 'Reversión', d: 'Los bienes pasan a la entidad sin compensación (art. 19 Ley 80), en las condiciones de mantenimiento pactadas.' },
          { t: 'Liquidación', d: 'Mutuo acuerdo (4 meses), unilateral (2 meses) y en todo caso dentro de los 2 años siguientes.' },
          { t: 'Terminación anticipada y nulidad', d: 'Fórmula del art. 32 de la Ley 1508, modificado por el art. 20 de la Ley 1882 de 2018.' },
          { t: 'Garantías y responsabilidad', d: 'Estabilidad de obra, calidad; responsabilidad fiscal (Ley 610 de 2000), disciplinaria y penal.' },
        ],
      },
      fr: {
        headline: 'Bienes de retorno e indemnización',
        points: [
          { t: 'Biens de retour', d: 'Retornan gratuitamente a la persona pública; indemnización por la parte no amortizada (Commune de Douai, 2012).' },
          { t: 'Indemnización por terminación', d: 'Valor no amortizado, costos de financiación y, según lo pactado, lucro cesante.' },
          { t: 'Controversias', d: 'Jurisdicción administrativa; terceros vía recurso Tarn-et-Garonne (2014).' },
        ],
      },
      us: {
        headline: 'Handback requirements',
        points: [
          { t: 'Condiciones de entrega', d: 'Vida útil residual mínima por componente: pavimentos, puentes, equipos.' },
          { t: 'Inspecciones', d: 'Varios años antes del vencimiento, para programar inversiones.' },
          { t: 'Handback reserve', d: 'Reserva o carta de crédito que garantiza los recursos.' },
          { t: 'Compensación pactada', d: 'Según la causa: incumplimiento, fuerza mayor o conveniencia.' },
          { t: 'Controversias', d: 'Tribunales estatales, arbitraje o Dispute Resolution Boards.' },
        ],
      },
    },
    caseStudy: { country: 'fr', year: '2014', title: 'Ecomouv\'', text: 'Tras las protestas contra la ecotasa, el Gobierno terminó el contrato y pagó cerca de 910 millones de euros. En 2018 el Tribunal Administrativo de Cergy-Pontoise estimó que la terminación no obedecía a un motivo de interés general.' },
  },
];

const CASES = [
  { country: 'co', year: 'C-207/19', title: 'Ruta del Sol II', text: 'Contrato afectado por corrupción. La Corte condicionó los reconocimientos por nulidad: solo proceden para terceros de buena fe.' },
  { country: 'fr', year: '2014', title: 'Ecomouv\'', text: 'La suspensión de la ecotasa y la terminación del contrato costaron cerca de 910 millones de euros al Estado francés.' },
  { country: 'us', year: '2014', title: 'Indiana Toll Road', text: 'Quiebra del concesionario por un tráfico inferior al proyectado: el riesgo de demanda en estado puro.' },
];
