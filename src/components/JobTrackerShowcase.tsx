import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

const JobTrackerShowcase = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/auth');
  };

  return (
    <section className="py-10 lg:py-16 bg-gradient-feature">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-success mb-6">
            <div className="w-8 h-8 text-white">📊</div>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            Job Status Tracker
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Complete job tracking system from application to hire. Organize your job search with our powerful Kanban-style tracker.
          </p>
        </div>
        
        <div className="max-w-6xl mx-auto">
          <div 
            className="relative group cursor-pointer rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
            onClick={handleClick}
          >
            <img 
              src="/lovable-uploads/d9e6e252-84fa-4d52-a418-b6f0762e75de.png" 
              alt="Job Status Tracker Dashboard" 
              className="w-full h-auto"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Try Job Tracker Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default JobTrackerShowcase;