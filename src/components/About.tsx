const About = () => {
  return (
    <section id="about" className="py-6 bg-gradient-subtle">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 bg-gradient-primary bg-clip-text text-transparent">
            About Career Level Up
          </h2>
          <div className="bg-card/50 rounded-2xl p-8 border border-border/50 backdrop-blur-sm">
            <p className="text-lg text-muted-foreground leading-relaxed">
              Career Level Up is a flagship product from <span className="text-primary font-semibold">Rise n Shine Technologies</span>, designed to help students and professionals automate their job-hunting journey. With <span className="text-success font-semibold">19+ years of training & IT experience</span>, Rise n Shine empowers job seekers with tools, AI automation, and proven strategies to land their dream careers.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;