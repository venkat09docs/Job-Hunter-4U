import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calculator, CheckCircle } from 'lucide-react';

export const RecalculateGitHubCommits = () => {
  const [username, setUsername] = useState('venkateshwarlu2508');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleRecalculate = async () => {
    if (!username.trim()) {
      toast({
        title: "Error",
        description: "Please enter a username",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      console.log(`🔍 Calling recalculate function for user: ${username}`);
      
      const { data, error } = await supabase.functions.invoke('recalculate-github-commits', {
        body: { username: username.trim() }
      });

      if (error) {
        console.error('Function error:', error);
        throw error;
      }

      console.log('✅ Recalculation result:', data);
      setResult(data);
      
      toast({
        title: "Success!",
        description: `GitHub commits recalculated for ${username}`,
      });

    } catch (error: any) {
      console.error('Error recalculating commits:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to recalculate commits",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Recalculate GitHub Commits
        </CardTitle>
        <CardDescription>
          Recalculate total GitHub commits for a user based on their approved evidence submissions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username (display_name)"
          />
        </div>

        <Button 
          onClick={handleRecalculate}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Recalculating...
            </>
          ) : (
            <>
              <Calculator className="h-4 w-4 mr-2" />
              Recalculate Commits
            </>
          )}
        </Button>

        {result && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>✅ {result.message}</strong></p>
                <div className="text-sm space-y-1">
                  <p>• Username: {result.username}</p>
                  <p>• User ID: {result.userId}</p>
                  <p>• Verified Tasks: {result.verifiedTasks}</p>
                  <p>• Processed Evidence: {result.processedEvidence}</p>
                  <p>• <strong>Total Commits: {result.totalCommits}</strong></p>
                  <p>• README Updates: {result.totalReadmeUpdates}</p>
                  <p>• Period: {result.currentPeriod}</p>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};