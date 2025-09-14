import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ExternalLink, Save, X } from 'lucide-react';
import { useLearningGoals } from '@/hooks/useLearningGoals';
import { useCareerLevelProgram } from '@/hooks/useCareerLevelProgram';
import type { LearningGoal, CreateLearningGoalData } from '@/hooks/useLearningGoals';

interface LearningGoalFormProps {
  goal?: LearningGoal;
  onSubmit: (data: CreateLearningGoalData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

interface Resource {
  name: string;
  url: string;
  type: string;
}

export function LearningGoalForm({ goal, onSubmit, onCancel, isLoading }: LearningGoalFormProps) {
  const { getCourses } = useCareerLevelProgram();
  const [courses, setCourses] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    skill_name: goal?.skill_name || '',
    description: goal?.description || '',
    start_date: goal?.start_date ? new Date(goal.start_date).toISOString().split('T')[0] : '',
    end_date: goal?.end_date ? new Date(goal.end_date).toISOString().split('T')[0] : '',
    priority: goal?.priority || 'medium',
    notes: goal?.notes || '',
    course_id: goal?.course_id || 'none'
  });
  const [resources, setResources] = useState<Resource[]>(goal?.resources || []);

  // Load courses for selection
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const coursesData = await getCourses();
        setCourses(coursesData);
      } catch (error) {
        console.error('Error loading courses:', error);
      }
    };
    loadCourses();
  }, [getCourses]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addResource = () => {
    const newResource = { name: '', url: '', type: 'documentation' };
    setResources(prev => [...prev, newResource]);
  };

  const updateResource = (index: number, field: keyof Resource, value: string) => {
    setResources(prev => prev.map((resource, i) => 
      i === index ? { ...resource, [field]: value } : resource
    ));
  };

  const removeResource = (index: number) => {
    setResources(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.skill_name.trim() || !formData.start_date || !formData.end_date) {
      return;
    }

    const goalData: CreateLearningGoalData = {
      ...formData,
      resources: resources.filter(r => r.name && r.url),
      course_id: formData.course_id && formData.course_id !== "none" ? formData.course_id : null
    };

    onSubmit(goalData);
  };

  const resourceTypes = [
    { value: 'documentation', label: 'Documentation' },
    { value: 'course', label: 'Online Course' },
    { value: 'book', label: 'Book' },
    { value: 'video', label: 'Video Tutorial' },
    { value: 'article', label: 'Article' },
    { value: 'practice', label: 'Practice Platform' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {goal ? 'Edit Learning Goal' : 'Create New Learning Goal'}
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="skill_name">Skill/Goal Name *</Label>
              <Input
                id="skill_name"
                type="text"
                value={formData.skill_name}
                onChange={(e) => handleInputChange('skill_name', e.target.value)}
                placeholder="e.g., Learn React Development"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="course_id">Link to Course (Optional)</Label>
              <Select value={formData.course_id} onValueChange={(value) => handleInputChange('course_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a course to track" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Course Linked</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.course_id && (
                <p className="text-xs text-muted-foreground">
                  Progress will be automatically tracked based on chapter completion
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="What do you want to achieve with this skill?"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Target End Date *</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => handleInputChange('end_date', e.target.value)}
                min={formData.start_date}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Learning Resources</Label>
              <Button type="button" onClick={addResource} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Resource
              </Button>
            </div>
            
            {resources.map((resource, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 p-3 border rounded-lg">
                <div className="col-span-4">
                  <Input
                    placeholder="Resource name"
                    value={resource.name}
                    onChange={(e) => updateResource(index, 'name', e.target.value)}
                  />
                </div>
                <div className="col-span-4">
                  <Input
                    placeholder="URL"
                    type="url"
                    value={resource.url}
                    onChange={(e) => updateResource(index, 'url', e.target.value)}
                  />
                </div>
                <div className="col-span-3">
                  <Select value={resource.type} onValueChange={(value) => updateResource(index, 'type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {resourceTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1">
                  <Button 
                    type="button" 
                    onClick={() => removeResource(index)} 
                    size="sm" 
                    variant="outline"
                    className="h-10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes, learning strategy, milestones..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="submit" 
              disabled={isLoading || !formData.skill_name.trim() || !formData.start_date || !formData.end_date}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {goal ? 'Update Goal' : 'Create Goal'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}