import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AssessmentResult, MaturityLevelInfo } from '@/types/assessment';
import { 
  Users, 
  Briefcase, 
  Globe, 
  CheckCircle, 
  ArrowRight,
  Building2,
  Mail,
  User,
  Phone,
  Linkedin
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EnrollmentFormProps {
  result: AssessmentResult;
  levelInfo: MaturityLevelInfo;
  onBack: () => void;
}

const EnrollmentForm = ({ result, levelInfo, onBack }: EnrollmentFormProps) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    linkedIn: '',
    expertise: '',
    yearsExperience: '',
    motivation: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-enrollment', {
        body: {
          ...formData,
          maturityLevel: levelInfo.name,
          overallScore: Math.round(result.overallPercentage),
        },
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast({
        title: "Application Submitted!",
        description: "We'll review your profile and get back to you within 48 hours.",
      });
    } catch (error: any) {
      console.error('Error submitting enrollment:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background py-8 lg:py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-card rounded-2xl shadow-xl border border-border/50 p-8 lg:p-12 text-center animate-fade-in">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Welcome to the Ecosystem!
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Your application has been submitted successfully. Our team will review your profile 
              and maturity assessment results. You'll receive an email within 48 hours with next steps.
            </p>
            <div className="bg-secondary/50 rounded-xl p-6 mb-8 text-left">
              <h3 className="font-semibold text-foreground mb-3">What happens next?</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-gold/20 text-gold flex items-center justify-center text-sm font-semibold shrink-0">1</span>
                  <span>Profile review by our onboarding team</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-gold/20 text-gold flex items-center justify-center text-sm font-semibold shrink-0">2</span>
                  <span>Brief video call to discuss your expertise and goals</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-gold/20 text-gold flex items-center justify-center text-sm font-semibold shrink-0">3</span>
                  <span>Access to the consultant portal and client opportunities</span>
                </li>
              </ul>
            </div>
            <Button variant="outline" onClick={onBack}>
              Return to Results
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 lg:py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 text-gold mb-4">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Join Our Network</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-3">
            Enroll in the Consultant Ecosystem
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Connect with enterprise clients seeking your expertise. Our ecosystem matches 
            qualified consultants with high-value opportunities.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-4 mb-8 animate-slide-up">
          <div className="bg-card rounded-xl p-5 border border-border/50">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
              <Briefcase className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Enterprise Clients</h3>
            <p className="text-sm text-muted-foreground">Access to vetted Fortune 500 and mid-market opportunities</p>
          </div>
          <div className="bg-card rounded-xl p-5 border border-border/50">
            <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center mb-3">
              <Globe className="w-5 h-5 text-gold" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Global Network</h3>
            <p className="text-sm text-muted-foreground">Join 500+ consultants across 40+ countries</p>
          </div>
          <div className="bg-card rounded-xl p-5 border border-border/50">
            <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center mb-3">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">Quality Matches</h3>
            <p className="text-sm text-muted-foreground">AI-powered matching based on skills and maturity</p>
          </div>
        </div>

        {/* Your Score Badge */}
        <div className="bg-gradient-hero rounded-xl p-4 mb-8 flex items-center justify-between animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-primary-foreground">{Math.round(result.overallPercentage)}%</span>
            </div>
            <div>
              <p className="text-primary-foreground/80 text-sm">Your Maturity Level</p>
              <p className="text-primary-foreground font-semibold">{levelInfo.name}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-card rounded-2xl shadow-xl border border-border/50 p-6 lg:p-8 animate-slide-up" style={{ animationDelay: '150ms' }}>
          <h2 className="text-xl font-semibold text-foreground mb-6">Complete Your Profile</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
                placeholder="John Doe"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
                placeholder="john@company.com"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
                placeholder="+1 (555) 000-0000"
              />
            </div>

            {/* Company */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                Current Company
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
                placeholder="Company Name or Independent"
              />
            </div>

            {/* LinkedIn */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Linkedin className="w-4 h-4 text-muted-foreground" />
                LinkedIn Profile
              </label>
              <input
                type="url"
                name="linkedIn"
                value={formData.linkedIn}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
                placeholder="linkedin.com/in/johndoe"
              />
            </div>

            {/* Years of Experience */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                Years of Experience *
              </label>
              <select
                name="yearsExperience"
                value={formData.yearsExperience}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
              >
                <option value="">Select experience</option>
                <option value="1-3">1-3 years</option>
                <option value="4-6">4-6 years</option>
                <option value="7-10">7-10 years</option>
                <option value="10+">10+ years</option>
              </select>
            </div>

            {/* Primary Expertise */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-foreground">Primary Area of Expertise *</label>
              <select
                name="expertise"
                value={formData.expertise}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all"
              >
                <option value="">Select your primary expertise</option>
                <option value="strategy">Strategy & Management Consulting</option>
                <option value="technology">Technology & Digital Transformation</option>
                <option value="finance">Finance & Risk Management</option>
                <option value="operations">Operations & Supply Chain</option>
                <option value="hr">Human Resources & Organizational Design</option>
                <option value="marketing">Marketing & Growth Strategy</option>
                <option value="data">Data & Analytics</option>
                <option value="cybersecurity">Cybersecurity & Compliance</option>
              </select>
            </div>

            {/* Motivation */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-foreground">Why do you want to join our ecosystem? *</label>
              <textarea
                name="motivation"
                value={formData.motivation}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-all resize-none"
                placeholder="Tell us about your consulting goals and what you hope to achieve by joining our network..."
              />
            </div>
          </div>

          {/* Submit */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <Button type="button" variant="outline" onClick={onBack}>
              Back to Results
            </Button>
            <Button type="submit" variant="gold" size="xl" disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Submitting...
                </>
              ) : (
                <>
                  Submit Application
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-6">
            By submitting, you agree to our Terms of Service and Privacy Policy. 
            We'll only use your information to process your application.
          </p>
        </form>
      </div>
    </div>
  );
};

export default EnrollmentForm;
