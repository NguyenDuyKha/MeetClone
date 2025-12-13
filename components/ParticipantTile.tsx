import React, { memo } from 'react';
import { Participant } from '../utils/types';
import { MicOff, Pin, PinOff, Monitor } from 'lucide-react';
import { useVideoRef } from '../hooks/useVideoRef';

interface Props {
  participant: Participant;
  isPinned: boolean;
  onPinToggle: (id: string) => void;
  width: string | number;
  height: string | number;
  className?: string;
}

const ParticipantTileComponent: React.FC<Props> = ({ 
  participant, 
  isPinned, 
  onPinToggle,
  width,
  height,
  className = ""
}) => {
  const { id, name, isLocal, isScreenSharing, stream, isAudioEnabled, isVideoEnabled } = participant;
  const videoRef = useVideoRef(stream);

  // Flip local camera but NOT local screen share
  const shouldFlip = isLocal && !isScreenSharing;
  const bgClass = isScreenSharing ? 'bg-[#18191b]' : 'bg-gray-900';
  const showVideo = stream && (isVideoEnabled || isScreenSharing);

  return (
    <div 
      className={`relative ${bgClass} rounded-xl overflow-hidden shadow-lg border border-gray-800 group transition-all duration-300 ${className}`}
      style={{ width, height }}
    >
      {/* Content Layer */}
      {showVideo ? (
        <video
          ref={videoRef}
          autoPlay
          muted={isLocal} // Always mute local video feedback
          playsInline
          className={`w-full h-full object-contain transform ${shouldFlip ? '-scale-x-100' : ''}`}
        />
      ) : isScreenSharing ? (
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-4 p-8">
            <Monitor size={48} className="animate-pulse" />
            <div className="text-center">
                <p className="font-medium text-lg text-gray-200">{name}</p>
                <p className="text-sm">is presenting</p>
            </div>
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-800">
           <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold text-white uppercase select-none">
             {name.charAt(0)}
           </div>
        </div>
      )}

      {/* Info Bar (Bottom Left) */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 max-w-[80%] z-10">
        <div className="bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md text-white text-xs font-medium truncate flex items-center gap-2">
           {name} {isLocal && !isScreenSharing && "(You)"}
           {!isAudioEnabled && !isScreenSharing && <MicOff size={12} className="text-red-400" />}
        </div>
      </div>

      {/* Hover Controls (Top Right) */}
      <div className="absolute rounded-full top-2 right-2 lg:top-3 lg:right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={(e) => { e.stopPropagation(); onPinToggle(id); }}
          className={`p-2 rounded-full backdrop-blur-md transition-colors ${isPinned ? 'bg-blue-600 text-white' : 'bg-black/40 text-white hover:bg-black/60'}`}
          title={isPinned ? "Unpin" : "Pin"}
        >
          {isPinned ? <PinOff size={16} /> : <Pin size={16} />}
        </button>
      </div>

      {/* Mic Status Indicator (Top Right - always visible if muted) */}
      {!isAudioEnabled && !isScreenSharing && (
        <div className="absolute top-3 right-3 bg-red-500/90 p-1.5 rounded-full group-hover:opacity-0 transition-opacity">
          <MicOff size={14} className="text-white" />
        </div>
      )}
      
      {/* Screen Share Indicator */}
      {isScreenSharing && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/70 px-4 py-2 rounded-lg flex items-center gap-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            <Monitor size={16} className="text-blue-400"/>
            <span className="text-white font-semibold text-sm">Presenting</span>
        </div>
      )}
    </div>
  );
};

export const ParticipantTile = memo(ParticipantTileComponent);