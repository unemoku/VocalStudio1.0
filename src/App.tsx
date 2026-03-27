import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Mic, 
  Video, 
  Upload, 
  Play, 
  Pause, 
  Square, 
  Trash2, 
  Star, 
  Music, 
  Download,
  ChevronRight,
  ChevronLeft,
  Settings,
  History,
  LayoutGrid,
  Search,
  Plus,
  X,
  Check,
  ExternalLink,
  Link as LinkIcon,
  Volume2,
  Sliders,
  HelpCircle,
  Info,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useDropzone } from 'react-dropzone';
import { Toaster, toast } from 'sonner';
import WaveSurfer from 'wavesurfer.js';
import { cn } from './lib/utils';
import { Work, UserProfile } from './types';
import { PublicProfile } from './components/PublicProfile';
import { useStudioEngine } from './hooks/useStudioEngine';
import { Onboarding } from './components/Onboarding';
import { SplashScreen } from './components/SplashScreen';
import { Language, translations } from './translations';
import { saveBlob, getBlob, deleteBlob } from './lib/db';

// --- Hooks ---

const useBlobUrl = (id: string | undefined) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    let currentUrl: string | null = null;
    
    const load = async () => {
      try {
        // If it's a UUID (from our new IndexedDB system)
        if (id.length > 30 && !id.includes(':')) {
          const blob = await getBlob(id);
          if (blob) {
            currentUrl = URL.createObjectURL(blob);
            setUrl(currentUrl);
          }
        } else if (id.startsWith('blob:')) {
          // Dead blob URL from old system
          setUrl(null);
        } else {
          // External URL
          setUrl(id);
        }
      } catch (err) {
        console.error("[useBlobUrl] Failed to load blob:", err);
        setUrl(null);
      }
    };

    load();

    return () => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, [id]);

  return url;
};

// --- Components ---

