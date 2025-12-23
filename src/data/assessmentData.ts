import { Category, Question, MaturityLevelInfo } from '@/types/assessment';

export const categories: Category[] = [
  {
    id: 'expertise',
    name: 'Experiencia Técnica',
    icon: 'Lightbulb',
    description: 'Conocimiento del dominio y habilidades especializadas',
  },
  {
    id: 'client',
    name: 'Gestión de Clientes',
    icon: 'Users',
    description: 'Construcción de relaciones y gestión de stakeholders',
  },
  {
    id: 'communication',
    name: 'Comunicación',
    icon: 'MessageSquare',
    description: 'Habilidades de comunicación escrita y verbal',
  },
  {
    id: 'problem-solving',
    name: 'Resolución de Problemas',
    icon: 'Target',
    description: 'Pensamiento analítico y diseño de soluciones',
  },
  {
    id: 'professionalism',
    name: 'Profesionalismo',
    icon: 'Award',
    description: 'Ética laboral, confiabilidad y estándares profesionales',
  },
];

export const questions: Question[] = [
  // Experiencia Técnica
  {
    id: 'exp-1',
    text: '¿Cómo calificarías tu nivel de experiencia en tu área principal de consultoría?',
    category: categories[0],
    options: [
      { value: 1, label: 'Principiante', description: 'Aún aprendiendo los fundamentos' },
      { value: 2, label: 'Intermedio', description: 'Base sólida con algo de experiencia práctica' },
      { value: 3, label: 'Avanzado', description: 'Experiencia profunda con trayectoria comprobada' },
      { value: 4, label: 'Experto', description: 'Líder de pensamiento reconocido en el campo' },
    ],
  },
  {
    id: 'exp-2',
    text: '¿Cuántos años de experiencia relevante en la industria tienes?',
    category: categories[0],
    options: [
      { value: 1, label: '0-2 años', description: 'Profesional en etapa temprana de carrera' },
      { value: 2, label: '3-5 años', description: 'Profesional establecido' },
      { value: 3, label: '6-10 años', description: 'Profesional senior' },
      { value: 4, label: '10+ años', description: 'Experto veterano' },
    ],
  },
  {
    id: 'exp-3',
    text: '¿Tienes certificaciones o credenciales profesionales relevantes?',
    category: categories[0],
    options: [
      { value: 1, label: 'Ninguna', description: 'Sin certificaciones formales' },
      { value: 2, label: 'En proceso', description: 'Actualmente buscando certificación' },
      { value: 3, label: 'Una certificación', description: 'Posee una credencial relevante' },
      { value: 4, label: 'Múltiples', description: 'Múltiples certificaciones reconocidas' },
    ],
  },
  // Gestión de Clientes
  {
    id: 'cli-1',
    text: '¿Cuánta experiencia tienes en gestionar relaciones con clientes empresariales?',
    category: categories[1],
    options: [
      { value: 1, label: 'Limitada', description: 'Mínima interacción directa con clientes' },
      { value: 2, label: 'Algo de experiencia', description: 'Trabajé con clientes bajo supervisión' },
      { value: 3, label: 'Experimentado', description: 'Gestioné múltiples clientes de forma independiente' },
      { value: 4, label: 'Extensa', description: 'Lideré alianzas estratégicas con clientes' },
    ],
  },
  {
    id: 'cli-2',
    text: '¿Cómo manejas típicamente situaciones difíciles con clientes?',
    category: categories[1],
    options: [
      { value: 1, label: 'Escalo', description: 'Prefiero escalar a superiores' },
      { value: 2, label: 'Con orientación', description: 'Puedo manejar con algo de apoyo' },
      { value: 3, label: 'Independientemente', description: 'Resuelvo la mayoría de problemas de forma independiente' },
      { value: 4, label: 'Proactivamente', description: 'Anticipo y prevengo problemas' },
    ],
  },
  {
    id: 'cli-3',
    text: '¿Cuál es tu experiencia con el compromiso de stakeholders de nivel ejecutivo (C-suite)?',
    category: categories[1],
    options: [
      { value: 1, label: 'Ninguna', description: 'Sin interacción directa con ejecutivos' },
      { value: 2, label: 'Ocasional', description: 'Presentaciones o reuniones limitadas' },
      { value: 3, label: 'Regular', description: 'Compromiso frecuente con ejecutivos' },
      { value: 4, label: 'Estratégica', description: 'Asesor de confianza para ejecutivos' },
    ],
  },
  // Comunicación
  {
    id: 'com-1',
    text: '¿Cómo calificarías tus habilidades de presentación y narración?',
    category: categories[2],
    options: [
      { value: 1, label: 'En desarrollo', description: 'Aún construyendo confianza' },
      { value: 2, label: 'Competente', description: 'Puedo dar presentaciones claras' },
      { value: 3, label: 'Fuerte', description: 'Presentador atractivo y persuasivo' },
      { value: 4, label: 'Excepcional', description: 'Narrador cautivador' },
    ],
  },
  {
    id: 'com-2',
    text: '¿Qué tan competente eres en crear documentación de nivel ejecutivo?',
    category: categories[2],
    options: [
      { value: 1, label: 'Básico', description: 'Necesito apoyo significativo de edición' },
      { value: 2, label: 'Bueno', description: 'Puedo producir borradores de calidad' },
      { value: 3, label: 'Muy bueno', description: 'Documentos pulidos y profesionales' },
      { value: 4, label: 'Excelente', description: 'Materiales listos para publicación' },
    ],
  },
  {
    id: 'com-3',
    text: '¿Qué tan cómodo te sientes facilitando talleres y reuniones?',
    category: categories[2],
    options: [
      { value: 1, label: 'Incómodo', description: 'Prefiero no facilitar' },
      { value: 2, label: 'Adecuado', description: 'Puedo facilitar con preparación' },
      { value: 3, label: 'Cómodo', description: 'Facilitador confiado' },
      { value: 4, label: 'Experto', description: 'Hábil para impulsar resultados' },
    ],
  },
  // Resolución de Problemas
  {
    id: 'ps-1',
    text: '¿Cómo abordas problemas complejos y ambiguos?',
    category: categories[3],
    options: [
      { value: 1, label: 'Necesito estructura', description: 'Requiero marcos claros' },
      { value: 2, label: 'Metódico', description: 'Aplico metodologías estándar' },
      { value: 3, label: 'Adaptable', description: 'Personalizo enfoques según sea necesario' },
      { value: 4, label: 'Innovador', description: 'Creo soluciones novedosas' },
    ],
  },
  {
    id: 'ps-2',
    text: '¿Cuál es tu experiencia con la toma de decisiones basada en datos?',
    category: categories[3],
    options: [
      { value: 1, label: 'Limitada', description: 'Interpretación básica de datos' },
      { value: 2, label: 'Moderada', description: 'Puedo analizar y presentar datos' },
      { value: 3, label: 'Fuerte', description: 'Capacidad analítica avanzada' },
      { value: 4, label: 'Experto', description: 'Liderazgo estratégico de datos' },
    ],
  },
  {
    id: 'ps-3',
    text: '¿Cómo manejas plazos ajustados y situaciones de alta presión?',
    category: categories[3],
    options: [
      { value: 1, label: 'Con dificultad', description: 'Encuentro la presión difícil' },
      { value: 2, label: 'Manejo', description: 'Puedo lidiar con apoyo' },
      { value: 3, label: 'Prospero', description: 'Rindo bien bajo presión' },
      { value: 4, label: 'Destaco', description: 'Mi mejor trabajo es bajo presión' },
    ],
  },
  // Profesionalismo
  {
    id: 'pro-1',
    text: '¿Cómo describirías tu disponibilidad y capacidad de respuesta?',
    category: categories[4],
    options: [
      { value: 1, label: 'Estándar', description: 'Solo horario laboral regular' },
      { value: 2, label: 'Flexible', description: 'Acomodaticio cuando es necesario' },
      { value: 3, label: 'Altamente disponible', description: 'Respuesta rápida, horario extendido' },
      { value: 4, label: 'Siempre disponible', description: 'Disponibilidad orientada al cliente' },
    ],
  },
  {
    id: 'pro-2',
    text: '¿Cuál es tu historial con la entrega de proyectos?',
    category: categories[4],
    options: [
      { value: 1, label: 'En desarrollo', description: 'Aún construyendo historial' },
      { value: 2, label: 'Bueno', description: 'Generalmente cumplo expectativas' },
      { value: 3, label: 'Fuerte', description: 'Entrego calidad consistentemente' },
      { value: 4, label: 'Excepcional', description: 'Supero expectativas regularmente' },
    ],
  },
  {
    id: 'pro-3',
    text: '¿Cómo manejas la confidencialidad y la ética profesional?',
    category: categories[4],
    options: [
      { value: 1, label: 'Consciente', description: 'Entiendo la importancia' },
      { value: 2, label: 'Cumplidor', description: 'Sigo las directrices establecidas' },
      { value: 3, label: 'Riguroso', description: 'Adherencia estricta a estándares' },
      { value: 4, label: 'Ejemplar', description: 'Modelo a seguir en ética' },
    ],
  },
];

