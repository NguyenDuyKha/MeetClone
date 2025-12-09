import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  visible: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}

export const PaginationControls: React.FC<Props> = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  visible,
  onHoverStart,
  onHoverEnd
}) => {
  if (totalPages <= 1) return null;

  return (
    <>
        {/* Navigation Arrows (Vertically Centered) */}
        <div 
            className={`absolute top-1/2 left-4 right-4 -translate-y-1/2 pointer-events-none flex justify-between z-30 transition-opacity duration-300 ease-in-out ${visible ? 'opacity-100' : 'opacity-0'}`}
            onMouseEnter={onHoverStart}
            onMouseLeave={onHoverEnd}
        >
            <button 
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className={`pointer-events-auto p-3 rounded-full bg-gray-800/80 hover:bg-gray-700 text-white transition-all ${currentPage === 0 ? 'opacity-0' : 'opacity-100 hover:scale-110 shadow-lg'}`}
            >
                <ChevronLeft size={24} />
            </button>

            <button 
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages - 1}
                className={`pointer-events-auto p-3 rounded-full bg-gray-800/80 hover:bg-gray-700 text-white transition-all ${currentPage === totalPages - 1 ? 'opacity-0' : 'opacity-100 hover:scale-110 shadow-lg'}`}
            >
                <ChevronRight size={24} />
            </button>
        </div>

        {/* Page Indicator Bubble (Fixed at Bottom) */}
        <div 
            className={`fixed bottom-28 left-1/2 -translate-x-1/2 bg-black/60 px-3 py-1 rounded-full text-white text-xs font-medium backdrop-blur-md z-30 transition-opacity duration-300 pointer-events-none ${visible ? 'opacity-100' : 'opacity-0'}`}
            onMouseEnter={onHoverStart}
            onMouseLeave={onHoverEnd}
        >
            Page {currentPage + 1} / {totalPages}
        </div>
    </>
  );
};