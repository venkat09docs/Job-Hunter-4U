import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { ArrowLeft, Building2, Users, Calendar, Briefcase, Trash2, Search, Filter, X, Edit, Eye, Upload, FileText, Loader2, CheckCircle2, AlertCircle, Lightbulb, Target, TrendingUp, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import ReactMarkdown from "react-markdown";

interface HRDetail {
  id: string;
  company_name: string;
  company_employees: string | null;
  company_founded_year: string | null;
  job_title: string;
  hr_name: string | null;
  hr_email: string;
  job_description: string;
  key_skills: string | null;
  analysis_report: string | null;
  created_at: string;
}

const ManageHRDetails = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [hrDetails, setHrDetails] = useState<HRDetail[]>([]);
  const [filteredHrDetails, setFilteredHrDetails] = useState<HRDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState<"all" | "company" | "job_title" | "hr_name">("all");
  const [selectedHR, setSelectedHR] = useState<HRDetail | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);
  const [isViewReportDialogOpen, setIsViewReportDialogOpen] = useState(false);
  const [isRedefinedResumeDialogOpen, setIsRedefinedResumeDialogOpen] = useState(false);
  const [isAutomateJobDialogOpen, setIsAutomateJobDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRedefining, setIsRedefining] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploadingDocuments, setIsUploadingDocuments] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>("");
  const [redefinedResumeContent, setRedefinedResumeContent] = useState<string>("");
  const [parsedAnalysis, setParsedAnalysis] = useState<{
    score: number;
    strengths: string[];
    gaps: string[];
    suggestions: string[];
    keywords: string[];
    recommendation: string;
  } | null>(null);

  useEffect(() => {
    fetchHRDetails();
  }, []);

  const fetchHRDetails = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to view HR details",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from('hr_details')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setHrDetails(data || []);
      setFilteredHrDetails(data || []);
    } catch (error) {
      console.error('Error fetching HR details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch HR details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter HR details based on search term and filter type
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredHrDetails(hrDetails);
      return;
    }

    const filtered = hrDetails.filter((hr) => {
      const term = searchTerm.toLowerCase();
      
      switch (filterBy) {
        case "company":
          return hr.company_name.toLowerCase().includes(term);
        case "job_title":
          return hr.job_title.toLowerCase().includes(term);
        case "hr_name":
          return hr.hr_name?.toLowerCase().includes(term) || false;
        case "all":
        default:
          return (
            hr.company_name.toLowerCase().includes(term) ||
            hr.job_title.toLowerCase().includes(term) ||
            hr.hr_name?.toLowerCase().includes(term) ||
            hr.hr_email.toLowerCase().includes(term) ||
            hr.job_description.toLowerCase().includes(term) ||
            hr.key_skills?.toLowerCase().includes(term)
          );
      }
    });

    setFilteredHrDetails(filtered);
  }, [searchTerm, filterBy, hrDetails]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('hr_details')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "HR details deleted successfully",
      });

      // Refresh the list
      fetchHRDetails();
    } catch (error) {
      console.error('Error deleting HR details:', error);
      toast({
        title: "Error",
        description: "Failed to delete HR details",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (hr: HRDetail) => {
    setSelectedHR(hr);
    setIsDetailDialogOpen(true);
  };

  const handleResumeAnalyzerClick = () => {
    setIsDetailDialogOpen(false);
    setIsUploadDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a Word document (.doc or .docx)",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleAnalyzeResume = async () => {
    if (!selectedFile || !selectedHR) return;

    setIsAnalyzing(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      
      await new Promise((resolve, reject) => {
        reader.onload = resolve;
        reader.onerror = reject;
      });

      const base64 = (reader.result as string).split(',')[1];
      
      // Combine job description and key skills
      const jobDescription = `${selectedHR.job_description}${selectedHR.key_skills ? '\n\nKey Skills Required:\n' + selectedHR.key_skills : ''}`;

      // Call the analyze-resume edge function
      const { data, error } = await supabase.functions.invoke('analyze-resume', {
        body: {
          resumeBase64: base64,
          jobDescription: jobDescription
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setAnalysisResult(data.analysis);
      
      // Parse the analysis to extract structured data
      const analysis = parseAnalysis(data.analysis);
      setParsedAnalysis(analysis);
      
      setIsUploadDialogOpen(false);
      setIsAnalysisDialogOpen(true);

      toast({
        title: "Analysis Complete",
        description: "Your resume has been analyzed successfully.",
      });
    } catch (error) {
      console.error('Error analyzing resume:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const parseAnalysis = (text: string) => {
    const lines = text.split('\n');
    let score = 0;
    const strengths: string[] = [];
    const gaps: string[] = [];
    const suggestions: string[] = [];
    const keywords: string[] = [];
    let recommendation = '';
    let currentSection = '';

    lines.forEach(line => {
      const trimmed = line.trim();
      
      if (trimmed.includes('Match Score') || trimmed.includes('Score')) {
        const scoreMatch = trimmed.match(/(\d+)/);
        if (scoreMatch) score = parseInt(scoreMatch[1]);
        currentSection = 'score';
      } else if (trimmed.includes('Key Strengths')) {
        currentSection = 'strengths';
      } else if (trimmed.includes('Gaps') || trimmed.includes('Missing')) {
        currentSection = 'gaps';
      } else if (trimmed.includes('Optimization') || trimmed.includes('Suggestions')) {
        currentSection = 'suggestions';
      } else if (trimmed.includes('Keywords')) {
        currentSection = 'keywords';
      } else if (trimmed.includes('Overall Recommendation')) {
        currentSection = 'recommendation';
      } else if (trimmed.startsWith('-') && trimmed.length > 2) {
        const item = trimmed.substring(1).trim();
        if (currentSection === 'strengths') strengths.push(item);
        else if (currentSection === 'gaps') gaps.push(item);
        else if (currentSection === 'suggestions') suggestions.push(item);
        else if (currentSection === 'keywords') keywords.push(item);
      } else if (currentSection === 'recommendation' && trimmed.length > 10) {
        recommendation += trimmed + ' ';
      }
    });

    return { score, strengths, gaps, suggestions, keywords, recommendation: recommendation.trim() };
  };

  const handleRedefineResume = async () => {
    if (!selectedFile || !selectedHR) return;

    try {
      setIsRedefining(true);

      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      
      await new Promise((resolve, reject) => {
        reader.onload = resolve;
        reader.onerror = reject;
      });

      const base64 = (reader.result as string).split(',')[1];
      
      // Parse key skills into array
      const keySkills = selectedHR.key_skills?.split(',').map(skill => skill.trim()) || [];

      // Call the redefine-resume edge function
      const { data, error } = await supabase.functions.invoke('redefine-resume', {
        body: {
          resumeBase64: base64,
          jobDescription: selectedHR.job_description,
          keySkills: keySkills
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      // Clean the resume content - remove any analysis or explanatory sections
      let cleanedResume = data.redefinedResume;
      
      // Remove common analysis headers and their content
      const analysisPatterns = [
        /\*\*Analysis:?\*\*/gi,
        /\*\*Recommendations?:?\*\*/gi,
        /\*\*Notes?:?\*\*/gi,
        /\*\*Summary:?\*\*/gi,
        /Analysis:?\s*\n/gi,
        /Recommendations?:?\s*\n/gi,
        /Notes?:?\s*\n/gi,
        /---+\s*Analysis[\s\S]*?---+/gi,
        /---+\s*Recommendations?[\s\S]*?---+/gi,
        /\[Analysis[\s\S]*?\]/gi,
        /\(Analysis[\s\S]*?\)/gi,
      ];

      analysisPatterns.forEach(pattern => {
        cleanedResume = cleanedResume.replace(pattern, '');
      });

      // Remove any lines that look like explanatory comments (starting with common markers)
      const lines = cleanedResume.split('\n');
      const filteredLines = lines.filter(line => {
        const trimmed = line.trim().toLowerCase();
        // Remove lines that are clearly analysis/explanations
        return !(
          trimmed.startsWith('analysis:') ||
          trimmed.startsWith('note:') ||
          trimmed.startsWith('recommendation:') ||
          trimmed.startsWith('explanation:') ||
          trimmed.startsWith('this resume') ||
          trimmed.startsWith('the above') ||
          trimmed.includes('has been optimized') ||
          trimmed.includes('keyword optimization') ||
          (trimmed.startsWith('**') && trimmed.includes('analysis'))
        );
      });

      cleanedResume = filteredLines.join('\n');

      // Remove excessive blank lines
      cleanedResume = cleanedResume.replace(/\n{4,}/g, '\n\n\n');
      
      // Store the cleaned redefined resume content and show in dialog
      setRedefinedResumeContent(cleanedResume.trim());
      setIsAnalysisDialogOpen(false);
      setIsRedefinedResumeDialogOpen(true);

      toast({
        title: "Resume Redefined",
        description: "Your optimized resume is ready for review.",
      });
    } catch (error) {
      console.error('Error redefining resume:', error);
      toast({
        title: "Redefinition Failed",
        description: error instanceof Error ? error.message : "Failed to redefine resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRedefining(false);
    }
  };

  const handleDownloadRedefinedResume = async () => {
    if (!redefinedResumeContent || !selectedHR) return;

    try {
      setIsDownloading(true);

      // Convert the redefined resume text to a Word document
      const sections = redefinedResumeContent.split('\n\n');
      
      const paragraphs: Paragraph[] = [];
      
      sections.forEach((section: string) => {
        const lines = section.split('\n');
        lines.forEach((line: string) => {
          if (line.trim()) {
            // Check if it's a heading (all caps or starts with specific keywords)
            const isHeading = /^[A-Z\s]{3,}$/.test(line.trim()) || 
                            ['PROFESSIONAL SUMMARY', 'KEY SKILLS', 'PROFESSIONAL EXPERIENCE', 
                             'EDUCATION', 'CERTIFICATIONS', 'PROJECTS'].some(h => line.includes(h));
            
            if (isHeading) {
              paragraphs.push(
                new Paragraph({
                  text: line.trim(),
                  heading: HeadingLevel.HEADING_1,
                  spacing: { before: 240, after: 120 },
                })
              );
            } else if (line.startsWith('•')) {
              paragraphs.push(
                new Paragraph({
                  text: line.substring(1).trim(),
                  bullet: { level: 0 },
                  spacing: { before: 80, after: 80 },
                })
              );
            } else {
              paragraphs.push(
                new Paragraph({
                  text: line,
                  spacing: { before: 80, after: 80 },
                })
              );
            }
          }
        });
      });

      const doc = new Document({
        sections: [{
          properties: {},
          children: paragraphs,
        }],
      });

      // Generate and download the Word document
      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Redefined_Resume_${selectedHR.company_name.replace(/\s+/g, '_')}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Resume Downloaded",
        description: "Your optimized resume has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error downloading resume:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveReport = async () => {
    if (!analysisResult || !selectedHR) return;

    try {
      setIsSaving(true);

      // Save the analysis report to the database
      const { error } = await supabase
        .from('hr_details')
        .update({ analysis_report: analysisResult })
        .eq('id', selectedHR.id);

      if (error) throw error;

      // Update the local state
      setHrDetails(prevDetails =>
        prevDetails.map(hr =>
          hr.id === selectedHR.id
            ? { ...hr, analysis_report: analysisResult }
            : hr
        )
      );
      setFilteredHrDetails(prevDetails =>
        prevDetails.map(hr =>
          hr.id === selectedHR.id
            ? { ...hr, analysis_report: analysisResult }
            : hr
        )
      );

      toast({
        title: "Report Saved",
        description: "Analysis report has been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving report:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save the report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewSavedReport = (hr: HRDetail) => {
    if (!hr.analysis_report) return;
    
    setSelectedHR(hr);
    setAnalysisResult(hr.analysis_report);
    const analysis = parseAnalysis(hr.analysis_report);
    setParsedAnalysis(analysis);
    setIsViewReportDialogOpen(true);
  };

  const handleAutomateJobClick = () => {
    setIsDetailDialogOpen(false);
    setResumeFile(null);
    setCoverLetterFile(null);
    setIsAutomateJobDialogOpen(true);
  };

  const handleResumeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF file for the resume",
          variant: "destructive",
        });
        return;
      }
      setResumeFile(file);
    }
  };

  const handleCoverLetterFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF file for the cover letter",
          variant: "destructive",
        });
        return;
      }
      setCoverLetterFile(file);
    }
  };

  const handleUploadDocuments = async () => {
    if (!resumeFile || !selectedHR) return;

    setIsUploadingDocuments(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const timestamp = Date.now();
      let resumeUrl = null;
      let coverLetterUrl = null;

      // Upload resume
      const resumePath = `${user.id}/${timestamp}-${resumeFile.name}`;
      const { error: resumeError } = await supabase.storage
        .from('hr-documents')
        .upload(resumePath, resumeFile, {
          contentType: 'application/pdf',
          upsert: false,
        });

      if (resumeError) throw resumeError;

      // Get public URL for resume
      const { data: resumeUrlData } = supabase.storage
        .from('hr-documents')
        .getPublicUrl(resumePath);
      resumeUrl = resumeUrlData.publicUrl;

      // Upload cover letter if provided
      if (coverLetterFile) {
        const coverLetterPath = `${user.id}/${timestamp}-${coverLetterFile.name}`;
        const { error: coverLetterError } = await supabase.storage
          .from('hr-documents')
          .upload(coverLetterPath, coverLetterFile, {
            contentType: 'application/pdf',
            upsert: false,
          });

        if (coverLetterError) throw coverLetterError;

        // Get public URL for cover letter
        const { data: coverLetterUrlData } = supabase.storage
          .from('hr-documents')
          .getPublicUrl(coverLetterPath);
        coverLetterUrl = coverLetterUrlData.publicUrl;
      }

      // Update hr_details record with file URLs
      const { error: updateError } = await supabase
        .from('hr_details')
        .update({
          resume_url: resumeUrl,
          cover_letter_url: coverLetterUrl,
        })
        .eq('id', selectedHR.id);

      if (updateError) throw updateError;

      toast({
        title: "Documents Uploaded",
        description: "Your resume and cover letter have been saved successfully.",
      });

      setIsAutomateJobDialogOpen(false);
      fetchHRDetails();
    } catch (error) {
      console.error('Error uploading documents:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload documents. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingDocuments(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/job-hunter-level-up")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-4">
            <UserProfileDropdown />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 border-2 border-primary/20 rounded-xl">
                <Building2 className="h-8 w-8 text-primary stroke-[2.5]" />
              </div>
              <h1 className="text-4xl font-bold">Manage HR Details</h1>
            </div>
            <Button
              onClick={() => navigate("/dashboard/automate-job-hunting")}
              className="gap-2"
            >
              Add New HR Details
            </Button>
          </div>
          <p className="text-muted-foreground text-lg">
            View and manage all your saved HR contacts and job applications
          </p>
        </div>

        {/* Search and Filter Section */}
        <Card className="mb-6 border-2">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search HR details..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                    onClick={() => setSearchTerm("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Filter Options */}
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Filter by:</span>
                <div className="flex gap-2 flex-wrap">
                  <Badge
                    variant={filterBy === "all" ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => setFilterBy("all")}
                  >
                    All
                  </Badge>
                  <Badge
                    variant={filterBy === "company" ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => setFilterBy("company")}
                  >
                    Company
                  </Badge>
                  <Badge
                    variant={filterBy === "job_title" ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => setFilterBy("job_title")}
                  >
                    Job Title
                  </Badge>
                  <Badge
                    variant={filterBy === "hr_name" ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => setFilterBy("hr_name")}
                  >
                    HR Name
                  </Badge>
                </div>
              </div>
            </div>

            {/* Search Results Info */}
            {searchTerm && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  Found {filteredHrDetails.length} result{filteredHrDetails.length !== 1 ? 's' : ''} for "{searchTerm}"
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredHrDetails.length === 0 && searchTerm ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Results Found</h3>
              <p className="text-muted-foreground text-center mb-4">
                No HR details match your search criteria. Try adjusting your filters.
              </p>
              <Button variant="outline" onClick={() => setSearchTerm("")}>
                Clear Search
              </Button>
            </CardContent>
          </Card>
        ) : hrDetails.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No HR Details Found</h3>
              <p className="text-muted-foreground text-center mb-4">
                You haven't added any HR details yet. Start by adding your first HR contact.
              </p>
              <Button onClick={() => navigate("/dashboard/automate-job-hunting")}>
                Add HR Details
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredHrDetails.map((hr) => (
              <Card key={hr.id} className="hover:shadow-md transition-all border-l-4 border-l-primary/40 hover:border-l-primary">
                <CardContent className="p-4">
                  {/* Line 1: Company, Job Title, Action Buttons */}
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-bold">{hr.company_name}</h3>
                        <span className="text-muted-foreground">•</span>
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{hr.job_title}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {hr.analysis_report && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewSavedReport(hr)}
                          className="text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 dark:text-cyan-400 dark:hover:bg-cyan-950 h-8 w-8"
                          title="View Analysis Report"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate("/dashboard/automate-job-hunting")}
                        className="text-primary hover:text-primary hover:bg-primary/10 h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(hr.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Line 2: HR Contact, Company Details, View More */}
                  <div className="flex items-center justify-between gap-6 text-sm flex-wrap">
                    <div className="flex items-center gap-6 flex-wrap">
                      {hr.hr_name && (
                        <>
                          <span className="font-medium">{hr.hr_name}</span>
                          <span className="text-muted-foreground">{hr.hr_email}</span>
                          <span className="text-muted-foreground">•</span>
                        </>
                      )}
                      {hr.company_employees && (
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{hr.company_employees}</span>
                        </div>
                      )}
                      {hr.company_founded_year && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>Est. {hr.company_founded_year}</span>
                          </div>
                        </>
                      )}
                      <span className="text-muted-foreground text-xs">
                        {new Date(hr.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => handleViewDetails(hr)}
                      className="text-primary gap-1.5 h-auto p-0"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View More Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Details Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl border border-primary/20">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-xl">{selectedHR?.company_name}</div>
                  <div className="text-sm font-normal text-muted-foreground mt-1 flex items-center gap-2">
                    <Briefcase className="h-3.5 w-3.5" />
                    {selectedHR?.job_title}
                  </div>
                </div>
              </DialogTitle>
              <DialogDescription>
                Complete details about this job opportunity
              </DialogDescription>
            </DialogHeader>

            {selectedHR && (
              <div className="space-y-6 mt-4 animate-fade-in">
                {/* Company Information */}
                <div className="p-4 bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
                  <h3 className="text-sm font-semibold mb-4 text-blue-900 dark:text-blue-100 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Company Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedHR.company_employees && (
                      <div className="p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1.5">Employees</p>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm font-medium">{selectedHR.company_employees}</span>
                        </div>
                      </div>
                    )}
                    {selectedHR.company_founded_year && (
                      <div className="p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1.5">Founded</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm font-medium">{selectedHR.company_founded_year}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* HR Contact */}
                {selectedHR.hr_name && (
                  <div className="p-4 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl border border-purple-200/50 dark:border-purple-800/50">
                    <h3 className="text-sm font-semibold mb-3 text-purple-900 dark:text-purple-100 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      HR Contact
                    </h3>
                    <div className="p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                      <p className="font-medium text-base mb-1">{selectedHR.hr_name}</p>
                      <p className="text-sm text-muted-foreground">{selectedHR.hr_email}</p>
                    </div>
                  </div>
                )}

                {/* Job Description */}
                {selectedHR.job_description && (
                  <div className="p-4 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl border border-green-200/50 dark:border-green-800/50">
                    <h3 className="text-sm font-semibold mb-3 text-green-900 dark:text-green-100 flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Job Description
                    </h3>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">{selectedHR.job_description}</p>
                  </div>
                )}

                {/* Key Skills */}
                {selectedHR.key_skills && (
                  <div className="p-4 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl border border-amber-200/50 dark:border-amber-800/50">
                    <h3 className="text-sm font-semibold mb-3 text-amber-900 dark:text-amber-100 flex items-center gap-2">
                      <span className="text-base">⚡</span>
                      Key Skills Required
                    </h3>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">{selectedHR.key_skills}</p>
                  </div>
                )}

                {/* Date Added */}
                <div className="pt-4 border-t flex items-center justify-between">
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    Added on {new Date(selectedHR.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>

                {/* Action Buttons - At Bottom */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={handleResumeAnalyzerClick}
                    className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300 hover-scale"
                  >
                    <span className="mr-2">📄</span>
                    Resume Analyzer
                  </Button>
                  <Button
                    onClick={handleAutomateJobClick}
                    variant="outline"
                    className="flex-1 h-12 text-base font-semibold border-2 hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10 transition-all duration-300 hover-scale"
                  >
                    <span className="mr-2">🤖</span>
                    Automate Job
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Automate Job - Upload Documents Dialog */}
        <Dialog open={isAutomateJobDialogOpen} onOpenChange={setIsAutomateJobDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                Upload Documents
              </DialogTitle>
              <DialogDescription>
                Upload your finalized resume and cover letter (optional) for {selectedHR?.company_name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* Job Info Preview */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-semibold mb-2">Job Application:</p>
                <p className="text-base font-bold">{selectedHR?.company_name}</p>
                <p className="text-sm text-muted-foreground">{selectedHR?.job_title}</p>
              </div>

              {/* Resume Upload - Required */}
              <div className="space-y-2">
                <label htmlFor="resume-upload-automate" className="block">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium">Resume</span>
                    <Badge variant="destructive" className="text-xs">Required</Badge>
                    <Badge variant="outline" className="text-xs">PDF Only</Badge>
                  </div>
                  <div className="border-2 border-dashed border-primary/40 rounded-xl p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all duration-300">
                    {resumeFile ? (
                      <div className="space-y-2">
                        <FileText className="h-10 w-10 text-primary mx-auto" />
                        <p className="text-sm font-medium">{resumeFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(resumeFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-10 w-10 text-muted-foreground mx-auto" />
                        <p className="text-sm font-medium">Click to upload resume</p>
                        <p className="text-xs text-muted-foreground">PDF format recommended</p>
                      </div>
                    )}
                  </div>
                  <Input
                    id="resume-upload-automate"
                    type="file"
                    accept="application/pdf"
                    onChange={handleResumeFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Cover Letter Upload - Optional */}
              <div className="space-y-2">
                <label htmlFor="cover-letter-upload" className="block">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium">Cover Letter</span>
                    <Badge variant="secondary" className="text-xs">Optional</Badge>
                    <Badge variant="outline" className="text-xs">PDF Only</Badge>
                  </div>
                  <div className="border-2 border-dashed border-muted-foreground/40 rounded-xl p-6 text-center cursor-pointer hover:border-muted-foreground hover:bg-muted/30 transition-all duration-300">
                    {coverLetterFile ? (
                      <div className="space-y-2">
                        <FileText className="h-10 w-10 text-primary mx-auto" />
                        <p className="text-sm font-medium">{coverLetterFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(coverLetterFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-10 w-10 text-muted-foreground mx-auto" />
                        <p className="text-sm font-medium">Click to upload cover letter</p>
                        <p className="text-xs text-muted-foreground">PDF format recommended</p>
                      </div>
                    )}
                  </div>
                  <Input
                    id="cover-letter-upload"
                    type="file"
                    accept="application/pdf"
                    onChange={handleCoverLetterFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsAutomateJobDialogOpen(false)}
                  className="flex-1"
                  disabled={isUploadingDocuments}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUploadDocuments}
                  disabled={!resumeFile || isUploadingDocuments}
                  className="flex-1 bg-gradient-to-r from-primary to-primary/80"
                >
                  {isUploadingDocuments ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Save Documents
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Resume Upload Dialog */}
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                Upload Your Resume
              </DialogTitle>
              <DialogDescription>
                Upload your resume to analyze it against {selectedHR?.company_name}'s job requirements
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* Job Info Preview */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-semibold mb-2">Analyzing for:</p>
                <p className="text-base font-bold">{selectedHR?.company_name}</p>
                <p className="text-sm text-muted-foreground">{selectedHR?.job_title}</p>
              </div>

              {/* File Upload */}
              <div className="space-y-3">
                <label htmlFor="resume-upload" className="block">
                  <div className="border-2 border-dashed border-primary/40 rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all duration-300">
                    {selectedFile ? (
                      <div className="space-y-2">
                        <FileText className="h-12 w-12 text-primary mx-auto" />
                        <p className="text-sm font-medium">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                        <p className="text-sm font-medium">Click to upload resume</p>
                        <p className="text-xs text-muted-foreground">
                          Supported: .doc, .docx (Max 10MB)
                        </p>
                      </div>
                    )}
                  </div>
                  <Input
                    id="resume-upload"
                    type="file"
                    accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsUploadDialogOpen(false)}
                  className="flex-1"
                  disabled={isAnalyzing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAnalyzeResume}
                  disabled={!selectedFile || isAnalyzing}
                  className="flex-1 bg-gradient-to-r from-primary to-primary/80"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Analyze Resume
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Analysis Result Dialog */}
        <Dialog open={isAnalysisDialogOpen} onOpenChange={setIsAnalysisDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30">
                  <FileText className="h-7 w-7 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">Resume Analysis Report</div>
                  <div className="text-sm font-normal text-muted-foreground mt-1">
                    {selectedHR?.company_name} - {selectedHR?.job_title}
                  </div>
                </div>
              </DialogTitle>
            </DialogHeader>

            {parsedAnalysis && (
              <div className="space-y-6 mt-6 animate-fade-in">
                {/* Match Score Section */}
                <div className="relative overflow-hidden p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl border-2 border-blue-200 dark:border-blue-800">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full -translate-y-32 translate-x-32" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2 mb-2">
                          <Target className="h-6 w-6" />
                          Overall Match Score
                        </h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          How well your resume aligns with the job requirements
                        </p>
                      </div>
                      <div className="text-center">
                        <div className="text-6xl font-bold text-blue-600 dark:text-blue-400">
                          {parsedAnalysis.score}
                        </div>
                        <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                          out of 100
                        </div>
                      </div>
                    </div>
                    <Progress value={parsedAnalysis.score} className="h-3" />
                  </div>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Key Strengths */}
                  <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-2xl border-2 border-green-200 dark:border-green-800">
                    <h3 className="text-lg font-bold text-green-900 dark:text-green-100 flex items-center gap-2 mb-4">
                      <CheckCircle2 className="h-5 w-5" />
                      Key Strengths
                    </h3>
                    <div className="space-y-3">
                      {parsedAnalysis.strengths.map((strength, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-white/60 dark:bg-gray-900/60 rounded-lg hover:bg-white dark:hover:bg-gray-900 transition-all">
                          <div className="mt-0.5 h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                          <p className="text-sm leading-relaxed">{strength}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Gaps & Missing */}
                  <div className="p-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 rounded-2xl border-2 border-orange-200 dark:border-orange-800">
                    <h3 className="text-lg font-bold text-orange-900 dark:text-orange-100 flex items-center gap-2 mb-4">
                      <AlertCircle className="h-5 w-5" />
                      Areas for Improvement
                    </h3>
                    <div className="space-y-3">
                      {parsedAnalysis.gaps.map((gap, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-white/60 dark:bg-gray-900/60 rounded-lg hover:bg-white dark:hover:bg-gray-900 transition-all">
                          <div className="mt-0.5 h-6 w-6 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                            <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          </div>
                          <p className="text-sm leading-relaxed">{gap}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Optimization Suggestions */}
                <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-2xl border-2 border-purple-200 dark:border-purple-800">
                  <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100 flex items-center gap-2 mb-4">
                    <Lightbulb className="h-5 w-5" />
                    Optimization Suggestions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {parsedAnalysis.suggestions.map((suggestion, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-4 bg-white/60 dark:bg-gray-900/60 rounded-xl hover:bg-white dark:hover:bg-gray-900 transition-all group">
                        <div className="mt-0.5 h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{idx + 1}</span>
                        </div>
                        <p className="text-sm leading-relaxed">{suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Keywords */}
                <div className="p-6 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 rounded-2xl border-2 border-cyan-200 dark:border-cyan-800">
                  <h3 className="text-lg font-bold text-cyan-900 dark:text-cyan-100 flex items-center gap-2 mb-4">
                    <TrendingUp className="h-5 w-5" />
                    Recommended Keywords
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {parsedAnalysis.keywords.map((keyword, idx) => (
                      <Badge 
                        key={idx} 
                        className="px-4 py-2 text-sm bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-600 cursor-default"
                      >
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Overall Recommendation */}
                {parsedAnalysis.recommendation && (
                  <div className="p-6 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 rounded-2xl border-2 border-amber-200 dark:border-amber-800">
                    <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2 mb-4">
                      <Target className="h-5 w-5" />
                      Overall Recommendation
                    </h3>
                    <p className="text-base leading-relaxed p-4 bg-white/60 dark:bg-gray-900/60 rounded-xl">
                      {parsedAnalysis.recommendation}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6 border-t-2">
                  <Button
                    onClick={handleRedefineResume}
                    disabled={isRedefining || !selectedFile}
                    className="flex-1 h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {isRedefining ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Redefining...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-5 w-5" />
                        Redefine Resume
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleSaveReport}
                    disabled={isSaving}
                    variant="outline"
                    className="flex-1 h-14 text-lg font-semibold border-2 hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10 transition-all duration-300"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-5 w-5" />
                        Save Report
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* View Saved Report Dialog */}
        <Dialog open={isViewReportDialogOpen} onOpenChange={setIsViewReportDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-teal-500/20 rounded-xl border border-cyan-500/30">
                  <FileText className="h-7 w-7 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">Saved Analysis Report</div>
                  <div className="text-sm font-normal text-muted-foreground mt-1">
                    {selectedHR?.company_name} - {selectedHR?.job_title}
                  </div>
                </div>
              </DialogTitle>
            </DialogHeader>

            {parsedAnalysis && (
              <div className="space-y-6 mt-6 animate-fade-in">
                {/* Match Score Section */}
                <div className="relative overflow-hidden p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl border-2 border-blue-200 dark:border-blue-800">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full -translate-y-32 translate-x-32" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2 mb-2">
                          <Target className="h-6 w-6" />
                          Overall Match Score
                        </h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          How well your resume matches the job requirements
                        </p>
                      </div>
                      <div className="text-6xl font-black text-blue-600 dark:text-blue-400">
                        {parsedAnalysis.score}%
                      </div>
                    </div>
                    <Progress value={parsedAnalysis.score} className="h-3" />
                  </div>
                </div>

                {/* Key Strengths & Gaps Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Key Strengths */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 bg-green-500/10 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="text-lg font-bold text-green-900 dark:text-green-100">
                        Key Strengths
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {parsedAnalysis.strengths.length > 0 ? (
                        parsedAnalysis.strengths.map((strength, index) => (
                          <div
                            key={index}
                            className="p-4 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800 hover:shadow-md transition-all"
                          >
                            <div className="flex gap-3">
                              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-green-900 dark:text-green-100">
                                {strength}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No specific strengths identified</p>
                      )}
                    </div>
                  </div>

                  {/* Areas for Improvement */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 bg-orange-500/10 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <h3 className="text-lg font-bold text-orange-900 dark:text-orange-100">
                        Areas for Improvement
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {parsedAnalysis.gaps.length > 0 ? (
                        parsedAnalysis.gaps.map((gap, index) => (
                          <div
                            key={index}
                            className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-xl border border-orange-200 dark:border-orange-800 hover:shadow-md transition-all"
                          >
                            <div className="flex gap-3">
                              <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-orange-900 dark:text-orange-100">
                                {gap}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground italic">No gaps identified</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Optimization Suggestions */}
                {parsedAnalysis.suggestions.length > 0 && (
                  <div className="space-y-4 p-6 bg-purple-50 dark:bg-purple-950/20 rounded-2xl border-2 border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 bg-purple-500/10 rounded-lg">
                        <Lightbulb className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100">
                        Optimization Suggestions
                      </h3>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      {parsedAnalysis.suggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="p-4 bg-white dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-700 hover:shadow-md transition-all"
                        >
                          <div className="flex gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                              <span className="text-sm font-bold text-purple-700 dark:text-purple-300">
                                {index + 1}
                              </span>
                            </div>
                            <p className="text-sm text-purple-900 dark:text-purple-100 pt-1">
                              {suggestion}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Keywords */}
                {parsedAnalysis.keywords.length > 0 && (
                  <div className="space-y-4 p-6 bg-cyan-50 dark:bg-cyan-950/20 rounded-2xl border-2 border-cyan-200 dark:border-cyan-800">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 bg-cyan-500/10 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <h3 className="text-lg font-bold text-cyan-900 dark:text-cyan-100">
                        Recommended Keywords
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {parsedAnalysis.keywords.map((keyword, index) => (
                        <Badge
                          key={index}
                          className="px-4 py-2 text-sm bg-cyan-100 dark:bg-cyan-900/50 text-cyan-900 dark:text-cyan-100 border-cyan-300 dark:border-cyan-700 hover:bg-cyan-200 dark:hover:bg-cyan-900/70"
                          variant="outline"
                        >
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Overall Recommendation */}
                {parsedAnalysis.recommendation && (
                  <div className="p-6 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 rounded-2xl border-2 border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-amber-500/10 rounded-lg flex-shrink-0">
                        <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100 mb-2">
                          Overall Recommendation
                        </h3>
                        <p className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed">
                          {parsedAnalysis.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Close Button */}
                <div className="flex pt-6 border-t-2">
                  <Button
                    onClick={() => setIsViewReportDialogOpen(false)}
                    variant="outline"
                    className="w-full h-14 text-lg font-semibold border-2"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Redefined Resume Dialog */}
        <Dialog open={isRedefinedResumeDialogOpen} onOpenChange={setIsRedefinedResumeDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-xl border border-emerald-500/30">
                  <FileText className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">Your Redefined Resume</div>
                  <div className="text-sm font-normal text-muted-foreground mt-1">
                    Optimized for {selectedHR?.company_name} - {selectedHR?.job_title}
                  </div>
                </div>
              </DialogTitle>
              <DialogDescription>
                Review your optimized resume content below. Click download when ready.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-6">
              {/* Resume Content Display */}
              <div className="p-8 bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-inner">
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-900 dark:text-slate-100">
                    {redefinedResumeContent}
                  </pre>
                </div>
              </div>

              {/* Download Button */}
              <div className="flex gap-4 pt-4 border-t-2">
                <Button
                  onClick={() => setIsRedefinedResumeDialogOpen(false)}
                  variant="outline"
                  className="flex-1 h-14 text-lg font-semibold border-2"
                >
                  Close
                </Button>
                <Button
                  onClick={handleDownloadRedefinedResume}
                  disabled={isDownloading}
                  className="flex-1 h-14 text-lg font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-5 w-5" />
                      Download Resume (Word)
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ManageHRDetails;
