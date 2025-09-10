import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Play, FileText, Clock, User, ArrowLeft, Edit, Trash2, Plus, Upload, Eye, EyeOff, Briefcase, Network, Code, BookOpen } from "lucide-react";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { SubscriptionUpgrade, SubscriptionStatus } from "@/components/SubscriptionUpgrade";
import { useRole } from "@/hooks/useRole";
import { useKnowledgeBase } from "@/hooks/useKnowledgeBase";
import { toast } from "sonner";

export default function KnowledgeBase() {
  const { docData, toggleDocPublishStatus, loading } = useKnowledgeBase();
  const [activeDocCategory, setActiveDocCategory] = useState<string>("");
  const { isAdmin, role } = useRole();
  const navigate = useNavigate();

  // Set default active categories when data loads
  useEffect(() => {
    if (docData.length > 0 && !activeDocCategory) {
      setActiveDocCategory(docData[0].id);
    }
  }, [docData, activeDocCategory]);

  // 🧪 TEMPORARY: Force test as regular user (REMOVE IN PRODUCTION)
  const [forceRegularUser, setForceRegularUser] = useState(false);
  const effectiveIsAdmin = forceRegularUser ? false : isAdmin;
  const effectiveRole = forceRegularUser ? 'user' : role;

  // Debug role and filtering
  console.log('🔍 KnowledgeBase Debug Info:');
  console.log('Actual role:', role, 'isAdmin:', isAdmin);
  console.log('Effective role:', effectiveRole, 'effectiveIsAdmin:', effectiveIsAdmin);
  console.log('Force regular user mode:', forceRegularUser);
  console.log('Doc data sample:', docData[0]?.docs.map(d => ({ id: d.id, title: d.title, isPublished: d.isPublished })));

  const handleDeleteDoc = (docId: string, categoryId: string) => {
    // In a real app, this would make an API call to delete the document
    console.log(`Deleting document ${docId} from category ${categoryId}`);
    toast.success("Documentation deleted successfully");
  };

  const handleEditDoc = (docId: string) => {
    // Navigate to DocumentationDetail page with edit mode
    navigate(`/dashboard/knowledge-base/doc/${docId}?edit=true`);
  };

  const handleAddDoc = (categoryId: string) => {
    console.log(`Adding new document to category ${categoryId}`);
    toast.info("Add document feature coming soon");
  };

  const handleToggleDocPublish = (docId: string, categoryId: string, currentStatus: boolean) => {
    toggleDocPublishStatus(docId, categoryId);
    toast.success(`Documentation ${!currentStatus ? 'published' : 'unpublished'} successfully`);
  };


  // Filter content based on user role and publish status
  const getFilteredDocs = (docs: any[]) => {
    console.log('🔍 getFilteredDocs called with:', docs.length, 'docs');
    console.log('🔍 Role check - effectiveIsAdmin:', effectiveIsAdmin, 'effectiveRole:', effectiveRole);
    
    if (effectiveIsAdmin) {
      console.log('✅ Admin user: showing all', docs.length, 'docs');
      return docs; // Admin sees all
    }
    
    const publishedDocs = docs.filter(doc => {
      console.log(`📄 Doc "${doc.title}" (ID: ${doc.id}): isPublished = ${doc.isPublished}`);
      return doc.isPublished;
    });
    
    console.log('🔒 Non-admin user: filtered from', docs.length, 'to', publishedDocs.length, 'published docs');
    console.log('📋 Published docs:', publishedDocs.map(d => d.title));
    
    return publishedDocs;
  };


  // Check if category has any published content
  const hasPublishedContent = (category: any) => {
    if (effectiveIsAdmin) return true; // Admin always sees sections
    return category.docs.some((item: any) => item.isPublished);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Top Navigation */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link 
                to="/dashboard"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="font-medium">Go to Dashboard</span>
              </Link>
              <div className="flex items-center gap-4">
                <SubscriptionStatus />
                <UserProfileDropdown />
              </div>
            </div>
          </div>
        </div>

        {/* Loading Content */}
        <div className="container mx-auto py-8 px-4">
          <div className="text-center mb-8">
            <div className="h-8 bg-muted rounded w-1/3 mx-auto mb-4 animate-pulse" />
            <div className="h-4 bg-muted rounded w-2/3 mx-auto animate-pulse" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-96 bg-muted rounded animate-pulse" />
            <div className="h-96 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-background select-none"
      style={{ 
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        // Prevent Ctrl+C, Ctrl+A, Ctrl+S, Ctrl+P, F12, etc.
        if (e.ctrlKey && (e.key === 'c' || e.key === 'a' || e.key === 's' || e.key === 'p')) {
          e.preventDefault();
        }
        if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
          e.preventDefault();
        }
      }}
    >
      {/* Top Navigation */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              to="/dashboard"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="font-medium">Go to Dashboard</span>
            </Link>
            <div className="flex items-center gap-4">
              <SubscriptionStatus />
              <UserProfileDropdown />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Knowledge Base
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Access our comprehensive library of videos and step-by-step guides to accelerate your career growth.
          </p>
        </div>

        {/* Modern Card-Based Layout */}
        {(effectiveIsAdmin || docData.some(cat => hasPublishedContent(cat))) && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Documentation Categories</h2>
              <p className="text-muted-foreground">Choose a category to explore our step-by-step guides</p>
            </div>
            
            {/* Category Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {docData.map((category) => {
                const filteredDocs = getFilteredDocs(category.docs);
                if (!effectiveIsAdmin && filteredDocs.length === 0) return null;
                
                return (
                  <Card key={category.id} className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            {category.id === "profile-building" && <User className="h-6 w-6 text-primary" />}
                            {category.id === "job-hunting" && <Briefcase className="h-6 w-6 text-primary" />}
                            {category.id === "linkedin-growth" && <Network className="h-6 w-6 text-primary" />}
                            {category.id === "github-weekly" && <Code className="h-6 w-6 text-primary" />}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold">{category.name}</h3>
                            <Badge variant="secondary" className="text-xs mt-1">
                              {filteredDocs.length} guides
                            </Badge>
                          </div>
                        </CardTitle>
                        {effectiveIsAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddDoc(category.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <CardDescription className="mt-2">
                        {category.id === "profile-building" && "Create compelling professional profiles across platforms to showcase your expertise"}
                        {category.id === "job-hunting" && "Master the art of job searching with our comprehensive guides"}
                        {category.id === "linkedin-growth" && "Build your professional network and grow your LinkedIn presence"}
                        {category.id === "github-weekly" && "Enhance your coding skills and maintain an active GitHub profile"}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <ScrollArea className="h-[300px]">
                        <div className="space-y-3">
                          {filteredDocs.slice(0, 5).map((doc) => {
                            if (!effectiveIsAdmin && !doc.isPublished) return null;
                            
                            return (
                              <div key={doc.id} className="group/doc relative">
                                <Link to={`/dashboard/knowledge-base/doc/${doc.id}`}>
                                  <Card className="p-3 hover:bg-muted/50 transition-colors border-0 shadow-sm hover:shadow-md">
                                    <div className="flex items-start gap-3">
                                      <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <FileText className="h-3 w-3 text-primary" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <h4 className="font-medium text-sm truncate">{doc.title}</h4>
                                          {effectiveIsAdmin && (
                                            <Badge variant={doc.isPublished ? "default" : "secondary"} className="text-xs">
                                              {doc.isPublished ? "Live" : "Draft"}
                                            </Badge>
                                          )}
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                          {doc.description}
                                        </p>
                                        <div className="flex items-center justify-between">
                                          <Badge variant="outline" className="text-xs">
                                            <Clock className="h-2 w-2 mr-1" />
                                            {doc.readTime}
                                          </Badge>
                                          <span className="text-xs text-muted-foreground">
                                            {doc.lastUpdated}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </Card>
                                </Link>
                                
                                {effectiveIsAdmin && (
                                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/doc:opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleToggleDocPublish(doc.id, category.id, doc.isPublished);
                                      }}
                                      className="h-6 w-6 p-0 hover:bg-primary/10"
                                    >
                                      {doc.isPublished ? (
                                        <Eye className="h-2 w-2 text-green-600" />
                                      ) : (
                                        <EyeOff className="h-2 w-2 text-muted-foreground" />
                                      )}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleEditDoc(doc.id);
                                      }}
                                      className="h-6 w-6 p-0 hover:bg-primary/10"
                                    >
                                      <Edit className="h-2 w-2" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          
                          {filteredDocs.length > 5 && (
                            <div className="pt-2 border-t">
                              <Link to={`/dashboard/knowledge-base?category=${category.id}`}>
                                <Button variant="ghost" size="sm" className="w-full text-xs">
                                  View all {filteredDocs.length} guides
                                  <ArrowLeft className="h-3 w-3 ml-1 rotate-180" />
                                </Button>
                              </Link>
                            </div>
                          )}
                          
                          {filteredDocs.length === 0 && (
                            <div className="text-center py-6 text-muted-foreground">
                              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p className="text-xs">No guides available</p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}