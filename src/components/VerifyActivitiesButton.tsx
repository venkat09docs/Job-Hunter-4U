import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Trophy, Users, Award } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';

export const VerifyActivitiesButton = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    processedCount: number;
    pointsAwarded: number;
  } | null>(null);
  const { user } = useAuth();
  const { role, isAdmin } = useRole();

  const handleVerifyActivities = async () => {
    if (!user || role !== 'admin') {
      toast.error('Super admin privileges required');
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('https://moirryvajzyriagqihbe.supabase.co/functions/v1/verify-user-activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to verify activities');
      }

      const result = await response.json();
      
      if (result.success) {
        setVerificationResult({
          processedCount: result.processedCount,
          pointsAwarded: result.pointsAwarded
        });
        toast.success(`Successfully verified activities for ${result.processedCount} users and awarded ${result.pointsAwarded} point entries!`);
        
        // Refresh the page to update leaderboard
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error verifying activities:', error);
      toast.error('Failed to verify user activities. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (role !== 'admin') {
    return null;
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Activity Verification System
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Verify all users' current progress and award points based on their activity completion status.
            This will check Resume, LinkedIn, and GitHub profile completion for all users.
          </p>
          
          <Button 
            onClick={handleVerifyActivities}
            disabled={isVerifying}
            className="w-full"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Verifying Activities...
              </>
            ) : (
              <>
                <Award className="h-4 w-4 mr-2" />
                Verify & Award Points
              </>
            )}
          </Button>

          {verificationResult && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4" />
                <span>Users Processed: <strong>{verificationResult.processedCount}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Trophy className="h-4 w-4" />
                <span>Points Awarded: <strong>{verificationResult.pointsAwarded}</strong></span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};