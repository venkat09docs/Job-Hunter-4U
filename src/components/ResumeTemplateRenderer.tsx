import { ResumeData } from '@/pages/ResumeBuilder';

interface ResumeTemplateRendererProps {
  template: string;
  resumeData: ResumeData;
}

export const ResumeTemplateRenderer = ({ template, resumeData }: ResumeTemplateRendererProps) => {
  const renderClassicTemplate = () => (
    <div className="aspect-[8.5/11] bg-white rounded border border-border overflow-y-auto text-[7px] leading-[1.4] p-4">
      <div className="text-center border-b-2 border-gray-300 pb-2 mb-2">
        <div className="font-bold text-[14px] text-gray-900 tracking-wide">
          {resumeData.personalDetails.fullName || 'YOUR NAME'}
        </div>
        {resumeData.personalDetails.email && (
          <div className="text-gray-600 mt-1 text-[6px]">{resumeData.personalDetails.email}</div>
        )}
        {resumeData.personalDetails.phone && (
          <div className="text-gray-600 text-[6px]">{resumeData.personalDetails.phone}</div>
        )}
        {resumeData.personalDetails.location && (
          <div className="text-gray-600 text-[6px]">{resumeData.personalDetails.location}</div>
        )}
        {resumeData.personalDetails.linkedIn && (
          <div className="text-gray-600 text-[6px]">{resumeData.personalDetails.linkedIn}</div>
        )}
        {resumeData.personalDetails.github && (
          <div className="text-gray-600 text-[6px]">{resumeData.personalDetails.github}</div>
        )}
      </div>

      {resumeData.professionalSummary && (
        <div className="mb-2">
          <div className="font-bold text-[9px] text-gray-900 mb-1 uppercase tracking-wider border-b border-gray-300 pb-1">
            Professional Summary
          </div>
          <div className="text-gray-700 text-justify text-[6.5px]">{resumeData.professionalSummary}</div>
        </div>
      )}

      {resumeData.experience.some(exp => exp.company || exp.role) && (
        <div className="mb-2">
          <div className="font-bold text-[9px] text-gray-900 mb-1 uppercase tracking-wider border-b border-gray-300 pb-1">
            Professional Experience
          </div>
          {resumeData.experience
            .filter(exp => exp.company || exp.role)
            .map((exp, index) => (
              <div key={index} className="mb-1.5">
                <div className="flex justify-between items-baseline">
                  <div className="font-bold text-gray-900 text-[8px]">{exp.role || 'Position'}</div>
                  {exp.duration && <div className="text-gray-600 text-[6px]">{exp.duration}</div>}
                </div>
                {exp.company && <div className="text-gray-700 italic text-[7px]">{exp.company}</div>}
                {exp.description && (
                  <div className="text-gray-700 mt-1 space-y-0.5 text-[6.5px]">
                    {exp.description.split('\n').filter(line => line.trim()).map((line, i) => (
                      <div key={i}>• {line}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      {resumeData.education.some(edu => edu.institution || edu.degree) && (
        <div className="mb-2">
          <div className="font-bold text-[9px] text-gray-900 mb-1 uppercase tracking-wider border-b border-gray-300 pb-1">
            Education
          </div>
          {resumeData.education
            .filter(edu => edu.institution || edu.degree)
            .map((edu, index) => (
              <div key={index} className="mb-1">
                <div className="flex justify-between items-baseline">
                  <div className="font-bold text-gray-900 text-[8px]">{edu.degree || 'Degree'}</div>
                  {edu.duration && <div className="text-gray-600 text-[6px]">{edu.duration}</div>}
                </div>
                {edu.institution && <div className="text-gray-700 text-[7px]">{edu.institution}</div>}
                {edu.gpa && <div className="text-gray-700 text-[6px]">GPA: {edu.gpa}</div>}
              </div>
            ))}
        </div>
      )}

      {resumeData.skills.some(skill => skill.trim()) && (
        <div className="mb-2">
          <div className="font-bold text-[9px] text-gray-900 mb-1 uppercase tracking-wider border-b border-gray-300 pb-1">
            Skills
          </div>
          <div className="text-gray-700 text-[6.5px]">
            {resumeData.skills.filter(skill => skill.trim()).join(' • ')}
          </div>
        </div>
      )}

      {resumeData.certifications.some(cert => cert.trim()) && (
        <div className="mb-2">
          <div className="font-bold text-[9px] text-gray-900 mb-1 uppercase tracking-wider border-b border-gray-300 pb-1">
            Certifications
          </div>
          <div className="text-gray-700 space-y-0.5 text-[6.5px]">
            {resumeData.certifications.filter(cert => cert.trim()).map((cert, index) => (
              <div key={index}>• {cert}</div>
            ))}
          </div>
        </div>
      )}

      {resumeData.awards.some(award => award.trim()) && (
        <div>
          <div className="font-bold text-[9px] text-gray-900 mb-1 uppercase tracking-wider border-b border-gray-300 pb-1">
            Awards
          </div>
          <div className="text-gray-700 space-y-0.5 text-[6.5px]">
            {resumeData.awards.filter(award => award.trim()).map((award, index) => (
              <div key={index}>• {award}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderModernTemplate = () => (
    <div className="aspect-[8.5/11] bg-gradient-to-br from-slate-50 to-white rounded overflow-y-auto text-[7px] leading-[1.4] p-4">
      <div className="flex gap-3">
        <div className="w-1/3 bg-primary/10 p-3 rounded-lg">
          <div className="font-bold text-[12px] mb-2 text-primary">
            {resumeData.personalDetails.fullName || 'YOUR NAME'}
          </div>
          <div className="text-[6.5px] space-y-1 text-gray-700">
            {resumeData.personalDetails.email && (
              <div className="flex items-center gap-0.5">
                <span>📧</span> {resumeData.personalDetails.email}
              </div>
            )}
            {resumeData.personalDetails.phone && (
              <div className="flex items-center gap-0.5">
                <span>📱</span> {resumeData.personalDetails.phone}
              </div>
            )}
            {resumeData.personalDetails.location && (
              <div className="flex items-center gap-0.5">
                <span>📍</span> {resumeData.personalDetails.location}
              </div>
            )}
            {resumeData.personalDetails.linkedIn && (
              <div className="flex items-center gap-0.5">
                <span>💼</span> {resumeData.personalDetails.linkedIn}
              </div>
            )}
            {resumeData.personalDetails.github && (
              <div className="flex items-center gap-0.5">
                <span>🔗</span> {resumeData.personalDetails.github}
              </div>
            )}
          </div>

          {resumeData.skills.some(skill => skill.trim()) && (
            <div className="mt-3 pt-3 border-t border-primary/20">
              <div className="font-bold text-[8px] mb-1.5 text-primary">SKILLS</div>
              <div className="space-y-1 text-[6.5px]">
                {resumeData.skills.filter(skill => skill.trim()).map((skill, index) => (
                  <div key={index} className="bg-primary/5 px-1.5 py-1 rounded">{skill}</div>
                ))}
              </div>
            </div>
          )}

          {resumeData.certifications.some(cert => cert.trim()) && (
            <div className="mt-3 pt-3 border-t border-primary/20">
              <div className="font-bold text-[8px] mb-1.5 text-primary">CERTIFICATIONS</div>
              <div className="space-y-1 text-[6.5px] text-gray-700">
                {resumeData.certifications.filter(cert => cert.trim()).map((cert, index) => (
                  <div key={index}>• {cert}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="w-2/3">
          {resumeData.professionalSummary && (
            <div className="mb-3">
              <div className="font-bold text-[9px] text-primary mb-1 pb-1 border-b-2 border-primary/20">
                SUMMARY
              </div>
              <div className="text-gray-700 text-justify text-[6.5px]">{resumeData.professionalSummary}</div>
            </div>
          )}

          {resumeData.experience.some(exp => exp.company || exp.role) && (
            <div className="mb-3">
              <div className="font-bold text-[9px] text-primary mb-1 pb-1 border-b-2 border-primary/20">
                EXPERIENCE
              </div>
              {resumeData.experience
                .filter(exp => exp.company || exp.role)
                .map((exp, index) => (
                  <div key={index} className="mb-2">
                    <div className="flex justify-between items-start">
                      <div className="font-bold text-gray-900 text-[8px]">{exp.role || 'Position'}</div>
                      {exp.duration && <div className="text-gray-500 text-[6px]">{exp.duration}</div>}
                    </div>
                    {exp.company && <div className="text-gray-600 italic text-[7px]">{exp.company}</div>}
                    {exp.description && (
                      <div className="text-gray-700 mt-1 space-y-0.5 text-[6.5px]">
                        {exp.description.split('\n').filter(line => line.trim()).map((line, i) => (
                          <div key={i}>• {line}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}

          {resumeData.education.some(edu => edu.institution || edu.degree) && (
            <div className="mb-3">
              <div className="font-bold text-[9px] text-primary mb-1 pb-1 border-b-2 border-primary/20">
                EDUCATION
              </div>
              {resumeData.education
                .filter(edu => edu.institution || edu.degree)
                .map((edu, index) => (
                  <div key={index} className="flex justify-between items-start mb-1">
                    <div>
                      <div className="font-bold text-gray-900 text-[8px]">{edu.degree || 'Degree'}</div>
                      {edu.institution && <div className="text-gray-600 text-[7px]">{edu.institution}</div>}
                    </div>
                    {edu.duration && <div className="text-gray-500 text-[6px]">{edu.duration}</div>}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderExecutiveTemplate = () => (
    <div className="aspect-[8.5/11] bg-white rounded border-2 border-gray-800 overflow-y-auto text-[7px] leading-[1.4] p-4">
      <div className="bg-gray-900 text-white p-3 text-center rounded-t">
        <div className="font-bold text-[14px]">{resumeData.personalDetails.fullName || 'YOUR NAME'}</div>
        {resumeData.experience[0]?.role && (
          <div className="text-[8px] mt-1">{resumeData.experience[0].role.toUpperCase()}</div>
        )}
        <div className="text-[6.5px] mt-1 space-y-0.5">
          {resumeData.personalDetails.email && <div>{resumeData.personalDetails.email}</div>}
          {resumeData.personalDetails.phone && <div>{resumeData.personalDetails.phone}</div>}
          {resumeData.personalDetails.linkedIn && <div>{resumeData.personalDetails.linkedIn}</div>}
          {resumeData.personalDetails.github && <div>{resumeData.personalDetails.github}</div>}
        </div>
      </div>

      <div className="p-4">
        {resumeData.professionalSummary && (
          <div className="mb-3 pb-3 border-b-2 border-gray-800">
            <div className="font-bold text-[9px] text-gray-900 mb-1">EXECUTIVE SUMMARY</div>
            <div className="text-gray-700 text-[6.5px]">{resumeData.professionalSummary}</div>
          </div>
        )}

        {resumeData.experience.some(exp => exp.company || exp.role) && (
          <div className="mb-3 pb-3 border-b border-gray-300">
            <div className="font-bold text-[9px] text-gray-900 mb-1.5">LEADERSHIP EXPERIENCE</div>
            {resumeData.experience
              .filter(exp => exp.company || exp.role)
              .map((exp, index) => (
                <div key={index} className="mb-2">
                  <div className="flex justify-between">
                    <div className="font-bold text-gray-900 text-[8px]">{exp.role || 'Position'}</div>
                    {exp.duration && <div className="text-gray-600 text-[6px]">{exp.duration}</div>}
                  </div>
                  {exp.company && <div className="text-gray-700 italic text-[7px]">{exp.company}</div>}
                  {exp.description && (
                    <div className="text-gray-700 mt-1 text-[6.5px]">
                      {exp.description.split('\n').filter(line => line.trim()).map((line, i) => (
                        <div key={i}>• {line}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}

        {resumeData.education.some(edu => edu.institution || edu.degree) && (
          <div className="mb-3 pb-3 border-b border-gray-300">
            <div className="font-bold text-[9px] text-gray-900 mb-1">EDUCATION</div>
            {resumeData.education
              .filter(edu => edu.institution || edu.degree)
              .map((edu, index) => (
                <div key={index} className="mb-1">
                  <div className="text-gray-900 font-semibold text-[7px]">{edu.degree}, {edu.institution}</div>
                </div>
              ))}
          </div>
        )}

        {resumeData.skills.some(skill => skill.trim()) && (
          <div>
            <div className="font-bold text-[9px] text-gray-900 mb-1">COMPETENCIES</div>
            <div className="text-gray-700 text-[6.5px]">
              {resumeData.skills.filter(skill => skill.trim()).join(' • ')}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderATSTemplate = () => (
    <div className="aspect-[8.5/11] bg-white rounded border border-border overflow-y-auto text-[7px] leading-[1.4] p-4">
      <div className="mb-2">
        <div className="font-bold text-[12px] text-gray-900">{resumeData.personalDetails.fullName || 'YOUR NAME'}</div>
        {resumeData.personalDetails.email && (
          <div className="text-gray-700 text-[6.5px]">Email: {resumeData.personalDetails.email}</div>
        )}
        {resumeData.personalDetails.phone && (
          <div className="text-gray-700 text-[6.5px]">Phone: {resumeData.personalDetails.phone}</div>
        )}
        {resumeData.personalDetails.location && (
          <div className="text-gray-700 text-[6.5px]">Location: {resumeData.personalDetails.location}</div>
        )}
        {resumeData.personalDetails.linkedIn && (
          <div className="text-gray-700 text-[6.5px]">LinkedIn: {resumeData.personalDetails.linkedIn}</div>
        )}
        {resumeData.personalDetails.github && (
          <div className="text-gray-700 text-[6.5px]">GitHub: {resumeData.personalDetails.github}</div>
        )}
      </div>

      {resumeData.professionalSummary && (
        <div className="border-t border-gray-300 pt-2 mb-2">
          <div className="font-bold text-[9px] text-gray-900 mb-1">PROFESSIONAL SUMMARY</div>
          <div className="text-gray-700 text-[6.5px]">{resumeData.professionalSummary}</div>
        </div>
      )}

      {resumeData.skills.some(skill => skill.trim()) && (
        <div className="border-t border-gray-300 pt-2 mb-2">
          <div className="font-bold text-[9px] text-gray-900 mb-1">SKILLS</div>
          {resumeData.skills.filter(skill => skill.trim()).map((skill, index) => (
            <div key={index} className="text-gray-700 text-[6.5px]">• {skill}</div>
          ))}
        </div>
      )}

      {resumeData.experience.some(exp => exp.company || exp.role) && (
        <div className="border-t border-gray-300 pt-2 mb-2">
          <div className="font-bold text-[9px] text-gray-900 mb-1">EXPERIENCE</div>
          {resumeData.experience
            .filter(exp => exp.company || exp.role)
            .map((exp, index) => (
              <div key={index} className="mb-1.5">
                <div className="font-semibold text-gray-900 text-[7px]">{exp.role || 'Position'}</div>
                {exp.company && <div className="text-gray-700 text-[6.5px]">{exp.company}</div>}
                {exp.duration && <div className="text-gray-700 text-[6.5px]">{exp.duration}</div>}
                {exp.description && (
                  <div className="text-gray-700 mt-1 text-[6.5px]">
                    {exp.description.split('\n').filter(line => line.trim()).map((line, i) => (
                      <div key={i}>- {line}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      {resumeData.education.some(edu => edu.institution || edu.degree) && (
        <div className="border-t border-gray-300 pt-2">
          <div className="font-bold text-[9px] text-gray-900 mb-1">EDUCATION</div>
          {resumeData.education
            .filter(edu => edu.institution || edu.degree)
            .map((edu, index) => (
              <div key={index} className="mb-1">
                <div className="text-gray-900 text-[7px]">{edu.degree || 'Degree'}</div>
                {edu.institution && <div className="text-gray-700 text-[6.5px]">{edu.institution}</div>}
                {edu.duration && <div className="text-gray-700 text-[6.5px]">{edu.duration}</div>}
              </div>
            ))}
        </div>
      )}
    </div>
  );

  const renderCreativeTemplate = () => (
    <div className="aspect-[8.5/11] bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded overflow-y-auto text-[7px] leading-[1.4] p-4">
      <div className="flex gap-2 mb-2">
        <div className="w-1/4 bg-gradient-to-br from-purple-600 to-pink-600 text-white p-2 rounded-lg">
          <div className="font-bold text-[12px] mb-2">
            {resumeData.personalDetails.fullName?.split(' ').map(n => n[0]).join('') || 'YN'}
          </div>
          <div className="text-[6px] space-y-1 mt-2">
            {resumeData.personalDetails.email && <div>✉️ {resumeData.personalDetails.email}</div>}
            {resumeData.personalDetails.phone && <div>📱 {resumeData.personalDetails.phone}</div>}
            {resumeData.personalDetails.linkedIn && <div>🌐 {resumeData.personalDetails.linkedIn}</div>}
            {resumeData.personalDetails.github && <div>💻 {resumeData.personalDetails.github}</div>}
          </div>
        </div>

        <div className="flex-1">
          <div className="font-bold text-[14px] bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {resumeData.personalDetails.fullName || 'YOUR NAME'}
          </div>
          {resumeData.experience[0]?.role && (
            <div className="text-gray-700 italic text-[8px]">{resumeData.experience[0].role}</div>
          )}
        </div>
      </div>

      {resumeData.professionalSummary && (
        <div className="bg-white/80 backdrop-blur rounded p-2 mb-2">
          <div className="font-bold text-[8px] text-gray-900 mb-1">✨ VISION</div>
          <div className="text-gray-700 text-[6.5px]">{resumeData.professionalSummary}</div>
        </div>
      )}

      {resumeData.experience.some(exp => exp.company || exp.role) && (
        <div className="bg-white/80 backdrop-blur rounded p-2 mb-2">
          <div className="font-bold text-[8px] text-gray-900 mb-1">🎨 EXPERIENCE</div>
          {resumeData.experience
            .filter(exp => exp.company || exp.role)
            .map((exp, index) => (
              <div key={index} className="mb-1">
                <div className="text-gray-900 font-semibold text-[7px]">{exp.role}</div>
                {exp.company && <div className="text-gray-600 text-[6.5px]">{exp.company}</div>}
              </div>
            ))}
        </div>
      )}

      {resumeData.skills.some(skill => skill.trim()) && (
        <div className="bg-white/80 backdrop-blur rounded p-2">
          <div className="font-bold text-[8px] text-gray-900 mb-1">💡 EXPERTISE</div>
          <div className="flex flex-wrap gap-1">
            {resumeData.skills.filter(skill => skill.trim()).map((skill, index) => (
              <span key={index} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded text-[6px]">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderTechnicalTemplate = () => (
    <div className="aspect-[8.5/11] bg-slate-900 rounded overflow-y-auto text-[7px] leading-[1.4] p-4 font-mono">
      <div className="border-l-2 border-green-400 pl-2 mb-3">
        <div className="text-green-400 font-bold text-[12px]">$ whoami</div>
        <div className="text-white text-[9px] mt-1">{resumeData.personalDetails.fullName || 'Your Name'}</div>
        {resumeData.experience[0]?.role && (
          <div className="text-gray-400 text-[6.5px]">{resumeData.experience[0].role}</div>
        )}
      </div>

      <div className="border border-gray-700 rounded p-2 mb-2 bg-slate-800/50">
        <div className="text-cyan-400 text-[8px] mb-1"># Contact</div>
        <div className="text-gray-300 text-[6.5px] space-y-1">
          {resumeData.personalDetails.email && <div>📧 {resumeData.personalDetails.email}</div>}
          {resumeData.personalDetails.github && <div>🔗 {resumeData.personalDetails.github}</div>}
          {resumeData.personalDetails.linkedIn && <div>💼 {resumeData.personalDetails.linkedIn}</div>}
        </div>
      </div>

      {resumeData.skills.some(skill => skill.trim()) && (
        <div className="border border-gray-700 rounded p-2 mb-2 bg-slate-800/50">
          <div className="text-yellow-400 text-[8px] mb-1">// Tech Stack</div>
          <div className="text-gray-300 text-[6.5px]">
            <div>
              <span className="text-green-400">const</span> skills = <span className="text-orange-400">[
                {resumeData.skills.filter(skill => skill.trim()).map(s => `"${s}"`).join(', ')}
              ]</span>
            </div>
          </div>
        </div>
      )}

      {resumeData.experience.some(exp => exp.company || exp.role) && (
        <div className="border border-gray-700 rounded p-2 mb-2 bg-slate-800/50">
          <div className="text-purple-400 text-[8px] mb-1">{'> Experience'}</div>
          {resumeData.experience
            .filter(exp => exp.company || exp.role)
            .map((exp, index) => (
              <div key={index} className="mb-2">
                <div className="text-white text-[6.5px] font-semibold">{exp.role}</div>
                {exp.company && <div className="text-gray-400 text-[6px]">{exp.company} | {exp.duration}</div>}
                {exp.description && (
                  <div className="text-gray-300 text-[6px] mt-1">
                    {exp.description.split('\n').filter(line => line.trim()).slice(0, 2).map((line, i) => (
                      <div key={i}>• {line}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      {resumeData.certifications.some(cert => cert.trim()) && (
        <div className="border border-gray-700 rounded p-2 bg-slate-800/50">
          <div className="text-blue-400 text-[8px] mb-1">{'>> Certs'}</div>
          <div className="text-gray-300 text-[6px]">
            {resumeData.certifications.filter(cert => cert.trim()).map((cert, index) => (
              <div key={index}>✓ {cert}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // For other templates, fall back to showing user data in a simple format
  const renderDefaultTemplate = () => (
    <div className="aspect-[8.5/11] bg-white rounded border border-border overflow-y-auto text-[7px] leading-[1.4] p-4">
      <div className="text-center mb-4">
        <div className="font-bold text-[14px]">{resumeData.personalDetails.fullName || 'YOUR NAME'}</div>
        {resumeData.personalDetails.email && <div className="text-[6.5px]">{resumeData.personalDetails.email}</div>}
        {resumeData.personalDetails.phone && <div className="text-[6.5px]">{resumeData.personalDetails.phone}</div>}
      </div>
      {resumeData.professionalSummary && (
        <div className="mb-3">
          <div className="font-bold text-[9px] mb-1">Professional Summary</div>
          <div className="text-[6.5px]">{resumeData.professionalSummary}</div>
        </div>
      )}
      {/* Add more sections as needed */}
    </div>
  );

  switch (template) {
    case 'classic':
      return renderClassicTemplate();
    case 'modern':
      return renderModernTemplate();
    case 'executive':
      return renderExecutiveTemplate();
    case 'ats':
      return renderATSTemplate();
    case 'creative':
      return renderCreativeTemplate();
    case 'technical':
      return renderTechnicalTemplate();
    default:
      return renderClassicTemplate();
  }
};
