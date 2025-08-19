import { ReactNode, useState } from 'react';
import { 
  ResizablePanelGroup, 
  ResizablePanel, 
  ResizableHandle 
} from '@/components/ui/resizable';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { cn } from '@/lib/utils';

interface ResizableLayoutProps {
  children: ReactNode;
  className?: string;
}

export function ResizableLayout({ children, className }: ResizableLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  return (
    <SidebarProvider>
      <div className={cn("min-h-screen w-full bg-gradient-hero", className)}>
        <ResizablePanelGroup direction="horizontal" className="min-h-screen">
          <ResizablePanel
            defaultSize={20}
            minSize={15}
            maxSize={35}
            className="relative"
          >
            <AppSidebar />
          </ResizablePanel>
          
          <ResizableHandle 
            className="w-1 bg-border hover:bg-primary/20 transition-colors duration-200 active:bg-primary/40"
          />
          
          <ResizablePanel
            defaultSize={80}
            minSize={65}
            className="flex flex-col min-w-0"
          >
            {children}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </SidebarProvider>
  );
}