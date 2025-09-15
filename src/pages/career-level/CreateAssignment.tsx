import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Plus, Trash2, Save, Eye } from 'lucide-react';
import { useCareerLevelProgram } from '@/hooks/useCareerLevelProgram';
import { useCourseContent } from '@/hooks/useCourseContent';
import { useToast } from '@/hooks/use-toast';
import type { Course, CreateAssignmentData, CreateQuestionData } from '@/types/clp';

interface CourseSection {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  order_index: number;
  is_active: boolean;
}

const assignmentSchema = z.object({
  section_id: z.string().min(1, 'Section is required'),
  title: z.string().min(1, 'Title is required'),
  instructions: z.string().optional(),
  visible_from: z.string().optional(),
  start_at: z.string().optional(),
  end_at: z.string().optional(),
  due_at: z.string().optional(),
  duration_minutes: z.coerce.number().min(1).optional(),
  randomize_questions: z.boolean().default(false),
  shuffle_options: z.boolean().default(false),
  negative_marking: z.boolean().default(false),
  max_attempts: z.coerce.number().min(1).default(1),
  attempt_policy: z.enum(['best', 'last']).default('best'),
  attachments_required: z.boolean().default(false),
  is_published: z.boolean().default(false),
});

type AssignmentFormData = z.infer<typeof assignmentSchema>;

interface Question {
  id?: string;
  kind: 'mcq' | 'tf' | 'descriptive' | 'task';
  prompt: string;
  options: string[];
  correct_answers: string[];
  expected_answer?: string;
  instructions?: string;
  marks: number;
}

