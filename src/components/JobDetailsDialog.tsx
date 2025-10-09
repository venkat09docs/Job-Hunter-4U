import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, MapPin, Mail, Phone, Building } from "lucide-react";

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
}

export const JobDetailsDialog = ({
  open,
  onOpenChange,
  jobDetails,
  loading,
  jobTitle
}: JobDetailsDialogProps) => {
  const highlightKeywords = (text: string, keywords: string[]) => {
    if (!keywords || keywords.length === 0) return text;
    
    let highlightedText = text;
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
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
          <DialogTitle className="text-2xl">{jobTitle}</DialogTitle>
        </DialogHeader>

        {loading ? (
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
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            <p>Failed to load job details. Please try again.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
