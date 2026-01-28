import Assessment from '@/components/Assessment';
import { Helmet, HelmetProvider } from 'react-helmet-async';

const ConsultantAssessment = () => {
  return (
    <HelmetProvider>
      <Helmet>
        <title>Evaluación de Madurez del Consultor | CORDADA - Ecosistema de Consultoría</title>
        <meta
          name="description"
          content="Evalúa tu preparación para unirte a CORDADA, el ecosistema élite de consultoría empresarial. Evaluación integral de madurez profesional."
        />
      </Helmet>
      <Assessment />
    </HelmetProvider>
  );
};

export default ConsultantAssessment;
