import { useState, useRef, useEffect } from "react";
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
import { Cordada } from "@/types/cordada";
import { X, Upload, FileText, Lock, Loader2, Trash2 } from "lucide-react";
import type { AttachmentFile } from "./FileUploadField";

interface PendingFile {
  file: File;
  isSensitive: boolean;
}

interface ExistingFile extends AttachmentFile {
  markedForDeletion?: boolean;
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

interface EditCordadaDialogProps {
  cordada: Cordada;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditCordadaDialog({ cordada, open, onOpenChange, onSuccess }: EditCordadaDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
  const [newObjective, setNewObjective] = useState("");
  
  // Existing files from database
  const [existingTerrainFiles, setExistingTerrainFiles] = useState<ExistingFile[]>([]);
  const [existingRisksFiles, setExistingRisksFiles] = useState<ExistingFile[]>([]);
  const [existingDescriptionFile, setExistingDescriptionFile] = useState<ExistingFile | null>(null);
  
  // New files to upload
  const [newTerrainFiles, setNewTerrainFiles] = useState<PendingFile[]>([]);
  const [newRisksFiles, setNewRisksFiles] = useState<PendingFile[]>([]);
  const [newDescriptionFile, setNewDescriptionFile] = useState<PendingFile | null>(null);
  
  // Sensitive files tracking
  const [sensitiveFiles, setSensitiveFiles] = useState<Set<string>>(new Set());
  
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

  // Load cordada data when dialog opens
  useEffect(() => {
    if (open && cordada) {
      form.reset({
        title: cordada.title || "",
        description: cordada.description || "",
        client_name: cordada.client_name || "",
        client_company: cordada.client_company || "",
        terrain: cordada.terrain || "",
        risks: cordada.risks || "",
        estimated_duration_weeks: cordada.estimated_duration_weeks || undefined,
        budget_range: cordada.budget_range || "",
      });
      
      setSelectedObjectives(cordada.objectives || []);
      setSelectedExpertise(cordada.required_expertise || []);
      
      // Load existing attachments
      const terrainAtt = (cordada as any).terrain_attachments as AttachmentFile[] || [];
      const risksAtt = (cordada as any).risks_attachments as AttachmentFile[] || [];
      const descAtt = (cordada as any).description_attachment as AttachmentFile | null;
      
      setExistingTerrainFiles(terrainAtt.map(f => ({ ...f, markedForDeletion: false })));
      setExistingRisksFiles(risksAtt.map(f => ({ ...f, markedForDeletion: false })));
      setExistingDescriptionFile(descAtt ? { ...descAtt, markedForDeletion: false } : null);
      
      // Clear new files
      setNewTerrainFiles([]);
      setNewRisksFiles([]);
      setNewDescriptionFile(null);
      
      // Load sensitive files
      loadSensitiveFiles();
    }
  }, [open, cordada]);

  const loadSensitiveFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('cordada_sensitive_documents')
        .select('file_path')
        .eq('cordada_id', cordada.id);

      if (error) throw error;

      setSensitiveFiles(new Set(data.map(d => d.file_path)));
    } catch (error) {
      console.error('Error loading sensitive files:', error);
    }
  };

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

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'terrain' | 'risks' | 'description'
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

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
      const activeExisting = existingTerrainFiles.filter(f => !f.markedForDeletion).length;
      const remaining = 3 - activeExisting - newTerrainFiles.length;
      if (files.length > remaining) {
        toast({
          title: "Límite excedido",
          description: `Solo puedes agregar ${remaining} archivo(s) más para Terreno`,
          variant: "destructive",
        });
        return;
      }
      setNewTerrainFiles(prev => [...prev, ...files.map(f => ({ file: f, isSensitive: false }))]);
    } else if (type === 'risks') {
      const activeExisting = existingRisksFiles.filter(f => !f.markedForDeletion).length;
      const remaining = 3 - activeExisting - newRisksFiles.length;
      if (files.length > remaining) {
        toast({
          title: "Límite excedido",
          description: `Solo puedes agregar ${remaining} archivo(s) más para Riesgos`,
          variant: "destructive",
        });
        return;
      }
      setNewRisksFiles(prev => [...prev, ...files.map(f => ({ file: f, isSensitive: false }))]);
    } else {
      if (existingDescriptionFile && !existingDescriptionFile.markedForDeletion) {
        // Mark existing for deletion when replacing
        setExistingDescriptionFile(prev => prev ? { ...prev, markedForDeletion: true } : null);
      }
      setNewDescriptionFile({ file: files[0], isSensitive: false });
    }

    e.target.value = '';
  };

  const markExistingForDeletion = (type: 'terrain' | 'risks' | 'description', index?: number) => {
    if (type === 'terrain' && index !== undefined) {
      setExistingTerrainFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, markedForDeletion: true } : f
      ));
    } else if (type === 'risks' && index !== undefined) {
      setExistingRisksFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, markedForDeletion: true } : f
      ));
    } else if (type === 'description') {
      setExistingDescriptionFile(prev => prev ? { ...prev, markedForDeletion: true } : null);
    }
  };

  const restoreExisting = (type: 'terrain' | 'risks' | 'description', index?: number) => {
    if (type === 'terrain' && index !== undefined) {
      setExistingTerrainFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, markedForDeletion: false } : f
      ));
    } else if (type === 'risks' && index !== undefined) {
      setExistingRisksFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, markedForDeletion: false } : f
      ));
    } else if (type === 'description') {
      setExistingDescriptionFile(prev => prev ? { ...prev, markedForDeletion: false } : null);
    }
  };

  const removeNewFile = (type: 'terrain' | 'risks' | 'description', index?: number) => {
    if (type === 'terrain' && index !== undefined) {
      setNewTerrainFiles(prev => prev.filter((_, i) => i !== index));
    } else if (type === 'risks' && index !== undefined) {
      setNewRisksFiles(prev => prev.filter((_, i) => i !== index));
    } else if (type === 'description') {
      setNewDescriptionFile(null);
    }
  };

  const toggleNewSensitive = (type: 'terrain' | 'risks' | 'description', index?: number) => {
    if (type === 'terrain' && index !== undefined) {
      setNewTerrainFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, isSensitive: !f.isSensitive } : f
      ));
    } else if (type === 'risks' && index !== undefined) {
      setNewRisksFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, isSensitive: !f.isSensitive } : f
      ));
    } else if (type === 'description' && newDescriptionFile) {
      setNewDescriptionFile({ ...newDescriptionFile, isSensitive: !newDescriptionFile.isSensitive });
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

  const deleteStorageFile = async (path: string) => {
    await supabase.storage.from('cordada-attachments').remove([path]);
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      // Delete files marked for deletion
      const filesToDelete = [
        ...existingTerrainFiles.filter(f => f.markedForDeletion).map(f => f.path),
        ...existingRisksFiles.filter(f => f.markedForDeletion).map(f => f.path),
        ...(existingDescriptionFile?.markedForDeletion ? [existingDescriptionFile.path] : []),
      ];

      for (const path of filesToDelete) {
        await deleteStorageFile(path);
        // Remove from sensitive documents if exists
        await supabase
          .from('cordada_sensitive_documents')
          .delete()
          .eq('cordada_id', cordada.id)
          .eq('file_path', path);
      }

      // Keep existing files that are not marked for deletion
      const terrainAttachments: AttachmentFile[] = existingTerrainFiles
        .filter(f => !f.markedForDeletion)
        .map(({ markedForDeletion, ...rest }) => rest);
      
      const risksAttachments: AttachmentFile[] = existingRisksFiles
        .filter(f => !f.markedForDeletion)
        .map(({ markedForDeletion, ...rest }) => rest);
      
      let descAttachment: AttachmentFile | null = 
        existingDescriptionFile && !existingDescriptionFile.markedForDeletion
          ? { name: existingDescriptionFile.name, path: existingDescriptionFile.path, size: existingDescriptionFile.size, uploadedAt: existingDescriptionFile.uploadedAt }
          : null;

      // Upload new terrain files
      for (const pf of newTerrainFiles) {
        const uploaded = await uploadFile(pf.file, cordada.id, 'terrain');
        terrainAttachments.push({ ...uploaded, isSensitive: pf.isSensitive });
        
        if (pf.isSensitive) {
          await supabase.from('cordada_sensitive_documents').insert({
            cordada_id: cordada.id,
            file_path: uploaded.path,
          });
        }
      }

      // Upload new risks files
      for (const pf of newRisksFiles) {
        const uploaded = await uploadFile(pf.file, cordada.id, 'risks');
        risksAttachments.push({ ...uploaded, isSensitive: pf.isSensitive });
        
        if (pf.isSensitive) {
          await supabase.from('cordada_sensitive_documents').insert({
            cordada_id: cordada.id,
            file_path: uploaded.path,
          });
        }
      }

      // Upload new description file
      if (newDescriptionFile) {
        const uploaded = await uploadFile(newDescriptionFile.file, cordada.id, 'description');
        descAttachment = { ...uploaded, isSensitive: newDescriptionFile.isSensitive };
        
        if (newDescriptionFile.isSensitive) {
          await supabase.from('cordada_sensitive_documents').insert({
            cordada_id: cordada.id,
            file_path: uploaded.path,
          });
        }
      }

      // Update cordada
      const { error } = await supabase
        .from('cordadas')
        .update({
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
          terrain_attachments: terrainAttachments as unknown as any,
          risks_attachments: risksAttachments as unknown as any,
          description_attachment: descAttachment as unknown as any,
        })
        .eq('id', cordada.id);

      if (error) throw error;

      toast({
        title: "Desafío actualizado",
        description: "Los cambios se han guardado correctamente",
      });
      
      onSuccess();
      onOpenChange(false);
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

  const renderExistingFile = (
    file: ExistingFile,
    type: 'terrain' | 'risks' | 'description',
    index?: number
  ) => {
    const isSensitive = sensitiveFiles.has(file.path);
    
    return (
      <div
        key={file.path}
        className={`flex items-center gap-2 p-2 rounded-md ${
          file.markedForDeletion ? 'bg-destructive/10 opacity-60' : 'bg-muted'
        }`}
      >
        <FileText className="w-4 h-4 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-medium truncate ${file.markedForDeletion ? 'line-through' : ''}`}>
              {file.name}
            </p>
            {isSensitive && !file.markedForDeletion && (
              <Badge variant="secondary" className="shrink-0 text-warning text-xs">
                <Lock className="w-3 h-3 mr-1" />
                Sensible
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
        </div>
        {file.markedForDeletion ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => restoreExisting(type, index)}
          >
            Restaurar
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive"
            onClick={() => markExistingForDeletion(type, index)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  };

  const renderNewFile = (
    pf: PendingFile,
    type: 'terrain' | 'risks' | 'description',
    index?: number
  ) => (
    <div key={index} className="flex items-center gap-2 p-2 rounded-md bg-primary/5 border border-primary/20">
      <FileText className="w-4 h-4 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{pf.file.name}</p>
          <Badge variant="outline" className="shrink-0 text-xs">Nuevo</Badge>
        </div>
        <p className="text-xs text-muted-foreground">{formatFileSize(pf.file.size)}</p>
      </div>
      <div className="flex items-center gap-1">
        <Checkbox
          id={`new-${type}-sensitive-${index}`}
          checked={pf.isSensitive}
          onCheckedChange={() => toggleNewSensitive(type, index)}
        />
        <Label htmlFor={`new-${type}-sensitive-${index}`} className="text-xs cursor-pointer flex items-center gap-1">
          <Lock className="w-3 h-3" />
          Sensible
        </Label>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={() => removeNewFile(type, index)}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );

  const renderFileSection = (
    label: string,
    existingFiles: ExistingFile[],
    newFiles: PendingFile[],
    type: 'terrain' | 'risks',
    inputRef: React.RefObject<HTMLInputElement>,
    maxFiles: number
  ) => {
    const activeExisting = existingFiles.filter(f => !f.markedForDeletion).length;
    const totalActive = activeExisting + newFiles.length;
    const canAdd = totalActive < maxFiles;

    return (
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
        {canAdd && (
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
        {(existingFiles.length > 0 || newFiles.length > 0) && (
          <div className="space-y-2">
            {existingFiles.map((f, idx) => renderExistingFile(f, type, idx))}
            {newFiles.map((f, idx) => renderNewFile(f, type, idx))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Desafío (Borrador)</DialogTitle>
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
                {existingDescriptionFile && !existingDescriptionFile.markedForDeletion && !newDescriptionFile && (
                  renderExistingFile(existingDescriptionFile, 'description')
                )}
                {existingDescriptionFile?.markedForDeletion && !newDescriptionFile && (
                  <div className="space-y-2">
                    {renderExistingFile(existingDescriptionFile, 'description')}
                  </div>
                )}
                {newDescriptionFile && renderNewFile(newDescriptionFile, 'description')}
                {!newDescriptionFile && (!existingDescriptionFile || existingDescriptionFile.markedForDeletion) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => descriptionInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Adjuntar documento
                  </Button>
                )}
                {!newDescriptionFile && existingDescriptionFile && !existingDescriptionFile.markedForDeletion && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => descriptionInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Reemplazar documento
                  </Button>
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
              {renderFileSection("Documentos de Terreno", existingTerrainFiles, newTerrainFiles, 'terrain', terrainInputRef, 3)}
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
              {renderFileSection("Documentos de Riesgos", existingRisksFiles, newRisksFiles, 'risks', risksInputRef, 3)}
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
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
