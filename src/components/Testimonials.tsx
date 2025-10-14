import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      rating: 5,
      quote: "I tried every job board and networking hack, but nothing worked—until I automated my outreach. The AI agents found HR contacts, sent personalized messages, and followed up exactly when they needed to. I've never felt more confident in my job search.",
      name: "Deepak",
      role: "Software Engineer",
      initial: "D",
      gradient: "from-purple-500 to-indigo-600"
    },
    {
      rating: 5,
      quote: "As a recent graduate, I didn't know where to start. The platform's step-by-step automation guided me through crafting a standout LinkedIn profile, targeting the right companies, and even prepping for interviews. I landed a full-time position before graduation!",
      name: "Arjun",
      role: "Recent Graduate",
      initial: "A",
      gradient: "from-emerald-500 to-teal-600"
    },
    {
      rating: 5,
      quote: "The job tracking features helped me stay organized and follow up at the right time. I went from scattered applications to a systematic approach, and landed 3 offers in just 6 weeks!",
      name: "Priya",
      role: "Product Manager",
      initial: "P",
      gradient: "from-rose-500 to-pink-600"
    },
    {
      rating: 5,
      quote: "The AI-powered resume builder created a professional resume in minutes. Combined with the job matching features, I found roles I wouldn't have discovered on my own. Highly recommend!",
      name: "Vikram",
      role: "Data Analyst",
      initial: "V",
      gradient: "from-blue-500 to-cyan-600"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-background via-muted/10 to-background">
      <div className="container px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            What Our Users Are Saying
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Real success stories from job seekers who transformed their careers with our platform
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index} 
              className="bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-sm border-2 border-border/50 hover:border-primary/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${testimonial.gradient} opacity-10 rounded-full blur-3xl group-hover:opacity-20 transition-opacity duration-300`}></div>
              
              <CardContent className="p-8 relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-amber-500 fill-amber-500" />
                    ))}
                  </div>
                  <Quote className="w-10 h-10 text-primary/20" />
                </div>
                
                <blockquote className="text-lg text-foreground/90 mb-6 leading-relaxed italic">
                  "{testimonial.quote}"
                </blockquote>
                
                <div className="flex items-center gap-4 pt-4 border-t border-border/50">
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center shadow-lg`}>
                    <span className="text-white font-bold text-xl">{testimonial.initial}</span>
                  </div>
                  <div>
                    <div className="font-bold text-lg text-foreground">{testimonial.name}</div>
                    <div className="text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;