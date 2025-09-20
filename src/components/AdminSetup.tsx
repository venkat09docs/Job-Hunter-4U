import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Loader2 } from 'lucide-react';

const AdminSetup: React.FC = () => {
  const [emails, setEmails] = useState('test@gmail.com, venkat09docs@gmail.com');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSetAdmins = async () => {
    setLoading(true);
    try {
      const emailList = emails.split(',').map(email => email.trim()).filter(email => email);
      
      const response = await fetch('https://moirryvajzyriagqihbe.supabase.co/functions/v1/set-super-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emails: emailList
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const successCount = data.results.filter((r: any) => r.success).length;
        const failCount = data.results.filter((r: any) => !r.success).length;
        
        toast({
          title: 'Admin Setup Complete',
          description: `Successfully set ${successCount} users as admin${failCount > 0 ? `, ${failCount} failed` : ''}`,
        });
        
        // Log detailed results
        console.log('Admin setup results:', data.results);
      } else {
        throw new Error(data.error || 'Failed to set admins');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to set admin roles',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Admin Setup
        </CardTitle>
        <CardDescription>
          Set users as super administrators
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="emails">Email Addresses (comma-separated)</Label>
          <Input
            id="emails"
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            placeholder="user1@example.com, user2@example.com"
          />
        </div>
        
        <Button 
          onClick={handleSetAdmins} 
          disabled={loading || !emails.trim()}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Setting Admins...
            </>
          ) : (
            'Set as Super Admins'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AdminSetup;