import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useLinkedInProgress } from '@/hooks/useLinkedInProgress';
import { useNetworkGrowthMetrics } from '@/hooks/useNetworkGrowthMetrics';
import { useJobApplicationActivities } from '@/hooks/useJobApplicationActivities';
import { useUserIndustry } from '@/hooks/useUserIndustry';
import { useProfileBadges } from '@/hooks/useProfileBadges';
import { User, Briefcase, Users, Github, Target, Trophy, Crown, Medal } from 'lucide-react';

interface BadgeData {
  id: string;
  title: string;
  description: string;
  tier: 'bronze' | 'silver' | 'gold';
  progress: number;
  criteria: string;
  nextAction: string;
  link: string;
}

interface BadgeCategory {
  id: string;
  title: string;
  icon: React.ElementType;
  badges: BadgeData[];
}

interface BadgeProgressionMapProps {
  resumeProgress?: number;
  completedProfileTasks?: number;
  linkedinProgress?: number;
  githubProgress?: number;
  jobApplicationsCount?: number;
  networkConnections?: number;
  profileViews?: number;
  githubCommits?: number;
  githubRepos?: number;
}

const BadgeProgressionMap: React.FC<BadgeProgressionMapProps> = ({
  resumeProgress = 0,
  completedProfileTasks = 0,
  linkedinProgress = 0,
  githubProgress = 0,
  jobApplicationsCount = 0,
  networkConnections = 0,
  profileViews = 0,
  githubCommits = 0,
  githubRepos = 0,
}) => {
  const navigate = useNavigate();
  const { isIT } = useUserIndustry();
  const { checkAndAwardBadges } = useProfileBadges();

  // Badge unlock logic - progressive unlocking system
  const isBadgeUnlocked = (categoryId: string, tier: string, badgeIndex: number) => {
    switch (categoryId) {
      case 'profile':
        // Profile Build (Bronze) - Always unlocked (default)
        if (tier === 'bronze') return true;
        // Profile Complete (Silver) - Unlocked only when bronze reaches 100%
        if (tier === 'silver') return calculateProfileProgress('bronze') >= 100;
        // Profile Perfectionist (Gold) - Unlocked only when silver reaches 100%
        if (tier === 'gold') return calculateProfileProgress('silver') >= 100;
        return false;
      
      case 'jobs':
        // First badge always unlocked, others unlock progressively
        if (badgeIndex === 0) return true;
        if (badgeIndex === 1) return jobApplicationsCount >= 1;
        if (badgeIndex === 2) return jobApplicationsCount >= 14;
        return false;
      
      case 'network':
        // First badge always unlocked, others unlock progressively  
        if (badgeIndex === 0) return true;
        if (badgeIndex === 1) return networkConnections >= 25;
        if (badgeIndex === 2) return networkConnections >= 50;
        return false;
      
      case 'github':
        // First badge always unlocked, others unlock progressively
        if (badgeIndex === 0) return true;
        if (badgeIndex === 1) return githubRepos >= 1 && githubCommits >= 5;
        if (badgeIndex === 2) return githubCommits >= 30;
        return false;
      
      default:
        return false;
    }
  };

  // Calculate progress for each badge - progressive system
  const calculateProfileProgress = (tier: string) => {
    switch (tier) {
      case 'bronze': 
        // Bronze: 0-100% based on resume progress
        return Math.min(100, resumeProgress);
      case 'silver': 
        // Silver: Only progresses after bronze is 100%
        if (resumeProgress < 100) return 0;
        // Silver needs additional profile completion beyond basic resume
        return Math.min(100, completedProfileTasks >= 9 ? 100 : (completedProfileTasks / 9) * 100);
      case 'gold': 
        // Gold: Only progresses after silver is 100%
        if (resumeProgress < 100 || completedProfileTasks < 9) return 0;
        // Gold requires all profile tasks plus high quality completion
        return Math.min(100, resumeProgress >= 100 && completedProfileTasks >= 9 ? 100 : 0);
      default: return 0;
    }
  };

  const calculateJobsProgress = (tier: string) => {
    switch (tier) {
      case 'bronze': return Math.min(100, jobApplicationsCount >= 1 ? 100 : 0);
      case 'silver': return Math.min(100, jobApplicationsCount >= 14 ? 100 : (jobApplicationsCount / 14) * 100);
      case 'gold': return Math.min(100, jobApplicationsCount >= 30 ? 100 : (jobApplicationsCount / 30) * 100);
      default: return 0;
    }
  };

  const calculateNetworkProgress = (tier: string) => {
    switch (tier) {
      case 'bronze': return Math.min(100, networkConnections >= 25 ? 100 : (networkConnections / 25) * 100);
      case 'silver': return Math.min(100, networkConnections >= 50 ? 100 : (networkConnections / 50) * 100);
      case 'gold': return Math.min(100, networkConnections >= 100 && profileViews >= 1000 ? 100 : Math.min((networkConnections / 100) * 50 + (profileViews / 1000) * 50, 100));
      default: return 0;
    }
  };

  const calculateGithubProgress = (tier: string) => {
    switch (tier) {
      case 'bronze': return Math.min(100, githubRepos >= 1 && githubCommits >= 5 ? 100 : Math.min((githubRepos / 1) * 50 + (githubCommits / 5) * 50, 100));
      case 'silver': return Math.min(100, githubCommits >= 30 ? 100 : (githubCommits / 30) * 100);
      case 'gold': return Math.min(100, githubProgress >= 80 ? 100 : (githubProgress / 80) * 100);
      default: return 0;
    }
  };

  const allCategories: BadgeCategory[] = [
    {
      id: 'profile',
      title: 'Profile Build',
      icon: User,
      badges: [
        {
          id: 'profile-bronze',
          title: 'Profile Rookie',
          description: 'Build Your Resume',
          tier: 'bronze',
          progress: calculateProfileProgress('bronze'),
          criteria: 'Create your first profile',
          nextAction: 'Build Profile',
          link: '/dashboard/career-assignments'
        },
        {
          id: 'profile-silver',
          title: 'Profile Complete',
          description: 'Add experience, summary, certifications',
          tier: 'silver',
          progress: calculateProfileProgress('silver'),
          criteria: 'Complete 50% of profile sections',
          nextAction: 'Complete Profile',
          link: '/dashboard/career-assignments'
        },
        {
          id: 'profile-gold',
          title: 'Profile Perfectionist',
          description: 'Fully optimized profile with portfolio links',
          tier: 'gold',
          progress: calculateProfileProgress('gold'),
          criteria: 'Achieve 80%+ profile completion',
          nextAction: 'Perfect Profile',
          link: '/dashboard/career-assignments'
        }
      ]
    },
    {
      id: 'jobs',
      title: 'Jobs Apply',
      icon: Briefcase,
      badges: [
        {
          id: 'jobs-bronze',
          title: 'First Step',
          description: 'Apply to your first job',
          tier: 'bronze',
          progress: calculateJobsProgress('bronze'),
          criteria: 'Apply to 1 job',
          nextAction: 'Apply Now',
          link: '/dashboard/job-hunting-assignments'
        },
        {
          id: 'jobs-silver',
          title: 'Consistency Champ',
          description: 'Apply to 2 jobs/day for 7 days',
          tier: 'silver',
          progress: calculateJobsProgress('silver'),
          criteria: 'Apply to 14 jobs total',
          nextAction: 'Keep Applying',
          link: '/dashboard/job-hunting-assignments'
        },
        {
          id: 'jobs-gold',
          title: 'Interview Magnet',
          description: 'Apply to 30+ high-match jobs',
          tier: 'gold',
          progress: calculateJobsProgress('gold'),
          criteria: 'Apply to 30+ jobs',
          nextAction: 'Scale Applications',
          link: '/dashboard/job-hunting-assignments'
        }
      ]
    },
    {
      id: 'network',
      title: 'LinkedIn Network Growth',
      icon: Users,
      badges: [
        {
          id: 'network-bronze',
          title: 'Connector',
          description: 'Build your network foundation',
          tier: 'bronze',
          progress: calculateNetworkProgress('bronze'),
          criteria: '25 new connections',
          nextAction: 'Connect More',
          link: '/career-activities'
        },
        {
          id: 'network-silver',
          title: 'Networker',
          description: 'Active network engagement',
          tier: 'silver',
          progress: calculateNetworkProgress('silver'),
          criteria: '50 connections + 5 posts/week',
          nextAction: 'Engage More',
          link: '/career-activities'
        },
        {
          id: 'network-gold',
          title: 'Influencer in the Making',
          description: 'Established network presence',
          tier: 'gold',
          progress: calculateNetworkProgress('gold'),
          criteria: '100 connections + 1,000 profile views',
          nextAction: 'Build Influence',
          link: '/career-activities'
        }
      ]
    },
    // Only show GitHub category for IT users
    ...(isIT() ? [{
      id: 'github',
      title: 'GitHub Repository',
      icon: Github,
      badges: [
        {
          id: 'github-bronze',
          title: 'Commit Cadet',
          description: 'Start your coding journey',
          tier: 'bronze' as const,
          progress: calculateGithubProgress('bronze'),
          criteria: 'First repo + 5 commits',
          nextAction: 'Start Coding',
          link: '/github-weekly'
        },
        {
          id: 'github-silver',
          title: 'Project Maintainer',
          description: 'Maintain quality repositories',
          tier: 'silver' as const,
          progress: calculateGithubProgress('silver'),
          criteria: 'Repo with README + 30 commits',
          nextAction: 'Improve Projects',
          link: '/github-weekly'
        },
        {
          id: 'github-gold',
          title: 'Open Source Ally',
          description: 'Contribute to the community',
          tier: 'gold' as const,
          progress: calculateGithubProgress('gold'),
          criteria: 'Contribute to public projects',
          nextAction: 'Go Open Source',
          link: '/github-weekly'
        }
      ]
    }] : [])
  ];

  // Filter categories based on user industry
  const categories = allCategories;

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return '#CD7F32';
      case 'silver': return '#C0C0C0';
      case 'gold': return '#FFD700';
      default: return '#6C8BFF';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'bronze': return Medal;
      case 'silver': return Trophy;
      case 'gold': return Crown;
      default: return Target;
    }
  };

  const getTierGradient = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'from-orange-500/10 to-amber-600/10';
      case 'silver': return 'from-gray-400/10 to-gray-500/10';
      case 'gold': return 'from-yellow-400/10 to-yellow-500/10';
      default: return 'from-primary/10 to-primary/20';
    }
  };

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center justify-center gap-2">
          🎯 Your Badge Progression Map
        </h2>
        <p className="text-muted-foreground">
          Track your progress and unlock achievements across key career areas
        </p>
      </div>

      {/* Badge Categories */}
      <div className="space-y-6">
        {categories.map((category) => {
          const CategoryIcon = category.icon;
          
          return (
            <Card key={category.id} className="shadow-elegant border-primary/20 overflow-hidden">
              <CardContent className="p-6">
                {/* Category Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <CategoryIcon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{category.title}</h3>
                </div>

                {/* Badge Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {category.badges.map((badge, badgeIndex) => {
                    const TierIcon = getTierIcon(badge.tier);
                    const tierColor = getTierColor(badge.tier);
                    const isUnlocked = isBadgeUnlocked(category.id, badge.tier, badgeIndex);
                    
                    return (
                      <Card 
                        key={badge.id}
                        className={`relative overflow-hidden transition-all duration-300 ${
                          isUnlocked 
                            ? 'hover:shadow-lg hover:-translate-y-1 cursor-pointer' 
                            : 'cursor-not-allowed opacity-50'
                        } bg-gradient-to-br ${getTierGradient(badge.tier)} border-2`}
                        style={{ 
                          borderColor: isUnlocked ? `${tierColor}20` : '#E5E5E5',
                          filter: isUnlocked ? 'none' : 'grayscale(50%)'
                        }}
                        onClick={() => isUnlocked && navigate(badge.link)}
                      >
                        <CardContent className="p-4 space-y-4">
                          {/* Badge Header with Lock Indicator */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {isUnlocked ? (
                                <TierIcon 
                                  className="h-5 w-5" 
                                  style={{ color: isUnlocked ? tierColor : '#9CA3AF' }}
                                />
                              ) : (
                                <div className="h-5 w-5 flex items-center justify-center">
                                  🔒
                                </div>
                              )}
                              <Badge 
                                variant="outline" 
                                className="text-xs capitalize"
                                style={{ 
                                  borderColor: isUnlocked ? tierColor : '#E5E5E5', 
                                  color: isUnlocked ? tierColor : '#9CA3AF' 
                                }}
                              >
                                {isUnlocked ? badge.tier : 'Locked'}
                              </Badge>
                            </div>
                            <div 
                              className="text-sm font-medium" 
                              style={{ color: isUnlocked ? tierColor : '#9CA3AF' }}
                            >
                              {isUnlocked ? Math.round(badge.progress) : 0}%
                            </div>
                          </div>

                          {/* Badge Title & Description */}
                          <div className="space-y-1">
                            <h4 className={`font-semibold text-sm ${!isUnlocked ? 'text-muted-foreground' : ''}`}>
                              {badge.title}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {isUnlocked ? badge.description : 'Complete previous badge to unlock'}
                            </p>
                          </div>

                          {/* Progress Ring */}
                          <div className="space-y-2">
                            <Progress 
                              value={isUnlocked ? badge.progress : 0} 
                              className="h-2"
                              style={{
                                '--progress-background': isUnlocked ? tierColor : '#E5E5E5',
                              } as React.CSSProperties}
                            />
                            <p className="text-xs text-muted-foreground">
                              {isUnlocked ? badge.criteria : 'Unlock requirements not met'}
                            </p>
                          </div>

                          {/* Next Action Button */}
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className={`w-full text-xs transition-transform ${
                              isUnlocked ? 'hover:scale-105' : 'cursor-not-allowed'
                            }`}
                            style={{ 
                              borderColor: isUnlocked ? `${tierColor}40` : '#E5E5E5',
                              color: isUnlocked ? tierColor : '#9CA3AF'
                            }}
                            disabled={!isUnlocked}
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (isUnlocked) {
                                // Check for badge awards when navigating to profile tasks
                                if (category.id === 'profile') {
                                  await checkAndAwardBadges();
                                }
                                navigate(badge.link);
                              }
                            }}
                          >
                            {isUnlocked ? badge.nextAction : 'Locked'}
                          </Button>
                        </CardContent>

                        {/* Tier Glow Effect */}
                        <div 
                          className="absolute inset-0 opacity-5 pointer-events-none"
                          style={{
                            background: `radial-gradient(circle at 50% 50%, ${tierColor} 0%, transparent 70%)`
                          }}
                        />
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default BadgeProgressionMap;