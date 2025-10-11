import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Sparkles, AlertCircle, CheckCircle, TrendingUp, AlertTriangle, Lightbulb, Target, Download, Edit, Loader2, FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CircularScoreIndicator } from "@/components/CircularScoreIndicator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Document, Paragraph, TextRun, Packer } from "docx";
import jsPDF from "jspdf";

interface ResumeAnalyzerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobDescription: string;
  keySkills: string[];
  jobTitle: string;
  companyName?: string;
}

export const ResumeAnalyzerDialog = ({
  open,
  onOpenChange,
  jobDescription,
  keySkills,
  jobTitle,
  companyName
}: ResumeAnalyzerDialogProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isRedefining, setIsRedefining] = useState(false);
  const [redefinedResume, setRedefinedResume] = useState<string | null>(null);
  const { toast } = useToast();

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
    if (!selectedFile) {
      toast({
        variant: "destructive",
        title: "Resume required",
        description: "Please upload your resume first.",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

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

      setAnalysisResult(data.analysis);
      
      toast({
        title: "Analysis complete!",
        description: "Your resume has been analyzed successfully.",
      });
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

  const resetDialog = () => {
    setSelectedFile(null);
    setAnalysisResult(null);
    setIsAnalyzing(false);
    setRedefinedResume(null);
    setIsRedefining(false);
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

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('redefine-resume', {
        body: {
          resumeBase64,
          jobDescription: jobDescription.trim(),
          keySkills: keySkills,
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setRedefinedResume(data.redefinedResume);
      
      toast({
        title: "Resume redefined!",
        description: "Your resume has been optimized for this job description.",
      });
    } catch (error) {
      console.error('Redefine error:', error);
      toast({
        variant: "destructive",
        title: "Redefinition failed",
        description: error instanceof Error ? error.message : "Failed to redefine resume. Please try again.",
      });
    } finally {
      setIsRedefining(false);
    }
  };

  const handleDownloadWord = async () => {
    if (!redefinedResume) return;
    
    try {
      // Split resume into paragraphs
      const paragraphs = redefinedResume.split('\n').filter(p => p.trim());
      
      // Create document with paragraphs
      const doc = new Document({
        sections: [{
          properties: {},
          children: paragraphs.map(text => 
            new Paragraph({
              children: [new TextRun(text)],
              spacing: { after: 200 }
            })
          )
        }]
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'redefined-resume.docx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Word document downloaded",
        description: "Your redefined resume has been downloaded as .docx",
      });
    } catch (error) {
      console.error('Error generating Word document:', error);
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "Failed to generate Word document",
      });
    }
  };

  const handleDownloadPDF = () => {
    if (!redefinedResume) return;
    
    try {
      const pdf = new jsPDF();
      const lines = redefinedResume.split('\n');
      
      let yPosition = 15;
      const lineHeight = 7;
      const margin = 15;
      const maxWidth = 180;
      
      lines.forEach(line => {
        if (yPosition > 280) {
          pdf.addPage();
          yPosition = 15;
        }
        
        const wrappedLines = pdf.splitTextToSize(line || ' ', maxWidth);
        pdf.text(wrappedLines, margin, yPosition);
        yPosition += wrappedLines.length * lineHeight;
      });
      
      pdf.save('redefined-resume.pdf');
      toast({
        title: "PDF downloaded",
        description: "Your redefined resume has been downloaded as PDF",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "Failed to generate PDF",
      });
    }
  };

  const handleSaveReport = async () => {
    if (!analysisResult) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please sign in to save the report",
        });
        return;
      }

      // Parse the analysis to save as structured data
      const parsedAnalysis = parseAnalysis(analysisResult);

      // Save to database
      const { error } = await supabase
        .from('resume_analysis_reports')
        .insert({
          user_id: user.id,
          job_title: jobTitle,
          company_name: companyName || 'Unknown Company',
          job_description: jobDescription,
          key_skills: keySkills,
          analysis_result: {
            raw: analysisResult,
            parsed: parsedAnalysis
          },
          resume_file_name: selectedFile?.name || 'resume.docx'
        });

      if (error) throw error;

      toast({
        title: "Report saved successfully",
        description: "Analysis report has been saved to your account",
      });
    } catch (error) {
      console.error('Error saving report:', error);
      toast({
        variant: "destructive",
        title: "Failed to save report",
        description: error instanceof Error ? error.message : "Please try again",
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
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetDialog();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Resume Analyzer
          </DialogTitle>
        </DialogHeader>

        {!analysisResult && !redefinedResume ? (
          <div className="space-y-6">
            {/* Job Info */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <h3 className="font-semibold text-sm">Analyzing Against:</h3>
              <div className="flex flex-wrap gap-2">
                {keySkills.slice(0, 5).map((skill, index) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                  </Badge>
                ))}
                {keySkills.length > 5 && (
                  <Badge variant="outline">+{keySkills.length - 5} more</Badge>
                )}
              </div>
            </div>

            {/* Upload Area */}
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
                id="resume-upload-dialog"
              />
              <label htmlFor="resume-upload-dialog" className="cursor-pointer">
                {!selectedFile ? (
                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
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

            {/* Analyze Button */}
            <Button
              size="lg"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !selectedFile}
              className="w-full"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              {isAnalyzing ? "Analyzing..." : "Analyze Resume"}
            </Button>
          </div>
        ) : redefinedResume ? (
          <div className="space-y-6">
            {/* Redefined Resume Display */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                Redefined Resume
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your resume has been optimized to match the job description with highlighted key skills.
              </p>
              <div className="bg-background p-4 rounded border max-h-[400px] overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm font-mono">{redefinedResume}</pre>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={resetDialog}
              >
                Start Over
              </Button>
              <Button
                variant="default"
                onClick={handleDownloadWord}
              >
                <FileDown className="h-4 w-4 mr-2" />
                Download Word
              </Button>
              <Button
                variant="default"
                onClick={handleDownloadPDF}
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Score Section */}
            {analysis && (
              <>
                <div className="flex items-center justify-center py-6">
                  <CircularScoreIndicator score={analysis.score} size={120} />
                </div>

                {/* Analysis Sections */}
                <div className="grid gap-4">
                  {/* Strengths */}
                  {analysis.strengths.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <CheckCircle className="h-5 w-5 text-success" />
                          Key Strengths
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {analysis.strengths.map((strength: string, index: number) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <span className="text-success mt-1">•</span>
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Gaps */}
                  {analysis.gaps.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <AlertTriangle className="h-5 w-5 text-warning" />
                          Gaps & Missing Qualifications
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {analysis.gaps.map((gap: string, index: number) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <span className="text-warning mt-1">•</span>
                              <span>{gap}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Suggestions */}
                  {analysis.suggestions.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Lightbulb className="h-5 w-5 text-primary" />
                          Optimization Suggestions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {analysis.suggestions.map((suggestion: string, index: number) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <span className="text-primary mt-1">•</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Keywords */}
                  {analysis.keywords.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Target className="h-5 w-5 text-info" />
                          Recommended Keywords
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {analysis.keywords.map((keyword: string, index: number) => (
                            <Badge key={index} variant="secondary">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Overall Recommendation */}
                  {analysis.recommendation && (
                    <Card className="border-primary/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <TrendingUp className="h-5 w-5 text-primary" />
                          Overall Recommendation
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{analysis.recommendation}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleRedefineResume}
                    disabled={isRedefining || !selectedFile}
                  >
                    {isRedefining ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Redefining...
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4 mr-2" />
                        Redefine Your Resume
                      </>
                    )}
                  </Button>
                  <Button
                    variant="default"
                    className="flex-1"
                    onClick={handleSaveReport}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Save This Report
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
