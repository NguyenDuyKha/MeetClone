import React, { useState } from 'react';
import { HashRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { Lobby } from './components/Lobby';
import { MeetingRoom } from './components/MeetingRoom';
import { PreJoinScreen } from './components/PreJoinScreen';
import { useLocalMedia } from './hooks/useLocalMedia';

const RoomWrapper = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [hasJoined, setHasJoined] = useState(false);
  const [displayName, setDisplayName] = useState('');

  // Lifted media state so it persists from PreJoin to MeetingRoom
  const { 
      stream, 
      isAudioEnabled, 
      isVideoEnabled, 
      toggleAudio, 
      toggleVideo, 
      error 
  } = useLocalMedia();

  const handleJoin = (name: string) => {
      setDisplayName(name);
      setHasJoined(true);
  };
  
  if (!hasJoined) {
      return (
          <PreJoinScreen
              roomId={roomId || 'demo-room'}
              onJoin={handleJoin}
              onCancel={() => navigate('/')}
              stream={stream}
              isAudioEnabled={isAudioEnabled}
              isVideoEnabled={isVideoEnabled}
              onToggleAudio={toggleAudio}
              onToggleVideo={toggleVideo}
          />
      );
  }

  return (
    <MeetingRoom 
        roomId={roomId || 'demo-room'} 
        onLeave={() => navigate('/')}
        localStream={stream}
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        toggleAudio={toggleAudio}
        toggleVideo={toggleVideo}
        mediaError={error}
        userName={displayName}
    />
  );
};

const AppContent = () => {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="/" element={<Lobby onJoin={(id) => navigate(`/room/${id}`)} />} />
      <Route path="/room/:roomId" element={<RoomWrapper />} />
    </Routes>
  );
};

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}
