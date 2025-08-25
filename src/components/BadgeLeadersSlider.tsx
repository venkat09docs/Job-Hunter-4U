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

  console.log('🎭 BadgeLeadersSlider: badgeLeaders data:', badgeLeaders);
  console.log('🎭 BadgeLeadersSlider: loading state:', loading);

  const categories: BadgeCategory[] = [
    {
      id: 'profileBuild',
      title: 'Profile Build Champions',
      icon: <Trophy className="h-4 w-4" />,
      leaders: badgeLeaders.profileBuild
    },
    {
      id: 'jobsApply',
      title: 'Job Application Masters',
      icon: <Briefcase className="h-4 w-4" />,
      leaders: badgeLeaders.jobsApply
    },
    {
      id: 'linkedinGrowth',
      title: 'LinkedIn Network Stars',
      icon: <Users className="h-4 w-4" />,
      leaders: badgeLeaders.linkedinGrowth
    },
    {
      id: 'githubRepository',
      title: 'GitHub Repository Experts',
      icon: <Github className="h-4 w-4" />,
      leaders: badgeLeaders.githubRepository
    }
  ];

  console.log('🎭 BadgeLeadersSlider: categories created:', categories.map(c => ({ 
    id: c.id, 
    title: c.title, 
    leadersCount: c.leaders.length 
  })));

  // Auto-scroll functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % categories.length);
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [categories.length]);

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
      default: return 'hsl(var(--muted))';
    }
  };

  const renderLeaderCard = (leader: any, index: number) => (
    <div key={leader.user_id} className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
        <span className="text-sm font-bold text-primary">#{index + 1}</span>
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
          className="text-xs"
          style={{ backgroundColor: getBadgeColor(leader.badge_type) + '20', color: getBadgeColor(leader.badge_type) }}
        >
          {leader.badge_type}
        </Badge>
        <span className="text-xs text-muted-foreground">{leader.total_points}pts</span>
      </div>
    </div>
  );

  const renderSlideContent = (category: BadgeCategory) => (
    <div className="space-y-3">
      {loading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border">
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
        category.leaders.map(renderLeaderCard)
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
    <Card className="overflow-hidden">
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