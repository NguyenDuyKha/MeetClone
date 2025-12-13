import React, { useEffect, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, HatGlasses, ArrowLeft } from 'lucide-react';
import { useMediaContext } from '../contexts/MediaContext';
import { useVideoRef } from '../hooks/useVideoRef';

interface Props {
  roomId: string;
  onJoin: (name: string) => void;
  onCancel: () => void;
}

export const PreJoinScreen: React.FC<Props> = ({
  roomId,
  onJoin,
  onCancel,
}) => {
  const { stream, isAudioEnabled, isVideoEnabled, toggleAudio, toggleVideo } = useMediaContext();
  const videoRef = useVideoRef(stream);
  const [displayName, setDisplayName] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);

  // Audio Level Visualizer
  useEffect(() => {
    if (!stream || !isAudioEnabled) {
      setAudioLevel(0);
      return;
    }

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    const scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);

    analyser.smoothingTimeConstant = 0.8;
    analyser.fftSize = 1024;

    microphone.connect(analyser);
    analyser.connect(scriptProcessor);
    scriptProcessor.connect(audioContext.destination);
    
    scriptProcessor.onaudioprocess = () => {
      const array = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(array);
      const arraySum = array.reduce((a, value) => a + value, 0);
      const average = arraySum / array.length;
      setAudioLevel(Math.min(100, Math.max(0, average * 2)));
    };

    return () => {
      scriptProcessor.disconnect();
      analyser.disconnect();
      microphone.disconnect();
      audioContext.close();
    };
  }, [stream, isAudioEnabled]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (displayName.trim()) {
      onJoin(displayName);
    }
  };

  return (
    <div className="min-h-screen bg-[#202124] text-white flex flex-col items-center justify-center p-4 md:p-8">
      {/* Header */}
      <div className="absolute top-6 left-6 flex items-center gap-2 text-xl font-medium text-gray-300">
         <button onClick={onCancel} className="hover:bg-gray-800 p-2 rounded-full transition-colors">
            <ArrowLeft size={24} />
         </button>
         <span>MeetClone</span>
      </div>

      <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 mt-12 lg:mt-0">
        
        {/* Left: Video Preview */}
        <div className="w-full max-w-2xl flex flex-col gap-4">
             <div className="relative aspect-video bg-[#1a1b1d] rounded-2xl overflow-hidden shadow-2xl border border-gray-800 group">
                {stream && isVideoEnabled ? (
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover transform -scale-x-100"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-2">
                        <div className="bg-gray-800 p-6 rounded-full md:block hidden">
                            <VideoOff size={36} />
                        </div>
                        <p className="text-lg font-medium">Camera is off</p>
                    </div>
                )}

                {/* Audio Meter */}
                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
                     <div className="w-2 h-2 rounded-full bg-blue-500" style={{ opacity: isAudioEnabled ? 1 : 0.3 }}></div>
                     <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-green-500 transition-all duration-100 ease-out"
                            style={{ width: isAudioEnabled ? `${audioLevel}%` : '0%' }}
                        />
                     </div>
                </div>

                {/* Controls */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
                    <button
                        onClick={toggleAudio}
                        className={`p-4 rounded-full transition-all duration-200 shadow-lg border border-white/10 ${isAudioEnabled ? 'bg-gray-700/90 hover:bg-gray-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                    >
                        {isAudioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
                    </button>
                    <button
                        onClick={toggleVideo}
                        className={`p-4 rounded-full transition-all duration-200 shadow-lg border border-white/10 ${isVideoEnabled ? 'bg-gray-700/90 hover:bg-gray-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                    >
                        {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
                    </button>
                </div>
             </div>
             
             <div className="text-center text-sm text-gray-400">
                {stream ? "Camera and microphone connected" : "Checking devices..."}
             </div>
        </div>

        {/* Right: Join Form */}
        <div className="w-full max-w-sm flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
            <div>
                <h1 className="text-3xl font-medium mb-2">Ready to join?</h1>
                <p className="text-gray-400 text-sm">Room ID: <span className="font-mono text-blue-400">{roomId}</span></p>
            </div>

             <div className="w-20 h-20 rounded-full bg-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg mx-auto lg:mx-0">
                 {displayName ? displayName.charAt(0).toUpperCase() : <HatGlasses size={32} />}
             </div>

            <form onSubmit={handleJoin} className="w-full flex flex-col gap-4">
                 <div className="relative">
                    <input
                        type="text"
                        placeholder="Your name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full bg-gray-100 dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 outline-none transition-all"
                        autoFocus
                    />
                 </div>

                 <button
                    type="submit"
                    disabled={!displayName.trim()}
                    className={`w-full py-3 px-6 rounded-full font-medium text-sm transition-all shadow-lg ${
                        displayName.trim() 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-blue-500/30' 
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                 >
                    Join now
                 </button>
            </form>
        </div>
      </div>
    </div>
  );
};
