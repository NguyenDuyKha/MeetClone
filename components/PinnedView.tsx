import React from 'react';
import { Participant } from '../utils/types';
import { ParticipantTile } from './ParticipantTile';

interface Props {
  pinnedParticipant: Participant;
  sidebarParticipants: Participant[];
  onPinToggle: (id: string) => void;
}

export const PinnedView: React.FC<Props> = ({ 
  pinnedParticipant, 
  sidebarParticipants, 
  onPinToggle 
}) => {
  return (
    <div className="flex-1 flex h-full p-2 md:p-4 gap-4 relative">
      {/* Pinned View */}
      <div className="flex-1 h-full rounded-2xl overflow-hidden shadow-2xl bg-black flex items-center justify-center relative">
         <ParticipantTile
           participant={pinnedParticipant}
           isPinned={true}
           onPinToggle={onPinToggle}
           width="100%"
           height="100%"
           className="w-full h-full max-h-full"
         />

         {/* Mobile Filmstrip Overlay (Visible only on small screens when pinned) */}
         {sidebarParticipants.length > 0 && (
           <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-2 px-2 md:hidden z-30 pointer-events-none">
               {sidebarParticipants.map(p => (
                   <div key={p.id} className="h-20 w-1/4 max-w-[5rem] flex-shrink-0 rounded-lg overflow-hidden border border-gray-700 bg-gray-900 shadow-lg pointer-events-auto">
                       <ParticipantTile
                          participant={p}
                          isPinned={false}
                          onPinToggle={onPinToggle}
                          width="100%"
                          height="100%"
                       />
                   </div>
               ))}
           </div>
         )}
      </div>
      
      {/* Sidebar List - Visible on Medium screens and up (Tablet/Desktop) */}
      {sidebarParticipants.length > 0 && (
          <div className="w-64 lg:w-80 flex flex-col gap-4 justify-center hidden md:flex">
              <div className="flex-1 flex flex-col gap-3 overflow-hidden justify-center relative">
                   {sidebarParticipants.map(p => (
                       <div key={p.id} className="h-40 lg:h-48 w-full flex-shrink-0">
                           <ParticipantTile
                              participant={p}
                              isPinned={false}
                              onPinToggle={onPinToggle}
                              width="100%"
                              height="100%"
                           />
                       </div>
                   ))}
              </div>
          </div>
      )}
    </div>
  );
};