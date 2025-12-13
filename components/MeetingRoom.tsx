import React, { useState, useEffect, useRef } from 'react';
import { useRoom } from '../hooks/useRoom';
import { useIdleControls } from '../hooks/useIdleControls';
import { useScreenShare } from '../hooks/useScreenShare';
import { usePagination } from '../hooks/usePagination';
import { useMediaContext } from '../contexts/MediaContext';

import { VideoGrid } from './VideoGrid';
import { ControlsBar } from './ControlsBar';
import { PaginationControls } from './PaginationControls';
import { SmallScreenWarning } from './SmallScreenWarning';
import { MeetingHeader } from './MeetingHeader';
import { PinnedView } from './PinnedView';
import { PeopleSidebar } from './PeopleSidebar';
import { Toast } from './Toast';

interface Props {
  roomId: string;
  onLeave: () => void;
  mediaError: string | null;
  userName: string;
}

export const MeetingRoom: React.FC<Props> = ({ 
  roomId, 
  onLeave,
  mediaError,
  userName
}) => {
  // Global Media State
  const { 
    stream: localStream, 
    isAudioEnabled, 
    isVideoEnabled, 
    toggleAudio, 
    toggleVideo 
  } = useMediaContext();

  // Local Hooks
  const { stream: screenShareStream, error: screenShareError, toggleScreenShare } = useScreenShare();
  
  // Logic
  const { 
    participants, 
    screenSharingId, 
    addDummyParticipant 
  } = useRoom(
      roomId,
      localStream, 
      screenShareStream, 
      userName,
      isAudioEnabled,
      isVideoEnabled
  );

  const { showControls, resetIdleTimer, clearIdleTimer } = useIdleControls(3000);

  // UI State
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [isPeopleOpen, setIsPeopleOpen] = useState(false);
  const prevScreenSharingId = useRef<string | null>(null);

  // Pagination
  const { 
    currentPage, 
    setCurrentPage, 
    totalPages, 
    visibleParticipants 
  } = usePagination(participants, pinnedId);

  // Auto-pin logic
  useEffect(() => {
    if (screenSharingId !== prevScreenSharingId.current) {
        if (screenSharingId) {
            setPinnedId(screenSharingId);
        } else {
            const oldId = prevScreenSharingId.current;
            setPinnedId(prev => prev === oldId ? null : prev);
        }
        prevScreenSharingId.current = screenSharingId;
    }
  }, [screenSharingId]);

  const handlePinToggle = (id: string) => {
    setPinnedId(prev => (prev === id ? null : id));
  };

  const pinnedParticipant = participants.find(p => p.id === pinnedId);

  return (
    <div className="relative w-full h-screen bg-[#202124] text-white flex flex-col">
      <SmallScreenWarning onLeave={onLeave} />

      <MeetingHeader roomId={roomId} visible={showControls} />

      <Toast message={mediaError || screenShareError} />

      {/* Main Content Area */}
      <div className="flex-1 flex w-full h-full relative">
          {/* Video Area */}
            <div className="flex-1 flex w-full h-full relative">
              {pinnedId && pinnedParticipant ? (
                <PinnedView
                    pinnedParticipant={pinnedParticipant}
                    sidebarParticipants={visibleParticipants}
                    onPinToggle={handlePinToggle}
                />
                ) : (
                <VideoGrid
                    participants={visibleParticipants}
                    pinnedId={null}
                    onPinToggle={handlePinToggle}
                    currentPage={currentPage}
                />
                )}

              <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  visible={showControls}
                  onHoverStart={clearIdleTimer}
                  onHoverEnd={resetIdleTimer}
              />
            </div>

          {/* Right Sidebar */}
          <div className={`transition-all duration-300 relative bg-[#202124]`}>
             <PeopleSidebar 
                participants={participants} 
                isOpen={isPeopleOpen} 
                onClose={() => setIsPeopleOpen(false)} 
             />
          </div>
      </div>

      <ControlsBar
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        isScreenSharing={!!screenShareStream}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={toggleScreenShare}
        onLeave={onLeave}
        onAddDummy={addDummyParticipant}
        participantCount={participants.length}
        visible={showControls}
        onHoverStart={clearIdleTimer}
        onHoverEnd={resetIdleTimer}
        onTogglePeople={() => setIsPeopleOpen(!isPeopleOpen)}
        isPeopleOpen={isPeopleOpen}
      />
    </div>
  );
};
