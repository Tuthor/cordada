import { BusinessSection, BusinessQuestion } from '@/types/businessDiagnostic';

// Secciones del diagnóstico empresarial
export const businessSections: BusinessSection[] = [
  {
    id: 'respondent_profile',
    name: 'Perfil del Respondente',
    description: 'Información sobre usted y su rol en la organización',
    order: 1,
  },
  {
    id: 'organizational_culture',
    name: 'Cultura Organizacional',
    description: 'Valores, comportamientos y ambiente de trabajo',
    order: 2,
  },
  {
    id: 'leadership',
    name: 'Liderazgo y Dirección',
    description: 'Estilos de liderazgo y toma de decisiones',
    order: 3,
  },
  {
    id: 'processes',
    name: 'Procesos y Operaciones',
    description: 'Eficiencia y madurez de procesos internos',
    order: 4,
  },
  {
    id: 'people',
    name: 'Gestión del Talento',
    description: 'Desarrollo, valoración y retención del personal',
    order: 5,
  },
  {
    id: 'collaboration',
    name: 'Colaboración y Comunicación',
    description: 'Flujo de información y trabajo entre áreas',
    order: 6,
  },
  {
    id: 'innovation',
    name: 'Innovación y Cambio',
    description: 'Capacidad de adaptación y mejora continua',
    order: 7,
  },
];

// Opciones para preguntas de perfil
export const industryOptions = [
  { value: 'tecnologia', label: 'Tecnología' },
  { value: 'servicios_financieros', label: 'Servicios Financieros' },
  { value: 'manufactura', label: 'Manufactura' },
  { value: 'retail', label: 'Retail / Comercio' },
  { value: 'salud', label: 'Salud' },
  { value: 'educacion', label: 'Educación' },
  { value: 'construccion', label: 'Construcción e Inmobiliario' },
  { value: 'energia', label: 'Energía y Recursos Naturales' },
  { value: 'telecomunicaciones', label: 'Telecomunicaciones' },
  { value: 'logistica', label: 'Logística y Transporte' },
  { value: 'servicios_profesionales', label: 'Servicios Profesionales' },
  { value: 'otro', label: 'Otro' },
];

export const companySizeOptions = [
  { value: '50-200', label: '50-200 empleados' },
  { value: '201-500', label: '201-500 empleados' },
  { value: '501-1000', label: '501-1000 empleados' },
  { value: '1001-5000', label: '1001-5000 empleados' },
  { value: '5000+', label: 'Más de 5000 empleados' },
];

export const functionalAreaOptions = [
  { value: 'direccion_general', label: 'Dirección General / CEO' },
  { value: 'finanzas', label: 'Finanzas y Contabilidad' },
  { value: 'rrhh', label: 'Recursos Humanos' },
  { value: 'operaciones', label: 'Operaciones' },
  { value: 'comercial', label: 'Comercial / Ventas' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'tecnologia', label: 'Tecnología / TI' },
  { value: 'legal', label: 'Legal' },
  { value: 'supply_chain', label: 'Cadena de Suministro' },
  { value: 'calidad', label: 'Calidad' },
  { value: 'innovacion', label: 'Innovación / I+D' },
  { value: 'otro', label: 'Otro' },
];

export const yearsInCompanyOptions = [
  { value: '0-1', label: 'Menos de 1 año' },
  { value: '1-3', label: '1-3 años' },
  { value: '3-5', label: '3-5 años' },
  { value: '5-10', label: '5-10 años' },
  { value: '10+', label: 'Más de 10 años' },
];

export const decisionLevelOptions = [
  { value: 'estrategico', label: 'Estratégico (C-Level / Directivo)' },
  { value: 'tactico', label: 'Táctico (Gerente / Jefe de Área)' },
  { value: 'operativo', label: 'Operativo (Coordinador / Supervisor)' },
  { value: 'especialista', label: 'Especialista / Analista' },
];

