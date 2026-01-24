import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImportEnrollmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: () => void;
}

interface Enrollment {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  linkedin: string | null;
  maturity_level: string | null;
  overall_score: number | null;
  archetype: string | null;
  created_at: string;
}

export function ImportEnrollmentDialog({
  open,
  onOpenChange,
  onImport,
}: ImportEnrollmentDialogProps) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [existingEmails, setExistingEmails] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    setIsLoading(true);
    
    // Fetch enrollments
    const { data: enrollmentData } = await supabase
      .from("enrollments")
      .select("*")
      .order("created_at", { ascending: false });
    
    // Fetch existing applications to avoid duplicates
    const { data: applicationData } = await supabase
      .from("consultant_applications")
      .select("email");
    
    setEnrollments(enrollmentData || []);
    setExistingEmails(new Set((applicationData || []).map(a => a.email)));
    setSelectedIds(new Set());
    setIsLoading(false);
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    const availableIds = enrollments
      .filter(e => !existingEmails.has(e.email))
      .map(e => e.id);
    setSelectedIds(new Set(availableIds));
  };

  const handleImport = async () => {
    if (selectedIds.size === 0) return;
    setIsImporting(true);

    const selectedEnrollments = enrollments.filter(e => selectedIds.has(e.id));
    
    const applications = selectedEnrollments.map(e => ({
      enrollment_id: e.id,
      full_name: e.full_name,
      email: e.email,
      phone: e.phone,
      company: e.company,
      linkedin: e.linkedin,
      maturity_level: e.maturity_level,
      maturity_score: e.overall_score,
      role_archetype: e.archetype,
      status: 'postulacion' as const,
    }));

    const { error } = await supabase
      .from("consultant_applications")
      .insert(applications);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudieron importar las postulaciones",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Importado",
        description: `Se importaron ${selectedIds.size} postulaciones correctamente`,
      });
      onImport();
      onOpenChange(false);
    }
    setIsImporting(false);
  };

  const availableCount = enrollments.filter(e => !existingEmails.has(e.email)).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar Postulantes</DialogTitle>
          <DialogDescription>
            Selecciona los postulantes existentes para importarlos al flujo de onboarding
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : enrollments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No hay postulantes disponibles para importar</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {availableCount} disponible{availableCount !== 1 ? "s" : ""} para importar
              </span>
              <Button variant="ghost" size="sm" onClick={selectAll}>
                Seleccionar todos
              </Button>
            </div>

            <ScrollArea className="h-[400px] border rounded-lg">
              <div className="p-4 space-y-2">
                {enrollments.map((enrollment) => {
                  const alreadyExists = existingEmails.has(enrollment.email);
                  const isSelected = selectedIds.has(enrollment.id);

                  return (
                    <div
                      key={enrollment.id}
                      className={`flex items-center gap-4 p-3 rounded-lg border ${
                        alreadyExists
                          ? "bg-muted/50 opacity-60"
                          : isSelected
                          ? "bg-primary/5 border-primary"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelection(enrollment.id)}
                        disabled={alreadyExists}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{enrollment.full_name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {enrollment.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {enrollment.maturity_level && (
                          <Badge variant="outline" className="text-xs">
                            {enrollment.maturity_level}
                          </Badge>
                        )}
                        {alreadyExists && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Check className="w-3 h-3" />
                            Importado
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-muted-foreground">
                {selectedIds.size} seleccionado{selectedIds.size !== 1 ? "s" : ""}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={selectedIds.size === 0 || isImporting}
                >
                  {isImporting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4 mr-2" />
                  )}
                  Importar ({selectedIds.size})
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
