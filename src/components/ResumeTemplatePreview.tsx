import { Card } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

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
        <div className="aspect-[8.5/11] bg-white rounded border border-border overflow-hidden text-[4px] leading-tight p-2">
          <div className="text-center border-b border-gray-300 pb-1 mb-1">
            <div className="font-bold text-[6px] text-gray-900">JOHN DOE</div>
            <div className="text-gray-600 mt-0.5">john.doe@email.com | (555) 123-4567 | New York, NY</div>
          </div>
          
          <div className="mb-1">
            <div className="font-bold text-[5px] text-gray-900 mb-0.5 uppercase">Professional Summary</div>
            <div className="text-gray-700">Experienced professional with 5+ years in software development and team leadership...</div>
          </div>
          
          <div className="mb-1">
            <div className="font-bold text-[5px] text-gray-900 mb-0.5 uppercase">Experience</div>
            <div className="mb-0.5">
              <div className="font-semibold text-gray-900">Senior Developer</div>
              <div className="text-gray-600">Tech Corp | 2020 - Present</div>
              <div className="text-gray-700 mt-0.5">• Led team of 5 developers</div>
              <div className="text-gray-700">• Increased efficiency by 40%</div>
            </div>
          </div>
          
          <div className="mb-1">
            <div className="font-bold text-[5px] text-gray-900 mb-0.5 uppercase">Education</div>
            <div className="font-semibold text-gray-900">BS Computer Science</div>
            <div className="text-gray-600">University Name | 2016</div>
          </div>
          
          <div>
            <div className="font-bold text-[5px] text-gray-900 mb-0.5 uppercase">Skills</div>
            <div className="text-gray-700">JavaScript • React • Node.js • Python • AWS</div>
          </div>
        </div>
      )
    },
    modern: {
      name: "Modern Minimal",
      description: "Clean design for tech and creative industries",
      preview: (
        <div className="aspect-[8.5/11] bg-gradient-to-br from-slate-50 to-white rounded overflow-hidden text-[4px] leading-tight p-2">
          <div className="flex gap-2 mb-1">
            <div className="w-1/3 bg-primary/10 p-1 rounded">
              <div className="font-bold text-[6px] mb-1">JOHN DOE</div>
              <div className="text-[3.5px] space-y-0.5">
                <div>📧 john@email.com</div>
                <div>📱 555-123-4567</div>
                <div>📍 New York, NY</div>
              </div>
              
              <div className="mt-1 pt-1 border-t border-primary/20">
                <div className="font-bold text-[4px] mb-0.5">SKILLS</div>
                <div className="space-y-0.5 text-[3.5px]">
                  <div className="bg-primary/5 px-0.5 py-0.5 rounded">React.js</div>
                  <div className="bg-primary/5 px-0.5 py-0.5 rounded">Node.js</div>
                  <div className="bg-primary/5 px-0.5 py-0.5 rounded">TypeScript</div>
                </div>
              </div>
            </div>
            
            <div className="w-2/3">
              <div className="mb-1">
                <div className="font-bold text-[5px] text-primary mb-0.5">ABOUT</div>
                <div className="text-gray-700">Innovative developer passionate about creating elegant solutions...</div>
              </div>
              
              <div className="mb-1">
                <div className="font-bold text-[5px] text-primary mb-0.5">EXPERIENCE</div>
                <div className="mb-0.5">
                  <div className="flex justify-between items-start">
                    <div className="font-semibold text-gray-900">Senior Developer</div>
                    <div className="text-gray-500 text-[3.5px]">2020-Present</div>
                  </div>
                  <div className="text-gray-600">Tech Corp</div>
                  <div className="text-gray-700 mt-0.5">Led development of key features</div>
                </div>
              </div>
              
              <div>
                <div className="font-bold text-[5px] text-primary mb-0.5">EDUCATION</div>
                <div className="font-semibold text-gray-900">BS Computer Science</div>
                <div className="text-gray-600">University Name</div>
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
