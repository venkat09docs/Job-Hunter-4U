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
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const Navigation = () => {
  const navigate = useNavigate();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <div className="font-bold text-xl text-primary">
            Rise n Shine Technologies
          </div>
        </div>

        {/* Navigation Menu */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink
                className={cn(navigationMenuTriggerStyle(), "cursor-pointer")}
                onClick={() => scrollToSection('hero')}
              >
                Home
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                className={cn(navigationMenuTriggerStyle(), "cursor-pointer")}
                onClick={() => scrollToSection('features')}
              >
                Features
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                className={cn(navigationMenuTriggerStyle(), "cursor-pointer")}
                onClick={() => scrollToSection('ai-tools')}
              >
                AI Tools
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                className={cn(navigationMenuTriggerStyle(), "cursor-pointer")}
                onClick={() => scrollToSection('pricing')}
              >
                Pricing
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                className={cn(navigationMenuTriggerStyle(), "cursor-pointer")}
                onClick={() => navigate('/courses')}
              >
                Courses
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                className={cn(navigationMenuTriggerStyle(), "cursor-pointer")}
                onClick={() => navigate('/auth')}
              >
                Login
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* CTA Button */}
        <div className="flex items-center space-x-4">
          <Button 
            onClick={() => navigate('/auth')} 
            className="hidden sm:inline-flex"
          >
            Build Resume for Free
          </Button>
          
          {/* Mobile menu button */}
          <Button
            variant="outline"
            size="sm"
            className="md:hidden"
            onClick={() => navigate('/auth')}
          >
            Login
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navigation;