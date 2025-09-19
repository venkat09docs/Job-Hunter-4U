import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MessageCircle, FileText, BookOpen, Target } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

export default function InterviewPreparation() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, hasActiveSubscription } = useProfile();

  const boards = [
    {
      id: 'interview-coach',
      title: 'Interview Coach',
      description: 'AI-powered interview practice with real-time feedback',
      icon: MessageCircle,
      route: '/dashboard/crack-interview',
      color: 'bg-gradient-to-br from-blue-500 to-blue-600'
    },
    {
      id: 'interview-questions',
      title: 'Question Bank',
      description: 'Browse common interview questions by category',
      icon: FileText,
      route: '#',
      color: 'bg-gradient-to-br from-green-500 to-green-600'
    },
    {
      id: 'study-materials',
      title: 'Study Materials',
      description: 'Access interview preparation resources and guides',
      icon: BookOpen,
      route: '#',
      color: 'bg-gradient-to-br from-purple-500 to-purple-600'
    },
    {
      id: 'mock-interviews',
      title: 'Mock Interviews',
      description: 'Schedule and take practice interviews',
      icon: Target,
      route: '#',
      color: 'bg-gradient-to-br from-orange-500 to-orange-600'
    }
  ];

  const handleBoardClick = (route: string) => {
    if (route !== '#') {
      navigate(route);
    }
  };

  const getInitials = () => {
    if (profile?.username) {
      return profile.username.substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getSubscriptionStatus = () => {
    if (hasActiveSubscription() && profile?.subscription_plan) {
      return {
        plan: profile.subscription_plan,
        status: 'Active',
        variant: 'default' as const
      };
    }
    return {
      plan: 'Free Plan',
      status: 'Free',
      variant: 'secondary' as const
    };
  };

  const subscriptionInfo = getSubscriptionStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Top Header Menu */}
      <div className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Go to Dashboard */}
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Go to Dashboard
            </Button>

            {/* Right side - User Profile and Plan */}
            <div className="flex items-center gap-4">
              {/* Current Plan Badge */}
              <div className="flex flex-col items-end">
                <Badge variant={subscriptionInfo.variant} className="mb-1">
                  {subscriptionInfo.plan}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Status: {subscriptionInfo.status}
                </span>
              </div>

              {/* User Profile */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">
                    {profile?.full_name || user?.email || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    @{profile?.username || 'user'}
                  </p>
                </div>
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={profile?.profile_image_url || ''}
                    alt={profile?.username || 'User'}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Interview Preparation
          </h1>
          <p className="text-muted-foreground text-lg">
            Prepare for your next interview with our comprehensive tools and resources
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {boards.map((board) => {
            const IconComponent = board.icon;
            return (
              <Card 
                key={board.id}
                className="group hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                onClick={() => handleBoardClick(board.route)}
              >
                <CardHeader className="pb-3">
                  <div className={`w-12 h-12 rounded-lg ${board.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors">
                    {board.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground mb-4">
                    {board.description}
                  </CardDescription>
                  <Button 
                    variant="outline" 
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBoardClick(board.route);
                    }}
                  >
                    {board.route === '#' ? 'Coming Soon' : 'Start'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}