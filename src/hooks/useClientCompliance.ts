import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ClientCompliance {
  clientId: string;
  totalRequirements: number;
  approvedRequirements: number;
  isCompliant: boolean;
}

export function useClientCompliance() {
  const { user, userRole } = useAuth();
  const [complianceMap, setComplianceMap] = useState<Map<string, ClientCompliance>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || userRole === 'client') {
      setLoading(false);
      return;
    }
    
    fetchCompliance();
  }, [user, userRole]);

  const fetchCompliance = async () => {
    if (!user) return;

    try {
      // Get all requirements
      const { data: requirements, error: reqError } = await supabase
        .from('client_requirements')
        .select('id, client_id');

      if (reqError) throw reqError;

      if (!requirements || requirements.length === 0) {
        setComplianceMap(new Map());
        setLoading(false);
        return;
      }

      // Get consultant's evidences
      const { data: evidences, error: evError } = await supabase
        .from('consultant_requirement_evidence')
        .select('requirement_id, status')
        .eq('consultant_id', user.id);

      if (evError) throw evError;

      // Build compliance map
      const clientMap = new Map<string, ClientCompliance>();

      // Count requirements per client
      requirements.forEach(req => {
        if (!clientMap.has(req.client_id)) {
          clientMap.set(req.client_id, {
            clientId: req.client_id,
            totalRequirements: 0,
            approvedRequirements: 0,
            isCompliant: false
          });
        }
        clientMap.get(req.client_id)!.totalRequirements++;
      });

      // Count approved evidences per client
      evidences?.forEach(ev => {
        if (ev.status === 'approved') {
          const req = requirements.find(r => r.id === ev.requirement_id);
          if (req && clientMap.has(req.client_id)) {
            clientMap.get(req.client_id)!.approvedRequirements++;
          }
        }
      });

      // Calculate compliance
      clientMap.forEach(client => {
        client.isCompliant = client.totalRequirements > 0 && 
          client.approvedRequirements === client.totalRequirements;
      });

      setComplianceMap(clientMap);
    } catch (error) {
      console.error('Error fetching compliance:', error);
    } finally {
      setLoading(false);
    }
  };

  const isCompliantWithClient = (clientId: string): boolean => {
    const compliance = complianceMap.get(clientId);
    // If no requirements exist for this client, they are compliant by default
    if (!compliance) return true;
    return compliance.isCompliant;
  };

  const getComplianceForClient = (clientId: string): ClientCompliance | null => {
    return complianceMap.get(clientId) || null;
  };

  const hasAnyRequirements = (clientId: string): boolean => {
    return complianceMap.has(clientId);
  };

  return {
    complianceMap,
    loading,
    isCompliantWithClient,
    getComplianceForClient,
    hasAnyRequirements,
    refetch: fetchCompliance
  };
}
