import { RoleCategory, RoleQuestion, RoleArchetypeInfo, RoleArchetype } from '@/types/roleAssessment';

// 6 Arquetipos de la Cordada
export const roleCategories: RoleCategory[] = [
  {
    id: 'guia_alta_montana',
    name: 'Guía de Alta Montaña',
    icon: 'Mountain',
    description: 'Define dirección, prioridades y toma decisiones difíciles',
  },
  {
    id: 'primer_de_cuerda',
    name: 'Primer de Cuerda',
    icon: 'Navigation',
    description: 'Avanza primero cuando el camino no está claro',
  },
  {
    id: 'asegurador',
    name: 'Asegurador',
    icon: 'Shield',
    description: 'Protege al equipo y asegura pasos firmes',
  },
  {
    id: 'explorador',
    name: 'Explorador',
    icon: 'Compass',
    description: 'Explora rutas nuevas y cuestiona lo establecido',
  },
  {
    id: 'sherpa',
    name: 'Sherpa',
    icon: 'Backpack',
    description: 'Carga tareas pesadas para que el grupo avance',
  },
  {
    id: 'cronista',
    name: 'Cronista',
    icon: 'BookOpen',
    description: 'Observa patrones y transforma experiencia en aprendizaje',
  },
];

// 24 preguntas del Test de Arquetipo (4 por arquetipo)
export const roleQuestions: RoleQuestion[] = [
  // Guía de Alta Montaña (4 preguntas)
  {
    id: 'r1',
    text: 'Me preocupo de definir si vale la pena subir esta montaña y por qué.',
    archetype: 'guia_alta_montana',
  },
  {
    id: 'r7',
    text: 'Tomo decisiones difíciles aunque impliquen renuncias o costos.',
    archetype: 'guia_alta_montana',
  },
  {
    id: 'r13',
    text: 'El equipo espera que yo marque dirección y prioridades.',
    archetype: 'guia_alta_montana',
  },
  {
    id: 'r19',
    text: 'Me preocupa más equivocarnos de montaña que equivocarnos de paso.',
    archetype: 'guia_alta_montana',
  },
  // Primer de Cuerda (4 preguntas)
  {
    id: 'r2',
    text: 'Me motiva ser quien avanza primero cuando el camino no está claro.',
    archetype: 'primer_de_cuerda',
  },
  {
    id: 'r8',
    text: 'Asumo el riesgo de probar primero, aun sabiendo que puedo fallar.',
    archetype: 'primer_de_cuerda',
  },
  {
    id: 'r14',
    text: 'Me siento cómodo siendo referente técnico u operativo en tramos críticos.',
    archetype: 'primer_de_cuerda',
  },
  {
    id: 'r20',
    text: 'Prefiero equivocarme avanzando que quedarme quieto.',
    archetype: 'primer_de_cuerda',
  },
  // Asegurador (4 preguntas)
  {
    id: 'r3',
    text: 'Mi foco inicial es asegurar que el equipo no se caiga mientras avanza.',
    archetype: 'asegurador',
  },
  {
    id: 'r9',
    text: 'Me aseguro de que los pasos sean firmes antes de seguir avanzando.',
    archetype: 'asegurador',
  },
  {
    id: 'r15',
    text: 'Mi aporte principal es dar tranquilidad y respaldo al resto.',
    archetype: 'asegurador',
  },
  {
    id: 'r21',
    text: 'Cuando algo falla, pienso primero en cómo proteger al equipo.',
    archetype: 'asegurador',
  },
  // Explorador (4 preguntas)
  {
    id: 'r4',
    text: 'Me entusiasma explorar rutas nuevas, aunque no sepamos a dónde llevan.',
    archetype: 'explorador',
  },
  {
    id: 'r10',
    text: 'Me aburro si todo está demasiado planificado.',
    archetype: 'explorador',
  },
  {
    id: 'r16',
    text: 'Suelo cuestionar la ruta oficial y proponer alternativas.',
    archetype: 'explorador',
  },
  {
    id: 'r22',
    text: 'Veo el error como parte natural del descubrimiento.',
    archetype: 'explorador',
  },
  // Sherpa (4 preguntas)
  {
    id: 'r5',
    text: 'Pienso inmediatamente en qué hay que hacer para que esto avance en serio.',
    archetype: 'sherpa',
  },
  {
    id: 'r11',
    text: 'Cargo tareas pesadas o poco visibles para que el grupo no se detenga.',
    archetype: 'sherpa',
  },
  {
    id: 'r17',
    text: 'Me preocupo de que nadie se quede atrás.',
    archetype: 'sherpa',
  },
  {
    id: 'r23',
    text: 'Ante el error, me enfoco en resolver y seguir.',
    archetype: 'sherpa',
  },
  // Cronista (4 preguntas)
  {
    id: 'r6',
    text: 'Mientras otros actúan, voy observando patrones y aprendizajes.',
    archetype: 'cronista',
  },
  {
    id: 'r12',
    text: 'Transformo lo vivido en historias, aprendizajes o material reutilizable.',
    archetype: 'cronista',
  },
  {
    id: 'r18',
    text: 'Ayudo a otros a entender qué pasó y por qué.',
    archetype: 'cronista',
  },
  {
    id: 'r24',
    text: 'Del error extraigo aprendizajes que pueden servir a otros.',
    archetype: 'cronista',
  },
];

