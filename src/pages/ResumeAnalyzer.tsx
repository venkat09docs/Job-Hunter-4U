import { useState } from "react";
import { Upload, FileText, Sparkles, AlertCircle, CheckCircle, TrendingUp, AlertTriangle, Lightbulb, Target, Award, Zap, RefreshCw, Download } from "lucide-react";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Progress } from "@/components/ui/progress";
import { CircularScoreIndicator } from "@/components/CircularScoreIndicator";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { SubscriptionUpgrade } from "@/components/SubscriptionUpgrade";
import { useResumeAnalysisUsage } from "@/hooks/useResumeAnalysisUsage";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import PricingDialog from "@/components/PricingDialog";

export default function ResumeAnalyzer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [showPricingDialog, setShowPricingDialog] = useState(false);
  const [isRedefining, setIsRedefining] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { usageInfo, loading: usageLoading, incrementUsage, refreshUsage } = useResumeAnalysisUsage();

  const handleFileSelect = (file: File) => {
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      "application/msword" // .doc
    ];
    
    if (!validTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a Word document (.doc or .docx) only.",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
      });
      return;
    }

    setSelectedFile(file);
    toast({
      title: "File uploaded",
      description: `${file.name} has been uploaded successfully.`,
    });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleAnalyze = async () => {
    // Check if user is authenticated
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to analyze your resume.",
      });
      navigate('/auth');
      return;
    }

    // Check usage limit before proceeding
    if (usageInfo && !usageInfo.canAnalyze) {
      setShowPricingDialog(true);
      toast({
        variant: "destructive",
        title: "Free limit reached",
        description: usageInfo.message,
      });
      return;
    }

    if (!selectedFile) {
      toast({
        variant: "destructive",
        title: "Resume required",
        description: "Please upload your resume first.",
      });
      return;
    }

    if (!jobDescription.trim()) {
      toast({
        variant: "destructive",
        title: "Job description required",
        description: "Please provide a job description.",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      // Convert PDF to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const base64 = reader.result?.toString().split(',')[1];
          if (base64) resolve(base64);
          else reject(new Error('Failed to read file'));
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      const resumeBase64 = await base64Promise;

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('analyze-resume', {
        body: {
          resumeBase64,
          jobDescription: jobDescription.trim(),
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      // Increment usage count after successful analysis
      const usageResult = await incrementUsage();
      
      setAnalysisResult(data.analysis);
      setShowResultsDialog(true);
      
      // Refresh usage info to update UI
      refreshUsage();
      
      // Show appropriate toast based on usage
      if (usageResult.limitReached) {
        toast({
          title: "Analysis complete!",
          description: usageResult.message,
          variant: "default",
        });
      } else {
        toast({
          title: "Analysis complete!",
          description: usageResult.message || "Your resume has been analyzed successfully.",
        });
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        variant: "destructive",
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Failed to analyze resume. Please try again.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  const handleRedefineResume = async () => {
    if (!selectedFile) {
      toast({
        variant: "destructive",
        title: "Resume required",
        description: "Please upload your resume first.",
      });
      return;
    }

    if (!jobDescription.trim()) {
      toast({
        variant: "destructive",
        title: "Job description required",
        description: "Please provide a job description.",
      });
      return;
    }

    setIsRedefining(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const base64 = reader.result?.toString().split(',')[1];
          if (base64) resolve(base64);
          else reject(new Error('Failed to read file'));
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      const resumeBase64 = await base64Promise;

      // Call the redefine-resume edge function
      const { data, error } = await supabase.functions.invoke('redefine-resume', {
        body: {
          resumeBase64,
          jobDescription: jobDescription.trim(),
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      // The redefined resume will be in data.redefinedResume
      // Download it automatically as Word document
      if (data.redefinedResume) {
        // Split the content into paragraphs
        const paragraphs = data.redefinedResume.split('\n').filter((line: string) => line.trim());
        
        // Create Word document
        const doc = new Document({
          sections: [{
            children: paragraphs.map((text: string) => 
              new Paragraph({
                children: [new TextRun(text)],
                spacing: {
                  after: 200,
                },
              })
            ),
          }],
        });

        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'redefined-resume.docx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      toast({
        title: "Resume redefined successfully!",
        description: "Your redefined resume has been downloaded as a Word document.",
      });
    } catch (error) {
      console.error('Redefine error:', error);
      toast({
        variant: "destructive",
        title: "Failed to redefine resume",
        description: error instanceof Error ? error.message : "Please try again later.",
      });
    } finally {
      setIsRedefining(false);
    }
  };

  const handleDownloadWordReport = async () => {
    if (!analysisResult || !analysis) return;

    try {
      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({
              text: "Resume Analysis Report",
              heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({ text: "" }),
            new Paragraph({
              text: "Match Score",
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `${analysis.score}/100 - ${analysis.scoreText}`,
                  bold: true,
                }),
              ],
            }),
            new Paragraph({ text: "" }),
            new Paragraph({
              text: "Key Strengths",
              heading: HeadingLevel.HEADING_2,
            }),
            ...analysis.strengths.map((strength: string) => 
              new Paragraph({
                text: `• ${strength}`,
                bullet: { level: 0 },
              })
            ),
            new Paragraph({ text: "" }),
            new Paragraph({
              text: "Gaps & Missing Qualifications",
              heading: HeadingLevel.HEADING_2,
            }),
            ...analysis.gaps.map((gap: string) => 
              new Paragraph({
                text: `• ${gap}`,
                bullet: { level: 0 },
              })
            ),
            new Paragraph({ text: "" }),
            new Paragraph({
              text: "Optimization Suggestions",
              heading: HeadingLevel.HEADING_2,
            }),
            ...analysis.suggestions.map((suggestion: string) => 
              new Paragraph({
                text: `• ${suggestion}`,
                bullet: { level: 0 },
              })
            ),
            new Paragraph({ text: "" }),
            new Paragraph({
              text: "Recommended Keywords",
              heading: HeadingLevel.HEADING_2,
            }),
            ...analysis.keywords.map((keyword: string) => 
              new Paragraph({
                text: `• ${keyword}`,
                bullet: { level: 0 },
              })
            ),
            new Paragraph({ text: "" }),
            new Paragraph({
              text: "Overall Recommendation",
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              text: analysis.recommendation,
            }),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'resume-analysis-report.docx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Report downloaded",
        description: "Your analysis report has been downloaded as a Word document.",
      });
    } catch (error) {
      console.error('Error downloading report:', error);
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "Failed to download the report. Please try again.",
      });
    }
  };

  const parseAnalysis = (text: string) => {
    const sections: any = {};
    
    // Extract match score
    const scoreMatch = text.match(/##\s*Match Score\s*\n([^\n]+)/i);
    if (scoreMatch) {
      const scoreText = scoreMatch[1];
      const scoreNum = scoreText.match(/(\d+)/);
      sections.score = scoreNum ? parseInt(scoreNum[1]) : 0;
      sections.scoreText = scoreText;
    }
    
    // Extract sections
    const extractSection = (title: string) => {
      const regex = new RegExp(`##\\s*${title}\\s*\\n([\\s\\S]*?)(?=##|$)`, 'i');
      const match = text.match(regex);
      if (match) {
        const content = match[1].trim();
        return content.split('\n').filter(line => line.trim().startsWith('-')).map(line => line.replace(/^-\s*/, '').trim());
      }
      return [];
    };
    
    sections.strengths = extractSection('Key Strengths');
    sections.gaps = extractSection('Gaps & Missing Qualifications');
    sections.suggestions = extractSection('Optimization Suggestions');
    sections.keywords = extractSection('Recommended Keywords');
    
    // Extract overall recommendation
    const recMatch = text.match(/##\s*Overall Recommendation\s*\n([^\n]+(?:\n(?!##)[^\n]+)*)/i);
    sections.recommendation = recMatch ? recMatch[1].trim() : '';
    
    return sections;
  };

  const analysis = analysisResult ? parseAnalysis(analysisResult) : null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center px-4 gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-foreground">Resume Analyzer</h1>
              <div className="ml-auto flex items-center gap-4">
                {/* Usage Badge */}
                {!usageLoading && usageInfo && (
                  <Badge 
                    variant={usageInfo.isPremium ? "default" : usageInfo.canAnalyze ? "outline" : "destructive"}
                    className="flex items-center gap-2"
                  >
                    {usageInfo.isPremium ? (
                      <>
                        <Zap className="h-3 w-3" />
                        Unlimited
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3" />
                        {usageInfo.remainingCredits} Free {usageInfo.remainingCredits === 1 ? 'Analysis' : 'Analyses'} Left
                      </>
                    )}
                  </Badge>
                )}
                <SubscriptionUpgrade />
                <UserProfileDropdown />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="flex-1 overflow-auto">
            <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-purple-950 dark:to-indigo-950">
              {/* Hero Section */}
              <div className="container mx-auto px-4 py-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-primary to-primary-light rounded-lg">
                    <Sparkles className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-muted-foreground">Get AI-powered insights on your resume</p>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="container mx-auto px-4 py-6 max-w-5xl">
                <div className="grid lg:grid-cols-2 gap-6">
          {/* Upload Resume Card */}
          <Card className="shadow-lg border-2 hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Upload Resume
              </CardTitle>
              <CardDescription>
                Upload your resume in Word format (.doc or .docx, Max 10MB)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`
                  relative border-2 border-dashed rounded-lg p-8 text-center
                  transition-all duration-300 cursor-pointer
                  ${isDragging 
                    ? "border-primary bg-primary/5 scale-105" 
                    : "border-border hover:border-primary hover:bg-accent/50"
                  }
                  ${selectedFile ? "bg-success/5 border-success" : ""}
                `}
              >
                <input
                  type="file"
                  accept=".doc,.docx"
                  onChange={handleFileInput}
                  className="hidden"
                  id="resume-upload"
                />
                <label htmlFor="resume-upload" className="cursor-pointer">
                  {!selectedFile ? (
                    <div className="space-y-4">
                      <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center">
                        <Upload className="h-8 w-8 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="text-base font-medium text-foreground mb-1">
                          Drop your resume here or click to browse
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Word documents (.doc, .docx) only, up to 10MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="mx-auto w-16 h-16 bg-success rounded-full flex items-center justify-center">
                        <FileText className="h-8 w-8 text-success-foreground" />
                      </div>
                      <div>
                        <p className="text-base font-medium text-success mb-1">
                          {selectedFile.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          removeFile();
                        }}
                        className="mt-2"
                      >
                        Remove File
                      </Button>
                    </div>
                  )}
                </label>
              </div>

              {/* File Requirements Info */}
              <div className="mt-4 p-3 bg-info/10 border border-info/20 rounded-lg">
                <div className="flex gap-2">
                  <AlertCircle className="h-4 w-4 text-info mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium text-info mb-1">File Requirements:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>Only Word documents (.doc, .docx) accepted</li>
                      <li>Maximum file size: 10MB</li>
                      <li>Ensure document is properly formatted</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Job Description Card */}
          <Card className="shadow-lg border-2 hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Job Description
              </CardTitle>
              <CardDescription>
                Paste the job description you're targeting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="job-description">Job Description</Label>
                <Textarea
                  id="job-description"
                  placeholder="Paste the complete job description here...&#10;&#10;Include:&#10;• Required skills&#10;• Qualifications&#10;• Responsibilities&#10;• Experience requirements"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-[280px] resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {jobDescription.length} characters
                </p>
              </div>

              {/* Tips */}
              <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <div className="flex gap-2">
                  <Sparkles className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium text-warning mb-1">Pro Tips:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>Include all sections of the job posting</li>
                      <li>Don't skip required skills and qualifications</li>
                      <li>More detail = better analysis</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analyze Button */}
        <div className="mt-8 text-center space-y-3">
          <Button
            size="lg"
            onClick={handleAnalyze}
            disabled={isAnalyzing || usageLoading}
            className="px-12 h-14 text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
            variant="premium"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            {isAnalyzing ? "Analyzing..." : "Analyze Resume"}
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">
            Get instant AI-powered feedback on your resume match
          </p>
          
          {/* Usage Warning */}
          {!usageLoading && usageInfo && !usageInfo.isPremium && usageInfo.canAnalyze && (
            <div className="max-w-md mx-auto p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <div className="flex items-center gap-2 justify-center">
                <AlertCircle className="h-4 w-4 text-warning" />
                <p className="text-sm text-warning font-medium">
                  {usageInfo.message}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Analysis Results Dialog */}
        <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Resume Analysis Report</DialogTitle>
              <DialogDescription>
                Detailed analysis of your resume against the job description
              </DialogDescription>
            </DialogHeader>

            {analysisResult && analysis && (
          <div className="mt-8 space-y-6 animate-fade-in">
            {/* Header Card with Score */}
            <Card className="shadow-2xl border-2 border-primary/30 overflow-hidden">
              <div className="bg-gradient-to-r from-primary via-primary-light to-primary p-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="text-center md:text-left">
                    <CardTitle className="text-3xl text-white font-bold mb-2">
                      Resume Analysis Report
                    </CardTitle>
                    <CardDescription className="text-white/90 text-lg">
                      AI-Powered Insights & Recommendations
                    </CardDescription>
                  </div>
                  
                  {/* Circular Score Indicator */}
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                    <CircularScoreIndicator score={analysis.score || 0} size={180} />
                  </div>
                </div>
              </div>
            </Card>

            {/* Key Strengths Section */}
            {analysis.strengths && analysis.strengths.length > 0 && (
              <Card className="border-2 border-success/30 bg-success/5 animate-scale-in">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-success/20 rounded-xl">
                      <CheckCircle className="h-7 w-7 text-success" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-success">Key Strengths</CardTitle>
                      <CardDescription className="text-lg">What makes your resume stand out</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {analysis.strengths.map((strength: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 p-4 bg-background rounded-lg border border-success/20 hover:border-success/40 transition-colors">
                        <div className="flex-shrink-0 w-8 h-8 bg-success/20 rounded-full flex items-center justify-center">
                          <span className="text-success font-bold">{idx + 1}</span>
                        </div>
                        <p className="text-foreground leading-relaxed pt-1">{strength}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Gaps & Missing Qualifications */}
            {analysis.gaps && analysis.gaps.length > 0 && (
              <Card className="border-2 border-warning/30 bg-warning/5 animate-scale-in">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-warning/20 rounded-xl">
                      <AlertTriangle className="h-7 w-7 text-warning" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-warning">Gaps & Missing Qualifications</CardTitle>
                      <CardDescription className="text-lg">Areas that need improvement</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {analysis.gaps.map((gap: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 p-4 bg-background rounded-lg border border-warning/20 hover:border-warning/40 transition-colors">
                        <div className="flex-shrink-0 w-8 h-8 bg-warning/20 rounded-full flex items-center justify-center">
                          <AlertTriangle className="h-4 w-4 text-warning" />
                        </div>
                        <p className="text-foreground leading-relaxed pt-1">{gap}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Optimization Suggestions */}
            {analysis.suggestions && analysis.suggestions.length > 0 && (
              <Card className="border-2 border-info/30 bg-info/5 animate-scale-in">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-info/20 rounded-xl">
                      <Lightbulb className="h-7 w-7 text-info" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-info">Optimization Suggestions</CardTitle>
                      <CardDescription className="text-lg">Actionable steps to improve your resume</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {analysis.suggestions.map((suggestion: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 p-4 bg-background rounded-lg border border-info/20 hover:border-info/40 transition-colors hover-scale">
                        <div className="flex-shrink-0 w-8 h-8 bg-info/20 rounded-full flex items-center justify-center">
                          <Lightbulb className="h-4 w-4 text-info" />
                        </div>
                        <p className="text-foreground leading-relaxed pt-1">{suggestion}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommended Keywords */}
            {analysis.keywords && analysis.keywords.length > 0 && (
              <Card className="border-2 border-primary/30 bg-primary/5 animate-scale-in">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/20 rounded-xl">
                      <Target className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-primary">Recommended Keywords</CardTitle>
                      <CardDescription className="text-lg">Important terms to include in your resume</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {analysis.keywords.map((keyword: string, idx: number) => (
                      <div key={idx} className="px-4 py-2 bg-primary/10 border-2 border-primary/30 rounded-full hover:bg-primary/20 transition-colors hover-scale">
                        <span className="text-primary font-semibold">{keyword}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Overall Recommendation */}
            {analysis.recommendation && (
              <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-primary-light/10 animate-scale-in">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/20 rounded-xl">
                      <Award className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-primary">Overall Recommendation</CardTitle>
                      <CardDescription className="text-lg">Summary and next steps</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="p-6 bg-background rounded-lg border border-primary/20">
                    <p className="text-foreground leading-relaxed text-lg">{analysis.recommendation}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <Card className="border-2 border-border mt-6">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={handleDownloadWordReport}
                    variant="outline"
                    size="lg"
                    className="flex-1"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download Word Report
                  </Button>
                  <Button
                    onClick={handleRedefineResume}
                    disabled={isRedefining}
                    size="lg"
                    className="flex-1"
                  >
                    {isRedefining ? (
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-5 w-5 mr-2" />
                    )}
                    {isRedefining ? "Redefining..." : "Redefine Resume"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Features Grid */}
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Sparkles,
              title: "AI-Powered Analysis",
              description: "Advanced algorithms analyze your resume against job requirements",
              color: "text-primary"
            },
            {
              icon: FileText,
              title: "Detailed Insights",
              description: "Get comprehensive feedback on skills match and improvements",
              color: "text-success"
            },
            {
              icon: Upload,
              title: "Quick & Easy",
              description: "Simple upload process with instant results in seconds",
              color: "text-info"
            }
          ].map((feature, index) => (
            <Card key={index} className="text-center border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <div className={`mx-auto w-12 h-12 bg-gradient-to-br from-primary/10 to-primary-light/10 rounded-full flex items-center justify-center mb-4`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Dialog for Free Limit Reached */}
        <Dialog open={showPricingDialog} onOpenChange={setShowPricingDialog}>
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-center text-2xl">Upgrade to Continue Analyzing</DialogTitle>
              <DialogDescription className="text-center">
                You've used all 3 free resume analyses. Upgrade to get unlimited access to AI-powered resume analysis and all premium features.
              </DialogDescription>
            </DialogHeader>
            <PricingDialog />
          </DialogContent>
        </Dialog>
      </div>
    </SidebarProvider>
  );
}
