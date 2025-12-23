import Assessment from '@/components/Assessment';
import { Helmet, HelmetProvider } from 'react-helmet-async';

const Index = () => {
  return (
    <HelmetProvider>
      <Helmet>
        <title>Evaluación de Madurez del Consultor | Ecosistema de Consultoría Empresarial</title>
        <meta
          name="description"
          content="Evalúa tu preparación para unirte a un ecosistema élite de consultoría que sirve a clientes empresariales Fortune 500. Evaluación integral en 5 competencias clave."
        />
      </Helmet>
      <Assessment />
    </HelmetProvider>
  );
};

export default Index;
