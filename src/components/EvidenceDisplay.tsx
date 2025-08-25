import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { format } from 'date-fns';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Evidence {
  id: string;
  evidence_type: string;
  evidence_data: any;
  url?: string;
  file_urls?: string[];
  verification_status: string;
  created_at: string;
}

interface EvidenceDisplayProps {
  evidence: Evidence[];
}

export const EvidenceDisplay: React.FC<EvidenceDisplayProps> = ({ evidence }) => {
  // Debug logging
  React.useEffect(() => {
    evidence.forEach((evidenceItem, index) => {
      console.log(`🔍 Evidence ${index}:`, evidenceItem);
      console.log(`🔍 Evidence data ${index}:`, evidenceItem.evidence_data);
      console.log(`🔍 Description ${index}:`, evidenceItem.evidence_data?.description);
      console.log(`🔍 Text ${index}:`, evidenceItem.evidence_data?.text);
    });
  }, [evidence]);

  const handleFileClick = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('career-evidence')
        .createSignedUrl(filePath, 3600);
      
      if (error) {
        console.error('Error creating signed URL:', error);
        toast.error('Unable to access file');
        return;
      }
      
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Error accessing file:', error);
      toast.error('Unable to access file');
    }
  };

  return (
    <div>
      <Label className="text-sm font-medium mb-3 block">
        Submitted Evidence ({evidence.length} submission{evidence.length !== 1 ? 's' : ''})
      </Label>
      <div className="space-y-4">
        {evidence.map((evidenceItem, index) => {
          const isLatest = index === 0;
          const submissionDate = new Date(evidenceItem.created_at);
          
          return (
            <Card key={evidenceItem.id} className={`p-4 ${!isLatest ? 'opacity-75 border-muted' : 'border-primary/20'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{evidenceItem.evidence_type}</Badge>
                  {isLatest && <Badge variant="default" className="text-xs">Latest</Badge>}
                  {index > 0 && <Badge variant="secondary" className="text-xs">Previous</Badge>}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge 
                    variant={evidenceItem.verification_status === 'pending' ? 'secondary' : 
                           evidenceItem.verification_status === 'approved' ? 'default' : 'destructive'}
                  >
                    {evidenceItem.verification_status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(submissionDate, 'MMM dd, yyyy hh:mm a')}
                  </span>
                </div>
              </div>
              
              {/* URLs removed - no longer displayed in evidence */}
              
              {evidenceItem.file_urls && evidenceItem.file_urls.length > 0 && (
                <div className="mb-2">
                  <div className="space-y-1">
                    {evidenceItem.file_urls.map((fileUrl, fileIndex) => {
                      const filePath = fileUrl.replace(/.*\/storage\/v1\/object\/public\/career-evidence\//, '');
                      const fileName = evidenceItem.evidence_data?.file_name || `File ${fileIndex + 1}`;
                      
                      return (
                        <button
                          key={fileIndex}
                          onClick={() => handleFileClick(filePath)}
                          className="text-blue-600 hover:underline text-sm block text-left"
                        >
                          📎 {fileName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {evidenceItem.evidence_data && (
                <div className={!isLatest ? 'pointer-events-none' : ''}>
                  <div className="mt-2 space-y-3">
                    {/* Description - simple display */}
                    {(evidenceItem.evidence_data.description || evidenceItem.evidence_data.text) && (
                      <div>
                        <Label className="text-xs font-medium">User's Description:</Label>
                        <div className="text-sm whitespace-pre-wrap mt-1 p-2 border rounded bg-gray-50">
                          {evidenceItem.evidence_data.description || evidenceItem.evidence_data.text}
                        </div>
                      </div>
                    )}
                    
                    {/* File info */}
                    {evidenceItem.evidence_data.file_name && (
                      <div className="text-xs text-muted-foreground">
                        File: {evidenceItem.evidence_data.file_name}
                        {evidenceItem.evidence_data.file_size && (
                          <span> ({Math.round(evidenceItem.evidence_data.file_size / 1024)}KB)</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};