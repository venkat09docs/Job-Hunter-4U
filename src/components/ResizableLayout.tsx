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
  return (
    <SidebarProvider>
      <div className={cn("min-h-screen w-full bg-gradient-hero", className)}>
        <ResizablePanelGroup direction="horizontal" className="min-h-screen">
          <ResizablePanel
            defaultSize={20}
            minSize={12}
            maxSize={40}
            className="relative"
          >
            <div className="h-full w-full">
              <AppSidebar />
            </div>
          </ResizablePanel>
          
          <ResizableHandle 
            withHandle
            className="w-2 bg-border/50 hover:bg-primary/30 transition-all duration-200 active:bg-primary/50 cursor-col-resize group relative"
          />
          
          <ResizablePanel
            defaultSize={80}
            minSize={60}
            className="flex flex-col min-w-0"
          >
            {children}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </SidebarProvider>
  );
}