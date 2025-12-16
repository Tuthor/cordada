import { Button } from '@/components/ui/button';
import { ArrowRight, Clock, Shield, Target, CheckCircle } from 'lucide-react';

interface WelcomeScreenProps {
  onStart: () => void;
}

const WelcomeScreen = ({ onStart }: WelcomeScreenProps) => {
  const features = [
    {
      icon: Target,
      title: '5 Key Competencies',
      description: 'Comprehensive evaluation across critical consulting dimensions',
    },
    {
      icon: Clock,
      title: '10-15 Minutes',
      description: 'Quick assessment designed for busy professionals',
    },
    {
      icon: Shield,
      title: 'Confidential',
      description: 'Your responses are secure and private',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-hero text-primary-foreground">
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/20 text-gold mb-6">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">Enterprise Consultant Assessment</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              Discover Your Consulting{' '}
              <span className="text-gradient-gold">Maturity Level</span>
            </h1>
            <p className="text-lg lg:text-xl text-primary-foreground/80 mb-8 leading-relaxed">
              Our diagnostic tool evaluates your readiness to join an elite consulting ecosystem 
              serving Fortune 500 enterprise clients.
            </p>
            <Button variant="gold" size="xl" onClick={onStart} className="group">
              Begin Assessment
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="bg-card rounded-xl p-6 shadow-lg border border-border/50 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* What We Assess */}
        <div className="max-w-3xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-center text-foreground mb-8">
            What We Evaluate
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              'Technical expertise and domain knowledge',
              'Client relationship management',
              'Communication and presentation skills',
              'Problem-solving capabilities',
              'Professional standards and ethics',
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg"
              >
                <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                <span className="text-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
