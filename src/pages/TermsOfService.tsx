import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, AlertTriangle, CreditCard, Users } from 'lucide-react';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-primary mb-6">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Terms of Service
          </h1>
          <p className="text-xl text-muted-foreground">
            Terms and conditions for using JobHunter Pro platform
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Last updated: January 2025
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Acceptance of Terms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                By accessing and using JobHunter Pro, you accept and agree to be bound by the terms and provision 
                of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                JobHunter Pro is an AI-powered career development platform that provides:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>AI-generated resumes and cover letters</li>
                <li>LinkedIn profile optimization</li>
                <li>GitHub portfolio enhancement</li>
                <li>Job search and application tracking</li>
                <li>Career development insights and analytics</li>
                <li>Professional networking tools</li>
                <li>Blog creation and publishing features</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Responsibilities</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Provide accurate and truthful information in your profile</li>
                <li>Maintain the confidentiality of your account credentials</li>
                <li>Use the platform for lawful purposes only</li>
                <li>Respect intellectual property rights</li>
                <li>Not attempt to reverse engineer or hack the platform</li>
                <li>Not create fake accounts or impersonate others</li>
                <li>Comply with all applicable laws and regulations</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Subscription and Payments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Free Tier</h4>
                <p className="text-muted-foreground">
                  Basic features including profile creation, limited AI tool usage, and job tracking.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Premium Subscription</h4>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Unlimited AI tool usage</li>
                  <li>Advanced analytics and insights</li>
                  <li>Priority customer support</li>
                  <li>Advanced job search features</li>
                  <li>LinkedIn automation tools</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Payment Terms</h4>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Subscriptions are billed monthly or annually</li>
                  <li>Payments are processed securely through Razorpay</li>
                  <li>Refunds are subject to our refund policy</li>
                  <li>Prices may change with 30 days notice</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content and Intellectual Property</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Your Content</h4>
                <p className="text-muted-foreground">
                  You retain ownership of content you create and upload. By using our service, you grant us 
                  a license to use your content to provide and improve our services.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Our Content</h4>
                <p className="text-muted-foreground">
                  All platform features, AI algorithms, and generated content are protected by intellectual 
                  property laws. You may not reproduce or redistribute our content without permission.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                Disclaimers and Limitations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Service Availability</h4>
                <p className="text-muted-foreground">
                  We strive for 99.9% uptime but cannot guarantee uninterrupted service. 
                  Maintenance and updates may cause temporary unavailability.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">AI-Generated Content</h4>
                <p className="text-muted-foreground">
                  AI-generated resumes, cover letters, and content are suggestions only. 
                  You are responsible for reviewing and customizing all content before use.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Job Search Results</h4>
                <p className="text-muted-foreground">
                  We cannot guarantee job placement or interview success. Results depend on 
                  market conditions, your qualifications, and employer decisions.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Termination</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Either party may terminate this agreement at any time. Upon termination:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Your access to premium features will be immediately revoked</li>
                <li>Your data will be retained for 30 days for potential recovery</li>
                <li>After 30 days, your data will be permanently deleted</li>
                <li>You can export your data before account deletion</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                For questions about these Terms of Service:
              </p>
              <div className="space-y-2">
                <p><strong>Email:</strong> legal@risenshinetechnologies.com</p>
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

export default TermsOfService;