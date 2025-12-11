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

  const isURL = (input: string) => {
    try {
      new URL(
        /^[a-zA-Z]+:\/\//.test(input) ? input : `https://${input}`
      );
      return true;
    } catch {
      return false;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.trim();

    // 1) If input looks like a URL → extract ID
    const looksLikeURL = isURL(value);

    if (looksLikeURL) {
      try {
        // Ensure URL always has a schema
        const fixed = /^[a-zA-Z]+:\/\//.test(value) ? value : `https://${value}`;
        const url = new URL(fixed);

        const sameHost =
          url.protocol === window.location.protocol &&
          url.host === window.location.host;

        if (sameHost) {
          let id = '';

          // /room/xxxxx-xxxxx (pathname)
          if (url.pathname.includes('/room/')) {
            id = url.pathname.split('/room/')[1] || '';
          }
          // #/room/xxxxx-xxxxx (hash router)
          else if (url.hash.includes('/room/')) {
            id = url.hash.split('/room/')[1] || '';
          }
          // domain/xxxxx-xxxxx (root format)
          else if (url.pathname !== '/') {
            id = url.pathname.slice(1);
          }

          // Cleanup ID
          if (id) {
            value = id.split('?')[0].split('#')[0].replace(/\/$/, '');
          }
        }
      } catch {
        // If URL parse fails, treat input as normal text
      }
    }

    // 2) Sanitize: only a-z, 0-9, hyphen
    value = value.toLowerCase().replace(/[^a-z0-9-]/g, "");

    // 3) Auto hyphen: xxxxxxxxxx → xxxxx-xxxxx
    // Case A: pasted 10 chars
    if (value.length === 10 && !value.includes('-')) {
      value = value.slice(0, 5) + '-' + value.slice(5);
    }
    // Case B: typing the 6th char (abcde → abcdef → abcde-f)
    if (value.length === 6 && !value.includes('-')) {
      value = value.slice(0, 5) + '-' + value.slice(5);
    }

    // 4) Max length
    if (value.length > 11) {
      value = value.slice(0, 11);
    }

    setRoomId(value);
  };

  const isValidId = /^[a-z0-9]{5}-[a-z0-9]{5}$/.test(roomId);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidId) {
      onJoin(roomId);
    }
  };

  return (
    <div className="min-h-screen bg-[#202124] text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full flex flex-col md:flex-row items-center gap-12">
        
        {/* Left Side: Hero */}
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left space-y-8 w-full">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-normal leading-tight">
            Premium video meetings. Now free for everyone.
          </h1>
          <p className="text-xl text-gray-400 font-light max-w-lg">
            We re-engineered the service we built for secure business meetings, Google Meet, to make it free and available for all.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center md:justify-start">
            <button
              onClick={handleCreate}
              className="h-12 flex gap-2 items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-lg font-medium text-base transition-colors shadow-lg hover:shadow-blue-500/20 whitespace-nowrap w-full sm:w-auto"
            >
              <Video size={20} />
              New meeting
            </button>
            
            <form onSubmit={handleJoin} className="flex items-center gap-2 w-full sm:w-auto justify-center mb-0">
              <div className="relative flex-1 sm:w-64">
                <Keyboard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                <input
                  type="text"
                  placeholder="Enter a code or link"
                  className={`h-12 w-full pl-10 pr-4 rounded-lg border bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${roomId && !isValidId ? 'focus:ring-red-500' : 'border-gray-500'}`}
                  value={roomId}
                  onChange={handleInputChange}
                />
              </div>
              <button 
                type="submit" 
                disabled={!isValidId}
                className={`h-12 px-4 font-medium transition-all ${!isValidId ? 'text-gray-500 cursor-not-allowed' : 'text-blue-400 hover:text-blue-300'}`}
              >
                Join
              </button>
            </form>
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
