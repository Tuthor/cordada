import Assessment from '@/components/Assessment';
import { Helmet, HelmetProvider } from 'react-helmet-async';

const Index = () => {
  return (
    <HelmetProvider>
      <Helmet>
        <title>Evaluación de Madurez | CORDADA - Ecosistema de Consultoría</title>
        <meta
          name="description"
          content="Evalúa tu preparación para unirte a CORDADA, el ecosistema élite de consultoría empresarial. Evaluación integral en 5 competencias clave."
        />
      </Helmet>
      <Assessment />
    </HelmetProvider>
  );
};

export default Index;
