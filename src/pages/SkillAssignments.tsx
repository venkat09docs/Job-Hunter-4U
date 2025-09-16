import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useInstituteName } from '@/hooks/useInstituteName';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, User, BookOpen, Award, Clock, CheckCircle2, AlertCircle, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface SubmittedAssignment {
  id: string;
  assignment_id: string;
  user_id: string;
  submitted_at: string;
  score_numeric: number | null;
  score_points: number;
  status: string;
  review_status: string;
  assignment: {
    title: string;
    type: string;
    instructions: string;
    section: {
      title: string;
      course: {
        title: string;
        category: string;
      };
    };
  };
  user_profile: {
    full_name: string;
    username: string;
    email: string;
  };
}

const SkillAssignments = () => {
  const { instituteName } = useInstituteName();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const { data: submittedAssignments = [], isLoading } = useQuery({
    queryKey: ['institute-submitted-assignments', selectedStatus],
    queryFn: async () => {
      // Get all attempts that are submitted by students of this institute
      let query = supabase
        .from('clp_attempts')
        .select(`
          *,
          assignment:clp_assignments(
            title,
            type,
            instructions,
            section:course_sections(
              title,
              course:clp_courses(
                title,
                category
              )
            )
          )
        `)
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: false });

      const { data: attempts, error } = await query;
      if (error) throw error;

      if (!attempts) return [];

      // Get user profiles for these attempts
      const userIds = attempts.map(attempt => attempt.user_id);
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name, username, email')
        .in('user_id', userIds);

      if (profileError) throw profileError;

      // Filter to only include students from this institute
      const { data: instituteStudents, error: instituteError } = await supabase
        .from('user_assignments')
        .select('user_id')
        .eq('is_active', true);

      if (instituteError) throw instituteError;

      const instituteStudentIds = instituteStudents?.map(s => s.user_id) || [];

      // Combine data and filter by institute students
      const submittedAssignments = attempts
        .filter(attempt => instituteStudentIds.includes(attempt.user_id))
        .map(attempt => ({
          ...attempt,
          user_profile: profiles?.find(p => p.user_id === attempt.user_id)
        }))
        .filter(assignment => assignment.user_profile); // Only include if we have profile data

      return submittedAssignments as SubmittedAssignment[];
    }
  });

  const getStatusBadge = (status: string, reviewStatus: string) => {
    if (status === 'submitted' && reviewStatus === 'pending') {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />Pending Review</Badge>;
    }
    if (reviewStatus === 'reviewed') {
      return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" />Reviewed</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  const getScoreDisplay = (scoreNumeric: number | null, scorePoints: number) => {
    if (scoreNumeric !== null) {
      return (
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-primary" />
          <span className="font-medium">{scoreNumeric.toFixed(1)}%</span>
          <span className="text-muted-foreground">({scorePoints} points)</span>
        </div>
      );
    }
    return <span className="text-muted-foreground">Not graded</span>;
  };

  const filteredAssignments = selectedStatus === 'all' 
    ? submittedAssignments 
    : submittedAssignments.filter(assignment => 
        selectedStatus === 'pending' ? assignment.review_status === 'pending' : assignment.review_status === selectedStatus
      );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <BookOpen className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Skill Assignments</h1>
            <p className="text-muted-foreground">Loading submitted assignments...</p>
          </div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <BookOpen className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Skill Assignments</h1>
          <p className="text-muted-foreground">
            Review submitted assignments from {instituteName} students
          </p>
        </div>
      </div>

      <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Submissions ({submittedAssignments.length})</TabsTrigger>
          <TabsTrigger value="pending">
            Pending Review ({submittedAssignments.filter(a => a.review_status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="reviewed">
            Reviewed ({submittedAssignments.filter(a => a.review_status === 'reviewed').length})
          </TabsTrigger>
          <TabsTrigger value="graded">
            Graded ({submittedAssignments.filter(a => a.score_numeric !== null).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedStatus} className="space-y-4">
          {filteredAssignments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No assignments found</h3>
                <p className="text-muted-foreground text-center">
                  {selectedStatus === 'all' 
                    ? "No students have submitted assignments yet." 
                    : `No assignments with ${selectedStatus} status.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredAssignments.map((assignment) => (
              <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        {assignment.assignment?.title || 'Assignment'}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {assignment.user_profile?.full_name} (@{assignment.user_profile?.username})
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-4 h-4" />
                          {format(new Date(assignment.submitted_at), 'PPp')}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(assignment.status, assignment.review_status)}
                      <Badge variant="outline" className="text-xs">
                        {assignment.assignment?.type?.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Course Information</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Course: {assignment.assignment?.section?.course?.title}</span>
                        <span>Section: {assignment.assignment?.section?.title}</span>
                        <span>Category: {assignment.assignment?.section?.course?.category}</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Score</h4>
                      {getScoreDisplay(assignment.score_numeric, assignment.score_points)}
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Student Contact</h4>
                      <p className="text-sm text-muted-foreground">{assignment.user_profile?.email}</p>
                    </div>

                    <div className="flex items-center gap-2 pt-4 border-t">
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Review Assignment
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SkillAssignments;