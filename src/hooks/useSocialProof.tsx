import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SocialProofEvent {
  id: string;
  event_type: string;
  display_text: string;
  location: string;
  user_first_name: string;
  created_at: string;
  event_data: any;
  user_id?: string;
}

interface JobEventData {
  job_title?: string;
  company?: string;
}

interface ProfileData {
  username?: string;
  full_name?: string;
  location?: string;
}

interface SocialProofConfig {
  id: string;
  show_on_landing_page: boolean;
  show_after_signin: boolean;
  display_duration: number;
  rotation_interval: number;
  max_events_shown: number;
  enabled_event_types: string[];
  position: string;
  is_active: boolean;
}

export const useSocialProof = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<SocialProofEvent[]>([]);
  const [config, setConfig] = useState<SocialProofConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);

  // Fetch social proof configuration
  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('social_proof_config')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      setConfig(data);
    } catch (error) {
      console.error('Error fetching social proof config:', error);
    }
  };

  // Fetch recent social proof events with current user profile data
  const fetchEvents = async () => {
    try {
      if (!config) return;

      // First fetch events
      const { data: eventsData, error: eventsError } = await supabase
        .from('social_proof_events')
        .select('*')
        .eq('is_active', true)
        .in('event_type', config.enabled_event_types)
        .gt('expires_at', 'now()')
        .order('created_at', { ascending: false })
        .limit(config.max_events_shown || 10);

      if (eventsError) throw eventsError;
      
      if (!eventsData || eventsData.length === 0) {
        setEvents([]);
        return;
      }

      // Get unique user IDs from events
      const userIds = [...new Set(eventsData.map(event => event.user_id).filter(Boolean))];
      
      let profilesMap: Record<string, ProfileData> = {};
      
      if (userIds.length > 0) {
        // Fetch current profile data for those users
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, username, full_name, location')
          .in('user_id', userIds);

        if (!profilesError && profilesData) {
          profilesMap = profilesData.reduce((acc, profile) => {
            acc[profile.user_id] = {
              username: profile.username,
              full_name: profile.full_name,
              location: profile.location
            };
            return acc;
          }, {} as Record<string, ProfileData>);
        }
      }
      
      // Map events to use current profile data instead of stored data
      const eventsWithCurrentData = eventsData.map(event => {
        const profile = event.user_id ? profilesMap[event.user_id] : null;
        let displayText = event.display_text;
        
        // Update display text with current profile data if profile exists
        if (profile) {
          const currentName = profile.username || profile.full_name || 'Someone';
          const currentLocation = profile.location || event.location || 'somewhere';
          
          // Reconstruct display text with current data
          switch (event.event_type) {
            case 'premium_upgrade':
              displayText = `${currentName} from ${currentLocation} just upgraded to premium!`;
              break;
            case 'job_application':
              displayText = `${currentName} from ${currentLocation} just applied to a job!`;
              break;
            case 'resume_completion':
              displayText = `${currentName} from ${currentLocation} just completed their resume!`;
              break;
            case 'linkedin_optimization':
              displayText = `${currentName} from ${currentLocation} just optimized their LinkedIn profile!`;
              break;
            case 'github_setup':
              displayText = `${currentName} from ${currentLocation} just set up their GitHub profile!`;
              break;
            default:
              displayText = `${currentName} from ${currentLocation} just completed an activity!`;
          }
        }
        
        return {
          ...event,
          display_text: displayText,
          user_first_name: profile?.username || profile?.full_name || event.user_first_name,
          location: profile?.location || event.location
        } as SocialProofEvent;
      });
      
      setEvents(eventsWithCurrentData);
    } catch (error) {
      console.error('Error fetching social proof events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create a new social proof event
  const createEvent = async (eventType: string, eventData: any = {}, userFirstName?: string, location?: string) => {
    try {
      const { error } = await supabase.rpc('create_social_proof_event', {
        p_user_id: user?.id,
        p_event_type: eventType,
        p_event_data: eventData,
        p_user_first_name: userFirstName,
        p_location: location
      });

      if (error) throw error;
      
      // Refresh events after creating a new one
      await fetchEvents();
    } catch (error) {
      console.error('Error creating social proof event:', error);
    }
  };

  // Update configuration (admin only)
  const updateConfig = async (updates: Partial<SocialProofConfig>) => {
    try {
      if (!config) return;

      const { error } = await supabase
        .from('social_proof_config')
        .update(updates)
        .eq('id', config.id);

      if (error) throw error;
      
      setConfig({ ...config, ...updates });
    } catch (error) {
      console.error('Error updating social proof config:', error);
      throw error;
    }
  };

  // Check if social proof should be shown based on user state and config
  const shouldShowSocialProof = () => {
    if (!config || !config.is_active || events.length === 0) return false;
    
    // Show on landing page for anonymous users
    if (!user && config.show_on_landing_page) return true;
    
    // Show after signin for authenticated users
    if (user && config.show_after_signin) return true;
    
    return false;
  };

  // Get current event to display
  const getCurrentEvent = () => {
    if (events.length === 0) return null;
    return events[currentEventIndex % events.length];
  };

  // Rotate to next event
  const rotateEvent = () => {
    if (events.length > 1) {
      setCurrentEventIndex(prev => (prev + 1) % events.length);
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    let eventsSubscription: any;

    const setupSubscriptions = async () => {
      // Subscribe to new social proof events
      eventsSubscription = supabase
        .channel('social-proof-events')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'social_proof_events'
        }, (payload) => {
          const newEvent = payload.new as SocialProofEvent;
          if (config?.enabled_event_types.includes(newEvent.event_type)) {
            setEvents(prev => [newEvent, ...prev.slice(0, (config?.max_events_shown || 10) - 1)]);
          }
        })
        .subscribe();
    };

    if (config) {
      setupSubscriptions();
    }

    return () => {
      if (eventsSubscription) {
        supabase.removeChannel(eventsSubscription);
      }
    };
  }, [config]);

  // Auto-rotate events
  useEffect(() => {
    if (!config || events.length <= 1) return;

    const interval = setInterval(() => {
      rotateEvent();
    }, config.rotation_interval);

    return () => clearInterval(interval);
  }, [config, events.length]);

  // Initial data fetch
  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    if (config) {
      fetchEvents();
    }
  }, [config]);

  return {
    events,
    config,
    loading,
    currentEvent: getCurrentEvent(),
    shouldShowSocialProof: shouldShowSocialProof(),
    createEvent,
    updateConfig,
    rotateEvent,
    fetchEvents,
    fetchConfig
  };
};