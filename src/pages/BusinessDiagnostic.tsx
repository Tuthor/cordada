import BusinessAssessment from '@/components/business/BusinessAssessment';
import { Helmet, HelmetProvider } from 'react-helmet-async';

const BusinessDiagnostic = () => {
  return (
    <HelmetProvider>
      <Helmet>
        <title>Diagnóstico Empresarial | CORDADA - Ecosistema de Consultoría</title>
        <meta
          name="description"
          content="Diagnostique la salud organizacional de su empresa. Evaluación integral en 6 dimensiones clave para identificar oportunidades de mejora."
        />
      </Helmet>
      <BusinessAssessment />
    </HelmetProvider>
  );
};

export default BusinessDiagnostic;
