"use client";

import React, { useState } from 'react';

interface VideoPlayerProps {
  magnetLink: string;
}

export function VideoPlayer({ magnetLink }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  // O backend proxy P2P roda na porta 8080 localmente
  const videoUrl = `http://localhost:8080/api/stream?magnet=${encodeURIComponent(magnetLink)}`;

  return (
    <div className="w-full max-w-4xl mx-auto rounded-lg overflow-hidden bg-black shadow-2xl border border-zinc-800">
      {!isPlaying ? (
        <div className="relative aspect-video flex items-center justify-center bg-zinc-950 group">
          <button 
            onClick={() => setIsPlaying(true)}
            className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full transition-transform transform hover:scale-105 shadow-[0_0_15px_rgba(220,38,38,0.5)]"
          >
            Play Stream P2P
          </button>
        </div>
      ) : (
        <video 
          controls 
          autoPlay 
          className="w-full aspect-video"
          src={videoUrl}
        >
          Seu navegador não suporta o elemento <code>video</code>.
        </video>
      )}
    </div>
  );
}
