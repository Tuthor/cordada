import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Upload, X, FileText, DollarSign, Clock } from 'lucide-react';

const proposalSchema = z.object({
  scope: z.string().min(20, 'El alcance debe tener al menos 20 caracteres'),
  deliverables: z.string().min(20, 'Los entregables deben tener al menos 20 caracteres'),
  timeline: z.string().min(10, 'El timeline debe tener al menos 10 caracteres'),
  proposed_budget: z.coerce.number().min(1, 'Indica un presupuesto válido'),
  proposed_duration_weeks: z.coerce.number().min(1, 'Indica una duración válida').max(52),
  cover_letter: z.string().min(50, 'La carta de presentación debe tener al menos 50 caracteres'),
});

type ProposalFormData = z.infer<typeof proposalSchema>;

interface Project {
  id: string;
  title: string;
  description: string;
  budget_min: number | null;
  budget_max: number | null;
  duration_weeks: number | null;
  expertise_needed: string[] | null;
  status: string;
}

const ProjectApply = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [savingDraft, setSavingDraft] = useState(false);

  const form = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      scope: '',
      deliverables: '',
      timeline: '',
      cover_letter: '',
    },
  });

  useEffect(() => {
    if (id) {
      fetchProject();
    }
  }, [id]);

  const fetchProject = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar el proyecto',
        variant: 'destructive',
      });
      navigate('/projects');
      return;
    }

    if (data.status !== 'open') {
      toast({
        title: 'Proyecto no disponible',
        description: 'Este proyecto ya no acepta propuestas',
        variant: 'destructive',
      });
      navigate('/projects');
      return;
    }

    setProject(data);

    // Check for existing draft
    if (user) {
      const { data: existingProposal } = await supabase
        .from('proposals')
        .select('*')
        .eq('project_id', id)
        .eq('consultant_id', user.id)
        .maybeSingle();

      if (existingProposal) {
        if (existingProposal.status !== 'draft') {
          toast({
            title: 'Ya postulaste',
            description: 'Ya enviaste una propuesta para este proyecto',
          });
          navigate(`/projects/${id}`);
          return;
        }
        
        // Load draft
        form.reset({
          scope: existingProposal.scope || '',
          deliverables: existingProposal.deliverables || '',
          timeline: existingProposal.timeline || '',
          proposed_budget: existingProposal.proposed_budget || undefined,
          proposed_duration_weeks: existingProposal.proposed_duration_weeks || undefined,
          cover_letter: existingProposal.cover_letter || '',
        });
      }
    }

    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Max 10MB
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'Archivo muy grande',
          description: 'El archivo no puede superar los 10MB',
          variant: 'destructive',
        });
        return;
      }
      setAttachmentFile(file);
    }
  };

  const removeAttachment = () => {
    setAttachmentFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadAttachment = async (): Promise<string | null> => {
    if (!attachmentFile || !user) return null;

    const fileExt = attachmentFile.name.split('.').pop();
    const fileName = `${user.id}/${id}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('proposal-attachments')
      .upload(fileName, attachmentFile);

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    return data.path;
  };

  const saveProposal = async (status: 'draft' | 'submitted') => {
    if (!user || !project) return;

    const data = form.getValues();
    
    // For drafts, skip validation
    if (status === 'submitted') {
      const isValid = await form.trigger();
      if (!isValid) return;
    }

    if (status === 'draft') {
      setSavingDraft(true);
    } else {
      setIsSubmitting(true);
    }

    let attachmentUrl: string | null = null;
    if (attachmentFile) {
      attachmentUrl = await uploadAttachment();
    }

    // Check for existing proposal
    const { data: existingProposal } = await supabase
      .from('proposals')
      .select('id')
      .eq('project_id', project.id)
      .eq('consultant_id', user.id)
      .maybeSingle();

    const proposalData = {
      project_id: project.id,
      consultant_id: user.id,
      scope: data.scope || null,
      deliverables: data.deliverables || null,
      timeline: data.timeline || null,
      proposed_budget: data.proposed_budget || null,
      proposed_duration_weeks: data.proposed_duration_weeks || null,
      cover_letter: data.cover_letter || '',
      status,
      ...(attachmentUrl && { attachment_url: attachmentUrl }),
    };

    let error;
    if (existingProposal) {
      const result = await supabase
        .from('proposals')
        .update(proposalData)
        .eq('id', existingProposal.id);
      error = result.error;
    } else {
      const result = await supabase
        .from('proposals')
        .insert(proposalData);
      error = result.error;
    }

    setSavingDraft(false);
    setIsSubmitting(false);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: status === 'draft' ? 'Borrador guardado' : 'Propuesta enviada',
        description: status === 'draft' 
          ? 'Tu propuesta ha sido guardada como borrador'
          : 'Tu propuesta ha sido enviada exitosamente',
      });
      
      if (status === 'submitted') {
        navigate('/proposals');
      }
    }
  };

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return 'A convenir';
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `Desde $${min.toLocaleString()}`;
    return `Hasta $${max?.toLocaleString()}`;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto">
          <Card className="animate-pulse">
            <CardContent className="p-8">
              <div className="h-8 bg-muted rounded w-1/2 mb-4" />
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-20 bg-muted rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" asChild>
          <Link to={`/projects/${id}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Proyecto
          </Link>
        </Button>

        {/* Project Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Postulación para:</CardTitle>
            <CardDescription className="text-base font-medium text-foreground">
              {project.title}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-1 text-muted-foreground">
                <DollarSign className="w-4 h-4" />
                {formatBudget(project.budget_min, project.budget_max)}
              </span>
              {project.duration_weeks && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {project.duration_weeks} semanas
                </span>
              )}
            </div>
            {project.expertise_needed && project.expertise_needed.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {project.expertise_needed.map((skill, index) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Proposal Form */}
        <Card>
          <CardHeader>
            <CardTitle>Tu Propuesta</CardTitle>
            <CardDescription>
              Describe tu enfoque, entregables y condiciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form className="space-y-6">
                <FormField
                  control={form.control}
                  name="scope"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alcance del Trabajo *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe qué incluye y qué no incluye tu propuesta..."
                          className="min-h-24"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Define claramente los límites de tu trabajo
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deliverables"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entregables *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Lista los documentos, reportes o productos que entregarás..."
                          className="min-h-24"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Especifica exactamente qué recibirá el cliente
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timeline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timeline / Cronograma *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Semana 1: Diagnóstico inicial&#10;Semana 2-3: Análisis detallado&#10;Semana 4: Informe final..."
                          className="min-h-24"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Detalla las fases y tiempos de ejecución
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="proposed_budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio Propuesto (USD) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="5000"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="proposed_duration_weeks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duración (semanas) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="4"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <FormField
                  control={form.control}
                  name="cover_letter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carta de Presentación *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Preséntate, explica por qué eres el candidato ideal y cómo abordarías este proyecto..."
                          className="min-h-32"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Resalta tu experiencia y enfoque único
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* File Attachment */}
                <div className="space-y-3">
                  <FormLabel>Archivo Adjunto (opcional)</FormLabel>
                  
                  {attachmentFile ? (
                    <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <span className="flex-1 text-sm truncate">{attachmentFile.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {(attachmentFile.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeAttachment}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Haz clic para subir un archivo
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF, DOC, DOCX, PPT (máx. 10MB)
                      </p>
                    </div>
                  )}
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                    onChange={handleFileChange}
                  />
                </div>

                <Separator />

                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => navigate(`/projects/${id}`)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="button" 
                    variant="secondary"
                    disabled={savingDraft || isSubmitting}
                    onClick={() => saveProposal('draft')}
                  >
                    {savingDraft ? 'Guardando...' : 'Guardar Borrador'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="gold"
                    disabled={isSubmitting || savingDraft}
                    onClick={() => saveProposal('submitted')}
                    className="flex-1 sm:flex-initial"
                  >
                    {isSubmitting ? 'Enviando...' : 'Enviar Propuesta'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ProjectApply;