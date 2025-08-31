import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AffiliateSystemTesterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AffiliateSystemTester: React.FC<AffiliateSystemTesterProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const [testUserId, setTestUserId] = useState('');
  const [testAmount, setTestAmount] = useState('1499');
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();

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

  const testCurrentUser = async () => {
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
      console.log('🧪 Testing affiliate processing for current user:', user.id);
      
      const { data, error } = await supabase.functions.invoke('process-affiliate', {
        body: {
          user_id: user.id,
          payment_amount: 1499,
          payment_id: 'test_current_user_' + Date.now()
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
        toast({
          title: 'Error',
          description: 'Failed to fetch user metadata',
          variant: 'destructive'
        });
        return;
      }

      console.log('👤 User metadata:', data?.user?.user_metadata);
      toast({
        title: 'Check Console',
        description: 'User metadata logged to console',
      });
    } catch (error: any) {
      console.error('Error checking user metadata:', error);
      toast({
        title: 'Error',
        description: 'Failed to check user metadata',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🧪 Affiliate System Tester</DialogTitle>
          <DialogDescription>
            Test and debug the affiliate referral processing system
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="custom" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="custom">Custom Test</TabsTrigger>
            <TabsTrigger value="current">Current User</TabsTrigger>
          </TabsList>

          <TabsContent value="custom" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Custom User Test</CardTitle>
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
                    Example User ID with affiliate code: cf15aa94-45e8-4713-9f8b-9d8073d8b50b
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="current" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Current User Test</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={testCurrentUser}
                  disabled={testing || !user}
                  className="w-full"
                >
                  {testing ? 'Testing...' : 'Test Current User Affiliate Processing'}
                </Button>
                
                {user && (
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Current User:</strong> {user.email}</p>
                    <p><strong>User ID:</strong> {user.id}</p>
                    {user.user_metadata?.affiliate_code && (
                      <p><strong>Affiliate Code:</strong> {user.user_metadata.affiliate_code}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {results && (
          <>
            <Separator />
            <div>
              <h4 className="font-semibold mb-2">Test Results:</h4>
              <pre className="bg-muted p-3 rounded text-sm overflow-auto max-h-64 whitespace-pre-wrap">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AffiliateSystemTester;