import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  DollarSign, 
  Clock, 
  Calendar,
  Check,
  X
} from 'lucide-react';

interface Proposal {
  id: string;
  project_id: string;
  consultant_id: string;
  cover_letter: string;
  proposed_budget: number | null;
  proposed_duration_weeks: number | null;
  status: string;
  created_at: string;
  projects: {
    title: string;
    client_id: string;
  } | null;
  consultant_profile: {
    full_name: string;
  } | null;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendiente', variant: 'secondary' },
  accepted: { label: 'Aceptada', variant: 'default' },
  rejected: { label: 'Rechazada', variant: 'destructive' },
  withdrawn: { label: 'Retirada', variant: 'outline' },
};

const Proposals = () => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProposals();
    }
  }, [user, userRole]);

  const fetchProposals = async () => {
    if (!user) return;

    let query = supabase
      .from('proposals')
      .select(`
        *,
        projects (
          title,
          client_id
        )
      `)
      .order('created_at', { ascending: false });

    // Filter based on role
    if (userRole === 'consultant' || userRole === 'consulting_firm') {
      query = query.eq('consultant_id', user.id);
    }

    const { data, error } = await query;

    if (!error && data) {
      // Fetch consultant names
      const proposalsWithNames = await Promise.all(
        data.map(async (proposal) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', proposal.consultant_id)
            .maybeSingle();

          return {
            ...proposal,
            consultant_profile: profile,
          };
        })
      );

      // If client, filter to only show proposals for their projects
      if (userRole === 'client') {
        setProposals(
          proposalsWithNames.filter(
            (p) => p.projects?.client_id === user.id
          ) as Proposal[]
        );
      } else {
        setProposals(proposalsWithNames as Proposal[]);
      }
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (proposalId: string, newStatus: 'accepted' | 'rejected') => {
    const { error } = await supabase
      .from('proposals')
      .update({ status: newStatus })
      .eq('id', proposalId);

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado de la propuesta',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Propuesta actualizada',
        description: `La propuesta ha sido ${newStatus === 'accepted' ? 'aceptada' : 'rechazada'}`,
      });
      fetchProposals();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const filterProposals = (status: string | null) => {
    if (!status) return proposals;
    return proposals.filter((p) => p.status === status);
  };

  const ProposalCard = ({ proposal }: { proposal: Proposal }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-foreground">
                {proposal.projects?.title || 'Proyecto'}
              </h3>
              <Badge variant={statusConfig[proposal.status]?.variant || 'default'}>
                {statusConfig[proposal.status]?.label || proposal.status}
              </Badge>
            </div>

            {userRole === 'client' && (
              <p className="text-sm text-muted-foreground mb-2">
                Propuesto por: {proposal.consultant_profile?.full_name || 'Consultor'}
              </p>
            )}

            <p className="text-muted-foreground mb-4 line-clamp-3">
              {proposal.cover_letter}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {proposal.proposed_budget && (
                <span className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  ${proposal.proposed_budget.toLocaleString()}
                </span>
              )}
              {proposal.proposed_duration_weeks && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {proposal.proposed_duration_weeks} semanas
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(proposal.created_at)}
              </span>
            </div>
          </div>

          {userRole === 'client' && proposal.status === 'pending' && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => handleUpdateStatus(proposal.id, 'rejected')}
              >
                <X className="w-4 h-4 mr-1" />
                Rechazar
              </Button>
              <Button
                variant="gold"
                size="sm"
                onClick={() => handleUpdateStatus(proposal.id, 'accepted')}
              >
                <Check className="w-4 h-4 mr-1" />
                Aceptar
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Propuestas</h1>
          <p className="text-muted-foreground">
            {userRole === 'client'
              ? 'Revisa las propuestas recibidas para tus proyectos'
              : 'Gestiona tus propuestas enviadas'}
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">
              Todas ({proposals.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pendientes ({filterProposals('pending').length})
            </TabsTrigger>
            <TabsTrigger value="accepted">
              Aceptadas ({filterProposals('accepted').length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rechazadas ({filterProposals('rejected').length})
            </TabsTrigger>
          </TabsList>

          {['all', 'pending', 'accepted', 'rejected'].map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-4 mt-6">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-6 bg-muted rounded w-1/3 mb-3" />
                        <div className="h-4 bg-muted rounded w-full mb-2" />
                        <div className="h-4 bg-muted rounded w-2/3" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filterProposals(tab === 'all' ? null : tab).length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No hay propuestas
                    </h3>
                    <p className="text-muted-foreground text-center">
                      {userRole === 'client'
                        ? 'Aún no has recibido propuestas'
                        : 'Aún no has enviado propuestas'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filterProposals(tab === 'all' ? null : tab).map((proposal) => (
                  <ProposalCard key={proposal.id} proposal={proposal} />
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Proposals;
