import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { BookOpen, Users, DollarSign, TrendingUp } from 'lucide-react';

interface PartnerCourse {
  id: string;
  title: string;
  course_type: 'course' | 'workshop';
  price: number;
  currency: string;
  is_published: boolean;
}

interface Enrollment {
  id: string;
  course_id: string;
  user_id: string;
  enrolled_at: string;
  completed_at: string | null;
  payment_status: string;
  payment_amount: number | null;
}

interface PartnerCourseStatsProps {
  courses: PartnerCourse[];
  enrollments: Enrollment[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--gold))', 'hsl(var(--success))', '#8884d8', '#82ca9d'];

export function PartnerCourseStats({ courses, enrollments }: PartnerCourseStatsProps) {
  // Calculate stats per course
  const courseStats = courses.map((course) => {
    const courseEnrollments = enrollments.filter(e => e.course_id === course.id);
    const paidEnrollments = courseEnrollments.filter(e => e.payment_status === 'paid');
    const revenue = paidEnrollments.reduce((sum, e) => sum + (Number(e.payment_amount) || 0), 0);
    
    return {
      id: course.id,
      title: course.title,
      type: course.course_type,
      enrollments: courseEnrollments.length,
      paidEnrollments: paidEnrollments.length,
      revenue,
      conversionRate: courseEnrollments.length > 0 
        ? Math.round((paidEnrollments.length / courseEnrollments.length) * 100) 
        : 0,
      isPublished: course.is_published,
    };
  });

  // Data for bar chart
  const barChartData = courseStats.map(stat => ({
    name: stat.title.length > 20 ? stat.title.substring(0, 20) + '...' : stat.title,
    inscripciones: stat.enrollments,
    pagadas: stat.paidEnrollments,
  }));

  // Data for pie chart - enrollment distribution
  const pieChartData = courseStats
    .filter(stat => stat.enrollments > 0)
    .map(stat => ({
      name: stat.title.length > 15 ? stat.title.substring(0, 15) + '...' : stat.title,
      value: stat.enrollments,
    }));

  // Calculate totals
  const totals = {
    totalEnrollments: enrollments.length,
    totalPaid: enrollments.filter(e => e.payment_status === 'paid').length,
    totalRevenue: enrollments
      .filter(e => e.payment_status === 'paid')
      .reduce((sum, e) => sum + (Number(e.payment_amount) || 0), 0),
    avgConversion: courseStats.length > 0
      ? Math.round(courseStats.reduce((sum, s) => sum + s.conversionRate, 0) / courseStats.length)
      : 0,
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (courses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Sin datos para mostrar</h3>
          <p className="text-muted-foreground">
            Crea cursos para ver las estadísticas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Inscripciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totals.totalEnrollments}</div>
          </CardContent>
        </Card>

        <Card className="bg-gold/5 border-gold/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Inscripciones Pagadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totals.totalPaid}</div>
          </CardContent>
        </Card>

        <Card className="bg-success/5 border-success/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Ingresos Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatPrice(totals.totalRevenue)}</div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Conversión Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totals.avgConversion}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Inscripciones por Curso</CardTitle>
            <CardDescription>
              Comparación de inscripciones totales vs pagadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                  />
                  <YAxis className="fill-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="inscripciones" fill="hsl(var(--primary))" name="Inscripciones" />
                  <Bar dataKey="pagadas" fill="hsl(var(--gold))" name="Pagadas" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Sin datos de inscripciones
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Inscripciones</CardTitle>
            <CardDescription>
              Porcentaje de participación por curso
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Sin datos de inscripciones
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle por Curso</CardTitle>
          <CardDescription>
            Estadísticas individuales de cada curso y taller
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Curso</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Inscripciones</TableHead>
                <TableHead className="text-right">Pagadas</TableHead>
                <TableHead className="text-right">Ingresos</TableHead>
                <TableHead className="text-right">Conversión</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courseStats.map((stat) => (
                <TableRow key={stat.id}>
                  <TableCell className="font-medium">{stat.title}</TableCell>
                  <TableCell>
                    <Badge variant={stat.type === 'course' ? 'default' : 'secondary'}>
                      {stat.type === 'course' ? 'Curso' : 'Taller'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={stat.isPublished ? 'default' : 'outline'}>
                      {stat.isPublished ? 'Publicado' : 'Borrador'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{stat.enrollments}</TableCell>
                  <TableCell className="text-right">{stat.paidEnrollments}</TableCell>
                  <TableCell className="text-right">{formatPrice(stat.revenue)}</TableCell>
                  <TableCell className="text-right">
                    <Badge 
                      variant={stat.conversionRate >= 50 ? 'default' : 'secondary'}
                      className={stat.conversionRate >= 50 ? 'bg-success' : ''}
                    >
                      {stat.conversionRate}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}