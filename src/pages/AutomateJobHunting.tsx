import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Zap, Building2, Briefcase, ArrowLeft, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

const formSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  hrName: z.string().optional(),
  hrEmail: z.string().email("Invalid email address").min(1, "Email is required"),
  hrPhone: z.string().optional(),
  companyWebsite: z.string().optional(),
  companyLinkedIn: z.string().optional(),
  companyEmployees: z.string().optional(),
  companyFoundedYear: z.string().optional(),
  contactSource: z.string().min(1, "Contact source is required"),
  jobTitle: z.string().min(1, "Job title is required"),
  jobDescription: z.string().min(1, "Job description is required"),
  coverLetter: z.any().optional(),
  resume: z.any().refine((files) => files?.length > 0, "Resume is required"),
});

type FormData = z.infer<typeof formSchema>;

const contactSources = [
  "LinkedIn",
  "Instagram",
  "Naukri",
  "Glassdoor",
  "Referral",
  "RNS Internal",
];

const AutomateJobHunting = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isSmtpDialogOpen, setIsSmtpDialogOpen] = useState(false);
  const [gmailId, setGmailId] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [acceptConsent, setAcceptConsent] = useState(false);
  const [isSavingSmtp, setIsSavingSmtp] = useState(false);

  // Load existing SMTP configuration
  useEffect(() => {
    const loadSmtpConfig = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('smtp_configurations')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setGmailId(data.gmail_id);
        setAppPassword(data.app_password);
        setAcceptConsent(data.consent_given);
      }
    };

    loadSmtpConfig();
  }, []);

  const handleSaveSmtpConfig = async () => {
    if (!gmailId || !appPassword || !acceptConsent) {
      toast({
        title: "Missing Information",
        description: "Please fill all fields and accept the consent",
        variant: "destructive",
      });
      return;
    }

    setIsSavingSmtp(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to save SMTP configuration",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('smtp_configurations')
        .upsert({
          user_id: user.id,
          gmail_id: gmailId,
          app_password: appPassword,
          consent_given: acceptConsent,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "Gmail Server Configured",
        description: "Your email server has been configured successfully",
      });
      setIsSmtpDialogOpen(false);
    } catch (error) {
      console.error('Error saving SMTP config:', error);
      toast({
        title: "Error",
        description: "Failed to save SMTP configuration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingSmtp(false);
    }
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      hrName: "",
      hrEmail: "",
      hrPhone: "",
      companyWebsite: "",
      companyLinkedIn: "",
      companyEmployees: "",
      companyFoundedYear: "",
      contactSource: "",
      jobTitle: "",
      jobDescription: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to submit",
          variant: "destructive",
        });
        return;
      }

      let coverLetterUrl = null;
      let resumeUrl = null;

      // Upload cover letter if provided
      if (coverLetterFile) {
        const fileExt = coverLetterFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}_cover_letter.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('job-applications')
          .upload(fileName, coverLetterFile);

        if (uploadError) {
          console.error('Cover letter upload error:', uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('job-applications')
            .getPublicUrl(fileName);
          coverLetterUrl = publicUrl;
        }
      }

      // Upload resume
      if (resumeFile) {
        const fileExt = resumeFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}_resume.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('job-applications')
          .upload(fileName, resumeFile);

        if (uploadError) {
          console.error('Resume upload error:', uploadError);
          toast({
            title: "Upload Error",
            description: "Failed to upload resume. Please try again.",
            variant: "destructive",
          });
          return;
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('job-applications')
            .getPublicUrl(fileName);
          resumeUrl = publicUrl;
        }
      }

      // Save to hr_details table
      const { error: insertError } = await supabase
        .from('hr_details')
        .insert({
          user_id: user.id,
          company_name: data.companyName,
          hr_name: data.hrName || null,
          hr_email: data.hrEmail,
          hr_phone: data.hrPhone || null,
          company_website: data.companyWebsite || null,
          company_linkedin: data.companyLinkedIn || null,
          company_employees: data.companyEmployees || null,
          company_founded_year: data.companyFoundedYear || null,
          contact_source: data.contactSource,
          job_title: data.jobTitle,
          job_description: data.jobDescription,
          cover_letter_url: coverLetterUrl,
          resume_url: resumeUrl,
        });

      if (insertError) {
        console.error('Database insert error:', insertError);
        toast({
          title: "Error",
          description: "Failed to save job application details",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Job Hunting Started!",
        description: "Your automated job hunting process has been initiated.",
      });

      // Reset form
      form.reset();
      setCoverLetterFile(null);
      setResumeFile(null);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
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
            Go to Job Dashboard
          </Button>
          <div className="flex items-center gap-4">
            <UserProfileDropdown />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 border-2 border-primary/20 rounded-xl">
                <Zap className="h-8 w-8 text-primary stroke-[2.5]" />
              </div>
              <h1 className="text-4xl font-bold">Automate Job Hunting</h1>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsSmtpDialogOpen(true)}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Configure SMTP Server
            </Button>
          </div>
          <p className="text-muted-foreground text-lg">
            Streamline your job application process by filling in the details below
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Start Job Hunting</CardTitle>
            <CardDescription>
              Fill in the company and job details to begin your automated job hunting process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Company Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Company Information</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Name of the Company <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Enter company name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hrName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name of the HR</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter HR name (optional)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hrEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            HR/Company Email <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="hr@company.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hrPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>HR Phone</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="Enter phone number (optional)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="companyWebsite"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Website</FormLabel>
                          <FormControl>
                            <Input placeholder="https://company.com (optional)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="companyLinkedIn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company LinkedIn URL</FormLabel>
                          <FormControl>
                            <Input placeholder="LinkedIn URL (optional)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="companyEmployees"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Employees</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 100-500" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="companyFoundedYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Founded Year</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 2010" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contactSource"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Contact Source <span className="text-destructive">*</span>
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select source" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {contactSources.map((source) => (
                                <SelectItem key={source} value={source}>
                                  {source}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Job Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Briefcase className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Job Information</h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="jobTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Job Title <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter job title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="jobDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Job Description <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter job description, requirements, and responsibilities"
                            className="min-h-[150px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="coverLetter"
                      render={({ field: { onChange, value, ...field } }) => (
                        <FormItem>
                          <FormLabel>Upload Cover Letter</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setCoverLetterFile(file);
                                    onChange(e.target.files);
                                  }
                                }}
                                {...field}
                              />
                              {coverLetterFile && (
                                <p className="text-sm text-muted-foreground">
                                  Selected: {coverLetterFile.name}
                                </p>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="resume"
                      render={({ field: { onChange, value, ...field } }) => (
                        <FormItem>
                          <FormLabel>
                            Upload Resume <span className="text-destructive">*</span>
                          </FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setResumeFile(file);
                                    onChange(e.target.files);
                                  }
                                }}
                                {...field}
                              />
                              {resumeFile && (
                                <p className="text-sm text-muted-foreground">
                                  Selected: {resumeFile.name}
                                </p>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      form.reset();
                      setCoverLetterFile(null);
                      setResumeFile(null);
                    }}
                  >
                    Clear Form
                  </Button>
                  <Button type="submit" className="min-w-[150px]">
                    Automate Job
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* SMTP Configuration Dialog */}
        <Dialog open={isSmtpDialogOpen} onOpenChange={setIsSmtpDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Configure Gmail Server</DialogTitle>
              <DialogDescription>
                Set up your Gmail credentials to enable automated email sending
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="gmail-id" className="text-sm font-medium">
                  Gmail Id <span className="text-muted-foreground">(your resume email ID)</span>
                </label>
                <Input
                  id="gmail-id"
                  type="email"
                  placeholder="your-email@gmail.com"
                  value={gmailId}
                  onChange={(e) => setGmailId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="app-password" className="text-sm font-medium">
                  App Password
                </label>
                <Input
                  id="app-password"
                  type="password"
                  placeholder="Enter your app password"
                  value={appPassword}
                  onChange={(e) => setAppPassword(e.target.value)}
                />
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="consent"
                  checked={acceptConsent}
                  onCheckedChange={(checked) => setAcceptConsent(checked as boolean)}
                />
                <label
                  htmlFor="consent"
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I consent to use my Gmail server credentials for automated email sending
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleSaveSmtpConfig}
                disabled={!acceptConsent || isSavingSmtp}
              >
                {isSavingSmtp ? "Saving..." : "Configure Gmail Server"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AutomateJobHunting;
