import React, { useState } from 'react';
import { HashRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { Lobby } from './components/Lobby';
import { MeetingRoom } from './components/MeetingRoom';
import { PreJoinScreen } from './components/PreJoinScreen';
import { MediaProvider, useMediaContext } from './contexts/MediaContext';

const RoomWrapper: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [hasJoined, setHasJoined] = useState(false);
  const [displayName, setDisplayName] = useState('');

  // Access global media state via Context
  const { error } = useMediaContext();

  const handleJoin = (name: string) => {
      setDisplayName(name);
      setHasJoined(true);
  };

  const currentRoomId = roomId || 'demo-room';
  
  if (!hasJoined) {
      return (
          <PreJoinScreen
              roomId={currentRoomId}
              onJoin={handleJoin}
              onCancel={() => navigate('/')}
          />
      );
  }

  return (
    <MeetingRoom 
        roomId={currentRoomId} 
        onLeave={() => navigate('/')}
        mediaError={error}
        userName={displayName}
    />
  );
};

// Wrap the room logic with MediaProvider so that media is initialized only when entering this route
// and cleaned up when leaving it (returning to Lobby).
const RoomWithMedia: React.FC = () => {
    return (
        <MediaProvider>
            <RoomWrapper />
        </MediaProvider>
    );
};

const AppRoutes: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="/" element={<Lobby onJoin={(id) => navigate(`/room/${id}`)} />} />
      <Route path="/room/:roomId" element={<RoomWithMedia />} />
    </Routes>
  );
};

export default function App() {
  return (
    <HashRouter>
        <AppRoutes />
    </HashRouter>
  );
}