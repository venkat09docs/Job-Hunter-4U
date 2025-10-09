import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, CheckCircle, Link as LinkIcon, Loader2 } from "lucide-react";
import { validateFile, FILE_VALIDATION_RULES } from "@/utils/fileValidation";

interface ParsedData {
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
}

export default function BuildDigitalProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [portfolioUrl, setPortfolioUrl] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateFile(file, FILE_VALIDATION_RULES.resume);
    if (!validation.isValid) {
      toast({
        title: "Invalid File",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setParsedData(null);
    setPortfolioUrl("");
  };

  const handleUploadAndParse = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to continue",
          variant: "destructive",
        });
        return;
      }

      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      setUploadProgress(30);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName);

      setUploadProgress(60);
      setIsParsing(true);

      // Call parse-resume edge function
      const { data: parseData, error: parseError } = await supabase.functions.invoke('parse-resume', {
        body: {
          resumeUrl: publicUrl,
          userId: user.id
        }
      });

      if (parseError) throw parseError;

      setUploadProgress(100);
      setParsedData(parseData.data);

      // Get user profile to create shareable URL
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', user.id)
        .single();

      if (profile?.username) {
        const shareUrl = `${window.location.origin}/profile/${profile.username}`;
        setPortfolioUrl(shareUrl);
      }

      toast({
        title: "Success!",
        description: "Your resume has been parsed and your digital portfolio is ready.",
      });

    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process resume",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setIsParsing(false);
      setUploadProgress(0);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(portfolioUrl);
    toast({
      title: "Copied!",
      description: "Portfolio URL copied to clipboard",
    });
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex-1">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold">Build Digital Profile</h1>
            </div>
            <UserProfileDropdown />
          </header>

          <main className="container mx-auto p-6 space-y-6">
            {/* Instructions Card */}
            <Card>
              <CardHeader>
                <CardTitle>Transform Your Resume into a Digital Portfolio</CardTitle>
                <CardDescription>
                  Upload your resume (PDF or Word) and we'll automatically extract your information
                  to create a beautiful, shareable digital portfolio.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Upload Card */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Your Resume</CardTitle>
                <CardDescription>
                  Supported formats: PDF, DOC, DOCX (Max size: 5MB)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resume">Select Resume File</Label>
                  <div className="flex gap-4">
                    <Input
                      id="resume"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileSelect}
                      disabled={isUploading || isParsing}
                    />
                    {selectedFile && (
                      <Button
                        onClick={handleUploadAndParse}
                        disabled={isUploading || isParsing}
                      >
                        {isUploading || isParsing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {isParsing ? "Parsing..." : "Uploading..."}
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Process Resume
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {selectedFile && (
                  <Alert>
                    <FileText className="h-4 w-4" />
                    <AlertDescription>
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </AlertDescription>
                  </Alert>
                )}

                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="space-y-2">
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {uploadProgress}% - {isParsing ? "Parsing resume..." : "Uploading..."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Parsed Data Preview */}
            {parsedData && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Resume Parsed Successfully
                    </CardTitle>
                    <CardDescription>
                      Preview of extracted information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Summary */}
                    {parsedData.summary && (
                      <div>
                        <h3 className="font-semibold mb-2">Professional Summary</h3>
                        <p className="text-sm text-muted-foreground">{parsedData.summary}</p>
                      </div>
                    )}

                    {/* Skills */}
                    {parsedData.skills && parsedData.skills.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Skills</h3>
                        <div className="flex flex-wrap gap-2">
                          {parsedData.skills.map((skill, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Experience */}
                    {parsedData.experience && parsedData.experience.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Work Experience</h3>
                        <div className="space-y-4">
                          {parsedData.experience.map((exp, index) => (
                            <div key={index} className="border-l-2 border-primary pl-4">
                              <h4 className="font-medium">{exp.title}</h4>
                              <p className="text-sm text-muted-foreground">{exp.company}</p>
                              <p className="text-xs text-muted-foreground">{exp.duration}</p>
                              {exp.description && (
                                <p className="text-sm mt-1">{exp.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Education */}
                    {parsedData.education && parsedData.education.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Education</h3>
                        <div className="space-y-3">
                          {parsedData.education.map((edu, index) => (
                            <div key={index}>
                              <h4 className="font-medium">{edu.degree}</h4>
                              <p className="text-sm text-muted-foreground">{edu.institution}</p>
                              <p className="text-xs text-muted-foreground">{edu.year}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Shareable Link Card */}
                {portfolioUrl && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Your Digital Portfolio is Ready!</CardTitle>
                      <CardDescription>
                        Share this link on LinkedIn, email, or anywhere you want to showcase your profile
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          value={portfolioUrl}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button onClick={copyToClipboard} variant="outline">
                          <LinkIcon className="mr-2 h-4 w-4" />
                          Copy
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => window.open(portfolioUrl, '_blank')}
                          variant="default"
                        >
                          View Portfolio
                        </Button>
                        <Button
                          onClick={() => navigate('/edit-profile')}
                          variant="outline"
                        >
                          Customize Profile
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
