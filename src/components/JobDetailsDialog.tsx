import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, MapPin, Mail, Phone, Building, FileText, Eye, CheckCircle, AlertTriangle, Lightbulb, Target, Heart, Crown } from "lucide-react";
import { ResumeAnalyzerDialog } from "./ResumeAnalyzerDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CircularScoreIndicator } from "@/components/CircularScoreIndicator";

interface JobDetails {
  companyDetails: string;
  jobDescription: string;
  keySkills: string[];
  location: string;
  contactDetails: {
    email?: string;
    phone?: string;
  };
  url: string;
}

interface JobDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobDetails: JobDetails | null;
  loading: boolean;
  jobTitle: string;
  hasActiveSubscription: boolean;
  onUpgradeClick: () => void;
}

export const JobDetailsDialog = ({
  open,
  onOpenChange,
  jobDetails,
  loading,
  jobTitle,
  hasActiveSubscription,
  onUpgradeClick
}: JobDetailsDialogProps) => {
  const [showResumeAnalyzer, setShowResumeAnalyzer] = useState(false);
  const [existingReport, setExistingReport] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [showExistingReport, setShowExistingReport] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && jobDetails) {
      checkExistingReport();
    }
  }, [open, jobDetails]);

  const checkExistingReport = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('resume_analysis_reports')
        .select('*')
        .eq('user_id', user.id)
        .eq('job_title', jobTitle)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setExistingReport(data);
    } catch (error) {
      console.error('Error checking existing report:', error);
    }
  };

  const handleViewExistingReport = () => {
    if (existingReport) {
      setShowExistingReport(true);
    }
  };

  const handleAddToWishlist = async () => {
    // Check subscription status for premium feature
    if (!hasActiveSubscription) {
      onUpgradeClick();
      toast({
        title: "Premium Feature",
        description: "Wishlist is available for subscribed users. Please upgrade to access this feature.",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please login to add jobs to your wishlist.",
          variant: "destructive",
        });
        return;
      }

      if (!jobDetails) return;

      setAddingToWishlist(true);

      // Check if job already exists in wishlist
      const { data: existingJob, error: checkError } = await supabase
        .from('job_tracker')
        .select('id')
        .eq('user_id', user.id)
        .eq('company_name', jobDetails.companyDetails)
        .eq('job_title', jobTitle)
        .eq('status', 'wishlist')
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing job:', checkError);
        throw checkError;
      }

      if (existingJob) {
        toast({
          title: "Already in wishlist",
          description: `${jobTitle} is already in your wishlist.`,
        });
        return;
      }

      // Add to wishlist
      const { error: insertError } = await supabase
        .from('job_tracker')
        .insert({
          user_id: user.id,
          company_name: jobDetails.companyDetails || 'Unknown Company',
          job_title: jobTitle || 'Unknown Position',
          status: 'wishlist',
          application_date: new Date().toISOString().split('T')[0],
          job_url: jobDetails.url || '',
          location: jobDetails.location || '',
          notes: jobDetails.jobDescription ? jobDetails.jobDescription.substring(0, 500) + (jobDetails.jobDescription.length > 500 ? '...' : '') : '',
        });

      if (insertError) {
        throw insertError;
      }

      toast({
        title: "Added to Wishlist",
        description: `${jobTitle} has been added to your job tracker.`,
      });
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      toast({
        title: "Error adding to wishlist",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setAddingToWishlist(false);
    }
  };

  const highlightKeywords = (text: string, keywords: string[]) => {
    if (!keywords || keywords.length === 0) return text;
    
    let highlightedText = text;
    keywords.forEach(keyword => {
      // Escape special regex characters to prevent regex errors
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b(${escapedKeyword})\\b`, 'gi');
      highlightedText = highlightedText.replace(
        regex,
        '<mark class="bg-primary/20 font-semibold">$1</mark>'
      );
    });
    
    return highlightedText;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">{jobTitle}</DialogTitle>
            {existingReport && !showExistingReport && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewExistingReport}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Existing Report
              </Button>
            )}
          </div>
        </DialogHeader>

        {showExistingReport && existingReport ? (
          <div className="space-y-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExistingReport(false)}
            >
              Back to Job Details
            </Button>
            
            <Card>
              <CardHeader>
                <CardTitle>Resume Analysis Report</CardTitle>
                <CardDescription>
                  Analyzed on {new Date(existingReport.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {existingReport.analysis_result?.parsed && (
                  <>
                    {/* Match Score */}
                    {existingReport.analysis_result.parsed.score && (
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <CircularScoreIndicator 
                          score={existingReport.analysis_result.parsed.score} 
                          size={120}
                        />
                        <p className="text-muted-foreground text-center max-w-md">
                          {existingReport.analysis_result.parsed.scoreText}
                        </p>
                      </div>
                    )}

                    {/* Key Strengths */}
                    {existingReport.analysis_result.parsed.strengths?.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          Key Strengths
                        </h3>
                        <ul className="space-y-2">
                          {existingReport.analysis_result.parsed.strengths.map((strength: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                              <span className="text-green-500 mt-1">•</span>
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Gaps & Missing Qualifications */}
                    {existingReport.analysis_result.parsed.gaps?.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                          Gaps & Missing Qualifications
                        </h3>
                        <ul className="space-y-2">
                          {existingReport.analysis_result.parsed.gaps.map((gap: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                              <span className="text-yellow-500 mt-1">•</span>
                              <span>{gap}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Optimization Suggestions */}
                    {existingReport.analysis_result.parsed.suggestions?.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Lightbulb className="h-5 w-5 text-blue-500" />
                          Optimization Suggestions
                        </h3>
                        <ul className="space-y-2">
                          {existingReport.analysis_result.parsed.suggestions.map((suggestion: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                              <span className="text-blue-500 mt-1">•</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Overall Recommendation */}
                    {existingReport.analysis_result.parsed.recommendation && (
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Target className="h-5 w-5 text-primary" />
                          Overall Recommendation
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {existingReport.analysis_result.parsed.recommendation}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading job details...</span>
          </div>
        ) : jobDetails ? (
          <div className="space-y-6">
            {/* Company Details */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Company Details</h3>
              </div>
              <p className="text-muted-foreground pl-7">{jobDetails.companyDetails}</p>
            </div>

            {/* Location */}
            {jobDetails.location && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Location</h3>
                </div>
                <p className="text-muted-foreground pl-7">{jobDetails.location}</p>
              </div>
            )}

            {/* Key Skills */}
            {jobDetails.keySkills && jobDetails.keySkills.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Key Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {jobDetails.keySkills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Job Description */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Job Description</h3>
              <div 
                className="text-muted-foreground leading-relaxed pl-4 border-l-2 border-primary/20"
                dangerouslySetInnerHTML={{ 
                  __html: highlightKeywords(jobDetails.jobDescription, jobDetails.keySkills) 
                }}
              />
            </div>

            {/* Contact Details */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Contact Details</h3>
              {(jobDetails.contactDetails?.email || jobDetails.contactDetails?.phone) ? (
                <div className="space-y-2 pl-4">
                  {jobDetails.contactDetails.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <a 
                        href={`mailto:${jobDetails.contactDetails.email}`}
                        className="hover:text-primary transition-colors"
                      >
                        {jobDetails.contactDetails.email}
                      </a>
                    </div>
                  )}
                  {jobDetails.contactDetails.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <a 
                        href={`tel:${jobDetails.contactDetails.phone}`}
                        className="hover:text-primary transition-colors"
                      >
                        {jobDetails.contactDetails.phone}
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground pl-4">No contacts are available</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="default"
                className="flex-1"
                onClick={() => window.open(jobDetails.url, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Visit Job Page
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowResumeAnalyzer(true)}
              >
                <FileText className="h-4 w-4 mr-2" />
                Resume Analyzer
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleAddToWishlist}
                disabled={addingToWishlist}
              >
                {addingToWishlist ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Heart className="h-4 w-4 mr-2" />
                )}
                Add to Wishlist
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            <p>Failed to load job details. Please try again.</p>
          </div>
        )}
      </DialogContent>

      {/* Resume Analyzer Dialog */}
      {jobDetails && (
        <ResumeAnalyzerDialog
          open={showResumeAnalyzer}
          onOpenChange={(open) => {
            setShowResumeAnalyzer(open);
            if (!open) {
              // Refresh existing report check when analyzer closes
              checkExistingReport();
            }
          }}
          jobDescription={jobDetails.jobDescription}
          keySkills={jobDetails.keySkills}
          jobTitle={jobTitle}
          companyName={jobDetails.companyDetails}
        />
      )}
    </Dialog>
  );
};
