import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, User } from 'lucide-react';

const BuildProfileCTA = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/auth');
  };

  return (
    <section className="py-12 bg-gradient-hero relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-success/5"></div>
      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-success mb-6 shadow-glow">
            <User className="h-8 w-8 text-white" />
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            Build Profile for Free
          </h2>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Start your career transformation journey today. Create your professional profile and explore our tools at no cost.
          </p>
          
          <Button
            size="lg"
            className="bg-gradient-primary hover:shadow-glow transition-all duration-300 text-lg px-8 py-6 h-auto font-semibold"
            onClick={handleGetStarted}
          >
            Get Started for Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          
          <p className="text-sm text-muted-foreground mt-4">
            No credit card required • Instant access • Join thousands of professionals
          </p>
        </div>
      </div>
    </section>
  );
};

export default BuildProfileCTA;