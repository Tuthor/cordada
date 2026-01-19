import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  GraduationCap, 
  Play, 
  Clock, 
  BookOpen,
  Trophy,
  Users,
  DollarSign,
  Handshake
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  duration_minutes: number | null;
  difficulty: string;
  progress?: number;
}

interface PartnerCourse {
  id: string;
  partner_id: string;
  title: string;
  description: string | null;
  course_type: 'course' | 'workshop';
  price: number;
  currency: string;
  duration_hours: number | null;
  max_participants: number | null;
  is_published: boolean;
  thumbnail_url: string | null;
  partner_name?: string;
}

const difficultyConfig: Record<string, { label: string; color: string }> = {
  beginner: { label: 'Principiante', color: 'bg-success/20 text-success' },
  intermediate: { label: 'Intermedio', color: 'bg-gold/20 text-gold-dark' },
  advanced: { label: 'Avanzado', color: 'bg-destructive/20 text-destructive' },
};

const Training = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [partnerCourses, setPartnerCourses] = useState<PartnerCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPartner, setLoadingPartner] = useState(true);

  useEffect(() => {
    fetchCourses();
    fetchPartnerCourses();
  }, [user]);

  const fetchCourses = async () => {
    const { data: coursesData, error } = await supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (!error && coursesData) {
      // Fetch progress for each course if user is logged in
      if (user) {
        const coursesWithProgress = await Promise.all(
          coursesData.map(async (course) => {
            const { data: progressData } = await supabase
              .from('course_progress')
              .select('progress_percent')
              .eq('user_id', user.id)
              .eq('course_id', course.id)
              .maybeSingle();

            return {
              ...course,
              progress: progressData?.progress_percent || 0,
            };
          })
        );
        setCourses(coursesWithProgress);
      } else {
        setCourses(coursesData);
      }
    }
    setLoading(false);
  };

  const fetchPartnerCourses = async () => {
    // Fetch published partner courses
    const { data: coursesData, error } = await supabase
      .from('partner_courses')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (!error && coursesData) {
      // Fetch partner names from profiles
      const partnerIds = [...new Set(coursesData.map(c => c.partner_id))];
      
      if (partnerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', partnerIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

        const coursesWithPartnerNames = coursesData.map(course => ({
          ...course,
          course_type: course.course_type as 'course' | 'workshop',
          partner_name: profileMap.get(course.partner_id) || 'Partner',
        }));

        setPartnerCourses(coursesWithPartnerNames);
      } else {
        setPartnerCourses([]);
      }
    }
    setLoadingPartner(false);
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'Duración variable';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins} minutos`;
  };

  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return 'Gratis';
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Capacitación</h1>
            <p className="text-muted-foreground">
              Mejora tus habilidades con cursos de la plataforma y nuestros partners
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Cursos Plataforma
              </CardTitle>
              <BookOpen className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{courses.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Cursos Partners
              </CardTitle>
              <Handshake className="w-4 h-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{partnerCourses.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                En Progreso
              </CardTitle>
              <Play className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {courses.filter(c => c.progress && c.progress > 0 && c.progress < 100).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completados
              </CardTitle>
              <Trophy className="w-4 h-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {courses.filter(c => c.progress === 100).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Platform and Partner courses */}
        <Tabs defaultValue="partners" className="space-y-4">
          <TabsList>
            <TabsTrigger value="partners" className="flex items-center gap-2">
              <Handshake className="w-4 h-4" />
              Cursos de Partners
              {partnerCourses.length > 0 && (
                <Badge variant="secondary" className="ml-1">{partnerCourses.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="platform" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Cursos Plataforma
              {courses.length > 0 && (
                <Badge variant="secondary" className="ml-1">{courses.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Partner Courses Tab */}
          <TabsContent value="partners">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-bold text-foreground">Cursos y Talleres de Partners</h2>
              </div>
              
              {loadingPartner ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <div className="h-40 bg-muted rounded-t-lg" />
                      <CardContent className="p-4">
                        <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                        <div className="h-4 bg-muted rounded w-full mb-2" />
                        <div className="h-4 bg-muted rounded w-2/3" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : partnerCourses.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Handshake className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Sin cursos de partners disponibles
                    </h3>
                    <p className="text-muted-foreground text-center max-w-md">
                      Nuestros partners están preparando cursos y talleres especializados. ¡Vuelve pronto!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {partnerCourses.map((course) => (
                    <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="h-40 bg-gradient-to-br from-gold/20 to-primary/20 flex items-center justify-center relative">
                        {course.thumbnail_url ? (
                          <img 
                            src={course.thumbnail_url} 
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <GraduationCap className="w-16 h-16 text-gold/50" />
                        )}
                        <Badge 
                          className="absolute top-3 right-3"
                          variant={course.course_type === 'course' ? 'default' : 'secondary'}
                        >
                          {course.course_type === 'course' ? 'Curso' : 'Taller'}
                        </Badge>
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            <Handshake className="w-3 h-3 mr-1" />
                            {course.partner_name}
                          </Badge>
                          {course.duration_hours && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {course.duration_hours}h
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                          {course.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {course.description || 'Sin descripción disponible'}
                        </p>
                        
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-lg font-bold text-gold">
                            {formatPrice(Number(course.price), course.currency)}
                          </span>
                          {course.max_participants && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              Máx. {course.max_participants}
                            </span>
                          )}
                        </div>

                        <Button variant="gold" className="w-full">
                          {Number(course.price) === 0 ? 'Inscribirse Gratis' : 'Ver Detalles'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Platform Courses Tab */}
          <TabsContent value="platform">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">Cursos de la Plataforma</h2>
              
              {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <div className="h-40 bg-muted rounded-t-lg" />
                      <CardContent className="p-4">
                        <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                        <div className="h-4 bg-muted rounded w-full mb-2" />
                        <div className="h-4 bg-muted rounded w-2/3" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : courses.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <GraduationCap className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Próximamente
                    </h3>
                    <p className="text-muted-foreground text-center max-w-md">
                      Estamos preparando cursos especializados para ti. ¡Vuelve pronto!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {courses.map((course) => (
                    <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="h-40 bg-gradient-hero flex items-center justify-center">
                        {course.thumbnail_url ? (
                          <img 
                            src={course.thumbnail_url} 
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <GraduationCap className="w-16 h-16 text-primary-foreground/50" />
                        )}
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={difficultyConfig[course.difficulty]?.color || ''}>
                            {difficultyConfig[course.difficulty]?.label || course.difficulty}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(course.duration_minutes)}
                          </span>
                        </div>
                        <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                          {course.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {course.description || 'Sin descripción disponible'}
                        </p>
                        
                        {course.progress !== undefined && course.progress > 0 && (
                          <div className="mb-4">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>Progreso</span>
                              <span>{course.progress}%</span>
                            </div>
                            <Progress value={course.progress} className="h-2" />
                          </div>
                        )}

                        <Button variant="outline" className="w-full">
                          {course.progress && course.progress > 0 ? 'Continuar' : 'Comenzar'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Training;