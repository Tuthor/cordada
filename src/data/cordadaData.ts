import { 
  CordadaStatusInfo, 
  CordadaRoleInfo, 
  RitualTypeInfo,
  CordadaStatus,
  CordadaRole,
  RitualType
} from '@/types/cordada';

// Estados de una Cordada
export const cordadaStatuses: CordadaStatusInfo[] = [
  {
    id: 'draft',
    name: 'Borrador',
    description: 'Desafío en preparación, aún no publicado',
    icon: 'FileEdit',
    color: 'bg-muted text-muted-foreground',
  },
  {
    id: 'convocatoria',
    name: 'Convocatoria',
    description: 'Desafío publicado, buscando equipo',
    icon: 'Megaphone',
    color: 'bg-blue-100 text-blue-800',
  },
  {
    id: 'en_curso',
    name: 'En Curso',
    description: 'Cordada activa trabajando en el desafío',
    icon: 'Mountain',
    color: 'bg-amber-100 text-amber-800',
  },
  {
    id: 'cumbre_alcanzada',
    name: 'Cumbre Alcanzada',
    description: 'Desafío completado exitosamente',
    icon: 'Flag',
    color: 'bg-green-100 text-green-800',
  },
  {
    id: 'cerrada',
    name: 'Cerrada',
    description: 'Cordada finalizada y archivada',
    icon: 'Archive',
    color: 'bg-gray-100 text-gray-800',
  },
];

// 6 Roles Operativos para proyectos colaborativos
export const cordadaRoles: CordadaRoleInfo[] = [
  {
    id: 'guia_alta_montana',
    name: 'Guía de Alta Montaña',
    description: 'Lidera la expedición. Toma decisiones estratégicas y asegura el éxito del equipo.',
    icon: 'Compass',
    recommendedArchetypes: ['ex_ejecutivo', 'tecnico_alto_nivel'],
  },
  {
    id: 'primer_de_cuerda',
    name: 'Primer de Cuerda',
    description: 'Abre camino y enfrenta los desafíos técnicos más complejos del proyecto.',
    icon: 'Route',
    recommendedArchetypes: ['tecnico_alto_nivel', 'experto_silencioso'],
  },
  {
    id: 'asegurador',
    name: 'Asegurador',
    description: 'Garantiza la calidad y valida que cada entregable cumpla los estándares.',
    icon: 'ShieldCheck',
    recommendedArchetypes: ['experto_silencioso', 'tecnico_alto_nivel'],
  },
  {
    id: 'explorador',
    name: 'Explorador',
    description: 'Investiga terreno desconocido, identifica oportunidades y riesgos emergentes.',
    icon: 'Binoculars',
    recommendedArchetypes: ['consultor_incompleto', 'independiente_quemado'],
  },
  {
    id: 'sherpa',
    name: 'Sherpa',
    description: 'Facilita la logística, coordina recursos y asegura que el equipo avance sin fricciones.',
    icon: 'Backpack',
    recommendedArchetypes: ['ex_ejecutivo', 'consultor_incompleto'],
  },
  {
    id: 'cronista',
    name: 'Cronista',
    description: 'Documenta el proceso, captura aprendizajes y comunica avances a stakeholders.',
    icon: 'BookOpen',
    recommendedArchetypes: ['consultor_incompleto', 'independiente_quemado'],
  },
];

// 3 Rituales de seguimiento
export const ritualTypes: RitualTypeInfo[] = [
  {
    id: 'brief_cordada',
    name: 'Brief de Cordada',
    description: 'Reunión inicial para alinear equipo, definir objetivos y establecer reglas de la expedición.',
    icon: 'PlayCircle',
    step: 1,
  },
  {
    id: 'chequeo_tramo',
    name: 'Chequeo de Tramo',
    description: 'Punto intermedio para evaluar avance, ajustar rumbo y resolver bloqueos.',
    icon: 'CheckCircle2',
    step: 2,
  },
  {
    id: 'cierre_cumbre',
    name: 'Cierre de Cumbre',
    description: 'Celebración final, documentación de impacto y retroalimentación del cliente.',
    icon: 'Trophy',
    step: 3,
  },
];

// Helper functions
export const getCordadaStatusInfo = (status: CordadaStatus): CordadaStatusInfo => {
  return cordadaStatuses.find(s => s.id === status) || cordadaStatuses[0];
};

export const getCordadaRoleInfo = (role: CordadaRole): CordadaRoleInfo => {
  return cordadaRoles.find(r => r.id === role) || cordadaRoles[0];
};

export const getRitualTypeInfo = (type: RitualType): RitualTypeInfo => {
  return ritualTypes.find(r => r.id === type) || ritualTypes[0];
};

// Expertise options for cordadas
export const expertiseOptions = [
  'Estrategia',
  'Transformación Digital',
  'Gestión del Cambio',
  'Desarrollo Organizacional',
  'Marketing y Ventas',
  'Finanzas',
  'Operaciones',
  'Tecnología',
  'Recursos Humanos',
  'Innovación',
  'Sostenibilidad',
  'Supply Chain',
];
