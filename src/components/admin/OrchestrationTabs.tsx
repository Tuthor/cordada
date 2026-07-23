import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, UserCheck, Mountain, AlertTriangle, Building2 } from "lucide-react";
import { ApplicationsPanel } from "./ApplicationsPanel";
import { ConsultantsPanel } from "./ConsultantsPanel";
import { CordadasPanel } from "./cordadas/CordadasPanel";
import { FirmApplicationsPanel } from "./FirmApplicationsPanel";

interface OrchestrationTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function OrchestrationTabs({ activeTab, onTabChange }: OrchestrationTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-4">
      <TabsList className="grid w-full max-w-3xl grid-cols-5">
        <TabsTrigger value="applications" className="gap-2">
          <ClipboardList className="w-4 h-4" />
          <span className="hidden sm:inline">Postulantes</span>
        </TabsTrigger>
        <TabsTrigger value="consultants" className="gap-2">
          <UserCheck className="w-4 h-4" />
          <span className="hidden sm:inline">Consultores</span>
        </TabsTrigger>
        <TabsTrigger value="firms" className="gap-2">
          <Building2 className="w-4 h-4" />
          <span className="hidden sm:inline">Firmas</span>
        </TabsTrigger>
        <TabsTrigger value="cordadas" className="gap-2">
          <Mountain className="w-4 h-4" />
          <span className="hidden sm:inline">Cordadas</span>
        </TabsTrigger>
        <TabsTrigger value="alerts" className="gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span className="hidden sm:inline">Alertas</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="applications"><ApplicationsPanel /></TabsContent>
      <TabsContent value="consultants"><ConsultantsPanel /></TabsContent>
      <TabsContent value="firms"><FirmApplicationsPanel /></TabsContent>
      <TabsContent value="cordadas"><CordadasPanel /></TabsContent>
      <TabsContent value="alerts">
        <div className="text-center py-12 text-muted-foreground">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Panel de alertas próximamente</p>
        </div>
      </TabsContent>
    </Tabs>
  );
}
