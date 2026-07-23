import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { Search, Briefcase, DollarSign, Filter, X, SlidersHorizontal } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

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

interface Filters {
  expertise: string;
  minRate: number;
  maxRate: number;
  minExperience: number;
  maxExperience: number;
}

const initialFilters: Filters = {
  expertise: 'all',
  minRate: 0,
  maxRate: 500,
  minExperience: 0,
  maxExperience: 30,
};

const Directory = () => {
  const [consultants, setConsultants] = useState<ConsultantProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [tempFilters, setTempFilters] = useState<Filters>(initialFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [availableExpertise, setAvailableExpertise] = useState<string[]>([]);
  const [selectedConsultant, setSelectedConsultant] = useState<ConsultantProfile | null>(null);

  useEffect(() => {
    fetchConsultants();
    fetchAvailableExpertise();
  }, []);

  const fetchConsultants = async () => {
    // First get all user_ids that have the consultant role
    const { data: consultantRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'consultant');

    if (!consultantRoles || consultantRoles.length === 0) {
      setConsultants([]);
      setLoading(false);
      return;
    }

    const consultantUserIds = consultantRoles.map(r => r.user_id);

    // Then fetch consultant profiles only for verified consultants
    const { data: profilesData, error: profilesError } = await supabase
      .from('consultant_profiles')
      .select('*')
      .eq('is_available', true)
      .in('user_id', consultantUserIds);

    if (profilesError || !profilesData) {
      console.error('Error fetching consultant profiles:', profilesError);
      setConsultants([]);
      setLoading(false);
      return;
    }

    // Fetch profile data for each consultant
    const userIds = profilesData.map(p => p.user_id);
    const { data: profileInfoData } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url, bio')
      .in('user_id', userIds);

    // Merge the data
    const mergedData = profilesData.map(consultant => ({
      ...consultant,
      profiles: profileInfoData?.find(p => p.user_id === consultant.user_id) || null
    }));

    setConsultants(mergedData as unknown as ConsultantProfile[]);
    setLoading(false);
  };

  const fetchAvailableExpertise = async () => {
    const { data } = await supabase
      .from('consultant_profiles')
      .select('expertise')
      .not('expertise', 'is', null);

    if (data) {
      const allSkills = data.flatMap(c => c.expertise || []);
      const uniqueSkills = [...new Set(allSkills)].sort();
      setAvailableExpertise(uniqueSkills);
    }
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.expertise !== 'all') count++;
    if (filters.minRate > 0 || filters.maxRate < 500) count++;
    if (filters.minExperience > 0 || filters.maxExperience < 30) count++;
    return count;
  }, [filters]);

  const filteredConsultants = useMemo(() => {
    return consultants.filter((consultant) => {
      // Search filter
      const name = consultant.profiles?.full_name?.toLowerCase() || '';
      const headline = consultant.headline?.toLowerCase() || '';
      const expertiseText = consultant.expertise?.join(' ').toLowerCase() || '';
      const search = searchTerm.toLowerCase();
      const matchesSearch = name.includes(search) || headline.includes(search) || expertiseText.includes(search);
      
      if (!matchesSearch) return false;

      // Expertise filter
      if (filters.expertise !== 'all') {
        if (!consultant.expertise?.includes(filters.expertise)) return false;
      }

      // Rate filter
      const rate = consultant.hourly_rate || 0;
      if (rate < filters.minRate || rate > filters.maxRate) return false;

      // Experience filter
      const experience = consultant.years_experience || 0;
      if (experience < filters.minExperience || experience > filters.maxExperience) return false;

      return true;
    });
  }, [consultants, searchTerm, filters]);

  const applyFilters = () => {
    setFilters(tempFilters);
    setIsFilterOpen(false);
  };

  const resetFilters = () => {
    setTempFilters(initialFilters);
    setFilters(initialFilters);
  };

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

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, especialidad..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filtros
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[320px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Filtros Avanzados</SheetTitle>
              </SheetHeader>
              
              <div className="space-y-6 mt-6">
                {/* Expertise Filter */}
                <div className="space-y-2">
                  <Label>Especialidad</Label>
                  <Select
                    value={tempFilters.expertise}
                    onValueChange={(value) => setTempFilters(prev => ({ ...prev, expertise: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las especialidades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las especialidades</SelectItem>
                      {availableExpertise.map((skill) => (
                        <SelectItem key={skill} value={skill}>
                          {skill}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Rate Filter */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Tarifa por hora (USD)</Label>
                    <span className="text-sm text-muted-foreground">
                      ${tempFilters.minRate} - ${tempFilters.maxRate}
                    </span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <span className="text-sm w-12">Mín:</span>
                      <Slider
                        value={[tempFilters.minRate]}
                        onValueChange={([value]) => setTempFilters(prev => ({ 
                          ...prev, 
                          minRate: Math.min(value, prev.maxRate - 10)
                        }))}
                        max={500}
                        step={10}
                        className="flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm w-12">Máx:</span>
                      <Slider
                        value={[tempFilters.maxRate]}
                        onValueChange={([value]) => setTempFilters(prev => ({ 
                          ...prev, 
                          maxRate: Math.max(value, prev.minRate + 10)
                        }))}
                        max={500}
                        step={10}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Experience Filter */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Años de experiencia</Label>
                    <span className="text-sm text-muted-foreground">
                      {tempFilters.minExperience} - {tempFilters.maxExperience} años
                    </span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <span className="text-sm w-12">Mín:</span>
                      <Slider
                        value={[tempFilters.minExperience]}
                        onValueChange={([value]) => setTempFilters(prev => ({ 
                          ...prev, 
                          minExperience: Math.min(value, prev.maxExperience - 1)
                        }))}
                        max={30}
                        step={1}
                        className="flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm w-12">Máx:</span>
                      <Slider
                        value={[tempFilters.maxExperience]}
                        onValueChange={([value]) => setTempFilters(prev => ({ 
                          ...prev, 
                          maxExperience: Math.max(value, prev.minExperience + 1)
                        }))}
                        max={30}
                        step={1}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={resetFilters} className="flex-1">
                    <X className="h-4 w-4 mr-2" />
                    Limpiar
                  </Button>
                  <Button onClick={applyFilters} className="flex-1">
                    <Filter className="h-4 w-4 mr-2" />
                    Aplicar
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {filters.expertise !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Especialidad: {filters.expertise}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setFilters(prev => ({ ...prev, expertise: 'all' }))}
                />
              </Badge>
            )}
            {(filters.minRate > 0 || filters.maxRate < 500) && (
              <Badge variant="secondary" className="gap-1">
                Tarifa: ${filters.minRate} - ${filters.maxRate}/hr
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setFilters(prev => ({ ...prev, minRate: 0, maxRate: 500 }))}
                />
              </Badge>
            )}
            {(filters.minExperience > 0 || filters.maxExperience < 30) && (
              <Badge variant="secondary" className="gap-1">
                Experiencia: {filters.minExperience} - {filters.maxExperience} años
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => setFilters(prev => ({ ...prev, minExperience: 0, maxExperience: 30 }))}
                />
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-6 text-xs">
              Limpiar todos
            </Button>
          </div>
        )}

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
                {searchTerm || activeFiltersCount > 0
                  ? 'Intenta con otros términos de búsqueda o ajusta los filtros'
                  : 'Aún no hay consultores registrados en la plataforma'}
              </p>
              {activeFiltersCount > 0 && (
                <Button variant="outline" onClick={resetFilters} className="mt-4">
                  <X className="h-4 w-4 mr-2" />
                  Limpiar filtros
                </Button>
              )}
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

                  <Button variant="outline" className="w-full" onClick={() => setSelectedConsultant(consultant)}>
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