export const maturityLevels: MaturityLevelInfo[] = [
  {
    level: 'emerging',
    name: 'Consultor Emergente',
    description: 'Estás al inicio de tu camino en consultoría con habilidades fundamentales sobre las cuales construir.',
    minPercentage: 0,
    maxPercentage: 40,
    recommendation: 'Recomendamos ganar más experiencia práctica y obtener certificaciones relevantes antes de unirte a nuestro ecosistema. Considera nuestro programa de mentoría para acelerar tu crecimiento.',
  },
  {
    level: 'developing',
    name: 'Consultor en Desarrollo',
    description: 'Tienes fundamentos sólidos y estás desarrollando las habilidades necesarias para consultoría empresarial.',
    minPercentage: 41,
    maxPercentage: 55,
    recommendation: 'Muestras potencial y podrías ser un buen candidato para tipos específicos de proyectos. Sugerimos aplicar a nuestro track de consultor asociado con mentoría guiada.',
  },
  {
    level: 'proficient',
    name: 'Consultor Competente',
    description: 'Demuestras capacidades sólidas en las competencias clave de consultoría.',
    minPercentage: 56,
    maxPercentage: 70,
    recommendation: 'Estás bien calificado para nuestra red de consultores. Aplica ahora para ser emparejado con compromisos empresariales apropiados.',
  },
  {
    level: 'advanced',
    name: 'Consultor Avanzado',
    description: 'Muestras dominio avanzado con capacidad comprobada para entregar compromisos empresariales complejos.',
    minPercentage: 71,
    maxPercentage: 85,
    recommendation: 'Eres un excelente candidato para roles de consultoría senior. Aplica para colocación prioritaria en compromisos estratégicos de alto impacto.',
  },
  {
    level: 'expert',
    name: 'Consultor Experto',
    description: 'Representas el nivel más alto de excelencia en consultoría con capacidades excepcionales en todas las dimensiones.',
    minPercentage: 86,
    maxPercentage: 100,
    recommendation: 'Eres un candidato principal para nuestro nivel élite de consultores. Aplica para consideración inmediata para roles de liderazgo y posiciones de asesoría estratégica.',
  },
];

export const getMaturityLevel = (percentage: number): MaturityLevelInfo => {
  return maturityLevels.find(
    (level) => percentage >= level.minPercentage && percentage <= level.maxPercentage
  ) || maturityLevels[0];
};
