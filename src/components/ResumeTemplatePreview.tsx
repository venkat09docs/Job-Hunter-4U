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
        <div className="aspect-[8.5/11] bg-white rounded border border-border overflow-y-auto text-[7px] leading-[1.4] p-4">
          <div className="text-center border-b-2 border-gray-300 pb-2 mb-2">
            <div className="font-bold text-[14px] text-gray-900 tracking-wide">JOHN ALEXANDER DOE</div>
            <div className="text-gray-600 mt-1 text-[7px]">Senior Software Engineer</div>
            <div className="text-gray-600 mt-1 text-[6px]">john.doe@email.com | (555) 123-4567 | New York, NY</div>
          </div>
          
          <div className="mb-2">
            <div className="font-bold text-[9px] text-gray-900 mb-1 uppercase tracking-wider border-b border-gray-300 pb-1">Professional Summary</div>
            <div className="text-gray-700 text-justify text-[6.5px]">Results-driven Senior Software Engineer with 8+ years of experience in full-stack development, system architecture, and team leadership.</div>
          </div>
          
          <div className="mb-2">
            <div className="font-bold text-[9px] text-gray-900 mb-1 uppercase tracking-wider border-b border-gray-300 pb-1">Professional Experience</div>
            
            <div className="mb-1.5">
              <div className="flex justify-between items-baseline">
                <div className="font-bold text-gray-900 text-[8px]">Senior Software Engineer</div>
                <div className="text-gray-600 text-[6px]">Jan 2020 - Present</div>
              </div>
              <div className="text-gray-700 italic text-[7px]">Tech Innovations Corp, New York, NY</div>
              <div className="text-gray-700 mt-1 space-y-0.5 text-[6.5px]">
                <div>• Led development of microservices architecture serving 2M+ users</div>
                <div>• Managed team of 7 engineers with code reviews</div>
                <div>• Reduced application load time by 60%</div>
              </div>
            </div>
          </div>
          
          <div className="mb-2">
            <div className="font-bold text-[9px] text-gray-900 mb-1 uppercase tracking-wider border-b border-gray-300 pb-1">Education</div>
            <div className="flex justify-between items-baseline">
              <div className="font-bold text-gray-900 text-[8px]">BS Computer Science</div>
              <div className="text-gray-600 text-[6px]">2012 - 2016</div>
            </div>
            <div className="text-gray-700 text-[7px]">Stanford University</div>
            <div className="text-gray-700 text-[6px]">GPA: 3.8/4.0</div>
          </div>
          
          <div className="mb-2">
            <div className="font-bold text-[9px] text-gray-900 mb-1 uppercase tracking-wider border-b border-gray-300 pb-1">Skills</div>
            <div className="text-gray-700 text-[6.5px]">
              <div><span className="font-semibold">Languages:</span> JavaScript, TypeScript, Python</div>
              <div><span className="font-semibold">Frontend:</span> React, Next.js, Vue.js</div>
              <div><span className="font-semibold">Backend:</span> Node.js, Express, GraphQL</div>
            </div>
          </div>
          
          <div>
            <div className="font-bold text-[9px] text-gray-900 mb-1 uppercase tracking-wider border-b border-gray-300 pb-1">Certifications</div>
            <div className="text-gray-700 space-y-0.5 text-[6.5px]">
              <div>• AWS Solutions Architect (2022)</div>
              <div>• Scrum Master I (2021)</div>
            </div>
          </div>
        </div>
      )
    },
    modern: {
      name: "Modern Minimal",
      description: "Clean design for tech and creative industries",
      preview: (
        <div className="aspect-[8.5/11] bg-gradient-to-br from-slate-50 to-white rounded overflow-y-auto text-[7px] leading-[1.4] p-4">
          <div className="flex gap-3">
            <div className="w-1/3 bg-primary/10 p-3 rounded-lg">
              <div className="font-bold text-[12px] mb-2 text-primary">JOHN DOE</div>
              <div className="text-[6.5px] space-y-1 text-gray-700">
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
              
              <div className="mt-3 pt-3 border-t border-primary/20">
                <div className="font-bold text-[8px] mb-1.5 text-primary">SKILLS</div>
                <div className="space-y-1.5 text-[6.5px]">
                  <div>
                    <div className="font-semibold text-gray-900">Languages</div>
                    <div className="bg-primary/5 px-1.5 py-1 rounded mt-0.5">JS, TypeScript, Python</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Frontend</div>
                    <div className="bg-primary/5 px-1.5 py-1 rounded mt-0.5">React, Next.js</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Cloud</div>
                    <div className="bg-primary/5 px-1.5 py-1 rounded mt-0.5">AWS, Docker</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-primary/20">
                <div className="font-bold text-[8px] mb-1.5 text-primary">CERTS</div>
                <div className="space-y-1 text-[6.5px] text-gray-700">
                  <div>• AWS Solutions Architect</div>
                  <div>• Scrum Master</div>
                </div>
              </div>
            </div>
            
            <div className="w-2/3">
              <div className="mb-3">
                <div className="font-bold text-[9px] text-primary mb-1 pb-1 border-b-2 border-primary/20">SUMMARY</div>
                <div className="text-gray-700 text-justify text-[6.5px]">Full-Stack Engineer with 7+ years building scalable web applications. Expert in JavaScript and cloud architectures.</div>
              </div>
              
              <div className="mb-3">
                <div className="font-bold text-[9px] text-primary mb-1 pb-1 border-b-2 border-primary/20">EXPERIENCE</div>
                
                <div className="mb-2">
                  <div className="flex justify-between items-start">
                    <div className="font-bold text-gray-900 text-[8px]">Senior Software Engineer</div>
                    <div className="text-gray-500 text-[6px]">2020 - Present</div>
                  </div>
                  <div className="text-gray-600 italic text-[7px]">Tech Innovations Inc.</div>
                  <div className="text-gray-700 mt-1 space-y-0.5 text-[6.5px]">
                    <div>• Built microservices serving 1.5M users</div>
                    <div>• Led team of 6 engineers</div>
                    <div>• Improved performance by 55%</div>
                  </div>
                </div>
              </div>
              
              <div className="mb-3">
                <div className="font-bold text-[9px] text-primary mb-1 pb-1 border-b-2 border-primary/20">EDUCATION</div>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-gray-900 text-[8px]">BS Computer Science</div>
                    <div className="text-gray-600 text-[7px]">UC Berkeley</div>
                  </div>
                  <div className="text-gray-500 text-[6px]">2016</div>
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
        <div className="aspect-[8.5/11] bg-white rounded border-2 border-gray-800 overflow-y-auto text-[7px] leading-[1.4] p-4">
          <div className="bg-gray-900 text-white p-3 text-center rounded-t">
            <div className="font-bold text-[14px]">JOHN DOE</div>
            <div className="text-[8px] mt-1">CHIEF TECHNOLOGY OFFICER</div>
            <div className="text-[6.5px] mt-1">john.doe@email.com | (555) 123-4567</div>
          </div>
          
          <div className="p-4">
            <div className="mb-3 pb-3 border-b-2 border-gray-800">
              <div className="font-bold text-[9px] text-gray-900 mb-1">EXECUTIVE SUMMARY</div>
              <div className="text-gray-700 text-[6.5px]">Strategic technology leader with 15+ years driving digital transformation and innovation.</div>
            </div>
            
            <div className="mb-3 pb-3 border-b border-gray-300">
              <div className="font-bold text-[9px] text-gray-900 mb-1.5">LEADERSHIP EXPERIENCE</div>
              <div className="mb-2">
                <div className="flex justify-between">
                  <div className="font-bold text-gray-900 text-[8px]">CTO</div>
                  <div className="text-gray-600 text-[6px]">2018 - Present</div>
                </div>
                <div className="text-gray-700 italic text-[7px]">Fortune 500 Company</div>
                <div className="text-gray-700 mt-1 text-[6.5px]">• Oversaw $50M budget</div>
                <div className="text-gray-700 text-[6.5px]">• Led 100+ engineers</div>
              </div>
            </div>
            
            <div className="mb-3 pb-3 border-b border-gray-300">
              <div className="font-bold text-[9px] text-gray-900 mb-1">EDUCATION</div>
              <div className="text-gray-900 font-semibold text-[7px]">MBA, Harvard</div>
              <div className="text-gray-700 text-[6.5px]">MS CS, Stanford</div>
            </div>
            
            <div>
              <div className="font-bold text-[9px] text-gray-900 mb-1">COMPETENCIES</div>
              <div className="text-gray-700 text-[6.5px]">Strategy • Transformation • Leadership</div>
            </div>
          </div>
        </div>
      )
    },
    ats: {
      name: "ATS-Optimized",
      description: "Designed to pass applicant tracking systems",
      preview: (
        <div className="aspect-[8.5/11] bg-white rounded border border-border overflow-y-auto text-[7px] leading-[1.4] p-4">
          <div className="mb-2">
            <div className="font-bold text-[12px] text-gray-900">JOHN DOE</div>
            <div className="text-gray-700 text-[6.5px]">Email: john.doe@email.com</div>
            <div className="text-gray-700 text-[6.5px]">Phone: (555) 123-4567</div>
            <div className="text-gray-700 text-[6.5px]">Location: New York, NY</div>
          </div>
          
          <div className="border-t border-gray-300 pt-2 mb-2">
            <div className="font-bold text-[9px] text-gray-900 mb-1">PROFESSIONAL SUMMARY</div>
            <div className="text-gray-700 text-[6.5px]">Software Engineer with 5 years experience in full-stack development. Proficient in JavaScript, React, Node.js, and cloud technologies.</div>
          </div>
          
          <div className="border-t border-gray-300 pt-2 mb-2">
            <div className="font-bold text-[9px] text-gray-900 mb-1">SKILLS</div>
            <div className="text-gray-700 text-[6.5px]">Languages: JavaScript, Python, TypeScript</div>
            <div className="text-gray-700 text-[6.5px]">Frameworks: React, Node.js, Express</div>
            <div className="text-gray-700 text-[6.5px]">Tools: Git, Docker, AWS</div>
          </div>
          
          <div className="border-t border-gray-300 pt-2 mb-2">
            <div className="font-bold text-[9px] text-gray-900 mb-1">EXPERIENCE</div>
            <div className="mb-1.5">
              <div className="font-semibold text-gray-900 text-[7px]">Senior Engineer</div>
              <div className="text-gray-700 text-[6.5px]">Tech Corp | 2020 - Present</div>
              <div className="text-gray-700 mt-1 text-[6.5px]">- Built web apps with React</div>
              <div className="text-gray-700 text-[6.5px]">- Improved performance 40%</div>
            </div>
          </div>
          
          <div className="border-t border-gray-300 pt-2">
            <div className="font-bold text-[9px] text-gray-900 mb-1">EDUCATION</div>
            <div className="text-gray-900 text-[7px]">BS Computer Science</div>
            <div className="text-gray-700 text-[6.5px]">University Name, 2016</div>
          </div>
        </div>
      )
    },
    creative: {
      name: "Creative",
      description: "Stand out in design and creative fields",
      preview: (
        <div className="aspect-[8.5/11] bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded overflow-y-auto text-[7px] leading-[1.4] p-4">
          <div className="flex gap-2 mb-2">
            <div className="w-1/4 bg-gradient-to-br from-purple-600 to-pink-600 text-white p-2 rounded-lg">
              <div className="font-bold text-[12px] mb-2">JD</div>
              <div className="text-[6px] space-y-1 mt-2">
                <div>✉️ john@creative.com</div>
                <div>📱 555-1234</div>
                <div>🌐 portfolio.com</div>
              </div>
            </div>
            
            <div className="flex-1">
              <div className="font-bold text-[14px] bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">JOHN DOE</div>
              <div className="text-gray-700 italic text-[8px]">Creative Designer</div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-white/70 backdrop-blur rounded p-2">
              <div className="font-bold text-[8px] text-purple-600">5+</div>
              <div className="text-[6px] text-gray-600">Years</div>
            </div>
            <div className="bg-white/70 backdrop-blur rounded p-2">
              <div className="font-bold text-[8px] text-pink-600">50+</div>
              <div className="text-[6px] text-gray-600">Projects</div>
            </div>
            <div className="bg-white/70 backdrop-blur rounded p-2">
              <div className="font-bold text-[8px] text-blue-600">20+</div>
              <div className="text-[6px] text-gray-600">Awards</div>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur rounded p-2 mb-2">
            <div className="font-bold text-[8px] text-gray-900 mb-1">✨ VISION</div>
            <div className="text-gray-700 text-[6.5px]">Designer blending art and technology to create memorable experiences.</div>
          </div>
          
          <div className="bg-white/80 backdrop-blur rounded p-2 mb-2">
            <div className="font-bold text-[8px] text-gray-900 mb-1">🎨 EXPERIENCE</div>
            <div className="text-gray-900 font-semibold text-[7px]">Lead Designer</div>
            <div className="text-gray-600 text-[6.5px]">Creative Agency | 2020-Now</div>
          </div>
          
          <div className="bg-white/80 backdrop-blur rounded p-2">
            <div className="font-bold text-[8px] text-gray-900 mb-1">💡 EXPERTISE</div>
            <div className="flex flex-wrap gap-1">
              <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded text-[6px]">UI/UX</span>
              <span className="bg-gradient-to-r from-pink-500 to-red-500 text-white px-2 py-1 rounded text-[6px]">Branding</span>
            </div>
          </div>
        </div>
      )
    },
    technical: {
      name: "Technical",
      description: "Ideal for developers and engineers",
      preview: (
        <div className="aspect-[8.5/11] bg-slate-900 rounded overflow-y-auto text-[7px] leading-[1.4] p-4 font-mono">
          <div className="border-l-2 border-green-400 pl-2 mb-3">
            <div className="text-green-400 font-bold text-[12px]">$ whoami</div>
            <div className="text-white text-[9px] mt-1">John Doe</div>
            <div className="text-gray-400 text-[6.5px]">Full Stack Developer</div>
          </div>
          
          <div className="border border-gray-700 rounded p-2 mb-2 bg-slate-800/50">
            <div className="text-cyan-400 text-[8px] mb-1"># Contact</div>
            <div className="text-gray-300 text-[6.5px] space-y-1">
              <div>📧 john@tech.dev</div>
              <div>🔗 github.com/johndoe</div>
            </div>
          </div>
          
          <div className="border border-gray-700 rounded p-2 mb-2 bg-slate-800/50">
            <div className="text-yellow-400 text-[8px] mb-1">// Stack</div>
            <div className="text-gray-300 text-[6.5px]">
              <div className="mb-1">
                <span className="text-green-400">const</span> lang = <span className="text-orange-400">["JS", "Python"]</span>
              </div>
              <div>
                <span className="text-green-400">const</span> tools = <span className="text-orange-400">["React", "Node"]</span>
              </div>
            </div>
          </div>
          
          <div className="border border-gray-700 rounded p-2 mb-2 bg-slate-800/50">
            <div className="text-purple-400 text-[8px] mb-1">{'> Experience'}</div>
            <div className="text-white text-[6.5px] font-semibold">Senior Engineer</div>
            <div className="text-gray-400 text-[6px]">Tech Corp | 2020 - Now</div>
            <div className="text-gray-300 text-[6px] mt-1">
              <div>• Microservices for 1M+ users</div>
            </div>
          </div>
          
          <div className="border border-gray-700 rounded p-2 bg-slate-800/50">
            <div className="text-blue-400 text-[8px] mb-1">{'>> Certs'}</div>
            <div className="text-gray-300 text-[6px]">
              <div>✓ AWS Architect</div>
              <div>✓ Kubernetes Admin</div>
            </div>
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
