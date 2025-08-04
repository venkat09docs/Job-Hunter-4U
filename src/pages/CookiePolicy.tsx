import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cookie, Settings, BarChart, Shield } from 'lucide-react';

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-primary mb-6">
            <Cookie className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Cookie Policy
          </h1>
          <p className="text-xl text-muted-foreground">
            How we use cookies and similar technologies on JobHunter Pro
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Last updated: January 2025
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cookie className="h-5 w-5 text-primary" />
                What Are Cookies?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Cookies are small text files that are stored on your device when you visit our website. 
                They help us remember your preferences, improve your experience, and provide personalized 
                features. We also use similar technologies like local storage and session storage.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Types of Cookies We Use
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2 text-primary">Essential Cookies</h4>
                <p className="text-muted-foreground mb-2">
                  These cookies are necessary for the website to function properly:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Authentication and login status</li>
                  <li>Security and fraud prevention</li>
                  <li>User session management</li>
                  <li>Form submission and data validation</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-primary">Functional Cookies</h4>
                <p className="text-muted-foreground mb-2">
                  These cookies enhance your experience by remembering your preferences:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Language and region settings</li>
                  <li>Theme preferences (light/dark mode)</li>
                  <li>Dashboard layout and customizations</li>
                  <li>AI tool usage preferences</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-primary">Analytics Cookies</h4>
                <p className="text-muted-foreground mb-2">
                  These cookies help us understand how you use our platform:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Page views and user interactions</li>
                  <li>Feature usage statistics</li>
                  <li>Performance monitoring</li>
                  <li>Error tracking and debugging</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-primary">Marketing Cookies</h4>
                <p className="text-muted-foreground mb-2">
                  These cookies help us provide relevant content and advertisements:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Personalized job recommendations</li>
                  <li>Career development suggestions</li>
                  <li>Email campaign optimization</li>
                  <li>Social media integration</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5 text-primary" />
                Third-Party Cookies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We work with trusted third-party services that may set their own cookies:
              </p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Supabase (Authentication & Database)</h4>
                  <p className="text-muted-foreground text-sm">
                    Manages user authentication and secure data storage
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Razorpay (Payment Processing)</h4>
                  <p className="text-muted-foreground text-sm">
                    Handles secure payment transactions for premium features
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">AI Service Providers</h4>
                  <p className="text-muted-foreground text-sm">
                    Power our AI-driven resume generation and career recommendations
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">LinkedIn API</h4>
                  <p className="text-muted-foreground text-sm">
                    Enables LinkedIn profile optimization and networking features
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">GitHub API</h4>
                  <p className="text-muted-foreground text-sm">
                    Connects your GitHub profile for portfolio enhancement
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Managing Your Cookie Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Browser Settings</h4>
                <p className="text-muted-foreground mb-2">
                  You can control cookies through your browser settings:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Block all cookies (may affect functionality)</li>
                  <li>Block third-party cookies only</li>
                  <li>Delete existing cookies</li>
                  <li>Set automatic deletion of cookies</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Platform Settings</h4>
                <p className="text-muted-foreground">
                  Within your JobHunter Pro account settings, you can control:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Analytics and performance tracking</li>
                  <li>Personalized recommendations</li>
                  <li>Marketing communications</li>
                  <li>Third-party integrations</li>
                </ul>
              </div>

              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                <p className="text-sm text-warning">
                  <strong>Note:</strong> Disabling essential cookies may prevent certain features 
                  from working properly, including login, payment processing, and data saving.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Retention</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Session Cookies</h4>
                  <p className="text-muted-foreground">
                    Deleted when you close your browser or log out
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Persistent Cookies</h4>
                  <p className="text-muted-foreground">
                    Stored for specific periods (typically 30 days to 2 years) based on their purpose
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Analytics Data</h4>
                  <p className="text-muted-foreground">
                    Anonymized and aggregated data may be retained longer for platform improvement
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Updates to This Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We may update this Cookie Policy periodically to reflect changes in our practices 
                or legal requirements. We will notify you of significant changes through our platform 
                or via email. Continued use of our service after updates constitutes acceptance of the new policy.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                If you have questions about our use of cookies:
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

export default CookiePolicy;