import { Category, Question, MaturityLevelInfo } from '@/types/assessment';

// 4 Bloques correspondientes a los niveles de madurez
export const categories: Category[] = [
  {
    id: 'bloque_a',
    name: 'Campamento Base',
    icon: 'Mountain',
    description: 'Identidad profesional y oferta de servicios',
    blockCode: 'A',
  },
  {
    id: 'bloque_b',
    name: 'Tramo de Ascenso',
    icon: 'TrendingUp',
    description: 'Experiencia comercial y gestión de proyectos',
    blockCode: 'B',
  },
  {
    id: 'bloque_c',
    name: 'Alta Montaña',
    icon: 'Flag',
    description: 'Método, autonomía y sostenibilidad',
    blockCode: 'C',
  },
  {
    id: 'bloque_d',
    name: 'Guía',
    icon: 'Users',
    description: 'Liderazgo colectivo y construcción de sistema',
    blockCode: 'D',
  },
];

// 20 preguntas del Test de Madurez de La Cordada
export const questions: Question[] = [
  // Bloque A - Campamento Base (Preguntas 1-5)
  {
    id: 'q1',
    text: 'Mi valor profesional se explica principalmente por mi experiencia previa o cargos anteriores.',
    category: categories[0],
    blockCode: 'A',
  },
  {
    id: 'q2',
    text: 'Me incomoda definir una oferta clara con alcance y precio.',
    category: categories[0],
    blockCode: 'A',
  },
  {
    id: 'q3',
    text: 'Prefiero que otros definan el problema y yo encargarme de resolverlo.',
    category: categories[0],
    blockCode: 'A',
  },
  {
    id: 'q4',
    text: 'Cada proyecto que hago es bastante distinto al anterior.',
    category: categories[0],
    blockCode: 'A',
  },
  {
    id: 'q5',
    text: 'No tengo una forma estándar de iniciar, ejecutar y cerrar proyectos.',
    category: categories[0],
    blockCode: 'A',
  },
  // Bloque B - Tramo de Ascenso (Preguntas 6-10)
  {
    id: 'q6',
    text: 'He vendido proyectos propios y los he ejecutado solo frente al cliente.',
    category: categories[1],
    blockCode: 'B',
  },
  {
    id: 'q7',
    text: 'Me cuesta decir que no cuando el cliente pide algo fuera de alcance.',
    category: categories[1],
    blockCode: 'B',
  },
  {
    id: 'q8',
    text: 'Ajusto precios o alcance para asegurar el cierre.',
    category: categories[1],
    blockCode: 'B',
  },
  {
    id: 'q9',
    text: 'Cumplo los proyectos, pero con alto desgaste personal.',
    category: categories[1],
    blockCode: 'B',
  },
  {
    id: 'q10',
    text: 'Mi efectividad depende mucho de mi energía y dedicación personal.',
    category: categories[1],
    blockCode: 'B',
  },
  // Bloque C - Alta Montaña (Preguntas 11-15)
  {
    id: 'q11',
    text: 'Tengo una forma clara y repetible de abordar mis proyectos.',
    category: categories[2],
    blockCode: 'C',
  },
  {
    id: 'q12',
    text: 'Puedo explicar en simple qué ofrezco y qué resultado entrego.',
    category: categories[2],
    blockCode: 'C',
  },
  {
    id: 'q13',
    text: 'Defiendo precios y alcance sin sentir culpa.',
    category: categories[2],
    blockCode: 'C',
  },
  {
    id: 'q14',
    text: 'Identifico riesgos temprano y los gestiono explícitamente.',
    category: categories[2],
    blockCode: 'C',
  },
  {
    id: 'q15',
    text: 'Mis clientes repiten o me recomiendan.',
    category: categories[2],
    blockCode: 'C',
  },
  // Bloque D - Guía (Preguntas 16-20)
  {
    id: 'q16',
    text: 'Pienso más en prácticas sostenibles que en proyectos individuales.',
    category: categories[3],
    blockCode: 'D',
  },
  {
    id: 'q17',
    text: 'Me preocupo activamente de la reputación colectiva, no solo de la mía.',
    category: categories[3],
    blockCode: 'D',
  },
  {
    id: 'q18',
    text: 'Ayudo a otros consultores a mejorar su forma de trabajar.',
    category: categories[3],
    blockCode: 'D',
  },
  {
    id: 'q19',
    text: 'Diseño marcos, reglas o estándares para que otros los usen.',
    category: categories[3],
    blockCode: 'D',
  },
  {
    id: 'q20',
    text: 'Prefiero que la cordada llegue, aunque yo no lidere todo.',
    category: categories[3],
    blockCode: 'D',
  },
];

// Opciones de respuesta estándar (1-5)
export const answerOptions = [
  { value: 1, label: 'Muy en desacuerdo' },
  { value: 2, label: 'En desacuerdo' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'De acuerdo' },
  { value: 5, label: 'Muy de acuerdo' },
];

