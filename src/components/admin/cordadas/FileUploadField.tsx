import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, FileText, Download, Eye, Lock, Loader2 } from "lucide-react";

export interface AttachmentFile {
  name: string;
  path: string;
  size: number;
  uploadedAt: string;
  isSensitive?: boolean;
}

interface FileUploadFieldProps {
  label: string;
  cordadaId?: string;
  fieldName: string;
  maxFiles: number;
  files: AttachmentFile[];
  onFilesChange: (files: AttachmentFile[]) => void;
  disabled?: boolean;
  showSensitiveOption?: boolean;
}

export function FileUploadField({
  label,
  cordadaId,
  fieldName,
  maxFiles,
  files,
  onFilesChange,
  disabled = false,
  showSensitiveOption = true,
}: FileUploadFieldProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingSensitive, setPendingSensitive] = useState<Record<string, boolean>>({});

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const remainingSlots = maxFiles - files.length;
    if (selectedFiles.length > remainingSlots) {
      toast({
        title: "Límite excedido",
        description: `Solo puedes agregar ${remainingSlots} archivo(s) más`,
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB per file)
    const invalidFiles = selectedFiles.filter(f => f.size > 10 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      toast({
        title: "Archivo muy grande",
        description: "El tamaño máximo por archivo es 10MB",
        variant: "destructive",
      });
      return;
    }

    if (cordadaId) {
      // Direct upload if we have a cordadaId
      await uploadFiles(selectedFiles, cordadaId);
    } else {
      // Store pending files for later upload
      setPendingFiles(prev => [...prev, ...selectedFiles]);
      selectedFiles.forEach(f => {
        setPendingSensitive(prev => ({ ...prev, [f.name]: false }));
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadFiles = async (filesToUpload: File[], targetCordadaId: string) => {
    setIsUploading(true);
    const newFiles: AttachmentFile[] = [];

    try {
      for (const file of filesToUpload) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${targetCordadaId}/${fieldName}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('cordada-attachments')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const isSensitive = pendingSensitive[file.name] || false;

        // If marked as sensitive, add to sensitive documents table
        if (isSensitive) {
          await supabase.from('cordada_sensitive_documents').insert({
            cordada_id: targetCordadaId,
            file_path: fileName,
          });
        }

        newFiles.push({
          name: file.name,
          path: fileName,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          isSensitive,
        });
      }

      onFilesChange([...files, ...newFiles]);
      setPendingFiles([]);
      setPendingSensitive({});

      toast({
        title: "Archivos subidos",
        description: `${newFiles.length} archivo(s) subido(s) correctamente`,
      });
    } catch (error: any) {
      toast({
        title: "Error al subir",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = async (fileToRemove: AttachmentFile) => {
    try {
      // Delete from storage
      const { error } = await supabase.storage
        .from('cordada-attachments')
        .remove([fileToRemove.path]);

      if (error) throw error;

      // Remove from sensitive documents if marked
      if (fileToRemove.isSensitive) {
        await supabase
          .from('cordada_sensitive_documents')
          .delete()
          .eq('file_path', fileToRemove.path);
      }

      onFilesChange(files.filter(f => f.path !== fileToRemove.path));

      toast({
        title: "Archivo eliminado",
        description: "El archivo se eliminó correctamente",
      });
    } catch (error: any) {
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const removePendingFile = (fileName: string) => {
    setPendingFiles(prev => prev.filter(f => f.name !== fileName));
    setPendingSensitive(prev => {
      const newState = { ...prev };
      delete newState[fileName];
      return newState;
    });
  };

  const togglePendingSensitive = (fileName: string) => {
    setPendingSensitive(prev => ({
      ...prev,
      [fileName]: !prev[fileName],
    }));
  };

  const downloadFile = async (file: AttachmentFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('cordada-attachments')
        .createSignedUrl(file.path, 3600); // 1 hour validity

      if (error) throw error;

      window.open(data.signedUrl, '_blank');
    } catch (error: any) {
      toast({
        title: "Error al descargar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const viewFile = async (file: AttachmentFile) => {
    await downloadFile(file); // For now, viewing opens the file in a new tab
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Expose method to upload pending files when cordadaId becomes available
  const uploadPendingFiles = async (newCordadaId: string) => {
    if (pendingFiles.length > 0) {
      await uploadFiles(pendingFiles, newCordadaId);
    }
  };

  // Attach method to component instance for parent access
  (FileUploadField as any).uploadPendingFiles = uploadPendingFiles;

  return (
    <div className="space-y-2">
      <Label>{label} {maxFiles > 1 && `(máx. ${maxFiles})`}</Label>
      
      {/* Upload button */}
      {files.length < maxFiles && !disabled && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
            multiple={maxFiles > 1}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            Seleccionar archivo
          </Button>
        </div>
      )}

      {/* Pending files (not yet uploaded) */}
      {pendingFiles.length > 0 && (
        <div className="space-y-2 mt-2">
          <p className="text-xs text-muted-foreground">
            Archivos pendientes de subir (se guardarán al crear el desafío):
          </p>
          {pendingFiles.map((file) => (
            <div
              key={file.name}
              className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border border-dashed"
            >
              <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </div>
              {showSensitiveOption && (
                <div className="flex items-center gap-1">
                  <Checkbox
                    id={`sensitive-${file.name}`}
                    checked={pendingSensitive[file.name] || false}
                    onCheckedChange={() => togglePendingSensitive(file.name)}
                  />
                  <Label
                    htmlFor={`sensitive-${file.name}`}
                    className="text-xs cursor-pointer flex items-center gap-1"
                  >
                    <Lock className="w-3 h-3" />
                    Sensible
                  </Label>
                </div>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => removePendingFile(file.name)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded files */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.path}
              className="flex items-center gap-2 p-2 rounded-md bg-muted"
            >
              <FileText className="w-4 h-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  {file.isSensitive && (
                    <Badge variant="secondary" className="shrink-0">
                      <Lock className="w-3 h-3 mr-1" />
                      Sensible
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => viewFile(file)}
                  title="Ver archivo"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => downloadFile(file)}
                  title="Descargar"
                >
                  <Download className="w-4 h-4" />
                </Button>
                {!disabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => removeFile(file)}
                    title="Eliminar"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {files.length === 0 && pendingFiles.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Sin archivos adjuntos
        </p>
      )}
    </div>
  );
}

// Export pending files getter for use in parent components
export const getPendingFilesData = (
  pendingFiles: File[],
  pendingSensitive: Record<string, boolean>
) => {
  return pendingFiles.map(f => ({
    file: f,
    isSensitive: pendingSensitive[f.name] || false,
  }));
};
