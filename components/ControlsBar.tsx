import React from 'react';
import { Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, Users } from 'lucide-react';

interface Props {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void | Promise<void>;
  onLeave: () => void;
  participantCount: number;
  visible: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  onTogglePeople: () => void;
  isPeopleOpen: boolean;
}

export const ControlsBar: React.FC<Props> = ({
  isAudioEnabled,
  isVideoEnabled,
  isScreenSharing,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onLeave,
  participantCount,
  visible,
  onHoverStart,
  onHoverEnd,
  onTogglePeople,
  isPeopleOpen
}) => {
  return (
    <div 
        className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center gap-4 transition-all duration-300 ease-in-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}
        onMouseEnter={onHoverStart}
        onMouseLeave={onHoverEnd}
    >
      
      {/* Main Bar */}
      <div className="flex items-center gap-3 bg-gray-900/90 backdrop-blur-xl border border-gray-700 p-2 rounded-2xl shadow-2xl">
        <button
          onClick={onToggleAudio}
          className={`p-4 rounded-xl transition-all duration-200 ${isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
          title={isAudioEnabled ? "Mute" : "Unmute"}
        >
          {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
        </button>

        <button
          onClick={onToggleVideo}
          className={`p-4 rounded-xl transition-all duration-200 ${isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
          title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
        >
          {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
        </button>

        <div className="w-px h-8 bg-gray-700 mx-1"></div>

        <button
          onClick={onToggleScreenShare}
          className={`p-4 rounded-xl transition-all duration-200 ${isScreenSharing ? 'bg-blue-500 hover:bg-blue-600 text-white ring-2 ring-blue-300 ring-opacity-50' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
          title="Present now"
        >
          <MonitorUp size={20} />
        </button>

        <button
            onClick={onTogglePeople}
            className={`p-4 rounded-xl transition-all duration-200 hidden md:block ${isPeopleOpen ? 'bg-blue-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
            title="People"
        >
             <div className="flex items-center gap-1.5">
                <Users size={20} />
                {participantCount > 0 && <span className="text-xs font-bold bg-black/20 px-1.5 rounded-full">{participantCount}</span>}
             </div>
        </button>

        <div className="w-px h-8 bg-gray-700 mx-1"></div>

        <button
          onClick={onLeave}
          className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-all duration-200 w-32 flex items-center justify-center gap-2"
        >
          <PhoneOff size={20} />
          <span>End</span>
        </button>
      </div>
    </div>
  );
};