const CreateAssignment = () => {
  const navigate = useNavigate();
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { toast } = useToast();
  const { 
    createAssignment, 
    updateAssignment,
    createQuestion,
    updateQuestion: updateQuestionInDB,
    deleteQuestion,
    getCourses, 
    getAssignments,
    getQuestionsByAssignment,
    loading 
  } = useCareerLevelProgram();
  
  const { getSectionsByCourse } = useCourseContent();
  
  const isEditing = Boolean(assignmentId);

  const [courses, setCourses] = useState<Course[]>([]);
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loadingAssignment, setLoadingAssignment] = useState(false);

  // Get unique categories from courses
  const categories = Array.from(new Set(courses.map(course => course.category).filter(Boolean)));
  
  // Filter courses by selected category
  const filteredCourses = selectedCategory 
    ? courses.filter(course => course.category === selectedCategory)
    : courses;

  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      randomize_questions: false,
      shuffle_options: false,
      negative_marking: false,
      max_attempts: 1,
      attempt_policy: 'best',
      attachments_required: false,
      is_published: false,
    },
  });

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    // Only load assignment data after courses are loaded
    if (isEditing && assignmentId && courses.length > 0) {
      loadAssignmentForEditing(assignmentId);
    }
  }, [isEditing, assignmentId, courses.length]);

  useEffect(() => {
    if (selectedCourse) {
      loadSections(selectedCourse);
    } else {
      setSections([]);
    }
  }, [selectedCourse]);

  useEffect(() => {
    // Only reset course selection if not in editing mode AND not currently loading assignment data
    if (selectedCategory && !loadingAssignment && !isEditing) {
      setSelectedCourse('');
      setSections([]);
    }
  }, [selectedCategory, loadingAssignment, isEditing]);

  const loadAssignmentForEditing = async (assignmentId: string) => {
    setLoadingAssignment(true);
    try {
      const assignments = await getAssignments();
      const assignment = assignments.find(a => a.id === assignmentId);
      
      if (assignment && assignment.section) {
        const courseId = assignment.section.course_id;
        const courseData = courses.find(c => c.id === courseId);
        
        if (courseData) {
          console.log('Setting assignment data:', { 
            category: courseData.category, 
            courseId: courseId,
            sectionId: assignment.section_id 
          });
          
          // Set states in the correct order
          setSelectedCategory(courseData.category || '');
          setSelectedCourse(courseId);
          
          // Load sections and wait for them to be loaded
          await loadSections(courseId);
          
          // Reset form with all data
          form.reset({
            section_id: assignment.section_id,
            title: assignment.title,
            instructions: assignment.instructions || '',
            visible_from: assignment.visible_from ? new Date(assignment.visible_from).toISOString().slice(0, 16) : '',
            start_at: assignment.start_at ? new Date(assignment.start_at).toISOString().slice(0, 16) : '',
            end_at: assignment.end_at ? new Date(assignment.end_at).toISOString().slice(0, 16) : '',
            due_at: assignment.due_at ? new Date(assignment.due_at).toISOString().slice(0, 16) : '',
            duration_minutes: assignment.duration_minutes || undefined,
            randomize_questions: assignment.randomize_questions || false,
            shuffle_options: assignment.shuffle_options || false,
            negative_marking: assignment.negative_marking || false,
            max_attempts: assignment.max_attempts || 1,
            attempt_policy: assignment.attempt_policy || 'best',
            attachments_required: assignment.attachments_required || false,
            is_published: assignment.is_published || false,
          });
        }
        
        try {
          const questionsData = await getQuestionsByAssignment(assignmentId);
          const formattedQuestions: Question[] = questionsData.map(q => ({
            id: q.id,
            kind: q.kind,
            prompt: q.prompt,
            options: Array.isArray(q.options) ? q.options : [],
            correct_answers: Array.isArray(q.correct_answers) ? q.correct_answers : [],
            expected_answer: q.metadata?.expected_answer || '',
            instructions: q.metadata?.instructions || '',
            marks: Number(q.marks) || 1,
          }));
          setQuestions(formattedQuestions);
        } catch (error) {
          console.error('Error loading questions:', error);
        }
      }
    } catch (error) {
      console.error('Error loading assignment:', error);
      toast({
        title: 'Error',
        description: 'Failed to load assignment for editing',
        variant: 'destructive'
      });
    } finally {
      setLoadingAssignment(false);
    }
  };

  const loadCourses = async () => {
    try {
      const coursesData = await getCourses();
      setCourses(coursesData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load courses',
        variant: 'destructive'
      });
    }
  };

  const loadSections = async (courseId: string) => {
    try {
      const sectionsData = await getSectionsByCourse(courseId);
      setSections(sectionsData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load sections',
        variant: 'destructive'
      });
    }
  };

  const onSubmit = async (data: AssignmentFormData) => {
    try {
      const cleanedData = {
        section_id: data.section_id, // Use section_id directly
        title: data.title,
        instructions: data.instructions,
        visible_from: data.visible_from || null,
        start_at: data.start_at || null,
        end_at: data.end_at || null,
        due_at: data.due_at || null,
        duration_minutes: data.duration_minutes || null,
        randomize_questions: data.randomize_questions,
        shuffle_options: data.shuffle_options,
        negative_marking: data.negative_marking,
        max_attempts: data.max_attempts,
        attempt_policy: data.attempt_policy,
        attachments_required: data.attachments_required,
        is_published: data.is_published,
        type: (data as any).type as 'mcq' | 'tf' | 'descriptive' | 'task',
      };

      const hasObjectiveQuestions = questions.some(q => ['mcq', 'tf'].includes(q.kind));
      const hasSubjectiveQuestions = questions.some(q => ['descriptive', 'task'].includes(q.kind));
      
      let assignmentType: 'mcq' | 'tf' | 'descriptive' | 'task';
      if (hasObjectiveQuestions && hasSubjectiveQuestions) {
        assignmentType = 'mcq';
      } else if (questions.length > 0) {
        assignmentType = questions[0].kind;
      } else {
        assignmentType = 'mcq';
      }

      if (isEditing && assignmentId) {
        const assignmentData = { ...cleanedData, type: assignmentType } as Partial<CreateAssignmentData>;
        const assignment = await updateAssignment(assignmentId, assignmentData);
        if (!assignment) throw new Error('Failed to update assignment');

        const existingQuestions = await getQuestionsByAssignment(assignmentId);
        
        for (let i = 0; i < questions.length; i++) {
          const question = questions[i];
          const questionData = {
            assignment_id: assignmentId,
            kind: question.kind === 'task' ? 'descriptive' : question.kind,
            prompt: question.prompt,
            options: question.options,
            correct_answers: question.correct_answers,
            marks: question.marks,
            order_index: i,
            metadata: {
              expected_answer: question.expected_answer,
              instructions: question.instructions
            }
          };

          if (question.id && existingQuestions.find(eq => eq.id === question.id)) {
            await updateQuestionInDB(question.id, questionData);
          } else {
            const newQuestion = await createQuestion(questionData as CreateQuestionData);
            if (newQuestion) {
              const updatedQuestions = [...questions];
              updatedQuestions[i] = { ...updatedQuestions[i], id: newQuestion.id };
              setQuestions(updatedQuestions);
            }
          }
        }

        const questionsToDelete = existingQuestions.filter(
          eq => !questions.find(q => q.id === eq.id)
        );
        
        for (const questionToDelete of questionsToDelete) {
          await deleteQuestion(questionToDelete.id);
        }

        toast({
          title: 'Success',
          description: 'Assignment updated successfully'
        });
      } else {
        const assignmentData = { ...cleanedData, type: assignmentType } as CreateAssignmentData;
        const assignment = await createAssignment(assignmentData);
        if (!assignment) throw new Error('Failed to create assignment');

        if (questions.length > 0) {
          for (const question of questions) {
            const questionData: CreateQuestionData = {
              assignment_id: assignment.id,
              kind: question.kind === 'task' ? 'descriptive' : question.kind,
              prompt: question.prompt,
              options: question.options,
              correct_answers: question.correct_answers,
              marks: question.marks,
              order_index: questions.indexOf(question),
              metadata: {
                expected_answer: question.expected_answer,
                instructions: question.instructions
              }
            };
            await createQuestion(questionData);
          }
        }

        toast({
          title: 'Success',
          description: 'Assignment created successfully'
        });
      }

      navigate('/dashboard/career-level/dashboard');
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: 'Error',
        description: isEditing ? 'Failed to update assignment' : 'Failed to create assignment',
        variant: 'destructive'
      });
    }
  };

  if (loading || loadingAssignment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading assignment...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? 'Edit Assignment' : 'Create New Assignment'}
            </h1>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Assignment Details Card */}
            <Card>
              <CardHeader>
                <CardTitle>Assignment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Category Selection */}
                  <div>
                    <label className="text-sm font-medium">Category *</label>
                    <Select 
                      value={selectedCategory}
                      onValueChange={setSelectedCategory}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Course Selection */}
                  <div>
                    <label className="text-sm font-medium">Course *</label>
                    <Select 
                      value={selectedCourse}
                      onValueChange={setSelectedCourse}
                      disabled={!selectedCategory}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder={selectedCategory ? "Select course" : "Select category first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredCourses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Section Selection */}
                  <FormField
                    control={form.control}
                    name="section_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Section *</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={!selectedCourse}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={selectedCourse ? "Select section" : "Select course first"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {sections.map((section) => (
                              <SelectItem key={section.id} value={section.id}>
                                {section.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assignment Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter assignment title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instructions</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter assignment instructions..."
                          {...field}
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? 'Update Assignment' : 'Create Assignment'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default CreateAssignment;