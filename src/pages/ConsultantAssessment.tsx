import { useSearchParams } from 'react-router-dom';
import Assessment from '@/components/Assessment';
import { Helmet, HelmetProvider } from 'react-helmet-async';


const ConsultantAssessment = () => {
  const [searchParams] = useSearchParams();
  const firmToken = searchParams.get('firm_token') || undefined;
  const leaderToken = searchParams.get('leader') || undefined;

  return (
    <HelmetProvider>
      <Helmet>
        <title>Evaluación de Madurez del Consultor | CORDADA - Ecosistema de Consultoría</title>
        <meta
          name="description"
          content="Evalúa tu preparación para unirte a CORDADA, el ecosistema élite de consultoría empresarial. Evaluación integral de madurez profesional."
        />
      </Helmet>
      
      <Assessment firmToken={firmToken} leaderToken={leaderToken} />
    </HelmetProvider>
  );
};

export default ConsultantAssessment;
