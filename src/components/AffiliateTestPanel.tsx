import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const AffiliateTestPanel = () => {
  const [testUserId, setTestUserId] = useState('');
  const [testAmount, setTestAmount] = useState('1499');
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const runAffiliateTest = async () => {
    if (!testUserId || !testAmount) {
      toast({
        title: 'Missing Data',
        description: 'Please provide both user ID and amount',
        variant: 'destructive'
      });
      return;
    }

    setTesting(true);
    setResults(null);

    try {
      console.log('🧪 Testing affiliate processing:', { testUserId, testAmount });
      
      // Call the process-affiliate edge function
      const { data, error } = await supabase.functions.invoke('process-affiliate', {
        body: {
          user_id: testUserId,
          payment_amount: parseFloat(testAmount),
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

  const checkUserMetadata = async () => {
    if (!testUserId) {
      toast({
        title: 'Missing User ID',
        description: 'Please provide a user ID to check',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { data, error } = await supabase.auth.admin.getUserById(testUserId);
      
      if (error) {
        console.error('Error fetching user:', error);
        return;
      }

      console.log('👤 User metadata:', data?.user?.user_metadata);
      toast({
        title: 'Check Console',
        description: 'User metadata logged to console',
      });
    } catch (error: any) {
      console.error('Error checking user metadata:', error);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>🧪 Affiliate System Tester</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="user-id">Test User ID</Label>
          <Input
            id="user-id"
            value={testUserId}
            onChange={(e) => setTestUserId(e.target.value)}
            placeholder="Enter user ID (who was referred)"
          />
          <p className="text-xs text-muted-foreground">
            User with affiliate code: cf15aa94-45e8-4713-9f8b-9d8073d8b50b
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="amount">Payment Amount (₹)</Label>
          <Input
            id="amount"
            value={testAmount}
            onChange={(e) => setTestAmount(e.target.value)}
            placeholder="1499"
            type="number"
          />
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={runAffiliateTest}
            disabled={testing}
            className="flex-1"
          >
            {testing ? 'Testing...' : 'Test Affiliate Processing'}
          </Button>
          <Button 
            variant="outline"
            onClick={checkUserMetadata}
            disabled={!testUserId}
          >
            Check User Metadata
          </Button>
        </div>
        
        {results && (
          <>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2">Test Results:</h4>
              <pre className="bg-muted p-3 rounded text-sm overflow-auto max-h-64">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AffiliateTestPanel;