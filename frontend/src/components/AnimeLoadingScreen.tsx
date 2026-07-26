"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CharacterTheme {
  id: string;
  name: string;
  gifUrl: string;
  color: string;
}

const characters: CharacterTheme[] = [
  { id: "char1", name: "Personagem 1", gifUrl: "/images/loading/goku-black.gif", color: "hsl(var(--primary))" },
  { id: "char2", name: "Personagem 2", gifUrl: "/images/loading/sasuke.gif", color: "hsl(var(--primary))" },
  { id: "char3", name: "Personagem 3", gifUrl: "/images/loading/char3.gif", color: "hsl(var(--primary))" },
];

interface AnimeLoadingScreenProps {
  statusPhrase: string;
}

export function AnimeLoadingScreen({ statusPhrase }: AnimeLoadingScreenProps) {
  const [character, setCharacter] = useState<CharacterTheme | null>(null);

  useEffect(() => {
    // Pick a random character on mount
    const randomChar = characters[Math.floor(Math.random() * characters.length)];
    setCharacter(randomChar);
  }, []);

  if (!character) return null; // Avoid hydration mismatch

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

      {/* Main loading spinner in the center */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className="w-16 h-16 border-t-4 border-r-4 rounded-full z-20"
        style={{ 
          borderColor: character.color,
          filter: `drop-shadow(0 0 15px ${character.color}80)` 
        }}
      />
      
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

      {/* Character GIF in bottom right, grayscale */}
      <motion.div 
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
        className="absolute bottom-4 right-4 z-20 flex flex-col items-center"
      >
        {/* We use an img tag with error fallback so it doesn't break if the user hasn't added the image yet */}
        <img 
          src={character.gifUrl} 
          alt={character.name} 
          className="w-56 h-56 object-contain drop-shadow-2xl grayscale opacity-80" 
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      </motion.div>
    </motion.div>
  );
}
