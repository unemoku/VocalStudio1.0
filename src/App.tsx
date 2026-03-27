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
import { motion, AnimatePresence } from 'framer-motion';
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
        if (id.length > 30 && !id.includes(':')) {
          const blob = await getBlob(id);
          if (blob) {
            currentUrl = URL.createObjectURL(blob);
            setUrl(currentUrl);
          }
        } else {
          setUrl(id);
        }
      } catch (err) {
        setUrl(null);
      }
    };
    load();
    return () => { if (currentUrl) URL.revokeObjectURL(currentUrl); };
  }, [id]);
  return url;
};

// --- Components ---

const ProfileSettings = ({ profile, onUpdate, onClose, lang }: any) => {
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio);
  const [avatar, setAvatar] = useState(profile.avatarUrl);
  const [banner, setBanner] = useState(profile.bannerUrl);
  const t = translations[lang as Language];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="glass max-w-xl w-full rounded-[40px] overflow-hidden p-10">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">{t.profileSettings}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={24} /></button>
        </div>
        <div className="space-y-6">
          <div className="flex gap-6 items-center">
            <div className="w-24 h-24 rounded-3xl bg-indigo-600 overflow-hidden shrink-0">
              {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : <Mic size={40} className="m-auto mt-6 text-white/20" />}
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-mono uppercase text-white/40">{t.avatarUrl}</label>
              <input value={avatar} onChange={(e) => setAvatar(e.target.value)} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-mono uppercase text-white/40">{t.displayName}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white" />
          </div>
          <button onClick={() => { onUpdate({ name, bio, avatarUrl: avatar, bannerUrl: banner }); onClose(); }} className="w-full py-4 bg-indigo-600 rounded-2xl font-bold">{t.save}</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const CategoryFolder = ({ category, works, onDelete, onToggleFeatured, onUpdate, onExtractAudio, onUseAsBacking, lang }: any) => {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <div className="mb-6">
      <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex items-center justify-between p-4 glass rounded-2xl hover:bg-white/10 transition-all">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400"><Music size={24} /></div>
          <div className="text-left">
            <h3 className="font-bold text-lg text-white">{category}</h3>
            <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">{works.length} {lang === 'zh' ? '个版本' : 'Versions'}</p>
          </div>
        </div>
        <ChevronRight size={20} className={cn("text-white/40 transition-transform", isExpanded && "rotate-90")} />
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 ml-6 border-l-2 border-white/5 pl-4">
            {works.map((work: any) => (
              <WorkCard key={work.id} work={work} onDelete={onDelete} onToggleFeatured={onToggleFeatured} onUpdate={onUpdate} onExtractAudio={onExtractAudio} onUseAsBacking={onUseAsBacking} lang={lang} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 【修复版】解决黑屏与卡顿
const AudioVisualizer = ({ url, className, lang, mediaRef }: any) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const t = translations[lang as Language];

  useEffect(() => {
    if (!containerRef.current || !url) return;
    let isDestroyed = false;
    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#4f46e5',
      progressColor: '#818cf8',
      height: 60,
      barWidth: 2,
      normalize: true,
      backend: 'MediaElement',
      media: mediaRef?.current || undefined,
    });
// 监听事件
    ws.on('ready', () => {
      if (!isDestroyed) {
        setIsLoading(false);
        // 同步初始状态
        if (vocalWsRef.current) vocalWsRef.current.setVolume(vocalVolume);
        if (backingWsRef.current) backingWsRef.current.setVolume(backingVolume);
      }
    });

    ws.on('play', () => {
      setIsPlaying(true);
      // 【关键同步】
      vocalWsRef.current?.play();
      backingWsRef.current?.play();
    });

    ws.on('pause', () => {
      setIsPlaying(false);
      // 【关键同步】
      vocalWsRef.current?.pause();
      backingWsRef.current?.pause();
    });

    ws.on('seeking', (time) => {
      // 【关键同步】拖动进度条时，分轨也要跟着跳
      vocalWsRef.current?.setTime(time);
      backingWsRef.current?.setTime(time);
    });

    ws.load(url).catch(e => console.warn("WaveSurfer load error:", e));
    wavesurferRef.current = ws;

    // --- 彻底的清理逻辑 ---
    return () => {
      isDestroyed = true;
      
      // 1. 清理主轨道
      if (wavesurferRef.current) {
        try {
          wavesurferRef.current.unAll(); 
          wavesurferRef.current.destroy();
        } catch (e) {}
        wavesurferRef.current = null;
      }

      // 2. 清理分轨（这是防止黑屏的关键）
      if (vocalWsRef.current) {
        try { vocalWsRef.current.destroy(); } catch (e) {}
        vocalWsRef.current = null;
      }
      if (backingWsRef.current) {
        try { backingWsRef.current.destroy(); } catch (e) {}
        backingWsRef.current = null;
      }

      // 3. 彻底清空 DOM 容器
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [url, vocalUrl, backingUrl, vocalVolume, backingVolume]); // 别忘了补全这些依赖项

  return (
    <div className={cn("flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10", className)}>
      <button 
        onClick={() => {
          // 点击播放/暂停时，我们要确保所有轨道同步动作
          if (wavesurferRef.current) {
            wavesurferRef.current.playPause();
          }
        }} 
        className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center shrink-0 hover:bg-indigo-500 transition-colors"
      >
        {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1" />}
      </button>
      <div ref={containerRef} className="flex-1 min-w-0" />
    </div>
  );

const WorkCard = ({ work, onDelete, onToggleFeatured, onUpdate, lang }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(work.title);
  const t = translations[lang as Language];
  const videoRef = useRef<HTMLVideoElement>(null);
  const mainUrl = useBlobUrl(work.fileUrl);

  return (
    <motion.div layout className="glass rounded-2xl p-5 relative group">
      <div className="flex justify-between mb-4">
        <div>
          <span className="text-[10px] font-mono text-indigo-400 uppercase">{work.songCategory}</span>
          {isEditing ? <input value={title} onChange={(e)=>setTitle(e.target.value)} onBlur={()=>{onUpdate(work.id, {title}); setIsEditing(false)}} className="bg-transparent text-white border-b border-white/20 outline-none" autoFocus /> : <h3 onClick={()=>setIsEditing(true)} className="text-lg font-semibold text-white cursor-pointer">{work.title}</h3>}
        </div>
        <div className="flex gap-2">
          <button onClick={() => onToggleFeatured(work.id)} className={cn("text-white/40", work.isFeatured && "text-yellow-400")}><Star size={16} fill={work.isFeatured ? "currentColor" : "none"} /></button>
          <button onClick={() => onDelete(work.id)} className="text-white/40 hover:text-red-400"><Trash2 size={16} /></button>
        </div>
      </div>
      {work.mediaType === 'video' && <video ref={videoRef} src={mainUrl || work.fileUrl} controls className="w-full aspect-video rounded-xl bg-black mb-4" />}
      <AudioVisualizer url={mainUrl || work.fileUrl} lang={lang} mediaRef={work.mediaType === 'video' ? videoRef : undefined} className={work.mediaType === 'video' ? "hidden" : ""} />
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [works, setWorks] = useState<Work[]>([]);
  const [view, setView] = useState<'studio' | 'public'>('studio');
  const [profile, setProfile] = useState<UserProfile>({ name: "Artist Name", bio: "Singer journey", avatarUrl: "", bannerUrl: "" });
  const [recordingType, setRecordingType] = useState<'audio' | 'video'>('audio');
  const [showRecorder, setShowRecorder] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [language, setLanguage] = useState<Language>('zh');
  const [searchQuery, setSearchQuery] = useState("");
  const studio = useStudioEngine();
  const t = translations[language];
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

 // 【最终修复版】麦克风与视频流统一管理
  const startRecording = async () => {
    try {
      // 1. 启动录音引擎
      await studio.startRecording(recordingType);
      
      // 2. 如果是视频模式，尝试获取流并显示在预览框
      // 我们直接再次获取流是最高效的，但要确保 studio 内部已经处理好权限
      if (recordingType === 'video' && videoPreviewRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        videoPreviewRef.current.srcObject = stream;
      }
    } catch (err) { 
      console.error("Recording start error:", err);
      toast.error(language === 'zh' ? "麦克风或摄像头启动失败，请检查权限" : "Failed to start media devices"); 
    }
  };

  const stopRecording = async () => {
    const loadingId = toast.loading(t.finalizingRecording);
    
    // 1. 停止预览流（关掉摄像头绿灯）
    if (videoPreviewRef.current && videoPreviewRef.current.srcObject) {
      const stream = videoPreviewRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoPreviewRef.current.srcObject = null;
    }

    const result = await studio.stopRecording();
    
    if (result) {
      const { mixed, vocal } = result;
      const workId = crypto.randomUUID();
      const vocalId = `vocal-${workId}`;
      
      // 2. 持久化存储到 IndexedDB
      await saveBlob(workId, mixed);
      await saveBlob(vocalId, vocal);
      
      const newWork: Work = { 
        id: workId, 
        title: `${t.studioSession} ${new Date().toLocaleDateString()}`, 
        songCategory: t.studioSessions, 
        fileUrl: workId, 
        vocalUrl: vocalId, 
        backingUrl: backingTrackUrl || undefined,
        vocalVolume: studio.micVolume,
        backingVolume: studio.backingTrackVolume,
        mediaType: recordingType, 
        isFeatured: false, 
        createdAt: Date.now() 
      };
      
      setWorks(prev => [newWork, ...prev]);
      toast.success(t.recordingSaved, { id: loadingId });
    } else {
      toast.dismiss(loadingId);
    }
    
    setShowRecorder(false);
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      const loadingId = toast.loading(language === 'zh' ? `正在导入 ${file.name}...` : `Importing ${file.name}...`);
      try {
        const id = crypto.randomUUID();
        // 关键：手机端持久化存储
        await saveBlob(id, file);
        
        const newWork: Work = { 
          id, 
          title: file.name.split('.')[0], 
          songCategory: "Imported", 
          fileUrl: id, 
          mediaType: file.type.startsWith('video/') ? 'video' : 'audio', 
          isFeatured: false, 
          createdAt: Date.now() 
        };
        
        setWorks(prev => [newWork, ...prev]);
        toast.success(language === 'zh' ? "导入成功" : "Import successful", { id: loadingId });
      } catch (err) {
        toast.error(language === 'zh' ? "导入失败" : "Import failed", { id: loadingId });
      }
    }
  }, [language]);

  
  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  useEffect(() => {
    const w = localStorage.getItem('vocal-studio-works');
    if (w) setWorks(JSON.parse(w));
    const p = localStorage.getItem('vocal-studio-profile');
    if (p) setProfile(JSON.parse(p));
  }, []);

  useEffect(() => { localStorage.setItem('vocal-studio-works', JSON.stringify(works)); }, [works]);
  useEffect(() => { localStorage.setItem('vocal-studio-profile', JSON.stringify(profile)); }, [profile]);

  if (view === 'public') return <PublicProfile profile={profile} featuredWorks={works.filter(w => w.isFeatured)} onBack={() => setView('studio')} onEdit={() => { setView('studio'); setShowSettings(true); }} lang={language} />;

  const grouped = works.filter(w => w.title.toLowerCase().includes(searchQuery.toLowerCase())).reduce((acc: any, work) => {
    const cat = work.songCategory || "Uncategorized";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(work);
    return acc;
  }, {});

  return (
    <div className="min-h-screen studio-grid pb-20 text-white bg-black">
      <Toaster position="top-center" theme="dark" />
      
      <header className="sticky top-0 z-40 glass px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3"><div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center"><Mic size={24} /></div><h1 className="text-xl font-bold">Vocal Studio</h1></div>
        <div className="flex gap-4 items-center">
          <input type="text" placeholder={t.searchWorks} className="hidden md:block bg-white/5 rounded-full px-4 py-2 outline-none text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          <button onClick={() => setView('public')} className="px-4 py-2 glass rounded-full text-xs font-bold uppercase">{t.viewPublic}</button>
          <button onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')} className="text-xs opacity-60">{language === 'zh' ? 'EN' : '中文'}</button>
          <button onClick={() => setShowSettings(true)}><Settings size={20} className="text-white/60" /></button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="glass p-6 rounded-3xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400"><History size={24} /></div>
            <div><div className="text-2xl font-bold">{works.length}</div><div className="text-xs text-white/40 uppercase">{t.totalSessions}</div></div>
          </div>
          <div className="glass p-6 rounded-3xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-400"><Star size={24} /></div>
            <div><div className="text-2xl font-bold">{works.filter(w=>w.isFeatured).length}</div><div className="text-xs text-white/40 uppercase">{t.featuredWorks}</div></div>
          </div>
          <div className="glass p-6 rounded-3xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-400"><LayoutGrid size={24} /></div>
            <div><div className="text-2xl font-bold">{Object.keys(grouped).length}</div><div className="text-xs text-white/40 uppercase">{t.categories}</div></div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-semibold">{t.yourLibrary}</h2>
          <div className="flex gap-3">
            <button onClick={() => { setRecordingType('audio'); setShowRecorder(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 rounded-full font-medium"><Mic size={18} /> {t.recordVocal}</button>
            <button onClick={() => { setRecordingType('video'); setShowRecorder(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-white/10 rounded-full border border-white/10"><Video size={18} /> {t.recordVideo}</button>
          </div>
        </div>

        {works.length === 0 && (
          <div {...getRootProps()} className="border-2 border-dashed border-white/10 rounded-3xl p-20 text-center cursor-pointer hover:bg-white/5 transition-all">
            <input {...getInputProps()} /><Upload className="mx-auto mb-6 text-white/20" size={40} /><p className="text-white/40">{t.startRecordingPrompt}</p>
          </div>
        )}

        <div className="space-y-4">
          {Object.entries(grouped).map(([category, catWorks]: any) => (
            <CategoryFolder key={category} category={category} works={catWorks} onDelete={(id:any)=>setWorks(prev=>prev.filter(w=>w.id!==id))} onToggleFeatured={(id:any)=>setWorks(prev=>prev.map(w=>w.id===id?{...w,isFeatured:!w.isFeatured}:w))} onUpdate={(id:any,u:any)=>setWorks(prev=>prev.map(w=>w.id===id?{...w,...u}:w))} lang={language} />
          ))}
        </div>
      </main>

      {showRecorder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
          <div className="glass max-w-2xl w-full rounded-[40px] p-10 flex flex-col items-center relative">
            <button onClick={() => setShowRecorder(false)} className="absolute top-8 right-8 text-white/40 hover:text-white"><X size={24} /></button>
            <div className="text-5xl font-mono mb-10 text-white font-light">{Math.floor(studio.recordingTime/60)}:{String(studio.recordingTime%60).padStart(2,'0')}</div>
            <div className="w-full aspect-video bg-black/40 rounded-[32px] mb-10 overflow-hidden flex items-center justify-center border border-white/5">
              {recordingType === 'video' ? <video ref={videoPreviewRef} autoPlay muted playsInline className="w-full h-full object-cover" /> : <div className="animate-pulse text-indigo-400 font-mono tracking-widest uppercase text-xs">Recording Audio...</div>}
            </div>
            {!studio.isRecording ? (
              <button onClick={startRecording} className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center shadow-xl shadow-red-500/40 hover:scale-105 transition-transform"><div className="w-8 h-8 bg-white rounded-full" /></button>
            ) : (
              <button onClick={stopRecording} className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl shadow-white/20 hover:scale-105 transition-transform"><Square size={32} className="text-black fill-black" /></button>
            )}
            <p className="mt-8 text-white/40 text-sm">{studio.isRecording ? t.stopRecordingPrompt : t.startRecordingPrompt}</p>
          </div>
        </div>
      )}

      {showSettings && <ProfileSettings profile={profile} onUpdate={(u:any) => setProfile(p => ({ ...p, ...u }))} onClose={() => setShowSettings(false)} lang={language} />}
    </div>
  );
}