// Preguntas del diagnóstico
export const businessQuestions: BusinessQuestion[] = [
  // Sección 1: Perfil del Respondente (preguntas de contexto)
  {
    id: 'profile_company',
    text: '¿Cuál es el nombre de su empresa?',
    section: businessSections[0],
    type: 'text',
  },
  {
    id: 'profile_industry',
    text: '¿En qué industria opera su empresa?',
    section: businessSections[0],
    type: 'single_choice',
    options: industryOptions,
  },
  {
    id: 'profile_size',
    text: '¿Cuál es el tamaño aproximado de su empresa?',
    section: businessSections[0],
    type: 'single_choice',
    options: companySizeOptions,
  },
  {
    id: 'profile_area',
    text: '¿En qué área funcional trabaja usted?',
    section: businessSections[0],
    type: 'single_choice',
    options: functionalAreaOptions,
  },
  {
    id: 'profile_position',
    text: '¿Cuál es su cargo actual?',
    section: businessSections[0],
    type: 'text',
  },
  {
    id: 'profile_purpose',
    text: '¿Cuál es la principal razón de ser de su cargo? (su misión dentro de la organización)',
    section: businessSections[0],
    type: 'text',
  },
  {
    id: 'profile_years',
    text: '¿Cuántos años lleva en la empresa?',
    section: businessSections[0],
    type: 'single_choice',
    options: yearsInCompanyOptions,
  },
  {
    id: 'profile_decision_level',
    text: '¿A qué nivel de decisión corresponde su rol?',
    section: businessSections[0],
    type: 'single_choice',
    options: decisionLevelOptions,
  },

  // Sección 2: Cultura Organizacional
  {
    id: 'culture_1',
    text: 'Los valores de la empresa se viven en el día a día, no solo están en un cuadro.',
    section: businessSections[1],
    type: 'scale',
  },
  {
    id: 'culture_2',
    text: 'Existe confianza entre las personas para expresar ideas y preocupaciones sin temor.',
    section: businessSections[1],
    type: 'scale',
  },
  {
    id: 'culture_3',
    text: 'La empresa tiene una visión clara que todos comprenden y comparten.',
    section: businessSections[1],
    type: 'scale',
  },
  {
    id: 'culture_4',
    text: 'Se celebran los logros y se reconoce el buen desempeño de manera genuina.',
    section: businessSections[1],
    type: 'scale',
  },

  // Sección 3: Liderazgo y Dirección
  {
    id: 'leadership_1',
    text: 'Los líderes dan el ejemplo con sus acciones, no solo con palabras.',
    section: businessSections[2],
    type: 'scale',
  },
  {
    id: 'leadership_2',
    text: 'Las decisiones importantes se toman de manera oportuna y se comunican claramente.',
    section: businessSections[2],
    type: 'scale',
  },
  {
    id: 'leadership_3',
    text: 'Los líderes desarrollan activamente a sus equipos y delegan apropiadamente.',
    section: businessSections[2],
    type: 'scale',
  },
  {
    id: 'leadership_4',
    text: 'Existe una visión estratégica clara que guía las decisiones del día a día.',
    section: businessSections[2],
    type: 'scale',
  },
  {
    id: 'leadership_5',
    text: 'Los líderes son accesibles y están abiertos al feedback.',
    section: businessSections[2],
    type: 'scale',
  },

  // Sección 4: Procesos y Operaciones
  {
    id: 'processes_1',
    text: 'Los procesos clave están documentados y son conocidos por quienes los ejecutan.',
    section: businessSections[3],
    type: 'scale',
  },
  {
    id: 'processes_2',
    text: 'Existe claridad sobre roles y responsabilidades en cada proceso.',
    section: businessSections[3],
    type: 'scale',
  },
  {
    id: 'processes_3',
    text: 'Se miden y monitorean indicadores de desempeño de los procesos principales.',
    section: businessSections[3],
    type: 'scale',
  },
  {
    id: 'processes_4',
    text: 'Los procesos se revisan y mejoran periódicamente.',
    section: businessSections[3],
    type: 'scale',
  },
  {
    id: 'processes_5',
    text: 'La tecnología apoya adecuadamente la ejecución de los procesos.',
    section: businessSections[3],
    type: 'scale',
  },

  // Sección 5: Gestión del Talento
  {
    id: 'people_1',
    text: 'Contamos con las personas adecuadas en los roles correctos.',
    section: businessSections[4],
    type: 'scale',
  },
  {
    id: 'people_2',
    text: 'Existe un plan de desarrollo profesional claro para los colaboradores.',
    section: businessSections[4],
    type: 'scale',
  },
  {
    id: 'people_3',
    text: 'La compensación y beneficios son competitivos y equitativos.',
    section: businessSections[4],
    type: 'scale',
  },
  {
    id: 'people_4',
    text: 'Se invierte en capacitación y desarrollo de habilidades.',
    section: businessSections[4],
    type: 'scale',
  },
  {
    id: 'people_5',
    text: 'La rotación de personal clave está controlada.',
    section: businessSections[4],
    type: 'scale',
  },

  // Sección 6: Colaboración y Comunicación
  {
    id: 'collaboration_1',
    text: 'Las áreas trabajan de manera coordinada, sin funcionar como silos aislados.',
    section: businessSections[5],
    type: 'scale',
  },
  {
    id: 'collaboration_2',
    text: 'La información fluye de manera oportuna entre las diferentes áreas.',
    section: businessSections[5],
    type: 'scale',
  },
  {
    id: 'collaboration_3',
    text: 'Existen espacios efectivos para la colaboración entre equipos.',
    section: businessSections[5],
    type: 'scale',
  },
  {
    id: 'collaboration_4',
    text: 'Los conflictos entre áreas se resuelven de manera constructiva.',
    section: businessSections[5],
    type: 'scale',
  },
  {
    id: 'collaboration_5',
    text: 'La comunicación interna es clara, oportuna y bidireccional.',
    section: businessSections[5],
    type: 'scale',
  },

  // Sección 7: Innovación y Cambio
  {
    id: 'innovation_1',
    text: 'La empresa está abierta a nuevas ideas y formas de hacer las cosas.',
    section: businessSections[6],
    type: 'scale',
  },
  {
    id: 'innovation_2',
    text: 'Se fomenta la experimentación y se toleran los errores como parte del aprendizaje.',
    section: businessSections[6],
    type: 'scale',
  },
  {
    id: 'innovation_3',
    text: 'La organización responde ágilmente a cambios del mercado o contexto.',
    section: businessSections[6],
    type: 'scale',
  },
  {
    id: 'innovation_4',
    text: 'Se invierten recursos en innovación y mejora continua.',
    section: businessSections[6],
    type: 'scale',
  },
];

