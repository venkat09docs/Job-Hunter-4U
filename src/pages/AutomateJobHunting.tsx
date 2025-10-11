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
import { Zap, Building2, Briefcase, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { NotificationBell } from "@/components/NotificationBell";

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

  const onSubmit = (data: FormData) => {
    console.log("Form data:", data);
    console.log("Cover Letter:", coverLetterFile);
    console.log("Resume:", resumeFile);

    toast({
      title: "Job Hunting Started!",
      description: "Your automated job hunting process has been initiated.",
    });

    // Reset form
    form.reset();
    setCoverLetterFile(null);
    setResumeFile(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard/job-hunter-level-up")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back to Job Dashboard
          </Button>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <UserProfileDropdown />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-primary/10 border-2 border-primary/20 rounded-xl">
              <Zap className="h-8 w-8 text-primary stroke-[2.5]" />
            </div>
            <h1 className="text-4xl font-bold">Automate Job Hunting</h1>
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
      </div>
    </div>
  );
};

export default AutomateJobHunting;
