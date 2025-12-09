import React, { useState, useMemo } from 'react';
import { X, Search, Mic, MicOff, MoreVertical } from 'lucide-react';
import { Participant } from '../utils/types';

interface Props {
  participants: Participant[];
  isOpen: boolean;
  onClose: () => void;
}

export const PeopleSidebar: React.FC<Props> = ({ participants, isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredParticipants = useMemo(() => {
    return participants.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [participants, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-y-0 right-0 w-full md:w-80 bg-white dark:bg-[#202124] border-l border-gray-200 dark:border-gray-800 shadow-xl z-50 flex flex-col transition-transform duration-300 transform translate-x-0">
      
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">People</h2>
        <div className="flex items-center gap-3">
            <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold px-2 py-1 rounded-full">
                {participants.length}
            </span>
            <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500 dark:text-gray-400"
            >
                <X size={20} />
            </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 pb-2">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
                type="text" 
                placeholder="Search for people"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-500"
            />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="flex flex-col gap-1">
            {filteredParticipants.length === 0 ? (
                <div className="text-center p-8 text-gray-500 dark:text-gray-400 text-sm">
                    No matching people found
                </div>
            ) : (
                filteredParticipants.map(participant => (
                    <div key={participant.id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div className="relative flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-purple-600 flex items-center justify-center text-white text-xs font-bold select-none">
                                {participant.avatarUrl ? (
                                    <img src={participant.avatarUrl} alt={participant.name} className="w-full h-full object-cover" />
                                ) : (
                                    participant.name.charAt(0).toUpperCase()
                                )}
                            </div>
                            
                            {/* Name info */}
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">
                                    {participant.name} {participant.isLocal && "(You)"}
                                </span>
                                {participant.isScreenSharing && (
                                    <span className="text-xs text-blue-500 flex items-center gap-1">Presenting</span>
                                )}
                            </div>
                        </div>

                        {/* Status Icons */}
                        <div className="flex items-center gap-2">
                            {participant.isSpeaking && (
                                <div className="flex gap-0.5 h-3 items-end mr-1">
                                    <div className="w-0.5 bg-blue-500 animate-[bounce_1s_infinite] h-2"></div>
                                    <div className="w-0.5 bg-blue-500 animate-[bounce_1s_infinite_0.2s] h-3"></div>
                                    <div className="w-0.5 bg-blue-500 animate-[bounce_1s_infinite_0.4s] h-1.5"></div>
                                </div>
                            )}
                            
                            {!participant.isScreenSharing && (
                                <div className={`p-1.5 rounded-full ${participant.hasAudio ? 'text-gray-400' : 'bg-red-500/10 text-red-500'}`}>
                                    {participant.hasAudio ? (
                                        <Mic size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    ) : (
                                        <MicOff size={16} />
                                    )}
                                </div>
                            )}

                            <button className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical size={16} />
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};