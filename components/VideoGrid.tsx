import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Participant } from '../utils/types';
import { ParticipantTile } from './ParticipantTile';
import { computeOptimalLayout } from '../utils/layout';

interface Props {
  participants: Participant[];
  pinnedId: string | null;
  onPinToggle: (id: string) => void;
  currentPage: number;
}

export const VideoGrid: React.FC<Props> = ({ 
  participants, 
  pinnedId, 
  onPinToggle, 
  currentPage
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Compute layout based on current participants count and container size
  const layout = useMemo(() => {
    return computeOptimalLayout(participants.length, dimensions.width, dimensions.height);
  }, [participants.length, dimensions.width, dimensions.height]);

  // Center the grid if it doesn't fill the space
  const gridWidth = layout.cols * layout.tileWidth;
  const gridHeight = layout.rows * layout.tileHeight;

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center p-4 transition-all duration-500 ease-in-out">
      <div 
        style={{
          width: gridWidth,
          height: gridHeight,
          display: 'grid',
          gridTemplateColumns: `repeat(${layout.cols}, ${layout.tileWidth}px)`,
          gridTemplateRows: `repeat(${layout.rows}, ${layout.tileHeight}px)`,
          gap: 0, // Gap handled by padding inside tiles if needed, or explicitly here
        }}
        className="transition-all duration-500 ease-in-out"
      >
        {participants.map((p) => (
          <div key={p.id} className="p-1 w-full h-full"> 
             {/* p-1 acts as the gap */}
            <ParticipantTile
              participant={p}
              isPinned={pinnedId === p.id}
              onPinToggle={onPinToggle}
              width={layout.tileWidth - 8} // Subtract padding
              height={layout.tileHeight - 8}
            />
          </div>
        ))}
      </div>
    </div>
  );
};