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
    <div className={cn("h-screen w-full bg-gradient-hero overflow-hidden", className)}>
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel
          defaultSize={25}
          minSize={15}
          maxSize={50}
          className="h-full"
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
          className="h-full flex flex-col overflow-hidden"
        >
          {children}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}