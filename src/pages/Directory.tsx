import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { Search, MapPin, Star, Briefcase, DollarSign } from 'lucide-react';

interface ConsultantProfile {
  id: string;
  user_id: string;
  headline: string | null;
  expertise: string[] | null;
  hourly_rate: number | null;
  years_experience: number | null;
  is_available: boolean | null;
  maturity_level: string | null;
  profiles: {
    full_name: string;
    avatar_url: string | null;
    bio: string | null;
  } | null;
}

const Directory = () => {
  const [consultants, setConsultants] = useState<ConsultantProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchConsultants();
  }, []);

  const fetchConsultants = async () => {
    const { data, error } = await supabase
      .from('consultant_profiles')
      .select(`
        id,
        user_id,
        headline,
        expertise,
        hourly_rate,
        years_experience,
        is_available,
        maturity_level,
        profiles!consultant_profiles_user_id_fkey (
          full_name,
          avatar_url,
          bio
        )
      `)
      .eq('is_available', true);

    if (!error && data) {
      setConsultants(data as unknown as ConsultantProfile[]);
    }
    setLoading(false);
  };

  const filteredConsultants = consultants.filter((consultant) => {
    const name = consultant.profiles?.full_name?.toLowerCase() || '';
    const headline = consultant.headline?.toLowerCase() || '';
    const expertise = consultant.expertise?.join(' ').toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    
    return name.includes(search) || headline.includes(search) || expertise.includes(search);
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Directorio de Consultores</h1>
          <p className="text-muted-foreground">
            Encuentra consultores verificados para tus proyectos
          </p>
        </div>

        {/* Search */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, especialidad..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Consultants Grid */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-muted" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-20 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredConsultants.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Briefcase className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No se encontraron consultores
              </h3>
              <p className="text-muted-foreground text-center max-w-md">
                {searchTerm
                  ? 'Intenta con otros términos de búsqueda'
                  : 'Aún no hay consultores registrados en la plataforma'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredConsultants.map((consultant) => (
              <Card key={consultant.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="w-16 h-16">
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                        {getInitials(consultant.profiles?.full_name || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {consultant.profiles?.full_name || 'Consultor'}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {consultant.headline || 'Consultor profesional'}
                      </p>
                      {consultant.maturity_level && (
                        <Badge variant="secondary" className="mt-1">
                          {consultant.maturity_level}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {consultant.profiles?.bio || 'Sin descripción disponible'}
                  </p>

                  {consultant.expertise && consultant.expertise.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {consultant.expertise.slice(0, 3).map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {consultant.expertise.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{consultant.expertise.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    {consultant.years_experience && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {consultant.years_experience} años
                      </span>
                    )}
                    {consultant.hourly_rate && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        ${consultant.hourly_rate}/hr
                      </span>
                    )}
                  </div>

                  <Button variant="outline" className="w-full">
                    Ver Perfil
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Directory;
