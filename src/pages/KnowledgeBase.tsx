import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Play, FileText, Clock, User, ArrowLeft, Trophy, Star, Edit, Trash2, Plus, Upload, Eye, EyeOff } from "lucide-react";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { SubscriptionUpgrade, SubscriptionStatus } from "@/components/SubscriptionUpgrade";
import { useActivityPointSettings } from "@/hooks/useActivityPointSettings";
import { useRole } from "@/hooks/useRole";
import { useKnowledgeBase } from "@/hooks/useKnowledgeBase";
import { toast } from "sonner";

export default function KnowledgeBase() {
  const { videoData, docData, toggleVideoPublishStatus, toggleDocPublishStatus, loading } = useKnowledgeBase();
  const [activeVideoCategory, setActiveVideoCategory] = useState<string>("");
  const [activeDocCategory, setActiveDocCategory] = useState<string>("");
  const { settings, loading: pointsLoading, getSettingsByCategory } = useActivityPointSettings();
  const { isAdmin, role } = useRole();
  const navigate = useNavigate();

  // Set default active categories when data loads
  useEffect(() => {
    if (videoData.length > 0 && !activeVideoCategory) {
      setActiveVideoCategory(videoData[0].id);
    }
    if (docData.length > 0 && !activeDocCategory) {
      setActiveDocCategory(docData[0].id);
    }
  }, [videoData, docData, activeVideoCategory, activeDocCategory]);

  // 🧪 TEMPORARY: Force test as regular user (REMOVE IN PRODUCTION)
  const [forceRegularUser, setForceRegularUser] = useState(false);
  const effectiveIsAdmin = forceRegularUser ? false : isAdmin;
  const effectiveRole = forceRegularUser ? 'user' : role;

  // Debug role and filtering
  console.log('🔍 KnowledgeBase Debug Info:');
  console.log('Actual role:', role, 'isAdmin:', isAdmin);
  console.log('Effective role:', effectiveRole, 'effectiveIsAdmin:', effectiveIsAdmin);
  console.log('Force regular user mode:', forceRegularUser);
  console.log('Video data sample:', videoData[0]?.videos.map(v => ({ id: v.id, title: v.title, isPublished: v.isPublished })));
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

  const handleDeleteVideo = (videoId: string, categoryId: string) => {
    console.log(`Deleting video ${videoId} from category ${categoryId}`);
    toast.success("Video deleted successfully");
  };

  const handleEditVideo = (videoId: string) => {
    console.log(`Editing video ${videoId}`);
    toast.info("Video edit dialog would open here");
  };

  const handleUploadVideo = (categoryId: string) => {
    console.log(`Uploading video to category ${categoryId}`);
    toast.info("Upload video feature coming soon");
  };

  const handleToggleVideoPublish = (videoId: string, categoryId: string, currentStatus: boolean) => {
    toggleVideoPublishStatus(videoId, categoryId);
    toast.success(`Video ${!currentStatus ? 'published' : 'unpublished'} successfully`);
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

  const getFilteredVideos = (videos: any[]) => {
    console.log('🔍 getFilteredVideos called with:', videos.length, 'videos');
    console.log('🔍 Role check - effectiveIsAdmin:', effectiveIsAdmin, 'effectiveRole:', effectiveRole);
    
    if (effectiveIsAdmin) {
      console.log('✅ Admin user: showing all', videos.length, 'videos');
      return videos; // Admin sees all
    }
    
    const publishedVideos = videos.filter(video => {
      console.log(`🎥 Video "${video.title}" (ID: ${video.id}): isPublished = ${video.isPublished}`);
      return video.isPublished;
    });
    
    console.log('🔒 Non-admin user: filtered from', videos.length, 'to', publishedVideos.length, 'published videos');
    console.log('📋 Published videos:', publishedVideos.map(v => v.title));
    
    return publishedVideos;
  };

  // Check if category has any published content
  const hasPublishedContent = (category: any, type: 'docs' | 'videos') => {
    if (effectiveIsAdmin) return true; // Admin always sees sections
    const content = type === 'docs' ? category.docs : category.videos;
    return content.some((item: any) => item.isPublished);
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
          {/* Reward Points Section */}
          {(isAdmin || getSettingsByCategory('resume').length > 0 || getSettingsByCategory('linkedin').length > 0) && (
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Reward Points
              </CardTitle>
              <CardDescription>
                Understand how you earn points for various activities in your career development journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="profile-building">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="profile-building" className="flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Profile Building
                  </TabsTrigger>
                  <TabsTrigger value="linkedin-growth" className="flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    LinkedIn Growth
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="profile-building">
                  <ScrollArea className="h-[400px] pr-4">
                    {pointsLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {getSettingsByCategory('resume').map((activity) => (
                          <Card key={activity.id} className="border-l-4 border-l-primary/50">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-sm">{activity.activity_name}</h3>
                                    <Badge variant={activity.is_active ? "default" : "secondary"} className="text-xs">
                                      {activity.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                  </div>
                                  {activity.description && (
                                    <p className="text-xs text-muted-foreground mb-2">
                                      {activity.description}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                    {activity.points} points
                                  </Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        {getSettingsByCategory('resume').length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No profile building activities configured yet.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="linkedin-growth">
                  <ScrollArea className="h-[400px] pr-4">
                    {pointsLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Profile Building Activities */}
                        {getSettingsByCategory('resume').length > 0 && (
                          <>
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-sm text-muted-foreground">Profile Building</h4>
                              <div className="flex-1 h-px bg-border" />
                            </div>
                            {getSettingsByCategory('resume').map((activity) => (
                              <Card key={activity.id} className="border-l-4 border-l-blue-500/50">
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-sm">{activity.activity_name}</h3>
                                        <Badge variant={activity.is_active ? "default" : "secondary"} className="text-xs">
                                          {activity.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                      </div>
                                      {activity.description && (
                                        <p className="text-xs text-muted-foreground mb-2">
                                          {activity.description}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                                        {activity.points} points
                                      </Badge>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </>
                        )}

                        {/* LinkedIn Growth Activities */}
                        {getSettingsByCategory('linkedin').length > 0 && (
                          <>
                            <div className="flex items-center gap-2 mb-2 mt-6">
                              <h4 className="font-medium text-sm text-muted-foreground">LinkedIn Growth</h4>
                              <div className="flex-1 h-px bg-border" />
                            </div>
                            {getSettingsByCategory('linkedin').map((activity) => (
                              <Card key={activity.id} className="border-l-4 border-l-primary/50">
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-sm">{activity.activity_name}</h3>
                                        <Badge variant={activity.is_active ? "default" : "secondary"} className="text-xs">
                                          {activity.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                      </div>
                                      {activity.description && (
                                        <p className="text-xs text-muted-foreground mb-2">
                                          {activity.description}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                        {activity.points} points
                                      </Badge>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </>
                        )}

                        {getSettingsByCategory('resume').length === 0 && getSettingsByCategory('linkedin').length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No activities configured yet.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Videos Section */}
            {(effectiveIsAdmin || videoData.some(cat => hasPublishedContent(cat, 'videos'))) && (
              <Card className="h-fit">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Play className="h-5 w-5" />
                        Videos
                      </CardTitle>
                      <CardDescription>
                        Watch expert-led tutorials and career development videos
                      </CardDescription>
                    </div>
                    {effectiveIsAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUploadVideo(activeVideoCategory)}
                        className="flex items-center gap-1"
                      >
                        <Upload className="h-3 w-3" />
                        Upload Video
                      </Button>
                    )}
                  </div>
                </CardHeader>
              <CardContent>
                <Tabs value={activeVideoCategory} onValueChange={setActiveVideoCategory}>
                  <TabsList className="grid w-full grid-cols-3">
                    {videoData.map((category) => (
                      <TabsTrigger 
                        key={category.id} 
                        value={category.id}
                        className="text-xs"
                      >
                        {category.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {videoData.map((category) => {
                    const filteredVideos = getFilteredVideos(category.videos);
                    if (!isAdmin && filteredVideos.length === 0) return null;
                    
                    return (
                      <TabsContent key={category.id} value={category.id}>
                        <ScrollArea className="h-[500px] pr-4">
                          <div className="space-y-4">
                             {filteredVideos.map((video) => {
                               // Double-check filtering for non-admin users
                               if (!effectiveIsAdmin && !video.isPublished) {
                                 console.log(`Skipping unpublished video ${video.id} for non-admin user`);
                                 return null;
                               }
                               
                               return (
                               <div key={video.id} className="group">
                                 <Card className="hover:shadow-md transition-shadow cursor-pointer relative">
                                   <CardContent className="p-4">
                                     <div className="flex gap-3">
                                       <div className="flex-shrink-0 w-16 h-12 bg-muted rounded-md flex items-center justify-center">
                                         <Play className="h-4 w-4 text-muted-foreground" />
                                       </div>
                                       <div className="flex-1 min-w-0">
                                         <div className="flex items-center gap-2 mb-1">
                                           <h3 className="font-semibold text-sm truncate">{video.title}</h3>
                                              {effectiveIsAdmin && (
                                             <Badge variant={video.isPublished ? "default" : "secondary"} className="text-xs">
                                               {video.isPublished ? "Published" : "Draft"}
                                             </Badge>
                                           )}
                                         </div>
                                         <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                           {video.description}
                                         </p>
                                         <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                           <div className="flex items-center gap-1">
                                             <Clock className="h-3 w-3" />
                                             {video.duration}
                                           </div>
                                           <div className="flex items-center gap-1">
                                             <User className="h-3 w-3" />
                                             {video.instructor}
                                           </div>
                                         </div>
                                       </div>
                                     </div>
                                   </CardContent>
                                   {effectiveIsAdmin && (
                                     <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                       <Button
                                         variant="ghost"
                                         size="sm"
                                         onClick={(e) => {
                                           e.preventDefault();
                                           e.stopPropagation();
                                           handleToggleVideoPublish(video.id, category.id, video.isPublished);
                                         }}
                                         className="h-8 w-8 p-0 hover:bg-primary/10"
                                       >
                                         {video.isPublished ? (
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
                                           handleEditVideo(video.id);
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
                                             <AlertDialogTitle>Delete Video</AlertDialogTitle>
                                             <AlertDialogDescription>
                                               Are you sure you want to delete "{video.title}"? This action cannot be undone.
                                             </AlertDialogDescription>
                                           </AlertDialogHeader>
                                           <AlertDialogFooter>
                                             <AlertDialogCancel>Cancel</AlertDialogCancel>
                                             <AlertDialogAction
                                               onClick={() => handleDeleteVideo(video.id, category.id)}
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
                            {filteredVideos.length === 0 && (
                              <div className="text-center py-8 text-muted-foreground">
                                <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No videos in this category yet.</p>
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

            {/* Step by Step Docs Section */}
            {(effectiveIsAdmin || docData.some(cat => hasPublishedContent(cat, 'docs'))) && (
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
                          <ScrollArea className="h-[500px] pr-4">
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
    </div>
  );
}