import React from 'react';
import { Video } from 'lucide-react';

interface Props {
  roomId: string;
  visible: boolean;
}

export const MeetingHeader: React.FC<Props> = ({ roomId, visible }) => {
  return (
      <div className={`absolute top-0 left-0 right-0 p-4 z-40 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pointer-events-none transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center gap-3 pointer-events-auto bg-black/40 backdrop-blur-md p-1.5 pr-4 rounded-full border border-white/5 shadow-lg">
          <div className="bg-blue-600 p-2 rounded-full shadow-lg shadow-blue-500/20">
            <Video size={16} className="text-white" />
          </div>
          <div className="leading-none">
             <h1 className="font-semibold text-white text-sm tracking-wide">MeetClone</h1>
             <p className="text-[10px] text-gray-300 font-mono opacity-80 mt-0.5">{roomId}</p>
          </div>
        </div>
      </div>
  );
};