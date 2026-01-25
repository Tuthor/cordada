import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { expertiseOptions } from "@/data/cordadaData";
import { X, Upload, FileText, Lock, Loader2 } from "lucide-react";

interface PendingFile {
  file: File;
  isSensitive: boolean;
}

const formSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  client_name: z.string().optional(),
  client_company: z.string().optional(),
  terrain: z.string().optional(),
  risks: z.string().optional(),
  estimated_duration_weeks: z.coerce.number().optional(),
  budget_range: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CreateCordadaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateCordadaDialog({ open, onOpenChange, onSuccess }: CreateCordadaDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
  const [newObjective, setNewObjective] = useState("");
  
  // File states
  const [terrainFiles, setTerrainFiles] = useState<PendingFile[]>([]);
  const [risksFiles, setRisksFiles] = useState<PendingFile[]>([]);
  const [descriptionFile, setDescriptionFile] = useState<PendingFile | null>(null);
  
  const terrainInputRef = useRef<HTMLInputElement>(null);
  const risksInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      client_name: "",
      client_company: "",
      terrain: "",
      risks: "",
      budget_range: "",
    },
  });

  const addObjective = () => {
    if (newObjective.trim() && !selectedObjectives.includes(newObjective.trim())) {
      setSelectedObjectives([...selectedObjectives, newObjective.trim()]);
      setNewObjective("");
    }
  };

  const removeObjective = (objective: string) => {
    setSelectedObjectives(selectedObjectives.filter(o => o !== objective));
  };

  const toggleExpertise = (expertise: string) => {
    if (selectedExpertise.includes(expertise)) {
      setSelectedExpertise(selectedExpertise.filter(e => e !== expertise));
    } else {
      setSelectedExpertise([...selectedExpertise, expertise]);
    }
  };

  // File handling functions
  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'terrain' | 'risks' | 'description'
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file size
    const invalidFiles = files.filter(f => f.size > 10 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      toast({
        title: "Archivo muy grande",
        description: "El tamaño máximo por archivo es 10MB",
        variant: "destructive",
      });
      return;
    }

    if (type === 'terrain') {
      const remaining = 3 - terrainFiles.length;
      if (files.length > remaining) {
        toast({
          title: "Límite excedido",
          description: `Solo puedes agregar ${remaining} archivo(s) más para Terreno`,
          variant: "destructive",
        });
        return;
      }
      setTerrainFiles(prev => [...prev, ...files.map(f => ({ file: f, isSensitive: false }))]);
    } else if (type === 'risks') {
      const remaining = 3 - risksFiles.length;
      if (files.length > remaining) {
        toast({
          title: "Límite excedido",
          description: `Solo puedes agregar ${remaining} archivo(s) más para Riesgos`,
          variant: "destructive",
        });
        return;
      }
      setRisksFiles(prev => [...prev, ...files.map(f => ({ file: f, isSensitive: false }))]);
    } else {
      setDescriptionFile({ file: files[0], isSensitive: false });
    }

    // Reset input
    e.target.value = '';
  };

  const removeFile = (type: 'terrain' | 'risks' | 'description', index?: number) => {
    if (type === 'terrain' && index !== undefined) {
      setTerrainFiles(prev => prev.filter((_, i) => i !== index));
    } else if (type === 'risks' && index !== undefined) {
      setRisksFiles(prev => prev.filter((_, i) => i !== index));
    } else if (type === 'description') {
      setDescriptionFile(null);
    }
  };

  const toggleSensitive = (type: 'terrain' | 'risks' | 'description', index?: number) => {
    if (type === 'terrain' && index !== undefined) {
      setTerrainFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, isSensitive: !f.isSensitive } : f
      ));
    } else if (type === 'risks' && index !== undefined) {
      setRisksFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, isSensitive: !f.isSensitive } : f
      ));
    } else if (type === 'description' && descriptionFile) {
      setDescriptionFile({ ...descriptionFile, isSensitive: !descriptionFile.isSensitive });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const uploadFile = async (file: File, cordadaId: string, fieldName: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${cordadaId}/${fieldName}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error } = await supabase.storage
      .from('cordada-attachments')
      .upload(fileName, file);

    if (error) throw error;

    return {
      name: file.name,
      path: fileName,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    };
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      
      // First create the cordada
      const insertData: any = {
        title: data.title,
        description: data.description || null,
        client_name: data.client_name || null,
        client_company: data.client_company || null,
        terrain: data.terrain || null,
        risks: data.risks || null,
        estimated_duration_weeks: data.estimated_duration_weeks || null,
        budget_range: data.budget_range || null,
        objectives: selectedObjectives.length > 0 ? selectedObjectives : null,
        required_expertise: selectedExpertise.length > 0 ? selectedExpertise : null,
        created_by: user.user?.id,
        status: 'draft' as const,
        terrain_attachments: [],
        risks_attachments: [],
        description_attachment: null,
      };

      const { data: newCordada, error } = await supabase
        .from('cordadas')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Upload files and update cordada
      const terrainAttachments = [];
      const risksAttachments = [];
      let descAttachment = null;

      // Upload terrain files
      for (const pf of terrainFiles) {
        const uploaded = await uploadFile(pf.file, newCordada.id, 'terrain');
        terrainAttachments.push({ ...uploaded, isSensitive: pf.isSensitive });
        
        if (pf.isSensitive) {
          await supabase.from('cordada_sensitive_documents').insert({
            cordada_id: newCordada.id,
            file_path: uploaded.path,
          });
        }
      }

      // Upload risks files
      for (const pf of risksFiles) {
        const uploaded = await uploadFile(pf.file, newCordada.id, 'risks');
        risksAttachments.push({ ...uploaded, isSensitive: pf.isSensitive });
        
        if (pf.isSensitive) {
          await supabase.from('cordada_sensitive_documents').insert({
            cordada_id: newCordada.id,
            file_path: uploaded.path,
          });
        }
      }

      // Upload description file
      if (descriptionFile) {
        const uploaded = await uploadFile(descriptionFile.file, newCordada.id, 'description');
        descAttachment = { ...uploaded, isSensitive: descriptionFile.isSensitive };
        
        if (descriptionFile.isSensitive) {
          await supabase.from('cordada_sensitive_documents').insert({
            cordada_id: newCordada.id,
            file_path: uploaded.path,
          });
        }
      }

      // Update cordada with file references
      if (terrainAttachments.length > 0 || risksAttachments.length > 0 || descAttachment) {
        await supabase
          .from('cordadas')
          .update({
            terrain_attachments: terrainAttachments,
            risks_attachments: risksAttachments,
            description_attachment: descAttachment,
          })
          .eq('id', newCordada.id);
      }

      toast({
        title: "Desafío creado",
        description: "El nuevo desafío se ha creado como borrador",
      });
      
      form.reset();
      setSelectedObjectives([]);
      setSelectedExpertise([]);
      setTerrainFiles([]);
      setRisksFiles([]);
      setDescriptionFile(null);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderFileSection = (
    label: string,
    files: PendingFile[],
    type: 'terrain' | 'risks',
    inputRef: React.RefObject<HTMLInputElement>,
    maxFiles: number
  ) => (
    <div className="space-y-2">
      <Label>{label} (máx. {maxFiles} archivos)</Label>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => handleFileSelect(e, type)}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
        multiple
      />
      {files.length < maxFiles && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="w-4 h-4 mr-2" />
          Adjuntar archivo
        </Button>
      )}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((pf, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2 rounded-md bg-muted">
              <FileText className="w-4 h-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{pf.file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(pf.file.size)}</p>
              </div>
              <div className="flex items-center gap-1">
                <Checkbox
                  id={`${type}-sensitive-${idx}`}
                  checked={pf.isSensitive}
                  onCheckedChange={() => toggleSensitive(type, idx)}
                />
                <Label htmlFor={`${type}-sensitive-${idx}`} className="text-xs cursor-pointer flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Sensible
                </Label>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => removeFile(type, idx)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Desafío (RFP)</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título del Desafío *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Transformación digital para retail" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description with file attachment */}
            <div className="space-y-3">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe el desafío en detalle..."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Description attachment */}
              <div className="pl-1 space-y-2">
                <Label className="text-sm text-muted-foreground">Documento adjunto de descripción</Label>
                <input
                  ref={descriptionInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, 'description')}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                />
                {!descriptionFile ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => descriptionInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Adjuntar documento
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{descriptionFile.file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(descriptionFile.file.size)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Checkbox
                        id="description-sensitive"
                        checked={descriptionFile.isSensitive}
                        onCheckedChange={() => toggleSensitive('description')}
                      />
                      <Label htmlFor="description-sensitive" className="text-xs cursor-pointer flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Sensible
                      </Label>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeFile('description')}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="client_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Cliente</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Juan Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="client_company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Acme Corp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Terrain with attachments */}
            <div className="space-y-3">
              <FormField
                control={form.control}
                name="terrain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Terreno (Contexto)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe el contexto, industria y situación actual..."
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {renderFileSection("Documentos de Terreno", terrainFiles, 'terrain', terrainInputRef, 3)}
            </div>

            {/* Risks with attachments */}
            <div className="space-y-3">
              <FormField
                control={form.control}
                name="risks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Riesgos Identificados</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Principales riesgos y desafíos del proyecto..."
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {renderFileSection("Documentos de Riesgos", risksFiles, 'risks', risksInputRef, 3)}
            </div>

            {/* Objectives */}
            <div className="space-y-2">
              <FormLabel>Objetivos</FormLabel>
              <div className="flex gap-2">
                <Input 
                  placeholder="Agregar objetivo..."
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addObjective())}
                />
                <Button type="button" variant="outline" onClick={addObjective}>
                  Agregar
                </Button>
              </div>
              {selectedObjectives.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedObjectives.map((obj, idx) => (
                    <Badge key={idx} variant="secondary" className="gap-1">
                      {obj}
                      <X 
                        className="w-3 h-3 cursor-pointer" 
                        onClick={() => removeObjective(obj)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Required Expertise */}
            <div className="space-y-2">
              <FormLabel>Expertise Requerida</FormLabel>
              <div className="flex flex-wrap gap-2">
                {expertiseOptions.map((exp) => (
                  <Badge 
                    key={exp}
                    variant={selectedExpertise.includes(exp) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleExpertise(exp)}
                  >
                    {exp}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="estimated_duration_weeks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duración Estimada (semanas)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ej: 12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="budget_range"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rango de Presupuesto</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: $10M - $20M CLP" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creando..." : "Crear Desafío"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
