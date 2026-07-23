export interface FirmMaturityDimension {
  id: string;
  name: string;
  description: string;
}

export const FIRM_MATURITY_DIMENSIONS: FirmMaturityDimension[] = [
  { id: 'methodology', name: 'Metodología propia documentada', description: 'La firma cuenta con marcos y metodologías propias documentadas y actualizadas.' },
  { id: 'knowledge', name: 'Gestión del conocimiento', description: 'Existen repositorios, plantillas y prácticas activas de reutilización de aprendizajes.' },
  { id: 'quality', name: 'Aseguramiento de calidad', description: 'Los entregables pasan por revisiones formales de calidad antes de su entrega.' },
  { id: 'talent', name: 'Desarrollo interno de consultores', description: 'Existen planes de carrera, mentoría y capacitación continua para los consultores.' },
  { id: 'multidisciplinary', name: 'Capacidad multidisciplinaria', description: 'La firma puede componer equipos multidisciplinarios y escalar según el desafío.' },
  { id: 'ethics', name: 'Ética y confidencialidad', description: 'Existen políticas formales de ética, conflictos de interés y confidencialidad.' },
  { id: 'track_record', name: 'Track record medible', description: 'La firma puede demostrar impacto medible en clientes representativos.' },
];

export const SECTOR_OPTIONS = [
  'Minería', 'Retail', 'Banca y Servicios Financieros', 'Salud', 'Educación',
  'Manufactura', 'Tecnología', 'Energía', 'Telecomunicaciones', 'Gobierno',
  'Consumo Masivo', 'Logística', 'Construcción', 'Agroindustria',
];

export const PRACTICE_AREA_OPTIONS = [
  'Estrategia', 'Transformación Digital', 'Operaciones', 'Personas y Cultura',
  'Finanzas y Riesgos', 'Datos y Analítica', 'Ciberseguridad',
  'Sostenibilidad', 'Marketing y Crecimiento', 'Gobierno Corporativo',
];

export const REVENUE_RANGES = [
  '< 5.000 UF', '5.000 – 25.000 UF', '25.000 – 100.000 UF',
  '100.000 – 500.000 UF', '> 500.000 UF',
];
