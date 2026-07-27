"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";




interface AnimeLoadingScreenProps {
  statusPhrase: string;
}

const P2PNetworkAnimation = ({ color }: { color: string }) => {
  const peers = [
    { id: 1, cx: 50, cy: 40, delay: 0 },
    { id: 2, cx: 250, cy: 30, delay: 0.2 },
    { id: 3, cx: 270, cy: 220, delay: 0.4 },
    { id: 4, cx: 60, cy: 250, delay: 0.6 },
    { id: 5, cx: 160, cy: 280, delay: 0.8 },
    { id: 6, cx: 20, cy: 140, delay: 1.0 },
    { id: 7, cx: 280, cy: 130, delay: 1.2 },
  ];

  const center = { cx: 150, cy: 150 };

  return (
    <div className="relative w-[300px] h-[300px] z-20 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full overflow-visible">
        {peers.map((peer) => (
          <motion.line
            key={`line-${peer.id}`}
            x1={center.cx}
            y1={center.cy}
            x2={peer.cx}
            y2={peer.cy}
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: [0, 1, 1, 0],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              delay: peer.delay,
              ease: "easeInOut"
            }}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        ))}

        {peers.map((peer) => (
          <motion.circle
            key={`peer-${peer.id}`}
            cx={peer.cx}
            cy={peer.cy}
            r="5"
            fill={color}
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.5, 1, 0] }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              delay: peer.delay,
              ease: "easeInOut"
            }}
            style={{ filter: `drop-shadow(0 0 8px ${color})` }}
          />
        ))}
      </svg>
      
      {/* Central Node */}
      <motion.div 
          animate={{ scale: [1, 1.15, 1] }} 
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-12 h-12 rounded-full bg-black/80 backdrop-blur-md flex items-center justify-center z-30 border-2"
          style={{ 
            borderColor: color, 
            boxShadow: `0 0 20px ${color}80, inset 0 0 10px ${color}40` 
          }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 4px ${color})` }}>
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </motion.div>
    </div>
  );
}

export function AnimeLoadingScreen({ statusPhrase }: AnimeLoadingScreenProps) {

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex min-h-screen items-center justify-center bg-black flex-col gap-6 relative overflow-hidden fixed inset-0 z-50"
    >
      {/* Subtle cinematic grain/vignette overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.8)_100%)] pointer-events-none z-10" />
      <div className="absolute inset-0 opacity-20 pointer-events-none z-10" style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')", backgroundRepeat: 'repeat' }} />

      {/* P2P Network Animation */}
      <P2PNetworkAnimation color={'hsl(var(--primary))'} />
      
      {/* Subtitle / Phrase at the bottom center with typewriter effect */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center z-20 px-8">
        <AnimatePresence mode="wait">
          <motion.p
            key={statusPhrase}
            initial={{ clipPath: "inset(0 100% 0 0)" }}
            animate={{ clipPath: "inset(0 0% 0 0)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "linear" }}
            className="text-2xl font-heading font-bold min-h-[30px] text-primary"
            style={{ 
              textShadow: `1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 0px 4px 15px rgba(var(--primary), 0.8)`
            }}
          >
            {statusPhrase}
          </motion.p>
        </AnimatePresence>
      </div>  
    </motion.div>
  );
}
