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
import { ArrowLeft, Building2, Users, Calendar, Briefcase, Trash2, Search, Filter, X, Edit, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [filteredHrDetails, setFilteredHrDetails] = useState<HRDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState<"all" | "company" | "job_title" | "hr_name">("all");
  const [selectedHR, setSelectedHR] = useState<HRDetail | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

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
      setFilteredHrDetails(data || []);
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

  // Filter HR details based on search term and filter type
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredHrDetails(hrDetails);
      return;
    }

    const filtered = hrDetails.filter((hr) => {
      const term = searchTerm.toLowerCase();
      
      switch (filterBy) {
        case "company":
          return hr.company_name.toLowerCase().includes(term);
        case "job_title":
          return hr.job_title.toLowerCase().includes(term);
        case "hr_name":
          return hr.hr_name?.toLowerCase().includes(term) || false;
        case "all":
        default:
          return (
            hr.company_name.toLowerCase().includes(term) ||
            hr.job_title.toLowerCase().includes(term) ||
            hr.hr_name?.toLowerCase().includes(term) ||
            hr.hr_email.toLowerCase().includes(term) ||
            hr.job_description.toLowerCase().includes(term) ||
            hr.key_skills?.toLowerCase().includes(term)
          );
      }
    });

    setFilteredHrDetails(filtered);
  }, [searchTerm, filterBy, hrDetails]);

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

  const handleViewDetails = (hr: HRDetail) => {
    setSelectedHR(hr);
    setIsDetailDialogOpen(true);
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

        {/* Search and Filter Section */}
        <Card className="mb-6 border-2">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search HR details..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                    onClick={() => setSearchTerm("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Filter Options */}
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Filter by:</span>
                <div className="flex gap-2 flex-wrap">
                  <Badge
                    variant={filterBy === "all" ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => setFilterBy("all")}
                  >
                    All
                  </Badge>
                  <Badge
                    variant={filterBy === "company" ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => setFilterBy("company")}
                  >
                    Company
                  </Badge>
                  <Badge
                    variant={filterBy === "job_title" ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => setFilterBy("job_title")}
                  >
                    Job Title
                  </Badge>
                  <Badge
                    variant={filterBy === "hr_name" ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => setFilterBy("hr_name")}
                  >
                    HR Name
                  </Badge>
                </div>
              </div>
            </div>

            {/* Search Results Info */}
            {searchTerm && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  Found {filteredHrDetails.length} result{filteredHrDetails.length !== 1 ? 's' : ''} for "{searchTerm}"
                </span>
              </div>
            )}
          </CardContent>
        </Card>

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
        ) : filteredHrDetails.length === 0 && searchTerm ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Results Found</h3>
              <p className="text-muted-foreground text-center mb-4">
                No HR details match your search criteria. Try adjusting your filters.
              </p>
              <Button variant="outline" onClick={() => setSearchTerm("")}>
                Clear Search
              </Button>
            </CardContent>
          </Card>
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
          <div className="space-y-3">
            {filteredHrDetails.map((hr) => (
              <Card key={hr.id} className="hover:shadow-md transition-all border-l-4 border-l-primary/40 hover:border-l-primary">
                <CardContent className="p-4">
                  {/* Line 1: Company, Job Title, Action Buttons */}
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-bold">{hr.company_name}</h3>
                        <span className="text-muted-foreground">•</span>
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{hr.job_title}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate("/dashboard/automate-job-hunting")}
                        className="text-primary hover:text-primary hover:bg-primary/10 h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(hr.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Line 2: HR Contact, Company Details, View More */}
                  <div className="flex items-center justify-between gap-6 text-sm flex-wrap">
                    <div className="flex items-center gap-6 flex-wrap">
                      {hr.hr_name && (
                        <>
                          <span className="font-medium">{hr.hr_name}</span>
                          <span className="text-muted-foreground">{hr.hr_email}</span>
                          <span className="text-muted-foreground">•</span>
                        </>
                      )}
                      {hr.company_employees && (
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{hr.company_employees}</span>
                        </div>
                      )}
                      {hr.company_founded_year && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>Est. {hr.company_founded_year}</span>
                          </div>
                        </>
                      )}
                      <span className="text-muted-foreground text-xs">
                        {new Date(hr.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => handleViewDetails(hr)}
                      className="text-primary gap-1.5 h-auto p-0"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View More Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Details Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl border border-primary/20">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-xl">{selectedHR?.company_name}</div>
                  <div className="text-sm font-normal text-muted-foreground mt-1 flex items-center gap-2">
                    <Briefcase className="h-3.5 w-3.5" />
                    {selectedHR?.job_title}
                  </div>
                </div>
              </DialogTitle>
              <DialogDescription>
                Complete details about this job opportunity
              </DialogDescription>
            </DialogHeader>

            {selectedHR && (
              <div className="space-y-6 mt-4 animate-fade-in">
                {/* Company Information */}
                <div className="p-4 bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
                  <h3 className="text-sm font-semibold mb-4 text-blue-900 dark:text-blue-100 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Company Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedHR.company_employees && (
                      <div className="p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1.5">Employees</p>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm font-medium">{selectedHR.company_employees}</span>
                        </div>
                      </div>
                    )}
                    {selectedHR.company_founded_year && (
                      <div className="p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1.5">Founded</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm font-medium">{selectedHR.company_founded_year}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* HR Contact */}
                {selectedHR.hr_name && (
                  <div className="p-4 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl border border-purple-200/50 dark:border-purple-800/50">
                    <h3 className="text-sm font-semibold mb-3 text-purple-900 dark:text-purple-100 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      HR Contact
                    </h3>
                    <div className="p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
                      <p className="font-medium text-base mb-1">{selectedHR.hr_name}</p>
                      <p className="text-sm text-muted-foreground">{selectedHR.hr_email}</p>
                    </div>
                  </div>
                )}

                {/* Job Description */}
                {selectedHR.job_description && (
                  <div className="p-4 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl border border-green-200/50 dark:border-green-800/50">
                    <h3 className="text-sm font-semibold mb-3 text-green-900 dark:text-green-100 flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Job Description
                    </h3>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">{selectedHR.job_description}</p>
                  </div>
                )}

                {/* Key Skills */}
                {selectedHR.key_skills && (
                  <div className="p-4 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl border border-amber-200/50 dark:border-amber-800/50">
                    <h3 className="text-sm font-semibold mb-3 text-amber-900 dark:text-amber-100 flex items-center gap-2">
                      <span className="text-base">⚡</span>
                      Key Skills Required
                    </h3>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">{selectedHR.key_skills}</p>
                  </div>
                )}

                {/* Date Added */}
                <div className="pt-4 border-t flex items-center justify-between">
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    Added on {new Date(selectedHR.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>

                {/* Action Buttons - At Bottom */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => {
                      setIsDetailDialogOpen(false);
                      navigate("/dashboard/resume-builder");
                    }}
                    className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300 hover-scale"
                  >
                    <span className="mr-2">📄</span>
                    Resume Analyzer
                  </Button>
                  <Button
                    onClick={() => {
                      setIsDetailDialogOpen(false);
                      navigate("/dashboard/automate-job-hunting");
                    }}
                    variant="outline"
                    className="flex-1 h-12 text-base font-semibold border-2 hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10 transition-all duration-300 hover-scale"
                  >
                    <span className="mr-2">🤖</span>
                    Automate Job
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ManageHRDetails;
