import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { useState } from "react";

const Navigation = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  
  console.log('Navigation component loaded with updated handleHomeClick function');

  const scrollToSection = (sectionId: string) => {
    console.log(`🎯 Scrolling to section: ${sectionId}`);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      console.log(`✅ Successfully scrolled to: ${sectionId}`);
    } else {
      console.log(`❌ Element not found: ${sectionId}`);
    }
    setIsOpen(false);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleHomeClick = () => {
    console.log('🏠 Home clicked, current path:', window.location.pathname);
    // If already on home page, scroll to hero section  
    if (window.location.pathname === '/') {
      console.log('📍 Already on home page - scrolling to hero section');
      scrollToSection('hero');
    } else {
      // Navigate to home page
      console.log('🔄 Navigating to home page');
      handleNavigate('/');
    }
  };

  const handleExternalLink = (url: string) => {
    window.open(url, '_blank');
    setIsOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-hidden">
      <div className="container flex h-16 sm:h-16 md:h-20 items-center justify-between gap-2 sm:gap-2 md:gap-4 px-3 sm:px-4 md:px-4 max-w-full">
        {/* Logo */}
        <div className="flex items-center gap-2 sm:gap-2 md:gap-3 cursor-pointer min-w-0 flex-shrink" onClick={() => handleNavigate('/')}>
           <img 
             src="/lovable-uploads/2bae437e-b17b-431f-a403-e8a375913444.png" 
             alt="AI Career Level Up Logo" 
             className="h-8 w-8 sm:h-9 sm:w-9 md:h-11 md:w-11 lg:h-14 lg:w-14 flex-shrink-0"
           />
          <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
            <div className="font-bold text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-xl text-primary truncate leading-tight whitespace-nowrap">
              AI Career Level Up
            </div>
            <div className="hidden sm:block text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-primary/90 font-semibold truncate leading-tight whitespace-nowrap">
              Learn It. Build It. Get Hired.
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <NavigationMenu className="hidden lg:flex">
          <NavigationMenuList className="space-x-4 xl:space-x-6">
            <NavigationMenuItem>
              <NavigationMenuLink
                className={cn(navigationMenuTriggerStyle(), "cursor-pointer")}
                asChild
              >
                <button onClick={handleHomeClick}>
                  Gen AI Career
                </button>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                className={cn(navigationMenuTriggerStyle(), "cursor-pointer")}
                onClick={() => handleNavigate('/ai-job-hunting')}
              >
                AI-based Job Hunting
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                className={cn(navigationMenuTriggerStyle(), "cursor-pointer")}
                onClick={() => handleNavigate('/auth')}
              >
                Login
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* CTA Button */}
        <div className="flex items-center gap-2 sm:gap-2 md:gap-3 flex-shrink-0">
          <Button 
            onClick={() => handleNavigate('/auth')} 
            className="hidden md:inline-flex text-xs md:text-sm whitespace-nowrap"
            size="sm"
          >
            Build Resume for Free
          </Button>
          
          {/* Mobile menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden h-9 w-9 sm:h-9 sm:w-9 p-0 flex-shrink-0"
              >
                <Menu className="h-4 w-4 sm:h-4 sm:w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Navigation Menu</SheetTitle>
                <SheetDescription>
                  Access all features and sections
                </SheetDescription>
              </SheetHeader>
              <div className="grid gap-4 py-6">
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={handleHomeClick}
                >
                  Gen AI Career
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => handleNavigate('/ai-job-hunting')}
                >
                  AI-based Job Hunting
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => handleNavigate('/auth')}
                >
                  Login
                </Button>
                <Button
                  onClick={() => handleNavigate('/auth')}
                  className="mt-4"
                >
                  Build Resume for Free
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Navigation;