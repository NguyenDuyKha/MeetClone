import React, { useState } from 'react';
import { Video, Keyboard } from 'lucide-react';

interface Props {
  onJoin: (roomId: string) => void;
}

export const Lobby: React.FC<Props> = ({ onJoin }) => {
  const [roomId, setRoomId] = useState('');

  const handleCreate = () => {
    const randomId = Math.random().toString(36).substring(2, 7) + '-' + Math.random().toString(36).substring(2, 7);
    onJoin(randomId);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim().length > 0) {
      onJoin(roomId);
    }
  };

  return (
    <div className="min-h-screen bg-[#202124] text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full flex flex-col md:flex-row items-center gap-12">
        
        {/* Left Side: Hero */}
        <div className="flex-1 text-center md:text-left space-y-8 w-full">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-normal leading-tight">
            Premium video meetings. Now free for everyone.
          </h1>
          <p className="text-xl text-gray-400 font-light">
            We re-engineered the service we built for secure business meetings, Google Meet, to make it free and available for all.
          </p>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
            <button
              onClick={handleCreate}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-lg font-medium text-lg transition-colors shadow-lg hover:shadow-blue-500/20 whitespace-nowrap"
            >
              <Video size={20} />
              New meeting
            </button>
            
            <form onSubmit={handleJoin} className="flex-1 sm:flex-none relative flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Keyboard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                <input
                  type="text"
                  placeholder="Enter a code or link"
                  className="w-full pl-10 pr-4 py-3.5 rounded-lg border border-gray-500 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                />
              </div>
              <button 
                type="submit" 
                disabled={!roomId}
                className={`px-4 text-blue-400 hover:text-blue-300 font-medium transition-all ${!roomId ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}`}
              >
                Join
              </button>
            </form>
          </div>
          
          <div className="pt-8 border-t border-gray-700/50">
             <p className="text-gray-500 text-sm">
                <span className="text-blue-400 hover:underline cursor-pointer">Learn more</span> about Google Meet
             </p>
          </div>
        </div>

        {/* Right Side: Visual */}
        <div className="flex-1 w-full max-w-md hidden md:block">
            <div className="aspect-square bg-gray-800 rounded-2xl p-8 flex flex-col items-center justify-center border border-gray-700 shadow-2xl relative overflow-hidden group">
                 {/* Decorative circles */}
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-all duration-700"></div>
                 
                 <div className="grid grid-cols-2 gap-4 relative z-10 w-full">
                    <div className="bg-gray-700/50 rounded-lg aspect-video animate-pulse"></div>
                    <div className="bg-gray-700/50 rounded-lg aspect-video"></div>
                    <div className="bg-gray-700/50 rounded-lg aspect-video"></div>
                    <div className="bg-gray-700/50 rounded-lg aspect-video animate-pulse delay-75"></div>
                 </div>
                 
                 <div className="mt-8 text-center relative z-10">
                     <h3 className="text-xl font-medium">Get a link you can share</h3>
                     <p className="text-gray-400 mt-2 text-sm">
                        Click <strong>New meeting</strong> to get a link you can send to people you want to meet with
                     </p>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};