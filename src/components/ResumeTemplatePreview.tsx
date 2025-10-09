import { Card } from '@/components/ui/card';
import { CheckCircle, FileText } from 'lucide-react';

interface ResumeTemplatePreviewProps {
  template: string;
  selected: boolean;
  onSelect: (template: string) => void;
}

export const ResumeTemplatePreview = ({ template, selected, onSelect }: ResumeTemplatePreviewProps) => {
  const templates = {
    classic: {
      name: "Classic Professional",
      description: "Traditional layout perfect for corporate roles",
      preview: (
        <div className="aspect-[8.5/11] bg-white rounded border border-border overflow-y-auto text-[3.5px] leading-[1.3] p-2">
          <div className="text-center border-b-2 border-gray-300 pb-1 mb-1">
            <div className="font-bold text-[7px] text-gray-900 tracking-wide">JOHN ALEXANDER DOE</div>
            <div className="text-gray-600 mt-0.5 text-[3px]">Senior Software Engineer</div>
            <div className="text-gray-600 mt-0.5 text-[3px]">john.doe@email.com | (555) 123-4567 | New York, NY | linkedin.com/in/johndoe</div>
          </div>
          
          <div className="mb-1">
            <div className="font-bold text-[4.5px] text-gray-900 mb-0.5 uppercase tracking-wider border-b border-gray-300 pb-0.5">Professional Summary</div>
            <div className="text-gray-700 text-justify">Results-driven Senior Software Engineer with 8+ years of experience in full-stack development, system architecture, and team leadership. Proven track record of delivering scalable solutions that improve operational efficiency by 45%. Expertise in modern web technologies, cloud infrastructure, and agile methodologies. Passionate about mentoring junior developers and driving technical excellence.</div>
          </div>
          
          <div className="mb-1">
            <div className="font-bold text-[4.5px] text-gray-900 mb-0.5 uppercase tracking-wider border-b border-gray-300 pb-0.5">Professional Experience</div>
            
            <div className="mb-0.5">
              <div className="flex justify-between items-baseline">
                <div className="font-bold text-gray-900 text-[4px]">Senior Software Engineer</div>
                <div className="text-gray-600 text-[3px]">Jan 2020 - Present</div>
              </div>
              <div className="text-gray-700 italic text-[3.5px]">Tech Innovations Corp, New York, NY</div>
              <div className="text-gray-700 mt-0.5 space-y-0.5">
                <div>• Led development of microservices architecture serving 2M+ daily active users</div>
                <div>• Managed team of 7 engineers, conducting code reviews and technical mentorship</div>
                <div>• Reduced application load time by 60% through performance optimization</div>
                <div>• Implemented CI/CD pipeline reducing deployment time from 2 hours to 15 minutes</div>
              </div>
            </div>
            
            <div className="mb-0.5">
              <div className="flex justify-between items-baseline">
                <div className="font-bold text-gray-900 text-[4px]">Software Engineer</div>
                <div className="text-gray-600 text-[3px]">Jun 2018 - Dec 2019</div>
              </div>
              <div className="text-gray-700 italic text-[3.5px]">Digital Solutions LLC, Boston, MA</div>
              <div className="text-gray-700 mt-0.5 space-y-0.5">
                <div>• Developed RESTful APIs using Node.js and Express serving 500K+ requests daily</div>
                <div>• Built responsive web applications with React and TypeScript</div>
                <div>• Collaborated with cross-functional teams in Agile environment</div>
              </div>
            </div>
            
            <div className="mb-0.5">
              <div className="flex justify-between items-baseline">
                <div className="font-bold text-gray-900 text-[4px]">Junior Developer</div>
                <div className="text-gray-600 text-[3px]">Jan 2016 - May 2018</div>
              </div>
              <div className="text-gray-700 italic text-[3.5px]">StartUp Ventures, San Francisco, CA</div>
              <div className="text-gray-700 mt-0.5 space-y-0.5">
                <div>• Contributed to front-end development of e-commerce platform</div>
                <div>• Participated in daily standups and sprint planning sessions</div>
              </div>
            </div>
          </div>
          
          <div className="mb-1">
            <div className="font-bold text-[4.5px] text-gray-900 mb-0.5 uppercase tracking-wider border-b border-gray-300 pb-0.5">Education</div>
            <div className="flex justify-between items-baseline">
              <div className="font-bold text-gray-900 text-[4px]">Bachelor of Science in Computer Science</div>
              <div className="text-gray-600 text-[3px]">2012 - 2016</div>
            </div>
            <div className="text-gray-700 text-[3.5px]">Stanford University, Stanford, CA</div>
            <div className="text-gray-700 text-[3px]">GPA: 3.8/4.0 | Dean's List (4 semesters)</div>
          </div>
          
          <div className="mb-1">
            <div className="font-bold text-[4.5px] text-gray-900 mb-0.5 uppercase tracking-wider border-b border-gray-300 pb-0.5">Technical Skills</div>
            <div className="text-gray-700">
              <div><span className="font-semibold">Languages:</span> JavaScript, TypeScript, Python, Java, SQL</div>
              <div><span className="font-semibold">Frontend:</span> React, Redux, Next.js, Vue.js, HTML5, CSS3, Tailwind CSS</div>
              <div><span className="font-semibold">Backend:</span> Node.js, Express, Django, REST APIs, GraphQL</div>
              <div><span className="font-semibold">Databases:</span> PostgreSQL, MongoDB, Redis, MySQL</div>
              <div><span className="font-semibold">DevOps:</span> Docker, Kubernetes, AWS, Jenkins, GitHub Actions</div>
              <div><span className="font-semibold">Tools:</span> Git, JIRA, Figma, Postman</div>
            </div>
          </div>
          
          <div className="mb-1">
            <div className="font-bold text-[4.5px] text-gray-900 mb-0.5 uppercase tracking-wider border-b border-gray-300 pb-0.5">Certifications</div>
            <div className="text-gray-700 space-y-0.5">
              <div>• AWS Certified Solutions Architect - Associate (2022)</div>
              <div>• Professional Scrum Master I (PSM I) - Scrum.org (2021)</div>
            </div>
          </div>
          
          <div>
            <div className="font-bold text-[4.5px] text-gray-900 mb-0.5 uppercase tracking-wider border-b border-gray-300 pb-0.5">Awards & Recognition</div>
            <div className="text-gray-700 space-y-0.5">
              <div>• Employee of the Year 2022 - Tech Innovations Corp</div>
              <div>• Best Innovation Award for Microservices Architecture (2021)</div>
            </div>
          </div>
        </div>
      )
    },
    modern: {
      name: "Modern Minimal",
      description: "Clean design for tech and creative industries",
      preview: (
        <div className="aspect-[8.5/11] bg-gradient-to-br from-slate-50 to-white rounded overflow-y-auto text-[3.5px] leading-[1.3] p-2">
          <div className="flex gap-2">
            <div className="w-1/3 bg-primary/10 p-1.5 rounded-lg">
              <div className="font-bold text-[7px] mb-1 text-primary">JOHN DOE</div>
              <div className="text-[3px] space-y-0.5 text-gray-700">
                <div className="flex items-center gap-0.5">
                  <span>📧</span> john@email.com
                </div>
                <div className="flex items-center gap-0.5">
                  <span>📱</span> (555) 123-4567
                </div>
                <div className="flex items-center gap-0.5">
                  <span>📍</span> San Francisco, CA
                </div>
                <div className="flex items-center gap-0.5">
                  <span>💼</span> linkedin.com/in/johndoe
                </div>
                <div className="flex items-center gap-0.5">
                  <span>🔗</span> github.com/johndoe
                </div>
              </div>
              
              <div className="mt-2 pt-2 border-t border-primary/20">
                <div className="font-bold text-[4px] mb-1 text-primary">TECHNICAL SKILLS</div>
                <div className="space-y-1 text-[3px]">
                  <div>
                    <div className="font-semibold text-gray-900">Languages</div>
                    <div className="bg-primary/5 px-1 py-0.5 rounded mt-0.5">JavaScript, TypeScript, Python</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Frontend</div>
                    <div className="bg-primary/5 px-1 py-0.5 rounded mt-0.5">React, Next.js, Vue.js</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Backend</div>
                    <div className="bg-primary/5 px-1 py-0.5 rounded mt-0.5">Node.js, Express, GraphQL</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Cloud & DevOps</div>
                    <div className="bg-primary/5 px-1 py-0.5 rounded mt-0.5">AWS, Docker, Kubernetes</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-2 pt-2 border-t border-primary/20">
                <div className="font-bold text-[4px] mb-1 text-primary">CERTIFICATIONS</div>
                <div className="space-y-0.5 text-[3px] text-gray-700">
                  <div>• AWS Solutions Architect</div>
                  <div>• Professional Scrum Master</div>
                </div>
              </div>
            </div>
            
            <div className="w-2/3">
              <div className="mb-1.5">
                <div className="font-bold text-[5px] text-primary mb-0.5 pb-0.5 border-b-2 border-primary/20">PROFESSIONAL SUMMARY</div>
                <div className="text-gray-700 text-justify">Innovative Full-Stack Engineer with 7+ years of experience building scalable web applications. Specialized in modern JavaScript frameworks and cloud-native architectures. Proven track record of leading development teams and delivering high-impact solutions that drive business growth.</div>
              </div>
              
              <div className="mb-1.5">
                <div className="font-bold text-[5px] text-primary mb-0.5 pb-0.5 border-b-2 border-primary/20">EXPERIENCE</div>
                
                <div className="mb-1">
                  <div className="flex justify-between items-start">
                    <div className="font-bold text-gray-900 text-[4px]">Senior Software Engineer</div>
                    <div className="text-gray-500 text-[3px]">2020 - Present</div>
                  </div>
                  <div className="text-gray-600 italic text-[3.5px]">Tech Innovations Inc., San Francisco, CA</div>
                  <div className="text-gray-700 mt-0.5 space-y-0.5">
                    <div>• Architected and developed microservices platform serving 1.5M users</div>
                    <div>• Led team of 6 engineers in agile development practices</div>
                    <div>• Improved application performance by 55% through optimization</div>
                    <div>• Implemented CI/CD pipeline reducing deployment time by 70%</div>
                  </div>
                </div>
                
                <div className="mb-1">
                  <div className="flex justify-between items-start">
                    <div className="font-bold text-gray-900 text-[4px]">Full Stack Developer</div>
                    <div className="text-gray-500 text-[3px]">2018 - 2020</div>
                  </div>
                  <div className="text-gray-600 italic text-[3.5px]">Digital Solutions Corp, Seattle, WA</div>
                  <div className="text-gray-700 mt-0.5 space-y-0.5">
                    <div>• Built RESTful APIs with Node.js handling 300K daily requests</div>
                    <div>• Developed responsive React applications with Redux state management</div>
                    <div>• Mentored junior developers on best practices</div>
                  </div>
                </div>
                
                <div className="mb-1">
                  <div className="flex justify-between items-start">
                    <div className="font-bold text-gray-900 text-[4px]">Junior Developer</div>
                    <div className="text-gray-500 text-[3px]">2016 - 2018</div>
                  </div>
                  <div className="text-gray-600 italic text-[3.5px]">StartUp Labs, Austin, TX</div>
                  <div className="text-gray-700 mt-0.5 space-y-0.5">
                    <div>• Contributed to frontend development of SaaS platform</div>
                    <div>• Participated in code reviews and sprint planning</div>
                  </div>
                </div>
              </div>
              
              <div className="mb-1.5">
                <div className="font-bold text-[5px] text-primary mb-0.5 pb-0.5 border-b-2 border-primary/20">EDUCATION</div>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-gray-900 text-[4px]">BS in Computer Science</div>
                    <div className="text-gray-600 text-[3.5px]">University of California, Berkeley</div>
                    <div className="text-gray-500 text-[3px]">GPA: 3.7/4.0</div>
                  </div>
                  <div className="text-gray-500 text-[3px]">2012 - 2016</div>
                </div>
              </div>
              
              <div>
                <div className="font-bold text-[5px] text-primary mb-0.5 pb-0.5 border-b-2 border-primary/20">KEY PROJECTS</div>
                <div className="space-y-0.5 text-gray-700">
                  <div>• E-commerce Platform: Built scalable platform processing $2M monthly</div>
                  <div>• Analytics Dashboard: Real-time data visualization with 99.9% uptime</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    executive: {
      name: "Executive",
      description: "Professional layout for senior positions",
      preview: (
        <div className="aspect-[8.5/11] bg-white rounded border-2 border-gray-800 overflow-hidden text-[4px] leading-tight">
          <div className="bg-gray-900 text-white p-1.5 text-center">
            <div className="font-bold text-[7px]">JOHN DOE</div>
            <div className="text-[4px] mt-0.5">CHIEF TECHNOLOGY OFFICER</div>
            <div className="text-[3.5px] mt-0.5">john.doe@email.com | (555) 123-4567 | New York, NY</div>
          </div>
          
          <div className="p-2">
            <div className="mb-1 pb-1 border-b-2 border-gray-800">
              <div className="font-bold text-[5px] text-gray-900 mb-0.5">EXECUTIVE SUMMARY</div>
              <div className="text-gray-700">Strategic technology leader with 15+ years driving digital transformation...</div>
            </div>
            
            <div className="mb-1 pb-1 border-b border-gray-300">
              <div className="font-bold text-[5px] text-gray-900 mb-0.5">LEADERSHIP EXPERIENCE</div>
              <div className="mb-0.5">
                <div className="flex justify-between">
                  <div className="font-bold text-gray-900">Chief Technology Officer</div>
                  <div className="text-gray-600">2018 - Present</div>
                </div>
                <div className="text-gray-700 italic">Fortune 500 Company</div>
                <div className="text-gray-700 mt-0.5">• Oversaw $50M technology budget</div>
                <div className="text-gray-700">• Led team of 100+ engineers</div>
              </div>
            </div>
            
            <div className="mb-1 pb-1 border-b border-gray-300">
              <div className="font-bold text-[5px] text-gray-900 mb-0.5">EDUCATION & CERTIFICATIONS</div>
              <div className="text-gray-900 font-semibold">MBA, Harvard Business School</div>
              <div className="text-gray-700">MS Computer Science, Stanford University</div>
            </div>
            
            <div>
              <div className="font-bold text-[5px] text-gray-900 mb-0.5">CORE COMPETENCIES</div>
              <div className="text-gray-700">Strategic Planning • Digital Transformation • Team Leadership</div>
            </div>
          </div>
        </div>
      )
    },
    ats: {
      name: "ATS-Optimized",
      description: "Designed to pass applicant tracking systems",
      preview: (
        <div className="aspect-[8.5/11] bg-white rounded border border-border overflow-hidden text-[4px] leading-tight p-2">
          <div className="mb-1">
            <div className="font-bold text-[6px] text-gray-900">JOHN DOE</div>
            <div className="text-gray-700">Email: john.doe@email.com</div>
            <div className="text-gray-700">Phone: (555) 123-4567</div>
            <div className="text-gray-700">Location: New York, NY</div>
          </div>
          
          <div className="border-t border-gray-300 pt-1 mb-1">
            <div className="font-bold text-[5px] text-gray-900 mb-0.5">PROFESSIONAL SUMMARY</div>
            <div className="text-gray-700">Software Engineer with 5 years experience in full-stack development. Proficient in JavaScript, React, Node.js, and cloud technologies.</div>
          </div>
          
          <div className="border-t border-gray-300 pt-1 mb-1">
            <div className="font-bold text-[5px] text-gray-900 mb-0.5">SKILLS</div>
            <div className="text-gray-700">Programming Languages: JavaScript, Python, TypeScript, Java</div>
            <div className="text-gray-700">Frameworks: React, Node.js, Express, Django</div>
            <div className="text-gray-700">Tools: Git, Docker, AWS, Jenkins</div>
          </div>
          
          <div className="border-t border-gray-300 pt-1 mb-1">
            <div className="font-bold text-[5px] text-gray-900 mb-0.5">WORK EXPERIENCE</div>
            <div className="mb-0.5">
              <div className="font-semibold text-gray-900">Senior Software Engineer</div>
              <div className="text-gray-700">Tech Corp, New York, NY</div>
              <div className="text-gray-700">January 2020 - Present</div>
              <div className="text-gray-700 mt-0.5">- Developed web applications using React and Node.js</div>
              <div className="text-gray-700">- Improved application performance by 40%</div>
            </div>
          </div>
          
          <div className="border-t border-gray-300 pt-1">
            <div className="font-bold text-[5px] text-gray-900 mb-0.5">EDUCATION</div>
            <div className="text-gray-900">Bachelor of Science in Computer Science</div>
            <div className="text-gray-700">University Name, 2016</div>
          </div>
        </div>
      )
    },
    creative: {
      name: "Creative",
      description: "Stand out in design and creative fields",
      preview: (
        <div className="aspect-[8.5/11] bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded overflow-hidden text-[4px] leading-tight p-2">
          <div className="flex gap-1 mb-1">
            <div className="w-1/4 bg-gradient-to-br from-purple-600 to-pink-600 text-white p-1 rounded-lg">
              <div className="font-bold text-[6px] mb-1">JD</div>
              <div className="text-[3px] space-y-0.5 mt-1">
                <div>✉️ john@creative.com</div>
                <div>📱 555-1234</div>
                <div>🌐 portfolio.com</div>
              </div>
            </div>
            
            <div className="flex-1">
              <div className="font-bold text-[8px] bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">JOHN DOE</div>
              <div className="text-gray-700 italic text-[4.5px]">Creative Designer & Innovator</div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-1 mb-1">
            <div className="bg-white/70 backdrop-blur rounded p-1">
              <div className="font-bold text-[4px] text-purple-600">5+</div>
              <div className="text-[3px] text-gray-600">Years Exp.</div>
            </div>
            <div className="bg-white/70 backdrop-blur rounded p-1">
              <div className="font-bold text-[4px] text-pink-600">50+</div>
              <div className="text-[3px] text-gray-600">Projects</div>
            </div>
            <div className="bg-white/70 backdrop-blur rounded p-1">
              <div className="font-bold text-[4px] text-blue-600">20+</div>
              <div className="text-[3px] text-gray-600">Awards</div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur rounded p-1 mb-1">
            <div className="font-bold text-[4.5px] text-gray-900 mb-0.5">✨ CREATIVE VISION</div>
            <div className="text-gray-700 text-[3.5px]">Passionate designer blending art and technology to create memorable experiences...</div>
          </div>
          
          <div className="bg-white/80 backdrop-blur rounded p-1 mb-1">
            <div className="font-bold text-[4.5px] text-gray-900 mb-0.5">🎨 EXPERIENCE</div>
            <div className="text-gray-900 font-semibold text-[4px]">Lead Designer</div>
            <div className="text-gray-600 text-[3.5px]">Creative Agency | 2020-Now</div>
          </div>
          
          <div className="bg-white/80 backdrop-blur rounded p-1">
            <div className="font-bold text-[4.5px] text-gray-900 mb-0.5">💡 EXPERTISE</div>
            <div className="flex flex-wrap gap-0.5">
              <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-1 py-0.5 rounded text-[3px]">UI/UX</span>
              <span className="bg-gradient-to-r from-pink-500 to-red-500 text-white px-1 py-0.5 rounded text-[3px]">Branding</span>
              <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-1 py-0.5 rounded text-[3px]">Figma</span>
            </div>
          </div>
        </div>
      )
    },
    technical: {
      name: "Technical",
      description: "Ideal for developers and engineers",
      preview: (
        <div className="aspect-[8.5/11] bg-slate-900 rounded overflow-hidden text-[4px] leading-tight p-2 font-mono">
          <div className="border-l-2 border-green-400 pl-1 mb-1">
            <div className="text-green-400 font-bold text-[6px]">$ whoami</div>
            <div className="text-white text-[5px] mt-0.5">John Doe</div>
            <div className="text-gray-400 text-[3.5px]">Full Stack Developer | DevOps Engineer</div>
          </div>
          
          <div className="border border-gray-700 rounded p-1 mb-1 bg-slate-800/50">
            <div className="text-cyan-400 text-[4px] mb-0.5"># Contact</div>
            <div className="text-gray-300 text-[3.5px] space-y-0.5">
              <div>📧 john.doe@tech.dev</div>
              <div>🔗 github.com/johndoe</div>
              <div>💼 linkedin.com/in/johndoe</div>
            </div>
          </div>
          
          <div className="border border-gray-700 rounded p-1 mb-1 bg-slate-800/50">
            <div className="text-yellow-400 text-[4px] mb-0.5">// Technical Stack</div>
            <div className="text-gray-300 text-[3.5px]">
              <div className="mb-0.5">
                <span className="text-green-400">const</span> languages = <span className="text-orange-400">["JavaScript", "Python", "Go", "Rust"]</span>;
              </div>
              <div className="mb-0.5">
                <span className="text-green-400">const</span> frameworks = <span className="text-orange-400">["React", "Node.js", "Django"]</span>;
              </div>
              <div>
                <span className="text-green-400">const</span> devops = <span className="text-orange-400">["Docker", "K8s", "AWS", "CI/CD"]</span>;
              </div>
            </div>
          </div>
          
          <div className="border border-gray-700 rounded p-1 mb-1 bg-slate-800/50">
            <div className="text-purple-400 text-[4px] mb-0.5">{'> Experience'}</div>
            <div className="text-white text-[3.5px] font-semibold">Senior Software Engineer</div>
            <div className="text-gray-400 text-[3.5px]">Tech Corp | 2020 - Present</div>
            <div className="text-gray-300 text-[3.5px] mt-0.5">
              <div>• Built microservices architecture serving 1M+ users</div>
              <div>• Reduced deployment time by 60% using automation</div>
            </div>
          </div>
          
          <div className="border border-gray-700 rounded p-1 bg-slate-800/50">
            <div className="text-blue-400 text-[4px] mb-0.5">{'>> Certifications'}</div>
            <div className="text-gray-300 text-[3.5px]">
              <div>✓ AWS Solutions Architect Professional</div>
              <div>✓ Kubernetes Administrator (CKA)</div>
            </div>
          </div>
          
          <div className="text-green-400 text-[3.5px] mt-1 flex items-center gap-0.5">
            <span className="animate-pulse">█</span> Ready to connect
          </div>
        </div>
      )
    }
  };

  const templateData = templates[template as keyof typeof templates];

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-lg ${
        selected ? 'ring-2 ring-primary shadow-lg' : 'hover:ring-1 hover:ring-primary/50'
      }`}
      onClick={() => onSelect(template)}
    >
      <div className="p-4">
        {templateData.preview}
        <div className="mt-3 space-y-1">
          <h3 className="font-semibold flex items-center gap-2">
            {templateData.name}
            {selected && <CheckCircle className="h-4 w-4 text-primary" />}
          </h3>
          <p className="text-sm text-muted-foreground">
            {templateData.description}
          </p>
        </div>
      </div>
    </Card>
  );
};
