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

const CareerLevelUpNavigation = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsOpen(false);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleExternalLink = (url: string) => {
    window.open(url, '_blank');
    setIsOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-20 items-center justify-between gap-4 px-4">
        {/* Logo */}
        <div className="flex items-center space-x-3 sm:space-x-4 cursor-pointer min-w-0 flex-shrink-0" onClick={() => handleNavigate('/')}>
          <img 
            src="/lovable-uploads/2bae437e-b17b-431f-a403-e8a375913444.png" 
            alt="Career Level Up Logo" 
            className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 xl:h-16 xl:w-16 flex-shrink-0"
          />
          <div className="flex flex-col min-w-0">
            <div className="font-bold text-sm sm:text-base lg:text-xl xl:text-2xl text-primary truncate">
              Career Level Up
            </div>
            <div className="text-xs sm:text-sm lg:text-base text-primary/90 font-semibold truncate">
              Learn It. Build It. Get Hired.
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <NavigationMenu className="hidden lg:flex">
          <NavigationMenuList className="space-x-1">
            <NavigationMenuItem>
              <NavigationMenuLink
                className={cn(navigationMenuTriggerStyle(), "cursor-pointer")}
                onClick={() => handleNavigate('/')}
              >
                Home
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                className={cn(navigationMenuTriggerStyle(), "cursor-pointer")}
                onClick={() => scrollToSection('ai-future')}
              >
                Future of AI
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                className={cn(navigationMenuTriggerStyle(), "cursor-pointer")}
                onClick={() => scrollToSection('investment-pricing')}
              >
                Pricing
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                className={cn(navigationMenuTriggerStyle(), "cursor-pointer")}
                onClick={() => handleNavigate('/')}
              >
                Job Hunter
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
        <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
          <Button 
            onClick={() => handleNavigate('/auth')} 
            className="hidden md:inline-flex"
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
                className="lg:hidden"
              >
                <Menu className="h-4 w-4" />
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
                  onClick={() => handleNavigate('/')}
                >
                  Home
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => scrollToSection('ai-future')}
                >
                  Future of AI
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => scrollToSection('investment-pricing')}
                >
                  Pricing
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start"
                  onClick={() => handleNavigate('/')}
                >
                  Job Hunter
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

export default CareerLevelUpNavigation;