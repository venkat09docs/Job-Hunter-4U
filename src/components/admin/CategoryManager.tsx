import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface CategoryManagerProps {
  availableCategories: string[];
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  onCreateCategory: (category: string) => void;
  onDeleteCategory: (category: string) => void;
}

export function CategoryManager({
  availableCategories,
  selectedCategories,
  onCategoriesChange,
  onCreateCategory,
  onDeleteCategory
}: CategoryManagerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const handleAddCategory = () => {
    if (selectedCategory && !selectedCategories.includes(selectedCategory)) {
      onCategoriesChange([...selectedCategories, selectedCategory]);
      setSelectedCategory('');
    }
  };

  const handleRemoveCategory = (categoryToRemove: string) => {
    onCategoriesChange(selectedCategories.filter(cat => cat !== categoryToRemove));
  };

  const handleCreateCategory = () => {
    if (newCategory.trim() && !availableCategories.includes(newCategory.trim())) {
      onCreateCategory(newCategory.trim());
      setNewCategory('');
      setIsCreateCategoryOpen(false);
    }
  };

  const unselectedCategories = availableCategories.filter(
    cat => !selectedCategories.includes(cat)
  );

  return (
    <div className="space-y-4">
      <div>
        <Label>Categories</Label>
        <p className="text-sm text-muted-foreground mb-2">
          Add this course to multiple categories. Click X on category pills to remove from course or delete from system.
        </p>
        
        {/* Selected Categories Display */}
        {selectedCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 p-3 border rounded-lg bg-muted/30">
            {selectedCategories.map((category) => (
              <Badge
                key={category}
                variant="secondary"
                className="flex items-center gap-1 px-3 py-1.5 text-sm"
              >
                {category}
                <button
                  onClick={() => handleRemoveCategory(category)}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                  aria-label={`Remove ${category}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Add Category Section */}
        <div className="flex gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select category to add" />
            </SelectTrigger>
            <SelectContent className="z-50 bg-background border shadow-lg pointer-events-auto">
              {unselectedCategories.length > 0 ? (
                unselectedCategories.map((category) => (
                  <div key={category} className="flex items-center justify-between px-2 py-1.5 hover:bg-accent cursor-pointer group">
                    <SelectItem value={category} className="flex-1 cursor-pointer">
                      {category}
                    </SelectItem>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete category "${category}" from the system? This will remove it from all courses.`)) {
                          onDeleteCategory(category);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 ml-2 p-1 hover:bg-destructive/20 rounded transition-all"
                      aria-label={`Delete ${category}`}
                      type="button"
                    >
                      <X className="h-3 w-3 text-destructive" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  {selectedCategories.length > 0 
                    ? 'All categories added' 
                    : 'No categories available'}
                </div>
              )}
            </SelectContent>
          </Select>
          
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleAddCategory}
            disabled={!selectedCategory}
          >
            <Plus className="h-4 w-4" />
          </Button>

          <Dialog open={isCreateCategoryOpen} onOpenChange={setIsCreateCategoryOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                New Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md pointer-events-auto">
              <DialogHeader>
                <DialogTitle>Create New Category</DialogTitle>
                <DialogDescription>
                  Add a new category that can be used for courses
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="category-name">Category Name</Label>
                  <Input
                    id="category-name"
                    placeholder="Enter category name"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateCategory();
                      }
                    }}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateCategoryOpen(false);
                    setNewCategory('');
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateCategory} disabled={!newCategory.trim()}>
                  Create Category
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
