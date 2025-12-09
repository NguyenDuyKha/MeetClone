import React, { useState, useEffect, useRef } from 'react';
import { useLocalMedia } from '../hooks/useLocalMedia';
import { useMockRoom } from '../hooks/useMockRoom';
import { useIdleControls } from '../hooks/useIdleControls';
import { useScreenShare } from '../hooks/useScreenShare';
import { usePagination } from '../hooks/usePagination';

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
}

export const MeetingRoom: React.FC<Props> = ({ roomId, onLeave }) => {
  // --- Hooks ---
  const { stream: localCameraStream, isAudioEnabled, isVideoEnabled, toggleAudio, toggleVideo, error: mediaError } = useLocalMedia();
  const { stream: screenShareStream, error: screenShareError, toggleScreenShare } = useScreenShare();
  
  // Pass separate streams to mock room to handle distinct participants (Camera vs Presentation)
  const { 
    participants, 
    screenSharingId, 
    addDummyParticipant 
  } = useMockRoom(localCameraStream, true, screenShareStream);

  const { showControls, resetIdleTimer, clearIdleTimer } = useIdleControls(3000);

  // --- State ---
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [isPeopleOpen, setIsPeopleOpen] = useState(false);
  const prevScreenSharingId = useRef<string | null>(null);

  // --- Pagination Logic ---
  const { 
    currentPage, 
    setCurrentPage, 
    totalPages, 
    visibleParticipants 
  } = usePagination(participants, pinnedId);

  // --- Effects ---

  // Sync local media state (Audio/Video mute) specifically for the camera participant
  useEffect(() => {
      const localUser = participants.find(p => p.id === 'local-user');
      if (localUser) {
        localUser.hasAudio = isAudioEnabled;
        localUser.hasVideo = isVideoEnabled;
      }
  }, [participants, isAudioEnabled, isVideoEnabled]);

  // Auto-pin logic for screen sharing (Responsive to changes only)
  useEffect(() => {
    if (screenSharingId !== prevScreenSharingId.current) {
        if (screenSharingId) {
            // New screen share started -> Auto Pin
            setPinnedId(screenSharingId);
        } else {
            // Screen share stopped
            // If the user was pinned to the screen share that just ended, unpin them.
            const oldId = prevScreenSharingId.current;
            setPinnedId(prev => prev === oldId ? null : prev);
        }
        prevScreenSharingId.current = screenSharingId;
    }
  }, [screenSharingId]);

  // --- Handlers ---
  const handlePinToggle = (id: string) => {
    setPinnedId(prev => (prev === id ? null : id));
  };

  const pinnedParticipant = participants.find(p => p.id === pinnedId);

  // --- Render ---
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