import { 
  ConsultantArchetypeInfo, 
  ApplicationStatusInfo, 
  RiskAlertInfo,
  ConsultantArchetype,
  ApplicationStatus,
  RiskAlertType
} from '@/types/orchestration';

// 5 Arquetipos de Consultor para clasificación de perfil
export const consultantArchetypes: ConsultantArchetypeInfo[] = [
  {
    id: 'experto_silencioso',
    name: 'Experto Silencioso',
    icon: 'GraduationCap',
    description: 'Conocimiento profundo pero baja visibilidad comercial. Puede resolver problemas complejos pero no sabe venderse.',
    characteristics: [
      'Alto expertise técnico',
      'Introversión comercial',
      'Reputación por boca a boca',
      'Dificultad para definir oferta',
    ],
    riskFactors: ['riesgo_comercial'],
    recommendedSupport: 'Acompañamiento comercial intensivo, definición de oferta clara, visibilización gradual',
  },
  {
    id: 'ex_ejecutivo',
    name: 'Ex-Ejecutivo',
    icon: 'Briefcase',
    description: 'Trayectoria corporativa sólida pero mentalidad aún organizacional. Define su valor por cargos previos más que por resultados futuros.',
    characteristics: [
      'Red de contactos amplia',
      'Credenciales corporativas',
      'Mentalidad de empleado',
      'Resistencia a adaptarse',
    ],
    riskFactors: ['sobreconfianza'],
    recommendedSupport: 'Desaprender modelo organizacional, construir propuesta de valor independiente',
  },
  {
    id: 'tecnico_alto_nivel',
    name: 'Técnico de Alto Nivel',
    icon: 'Cpu',
    description: 'Especialista muy profundo en un área específica. Altísima competencia técnica pero puede tener dificultad para ver el panorama completo.',
    characteristics: [
      'Especialización extrema',
      'Actualización constante',
      'Foco en detalle',
      'Posible visión de túnel',
    ],
    riskFactors: ['riesgo_comercial'],
    recommendedSupport: 'Conexión con perfiles complementarios, desarrollo de habilidades de comunicación ejecutiva',
  },
  {
    id: 'consultor_incompleto',
    name: 'Consultor Incompleto',
    icon: 'PuzzlePiece',
    description: 'Tiene algunos elementos pero le faltan otros críticos. Puede vender pero no ejecutar, o viceversa. Necesita desarrollo dirigido.',
    characteristics: [
      'Gaps identificables',
      'Potencial de desarrollo',
      'Necesita mentoría',
      'Ambición de crecimiento',
    ],
    riskFactors: ['riesgo_comercial', 'sobreconfianza'],
    recommendedSupport: 'Plan de desarrollo personalizado, mentoría con guía experimentado, proyectos supervisados',
  },
  {
    id: 'independiente_quemado',
    name: 'Independiente Quemado',
    icon: 'Flame',
    description: 'Experiencia significativa pero con signos de desgaste. Ha estado solo mucho tiempo y puede tener patrones de trabajo insostenibles.',
    characteristics: [
      'Experiencia amplia',
      'Patrones de sobrecarga',
      'Posible cinismo',
      'Necesita reconexión',
    ],
    riskFactors: ['desgaste_cautela'],
    recommendedSupport: 'Trabajo en comunidad, límites saludables, redescubrimiento de propósito',
  },
];

// Estados del embudo de postulación
export const applicationStatuses: ApplicationStatusInfo[] = [
  {
    id: 'postulacion',
    name: 'Postulación',
    description: 'Postulación inicial recibida y en revisión',
    step: 1,
  },
  {
    id: 'entrevista_pendiente',
    name: 'Entrevista Pendiente',
    description: 'Aprobado para entrevista, pendiente de agendar',
    step: 2,
  },
  {
    id: 'entrevista_realizada',
    name: 'Entrevista Realizada',
    description: 'Entrevista completada, en evaluación',
    step: 3,
  },
  {
    id: 'codigo_conducta_pendiente',
    name: 'Código de Conducta',
    description: 'Pendiente de aceptar el código de conducta',
    step: 4,
  },
  {
    id: 'aceptado',
    name: 'Aceptado',
    description: 'Consultor aceptado en La Cordada',
    step: 5,
  },
  {
    id: 'rechazado',
    name: 'Rechazado',
    description: 'Postulación no aceptada',
    step: 0,
  },
];

// Alertas de riesgo
export const riskAlerts: RiskAlertInfo[] = [
  {
    id: 'riesgo_comercial',
    name: 'Riesgo Comercial',
    description: 'No sabe vender su propuesta de valor. Requiere acompañamiento comercial.',
    severity: 'high',
    icon: 'TrendingDown',
  },
  {
    id: 'desgaste_cautela',
    name: 'Desgaste / Cautela Alta',
    description: 'Signos de burnout o patrones de trabajo insostenibles. Requiere monitoreo.',
    severity: 'medium',
    icon: 'AlertTriangle',
  },
  {
    id: 'sobreconfianza',
    name: 'Sobreconfianza',
    description: 'Baja disciplina de alcance, puede prometer más de lo que puede entregar.',
    severity: 'high',
    icon: 'ShieldAlert',
  },
];

