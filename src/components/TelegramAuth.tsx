import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Send } from 'lucide-react';

interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

declare global {
  interface Window {
    Telegram?: {
      Login: {
        auth: (options: {
          bot_id: string;
          request_access?: boolean;
          embed?: number;
        }, callback: (user: TelegramUser | false) => void) => void;
      };
    };
    onTelegramAuth?: (user: TelegramUser) => void;
  }
}

const TelegramAuth = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isLinked, setIsLinked] = useState(false);

  useEffect(() => {
    // Load Telegram Widget script
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    document.head.appendChild(script);

    // Check if user already has Telegram linked
    checkTelegramLink();

    return () => {
      document.head.removeChild(script);
    };
  }, [user]);

  const checkTelegramLink = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('telegram_chat_id')
      .eq('user_id', user.id)
      .single();

    setIsLinked(!!data?.telegram_chat_id);
  };

  const handleTelegramAuth = async (telegramUser: TelegramUser) => {
    if (!user) {
      toast.error('Please log in first');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('update-telegram-chat-id', {
        body: {
          telegramData: telegramUser,
          userId: user.id
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Telegram account linked successfully!');
        setIsLinked(true);
      }
    } catch (error) {
      console.error('Error linking Telegram:', error);
      toast.error('Failed to link Telegram account');
    } finally {
      setLoading(false);
    }
  };

  const initiateTelegramLogin = () => {
    if (!window.Telegram?.Login) {
      toast.error('Telegram widget not loaded');
      return;
    }

    // You need to replace this with your actual Telegram bot ID
    // Get it from @BotFather on Telegram
    const botId = 'YOUR_BOT_ID'; // TODO: Replace with actual bot ID

    window.Telegram.Login.auth(
      { 
        bot_id: botId, 
        request_access: true,
        embed: 1
      },
      (user) => {
        if (user) {
          handleTelegramAuth(user);
        } else {
          toast.error('Telegram authentication cancelled');
        }
      }
    );
  };

  if (!user) {
    return null;
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Send className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Telegram Notifications</h3>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Link your Telegram account to receive instant notifications about assignments, deadlines, and updates.
        </p>

        {isLinked ? (
          <div className="p-4 bg-success/10 rounded-lg border border-success/20">
            <p className="text-sm text-success font-medium">
              ✓ Telegram account linked successfully
            </p>
          </div>
        ) : (
          <Button
            onClick={initiateTelegramLogin}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Linking...' : 'Link Telegram Account'}
          </Button>
        )}

        <p className="text-xs text-muted-foreground">
          Note: You'll need to start a chat with the bot first before receiving notifications.
        </p>
      </div>
    </Card>
  );
};

export default TelegramAuth;