// Información detallada de cada arquetipo
export const roleArchetypeInfos: RoleArchetypeInfo[] = [
  {
    archetype: 'guia_alta_montana',
    name: 'Guía de Alta Montaña',
    icon: 'Mountain',
    characteristic: 'Estratega visionario',
    phrase: 'Mi rol no es escalar más, es que la cordada no se caiga',
    description: 'Defines la dirección estratégica y tomas decisiones difíciles. Tu visión permite al equipo elegir las montañas correctas y no solo escalarlas bien. Priorizas el propósito sobre la ejecución.',
    strengths: [
      'Visión estratégica clara',
      'Capacidad de decisión bajo presión',
      'Liderazgo inspirador',
      'Priorización efectiva',
    ],
    potentialWeaknesses: [
      'Puede desconectarse de la operación',
      'Riesgo de centralizar decisiones',
      'Puede subestimar la complejidad táctica',
    ],
    bestContext: 'Proyectos de alta incertidumbre, definición de rumbo, transformaciones organizacionales',
    complementaryRoles: ['primer_de_cuerda', 'asegurador'],
  },
  {
    archetype: 'primer_de_cuerda',
    name: 'Primer de Cuerda',
    icon: 'Navigation',
    characteristic: 'Pionero técnico',
    phrase: 'Avanzo primero para que otros puedan seguir',
    description: 'Eres quien avanza primero cuando el camino no está claro. Asumes riesgos calculados y abres camino para el resto del equipo. Tu expertise técnica y valentía son fundamentales en tramos críticos.',
    strengths: [
      'Capacidad técnica sólida',
      'Valentía para liderar en incertidumbre',
      'Referente operativo',
      'Orientación a la acción',
    ],
    potentialWeaknesses: [
      'Puede avanzar más rápido que el equipo',
      'Riesgo de aislarse',
      'Puede subestimar la necesidad de consenso',
    ],
    bestContext: 'Fases de descubrimiento, prototipos, tramos técnicos complejos',
    complementaryRoles: ['asegurador', 'sherpa'],
  },
  {
    archetype: 'asegurador',
    name: 'Asegurador',
    icon: 'Shield',
    characteristic: 'Protector metodológico',
    phrase: 'Mi foco es que el equipo no se caiga mientras avanza',
    description: 'Tu prioridad es la seguridad y estabilidad del equipo. Verificas que los pasos sean firmes antes de avanzar y proteges al grupo cuando algo falla. Das tranquilidad y respaldo.',
    strengths: [
      'Gestión de riesgos',
      'Metodología rigurosa',
      'Estabilidad emocional',
      'Protección del equipo',
    ],
    potentialWeaknesses: [
      'Puede frenar la velocidad',
      'Riesgo de exceso de cautela',
      'Puede resistir cambios necesarios',
    ],
    bestContext: 'Proyectos de alto riesgo, fases de consolidación, entornos regulados',
    complementaryRoles: ['primer_de_cuerda', 'explorador'],
  },
  {
    archetype: 'explorador',
    name: 'Explorador',
    icon: 'Compass',
    characteristic: 'Innovador curioso',
    phrase: 'Me entusiasma descubrir rutas que nadie ha probado',
    description: 'Te entusiasma explorar rutas nuevas y cuestionar lo establecido. Ves el error como parte natural del descubrimiento y te aburres cuando todo está demasiado planificado.',
    strengths: [
      'Creatividad e innovación',
      'Pensamiento divergente',
      'Adaptabilidad',
      'Cuestionamiento constructivo',
    ],
    potentialWeaknesses: [
      'Puede dispersarse',
      'Riesgo de ignorar lo probado',
      'Puede frustrarse con la rutina',
    ],
    bestContext: 'Innovación, exploración de mercados, disrupciones, ideación',
    complementaryRoles: ['asegurador', 'cronista'],
  },
  {
    archetype: 'sherpa',
    name: 'Sherpa',
    icon: 'Backpack',
    characteristic: 'Ejecutor incansable',
    phrase: 'Cargo lo pesado para que el grupo no se detenga',
    description: 'Te enfocas en que las cosas avancen. Cargas tareas pesadas o poco visibles para que el equipo no se detenga. Te preocupas de que nadie se quede atrás y ante el error, resuelves y sigues.',
    strengths: [
      'Capacidad de ejecución',
      'Resiliencia',
      'Orientación al equipo',
      'Pragmatismo',
    ],
    potentialWeaknesses: [
      'Puede sobrecargarse',
      'Riesgo de invisibilizarse',
      'Puede descuidar la estrategia',
    ],
    bestContext: 'Implementación, proyectos de alta carga operativa, equipos en formación',
    complementaryRoles: ['guia_alta_montana', 'primer_de_cuerda'],
  },
  {
    archetype: 'cronista',
    name: 'Cronista',
    icon: 'BookOpen',
    characteristic: 'Observador reflexivo',
    phrase: 'Transformo lo vivido en aprendizajes para otros',
    description: 'Mientras otros actúan, observas patrones y aprendizajes. Transformas lo vivido en historias, aprendizajes o material reutilizable. Ayudas a otros a entender qué pasó y por qué.',
    strengths: [
      'Capacidad de síntesis',
      'Documentación efectiva',
      'Visión sistémica',
      'Transferencia de conocimiento',
    ],
    potentialWeaknesses: [
      'Puede parecer pasivo',
      'Riesgo de no actuar',
      'Puede desconectarse de la urgencia',
    ],
    bestContext: 'Gestión del conocimiento, retrospectivas, formación, comunicación',
    complementaryRoles: ['explorador', 'guia_alta_montana'],
  },
];

export const getRoleArchetypeInfo = (archetype: RoleArchetype): RoleArchetypeInfo => {
  return roleArchetypeInfos.find(info => info.archetype === archetype) || roleArchetypeInfos[0];
};

// Opciones de respuesta estándar (1-5)
export const roleAnswerOptions = [
  { value: 1, label: 'Muy en desacuerdo' },
  { value: 2, label: 'En desacuerdo' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'De acuerdo' },
  { value: 5, label: 'Muy de acuerdo' },
];
