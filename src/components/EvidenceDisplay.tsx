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
  verification_notes?: string;
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

  const getGitHubDetails = (evidenceItem: Evidence) => {
    const parsedData = parseEvidenceData(evidenceItem.evidence_data);
    console.log('🔍 EvidenceDisplay - Evidence item:', evidenceItem);
    console.log('🔍 EvidenceDisplay - Parsed data:', parsedData);
    
    // Check for GitHub-specific fields - enhanced field mapping
    const gitHubData = {
      commits_count: parsedData?.commits_count || parsedData?.commit_count || parsedData?.numberOfCommits || null,
      readmes_count: parsedData?.readmes_count || parsedData?.readme_count || parsedData?.numberOfReadmes || null,
      repo_url: parsedData?.repo_url || parsedData?.repository_url || parsedData?.repositoryUrl || null,
      repository_name: parsedData?.repository_name || parsedData?.repo_name || parsedData?.repositoryName || null,
      branch: parsedData?.branch || parsedData?.defaultBranch || null,
      files_changed: parsedData?.files_changed || parsedData?.filesChanged || null,
      additions: parsedData?.additions || null,
      deletions: parsedData?.deletions || null
    };
    
    console.log('🔍 EvidenceDisplay - Extracted GitHub data:', gitHubData);
    
    // Return only if at least one GitHub field exists
    const hasGitHubData = Object.values(gitHubData).some(value => value !== null);
    console.log('🔍 EvidenceDisplay - Has GitHub data:', hasGitHubData);
    return hasGitHubData ? gitHubData : null;
  };

  const handleFileClick = async (filePath: string) => {
    try {
      console.log('🔍 EvidenceDisplay - Attempting to access file:', filePath);
      
      // Determine the correct storage bucket based on the file path
      const bucket = filePath.includes('github-evidence') ? 'github-evidence' : 'career-evidence';
      const cleanPath = filePath.replace(/.*\/storage\/v1\/object\/public\/(github-evidence|career-evidence)\//, '');
      
      console.log('🔍 EvidenceDisplay - Bucket:', bucket);
      console.log('🔍 EvidenceDisplay - Clean path:', cleanPath);
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(cleanPath, 3600);
      
      if (error) {
        console.error('🔍 EvidenceDisplay - Error creating signed URL:', error);
        toast.error(`Unable to access file: ${error.message}`);
        return;
      }
      
      console.log('🔍 EvidenceDisplay - Signed URL created successfully:', data?.signedUrl);
      
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      } else {
        console.error('🔍 EvidenceDisplay - No signed URL returned');
        toast.error('No signed URL returned from storage');
      }
    } catch (error) {
      console.error('🔍 EvidenceDisplay - Error accessing file:', error);
      toast.error(`Unable to access file: ${error}`);
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
          
          // Enhanced parsing logic to handle legacy data and GitHub evidence
          let parsedEvidenceData = null;
          let url = null;
          let description = null;
          let fileName = null;
          let gitHubDetails = null;
          
          // First check the direct url field
          if (evidenceItem.url) {
            url = evidenceItem.url;
          }
          
          // Then parse evidence_data
          if (evidenceItem.evidence_data) {
            if (typeof evidenceItem.evidence_data === 'object' && evidenceItem.evidence_data !== null) {
              parsedEvidenceData = evidenceItem.evidence_data;
              url = url || parsedEvidenceData.url;
              description = parsedEvidenceData.description || parsedEvidenceData.text;
              fileName = parsedEvidenceData.file_name;
              gitHubDetails = getGitHubDetails(evidenceItem);
            } else if (typeof evidenceItem.evidence_data === 'string') {
              try {
                parsedEvidenceData = JSON.parse(evidenceItem.evidence_data);
                url = url || parsedEvidenceData.url;
                description = parsedEvidenceData.description || parsedEvidenceData.text;
                fileName = parsedEvidenceData.file_name;
                gitHubDetails = getGitHubDetails(evidenceItem);
              } catch (e) {
                // If it's not valid JSON, check if it's a URL or description
                const dataStr = evidenceItem.evidence_data.trim();
                if (dataStr.toLowerCase().startsWith('http') || dataStr.includes('.')) {
                  url = dataStr;
                } else if (dataStr !== 'URL' && dataStr !== 'SCREENSHOT' && dataStr !== 'DATA_EXPORT') {
                  // If it's not just the evidence type, treat as description
                  description = dataStr;
                }
              }
            }
          }
          
          // Additional check: if URL is still null but we have text field, check if text contains URL
          if (!url && parsedEvidenceData?.text && parsedEvidenceData.text !== description) {
            const textStr = parsedEvidenceData.text.trim();
            if (textStr.toLowerCase().startsWith('http') || (textStr.includes('.') && textStr.includes('/'))) {
              url = textStr;
            }
          }
          
          return (
            <Card key={evidenceItem.id} className={`p-4 ${!isLatest ? 'opacity-75 border-muted' : 'border-primary/20'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {isLatest && <Badge variant="default" className="text-xs">Latest</Badge>}
                  {index > 0 && <Badge variant="secondary" className="text-xs">Previous</Badge>}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge 
                    variant={evidenceItem.verification_status === 'pending' ? 'secondary' : 
                           evidenceItem.verification_status === 'approved' || evidenceItem.verification_status === 'verified' ? 'default' : 'destructive'}
                  >
                    {evidenceItem.verification_status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(submissionDate, 'MMM dd, yyyy hh:mm a')}
                  </span>
                </div>
              </div>
              
              {/* GitHub Activity Summary - Enhanced Display */}
              {gitHubDetails && ((gitHubDetails.commits_count !== null && gitHubDetails.commits_count !== undefined) || 
               (gitHubDetails.readmes_count !== null && gitHubDetails.readmes_count !== undefined)) && (
                <div className="mb-4">
                  <Label className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2 block">GitHub Activity Summary</Label>
                  <div className="grid grid-cols-2 gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                        {gitHubDetails.commits_count || 0}
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        Weekly Commits
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                        {gitHubDetails.readmes_count || 0}
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        README/Docs Updates
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Repository Information */}
              {gitHubDetails && (gitHubDetails.repo_url || gitHubDetails.repository_name || gitHubDetails.branch) && (
                <div className="mb-3">
                  <Label className="text-xs text-muted-foreground">Repository Details:</Label>
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded space-y-2 text-sm">
                    {gitHubDetails.repo_url && (
                      <div>
                        <span className="font-medium">Repository:</span>
                        <a 
                          href={gitHubDetails.repo_url.startsWith('http') ? gitHubDetails.repo_url : `https://${gitHubDetails.repo_url}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-2 text-blue-600 hover:text-blue-800 underline break-all"
                        >
                          {gitHubDetails.repo_url}
                        </a>
                      </div>
                    )}
                    {gitHubDetails.repository_name && (
                      <div>
                        <span className="font-medium">Name:</span>
                        <span className="ml-2">{gitHubDetails.repository_name}</span>
                      </div>
                    )}
                    {gitHubDetails.branch && (
                      <div>
                        <span className="font-medium">Branch:</span>
                        <span className="ml-2">{gitHubDetails.branch}</span>  
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Always show URL section */}
              <div className="mb-3">
                <Label className="text-xs text-muted-foreground">URL:</Label>
                <div className="mt-1">
                  {url ? (
                    <a 
                      href={url.startsWith('http') ? url : `http://${url}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline block break-all text-sm"
                    >
                      {url}
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
                        // Handle both career-evidence and github-evidence paths
                        let filePath = fileUrl;
                        if (fileUrl.includes('/storage/v1/object/public/')) {
                          filePath = fileUrl.replace(/.*\/storage\/v1\/object\/public\/(github-evidence|career-evidence)\//, '');
                        }
                        
                        return (
                          <button
                            key={fileIndex}
                            onClick={() => handleFileClick(fileUrl)}
                            className="text-blue-600 hover:underline text-sm block text-left"
                          >
                            📎 {fileName || `File ${fileIndex + 1}`}
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
                  {description ? (
                    <div className="text-sm whitespace-pre-wrap p-2 border rounded bg-gray-50 dark:bg-gray-800">
                      {description}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">No description provided</span>
                  )}
                </div>
              </div>
              
              {/* Verification Notes section - only show if notes exist */}
              {evidenceItem.verification_notes && (
                <div className="mb-3">
                  <Label className="text-xs font-medium text-orange-700 dark:text-orange-300">Verification Notes:</Label>
                  <div className="mt-1">
                    <div className="text-sm whitespace-pre-wrap p-3 border rounded bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
                      {evidenceItem.verification_notes}
                    </div>
                  </div>
                </div>
              )}

              {parsedEvidenceData && fileName && (
                <div className={!isLatest ? 'pointer-events-none' : ''}>
                  <div className="mt-2 space-y-3">
                    {/* File info */}
                    <div className="text-xs text-muted-foreground">
                      File: {fileName}
                      {parsedEvidenceData?.file_size && (
                        <span> ({Math.round(parsedEvidenceData.file_size / 1024)}KB)</span>
                      )}
                    </div>
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