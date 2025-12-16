import Assessment from '@/components/Assessment';
import { Helmet, HelmetProvider } from 'react-helmet-async';

const Index = () => {
  return (
    <HelmetProvider>
      <Helmet>
        <title>Consultant Maturity Assessment | Enterprise Consulting Ecosystem</title>
        <meta
          name="description"
          content="Evaluate your readiness to join an elite consulting ecosystem serving Fortune 500 enterprise clients. Comprehensive assessment across 5 key competencies."
        />
      </Helmet>
      <Assessment />
    </HelmetProvider>
  );
};

export default Index;
