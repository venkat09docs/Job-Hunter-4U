import { JobApplicationTaskId } from "@/hooks/useJobApplicationActivities";

export const JOB_APP_TASKS: { id: JobApplicationTaskId; title: string; description: string }[] = [
  { id: 'review_new_postings', title: 'Review New Job Postings', description: 'Check 5–10 fresh job listings filtered by keywords, skills, location, and salary.' },
  { id: 'save_potential_opportunities', title: 'Save Potential Opportunities', description: 'Mark jobs for Immediate Apply or Follow-Up Later for easy tracking.' },
  { id: 'ats_resume_optimization', title: 'ATS Resume Optimization', description: 'Tailor resume for each job using suggestions to pass ATS filters.' },
  { id: 'ai_generated_cover_letter', title: 'AI-Generated Cover Letter', description: 'Create a personalized cover letter for each application from templates.' },
  { id: 'apply_quality_jobs', title: 'Apply to Quality Jobs', description: 'Submit 2–3 high-match applications daily for better success rates.' },
  { id: 'verify_application_completeness', title: 'Verify Application Completeness', description: 'Ensure resume, cover letter, portfolio links, and references are included before sending.' },
  { id: 'log_applications_in_tracker', title: 'Log Applications in Tracker', description: 'Record each application’s status (Applied, Interview, Rejected, Offer).' },
  { id: 'send_follow_up_message', title: 'Send Follow-Up Message', description: 'Reach out to recruiters 3–5 days after applying.' },
  { id: 'research_target_company', title: 'Research Target Company', description: 'Review company culture, news, and hiring patterns before applying.' },
];

export interface DailyActivityDef {
  id: string;
  title: string;
  description: string;
  category: 'engagement' | 'networking' | 'content' | 'growth';
  dailyTarget: number;
  weeklyTarget: number;
  unit: string;
}

export const LINKEDIN_DAILY_ACTIVITIES: DailyActivityDef[] = [
  { id: 'post_likes', title: 'Like Posts', description: 'Like relevant posts in your industry', category: 'engagement', dailyTarget: 3, weeklyTarget: 15, unit: 'likes' },
  { id: 'comments', title: 'Comments', description: 'Leave thoughtful comments on posts', category: 'engagement', dailyTarget: 2, weeklyTarget: 10, unit: 'comments' },
  { id: 'content', title: 'Content', description: 'Share valuable content with your network', category: 'engagement', dailyTarget: 2, weeklyTarget: 10, unit: 'shares' },
  { id: 'connection_requests', title: 'Connection', description: 'Send personalized connection requests', category: 'networking', dailyTarget: 2, weeklyTarget: 10, unit: 'requests' },
  { id: 'follow_up', title: 'Follow Up Messages', description: 'Send follow-up messages to recent connections', category: 'networking', dailyTarget: 1, weeklyTarget: 5, unit: 'messages' },
  { id: 'industry_groups', title: 'Engage in Groups', description: 'Participate in industry group discussions', category: 'networking', dailyTarget: 1, weeklyTarget: 5, unit: 'discussions' },
  { id: 'create_post', title: 'Create Original Post', description: 'Share an original post about your expertise', category: 'content', dailyTarget: 1, weeklyTarget: 5, unit: 'posts' },
  { id: 'article_draft', title: 'Work on Article', description: 'Draft or publish LinkedIn article content', category: 'content', dailyTarget: 1, weeklyTarget: 5, unit: 'sessions' },
  { id: 'profile_optimization', title: 'Profile Optimization', description: 'Review and update profile sections', category: 'growth', dailyTarget: 0, weeklyTarget: 1, unit: 'sessions' },
  { id: 'industry_research', title: 'Industry Research', description: 'Research and follow industry leaders', category: 'growth', dailyTarget: 1, weeklyTarget: 5, unit: 'profiles' },
];
