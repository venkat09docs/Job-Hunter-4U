import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TestAffiliateButton = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const testAffiliateProcessing = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to test affiliate processing',
        variant: 'destructive'
      });
      return;
    }

    setTesting(true);
    setResults(null);

    try {
      console.log('🧪 Testing affiliate processing for user:', user.id);
      
      // Call the process-affiliate edge function
      const { data, error } = await supabase.functions.invoke('process-affiliate', {
        body: {
          user_id: user.id,
          payment_amount: 1499, // Test with $14.99
          payment_id: 'test_' + Date.now()
        }
      });

      console.log('📊 Affiliate processing result:', { data, error });
      
      if (error) {
        throw error;
      }

      setResults(data);
      
      toast({
        title: 'Test Completed',
        description: 'Check the results below and console logs',
      });

    } catch (error: any) {
      console.error('💥 Affiliate test error:', error);
      toast({
        title: 'Test Error',
        description: error.message || 'Failed to test affiliate processing',
        variant: 'destructive'
      });
      setResults({ error: error.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>🧪 Test Affiliate Processing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testAffiliateProcessing}
          disabled={testing || !user}
          className="w-full"
        >
          {testing ? 'Testing...' : 'Test Affiliate System'}
        </Button>
        
        {results && (
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Test Results:</h4>
            <pre className="bg-muted p-3 rounded text-sm overflow-auto">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
        
        {user && (
          <div className="text-sm text-muted-foreground">
            <p><strong>Current User:</strong> {user.email}</p>
            <p><strong>User ID:</strong> {user.id}</p>
            {user.user_metadata?.affiliate_code && (
              <p><strong>Affiliate Code:</strong> {user.user_metadata.affiliate_code}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TestAffiliateButton;