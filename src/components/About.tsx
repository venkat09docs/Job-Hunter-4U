const About = () => {
  return (
    <section id="about" className="py-16 bg-background">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 bg-gradient-primary bg-clip-text text-transparent">
            About Job Hunter 4U
          </h2>
          <div className="prose prose-lg mx-auto">
            <p className="text-lg text-muted-foreground leading-relaxed">
              Job Hunter 4U is a flagship product from Rise n Shine Technologies, designed to help students and professionals automate their job-hunting journey. With 19+ years of training & IT experience, Rise n Shine empowers job seekers with tools, AI automation, and proven strategies to land their dream careers.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;