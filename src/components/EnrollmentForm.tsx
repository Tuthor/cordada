import { useEffect, useRef, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { Button } from '@/components/ui/button';
import { AssessmentResult, MaturityLevelInfo } from '@/types/assessment';
import { RoleAssessmentResult } from '@/types/roleAssessment';
import { generateResultsPDF } from '@/utils/generateResultsPDF';
import { 
  Users, 
  Briefcase, 
  Globe, 
  CheckCircle, 
  ArrowRight,
  Building2,
  Mail,
  User,
  Phone,
  Linkedin,
  ShieldCheck,
  Compass,
  FileDown
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EnrollmentFormProps {
  result: AssessmentResult;
  levelInfo: MaturityLevelInfo;
  roleResult?: RoleAssessmentResult | null;
  onBack: () => void;
  firmToken?: string;
  leaderToken?: string;
}

const EnrollmentForm = ({ result, levelInfo, roleResult, onBack, firmToken, leaderToken }: EnrollmentFormProps) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    linkedIn: '',
    expertise: '',
    yearsExperience: '',
    motivation: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [recaptchaSiteKey, setRecaptchaSiteKey] = useState<string | null>(null);
  const [isCaptchaKeyLoading, setIsCaptchaKeyLoading] = useState(true);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  useEffect(() => {
    let active = true;

    const loadCaptchaKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('public-config');
        if (error) throw error;

        const key =
          (data?.recaptchaSiteKey as string | undefined) ??
          (data?.recaptcha_site_key as string | undefined) ??
          '';

        if (active) setRecaptchaSiteKey(key || null);
      } catch (err) {
        console.error('Error loading CAPTCHA site key:', err);
        if (active) setRecaptchaSiteKey(null);
      } finally {
        if (active) setIsCaptchaKeyLoading(false);
      }
    };

    loadCaptchaKey();

    return () => {
      active = false;
    };
  }, []);

  const handleCaptchaChange = (token: string | null) => {
    setCaptchaToken(token);
  };

  const handleCaptchaExpired = () => {
    setCaptchaToken(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!captchaToken) {
      toast({
        title: "Error de Verificación",
        description: "Por favor completa la verificación CAPTCHA.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-enrollment', {
        body: {
          ...formData,
          maturityLevel: levelInfo.name,
          archetype: roleResult?.dominantArchetype?.name || null,
          overallScore: Math.round(result.overallPercentage),
          captchaToken: captchaToken,
          firmToken: firmToken || null,
          leaderToken: leaderToken || null,
        },
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast({
        title: "¡Solicitud Enviada!",
        description: "Revisaremos tu perfil y te contactaremos en 48 horas.",
      });
    } catch (error: any) {
      console.error('Error submitting enrollment:', error);
      toast({
        title: "Error al Enviar",
        description: "Hubo un error al enviar tu solicitud. Por favor intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background py-8 lg:py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-card rounded-2xl shadow-xl border border-border/50 p-8 lg:p-12 text-center animate-fade-in">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">
              ¡Bienvenido al Ecosistema!
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Tu solicitud ha sido enviada exitosamente. Nuestro equipo revisará tu perfil 
              y los resultados de tu evaluación de madurez. Recibirás un correo electrónico en 48 horas con los próximos pasos.
            </p>
            <div className="bg-secondary/50 rounded-xl p-6 mb-8 text-left">
              <h3 className="font-semibold text-foreground mb-3">¿Qué sigue?</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-gold/20 text-gold flex items-center justify-center text-sm font-semibold shrink-0">1</span>
                  <span>Revisión de perfil por nuestro equipo de incorporación</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-gold/20 text-gold flex items-center justify-center text-sm font-semibold shrink-0">2</span>
                  <span>Breve videollamada para discutir tu experiencia y objetivos</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-gold/20 text-gold flex items-center justify-center text-sm font-semibold shrink-0">3</span>
                  <span>Acceso al portal de consultores y oportunidades con clientes</span>
                </li>
              </ul>
            </div>
            <Button variant="outline" onClick={onBack}>
              Volver a Resultados
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 lg:py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Encabezado */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 text-gold mb-4">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Únete a Nuestra Red</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-3">
            Inscríbete en el Ecosistema de Consultores
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Conecta con clientes empresariales que buscan tu experiencia. Nuestro ecosistema empareja 
            consultores calificados con oportunidades de alto valor.
          </p>
        </div>

        {/* Beneficios */}
        <div className="grid md:grid-cols-3 gap-4 mb-8 animate-slide-up">
          <div className="bg-card rounded-xl p-5 border border-border/50">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
              <Briefcase className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Clientes Empresariales</h3>
            <p className="text-sm text-muted-foreground">Acceso a oportunidades verificadas de Fortune 500 y empresas medianas</p>
          </div>
          <div className="bg-card rounded-xl p-5 border border-border/50">
            <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center mb-3">
              <Globe className="w-5 h-5 text-gold" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Red Global</h3>
            <p className="text-sm text-muted-foreground">Únete a más de 500 consultores en más de 40 países</p>
          </div>
          <div className="bg-card rounded-xl p-5 border border-border/50">
            <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center mb-3">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Emparejamientos de Calidad</h3>
            <p className="text-sm text-muted-foreground">Emparejamiento con IA basado en habilidades y madurez</p>
          </div>
        </div>

        {/* Insignias de Puntuación */}
        <div className="grid md:grid-cols-2 gap-4 mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
          {/* Nivel de Madurez */}
          <div className="bg-gradient-hero rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-primary-foreground">{Math.round(result.overallPercentage)}%</span>
            </div>
            <div>
              <p className="text-primary-foreground/80 text-sm">Tu Nivel de Madurez</p>
              <p className="text-primary-foreground font-semibold">{levelInfo.name}</p>
            </div>
          </div>

          {/* Arquetipo (si existe) */}
          {roleResult && (
            <div className="bg-secondary rounded-xl p-4 flex items-center gap-4 border border-border">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Compass className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Tu Arquetipo</p>
                <p className="text-foreground font-semibold">{roleResult.dominantArchetype.name}</p>
              </div>
            </div>
          )}
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-card rounded-2xl shadow-xl border border-border/50 p-6 lg:p-8 animate-slide-up" style={{ animationDelay: '150ms' }}>
          <h2 className="text-xl font-semibold text-foreground mb-6">Completa Tu Perfil</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Nombre Completo */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                Nombre Completo *
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
                placeholder="Juan Pérez"
              />
            </div>

            {/* Correo Electrónico */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                Correo Electrónico *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
                placeholder="juan@empresa.com"
              />
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                Número de Teléfono
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
                placeholder="+52 (555) 000-0000"
              />
            </div>

            {/* Empresa */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                Empresa Actual
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
                placeholder="Nombre de Empresa o Independiente"
              />
            </div>

            {/* LinkedIn */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Linkedin className="w-4 h-4 text-muted-foreground" />
                Perfil de LinkedIn
              </label>
              <input
                type="url"
                name="linkedIn"
                value={formData.linkedIn}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
                placeholder="linkedin.com/in/juanperez"
              />
            </div>

            {/* Años de Experiencia */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                Años de Experiencia *
              </label>
              <select
                name="yearsExperience"
                value={formData.yearsExperience}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
              >
                <option value="">Seleccionar experiencia</option>
                <option value="1-3">1-3 años</option>
                <option value="4-6">4-6 años</option>
                <option value="7-10">7-10 años</option>
                <option value="10+">10+ años</option>
              </select>
            </div>

            {/* Área de Especialización Principal */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-foreground">Área de Especialización Principal *</label>
              <select
                name="expertise"
                value={formData.expertise}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
              >
                <option value="">Selecciona tu especialización principal</option>
                <option value="strategy">Estrategia y Consultoría de Gestión</option>
                <option value="technology">Tecnología y Transformación Digital</option>
                <option value="finance">Finanzas y Gestión de Riesgos</option>
                <option value="operations">Operaciones y Cadena de Suministro</option>
                <option value="hr">Recursos Humanos y Diseño Organizacional</option>
                <option value="marketing">Marketing y Estrategia de Crecimiento</option>
                <option value="data">Datos y Analítica</option>
                <option value="cybersecurity">Ciberseguridad y Cumplimiento</option>
              </select>
            </div>

            {/* Motivación */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-foreground">¿Por qué quieres unirte a nuestro ecosistema? *</label>
              <textarea
                name="motivation"
                value={formData.motivation}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all resize-none"
                placeholder="Cuéntanos sobre tus objetivos de consultoría y lo que esperas lograr al unirte a nuestra red..."
              />
            </div>
          </div>

          {/* CAPTCHA */}
          <div className="mt-6 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Verifica que no eres un robot</span>
            </div>
            {isCaptchaKeyLoading ? (
              <p className="text-sm text-muted-foreground">Cargando verificación...</p>
            ) : recaptchaSiteKey ? (
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={recaptchaSiteKey}
                onChange={handleCaptchaChange}
                onExpired={handleCaptchaExpired}
                theme="light"
              />
            ) : (
              <p className="text-sm text-destructive">Error: CAPTCHA no configurado</p>
            )}
            {captchaToken && (
              <div className="flex items-center gap-2 mt-2 text-success">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Verificación completada</span>
              </div>
            )}
          </div>

          {/* Enviar */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onBack}>
                Volver a Resultados
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => generateResultsPDF({
                  maturityResult: result,
                  maturityLevelInfo: levelInfo,
                  roleResult,
                  userName: formData.fullName || 'Consultor',
                })}
                className="gap-2"
              >
                <FileDown className="w-4 h-4" />
                Descargar PDF
              </Button>
            </div>
            <Button 
              type="submit" 
              variant="gold" 
              size="xl" 
              disabled={isSubmitting || !captchaToken || !recaptchaSiteKey} 
              className="gap-2"
              title={!recaptchaSiteKey ? "CAPTCHA no configurado" : !captchaToken ? "Completa la verificación CAPTCHA primero" : ""}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Enviando...
                </>
              ) : (
                <>
                  Enviar Solicitud
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Al enviar, aceptas nuestros Términos de Servicio y Política de Privacidad. 
            Solo usaremos tu información para procesar tu solicitud.
          </p>
        </form>
      </div>
    </div>
  );
};

export default EnrollmentForm;
