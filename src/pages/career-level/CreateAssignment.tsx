import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useToast } from '@/hooks/use-toast';
import type { Course, Module, CreateAssignmentData, CreateQuestionData } from '@/types/clp';

const assignmentSchema = z.object({
  module_id: z.string().min(1, 'Module is required'),
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
  expected_answer?: string; // For descriptive questions - admin's expected answer
  instructions?: string; // For task/project questions - detailed instructions
  marks: number;
}

const CreateAssignment = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    createAssignment, 
    createQuestion,
    getCourses, 
    getModulesByCourse,
    loading 
  } = useCareerLevelProgram();

  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

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
    if (selectedCourse) {
      loadModules(selectedCourse);
    }
  }, [selectedCourse]);

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

  const loadModules = async (courseId: string) => {
    try {
      const modulesData = await getModulesByCourse(courseId);
      setModules(modulesData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load modules',
        variant: 'destructive'
      });
    }
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      kind: 'mcq',
      prompt: '',
      options: ['', '', '', ''],
      correct_answers: [],
      marks: 1,
    };
    setQuestions([...questions, newQuestion]);
    setCurrentQuestionIndex(questions.length);
  };

  const updateQuestion = (index: number, updatedQuestion: Partial<Question>) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], ...updatedQuestion };
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
    if (currentQuestionIndex >= newQuestions.length && newQuestions.length > 0) {
      setCurrentQuestionIndex(newQuestions.length - 1);
    } else if (newQuestions.length === 0) {
      setCurrentQuestionIndex(0);
    }
  };

  const onSubmit = async (data: AssignmentFormData) => {
    try {
      // Determine assignment type based on questions
      const hasObjectiveQuestions = questions.some(q => ['mcq', 'tf'].includes(q.kind));
      const hasSubjectiveQuestions = questions.some(q => ['descriptive', 'task'].includes(q.kind));
      
      let assignmentType: 'mcq' | 'tf' | 'descriptive' | 'task';
      if (hasObjectiveQuestions && hasSubjectiveQuestions) {
        assignmentType = 'mcq'; // Mixed type, default to mcq
      } else if (questions.length > 0) {
        assignmentType = questions[0].kind;
      } else {
        assignmentType = 'mcq'; // Default
      }

      // Create assignment with inferred type
      const assignmentData = { ...data, type: assignmentType } as CreateAssignmentData;
      const assignment = await createAssignment(assignmentData);
      if (!assignment) throw new Error('Failed to create assignment');

      // Create all questions
      if (questions.length > 0) {
        for (const question of questions) {
          const questionData: CreateQuestionData = {
            assignment_id: assignment.id,
            kind: question.kind === 'task' ? 'descriptive' : question.kind, // Map task to descriptive for database
            prompt: question.prompt,
            options: question.options,
            correct_answers: question.correct_answers,
            marks: question.marks,
            order_index: questions.indexOf(question),
          };
          await createQuestion(questionData);
        }
      }

      toast({
        title: 'Success',
        description: 'Assignment created successfully'
      });

      navigate('/dashboard/career-level/dashboard');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create assignment',
        variant: 'destructive'
      });
    }
  };

  const renderQuestionEditor = (question: Question, index: number) => (
    <Card key={index} className="mb-4">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Question {index + 1}</CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeQuestion(index)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Question Type</label>
          <Select 
            value={question.kind}
            onValueChange={(value: 'mcq' | 'tf' | 'descriptive' | 'task') => {
              const updatedQuestion: Partial<Question> = { kind: value };
              
              // Reset options based on question type
              if (value === 'mcq') {
                updatedQuestion.options = ['', '', '', ''];
                updatedQuestion.correct_answers = [];
              } else if (value === 'tf') {
                updatedQuestion.options = ['True', 'False'];
                updatedQuestion.correct_answers = [];
              } else {
                updatedQuestion.options = [];
                updatedQuestion.correct_answers = [];
              }
              
              updateQuestion(index, updatedQuestion);
            }}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mcq">Multiple Choice</SelectItem>
              <SelectItem value="tf">True/False</SelectItem>
              <SelectItem value="descriptive">Descriptive</SelectItem>
              <SelectItem value="task">Task/Project</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Question Prompt</label>
          <Textarea
            placeholder="Enter your question here..."
            value={question.prompt}
            onChange={(e) => updateQuestion(index, { prompt: e.target.value })}
            className="mt-1"
          />
        </div>

        {question.kind === 'mcq' && (
          <div>
            <label className="text-sm font-medium">Options</label>
            <p className="text-xs text-muted-foreground mb-2">Check the box next to correct answer(s)</p>
            <div className="space-y-2 mt-2">
              {question.options.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center gap-2">
                  <Input
                    placeholder={`Option ${optionIndex + 1}`}
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...question.options];
                      newOptions[optionIndex] = e.target.value;
                      
                      // Update correct answers if this option was marked as correct
                      let newCorrect = [...question.correct_answers];
                      const oldOptionValue = question.options[optionIndex];
                      if (newCorrect.includes(oldOptionValue)) {
                        newCorrect = newCorrect.filter(ans => ans !== oldOptionValue);
                        newCorrect.push(e.target.value);
                      }
                      
                      updateQuestion(index, { options: newOptions, correct_answers: newCorrect });
                    }}
                    className={question.correct_answers.includes(option) ? "ring-2 ring-green-500" : ""}
                  />
                  <div className="flex items-center gap-1">
                    <Checkbox
                      checked={question.correct_answers.includes(option)}
                      disabled={option.trim() === ''}
                      onCheckedChange={(checked) => {
                        if (option.trim() === '') {
                          return; // Don't allow checking empty options
                        }
                        
                        let newCorrect = [...question.correct_answers];
                        if (checked) {
                          if (!newCorrect.includes(option)) {
                            newCorrect.push(option);
                          }
                        } else {
                          newCorrect = newCorrect.filter(ans => ans !== option);
                        }
                        updateQuestion(index, { correct_answers: newCorrect });
                      }}
                    />
                    <span className="text-xs text-muted-foreground">Correct</span>
                  </div>
                </div>
              ))}
            </div>
            {question.correct_answers.length > 0 && (
              <div className="mt-2">
                <Badge variant="secondary" className="text-xs">
                  {question.correct_answers.length} correct answer(s) selected
                </Badge>
              </div>
            )}
          </div>
        )}

        {question.kind === 'tf' && (
          <div>
            <label className="text-sm font-medium">Correct Answer</label>
            <Select 
              value={question.correct_answers[0] || ''}
              onValueChange={(value) => updateQuestion(index, { correct_answers: [value] })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select correct answer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="True">True</SelectItem>
                <SelectItem value="False">False</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {question.kind === 'descriptive' && (
          <div>
            <label className="text-sm font-medium">Expected Answer</label>
            <p className="text-xs text-muted-foreground mb-2">Provide the expected answer for admin verification</p>
            <Textarea
              placeholder="Enter the expected answer for this descriptive question..."
              value={question.expected_answer || ''}
              onChange={(e) => updateQuestion(index, { expected_answer: e.target.value })}
              className="mt-1 min-h-[100px]"
            />
          </div>
        )}

        {question.kind === 'task' && (
          <div>
            <label className="text-sm font-medium">Instructions</label>
            <p className="text-xs text-muted-foreground mb-2">Provide detailed instructions for this task/project</p>
            <Textarea
              placeholder="Enter detailed instructions for this task or project..."
              value={question.instructions || ''}
              onChange={(e) => updateQuestion(index, { instructions: e.target.value })}
              className="mt-1 min-h-[120px]"
            />
          </div>
        )}

        <div>
          <label className="text-sm font-medium">Marks</label>
          <Input
            type="number"
            min="1"
            value={question.marks}
            onChange={(e) => updateQuestion(index, { marks: parseInt(e.target.value) || 1 })}
            className="mt-1 w-24"
          />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard/career-level/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Create Assignment</h1>
          <p className="text-muted-foreground">Build a new assignment for your students</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  Assignment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Course Selection */}
                  <div>
                    <label className="text-sm font-medium">Course</label>
                    <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Module Selection */}
                  <FormField
                    control={form.control}
                    name="module_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Module</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a module" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {modules.map((module) => (
                              <SelectItem key={module.id} value={module.id}>
                                {module.title}
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
                      <FormLabel>Assignment Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., React Hooks Quiz" {...field} />
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
                          placeholder="Provide detailed instructions for the assignment..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Step 2: Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  Assignment Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="duration_minutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (minutes)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" placeholder="60" {...field} />
                        </FormControl>
                        <FormDescription>Leave empty for no time limit</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="max_attempts"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Attempts</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" placeholder="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="attempt_policy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scoring Policy</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="best">Best Attempt</SelectItem>
                            <SelectItem value="last">Last Attempt</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Settings Checkboxes */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="randomize_questions"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Randomize Questions</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="shuffle_options"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Shuffle Options</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="negative_marking"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Negative Marking</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_published"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Publish Now</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Step 3: Questions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    Questions
                    {questions.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {currentQuestionIndex + 1} of {questions.length}
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button type="button" onClick={addQuestion} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Question
                    </Button>
                    
                    {questions.length > 1 && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                          disabled={currentQuestionIndex === 0}
                        >
                          Previous
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                          disabled={currentQuestionIndex === questions.length - 1}
                        >
                          Next
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {questions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No questions added yet. Click "Add Question" to get started.
                  </div>
                ) : (
                  renderQuestionEditor(questions[currentQuestionIndex], currentQuestionIndex)
                )}
              </CardContent>
            </Card>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard/career-level/dashboard')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Create Assignment
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default CreateAssignment;