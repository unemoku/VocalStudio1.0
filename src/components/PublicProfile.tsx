import React from 'react';
import { motion } from 'motion/react';
import { Music, Video, Mic, ArrowLeft, ExternalLink, Play, Pause, Settings, ChevronRight } from 'lucide-react';
import { Work, UserProfile } from '../types';
import { cn } from '../lib/utils';
import { Language, translations } from '../translations';

interface PublicProfileProps {
  profile: UserProfile;
  featuredWorks: Work[];
  onBack: () => void;
  onEdit: () => void;
  lang: Language;
}

export const PublicProfile = ({ profile, featuredWorks, onBack, onEdit, lang }: PublicProfileProps) => {
  const t = translations[lang];

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-indigo-500/30">
      {/* Banner */}
      <div className="relative h-[40vh] w-full overflow-hidden group/banner">
        <img 
          src={profile.bannerUrl || "https://picsum.photos/seed/studio/1920/1080?blur=10"} 
          alt="Banner" 
          className="w-full h-full object-cover opacity-50"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
        
        <div className="absolute top-8 left-8 flex gap-4 z-10">
          <button 
            onClick={onBack}
            className="p-3 glass rounded-full hover:bg-white/10 transition-colors"
            title={t.backToStudio}
          >
            <ArrowLeft size={20} />
          </button>
          <button 
            onClick={onEdit}
            className="flex items-center gap-2 px-5 py-2.5 glass rounded-full hover:bg-white/10 transition-all text-xs font-bold uppercase tracking-widest border border-white/10"
          >
            <Settings size={16} />
            {t.editProfile}
          </button>
        </div>
      </div>

      {/* Profile Info */}
      <div className="max-w-5xl mx-auto px-6 -mt-24 relative z-10">
        <div className="flex flex-col md:flex-row items-end gap-8 mb-12">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-40 h-40 rounded-3xl overflow-hidden border-4 border-[#050505] shadow-2xl bg-indigo-600 flex items-center justify-center"
          >
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <Mic size={64} className="text-white/20" />
            )}
          </motion.div>
          
          <div className="flex-1 pb-4">
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-5xl font-bold tracking-tight mb-2"
            >
              {profile.name || t.artistName}
            </motion.h1>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-white/60 max-w-xl"
            >
              {profile.bio || t.artistBio}
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex gap-4 pb-4"
          >
            <div className="glass px-6 py-3 rounded-2xl text-center">
              <div className="text-xl font-bold">{featuredWorks.length}</div>
              <div className="text-[10px] uppercase tracking-widest text-white/40">{t.featured}</div>
            </div>
          </motion.div>
        </div>

        {/* Featured Works Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-24">
          {featuredWorks.map((work, index) => (
            <motion.div 
              key={work.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative"
            >
              <div className="glass rounded-[32px] overflow-hidden transition-all hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10">
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-indigo-400 mb-2 block">
                        {work.songCategory}
                      </span>
                      <h3 className="text-2xl font-bold text-white">{work.title}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-indigo-400 transition-colors">
                      {work.mediaType === 'video' ? <Video size={24} /> : <Music size={24} />}
                    </div>
                  </div>

                  {work.mediaType === 'video' ? (
                    <video 
                      src={work.fileUrl} 
                      className="w-full aspect-video rounded-2xl bg-black border border-white/5 mb-6"
                      controls
                    />
                  ) : (
                    <div className="bg-white/5 p-6 rounded-2xl flex items-center gap-4 mb-6">
                      <button className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center hover:bg-indigo-500 transition-colors">
                        <Play size={24} fill="white" className="ml-1" />
                      </button>
                      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="w-1/3 h-full bg-indigo-500" />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-white/40 font-mono">
                    <span>{new Date(work.createdAt).toLocaleDateString()}</span>
                    <button className="flex items-center gap-2 hover:text-white transition-colors uppercase">
                      {t.details} <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 text-center text-white/20 text-[10px] font-mono uppercase tracking-[0.4em]">
        {t.copyright} Vocal Studio Official Profile
      </footer>
    </div>
  );
};
