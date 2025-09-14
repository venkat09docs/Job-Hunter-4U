import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BookOpen, Target, ExternalLink, CheckCircle } from 'lucide-react';
import { useLearningGoals } from '@/hooks/useLearningGoals';
import { format } from 'date-fns';

export function CompletedLearningGoals() {
  const { goals, loading } = useLearningGoals();

  // Filter only completed goals
  const completedGoals = goals.filter(goal => goal.status === 'completed' || goal.progress === 100);

  if (loading) {
    return (
      <Card className="shadow-elegant border-primary/20">
        <CardContent className="py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading completed learning goals...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-elegant border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Completed Learning Goals
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Track your learning achievements and completed skill development goals
              </p>
            </div>
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
              {completedGoals.length} Completed
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {completedGoals.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No completed goals yet</h3>
              <p className="text-muted-foreground mb-4">
                Keep working on your learning goals to see your achievements here.
              </p>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/resources-library?tab=skills-learning'}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Manage Learning Goals
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Skill</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Completed Date</TableHead>
                  <TableHead>Resources</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedGoals.map((goal) => (
                  <TableRow key={goal.id} className="bg-green-50/50">
                    <TableCell>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          {goal.skill_name}
                        </div>
                        {goal.description && (
                          <div className="text-sm text-muted-foreground">{goal.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={goal.priority === 'high' ? 'destructive' : goal.priority === 'medium' ? 'default' : 'secondary'}>
                        {goal.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-green-600">100%</span>
                        </div>
                        <Progress value={100} className="h-2 w-20" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="text-green-600 font-medium">
                          {format(new Date(goal.end_date), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {goal.resources && goal.resources.length > 0 ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="ghost" title="View Learning Resources">
                                <ExternalLink className="h-4 w-4" />
                                <span className="ml-1 text-xs">{goal.resources.length}</span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle>Learning Resources</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-3">
                                <p className="text-sm text-muted-foreground">
                                  Resources used for {goal.skill_name}:
                                </p>
                                {goal.resources.map((resource: any, index: number) => (
                                  <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
                                    <div>
                                      <div className="font-medium text-sm">{resource.name}</div>
                                      <Badge variant="outline" className="text-xs mt-1">
                                        {resource.type}
                                      </Badge>
                                    </div>
                                    <Button
                                      size="sm"
                                      onClick={() => window.open(resource.url, '_blank')}
                                      className="shrink-0"
                                    >
                                      <ExternalLink className="h-4 w-4 mr-1" />
                                      Open
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <span className="text-xs text-muted-foreground">No resources</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}