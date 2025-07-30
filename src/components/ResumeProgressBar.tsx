import { Progress } from "@/components/ui/progress";

interface ResumeData {
  personalDetails: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedIn?: string;
    github?: string;
  };
  experience: Array<{
    company: string;
    role: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    duration: string;
    gpa?: string;
  }>;
  skills: string[];
  interests: string[];
  certifications: string[];
  awards: string[];
  professionalSummary: string;
}

interface ResumeProgressBarProps {
  resumeData: ResumeData;
}

export const ResumeProgressBar = ({ resumeData }: ResumeProgressBarProps) => {
  const calculateProgress = () => {
    let totalProgress = 0;
    
    // Personal Details - 15%
    const personalDetailsComplete = !!(
      resumeData.personalDetails.fullName &&
      resumeData.personalDetails.email &&
      resumeData.personalDetails.phone
    );
    if (personalDetailsComplete) totalProgress += 15;
    
    // Professional Summary - 20%
    if (resumeData.professionalSummary.trim()) totalProgress += 20;
    
    // Experience - 10%
    const experienceComplete = resumeData.experience.some(exp => 
      exp.company.trim() && exp.role.trim()
    );
    if (experienceComplete) totalProgress += 10;
    
    // Education Details - 15%
    const educationComplete = resumeData.education.some(edu => 
      edu.institution.trim() && edu.degree.trim()
    );
    if (educationComplete) totalProgress += 15;
    
    // Skills - 10%
    const skillsComplete = resumeData.skills.some(skill => skill.trim());
    if (skillsComplete) totalProgress += 10;
    
    // Interests - 5%
    const interestsComplete = resumeData.interests.some(interest => interest.trim());
    if (interestsComplete) totalProgress += 5;
    
    // Certifications - 15%
    const certificationsComplete = resumeData.certifications.some(cert => cert.trim());
    if (certificationsComplete) totalProgress += 15;
    
    // Awards - 10%
    const awardsComplete = resumeData.awards.some(award => award.trim());
    if (awardsComplete) totalProgress += 10;
    
    return Math.min(totalProgress, 100);
  };

  const getCompletionDetails = () => {
    const progress = calculateProgress();
    const sections = [
      { name: 'Personal Details', weight: 15, complete: !!(resumeData.personalDetails.fullName && resumeData.personalDetails.email && resumeData.personalDetails.phone) },
      { name: 'Professional Summary', weight: 20, complete: !!resumeData.professionalSummary.trim() },
      { name: 'Experience', weight: 10, complete: resumeData.experience.some(exp => exp.company.trim() && exp.role.trim()) },
      { name: 'Education', weight: 15, complete: resumeData.education.some(edu => edu.institution.trim() && edu.degree.trim()) },
      { name: 'Skills', weight: 10, complete: resumeData.skills.some(skill => skill.trim()) },
      { name: 'Interests', weight: 5, complete: resumeData.interests.some(interest => interest.trim()) },
      { name: 'Certifications', weight: 15, complete: resumeData.certifications.some(cert => cert.trim()) },
      { name: 'Awards', weight: 10, complete: resumeData.awards.some(award => award.trim()) }
    ];
    
    return { progress, sections };
  };

  const { progress, sections } = getCompletionDetails();

  return (
    <div className="space-y-4 p-4 bg-card border rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Resume Completion</h3>
        <span className="text-2xl font-bold text-primary">{progress}%</span>
      </div>
      
      <Progress value={progress} className="h-3" />
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        {sections.map((section) => (
          <div key={section.name} className={`flex items-center gap-1 ${section.complete ? 'text-green-600' : 'text-muted-foreground'}`}>
            <div className={`w-2 h-2 rounded-full ${section.complete ? 'bg-green-500' : 'bg-muted'}`} />
            {section.name} ({section.weight}%)
          </div>
        ))}
      </div>
    </div>
  );
};

// Export the calculation function for use in Dashboard
export const calculateResumeProgress = (resumeData: ResumeData): number => {
  let totalProgress = 0;
  
  // Personal Details - 15%
  const personalDetailsComplete = !!(
    resumeData.personalDetails.fullName &&
    resumeData.personalDetails.email &&
    resumeData.personalDetails.phone
  );
  if (personalDetailsComplete) totalProgress += 15;
  
  // Professional Summary - 20%
  if (resumeData.professionalSummary.trim()) totalProgress += 20;
  
  // Experience - 10%
  const experienceComplete = resumeData.experience.some(exp => 
    exp.company.trim() && exp.role.trim()
  );
  if (experienceComplete) totalProgress += 10;
  
  // Education Details - 15%
  const educationComplete = resumeData.education.some(edu => 
    edu.institution.trim() && edu.degree.trim()
  );
  if (educationComplete) totalProgress += 15;
  
  // Skills - 10%
  const skillsComplete = resumeData.skills.some(skill => skill.trim());
  if (skillsComplete) totalProgress += 10;
  
  // Interests - 5%
  const interestsComplete = resumeData.interests.some(interest => interest.trim());
  if (interestsComplete) totalProgress += 5;
  
  // Certifications - 15%
  const certificationsComplete = resumeData.certifications.some(cert => cert.trim());
  if (certificationsComplete) totalProgress += 15;
  
  // Awards - 10%
  const awardsComplete = resumeData.awards.some(award => award.trim());
  if (awardsComplete) totalProgress += 10;
  
  return Math.min(totalProgress, 100);
};