// Niveles de madurez basados en los datos de La Cordada
export const maturityLevels: MaturityLevelInfo[] = [
  {
    level: 'campamento_base',
    name: 'Campamento Base',
    blockCode: 'A',
    characteristic: 'Aprendiz consciente',
    phrase: 'Nunca lo he ofrecido así, pero sé hacerlo',
    description: 'Mucho conocimiento pero sin experiencia sosteniendo una práctica independiente. Se define por su expertise o cargo previo; mentalidad aún organizacional.',
    strengths: [
      'Profundidad técnica',
      'Criterio de contenido',
      'Energía inicial',
    ],
    weaknesses: [
      'Invisibilidad comercial',
      'Subvaloración',
      'Riesgo si lidera',
    ],
    mainRisk: 'Confundir capacidad técnica con capacidad consultiva',
    enabledRoles: 'Sherpa (con guía); Explorador (acotado)',
    supportNeeded: 'Guía muy presente; Asegurador firme; nunca ir solo',
    keyTools: 'Oferta en 1 página; propuestas tipo; playbook de discovery; checklists de alcance',
    minPercentage: 0,
    maxPercentage: 25,
    recommendation: 'Te recomendamos comenzar con proyectos acompañados y desarrollar tu propuesta de valor clara. La Cordada puede ayudarte a estructurar tu oferta y ganar experiencia con respaldo.',
  },
  {
    level: 'tramo_ascenso',
    name: 'Tramo de Ascenso',
    blockCode: 'B',
    characteristic: 'Ejecutor confiable',
    phrase: 'Lo puedo sacar, pero mejor lo conversemos antes',
    description: 'Ya vende y ejecuta pero depende del esfuerzo personal y del sistema. Empieza a verse como consultor pero aún duda de su foco y precio.',
    strengths: [
      'Capacidad de ejecución',
      'Aprendizaje rápido',
      'Responsabilidad personal',
    ],
    weaknesses: [
      'Scope creep',
      'Desgaste',
      'Dificultad para decir no',
    ],
    mainRisk: 'Escalar más rápido que su criterio',
    enabledRoles: 'Primer de Cuerda (acotado); Sherpa senior; Cronista funcional',
    supportNeeded: 'Guía liviano; Asegurador en momentos críticos',
    keyTools: 'Frameworks de decisión; pricing de referencia; change control; dashboard simple',
    minPercentage: 26,
    maxPercentage: 50,
    recommendation: 'Estás en un buen momento para consolidar tu método y aprender a defender tu alcance. La Cordada te ofrece herramientas y acompañamiento para profesionalizar tu práctica.',
  },
  {
    level: 'alta_montana',
    name: 'Alta Montaña',
    blockCode: 'C',
    characteristic: 'Profesional maduro',
    phrase: 'Esto lo ofrezco así, con este alcance y resultado',
    description: 'Práctica independiente sostenible con método y control. Se define por su propuesta de valor; claridad de límites. Ha liderado proyectos de punta a punta y repetido resultados.',
    strengths: [
      'Resultados repetibles',
      'Autonomía',
      'Clientes que recomiendan',
    ],
    weaknesses: [
      'Riesgo de aislamiento',
      'Posible desalineación',
    ],
    mainRisk: 'Optimizar su éxito personal por sobre el sistema',
    enabledRoles: 'Primer de Cuerda pleno; Asegurador; Explorador estratégico',
    supportNeeded: 'Pares; coordinación; alineamiento',
    keyTools: 'Insights estratégicos; reglas de marca; gobierno liviano',
    minPercentage: 51,
    maxPercentage: 75,
    recommendation: 'Tu madurez te permite operar con autonomía. La Cordada te ofrece un ecosistema de pares y oportunidades para expandir tu impacto sin perder tu esencia.',
  },
  {
    level: 'guia',
    name: 'Guía',
    blockCode: 'D',
    characteristic: 'Orquestador',
    phrase: 'Mi rol no es escalar más, es que la cordada no se caiga',
    description: 'Lidera prácticas y personas más que proyectos. Se ve como constructor de sistema y reputación colectiva. Ha sostenido su práctica y habilitado la de otros.',
    strengths: [
      'Orquestación',
      'Reducción de riesgo',
      'Aceleración de madurez',
    ],
    weaknesses: [
      'Cuello de botella',
      'Sobrecarga',
    ],
    mainRisk: 'Centralizar decisiones y no soltar la cuerda',
    enabledRoles: 'Guía; Diseñador de cordadas; Mentor',
    supportNeeded: 'Confianza explícita; respaldo institucional; red de guías',
    keyTools: 'Modelos de gobierno; reglas de promesa y pricing; sistemas de mentoring',
    minPercentage: 76,
    maxPercentage: 100,
    recommendation: 'Tu experiencia te posiciona como líder natural del ecosistema. La Cordada te invita a ser parte del núcleo que habilita a otros consultores a crecer.',
  },
];

export const getMaturityLevel = (percentage: number): MaturityLevelInfo => {
  return maturityLevels.find(
    (level) => percentage >= level.minPercentage && percentage <= level.maxPercentage
  ) || maturityLevels[0];
};

export const getMaturityLevelByBlock = (blockCode: 'A' | 'B' | 'C' | 'D'): MaturityLevelInfo => {
  return maturityLevels.find(level => level.blockCode === blockCode) || maturityLevels[0];
};
