import React, { useState } from 'react';
import { Video, Check, Copy } from 'lucide-react';

interface Props {
  roomId: string;
  visible: boolean;
}

export const MeetingHeader: React.FC<Props> = ({ roomId, visible }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      // Attempt to focus window if lost (common in iframes/devtools)
      if (!document.hasFocus()) {
        window.focus();
      }
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn("Clipboard write failed:", err);
      // Fail silently or log to console to prevent app crash
    }
  };

  return (
      <div className={`absolute top-0 left-0 right-0 p-4 z-40 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pointer-events-none transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
        <div 
            onClick={handleCopy}
            className="flex items-center gap-3 pointer-events-auto bg-black/40 backdrop-blur-md p-1.5 pr-4 rounded-full border border-white/5 shadow-lg cursor-pointer hover:bg-black/60 transition-colors group"
            title="Click to copy Room ID"
        >
          <div className="bg-blue-600 p-2 rounded-full shadow-lg shadow-blue-500/20">
            {copied ? <Check size={16} className="text-white" /> : <Video size={16} className="text-white" />}
          </div>
          <div className="leading-none">
             <h1 className="font-semibold text-white text-sm tracking-wide">MeetClone</h1>
             <div className="flex items-center gap-1.5 mt-0.5">
                 {!copied && <p className="text-[10px] text-gray-300 font-mono opacity-80 group-hover:text-white transition-colors">
                    {roomId}
                 </p>}
                 {copied && <span className="text-[10px] text-green-400 font-medium">Copied!</span>}
             </div>
          </div>
        </div>
      </div>
  );
};