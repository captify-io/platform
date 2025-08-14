"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface TitanLoadingScreenProps {
  message?: string;
  isVisible: boolean;
}

export function TitanLoadingScreen({ 
  message = "Loading application...", 
  isVisible 
}: TitanLoadingScreenProps) {
  const [progress, setProgress] = useState(0);

  // Simulate progress bar animation
  useEffect(() => {
    if (isVisible) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev; // Stop at 90% to avoid completing before navigation
          return prev + Math.random() * 15;
        });
      }, 200);
      
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-[9999] flex items-center justify-center backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-8 animate-in fade-in duration-300">
        {/* TITAN Logo */}
        <div className="flex items-center space-x-3">
          <span className="text-4xl font-medium">
            <span className="text-blue-400 drop-shadow-[0_0_16px_rgba(96,165,250,0.9)] animate-pulse">
              AFSC
            </span>
            <span className="text-white ml-2 tracking-wide">TITAN</span>
          </span>
        </div>
        
        {/* Loading Indicator */}
        <div className="flex items-center space-x-4 text-gray-300">
          <Loader2 className="h-7 w-7 animate-spin text-blue-400" />
          <span className="text-xl font-medium">{message}</span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-80 h-2 bg-gray-800 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Loading Dots */}
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
}
