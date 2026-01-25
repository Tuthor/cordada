import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Download, 
  Eye, 
  Lock, 
  LockOpen, 
  MapPin, 
  AlertTriangle, 
  FileText as FileDescription,
  Loader2
} from "lucide-react";
import type { AttachmentFile } from "./FileUploadField";

interface AttachmentsSectionProps {
  cordadaId: string;
  terrainAttachments: AttachmentFile[];
  risksAttachments: AttachmentFile[];
  descriptionAttachment: AttachmentFile | null;
  isAdmin?: boolean;
  isGuia?: boolean;
  onUpdate?: () => void;
}

export function AttachmentsSection({
  cordadaId,
  terrainAttachments,
  risksAttachments,
  descriptionAttachment,
  isAdmin = false,
  isGuia = false,
  onUpdate,
}: AttachmentsSectionProps) {
  const { toast } = useToast();
  const [sensitiveFiles, setSensitiveFiles] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [togglingFile, setTogglingFile] = useState<string | null>(null);

  const canViewSensitive = isAdmin || isGuia;

  useEffect(() => {
    loadSensitiveFiles();
  }, [cordadaId]);

  const loadSensitiveFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('cordada_sensitive_documents')
        .select('file_path')
        .eq('cordada_id', cordadaId);

      if (error) throw error;

      setSensitiveFiles(new Set(data.map(d => d.file_path)));
    } catch (error) {
      console.error('Error loading sensitive files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSensitive = async (filePath: string, currentlySensitive: boolean) => {
    if (!isAdmin) return;

    setTogglingFile(filePath);
    try {
      if (currentlySensitive) {
        // Remove from sensitive
        const { error } = await supabase
          .from('cordada_sensitive_documents')
          .delete()
          .eq('cordada_id', cordadaId)
          .eq('file_path', filePath);

        if (error) throw error;

        setSensitiveFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(filePath);
          return newSet;
        });

        toast({
          title: "Documento actualizado",
          description: "El documento ya no está marcado como sensible",
        });
      } else {
        // Add to sensitive
        const { error } = await supabase
          .from('cordada_sensitive_documents')
          .insert({
            cordada_id: cordadaId,
            file_path: filePath,
          });

        if (error) throw error;

        setSensitiveFiles(prev => new Set([...prev, filePath]));

        toast({
          title: "Documento actualizado",
          description: "El documento ahora está marcado como sensible",
        });
      }

      onUpdate?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTogglingFile(null);
    }
  };

  const downloadFile = async (file: AttachmentFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('cordada-attachments')
        .createSignedUrl(file.path, 3600);

      if (error) throw error;

      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      toast({
        title: "Error al descargar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const viewFile = async (file: AttachmentFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('cordada-attachments')
        .createSignedUrl(file.path, 3600);

      if (error) throw error;

      window.open(data.signedUrl, '_blank');
    } catch (error: any) {
      toast({
        title: "Error al visualizar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderFileItem = (file: AttachmentFile) => {
    const isSensitive = sensitiveFiles.has(file.path);
    
    // Non-admin/non-guia users can't see sensitive files
    if (isSensitive && !canViewSensitive) {
      return null;
    }

    return (
      <div
        key={file.path}
        className="flex items-center gap-2 p-2 rounded-md bg-muted"
      >
        <FileText className="w-4 h-4 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate">{file.name}</p>
            {isSensitive && (
              <Badge variant="secondary" className="shrink-0 text-warning">
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
          {isAdmin && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => toggleSensitive(file.path, isSensitive)}
              disabled={togglingFile === file.path}
              title={isSensitive ? "Quitar marca de sensible" : "Marcar como sensible"}
            >
              {togglingFile === file.path ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isSensitive ? (
                <LockOpen className="w-4 h-4 text-warning" />
              ) : (
                <Lock className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>
          )}
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
        </div>
      </div>
    );
  };

  const renderSection = (
    title: string,
    icon: React.ReactNode,
    files: AttachmentFile[]
  ) => {
    const visibleFiles = files.filter(f => {
      const isSensitive = sensitiveFiles.has(f.path);
      return !isSensitive || canViewSensitive;
    });

    if (visibleFiles.length === 0) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {icon}
          {title}
        </div>
        <div className="space-y-1">
          {files.map(renderFileItem)}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Documentos Adjuntos</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const hasAnyFiles = 
    terrainAttachments.length > 0 || 
    risksAttachments.length > 0 || 
    descriptionAttachment !== null;

  if (!hasAnyFiles) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Documentos Adjuntos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay documentos adjuntos en este desafío
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          Documentos Adjuntos
          {isAdmin && (
            <Badge variant="outline" className="font-normal">
              <Lock className="w-3 h-3 mr-1" />
              Admin: puede gestionar sensibilidad
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {descriptionAttachment && renderSection(
          "Descripción",
          <FileDescription className="w-4 h-4" />,
          [descriptionAttachment]
        )}

        {terrainAttachments.length > 0 && renderSection(
          "Terreno",
          <MapPin className="w-4 h-4" />,
          terrainAttachments
        )}

        {risksAttachments.length > 0 && renderSection(
          "Riesgos",
          <AlertTriangle className="w-4 h-4" />,
          risksAttachments
        )}

        {canViewSensitive && sensitiveFiles.size > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Lock className="w-3 h-3" />
              {isAdmin 
                ? "Como administrador, puedes ver y gestionar todos los documentos sensibles"
                : "Como Guía de Alta Montaña, puedes ver los documentos sensibles de esta cordada"
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
