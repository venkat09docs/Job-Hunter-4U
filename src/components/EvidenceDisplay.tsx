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
  const parseEvidenceData = (evidenceData: any) => {
    if (!evidenceData) return null;
    
    // If it's already an object, return it
    if (typeof evidenceData === 'object' && evidenceData !== null) {
      return evidenceData;
    }
    
    // If it's a string, try to parse it as JSON
    if (typeof evidenceData === 'string') {
      try {
        return JSON.parse(evidenceData);
      } catch (e) {
        console.error('Failed to parse evidence_data as JSON:', e);
        // If it's not valid JSON, treat it as plain text
        return { description: evidenceData };
      }
    }
    
    return null;
  };

  const getUrl = (evidenceItem: Evidence) => {
    const parsedData = parseEvidenceData(evidenceItem.evidence_data);
    return evidenceItem.url || parsedData?.url || null;
  };

  const getDescription = (evidenceItem: Evidence) => {
    const parsedData = parseEvidenceData(evidenceItem.evidence_data);
    return parsedData?.description || parsedData?.text || null;
  };

  const getFileName = (evidenceItem: Evidence) => {
    const parsedData = parseEvidenceData(evidenceItem.evidence_data);
    return parsedData?.file_name || null;
  };

  // Debug logging
  React.useEffect(() => {
    evidence.forEach((evidenceItem, index) => {
      console.log(`🔍 Evidence ${index}:`, evidenceItem);
      console.log(`🔍 Raw evidence_data ${index}:`, evidenceItem.evidence_data);
      console.log(`🔍 evidence_data type ${index}:`, typeof evidenceItem.evidence_data);
      console.log(`🔍 Description ${index}:`, getDescription(evidenceItem));
      console.log(`🔍 URL ${index}:`, getUrl(evidenceItem));
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
          const parsedEvidenceData = parseEvidenceData(evidenceItem.evidence_data);
          
          return (
            <Card key={evidenceItem.id} className={`p-4 ${!isLatest ? 'opacity-75 border-muted' : 'border-primary/20'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {/* Removed evidence_type badge that was showing "url" */}
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
              
              {/* Always show URL section */}
              <div className="mb-3">
                <Label className="text-xs text-muted-foreground">URL:</Label>
                <div className="mt-1">
                  {getUrl(evidenceItem) ? (
                    <a 
                      href={getUrl(evidenceItem)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline block break-all text-sm"
                    >
                      {getUrl(evidenceItem)}
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">No URL provided</span>
                  )}
                </div>
              </div>
              
              {/* Always show Files section */}
              <div className="mb-3">
                <Label className="text-xs text-muted-foreground">Files:</Label>
                <div className="mt-1">
                  {evidenceItem.file_urls && evidenceItem.file_urls.length > 0 ? (
                    <div className="space-y-1">
                      {evidenceItem.file_urls.map((fileUrl, fileIndex) => {
                        const filePath = fileUrl.replace(/.*\/storage\/v1\/object\/public\/career-evidence\//, '');
                        const fileName = getFileName(evidenceItem) || `File ${fileIndex + 1}`;
                        
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
                  ) : (
                    <span className="text-xs text-muted-foreground italic">No files uploaded</span>
                  )}
                </div>
              </div>
              
              {/* Always show Description section */}
              <div className="mb-3">
                <Label className="text-xs text-muted-foreground">Description:</Label>
                <div className="mt-1">
                  {getDescription(evidenceItem) ? (
                    <div className="text-sm whitespace-pre-wrap p-2 border rounded bg-gray-50">
                      {getDescription(evidenceItem)}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">No description provided</span>
                  )}
                </div>
              </div>

              {parseEvidenceData(evidenceItem.evidence_data) && (
                <div className={!isLatest ? 'pointer-events-none' : ''}>
                  <div className="mt-2 space-y-3">
                    {/* File info */}
                    {getFileName(evidenceItem) && (
                      <div className="text-xs text-muted-foreground">
                        File: {getFileName(evidenceItem)}
                        {parseEvidenceData(evidenceItem.evidence_data)?.file_size && (
                          <span> ({Math.round(parseEvidenceData(evidenceItem.evidence_data).file_size / 1024)}KB)</span>
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