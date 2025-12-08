import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLocalMedia } from '../hooks/useLocalMedia';
import { useMockRoom } from '../hooks/useMockRoom';
import { VideoGrid } from './VideoGrid';
import { ControlsBar } from './ControlsBar';
import { PaginationControls } from './PaginationControls';
import { SmallScreenWarning } from './SmallScreenWarning';
import { ParticipantTile } from './ParticipantTile';
import { Video } from 'lucide-react';

interface Props {
  roomId: string;
  onLeave: () => void;
}

const MAX_TILES_PER_PAGE = 16;
const SIDEBAR_PAGE_SIZE = 4;

export const MeetingRoom: React.FC<Props> = ({ roomId, onLeave }) => {
  const { stream: localCameraStream, isAudioEnabled, isVideoEnabled, toggleAudio, toggleVideo, error } = useLocalMedia();
  
  // Real screen share stream state
  const [screenShareStream, setScreenShareStream] = useState<MediaStream | null>(null);
  const [screenShareError, setScreenShareError] = useState<string | null>(null);

  // Pass separate streams to mock room to handle distinct participants (Camera vs Presentation)
  const { 
    participants, 
    screenSharingId, 
    addDummyParticipant 
  } = useMockRoom(localCameraStream, true, screenShareStream);

  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const prevScreenSharingId = useRef<string | null>(null);

  // Controls Visibility State
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<any>(null);

  const resetIdleTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
    }, 3000);
  }, []);

  const clearIdleTimer = useCallback(() => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      setShowControls(true);
  }, []);

  useEffect(() => {
      const handleUserActivity = () => resetIdleTimer();
      
      window.addEventListener('mousemove', handleUserActivity);
      window.addEventListener('click', handleUserActivity);
      window.addEventListener('keydown', handleUserActivity);
      window.addEventListener('touchstart', handleUserActivity);

      resetIdleTimer();

      return () => {
          window.removeEventListener('mousemove', handleUserActivity);
          window.removeEventListener('click', handleUserActivity);
          window.removeEventListener('keydown', handleUserActivity);
          window.removeEventListener('touchstart', handleUserActivity);
          if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      };
  }, [resetIdleTimer]);

  // Sync local media state (Audio/Video mute) specifically for the camera participant
  const localUser = participants.find(p => p.id === 'local-user');
  if (localUser) {
    localUser.hasAudio = isAudioEnabled;
    localUser.hasVideo = isVideoEnabled;
  }

  // Handle Screen Share Toggle with real Media API
  const handleScreenShareToggle = async () => {
    const isSharing = !!screenShareStream;

    if (isSharing) {
        if (screenShareStream) {
            screenShareStream.getTracks().forEach(track => {
                track.stop();
                track.onended = null;
            });
        }
        setScreenShareStream(null);
    } else {
        try {
            setScreenShareError(null);
            // Removing audio: true to prevent "Permission denied" on systems where audio share is blocked or restricted
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true
            });

            setScreenShareStream(displayStream);

            // Handle user clicking "Stop sharing" from the browser's native UI
            const videoTrack = displayStream.getVideoTracks()[0];
            videoTrack.onended = () => {
                setScreenShareStream(null);
            };

        } catch (err) {
            console.error("Error starting screen share:", err);
            // Show user-friendly error
            setScreenShareError("Screen sharing was cancelled or denied.");
            // Clear error after 5 seconds
            setTimeout(() => setScreenShareError(null), 5000);
        }
    }
  };

  // Auto-pin logic for screen sharing (Responsive to changes only)
  useEffect(() => {
    if (screenSharingId !== prevScreenSharingId.current) {
        if (screenSharingId) {
            // New screen share started -> Auto Pin
            setPinnedId(screenSharingId);
            setCurrentPage(0);
        } else {
            // Screen share stopped
            // If the user was pinned to the screen share that just ended, unpin them.
            const oldId = prevScreenSharingId.current;
            setPinnedId(prev => prev === oldId ? null : prev);
        }
        prevScreenSharingId.current = screenSharingId;
    }
  }, [screenSharingId]);

  // Handle manual pin
  const handlePinToggle = (id: string) => {
    setPinnedId(prev => (prev === id ? null : id));
    setCurrentPage(0);
  };

  // Pagination Logic
  const unpinnedParticipants = useMemo(() => {
    return pinnedId ? participants.filter(p => p.id !== pinnedId) : participants;
  }, [participants, pinnedId]);

  const pageSize = pinnedId ? SIDEBAR_PAGE_SIZE : MAX_TILES_PER_PAGE;
  const totalPages = Math.ceil(unpinnedParticipants.length / pageSize);

  useEffect(() => {
    if (currentPage >= totalPages && totalPages > 0) {
      setCurrentPage(totalPages - 1);
    }
  }, [totalPages, currentPage]);

  const visibleParticipants = useMemo(() => {
    const start = currentPage * pageSize;
    return unpinnedParticipants.slice(start, start + pageSize);
  }, [unpinnedParticipants, currentPage, pageSize]);

  const pinnedParticipant = participants.find(p => p.id === pinnedId);

  return (
    <div className="relative w-full h-screen bg-[#202124] text-white overflow-hidden flex flex-col">
      <SmallScreenWarning onLeave={onLeave} />

      {/* Header Info */}
      <div className={`absolute top-0 left-0 right-0 p-4 z-40 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent pointer-events-none transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
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

      {/* Error Toast */}
      {(error || screenShareError) && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium backdrop-blur-sm animate-fade-in-down">
          {error || screenShareError}
        </div>
      )}

      <div className="flex-1 flex w-full h-full relative">
        {pinnedId && pinnedParticipant ? (
          <div className="flex-1 flex h-full p-2 md:p-4 gap-4 relative">
            {/* Pinned View */}
            <div className="flex-1 h-full rounded-2xl overflow-hidden shadow-2xl bg-black flex items-center justify-center relative">
               <ParticipantTile
                 participant={pinnedParticipant}
                 isPinned={true}
                 onPinToggle={handlePinToggle}
                 width="100%"
                 height="100%"
                 className="w-full h-full max-h-full"
               />

               {/* Mobile Filmstrip Overlay (Visible only on small screens when pinned) */}
               {visibleParticipants.length > 0 && (
                 <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-2 px-2 md:hidden z-30 pointer-events-none">
                     {visibleParticipants.map(p => (
                         <div key={p.id} className="h-20 w-1/4 max-w-[5rem] flex-shrink-0 rounded-lg overflow-hidden border border-gray-700 bg-gray-900 shadow-lg pointer-events-auto">
                             <ParticipantTile
                                participant={p}
                                isPinned={false}
                                onPinToggle={handlePinToggle}
                                width="100%"
                                height="100%"
                             />
                         </div>
                     ))}
                 </div>
               )}
            </div>
            
            {/* Sidebar List - Visible on Medium screens and up (Tablet/Desktop) */}
            {visibleParticipants.length > 0 && (
                <div className="w-64 lg:w-80 flex flex-col gap-4 justify-center hidden md:flex">
                    <div className="flex-1 flex flex-col gap-3 overflow-hidden justify-center relative">
                         {visibleParticipants.map(p => (
                             <div key={p.id} className="h-40 lg:h-48 w-full flex-shrink-0">
                                 <ParticipantTile
                                    participant={p}
                                    isPinned={false}
                                    onPinToggle={handlePinToggle}
                                    width="100%"
                                    height="100%"
                                 />
                             </div>
                         ))}
                    </div>
                </div>
            )}
          </div>
        ) : (
          <VideoGrid
            participants={visibleParticipants}
            pinnedId={null}
            onPinToggle={handlePinToggle}
            currentPage={currentPage}
          />
        )}
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        visible={showControls}
        onHoverStart={clearIdleTimer}
        onHoverEnd={resetIdleTimer}
      />

      <ControlsBar
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        isScreenSharing={!!screenShareStream}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={handleScreenShareToggle}
        onLeave={onLeave}
        onAddDummy={addDummyParticipant}
        participantCount={participants.length}
        visible={showControls}
        onHoverStart={clearIdleTimer}
        onHoverEnd={resetIdleTimer}
      />
    </div>
  );
};