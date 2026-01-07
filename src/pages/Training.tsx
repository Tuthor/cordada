import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  GraduationCap, 
  Play, 
  Clock, 
  BookOpen,
  Trophy,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Course {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  duration_minutes: number | null;
  difficulty: string;
  progress?: number;
}

const difficultyConfig: Record<string, { label: string; color: string }> = {
  beginner: { label: 'Principiante', color: 'bg-success/20 text-success' },
  intermediate: { label: 'Intermedio', color: 'bg-gold/20 text-gold-dark' },
  advanced: { label: 'Avanzado', color: 'bg-destructive/20 text-destructive' },
};

const Training = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
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

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'Duración variable';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins} minutos`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Capacitación</h1>
            <p className="text-muted-foreground">
              Mejora tus habilidades con nuestros cursos especializados
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Cursos Disponibles
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
                En Progreso
              </CardTitle>
              <Play className="w-4 h-4 text-gold" />
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

        {/* Maturity Assessment CTA */}
        <Card className="bg-gradient-hero text-primary-foreground">
          <CardContent className="flex flex-col md:flex-row items-center justify-between gap-6 py-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-gold" />
              </div>
              <div>
                <h3 className="font-bold mb-1">
                  Evaluación de Madurez en Consultoría
                </h3>
                <p className="text-primary-foreground/80 text-sm">
                  Descubre tu nivel y recibe recomendaciones personalizadas
                </p>
              </div>
            </div>
            <Button variant="gold" asChild>
              <Link to="/" className="group">
                Realizar Evaluación
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Courses Grid */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">Cursos Disponibles</h2>
          
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
      </div>
    </DashboardLayout>
  );
};

export default Training;
