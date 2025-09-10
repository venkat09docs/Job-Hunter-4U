import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Play, FileText, Clock, User, ArrowLeft, Edit, Trash2, Plus, Upload, Eye, EyeOff } from "lucide-react";
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

        <div className="space-y-8">
          {/* Step by Step Docs Section */}
          {(effectiveIsAdmin || docData.some(cat => hasPublishedContent(cat))) && (
              <Card className="h-fit">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Step by Step Docs
                      </CardTitle>
                      <CardDescription>
                        Follow detailed guides and documentation for all features
                      </CardDescription>
                    </div>
                    {effectiveIsAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddDoc(activeDocCategory)}
                        className="flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Add Doc
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeDocCategory} onValueChange={setActiveDocCategory}>
                    <TabsList className="grid w-full grid-cols-3">
                      {docData.map((category) => (
                        <TabsTrigger 
                          key={category.id} 
                          value={category.id}
                          className="text-xs"
                        >
                          {category.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    
                    {docData.map((category) => {
                      const filteredDocs = getFilteredDocs(category.docs);
                      if (!isAdmin && filteredDocs.length === 0) return null;
                      
                      return (
                        <TabsContent key={category.id} value={category.id}>
                          <ScrollArea className="h-[400px] pr-4">
                            <div className="space-y-4">
                              {filteredDocs.map((doc) => {
                                // Double-check filtering for non-admin users
                                if (!effectiveIsAdmin && !doc.isPublished) {
                                  console.log(`Skipping unpublished doc ${doc.id} for non-admin user`);
                                  return null;
                                }
                                
                                return (
                                <div key={doc.id} className="group">
                                  <Card className="hover:shadow-md transition-shadow cursor-pointer relative">
                                    <Link to={`/dashboard/knowledge-base/doc/${doc.id}`}>
                                      <CardContent className="p-4">
                                        <div className="flex gap-3">
                                          <div className="flex-shrink-0 w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                              <h3 className="font-semibold text-sm">{doc.title}</h3>
                                            {effectiveIsAdmin && (
                                                <Badge variant={doc.isPublished ? "default" : "secondary"} className="text-xs">
                                                  {doc.isPublished ? "Published" : "Draft"}
                                                </Badge>
                                              )}
                                            </div>
                                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                              {doc.description}
                                            </p>
                                            <div className="flex items-center justify-between">
                                              <Badge variant="secondary" className="text-xs">
                                                {doc.readTime}
                                              </Badge>
                                              <span className="text-xs text-muted-foreground">
                                                Updated {doc.lastUpdated}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Link>
                                    {effectiveIsAdmin && (
                                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleToggleDocPublish(doc.id, category.id, doc.isPublished);
                                          }}
                                          className="h-8 w-8 p-0 hover:bg-primary/10"
                                        >
                                          {doc.isPublished ? (
                                            <Eye className="h-3 w-3 text-green-600" />
                                          ) : (
                                            <EyeOff className="h-3 w-3 text-muted-foreground" />
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
                                          className="h-8 w-8 p-0 hover:bg-primary/10"
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                              }}
                                              className="h-8 w-8 p-0 hover:bg-destructive/10"
                                            >
                                              <Trash2 className="h-3 w-3 text-destructive" />
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>Delete Documentation</AlertDialogTitle>
                                              <AlertDialogDescription>
                                                Are you sure you want to delete "{doc.title}"? This action cannot be undone.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                                              <AlertDialogAction
                                                onClick={() => handleDeleteDoc(doc.id, category.id)}
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                              >
                                                Delete
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </div>
                                    )}
                                </Card>
                                </div>
                                );
                              }).filter(Boolean)}
                              {filteredDocs.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                  <p>No documentation in this category yet.</p>
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        </TabsContent>
                      );
                    })}
                  </Tabs>
                </CardContent>
              </Card>
            )}
        </div>
      </div>
    </div>
  );
}