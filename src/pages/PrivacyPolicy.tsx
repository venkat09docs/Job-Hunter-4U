import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, Database, User } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-primary mb-6">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-xl text-muted-foreground">
            How we collect, use, and protect your personal information
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Last updated: January 2025
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Personal Information</h4>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Name, email address, and contact information</li>
                  <li>Professional profile information (resume, skills, experience)</li>
                  <li>LinkedIn profile data (when connected)</li>
                  <li>GitHub profile data (when connected)</li>
                  <li>Job application tracking information</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Usage Data</h4>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>How you interact with our platform</li>
                  <li>AI tool usage patterns and preferences</li>
                  <li>Job search activities and progress metrics</li>
                  <li>Device information and browser data</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Provide personalized AI-powered career recommendations</li>
                <li>Generate custom resumes, cover letters, and LinkedIn content</li>
                <li>Track your job application progress and success metrics</li>
                <li>Improve our AI algorithms and platform functionality</li>
                <li>Send relevant job opportunities and career insights</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Process payments for premium features</li>
                <li>Ensure platform security and prevent fraud</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Data Protection & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Security Measures</h4>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>End-to-end encryption for sensitive data</li>
                  <li>Secure data storage with Supabase infrastructure</li>
                  <li>Regular security audits and monitoring</li>
                  <li>Compliance with industry security standards</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Data Retention</h4>
                <p className="text-muted-foreground">
                  We retain your personal information only as long as necessary to provide our services. 
                  You can request data deletion at any time through your account settings.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Third-Party Services</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                We integrate with third-party services to enhance your experience:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li><strong>LinkedIn:</strong> To optimize your profile and network growth</li>
                <li><strong>GitHub:</strong> To showcase your technical projects</li>
                <li><strong>AI Services:</strong> To provide intelligent career recommendations</li>
                <li><strong>Payment Processors:</strong> To handle subscription payments securely</li>
                <li><strong>Analytics:</strong> To improve platform performance (anonymized data)</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Rights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Access and download your personal data</li>
                <li>Correct inaccurate or incomplete information</li>
                <li>Delete your account and associated data</li>
                <li>Opt-out of marketing communications</li>
                <li>Restrict certain data processing activities</li>
                <li>Data portability to other services</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                If you have questions about this Privacy Policy or our data practices:
              </p>
              <div className="space-y-2">
                <p><strong>Email:</strong> privacy@risenshinetechnologies.com</p>
                <p><strong>Address:</strong> Rise n Shine Technologies, Hyderabad, India</p>
                <p><strong>Phone:</strong> +91 8686988042</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;