// Opciones de respuesta para preguntas de escala
export const scaleAnswerOptions = [
  { value: 1, label: 'Muy en desacuerdo' },
  { value: 2, label: 'En desacuerdo' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'De acuerdo' },
  { value: 5, label: 'Muy de acuerdo' },
];

// Interpretaciones por sección
export const sectionInterpretations = {
  organizational_culture: {
    low: 'La cultura organizacional presenta debilidades significativas que pueden afectar el compromiso y desempeño.',
    medium: 'La cultura existe pero tiene áreas de mejora en consistencia y vivencia de valores.',
    high: 'Cultura organizacional sólida con valores bien arraigados y ambiente de confianza.',
  },
  leadership: {
    low: 'El liderazgo muestra brechas importantes en dirección, comunicación o desarrollo de equipos.',
    medium: 'Liderazgo funcional con oportunidades de mejora en algunas dimensiones.',
    high: 'Liderazgo efectivo que inspira, desarrolla y guía a la organización.',
  },
  processes: {
    low: 'Los procesos son informales, poco documentados o con baja eficiencia operativa.',
    medium: 'Procesos definidos pero con oportunidades de optimización y mejor gestión.',
    high: 'Procesos maduros, bien documentados y en mejora continua.',
  },
  people: {
    low: 'Gestión del talento requiere atención urgente en desarrollo, retención o estructura.',
    medium: 'Prácticas de gestión de personas establecidas con áreas de mejora identificables.',
    high: 'Gestión del talento estratégica con fuerte inversión en desarrollo y retención.',
  },
  collaboration: {
    low: 'Silos organizacionales significativos que afectan la eficiencia y colaboración.',
    medium: 'Colaboración existe pero hay fricciones entre áreas que reducen la efectividad.',
    high: 'Colaboración fluida entre áreas con comunicación efectiva y objetivos compartidos.',
  },
  innovation: {
    low: 'Organización resistente al cambio con baja capacidad de adaptación.',
    medium: 'Apertura moderada a la innovación con margen para mayor agilidad.',
    high: 'Cultura de innovación arraigada con alta capacidad de adaptación al cambio.',
  },
};

// Recomendaciones por área diagnóstica
export const areaRecommendations = {
  organizational_culture: [
    'Realizar talleres de alineamiento de valores con liderazgo',
    'Implementar programa de reconocimiento estructurado',
    'Desarrollar espacios de diálogo abierto entre niveles',
    'Crear rituales organizacionales que refuercen la cultura',
  ],
  leadership: [
    'Programa de desarrollo de liderazgo adaptado a la cultura',
    'Implementar feedback 360° para líderes',
    'Coaching ejecutivo para líderes clave',
    'Establecer modelo de competencias de liderazgo',
  ],
  processes: [
    'Mapeo y documentación de procesos críticos',
    'Implementación de indicadores de gestión (KPIs)',
    'Programa de mejora continua (Lean, Six Sigma)',
    'Evaluar y optimizar tecnología de soporte',
  ],
  people: [
    'Diseño de plan de carrera y sucesión',
    'Revisión de estructura de compensaciones',
    'Programa de capacitación basado en competencias',
    'Implementar gestión del desempeño efectiva',
  ],
  collaboration: [
    'Romper silos con proyectos transversales',
    'Implementar herramientas de colaboración digital',
    'Rediseño de espacios y rituales de coordinación',
    'Programa de comunicación interna efectiva',
  ],
  innovation: [
    'Crear espacios seguros para experimentación',
    'Implementar metodologías ágiles en áreas clave',
    'Programa de intraemprendimiento',
    'Alianzas con ecosistema de innovación externo',
  ],
};
