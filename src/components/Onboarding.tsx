import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Music, 
  Mic, 
  Star, 
  FolderOpen, 
  Globe,
  Link as LinkIcon
} from 'lucide-react';
import { Language, translations } from '../translations';

interface Step {
  title: string;
  description: string;
  icon: React.ReactNode;
  tip?: string;
}

interface OnboardingProps {
  onClose: () => void;
  isOpen: boolean;
  lang: Language;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onClose, isOpen, lang }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const t = translations[lang];

  const steps: Step[] = [
    {
      title: t.welcomeTitle,
      description: t.welcomeDesc,
      icon: <Mic className="text-indigo-400" size={32} />,
    },
    {
      title: t.foldersTitle,
      description: t.foldersDesc,
      icon: <FolderOpen className="text-indigo-400" size={32} />,
      tip: t.foldersTip
    },
    {
      title: t.engineTitle,
      description: t.engineDesc,
      icon: <Mic className="text-indigo-400" size={32} />,
    },
    {
      title: t.backingTitle,
      description: t.backingDesc,
      icon: <LinkIcon className="text-indigo-400" size={32} />,
      tip: t.backingTip
    },
    {
      title: t.mixingTitle,
      description: t.mixingDesc,
      icon: <Music className="text-indigo-400" size={32} />,
    },
    {
      title: t.featuredTitle,
      description: t.featuredDesc,
      icon: <Star className="text-indigo-400" size={32} />,
    },
    {
      title: t.publicTitle,
      description: t.publicDesc,
      icon: <Globe className="text-indigo-400" size={32} />,
      tip: t.publicTip
    }
  ];

  if (!isOpen) return null;

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="glass max-w-lg w-full rounded-[40px] overflow-hidden relative border border-white/10 shadow-2xl"
        >
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-white/40 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          <div className="p-10">
            <div className="flex flex-col items-center text-center">
              <motion.div 
                key={currentStep}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mb-8 border border-indigo-500/20"
              >
                {steps[currentStep].icon}
              </motion.div>

              <motion.div
                key={`text-${currentStep}`}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="space-y-4"
              >
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  {steps[currentStep].title}
                </h2>
                <p className="text-white/60 leading-relaxed">
                  {steps[currentStep].description}
                </p>
                {steps[currentStep].tip && (
                  <div className="mt-6 p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 text-xs text-indigo-300 italic">
                    {steps[currentStep].tip}
                  </div>
                )}
              </motion.div>
            </div>

            <div className="mt-12 flex items-center justify-between">
              <div className="flex gap-1.5">
                {steps.map((_, i) => (
                  <div 
                    key={i}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i === currentStep ? 'w-8 bg-indigo-500' : 'w-2 bg-white/10'
                    }`}
                  />
                ))}
              </div>

              <div className="flex gap-3">
                {currentStep > 0 && (
                  <button 
                    onClick={prev}
                    className="p-3 bg-white/5 text-white/60 rounded-2xl hover:bg-white/10 transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                )}
                <button 
                  onClick={next}
                  className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-500 transition-all flex items-center gap-2 group"
                >
                  {currentStep === steps.length - 1 ? t.getStarted : t.next}
                  <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
