import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Minus, Save } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  sectionKey: string;
  isOpen: boolean;
  onToggle: (sectionKey: string) => void;
  onSave: (sectionName: string) => void;
  children: React.ReactNode;
}

export const CollapsibleSection = React.memo(({ 
  title, 
  sectionKey, 
  isOpen,
  onToggle,
  onSave,
  children 
}: CollapsibleSectionProps) => (
  <Collapsible
    open={isOpen}
    onOpenChange={() => onToggle(sectionKey)}
  >
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {isOpen ? (
                  <Minus className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>
      </CardHeader>
      <CollapsibleContent>
        <CardContent className="space-y-4">
          {children}
          <Button
            size="sm"
            onClick={() => onSave(title)}
            className="flex items-center gap-1"
          >
            <Save className="h-4 w-4" />
            Save
          </Button>
        </CardContent>
      </CollapsibleContent>
    </Card>
  </Collapsible>
));

CollapsibleSection.displayName = 'CollapsibleSection';