import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Trophy, Briefcase, Users, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useBadgeLeaders } from '@/hooks/useBadgeLeaders';

interface BadgeCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  leaders: any[];
}

export const BadgeLeadersSlider = () => {
  const { badgeLeaders, loading } = useBadgeLeaders();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const categories: BadgeCategory[] = [
    {
      id: 'profileBuild',
      title: 'Profile Build Champions',
      icon: <Trophy className="h-4 w-4 text-blue-600" />,
      leaders: badgeLeaders.profileBuild
    },
    {
      id: 'jobsApply',
      title: 'Job Application Masters',
      icon: <Briefcase className="h-4 w-4 text-green-600" />,
      leaders: badgeLeaders.jobsApply
    },
    {
      id: 'linkedinGrowth',
      title: 'LinkedIn Network Stars',
      icon: <Users className="h-4 w-4 text-purple-600" />,
      leaders: badgeLeaders.linkedinGrowth
    },
    {
      id: 'githubRepository',
      title: 'GitHub Repository Experts',
      icon: <Github className="h-4 w-4 text-orange-600" />,
      leaders: badgeLeaders.githubRepository
    }
  ];

  // Auto-scroll functionality with hover pause
  useEffect(() => {
    if (isHovered) return; // Don't auto-scroll when hovered
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % categories.length);
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [categories.length, isHovered]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % categories.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + categories.length) % categories.length);
  };

  const getBadgeColor = (badgeType: string) => {
    switch (badgeType) {
      case 'Diamond': return 'hsl(var(--chart-diamond))';
      case 'Gold': return 'hsl(var(--chart-gold))';
      case 'Silver': return 'hsl(var(--chart-silver))';
      case 'Bronze': return 'hsl(var(--chart-bronze))';
      default: return 'hsl(var(--muted))';
    }
  };

  // Get category-specific styling
  const getCategoryTheme = (categoryId: string) => {
    switch (categoryId) {
      case 'profileBuild':
        return {
          gradient: 'from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          rankBg: 'bg-blue-100 dark:bg-blue-900/30',
          rankText: 'text-blue-700 dark:text-blue-300'
        };
      case 'jobsApply':
        return {
          gradient: 'from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20',
          border: 'border-green-200 dark:border-green-800',
          rankBg: 'bg-green-100 dark:bg-green-900/30',
          rankText: 'text-green-700 dark:text-green-300'
        };
      case 'linkedinGrowth':
        return {
          gradient: 'from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20',
          border: 'border-purple-200 dark:border-purple-800',
          rankBg: 'bg-purple-100 dark:bg-purple-900/30',
          rankText: 'text-purple-700 dark:text-purple-300'
        };
      case 'githubRepository':
        return {
          gradient: 'from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20',
          border: 'border-orange-200 dark:border-orange-800',
          rankBg: 'bg-orange-100 dark:bg-orange-900/30',
          rankText: 'text-orange-700 dark:text-orange-300'
        };
      default:
        return {
          gradient: 'from-gray-50 to-gray-100 dark:from-gray-950/20 dark:to-gray-900/20',
          border: 'border-gray-200 dark:border-gray-800',
          rankBg: 'bg-gray-100 dark:bg-gray-900/30',
          rankText: 'text-gray-700 dark:text-gray-300'
        };
    }
  };

  const renderLeaderCard = (leader: any, index: number, categoryId: string) => {
    const theme = getCategoryTheme(categoryId);
    return (
      <div key={leader.user_id} className={`flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r ${theme.gradient} ${theme.border} border animate-fade-in`}>
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${theme.rankBg}`}>
          <span className={`text-sm font-bold ${theme.rankText}`}>#{index + 1}</span>
        </div>
        <Avatar className="h-10 w-10">
          <AvatarImage src={leader.profile_image_url} alt={leader.full_name} />
          <AvatarFallback className="text-sm">
            {leader.full_name?.charAt(0) || leader.username?.charAt(0) || '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{leader.full_name || leader.username}</p>
          <p className="text-xs text-muted-foreground">@{leader.username}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant="secondary" 
            className="text-xs animate-scale-in"
            style={{ backgroundColor: getBadgeColor(leader.badge_type) + '20', color: getBadgeColor(leader.badge_type) }}
          >
            {leader.badge_type}
          </Badge>
          <span className="text-xs text-muted-foreground font-medium">{leader.total_points}pts</span>
        </div>
      </div>
    );
  };

  const renderSlideContent = (category: BadgeCategory) => (
    <div className="space-y-3">
      {loading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border animate-pulse">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-2 w-16" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-12 rounded" />
              <Skeleton className="h-3 w-8" />
            </div>
          </div>
        ))
      ) : category.leaders.length > 0 ? (
        category.leaders.map((leader, index) => renderLeaderCard(leader, index, category.id))
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No badge earners yet</p>
          <p className="text-xs">Be the first to earn a badge!</p>
        </div>
      )}
    </div>
  );

  return (
    <Card 
      className="overflow-hidden transition-all duration-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            {categories[currentSlide].icon}
            {categories[currentSlide].title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevSlide}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex gap-1">
              {categories.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    index === currentSlide ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={nextSlide}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="relative overflow-hidden">
          {/* Subtle hover indicator - more transparent */}
          {isHovered && (
            <div className="absolute top-2 right-2 z-10 bg-background/20 backdrop-blur-sm rounded-full px-2 py-1 border border-primary/10">
              <span className="text-xs text-primary/70 font-medium">⏸</span>
            </div>
          )}
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {categories.map((category, index) => (
              <div key={category.id} className="w-full flex-shrink-0">
                {renderSlideContent(category)}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};