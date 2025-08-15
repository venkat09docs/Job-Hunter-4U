import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Link, Trash2 } from 'lucide-react';
import { LearningGoal, CreateLearningGoalData } from '@/hooks/useLearningGoals';

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
  const [formData, setFormData] = useState<CreateLearningGoalData>({
    skill_name: '',
    description: '',
    start_date: '',
    end_date: '',
    priority: 'medium',
    resources: [],
    notes: ''
  });

  const [resources, setResources] = useState<Resource[]>([]);
  const [newResource, setNewResource] = useState({ name: '', url: '', type: 'documentation' });

  useEffect(() => {
    if (goal) {
      setFormData({
        skill_name: goal.skill_name,
        description: goal.description || '',
        start_date: goal.start_date,
        end_date: goal.end_date,
        priority: goal.priority,
        notes: goal.notes || ''
      });
      setResources(goal.resources || []);
    }
  }, [goal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      resources: resources.length > 0 ? resources : undefined
    });
  };

  const handleInputChange = (field: keyof CreateLearningGoalData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addResource = () => {
    if (newResource.name && newResource.url) {
      setResources(prev => [...prev, newResource]);
      setNewResource({ name: '', url: '', type: 'documentation' });
    }
  };

  const removeResource = (index: number) => {
    setResources(prev => prev.filter((_, i) => i !== index));
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
          {/* Skill Name */}
          <div className="space-y-2">
            <Label htmlFor="skill_name">Skill/Technology Name *</Label>
            <Input
              id="skill_name"
              value={formData.skill_name}
              onChange={(e) => handleInputChange('skill_name', e.target.value)}
              placeholder="e.g., React.js, Python, Machine Learning"
              required
            />
          </div>

          {/* Description */}
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

          {/* Date Range */}
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

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={formData.priority} onValueChange={(value: 'low' | 'medium' | 'high') => handleInputChange('priority', value)}>
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

          {/* Resources */}
          <div className="space-y-3">
            <Label>Learning Resources</Label>
            
            {/* Add Resource Form */}
            <div className="grid grid-cols-12 gap-2 p-3 border rounded-lg bg-muted/50">
              <div className="col-span-4">
                <Input
                  placeholder="Resource name"
                  value={newResource.name}
                  onChange={(e) => setNewResource(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="col-span-4">
                <Input
                  placeholder="URL"
                  type="url"
                  value={newResource.url}
                  onChange={(e) => setNewResource(prev => ({ ...prev, url: e.target.value }))}
                />
              </div>
              <div className="col-span-3">
                <Select value={newResource.type} onValueChange={(value) => setNewResource(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger className="h-10">
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
                <Button type="button" onClick={addResource} size="sm" className="h-10">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Resources List */}
            {resources.length > 0 && (
              <div className="space-y-2">
                {resources.map((resource, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Link className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{resource.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {resourceTypes.find(t => t.value === resource.type)?.label}
                      </Badge>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeResource(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
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

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading || !formData.skill_name || !formData.start_date || !formData.end_date}>
              {isLoading ? 'Saving...' : goal ? 'Update Goal' : 'Create Goal'}
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