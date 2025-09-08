import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";

const Testimonials = () => {
  return (
    <section className="py-12 bg-background">
      <div className="container px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            What Our Users Are Saying
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real success stories from job seekers who transformed their careers with our platform
          </p>
        </div>
        <div className="bg-gradient-card rounded-2xl p-8 md:p-12 shadow-elegant border">
          <div className="space-y-8">
            {/* First Testimonial */}
            <div className="space-y-6">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-warning fill-current" />
                ))}
              </div>
              <blockquote className="text-xl md:text-2xl font-medium">
                "I tried every job board and networking hack, but nothing worked—until I automated my outreach. The AI agents found HR contacts, sent personalized messages, and followed up exactly when they needed to. I've never felt more confident in my job search."
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-semibold">D</span>
                </div>
                <div>
                  <div className="font-semibold">Deepak</div>
                  <div className="text-muted-foreground">Software Engineer</div>
                </div>
              </div>
            </div>

            {/* Second Testimonial */}
            <div className="space-y-6">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-warning fill-current" />
                ))}
              </div>
              <blockquote className="text-xl md:text-2xl font-medium">
                "As a recent graduate, I didn't know where to start. The platform's step-by-step automation guided me through crafting a standout LinkedIn profile, targeting the right companies, and even prepping for interviews. I landed a full-time position before graduation!"
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-success flex items-center justify-center">
                  <span className="text-primary-foreground font-semibold">A</span>
                </div>
                <div>
                  <div className="font-semibold">Arjun</div>
                  <div className="text-muted-foreground">Recent Graduate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;