// Helper functions
export const getArchetypeInfo = (archetype: ConsultantArchetype): ConsultantArchetypeInfo => {
  return consultantArchetypes.find(a => a.id === archetype) || consultantArchetypes[0];
};

export const getStatusInfo = (status: ApplicationStatus): ApplicationStatusInfo => {
  return applicationStatuses.find(s => s.id === status) || applicationStatuses[0];
};

export const getRiskAlertInfo = (alert: RiskAlertType): RiskAlertInfo => {
  return riskAlerts.find(r => r.id === alert) || riskAlerts[0];
};

// Questions for archetype test (to classify consultants into 5 archetypes)
export interface ArchetypeQuestion {
  id: string;
  text: string;
  archetype: ConsultantArchetype;
}

export const archetypeQuestions: ArchetypeQuestion[] = [
  // Experto Silencioso (4 preguntas)
  {
    id: 'a1',
    text: 'Tengo conocimiento técnico profundo pero me cuesta explicar lo que hago de forma simple.',
    archetype: 'experto_silencioso',
  },
  {
    id: 'a2',
    text: 'Mis clientes llegan principalmente por recomendación, no por esfuerzos comerciales míos.',
    archetype: 'experto_silencioso',
  },
  {
    id: 'a3',
    text: 'Prefiero resolver problemas que vender soluciones.',
    archetype: 'experto_silencioso',
  },
  {
    id: 'a4',
    text: 'Me incomoda hablar de mis logros o promocionarme.',
    archetype: 'experto_silencioso',
  },
  // Ex-Ejecutivo (4 preguntas)
  {
    id: 'a5',
    text: 'Mi valor principal viene de los cargos y empresas donde trabajé.',
    archetype: 'ex_ejecutivo',
  },
  {
    id: 'a6',
    text: 'Extraño tener un equipo y recursos organizacionales a mi disposición.',
    archetype: 'ex_ejecutivo',
  },
  {
    id: 'a7',
    text: 'Mi red de contactos es mi principal activo para conseguir proyectos.',
    archetype: 'ex_ejecutivo',
  },
  {
    id: 'a8',
    text: 'A veces me cuesta adaptarme a la flexibilidad (y soledad) del trabajo independiente.',
    archetype: 'ex_ejecutivo',
  },
  // Técnico de Alto Nivel (4 preguntas)
  {
    id: 'a9',
    text: 'Soy considerado un experto muy especializado en mi área.',
    archetype: 'tecnico_alto_nivel',
  },
  {
    id: 'a10',
    text: 'Invierto tiempo significativo en mantenerme actualizado técnicamente.',
    archetype: 'tecnico_alto_nivel',
  },
  {
    id: 'a11',
    text: 'Prefiero proyectos donde pueda profundizar técnicamente.',
    archetype: 'tecnico_alto_nivel',
  },
  {
    id: 'a12',
    text: 'A veces me frustro cuando los clientes no entienden la complejidad técnica.',
    archetype: 'tecnico_alto_nivel',
  },
  // Consultor Incompleto (4 preguntas)
  {
    id: 'a13',
    text: 'Sé que tengo gaps importantes en mi práctica consultiva.',
    archetype: 'consultor_incompleto',
  },
  {
    id: 'a14',
    text: 'A veces vendo proyectos que después me cuestan ejecutar.',
    archetype: 'consultor_incompleto',
  },
  {
    id: 'a15',
    text: 'Me beneficiaría mucho de un mentor o guía más experimentado.',
    archetype: 'consultor_incompleto',
  },
  {
    id: 'a16',
    text: 'Estoy en un momento de transición y desarrollo profesional.',
    archetype: 'consultor_incompleto',
  },
  // Independiente Quemado (4 preguntas)
  {
    id: 'a17',
    text: 'He trabajado solo por mucho tiempo y a veces siento desgaste.',
    archetype: 'independiente_quemado',
  },
  {
    id: 'a18',
    text: 'Mis proyectos exitosos han venido con alto costo personal.',
    archetype: 'independiente_quemado',
  },
  {
    id: 'a19',
    text: 'A veces me pregunto si vale la pena seguir como independiente.',
    archetype: 'independiente_quemado',
  },
  {
    id: 'a20',
    text: 'Me costaría confiar en otros para delegar trabajo importante.',
    archetype: 'independiente_quemado',
  },
];

export const archetypeAnswerOptions = [
  { value: 1, label: 'Muy en desacuerdo' },
  { value: 2, label: 'En desacuerdo' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'De acuerdo' },
  { value: 5, label: 'Muy de acuerdo' },
];
