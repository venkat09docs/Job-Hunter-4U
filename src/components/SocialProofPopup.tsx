import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, TrendingUp, Star, Briefcase, FileText, Github, Linkedin } from 'lucide-react';
import { useSocialProof } from '@/hooks/useSocialProof';
import { cn } from '@/lib/utils';

const SocialProofPopup: React.FC = () => {
  const { currentEvent, shouldShowSocialProof, config } = useSocialProof();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Show/hide popup based on current event and configuration
  useEffect(() => {
    if (shouldShowSocialProof && currentEvent && !isDismissed) {
      setIsVisible(true);
      
      // Auto-hide after display duration
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, config?.display_duration || 5000);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [currentEvent, shouldShowSocialProof, config?.display_duration, isDismissed]);

  // Reset dismissal when events change
  useEffect(() => {
    setIsDismissed(false);
  }, [currentEvent?.id]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'signup':
        return <Users className="w-4 h-4 text-green-500" />;
      case 'premium_upgrade':
        return <Star className="w-4 h-4 text-yellow-500" />;
      case 'job_application':
        return <Briefcase className="w-4 h-4 text-blue-500" />;
      case 'resume_completion':
        return <FileText className="w-4 h-4 text-purple-500" />;
      case 'linkedin_optimization':
        return <Linkedin className="w-4 h-4 text-blue-600" />;
      case 'github_setup':
        return <Github className="w-4 h-4 text-gray-700" />;
      default:
        return <TrendingUp className="w-4 h-4 text-primary" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'signup':
        return 'border-green-200 bg-green-50 text-green-800';
      case 'premium_upgrade':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'job_application':
        return 'border-blue-200 bg-blue-50 text-blue-800';
      case 'resume_completion':
        return 'border-purple-200 bg-purple-50 text-purple-800';
      case 'linkedin_optimization':
        return 'border-blue-200 bg-blue-50 text-blue-800';
      case 'github_setup':
        return 'border-gray-200 bg-gray-50 text-gray-800';
      default:
        return 'border-primary/20 bg-primary/5 text-primary';
    }
  };

  const getPositionClasses = (position: string) => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      default:
        return 'bottom-4 left-4';
    }
  };

  if (!currentEvent || !shouldShowSocialProof) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={cn(
            "fixed z-50 max-w-sm",
            getPositionClasses(config?.position || 'bottom-left')
          )}
        >
          <div className={cn(
            "relative rounded-lg border-2 p-4 shadow-lg backdrop-blur-sm transition-all duration-300",
            getEventColor(currentEvent.event_type)
          )}>
            <button
              onClick={handleDismiss}
              className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm hover:bg-gray-50 transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getEventIcon(currentEvent.event_type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-5">
                  {currentEvent.display_text}
                </p>
                
                <p className="text-xs mt-1 opacity-75">
                  {new Date(currentEvent.created_at).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
            
            {/* Pulse animation dot */}
            <div className="absolute -top-1 -left-1 w-3 h-3">
              <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
              <div className="absolute inset-0 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SocialProofPopup;