const ProfileSettings = ({ 
  profile, 
  onUpdate, 
  onClose,
  lang
}: { 
  profile: UserProfile; 
  onUpdate: (updates: Partial<UserProfile>) => void;
  onClose: () => void;
  lang: Language;
}) => {
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio);
  const [avatar, setAvatar] = useState(profile.avatarUrl);
  const [banner, setBanner] = useState(profile.bannerUrl);
  const t = translations[lang];

  const handleSave = () => {
    onUpdate({ name, bio, avatarUrl: avatar, bannerUrl: banner });
    onClose();
    toast.success(t.savedToLibrary); // Reusing a toast message or I should add one for profile
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="glass max-w-xl w-full rounded-[40px] overflow-hidden"
      >
        <div className="p-10">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">{t.profileSettings}</h2>
            <button onClick={onClose} className="text-white/40 hover:text-white"><X size={24} /></button>
          </div>

          <div className="space-y-6">
            <div className="flex gap-6 items-center mb-8">
              <div className="w-24 h-24 rounded-3xl bg-indigo-600 overflow-hidden border-2 border-white/10 shrink-0">
                {avatar ? <img src={avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <Mic size={40} className="m-auto mt-6 text-white/20" />}
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">{t.avatarUrl}</label>
                <input 
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:border-indigo-500"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="w-full h-32 rounded-3xl bg-white/5 overflow-hidden border border-white/10 relative">
                {banner ? (
                  <img src={banner} className="w-full h-full object-cover opacity-50" referrerPolicy="no-referrer" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white/10 font-mono text-[10px] uppercase tracking-widest">Banner Preview</div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">{t.bannerUrl}</label>
                <input 
                  value={banner}
                  onChange={(e) => setBanner(e.target.value)}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:border-indigo-500"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">{t.displayName}</label>
              <input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:border-indigo-500"
                placeholder={t.artistName}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-widest text-white/40">{t.bio}</label>
              <textarea 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <button 
              onClick={handleSave}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20"
            >
              {t.save}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const CategoryFolder = ({ 
  category, 
  works, 
  onDelete, 
  onToggleFeatured, 
  onUpdate, 
  onExtractAudio,
  onUseAsBacking,
  lang
}: { 
  category: string; 
  works: Work[]; 
  onDelete: (id: string) => void;
  onToggleFeatured: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Work>) => void;
  onExtractAudio: (work: Work) => void;
  onUseAsBacking: (work: Work) => void;
  lang: Language;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const t = translations[lang];

  return (
    <div className="mb-6">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 glass rounded-2xl hover:bg-white/10 transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
            <Music size={24} />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-lg text-white">{category}</h3>
            <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">{works.length} {lang === 'zh' ? '个版本' : 'Versions'}</p>
          </div>
        </div>
        <div className={cn("transition-transform duration-300", isExpanded ? "rotate-180" : "")}>
          <ChevronRight size={20} className="text-white/40" />
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 pl-4 border-l-2 border-white/5 ml-6">
              {works.map((work) => (
                <div key={work.id}>
                  <WorkCard 
                    work={work} 
                    onDelete={onDelete}
                    onToggleFeatured={onToggleFeatured}
                    onUpdate={onUpdate}
                    onExtractAudio={onExtractAudio}
                    onUseAsBacking={onUseAsBacking}
                    lang={lang}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AudioVisualizer = ({ 
  url, 
  vocalUrl,
  backingUrl,
  vocalVolume = 1,
  backingVolume = 1,
  className, 
  lang,
  mediaRef
}: { 
  url: string | null; 
  vocalUrl?: string | null;
  backingUrl?: string | null;
  vocalVolume?: number;
  backingVolume?: number;
  className?: string; 
  lang: Language;
  mediaRef?: React.RefObject<HTMLMediaElement | null>;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const vocalWsRef = useRef<WaveSurfer | null>(null);
  const backingWsRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = translations[lang];

  useEffect(() => {
    if (!containerRef.current) return;
    if (!url) {
      setError(t.sessionExpired);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);

    const isAbortError = (err: any) => {
      const msg = err?.message?.toLowerCase() || '';
      return msg.includes('abort') || err?.name === 'AbortError' || msg.includes('signal is aborted');
    };

    const isMultiTrack = !!(vocalUrl && backingUrl);

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: isMultiTrack ? '#4f46e5' : '#4f46e5',
      progressColor: '#818cf8',
      cursorColor: '#ffffff',
      barWidth: 2,
      barRadius: 3,
      height: 60,
      normalize: true,
      backend: 'MediaElement',
      media: mediaRef?.current || undefined,
    });

    if (isMultiTrack) {
      // For multi-track, we use the main WaveSurfer for visualization (of the mixed track)
      // but we also create two hidden WaveSurfers for synchronized playback
      const vocalWs = WaveSurfer.create({
        container: document.createElement('div'),
        backend: 'MediaElement',
      });
      const backingWs = WaveSurfer.create({
        container: document.createElement('div'),
        backend: 'MediaElement',
      });

      vocalWs.load(vocalUrl!).catch(err => {
        if (!isAbortError(err)) console.error("[AudioVisualizer] Vocal load error:", err);
      });
      backingWs.load(backingUrl!).catch(err => {
        if (!isAbortError(err)) console.error("[AudioVisualizer] Backing load error:", err);
      });
      
      vocalWsRef.current = vocalWs;
      backingWsRef.current = backingWs;

      // Apply initial volumes
      vocalWs.setVolume(vocalVolume ?? 1);
      backingWs.setVolume(backingVolume ?? 1);
      // Mute main WaveSurfer for multi-track playback
      ws.setVolume(0);

      // Sync playback
      ws.on('play', () => {
        vocalWs.play();
        backingWs.play();
      });
      ws.on('pause', () => {
        vocalWs.pause();
        backingWs.pause();
      });
      ws.on('seeking', (time) => {
        vocalWs.setTime(time);
        backingWs.setTime(time);
      });
      ws.on('finish', () => {
        vocalWs.stop();
        backingWs.stop();
      });

      // Mute the main one, we'll hear the tracks
      ws.setMuted(true);
    }

    ws.on('ready', () => {
      setIsLoading(false);
    });
    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));
    ws.on('finish', () => setIsPlaying(false));
    ws.on('error', (err) => {
      if (isAbortError(err)) return;
      console.error("[AudioVisualizer] WaveSurfer error:", err);
      setError(t.playbackError);
      setIsLoading(false);
    });

    ws.load(url).catch(err => {
      if (isAbortError(err)) return;
      console.error("[AudioVisualizer] Load error:", err);
      setError(t.playbackError);
      setIsLoading(false);
    });

    wavesurferRef.current = ws;

    return () => {
      ws.destroy();
      vocalWsRef.current?.destroy();
      backingWsRef.current?.destroy();
    };
  }, [url, vocalUrl, backingUrl, t.playbackError, mediaRef]);

  // Sync volumes
  useEffect(() => {
    if (vocalWsRef.current) vocalWsRef.current.setVolume(vocalVolume);
    if (backingWsRef.current) backingWsRef.current.setVolume(backingVolume);
    
    // If not multi-track, just use the main one
    if (!vocalWsRef.current && wavesurferRef.current) {
      wavesurferRef.current.setVolume(1.0);
    }
  }, [vocalVolume, backingVolume]);

  if (error) {
    return (
      <div className={cn("flex flex-col gap-3 bg-red-500/5 p-4 rounded-xl border border-red-500/20", className)}>
        <div className="flex items-center gap-2 text-red-400">
          <Info size={14} />
          <span className="text-xs font-medium">{error}</span>
        </div>
        <p className="text-[10px] text-white/40 leading-relaxed italic">
          {t.sessionExpired}
        </p>
        <p className="text-[10px] text-white/20 leading-relaxed">
          {t.playbackErrorSub}
        </p>
        <div className="bg-white/5 p-2 rounded-lg">
          <audio 
            src={url} 
            controls 
            className="w-full h-8 accent-indigo-500"
            onError={(e) => console.error("[AudioVisualizer] Fallback audio error:", e)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10 relative", className)}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] rounded-xl z-10">
          <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="ml-2 text-[10px] font-mono text-white/40 uppercase tracking-widest">{t.loadingWaveform}</span>
        </div>
      )}
      <button 
        onClick={() => wavesurferRef.current?.playPause()}
        className="w-10 h-10 flex items-center justify-center bg-indigo-600 rounded-full hover:bg-indigo-500 transition-colors shrink-0"
      >
        {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
      </button>
      <div ref={containerRef} className="flex-1 min-w-0" />
    </div>
  );
};

const WorkCard = ({ 
  work, 
  onDelete, 
  onToggleFeatured, 
  onUpdate, 
  onExtractAudio,
  onUseAsBacking,
  lang
}: { 
  work: Work; 
  onDelete: (id: string) => void;
  onToggleFeatured: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Work>) => void;
  onExtractAudio: (work: Work) => void;
  onUseAsBacking: (work: Work) => void;
  lang: Language;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(work.title);
  const [editCategory, setEditCategory] = useState(work.songCategory);
  const [vocalVolume, setVocalVolume] = useState(work.vocalVolume ?? 1);
  const [backingVolume, setBackingVolume] = useState(work.backingVolume ?? 1);
  const [isSharing, setIsSharing] = useState(false);
  const t = translations[lang];

  const videoRef = useRef<HTMLVideoElement>(null);

  const mainUrl = useBlobUrl(work.fileUrl);
  const vocalUrl = useBlobUrl(work.vocalUrl);
  const backingUrl = useBlobUrl(work.backingUrl);

  const handleSave = () => {
    onUpdate(work.id, { 
      title: editTitle, 
      songCategory: editCategory,
      vocalVolume,
      backingVolume
    });
    setIsEditing(false);
  };

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    try {
      await navigator.share({
        title: work.title,
        text: `${t.shareText} ${work.title}`,
        url: window.location.href
      });
    } catch (err) {
      const error = err as Error;
      if (error.name !== 'AbortError' && !error.message?.includes('earlier share')) {
        console.error('Share failed:', err);
      }
    } finally {
      setIsSharing(false);
    }
  };

  const [showMixing, setShowMixing] = useState(true);
  const isMultiTrack = !!(work.vocalUrl && work.backingUrl);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass rounded-2xl overflow-hidden group"
    >
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 mr-4">
            {isEditing ? (
              <div className="space-y-2">
                <input 
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 bg-white/5 border border-white/10 rounded px-2 py-1 w-full outline-none focus:border-indigo-500"
                  placeholder={t.category}
                />
                <input 
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-lg font-semibold text-white bg-white/5 border border-white/10 rounded px-2 py-1 w-full outline-none focus:border-indigo-500"
                  placeholder={t.title}
                />
                <div className="flex gap-2">
                  <button onClick={handleSave} className="text-[10px] bg-indigo-600 px-2 py-1 rounded text-white font-bold">{t.save.toUpperCase()}</button>
                  <button onClick={() => setIsEditing(false)} className="text-[10px] bg-white/5 px-2 py-1 rounded text-white/60">{t.cancel.toUpperCase()}</button>
                </div>
              </div>
            ) : (
              <div onClick={() => setIsEditing(true)} className="cursor-pointer group/title">
                <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 mb-1 block group-hover/title:text-indigo-300 transition-colors">
                  {work.songCategory}
                </span>
                <h3 className="text-lg font-semibold text-white leading-tight group-hover/title:text-indigo-100 transition-colors">{work.title}</h3>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => onUseAsBacking(work)}
              title={t.useAsBacking}
              className="p-2 rounded-lg text-white/40 hover:text-indigo-400 hover:bg-indigo-400/10 bg-white/5 transition-colors"
            >
              <Plus size={16} />
            </button>
            {work.mediaType === 'video' && (
              <button 
                onClick={() => onExtractAudio(work)}
                title={t.extractAudio}
                className="p-2 rounded-lg text-white/40 hover:text-indigo-400 hover:bg-indigo-400/10 bg-white/5 transition-colors"
              >
                <Music size={16} />
              </button>
            )}
            {isMultiTrack && (
              <button 
                onClick={() => setShowMixing(!showMixing)}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  showMixing ? "text-indigo-400 bg-indigo-400/10" : "text-white/40 hover:text-indigo-400 hover:bg-indigo-400/10 bg-white/5"
                )}
                title={t.mixingConsole}
              >
                <Sliders size={16} />
              </button>
            )}
            {navigator.share && (
              <button 
                onClick={handleShare}
                className="p-2 rounded-lg text-white/40 hover:text-indigo-400 hover:bg-indigo-400/10 bg-white/5 transition-colors"
                title={t.share}
              >
                <Share2 size={16} />
              </button>
            )}
            <a 
              href={mainUrl || work.fileUrl} 
              download={`${work.title}.${work.mediaType === 'video' ? 'mp4' : (mainUrl?.includes('mp4') || work.fileUrl.includes('mp4') || work.fileUrl.includes('m4a') ? 'm4a' : 'wav')}`}
              className="p-2 rounded-lg text-white/40 hover:text-emerald-400 hover:bg-emerald-400/10 bg-white/5 transition-colors"
              title={t.download}
            >
              <Download size={16} />
            </a>
            <button 
              onClick={() => onToggleFeatured(work.id)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                work.isFeatured ? "text-yellow-400 bg-yellow-400/10" : "text-white/40 hover:text-white/60 bg-white/5"
              )}
            >
              <Star size={16} fill={work.isFeatured ? "currentColor" : "none"} />
            </button>
            <button 
              onClick={() => onDelete(work.id)}
              className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-400/10 bg-white/5 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="space-y-4 mb-4">
          {work.mediaType === 'video' && (
            <video 
              ref={videoRef}
              src={mainUrl || work.fileUrl} 
              controls 
              className="w-full aspect-video rounded-xl bg-black border border-white/5"
            />
          )}

          <AudioVisualizer 
            url={mainUrl || work.fileUrl} 
            vocalUrl={vocalUrl || work.vocalUrl}
            backingUrl={backingUrl || work.backingUrl}
            vocalVolume={vocalVolume}
            backingVolume={backingVolume}
            lang={lang} 
            mediaRef={work.mediaType === 'video' ? videoRef : undefined}
            className={work.mediaType === 'video' ? "opacity-0 h-0 p-0 overflow-hidden" : ""}
          />
          
          {isMultiTrack && showMixing && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/20 shadow-inner"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sliders size={14} className="text-indigo-400" />
                  <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{t.mixingConsole}</h4>
                </div>
                <button 
                  onClick={() => setShowMixing(false)}
                  className="text-white/20 hover:text-white/40 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Mic size={12} className="text-white/40" />
                      <span className="text-[10px] font-mono text-white/60 uppercase tracking-widest">{t.vocal}</span>
                    </div>
                    <span className="text-[10px] font-mono text-indigo-400 font-bold">{Math.round(vocalVolume * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="2" 
                    step="0.01"
                    value={vocalVolume}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setVocalVolume(val);
                      onUpdate(work.id, { vocalVolume: val });
                    }}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Music size={12} className="text-white/40" />
                      <span className="text-[10px] font-mono text-white/60 uppercase tracking-widest">{t.backing}</span>
                    </div>
                    <span className="text-[10px] font-mono text-indigo-400 font-bold">{Math.round(backingVolume * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="2" 
                    step="0.01"
                    value={backingVolume}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setBackingVolume(val);
                      onUpdate(work.id, { backingVolume: val });
                    }}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-white/40">
          <span>{new Date(work.createdAt).toLocaleDateString()}</span>
          <span className="flex items-center gap-1 uppercase">
            {work.mediaType === 'video' ? <Video size={12} /> : <Mic size={12} />}
            {work.mediaType}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

const URLGuideModal = ({ onClose, lang }: { onClose: () => void; lang: Language }) => {
  const t = translations[lang];
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="glass max-w-md w-full rounded-[40px] overflow-hidden relative border border-white/10 shadow-2xl"
      >
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-white/40 hover:text-white transition-colors"><X size={20} /></button>
        <div className="p-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
              <Info size={24} />
            </div>
            <h2 className="text-xl font-bold">{t.urlGuide}</h2>
          </div>
          
          <div className="space-y-6 text-sm text-white/70 leading-relaxed">
            <section>
              <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                {t.localFiles}
              </h3>
              <p>{lang === 'zh' ? '点击录音室中的上传图标，直接从您的设备选择 MP3 或 MP4 文件。' : 'Click the upload icon in Studio mode to select MP3 or MP4 files directly from your device.'}</p>
            </section>

            <section>
              <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                {t.dropboxMethod}
              </h3>
              <p>{lang === 'zh' ? '复制分享链接，并将 www.dropbox.com 更改为 dl.dropboxusercontent.com。' : 'Copy your share link and change www.dropbox.com to dl.dropboxusercontent.com.'}</p>
            </section>

            <section>
              <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                {t.googleDriveMethod}
              </h3>
              <p>{lang === 'zh' ? '将共享设置为“任何拥有链接的人”，并使用：' : 'Set sharing to "Anyone with link" and use:'} <br/>
              <code className="text-[10px] text-indigo-300 block mt-1 break-all">https://drive.google.com/uc?export=download&id=YOUR_FILE_ID</code></p>
            </section>

            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-[11px] text-amber-200 italic">
              {t.corsNote}
            </div>

            <section>
              <h3 className="text-white font-bold mb-2 flex items-center gap-2">
                <div className="w-1 h-4 bg-indigo-500 rounded-full" />
                {t.bluetoothAirpods}
              </h3>
              <p>
                {t.bluetoothLatencyNote}
              </p>
            </section>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [works, setWorks] = useState<Work[]>([]);
  const [view, setView] = useState<'studio' | 'public'>('studio');
  const [profile, setProfile] = useState<UserProfile>({
    name: "Artist Name",
    bio: "Vocalist & Music Enthusiast. Sharing my practice journey.",
    avatarUrl: "",
    bannerUrl: ""
  });
  
  const [recordingType, setRecordingType] = useState<'audio' | 'video'>('audio');
  const [showRecorder, setShowRecorder] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSplash, setShowSplash] = useState(!sessionStorage.getItem('vocal-studio-splash'));
  const [showURLGuide, setShowURLGuide] = useState(false);
  const [backingTrackUrl, setBackingTrackUrl] = useState('');
  const [language, setLanguage] = useState<Language>('zh');

  const studio = useStudioEngine();
  const t = translations[language];
  const [searchQuery, setSearchQuery] = useState("");
  
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  const useAsBacking = (work: Work) => {
    setBackingTrackUrl(work.fileUrl);
    studio.loadBackingTrack(work.fileUrl);
    setShowRecorder(true);
    toast.success(t.backingTrackLoaded);
  };

  // Load from localStorage
  useEffect(() => {
    const savedWorks = localStorage.getItem('vocal-studio-works');
    if (savedWorks) {
      try {
        setWorks(JSON.parse(savedWorks));
      } catch (e) {
        console.error("Failed to parse saved works", e);
      }
    }
    const savedProfile = localStorage.getItem('vocal-studio-profile');
    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
      } catch (e) {
        console.error("Failed to parse saved profile", e);
      }
    }

    const hasSeenOnboarding = localStorage.getItem('vocal-studio-onboarding');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('vocal-studio-works', JSON.stringify(works));
  }, [works]);

  useEffect(() => {
    localStorage.setItem('vocal-studio-profile', JSON.stringify(profile));
  }, [profile]);

  const startRecording = async () => {
    try {
      await studio.startRecording(recordingType);
      if (recordingType === 'video') {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
        }
      }
    } catch (err) {
      console.error("Failed to start recording:", err);
    }
  };

  const stopRecording = async () => {
    const loadingId = toast.loading(t.finalizingRecording);
    const result = await studio.stopRecording();
    if (result) {
      const { mixed, vocal } = result;
      
      // Save to IndexedDB for persistence
      const workId = crypto.randomUUID();
      const vocalId = `vocal-${workId}`;
      const backingId = studio.backingTrackBuffer ? `backing-${workId}` : undefined;
      
      await saveBlob(workId, mixed);
      await saveBlob(vocalId, vocal);
      
      // If we have a backing track buffer, we should ideally save it too if it's not already in library
      // But for now let's just use the URL if it's a blob or external
      
      const newWork: Work = {
        id: workId,
        title: `${t.studioSession} ${new Date().toLocaleDateString()}`,
        songCategory: t.studioSessions,
        fileUrl: workId,
        vocalUrl: vocalId,
        backingUrl: backingTrackUrl || undefined, // Ensure it's undefined if empty for isMultiTrack logic
        vocalVolume: studio.micVolume,
        backingVolume: studio.backingTrackVolume,
        mediaType: recordingType,
        isFeatured: false,
        createdAt: Date.now(),
      };
      setWorks(prev => [newWork, ...prev]);
      toast.success(t.recordingSaved, { id: loadingId });
    } else {
      toast.dismiss(loadingId);
    }
    setShowRecorder(false);
    if (videoPreviewRef.current) videoPreviewRef.current.srcObject = null;
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      const url = URL.createObjectURL(file);
      const isVideo = file.type.startsWith('video/');
      const isAudio = file.type.startsWith('audio/');
      
      if (!isVideo && !isAudio) {
        toast.error(`Unsupported file type: ${file.name}`);
        return;
      }

      const newWork: Work = {
        id: crypto.randomUUID(),
        title: file.name.split('.')[0],
        songCategory: "Imported",
        fileUrl: url,
        mediaType: isVideo ? 'video' : 'audio',
        isFeatured: false,
        createdAt: Date.now(),
      };

      setWorks(prev => [newWork, ...prev]);
      toast.success(`Imported ${file.name}`);
    });
  }, [works]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.webm'],
      'video/*': ['.mp4', '.mov', '.webm']
    }
  } as any);

  const updateWork = (id: string, updates: Partial<Work>) => {
    setWorks(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
    toast.success("Session updated");
  };

  const extractAudio = async (work: Work) => {
    const loadingId = toast.loading("Extracting audio...");
    try {
      let blob: Blob | null = null;
      
      // Handle UUID vs URL
      if (work.fileUrl.length > 30 && !work.fileUrl.includes(':')) {
        blob = await getBlob(work.fileUrl);
      } else {
        const response = await fetch(work.fileUrl);
        blob = await response.blob();
      }

      if (!blob) throw new Error("Failed to retrieve source file");
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // For simplicity in this demo, we'll just create an audio blob from the original stream
      // but filtered for audio. In a real app, we might use an encoder.
      // Here we'll just re-save it as an audio type work.
      
      const newWork: Work = {
        id: crypto.randomUUID(),
        title: `${work.title} (Audio Only)`,
        songCategory: work.songCategory,
        fileUrl: work.fileUrl, // In a real app, we'd save the actual extracted audio buffer
        mediaType: 'audio',
        isFeatured: false,
        createdAt: Date.now(),
      };
      
      setWorks(prev => [newWork, ...prev]);
      toast.success("Audio extracted successfully!", { id: loadingId });
    } catch (err) {
      console.error("Extraction failed:", err);
      toast.error("Failed to extract audio", { id: loadingId });
    }
  };

  const deleteWork = async (id: string) => {
    const workToDelete = works.find(w => w.id === id);
    if (workToDelete) {
      // Clean up IndexedDB
      await deleteBlob(id);
      if (workToDelete.vocalUrl) await deleteBlob(workToDelete.vocalUrl);
      // backingUrl might be external, so we don't delete it unless it's one of ours
      if (workToDelete.backingUrl?.startsWith('backing-')) await deleteBlob(workToDelete.backingUrl);
    }
    setWorks(prev => prev.filter(w => w.id !== id));
    toast.info("Session deleted");
  };

  const toggleFeatured = (id: string) => {
    setWorks(prev => prev.map(w => w.id === id ? { ...w, isFeatured: !w.isFeatured } : w));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredWorks = works.filter(w => 
    w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.songCategory.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group works by category
  const groupedWorks: Record<string, Work[]> = filteredWorks.reduce((acc: Record<string, Work[]>, work) => {
    const category = work.songCategory || "Uncategorized";
    if (!acc[category]) acc[category] = [];
    acc[category].push(work);
    return acc;
  }, {});

  if (view === 'public') {
    return (
      <PublicProfile 
        profile={profile} 
        featuredWorks={works.filter(w => w.isFeatured)} 
        onBack={() => setView('studio')}
        onEdit={() => {
          setView('studio');
          setShowSettings(true);
        }}
        lang={language}
      />
    );
  }

  return (
    <div className="min-h-screen studio-grid pb-20">
      {showSplash && (
        <SplashScreen onComplete={() => {
          setShowSplash(false);
          sessionStorage.setItem('vocal-studio-splash', 'true');
        }} lang={language} />
      )}
      {showOnboarding && (
        <Onboarding 
          isOpen={showOnboarding} 
          onClose={() => {
            setShowOnboarding(false);
            localStorage.setItem('vocal-studio-onboarding', 'true');
          }} 
          lang={language}
        />
      )}
      <Toaster position="top-center" theme="dark" />
      
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b-0 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Mic className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Vocal Studio</h1>
            <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">{t.proVocalEngine}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold hover:bg-white/10 transition-all"
          >
            {language === 'en' ? '中文' : 'EN'}
          </button>
          <div className="hidden md:flex items-center bg-white/5 rounded-full px-4 py-2 border border-white/10 focus-within:border-indigo-500/50 transition-colors">
            <Search size={16} className="text-white/40 mr-2" />
            <input 
              type="text" 
              placeholder={t.searchWorks} 
              className="bg-transparent border-none focus:ring-0 text-sm w-48 text-white outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setView('public')}
            className="flex items-center gap-2 px-4 py-2 glass rounded-full text-xs font-bold hover:bg-white/10 transition-all"
          >
            <ExternalLink size={14} />
            {t.viewPublic.toUpperCase()}
          </button>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 text-white/60 hover:text-white transition-colors"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-8">
        {/* Stats / Hero */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="glass p-6 rounded-3xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <History size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{works.length}</div>
              <div className="text-xs text-white/40 uppercase tracking-wider">{t.totalSessions}</div>
            </div>
          </div>
          <div className="glass p-6 rounded-3xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-400">
              <Star size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{works.filter(w => w.isFeatured).length}</div>
              <div className="text-xs text-white/40 uppercase tracking-wider">{t.featuredWorks}</div>
            </div>
          </div>
          <div className="glass p-6 rounded-3xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-400">
              <LayoutGrid size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{new Set(works.map(w => w.songCategory)).size}</div>
              <div className="text-xs text-white/40 uppercase tracking-wider">{t.categories}</div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
          <h2 className="text-2xl font-semibold flex items-center gap-2 text-white">
            {t.yourLibrary}
            <span className="text-sm font-normal text-white/40 ml-2">({works.length} {language === 'zh' ? '项' : 'items'})</span>
          </h2>
          <div className="flex gap-3">
            <button 
              onClick={() => {
                setRecordingType('audio');
                setShowRecorder(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-full font-medium transition-all shadow-lg shadow-indigo-500/20 text-white"
            >
              <Mic size={18} />
              {t.recordVocal}
            </button>
            <button 
              onClick={() => {
                setRecordingType('video');
                setShowRecorder(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-full font-medium transition-all border border-white/10 text-white"
            >
              <Video size={18} />
              {t.recordVideo}
            </button>
          </div>
        </div>

        {/* Empty State */}
        {works.length === 0 && (
          <div 
            {...getRootProps()} 
            className={cn(
              "border-2 border-dashed rounded-3xl p-20 flex flex-col items-center justify-center text-center transition-all cursor-pointer",
              isDragActive ? "border-indigo-500 bg-indigo-500/5" : "border-white/10 hover:border-white/20"
            )}
          >
            <input {...getInputProps()} />
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
              <Upload className="text-white/20" size={40} />
            </div>
            <h3 className="text-xl font-medium mb-2 text-white">{t.noWorksFound}</h3>
            <p className="text-white/40 max-w-xs mb-8">
              {t.startRecordingPrompt}
            </p>
            <div className="flex gap-4">
              <button className="px-6 py-2 bg-white text-black rounded-full font-bold hover:bg-white/90 transition-colors">
                {t.importMedia}
              </button>
            </div>
          </div>
        )}

        {/* Grouped View */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {Object.entries(groupedWorks).map(([category, categoryWorks]) => (
              <div key={category}>
                <CategoryFolder 
                  category={category}
                  works={categoryWorks}
                  onDelete={deleteWork}
                  onToggleFeatured={toggleFeatured}
                  onUpdate={updateWork}
                  onExtractAudio={extractAudio}
                  onUseAsBacking={useAsBacking}
                  lang={language}
                />
              </div>
            ))}
          </AnimatePresence>
        </div>
      </main>

      {/* Recorder Overlay */}
      <AnimatePresence>
        {showRecorder && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass max-w-2xl w-full rounded-[40px] overflow-hidden relative"
            >
              {/* Back Button */}
              <button 
                onClick={() => {
                  if (studio.isRecording) {
                    if (confirm("Recording in progress. Stop and discard?")) {
                      studio.stopRecording();
                      setShowRecorder(false);
                    }
                  } else {
                    setShowRecorder(false);
                  }
                }}
                className="absolute top-8 left-8 flex items-center gap-2 text-white/80 hover:text-white transition-all z-20 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md shadow-lg"
              >
                <ChevronLeft size={20} />
                <span className="text-xs font-bold uppercase tracking-widest">Exit Studio</span>
              </button>

              <button 
                onClick={() => {
                  if (studio.isRecording) stopRecording();
                  setShowRecorder(false);
                }}
                className="absolute top-8 right-8 p-3 text-white/80 hover:text-white transition-all z-20 bg-white/10 hover:bg-white/20 rounded-full border border-white/10 backdrop-blur-md shadow-lg"
              >
                <X size={24} />
              </button>

              <div className="p-10 flex flex-col items-center relative">
                {/* Processing Overlay */}
                <AnimatePresence>
                  {studio.isProcessing && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl"
                    >
                      <div className="w-24 h-24 relative mb-8">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
                          <circle
                            cx="48"
                            cy="48"
                            r="40"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="transparent"
                            className="text-white/10"
                          />
                          <motion.circle
                            cx="48"
                            cy="48"
                            r="40"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="transparent"
                            strokeDasharray="251.2"
                            animate={{ strokeDashoffset: 251.2 - (251.2 * studio.processingProgress) / 100 }}
                            className="text-indigo-500"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center font-mono text-sm text-white">
                          {Math.round(studio.processingProgress)}%
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {studio.processingProgress < 40 ? t.collectingData : 
                         studio.processingProgress < 80 ? t.mixingAudio : 
                         t.finalizingFile}
                      </h3>
                      <p className="text-white/40 text-sm">{t.pleaseWait}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bluetooth Warning */}
                {!studio.isRecording && (
                  <div className="w-full mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                    <div className="p-1.5 bg-amber-500/20 rounded-lg text-amber-400 shrink-0">
                      <Info size={16} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">{t.bluetoothAirpods}</h4>
                      <p className="text-[10px] text-amber-200/60 leading-relaxed">
                        {t.bluetoothLatencyNote}
                      </p>
                    </div>
                  </div>
                )}

                <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-indigo-400 mb-8">
                  {t.studioMode}: {recordingType === 'video' ? t.video : t.audio}
                </div>

                {/* Recent Tracks */}
                {!studio.isRecording && works.length > 0 && (
                  <div className="w-full mb-8">
                    <h4 className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-4">{t.recentTracks}</h4>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {works.filter(w => w.mediaType === 'audio' || w.songCategory === 'Imported').slice(0, 8).map(track => (
                        <button
                          key={track.id}
                          onClick={() => {
                            setBackingTrackUrl(track.fileUrl);
                            studio.loadBackingTrack(track.fileUrl);
                          }}
                          className={cn(
                            "shrink-0 px-4 py-2 glass rounded-xl text-xs hover:bg-white/10 transition-all border",
                            backingTrackUrl === track.fileUrl ? "border-indigo-500 bg-indigo-500/10" : "border-white/5"
                          )}
                        >
                          {track.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Backing Track Input */}
                {!studio.isRecording && (
                  <div className="w-full mb-8 space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 focus-within:border-indigo-500/50 transition-colors">
                      <LinkIcon size={18} className="text-white/40" />
                      <input 
                        type="text" 
                        placeholder={t.backingTrackPlaceholder}
                        value={backingTrackUrl}
                        onChange={(e) => setBackingTrackUrl(e.target.value)}
                        className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-white/20"
                      />
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setShowURLGuide(true)}
                          className="p-1.5 text-white/20 hover:text-white/60 transition-colors"
                          title={t.urlHelp}
                        >
                          <Info size={18} />
                        </button>
                        <label className="cursor-pointer p-1.5 text-white/20 hover:text-white/60 transition-colors" title={t.importMedia}>
                          <Upload size={18} />
                          <input 
                            type="file" 
                            accept="audio/*,video/*" 
                            className="hidden" 
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const id = crypto.randomUUID();
                                await saveBlob(id, file);
                                setBackingTrackUrl(id);
                                studio.loadBackingTrackFromFile(file);
                              }
                            }}
                          />
                        </label>
                        <button 
                          onClick={() => studio.loadBackingTrack(backingTrackUrl)}
                          disabled={!backingTrackUrl}
                          className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {t.load}
                        </button>
                      </div>
                    </div>
                    {studio.backingTrackBuffer && (
                      <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-mono uppercase tracking-wider">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                        {t.backingTrackReady}
                      </div>
                    )}
                  </div>
                )}

                {/* Mixing Console - Always visible in Studio mode */}
                <div className="w-full mb-10 p-6 bg-white/5 rounded-[32px] border border-white/10 shadow-2xl">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-400">
                      <Sliders size={14} />
                    </div>
                    <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{t.mixingConsole}</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-white/40 font-mono">
                        <span>{t.backingTrack}</span>
                        <span className="text-indigo-400">{Math.round(studio.backingTrackVolume * 100)}%</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <Music size={16} className="text-white/20" />
                        <input 
                          type="range" 
                          min="0" 
                          max="1" 
                          step="0.01"
                          value={studio.backingTrackVolume}
                          onChange={(e) => studio.setBackingTrackVolume(parseFloat(e.target.value))}
                          className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-white/40 font-mono">
                        <span>{t.micGain}</span>
                        <span className="text-indigo-400">{Math.round(studio.micVolume * 100)}%</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <Mic size={16} className="text-white/20" />
                        <input 
                          type="range" 
                          min="0" 
                          max="2" 
                          step="0.01"
                          value={studio.micVolume}
                          onChange={(e) => studio.setMicVolume(parseFloat(e.target.value))}
                          className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full aspect-video bg-black/40 rounded-[32px] border border-white/5 mb-10 overflow-hidden flex items-center justify-center relative">
                  {recordingType === 'video' ? (
                    <video 
                      ref={videoPreviewRef} 
                      autoPlay 
                      muted 
                      playsInline 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center gap-1">
                      {[...Array(12)].map((_, i) => (
                        <motion.div 
                          key={i}
                          animate={studio.isRecording ? { height: [20, 60, 20] } : { height: 20 }}
                          transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.05 }}
                          className="w-1.5 bg-indigo-500/40 rounded-full"
                        />
                      ))}
                    </div>
                  )}
                  
                  {studio.isRecording && (
                    <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1.5 bg-red-500 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse text-white">
                      <div className="w-2 h-2 bg-white rounded-full" />
                      Recording
                    </div>
                  )}
                </div>

                {/* Bluetooth Warning */}
                <div className="flex items-center gap-2 mb-10 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-[9px] text-amber-200 uppercase tracking-widest font-mono">
                  <HelpCircle size={12} />
                  {t.bluetoothWarning}
                </div>

                <div className="text-5xl font-mono font-light mb-10 tracking-tighter text-white">
                  {formatTime(studio.recordingTime)}
                </div>

                <div className="flex items-center gap-8">
                  {!studio.isRecording ? (
                    <button 
                      onClick={startRecording}
                      className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center shadow-2xl shadow-red-500/40 hover:scale-105 transition-transform group"
                    >
                      <div className="w-8 h-8 bg-white rounded-full group-hover:scale-90 transition-transform" />
                    </button>
                  ) : (
                    <button 
                      onClick={stopRecording}
                      className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl shadow-white/20 hover:scale-105 transition-transform"
                    >
                      <Square size={32} className="text-black fill-black" />
                    </button>
                  )}
                </div>
                
                <p className="mt-8 text-white/40 text-sm">
                  {studio.isRecording ? t.stopRecordingPrompt : t.startRecordingPrompt}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Settings Overlay */}
      <AnimatePresence>
        {showSettings && (
          <ProfileSettings 
            profile={profile}
            onUpdate={(updates) => setProfile(prev => ({ ...prev, ...updates }))}
            onClose={() => setShowSettings(false)}
            lang={language}
          />
        )}
      </AnimatePresence>

      {/* Onboarding Tutorial */}
      <Onboarding 
        isOpen={showOnboarding} 
        onClose={() => {
          setShowOnboarding(false);
          localStorage.setItem('vocal-studio-onboarding', 'true');
        }} 
        lang={language}
      />

      {/* Persistent Help Button */}
      <button 
        onClick={() => setShowOnboarding(true)}
        className="fixed bottom-8 right-8 w-12 h-12 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 transition-all z-40 hidden md:flex"
        title={t.showTutorial}
      >
        <HelpCircle size={24} />
      </button>

      {/* URL Guide Modal */}
      <AnimatePresence>
        {showURLGuide && (
          <URLGuideModal onClose={() => setShowURLGuide(false)} lang={language} />
        )}
      </AnimatePresence>

      {/* Global Floating Action (Mobile) */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-4 md:hidden">
        <button 
          onClick={() => {
            setRecordingType('audio');
            setShowRecorder(true);
          }}
          className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center shadow-xl shadow-indigo-500/40 text-white"
        >
          <Mic size={24} />
        </button>
        <button 
          onClick={() => {
            setRecordingType('video');
            setShowRecorder(true);
          }}
          className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-xl shadow-white/20"
        >
          <Video size={24} />
        </button>
      </div>
    </div>
  );
}
