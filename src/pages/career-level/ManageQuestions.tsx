import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Plus, Trash2, Save, Edit3, Eye } from 'lucide-react';
import { useCareerLevelProgram } from '@/hooks/useCareerLevelProgram';
import { useToast } from '@/hooks/use-toast';
import type { Assignment, Question as DBQuestion, CreateQuestionData } from '@/types/clp';

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

const ManageQuestions: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  console.log('ManageQuestions component loaded with assignmentId:', assignmentId);
  const {
    loading,
    getAssignments,
    getQuestionsByAssignment,
    createQuestion,
    updateQuestion,
    deleteQuestion
  } = useCareerLevelProgram();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Question>({
    kind: 'mcq',
    prompt: '',
    options: ['', '', '', ''],
    correct_answers: [],
    expected_answer: '',
    instructions: '',
    marks: 1
  });

  useEffect(() => {
    console.log('ManageQuestions useEffect triggered with assignmentId:', assignmentId);
    if (assignmentId) {
      loadAssignmentAndQuestions();
    } else {
      console.error('No assignmentId found in URL params');
      toast({
        title: 'Error',
        description: 'Assignment ID not found in URL',
        variant: 'destructive'
      });
      navigate('/dashboard/career-level/dashboard');
    }
  }, [assignmentId]);

  const loadAssignmentAndQuestions = async () => {
    if (!assignmentId) return;
    
    try {
      const assignments = await getAssignments();
      const foundAssignment = assignments.find(a => a.id === assignmentId);
      
      if (foundAssignment) {
        setAssignment(foundAssignment);
        
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
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load assignment data',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      kind: 'mcq',
      prompt: '',
      options: ['', '', '', ''],
      correct_answers: [],
      expected_answer: '',
      instructions: '',
      marks: 1
    });
    setEditingQuestion(null);
    setShowAddForm(false);
  };

  const handleSaveQuestion = async () => {
    if (!assignmentId || !formData.prompt.trim()) {
      toast({
        title: 'Error',
        description: 'Question prompt is required',
        variant: 'destructive'
      });
      return;
    }

    try {
      const questionData: CreateQuestionData = {
        assignment_id: assignmentId,
        kind: formData.kind === 'task' ? 'descriptive' : formData.kind,
        prompt: formData.prompt,
        options: formData.options.filter(opt => opt.trim() !== ''),
        correct_answers: formData.correct_answers,
        marks: formData.marks,
        order_index: questions.length,
        metadata: {
          expected_answer: formData.expected_answer,
          instructions: formData.instructions
        }
      };

      if (editingQuestion?.id) {
        await updateQuestion(editingQuestion.id, questionData);
        setQuestions(questions.map(q => 
          q.id === editingQuestion.id ? { ...formData, id: editingQuestion.id } : q
        ));
        toast({
          title: 'Success',
          description: 'Question updated successfully'
        });
      } else {
        const newQuestion = await createQuestion(questionData);
        if (newQuestion) {
          setQuestions([...questions, { ...formData, id: newQuestion.id }]);
          toast({
            title: 'Success',
            description: 'Question added successfully'
          });
        }
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving question:', error);
      toast({
        title: 'Error',
        description: 'Failed to save question',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      await deleteQuestion(questionId);
      setQuestions(questions.filter(q => q.id !== questionId));
      toast({
        title: 'Success',
        description: 'Question deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete question',
        variant: 'destructive'
      });
    }
  };

  const handleEditQuestion = (question: Question) => {
    // Create a clean copy of the question data
    const cleanFormData = {
      ...question,
      // Ensure correct_answers is properly formatted for editing
      correct_answers: question.kind === 'mcq' || question.kind === 'tf' 
        ? (question.correct_answers.length > 0 ? [question.correct_answers[0]] : [])
        : question.correct_answers
    };
    setFormData(cleanFormData);
    setEditingQuestion(question);
    setShowAddForm(true);
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const handleCorrectAnswerChange = (value: string) => {
    console.log('Setting correct answer to:', value);
    if (formData.kind === 'mcq') {
      setFormData({ ...formData, correct_answers: [value] });
    } else if (formData.kind === 'tf') {
      setFormData({ ...formData, correct_answers: [value] });
    }
  };

  const addOption = () => {
    setFormData({ 
      ...formData, 
      options: [...formData.options, ''] 
    });
  };

  const removeOption = (index: number) => {
    const newOptions = formData.options.filter((_, i) => i !== index);
    setFormData({ ...formData, options: newOptions });
  };

  if (loading || !assignment) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" asChild>
            <Link to="/dashboard/career-level/assignments">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Assignments
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Manage Questions</h1>
            <p className="text-muted-foreground">{assignment.title}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Questions List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Questions ({questions.length})</h2>
              <Button onClick={() => {
                resetForm();
                setShowAddForm(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>

            {questions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">No questions yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start by adding your first question to this assignment.
                    </p>
                    <Button onClick={() => {
                      resetForm();
                      setShowAddForm(true);
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Question
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              questions.map((question, index) => (
                <Card key={question.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Q{index + 1}</Badge>
                      <Badge variant="secondary">{question.kind.toUpperCase()}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {question.marks} mark{question.marks !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditQuestion(question)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => question.id && handleDeleteQuestion(question.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="font-medium">{question.prompt}</p>
                    
                    {(question.kind === 'mcq' || question.kind === 'tf') && (
                      <div className="space-y-1">
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2">
                            <span className={`text-sm px-2 py-1 rounded ${
                              question.correct_answers.includes(option) 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100'
                            }`}>
                              {String.fromCharCode(65 + optIndex)}. {option}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {question.instructions && (
                      <p className="text-sm text-muted-foreground">
                        Instructions: {question.instructions}
                      </p>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Add/Edit Question Form */}
          {showAddForm && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {editingQuestion ? 'Edit Question' : 'Add New Question'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Question Type */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Question Type</label>
                    <Select 
                      value={formData.kind} 
                      onValueChange={(value: any) => {
                        // Reset correct_answers when changing question type
                        setFormData({ 
                          ...formData, 
                          kind: value,
                          correct_answers: [],
                          options: value === 'tf' ? ['True', 'False'] : ['', '', '', '']
                        });
                      }}
                    >
                      <SelectTrigger>
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

                  {/* Question Prompt */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Question *</label>
                    <Textarea
                      value={formData.prompt}
                      onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                      placeholder="Enter your question..."
                      rows={3}
                    />
                  </div>

                  {/* Options for MCQ/TF */}
                  {(formData.kind === 'mcq' || formData.kind === 'tf') && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Options</label>
                      <div className="space-y-2">
                        {formData.options.map((option, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={option}
                              onChange={(e) => handleOptionChange(index, e.target.value)}
                              placeholder={`Option ${String.fromCharCode(65 + index)}`}
                            />
                            {formData.options.length > 2 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeOption(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        {formData.kind === 'mcq' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={addOption}
                            className="w-full"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Option
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Correct Answer */}
                  {(formData.kind === 'mcq' || formData.kind === 'tf') && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Correct Answer</label>
                      <Select 
                        value={formData.correct_answers[0] || ''} 
                        onValueChange={handleCorrectAnswerChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select correct answer" />
                        </SelectTrigger>
                        <SelectContent>
                          {formData.options.filter(opt => opt.trim()).map((option, index) => (
                            <SelectItem key={index} value={option}>
                              {String.fromCharCode(65 + index)}. {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Expected Answer for Descriptive */}
                  {(formData.kind === 'descriptive' || formData.kind === 'task') && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Expected Answer/Keywords</label>
                      <Textarea
                        value={formData.expected_answer}
                        onChange={(e) => setFormData({ ...formData, expected_answer: e.target.value })}
                        placeholder="Enter expected answer or key points..."
                        rows={3}
                      />
                    </div>
                  )}

                  {/* Instructions */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Additional Instructions</label>
                    <Textarea
                      value={formData.instructions}
                      onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                      placeholder="Any additional instructions for this question..."
                      rows={2}
                    />
                  </div>

                  {/* Marks */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Marks</label>
                    <Input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={formData.marks}
                      onChange={(e) => setFormData({ ...formData, marks: parseFloat(e.target.value) || 1 })}
                    />
                  </div>

                  <Separator />

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button onClick={handleSaveQuestion} className="flex-1">
                      <Save className="h-4 w-4 mr-2" />
                      {editingQuestion ? 'Update' : 'Add'} Question
                    </Button>
                    <Button variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageQuestions;