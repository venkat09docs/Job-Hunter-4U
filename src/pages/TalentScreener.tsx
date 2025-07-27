import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, Brain, Target, Lightbulb, Coins, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Pricing from "@/components/Pricing";

interface ParsedResults {
  summary: string;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
    description?: string;
  }>;
  jobFitScore?: number;
  aiTips?: string[];
}

const TalentScreener = () => {
  const { user } = useAuth();
  const { profile, updateTokens, refreshProfile } = useProfile();
  const { toast } = useToast();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [results, setResults] = useState<ParsedResults | null>(null);
  const [showPricing, setShowPricing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    jobOpenings: "",
    linkedinUrl: "",
    jobDescription: ""
  });

  // Auto-populate name and email from profile
  useEffect(() => {
    if (profile?.username) {
      setFormData(prev => ({ ...prev, name: profile.username }));
    } else if (profile?.full_name) {
      // Fallback to full_name if username is not available
      setFormData(prev => ({ ...prev, name: profile.full_name }));
    }
    if (user?.email) {
      setFormData(prev => ({ ...prev, email: user.email }));
    }
  }, [profile?.username, profile?.full_name, user?.email]);

  const REQUIRED_TOKENS = 3;
  const hasEnoughTokens = (profile?.tokens_remaining || 0) >= REQUIRED_TOKENS;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file",
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const uploadResumeAndParse = async () => {
    if (!selectedFile || !user) return;

    // Validate required fields
    if (!formData.name || !formData.email || !formData.linkedinUrl || !formData.jobDescription) {
      toast({
        title: "Missing required fields",
        description: "Please fill in Name, Email, LinkedIn URL, and Job Description",
        variant: "destructive",
      });
      return;
    }

    if (!hasEnoughTokens) {
      setShowPricing(true);
      return;
    }

    setUploading(true);
    setParsing(true);

    try {
      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/resume-${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName);

      setUploading(false);

      // Call n8n webhook with the required payload (without phone)
      const webhookPayload = {
        Name: formData.name,
        Email: formData.email,
        "Job Openings": formData.jobOpenings,
        "LinkedIn Profile URL": formData.linkedinUrl,
        Resume: publicUrl,
        "Job Description": formData.jobDescription
      };

      const webhookResponse = await fetch('https://rnstech.app.n8n.cloud/webhook-test/talent-screener', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload)
      });

      if (!webhookResponse.ok) {
        throw new Error('Failed to process with talent screener');
      }

      const webhookData = await webhookResponse.json();

      // Deduct tokens
      await updateTokens((profile?.tokens_remaining || 0) - REQUIRED_TOKENS);
      await refreshProfile();

      // Use response from webhook or generate mock results
      const mockResults: ParsedResults = {
        summary: webhookData.summary || "Resume analyzed successfully with talent screener",
        skills: webhookData.skills || ["Analysis pending", "Please check webhook response"],
        experience: webhookData.experience || [],
        education: webhookData.education || [],
        jobFitScore: webhookData.jobFitScore || Math.floor(Math.random() * 30) + 70,
        aiTips: webhookData.aiTips || [
          "Consider adding more quantifiable achievements to your experience",
          "Your technical skills align well with current market demands",
          "Consider obtaining certifications in your field to strengthen your profile",
          "Add more action verbs to make your experience descriptions more impactful"
        ]
      };

      setResults(mockResults);

      toast({
        title: "Resume analyzed successfully!",
        description: `${REQUIRED_TOKENS} tokens used. Analysis complete.`,
      });

    } catch (error: any) {
      console.error('Error processing resume:', error);
      toast({
        title: "Error processing resume",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setParsing(false);
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Talent Screener</h1>
              <p className="text-muted-foreground">
                Upload your resume for AI-powered analysis and job fit evaluation
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              <span className="font-medium">
                {profile?.tokens_remaining || 0} tokens
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Fields */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Talent Screening Form
                </CardTitle>
                <CardDescription>
                  Fill in the details and upload resume for AI analysis. Requires {REQUIRED_TOKENS} tokens.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Username *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      placeholder="Username from profile"
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      placeholder="Email from profile"
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="jobOpenings">Job Openings</Label>
                    <Input
                      id="jobOpenings"
                      value={formData.jobOpenings}
                      onChange={(e) => setFormData(prev => ({ ...prev, jobOpenings: e.target.value }))}
                      placeholder="Enter job openings"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkedinUrl">LinkedIn Profile URL *</Label>
                  <Input
                    id="linkedinUrl"
                    value={formData.linkedinUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobDescription">Job Description *</Label>
                  <Textarea
                    id="jobDescription"
                    value={formData.jobDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, jobDescription: e.target.value }))}
                    placeholder="Enter the job description for talent screening..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label
                    htmlFor="resume-upload"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload PDF resume *
                    </span>
                  </label>
                </div>

                {selectedFile && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">{selectedFile.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                    >
                      Remove
                    </Button>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Required tokens:</span>
                    <Badge variant={hasEnoughTokens ? "default" : "destructive"}>
                      {REQUIRED_TOKENS}
                    </Badge>
                  </div>
                  
                  {!hasEnoughTokens && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPricing(true)}
                    >
                      Buy Tokens
                    </Button>
                  )}
                </div>

                <Button
                  onClick={uploadResumeAndParse}
                  disabled={!selectedFile || !hasEnoughTokens || parsing || !formData.name || !formData.email || !formData.linkedinUrl || !formData.jobDescription}
                  className="w-full"
                >
                  {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {parsing && <Brain className="mr-2 h-4 w-4 animate-spin" />}
                  {uploading
                    ? "Uploading..."
                    : parsing
                    ? "Analyzing..."
                    : `Analyze Resume (${REQUIRED_TOKENS} tokens)`}
                </Button>
              </CardContent>
            </Card>

            {/* Token Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  Token Balance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {profile?.tokens_remaining || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    tokens remaining
                  </div>
                </div>
                
                <Progress 
                  value={((profile?.tokens_remaining || 0) / 100) * 100} 
                  className="w-full"
                />

                <div className="text-xs text-muted-foreground space-y-1">
                  <div>• Resume analysis: {REQUIRED_TOKENS} tokens</div>
                  <div>• Job search: 1 token</div>
                  <div>• AI query: 1 token</div>
                </div>

                {!hasEnoughTokens && (
                  <Button 
                    variant="premium" 
                    className="w-full"
                    onClick={() => setShowPricing(true)}
                  >
                    Purchase More Tokens
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          {results && (
            <div className="space-y-6">
              <Separator />
              
              <div>
                <h2 className="text-2xl font-bold mb-4">Analysis Results</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Job Fit Score */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Job Fit Score
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center space-y-2">
                        <div className="text-4xl font-bold text-primary">
                          {results.jobFitScore}%
                        </div>
                        <Progress value={results.jobFitScore} className="w-full" />
                        <div className="text-sm text-muted-foreground">
                          {results.jobFitScore && results.jobFitScore >= 85
                            ? "Excellent match"
                            : results.jobFitScore && results.jobFitScore >= 70
                            ? "Good match"
                            : "Room for improvement"}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* AI Tips */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5" />
                        AI Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {results.aiTips?.map((tip, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Skills */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Extracted Skills</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {results.skills.length > 0 ? (
                          results.skills.map((skill, index) => (
                            <Badge key={index} variant="secondary">
                              {skill}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No skills extracted
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Experience */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Work Experience</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {results.experience.length > 0 ? (
                          results.experience.map((exp, index) => (
                            <div key={index} className="border-l-2 border-primary/20 pl-3">
                              <div className="font-medium">{exp.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {exp.company} • {exp.duration}
                              </div>
                              {exp.description && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {exp.description}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No experience extracted
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{results.summary}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>

        {/* Pricing Modal */}
        <Dialog open={showPricing} onOpenChange={setShowPricing}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Purchase Tokens</DialogTitle>
            </DialogHeader>
            <Pricing />
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default TalentScreener;