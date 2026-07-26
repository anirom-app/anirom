"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Ghost, Home, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Josefin_Sans } from "next/font/google";

const josefin = Josefin_Sans({ subsets: ["latin"], weight: ["300", "400", "600", "700"] });

export default function NotFound() {
  const router = useRouter();

  return (
    <div className={`min-h-screen bg-background text-foreground flex flex-col overflow-hidden ${josefin.className}`}>
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center relative px-6 z-10 md:ml-20 min-h-screen">
        {/* Decorative background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none -z-10" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center text-center max-w-2xl"
        >
          <div className="relative mb-8 flex flex-col justify-center items-center">
           
            
            <h1 className="text-8xl md:text-9xl font-bold mt-4 tracking-tighter bg-gradient-to-b from-foreground to-foreground/50 bg-clip-text text-transparent">
              404
            </h1>
          </div>

          <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-foreground">
            Oops! Perdido no vazio.
          </h2>
          
          <p className="text-lg text-muted-foreground mb-10 max-w-md">
             A página que você procura não existe ou foi movida
          </p>

          
        </motion.div>
      </main>
    </div>
  );
}
