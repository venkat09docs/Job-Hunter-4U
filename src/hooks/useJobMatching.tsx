import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UserProfile {
  skills: string[];
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
  }>;
  professionalSummary: string;
  personalDetails: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedIn?: string;
    github?: string;
  };
}

interface JobMatchResult {
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
  suggestions: string[];
  strengths: string[];
}

export const useJobMatching = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('resume_data')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          const personalDetails = data.personal_details as any || {};
          const experience = Array.isArray(data.experience) ? (data.experience as unknown as UserProfile['experience']) : [];
          const education = Array.isArray(data.education) ? (data.education as unknown as UserProfile['education']) : [];
          const skillsInterests = data.skills_interests as any || {};

          setUserProfile({
            personalDetails: {
              fullName: personalDetails.fullName || '',
              email: personalDetails.email || '',
              phone: personalDetails.phone || '',
              location: personalDetails.location || '',
              linkedIn: personalDetails.linkedIn || '',
              github: personalDetails.github || ''
            },
            experience: experience,
            education: education,
            skills: Array.isArray(skillsInterests.skills) ? (skillsInterests.skills as string[]) : [],
            professionalSummary: data.professional_summary || ''
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  const calculateJobMatch = (jobTitle: string, jobDescription: string, companyName: string): JobMatchResult => {
    if (!userProfile) {
      return {
        matchPercentage: 0,
        matchedSkills: [],
        missingSkills: [],
        suggestions: ['Complete your profile to see job matching results'],
        strengths: []
      };
    }

    // Extract potential skills from job description
    const commonTechSkills = [
      'javascript', 'python', 'java', 'react', 'node.js', 'sql', 'mongodb', 'aws', 'docker', 'kubernetes',
      'git', 'html', 'css', 'typescript', 'angular', 'vue', 'php', 'c#', 'c++', 'ruby', 'golang',
      'machine learning', 'data science', 'artificial intelligence', 'cloud computing', 'devops',
      'agile', 'scrum', 'project management', 'leadership', 'communication', 'teamwork', 'problem solving',
      'azure', 'gcp', 'jenkins', 'terraform', 'redis', 'postgresql', 'mysql', 'restful apis', 'graphql',
      'microservices', 'linux', 'bash', 'powershell', 'ci/cd', 'testing', 'junit', 'jest', 'cypress'
    ];

    const jobText = (jobTitle + ' ' + jobDescription).toLowerCase();
    const requiredSkills = commonTechSkills.filter(skill => 
      jobText.includes(skill.toLowerCase())
    );

    const userSkills = userProfile.skills.map(skill => skill.toLowerCase());
    const matchedSkills = requiredSkills.filter(skill => 
      userSkills.some(userSkill => 
        userSkill.includes(skill.toLowerCase()) || skill.toLowerCase().includes(userSkill)
      )
    );

    const missingSkills = requiredSkills.filter(skill => 
      !userSkills.some(userSkill => 
        userSkill.includes(skill.toLowerCase()) || skill.toLowerCase().includes(userSkill)
      )
    );

    // Calculate base match percentage
    let matchPercentage = requiredSkills.length > 0 ? 
      Math.round((matchedSkills.length / requiredSkills.length) * 100) : 60;

    // Bonus points for experience relevance
    const experienceBonus = userProfile.experience.some(exp => 
      exp.role.toLowerCase().includes(jobTitle.toLowerCase().split(' ')[0]) ||
      jobTitle.toLowerCase().includes(exp.role.toLowerCase().split(' ')[0])
    ) ? 15 : 0;

    // Bonus for having professional summary
    const summaryBonus = userProfile.professionalSummary.trim() !== '' ? 10 : 0;

    // Bonus for education relevance
    const educationBonus = userProfile.education.some(edu => 
      edu.degree.toLowerCase().includes('computer') ||
      edu.degree.toLowerCase().includes('engineering') ||
      edu.degree.toLowerCase().includes('science')
    ) ? 5 : 0;

    matchPercentage = Math.min(matchPercentage + experienceBonus + summaryBonus + educationBonus, 100);

    // Generate suggestions
    const suggestions = [];
    if (missingSkills.length > 0) {
      suggestions.push(`Learn key skills: ${missingSkills.slice(0, 3).join(', ')}`);
    }
    if (userProfile.professionalSummary.trim() === '') {
      suggestions.push('Add a compelling professional summary');
    }
    if (userProfile.experience.length === 0) {
      suggestions.push('Add relevant work experience');
    }
    if (userProfile.skills.length < 5) {
      suggestions.push('Add more relevant technical skills');
    }
    if (matchPercentage < 80) {
      suggestions.push('Consider gaining experience in the missing skill areas');
      suggestions.push('Highlight transferable skills in your summary');
    }

    // Generate strengths
    const strengths = [];
    if (matchedSkills.length > 0) {
      strengths.push(`Strong match in: ${matchedSkills.slice(0, 3).join(', ')}`);
    }
    if (experienceBonus > 0) {
      strengths.push('Relevant work experience');
    }
    if (userProfile.professionalSummary.trim() !== '') {
      strengths.push('Complete professional summary');
    }
    if (userProfile.education.length > 0) {
      strengths.push('Educational background');
    }

    return {
      matchPercentage,
      matchedSkills,
      missingSkills,
      suggestions: suggestions.length > 0 ? suggestions : ['Great profile! You\'re well-matched for this role.'],
      strengths: strengths.length > 0 ? strengths : ['Complete your profile to see your strengths']
    };
  };

  return {
    userProfile,
    loading,
    calculateJobMatch
  };
};