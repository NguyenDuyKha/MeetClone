import React, { useState } from 'react';
import { HashRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { Lobby } from './components/Lobby';
import { MeetingRoom } from './components/MeetingRoom';

const RoomWrapper = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  
  return (
    <MeetingRoom 
        roomId={roomId || 'demo-room'} 
        onLeave={() => navigate('/')} 
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
