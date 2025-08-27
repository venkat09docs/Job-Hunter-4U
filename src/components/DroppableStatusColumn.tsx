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
    <div className="flex flex-col h-full">
      {/* Pipeline Header */}
      <div className={`${statusColor} text-white rounded-t-lg p-2 md:p-3 mb-2 flex-shrink-0`}>
        <div className="text-center">
          <div className="text-lg md:text-xl font-bold">{count}</div>
          <div className="text-xs md:text-sm font-medium leading-tight break-words">
            {statusLabel}
          </div>
        </div>
      </div>
      
      {/* Board Column */}
      <div 
        ref={setNodeRef}
        className={`flex-1 space-y-2 min-h-[200px] md:min-h-[300px] p-2 md:p-3 bg-muted/30 rounded-lg border-2 border-dashed transition-colors ${
          isOver ? 'border-primary bg-primary/5' : 'border-muted'
        }`}
      >
        {children}
      </div>
    </div>
  );
};