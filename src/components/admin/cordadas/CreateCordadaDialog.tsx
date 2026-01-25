import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { expertiseOptions } from "@/data/cordadaData";
import { X } from "lucide-react";

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

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      
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
      };

      const { error } = await supabase
        .from('cordadas')
        .insert(insertData);

      if (error) throw error;

      toast({
        title: "Desafío creado",
        description: "El nuevo desafío se ha creado como borrador",
      });
      
      form.reset();
      setSelectedObjectives([]);
      setSelectedExpertise([]);
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
