// Shared daily activities configuration for LinkedIn Network Growth
// This ensures consistency between the input page and report page

export interface DailyActivity {
  id: string;
  title: string;
  description: string;
  category: 'engagement' | 'networking' | 'content' | 'growth';
  dailyTarget: number;
  weeklyTarget: number;
  unit: string;
}

export const DAILY_ACTIVITIES: DailyActivity[] = [
  // Engagement Activities
  { id: 'post_likes', title: 'Like Posts', description: 'Like relevant posts in your industry', category: 'engagement', dailyTarget: 3, weeklyTarget: 15, unit: 'likes' },
  { id: 'comments', title: 'Comments', description: 'Leave thoughtful comments on posts', category: 'engagement', dailyTarget: 2, weeklyTarget: 10, unit: 'comments' },
  { id: 'content', title: 'Share Content', description: 'Share valuable content with your network', category: 'engagement', dailyTarget: 2, weeklyTarget: 10, unit: 'shares' },
  
  // Networking Activities
  { id: 'connection_requests', title: 'Connection Requests', description: 'Send personalized connection requests', category: 'networking', dailyTarget: 2, weeklyTarget: 10, unit: 'requests' },
  { id: 'follow_up', title: 'Follow Up Messages', description: 'Send follow-up messages to recent connections', category: 'networking', dailyTarget: 1, weeklyTarget: 5, unit: 'messages' },
  { id: 'connections_accepted', title: 'Connections Accepted', description: 'Track the number of connection requests accepted by others', category: 'networking', dailyTarget: 0, weeklyTarget: 10, unit: 'connections' },
  
  // Growth Activities
  { id: 'profile_views', title: 'Profile Views', description: 'Track the number of profile views received', category: 'growth', dailyTarget: 5, weeklyTarget: 30, unit: 'views' },
  
  // Content Activities
  { id: 'create_post', title: 'Create Original Post', description: 'Share an original post about your expertise', category: 'content', dailyTarget: 1, weeklyTarget: 5, unit: 'posts' },
  
  // Growth Activities
  { id: 'profile_optimization', title: 'Profile Optimization', description: 'Review and update profile sections', category: 'growth', dailyTarget: 0, weeklyTarget: 1, unit: 'sessions' },
  { id: 'industry_research', title: 'Industry Research', description: 'Research and follow industry leaders', category: 'growth', dailyTarget: 1, weeklyTarget: 5, unit: 'profiles' },
];

// Database field mapping for activities that have different names in the database
export const DATABASE_FIELD_MAPPING: Record<string, string> = {
  'follow_up': 'follow_up',
  'industry_research': 'industry_research',
  'connections_accepted': 'connections_accepted',
  'profile_views': 'profile_views',
  // Add any other mappings as needed
};