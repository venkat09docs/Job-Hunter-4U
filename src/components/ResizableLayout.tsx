import { ReactNode } from 'react';
import { 
  ResizablePanelGroup, 
  ResizablePanel, 
  ResizableHandle 
} from '@/components/ui/resizable';
import { AppSidebar } from '@/components/AppSidebar';
import { cn } from '@/lib/utils';

interface ResizableLayoutProps {
  children: ReactNode;
  className?: string;
}

export function ResizableLayout({ children, className }: ResizableLayoutProps) {
  return (
    <div className={cn("min-h-screen w-full bg-gradient-hero flex", className)}>
      <ResizablePanelGroup direction="horizontal" className="min-h-screen w-full">
        <ResizablePanel
          defaultSize={25}
          minSize={15}
          maxSize={50}
          className="relative h-screen sticky top-0"
        >
          <AppSidebar />
        </ResizablePanel>
        
        <ResizableHandle 
          withHandle
          className="w-1 bg-border/20 hover:bg-border/40 transition-colors cursor-col-resize"
        />
        
        <ResizablePanel
          defaultSize={75}
          minSize={50}
          className="min-h-screen"
        >
          {children}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}