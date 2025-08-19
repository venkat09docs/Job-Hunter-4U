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
    <div className={cn("min-h-screen w-full bg-gradient-hero", className)}>
      <ResizablePanelGroup direction="horizontal" className="min-h-screen">
        <ResizablePanel
          defaultSize={25}
          minSize={15}
          maxSize={50}
          className="relative"
        >
          <AppSidebar />
        </ResizablePanel>
        
        <ResizableHandle 
          withHandle
          className="w-1 bg-transparent hover:bg-primary/20 transition-all duration-200 cursor-col-resize"
        />
        
        <ResizablePanel
          defaultSize={75}
          minSize={50}
          className="flex flex-col min-w-0"
        >
          {children}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}