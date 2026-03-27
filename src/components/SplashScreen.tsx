import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic } from 'lucide-react';
import { Language, translations } from '../translations';

interface SplashScreenProps {
  onComplete: () => void;
  lang: Language;
}

export const SplashScreen = ({ onComplete, lang }: SplashScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const t = translations[lang];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 1000); // Wait for exit animation
    }, 3500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="fixed inset-0 z-[200] bg-[#050505] flex flex-col items-center justify-center text-white overflow-hidden"
        >
          {/* Subtle Background Glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]" />
          </div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="relative z-10 flex flex-col items-center text-center px-6"
          >
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-8 shadow-2xl shadow-indigo-500/20">
              <Mic size={32} className="text-white" />
            </div>

            <h1 className="text-4xl font-bold tracking-tighter mb-4 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
              Vocal Studio
            </h1>

            <div className="space-y-2">
              <p className="text-xs font-mono text-white/40 uppercase tracking-[0.4em]">
                {t.copyright}
              </p>
              <div className="w-8 h-[1px] bg-white/10 mx-auto my-4" />
              <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.2em] max-w-xs leading-relaxed">
                {t.dedication}
                <br />
                {t.dedicationSub}
              </p>
            </div>
          </motion.div>

          {/* Bottom Progress Line */}
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 3, ease: "linear" }}
            className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-600 origin-left"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
