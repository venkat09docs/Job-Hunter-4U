import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface DroppableStatusColumnProps {
  status: string;
  statusColor: string;
  statusLabel: string;
  count: number;
  children: React.ReactNode;
}

export const DroppableStatusColumn: React.FC<DroppableStatusColumnProps> = ({
  status,
  statusColor,
  statusLabel,
  count,
  children,
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: status,
    data: {
      status,
    },
  });

  return (
    <div className="flex flex-col">
      {/* Pipeline Header */}
      <div className={`${statusColor} text-white rounded-t-lg p-1 sm:p-2 md:p-3 mb-1 sm:mb-2`}>
        <div className="text-center">
          <div className="text-sm sm:text-lg md:text-xl font-bold">{count}</div>
          <div className="text-[10px] sm:text-xs md:text-sm font-medium leading-tight break-words">
            {statusLabel}
          </div>
        </div>
      </div>
      
      {/* Board Column */}
      <div 
        ref={setNodeRef}
        className={`flex-1 space-y-1 sm:space-y-2 min-h-[150px] sm:min-h-[200px] md:min-h-[250px] p-1 sm:p-2 md:p-3 bg-muted/30 rounded-lg border-2 border-dashed transition-colors ${
          isOver ? 'border-primary bg-primary/5' : 'border-muted'
        }`}
      >
        {children}
      </div>
    </div>
  );
};