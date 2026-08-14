import React from "react";
import { motion } from "framer-motion";

interface ParallaxCardProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Apple TV+ / VisionOS style Floating Glass Card
 * - Smooth vertical float (y: -8px)
 * - Soft ambient backlight glow
 * - Ultra-clean glassmorphic borders
 */
export function ParallaxCard({
  children,
  className = "",
}: ParallaxCardProps) {
  return (
    <motion.div
      initial={{ y: 0, zIndex: 1 }}
      whileHover={{ y: -8, scale: 1.02, zIndex: 30 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className={`relative rounded-xl overflow-hidden cursor-pointer transition-shadow duration-500 hover:shadow-[0_16px_36px_-10px_rgba(0,0,0,0.8),0_0_20px_rgba(255,255,255,0.08)] border border-white/5 hover:border-white/20 ${className}`}
    >
      {/* Background Soft Glow Backdrop */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10" />

      {/* Main Content */}
      {children}
    </motion.div>
  );
}
