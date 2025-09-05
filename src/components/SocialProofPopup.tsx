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
        return 'bg-gradient-to-br from-green-50 to-green-100 border-green-300 text-green-900 shadow-green-200/50';
      case 'premium_upgrade':
        return 'bg-gradient-to-br from-yellow-50 to-orange-100 border-yellow-300 text-yellow-900 shadow-yellow-200/50';
      case 'job_application':
        return 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 text-blue-900 shadow-blue-200/50';
      case 'resume_completion':
        return 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300 text-purple-900 shadow-purple-200/50';
      case 'linkedin_optimization':
        return 'bg-gradient-to-br from-sky-50 to-sky-100 border-sky-300 text-sky-900 shadow-sky-200/50';
      case 'github_setup':
        return 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-300 text-slate-900 shadow-slate-200/50';
      default:
        return 'bg-gradient-to-br from-primary/5 to-primary/10 border-primary/30 text-primary shadow-primary/20';
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
            "fixed z-50 max-w-md w-80",
            getPositionClasses(config?.position || 'bottom-left')
          )}
        >
           <div className={cn(
             "relative rounded-xl border-2 p-6 shadow-2xl backdrop-blur-sm transition-all duration-300 ring-1 ring-white/20",
             "hover:shadow-3xl hover:scale-105 transform",
             getEventColor(currentEvent.event_type)
           )}>
             <button
               onClick={handleDismiss}
               className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg hover:bg-gray-50 transition-all hover:scale-110 border border-gray-200"
               aria-label="Dismiss notification"
             >
               <X className="w-4 h-4 text-gray-500" />
             </button>
             
             <div className="flex items-start gap-4">
               <div className="flex-shrink-0 mt-1 p-2 rounded-full bg-white/80 shadow-sm">
                 {getEventIcon(currentEvent.event_type)}
               </div>
               
               <div className="flex-1 min-w-0">
                 <p className="text-base font-semibold leading-6 mb-2">
                   {currentEvent.display_text}
                 </p>
                 
                 <p className="text-sm opacity-80 font-medium">
                   {new Date(currentEvent.created_at).toLocaleTimeString([], { 
                     hour: '2-digit', 
                     minute: '2-digit' 
                   })}
                 </p>
               </div>
             </div>
             
             {/* Enhanced pulse animation with glow */}
             <div className="absolute -top-2 -left-2 w-4 h-4">
               <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
               <div className="absolute inset-0 bg-green-500 rounded-full shadow-lg shadow-green-500/50"></div>
             </div>
             
             {/* Subtle highlight border */}
             <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/10 to-white/5 pointer-events-none"></div>
           </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SocialProofPopup;