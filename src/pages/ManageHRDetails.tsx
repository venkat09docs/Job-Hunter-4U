import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { ArrowLeft, Building2, Users, Calendar, Briefcase, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface HRDetail {
  id: string;
  company_name: string;
  company_employees: string | null;
  company_founded_year: string | null;
  job_title: string;
  hr_name: string | null;
  hr_email: string;
  job_description: string;
  key_skills: string | null;
  created_at: string;
}

const ManageHRDetails = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [hrDetails, setHrDetails] = useState<HRDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHRDetails();
  }, []);

  const fetchHRDetails = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to view HR details",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from('hr_details')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setHrDetails(data || []);
    } catch (error) {
      console.error('Error fetching HR details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch HR details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('hr_details')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "HR details deleted successfully",
      });

      // Refresh the list
      fetchHRDetails();
    } catch (error) {
      console.error('Error deleting HR details:', error);
      toast({
        title: "Error",
        description: "Failed to delete HR details",
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
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-4">
            <UserProfileDropdown />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 border-2 border-primary/20 rounded-xl">
                <Building2 className="h-8 w-8 text-primary stroke-[2.5]" />
              </div>
              <h1 className="text-4xl font-bold">Manage HR Details</h1>
            </div>
            <Button
              onClick={() => navigate("/dashboard/automate-job-hunting")}
              className="gap-2"
            >
              Add New HR Details
            </Button>
          </div>
          <p className="text-muted-foreground text-lg">
            View and manage all your saved HR contacts and job applications
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : hrDetails.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No HR Details Found</h3>
              <p className="text-muted-foreground text-center mb-4">
                You haven't added any HR details yet. Start by adding your first HR contact.
              </p>
              <Button onClick={() => navigate("/dashboard/automate-job-hunting")}>
                Add HR Details
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {hrDetails.map((hr) => (
              <Card key={hr.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-1">{hr.company_name}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        {hr.job_title}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(hr.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {hr.hr_name && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">HR Contact</p>
                      <p className="text-sm">{hr.hr_name}</p>
                      <p className="text-sm text-muted-foreground">{hr.hr_email}</p>
                    </div>
                  )}
                  
                  <div className="flex gap-4">
                    {hr.company_employees && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{hr.company_employees}</span>
                      </div>
                    )}
                    {hr.company_founded_year && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Founded {hr.company_founded_year}</span>
                      </div>
                    )}
                  </div>

                  {hr.job_description && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Job Description</p>
                      <p className="text-sm line-clamp-3">{hr.job_description}</p>
                    </div>
                  )}

                  {hr.key_skills && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Key Skills</p>
                      <p className="text-sm line-clamp-2">{hr.key_skills}</p>
                    </div>
                  )}

                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      Added on {new Date(hr.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageHRDetails;
