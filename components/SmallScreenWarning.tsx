import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  onLeave: () => void;
}

export const SmallScreenWarning: React.FC<Props> = ({ onLeave }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [forceAudioOnly, setForceAudioOnly] = useState(false);

  useEffect(() => {
    const checkSize = () => {
      const isTooSmall = window.innerWidth < 320 || window.innerHeight < 480;
      if (isTooSmall && !forceAudioOnly) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('resize', checkSize);
    checkSize(); // Initial check

    return () => window.removeEventListener('resize', checkSize);
  }, [forceAudioOnly]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-6">
      <div className="bg-gray-800 rounded-2xl max-w-sm w-full p-6 text-center border border-gray-700 shadow-2xl">
        <div className="mx-auto w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="text-yellow-500 w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Display Too Small</h2>
        <p className="text-gray-300 mb-6 text-sm leading-relaxed">
          Your screen size is not optimal for a video meeting. The layout may break or be unusable.
        </p>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
                setForceAudioOnly(true);
                setIsVisible(false);
            }}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
          >
            Continue Audio Only
          </button>
          <button
            onClick={onLeave}
            className="w-full py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
          >
            Leave Meeting
          </button>
        </div>
      </div>
    </div>
  );
};
