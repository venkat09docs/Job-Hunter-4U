import { useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Calendar, Activity, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useUserPointsHistory } from "@/hooks/useUserPointsHistory";

interface PointsHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ITEMS_PER_PAGE = 10;

export function PointsHistoryDialog({ open, onOpenChange }: PointsHistoryDialogProps) {
  const { pointsHistory, loading, totalPoints } = useUserPointsHistory();
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate pagination
  const totalPages = Math.ceil(pointsHistory.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = pointsHistory.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            <DialogTitle>My Points History</DialogTitle>
          </div>
          <DialogDescription>
            Track your activity points and achievements
          </DialogDescription>
          <div className="flex items-center gap-2 mt-4">
            <Badge variant="secondary" className="gap-1 text-lg px-3 py-1">
              <Star className="h-4 w-4" />
              Total Points: {loading ? "..." : totalPoints}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : pointsHistory.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No Activity Points Yet
              </h3>
              <p className="text-sm text-muted-foreground">
                Start completing activities to earn points and track your progress!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentItems.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                      <Activity className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">
                        {entry.activity_settings?.activity_name || entry.activity_id}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(entry.activity_date), 'MMM dd, yyyy')}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="capitalize">
                          {entry.activity_settings?.category || 'General'}
                        </span>
                      </div>
                      {entry.activity_settings?.description && (
                        <p className="text-xs text-muted-foreground mt-1 max-w-md">
                          {entry.activity_settings.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="gap-1">
                      <Trophy className="h-3 w-3" />
                      +{entry.points_earned}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      {format(new Date(entry.created_at), 'HH:mm')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && pointsHistory.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(endIndex, pointsHistory.length)} of {pointsHistory.length} entries
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  const isActive = page === currentPage;
                  return (
                    <Button
                      key={page}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  );
                })}
                {totalPages > 5 && (
                  <>
                    {currentPage < totalPages - 2 && <span className="text-muted-foreground">...</span>}
                    {currentPage < totalPages - 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(totalPages)}
                        className="w-8 h-8 p-0"
                      >
                        {totalPages}
                      </Button>
                    )}
                  </>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}