import { useState } from 'react';
import { useInstituteStudents } from '@/hooks/useInstituteStudents';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Download, 
  Users, 
  RefreshCw, 
  TrendingUp, 
  User, 
  Briefcase, 
  Linkedin, 
  Github,
  Home 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { useInstituteName } from '@/hooks/useInstituteName';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import { InstituteSubscriptionBadge } from '@/components/InstituteSubscriptionBadge';

export default function StudentsReport() {
  const { batches, loading, refreshData, exportToExcel } = useInstituteStudents();
  const { toast } = useToast();
  const { instituteName } = useInstituteName();
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const totalStudents = batches.reduce((sum, batch) => sum + batch.student_count, 0);
  const averageProfileCompletion = batches.length > 0 
    ? Math.round(
        batches.reduce((sum, batch) => 
          sum + batch.students.reduce((batchSum, student) => 
            batchSum + student.profile_completion, 0
          ) / batch.students.length, 0
        ) / batches.length
      ) 
    : 0;

  const handleBatchSelection = (batchId: string, checked: boolean) => {
    if (checked) {
      setSelectedBatches(prev => [...prev, batchId]);
      // Also select all students in this batch
      const batchStudents = batches.find(b => b.batch_id === batchId)?.students || [];
      setSelectedStudents(prev => [...prev, ...batchStudents.map(s => s.user_id)]);
    } else {
      setSelectedBatches(prev => prev.filter(id => id !== batchId));
      // Deselect all students in this batch
      const batchStudents = batches.find(b => b.batch_id === batchId)?.students || [];
      setSelectedStudents(prev => 
        prev.filter(id => !batchStudents.some(s => s.user_id === id))
      );
    }
  };

  const handleStudentSelection = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedStudents(prev => [...prev, studentId]);
    } else {
      setSelectedStudents(prev => prev.filter(id => id !== studentId));
      // If this was the last student in a batch, deselect the batch too
      const student = batches.flatMap(b => b.students).find(s => s.user_id === studentId);
      if (student) {
        const batchStudents = batches.find(b => b.batch_id === student.batch_id)?.students || [];
        const remainingSelected = batchStudents.filter(s => 
          s.user_id !== studentId && selectedStudents.includes(s.user_id)
        );
        if (remainingSelected.length === 0) {
          setSelectedBatches(prev => prev.filter(id => id !== student.batch_id));
        }
      }
    }
  };

  const handleExportSelected = () => {
    if (selectedStudents.length === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select students or batches to export',
        variant: 'destructive'
      });
      return;
    }
    exportToExcel(selectedBatches, selectedStudents);
  };

  const handleExportAll = () => {
    exportToExcel();
  };

  const getStatusColor = (value: number, type: 'profile' | 'github') => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-yellow-500';
    if (value >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getActivityStatus = (lastActivity: string) => {
    if (lastActivity === 'Never') return { color: 'bg-gray-500', text: 'Inactive' };
    
    const activityDate = new Date(lastActivity);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 1) return { color: 'bg-green-500', text: 'Active' };
    if (daysDiff <= 7) return { color: 'bg-yellow-500', text: 'Recent' };
    if (daysDiff <= 30) return { color: 'bg-orange-500', text: 'Moderate' };
    return { color: 'bg-red-500', text: 'Inactive' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="border-b bg-card">
          <div className="container mx-auto flex items-center justify-between p-4">
            <div>
              <h1 className="text-xl font-semibold">
                {instituteName ? `${instituteName} - Students Report` : 'Students Report'}
              </h1>
              <p className="text-sm text-muted-foreground">
                Monitor and track student progress across all batches
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <InstituteSubscriptionBadge />
              <UserProfileDropdown />
            </div>
          </div>
        </div>
        
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Report Overview</h2>
              <p className="text-muted-foreground">
                Detailed analytics and insights
              </p>
            </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard">
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Link>
          </Button>
          <Button onClick={refreshData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExportSelected} disabled={selectedStudents.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export Selected
          </Button>
          <Button onClick={handleExportAll} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Across {batches.length} batches
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Profile Completion</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageProfileCompletion}%</div>
            <Progress value={averageProfileCompletion} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selected for Export</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedStudents.length}</div>
            <p className="text-xs text-muted-foreground">
              Students selected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Batches</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{batches.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Batch-wise Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed View</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {batches.map((batch) => (
            <Card key={batch.batch_id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedBatches.includes(batch.batch_id)}
                      onCheckedChange={(checked) => 
                        handleBatchSelection(batch.batch_id, checked as boolean)
                      }
                    />
                    <div>
                      <CardTitle>{batch.batch_name}</CardTitle>
                      <CardDescription>
                        {batch.student_count} students
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {batch.student_count} Students
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {batch.students.slice(0, 8).map((student) => (
                    <div key={student.user_id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <Checkbox
                          checked={selectedStudents.includes(student.user_id)}
                          onCheckedChange={(checked) => 
                            handleStudentSelection(student.user_id, checked as boolean)
                          }
                        />
                        <Badge 
                          variant="outline" 
                          className={`${getActivityStatus(student.last_activity).color} text-white`}
                        >
                          {getActivityStatus(student.last_activity).text}
                        </Badge>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{student.full_name}</p>
                        <p className="text-xs text-muted-foreground">{student.username}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Profile</span>
                          <span>{student.profile_completion}%</span>
                        </div>
                        <Progress value={student.profile_completion} className="h-1" />
                      </div>
                      <div className="flex justify-between text-xs">
                        <div className="flex items-center">
                          <Briefcase className="h-3 w-3 mr-1" />
                          {student.active_job_applications}
                        </div>
                        <div className="flex items-center">
                          <Linkedin className="h-3 w-3 mr-1" />
                          {student.linkedin_connections}
                        </div>
                        <div className="flex items-center">
                          <Github className="h-3 w-3 mr-1" />
                          {student.github_completion}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {batch.students.length > 8 && (
                  <p className="text-sm text-muted-foreground mt-4">
                    ... and {batch.students.length - 8} more students
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Students Details</CardTitle>
              <CardDescription>
                Comprehensive view of all student activities and progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedStudents.length === totalStudents}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            const allStudentIds = batches.flatMap(b => b.students.map(s => s.user_id));
                            setSelectedStudents(allStudentIds);
                            setSelectedBatches(batches.map(b => b.batch_id));
                          } else {
                            setSelectedStudents([]);
                            setSelectedBatches([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Profile</TableHead>
                    <TableHead>Job Apps</TableHead>
                    <TableHead>LinkedIn</TableHead>
                    <TableHead>GitHub</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.flatMap(batch => 
                    batch.students.map(student => (
                      <TableRow key={student.user_id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedStudents.includes(student.user_id)}
                            onCheckedChange={(checked) => 
                              handleStudentSelection(student.user_id, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{student.full_name}</p>
                            <p className="text-sm text-muted-foreground">{student.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{student.batch_name}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress value={student.profile_completion} className="w-16 h-2" />
                            <span className="text-sm">{student.profile_completion}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            <p className="font-medium">{student.active_job_applications}</p>
                            <p className="text-xs text-muted-foreground">
                              /{student.total_job_applications} total
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            <p className="font-medium">{student.linkedin_connections}</p>
                            <p className="text-xs text-muted-foreground">
                              {student.linkedin_posts} posts
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress value={student.github_completion} className="w-16 h-2" />
                            <span className="text-sm">{student.github_completion}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {student.last_activity === 'Never' ? 'Never' : 
                            new Date(student.last_activity).toLocaleDateString()
                          }
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`${getActivityStatus(student.last_activity).color} text-white`}
                          >
                            {getActivityStatus(student.last_activity).text}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}