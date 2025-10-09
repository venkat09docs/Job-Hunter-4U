import { useState } from "react";
import { Upload, FileText, Sparkles, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function ResumeAnalyzer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    if (file.type !== "application/pdf") {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a PDF file only.",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-purple-950 dark:to-indigo-950">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary to-primary-light rounded-lg">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Resume Analyzer</h1>
              <p className="text-muted-foreground">Get AI-powered insights on your resume</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Upload Resume Card */}
          <Card className="shadow-lg border-2 hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Upload Resume
              </CardTitle>
              <CardDescription>
                Upload your resume in PDF format (Max 10MB)
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
                  accept=".pdf"
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
                          PDF files only, up to 10MB
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
                      <li>Only PDF format accepted</li>
                      <li>Maximum file size: 10MB</li>
                      <li>Ensure text is readable and not image-based</li>
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
        <div className="mt-8 text-center">
          <Button
            size="lg"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="px-12 h-14 text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
            variant="premium"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            {isAnalyzing ? "Analyzing..." : "Analyze Resume"}
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">
            Get instant AI-powered feedback on your resume match
          </p>
        </div>

        {/* Analysis Results */}
        {analysisResult && (
          <Card className="mt-8 shadow-xl border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <CheckCircle className="h-6 w-6 text-success" />
                Analysis Results
              </CardTitle>
              <CardDescription>
                AI-powered resume analysis based on your job description
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div className="whitespace-pre-wrap bg-accent/30 p-6 rounded-lg">
                  {analysisResult}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
  );
}
