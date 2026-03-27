import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { getBlob } from '../lib/db';

export interface StudioEngine {
  isReady: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  processingProgress: number;
  recordingTime: number;
  backingTrackBuffer: AudioBuffer | null;
  backingTrackVolume: number;
  micVolume: number;
  setBackingTrackVolume: (v: number) => void;
  setMicVolume: (v: number) => void;
  loadBackingTrack: (url: string) => Promise<void>;
  loadBackingTrackFromFile: (file: File) => Promise<void>;
  startRecording: (type: 'audio' | 'video') => Promise<void>;
  stopRecording: () => Promise<{ mixed: Blob; vocal: Blob } | null>;
}

export const useStudioEngine = (): StudioEngine => {
  const [isReady, setIsReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [backingTrackBuffer, setBackingTrackBuffer] = useState<AudioBuffer | null>(null);
  const [backingTrackVolume, setBackingTrackVolume] = useState(0.8);
  const [micVolume, setMicVolume] = useState(1.0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const backingTrackSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const backingTrackGainRef = useRef<GainNode | null>(null);
  const micGainRef = useRef<GainNode | null>(null);
  const destinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const micRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const micChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      destinationRef.current = audioContextRef.current.createMediaStreamDestination();
      
      backingTrackGainRef.current = audioContextRef.current.createGain();
      micGainRef.current = audioContextRef.current.createGain();
      
      backingTrackGainRef.current.connect(destinationRef.current);
      micGainRef.current.connect(destinationRef.current);
      
      // Also connect to speakers for monitoring (optional, but good for user)
      backingTrackGainRef.current.connect(audioContextRef.current.destination);
      // Note: Connecting mic to speakers might cause feedback without headphones
      // micGainRef.current.connect(audioContextRef.current.destination);
      
      setIsReady(true);
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const abortControllerRef = useRef<AbortController | null>(null);

  const loadBackingTrack = async (url: string) => {
    // Abort previous load if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const ctx = initAudioContext();
    const loadingId = toast.loading("Loading backing track...");
    try {
      let arrayBuffer: ArrayBuffer;
      if (url.includes('/') || url.startsWith('http') || url.startsWith('blob:')) {
        const response = await fetch(url, { signal });
        arrayBuffer = await response.arrayBuffer();
      } else {
        // Try as UUID from IndexedDB
        const blob = await getBlob(url);
        if (!blob) throw new Error("Track not found in local storage");
        arrayBuffer = await blob.arrayBuffer();
      }
      
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      setBackingTrackBuffer(audioBuffer);
      toast.success("Backing track ready!", { id: loadingId });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        toast.dismiss(loadingId);
        return;
      }
      console.error("Failed to load backing track:", err);
      toast.error("Failed to load track. Ensure the URL is direct and CORS-enabled.", { id: loadingId });
    } finally {
      if (abortControllerRef.current?.signal === signal) {
        abortControllerRef.current = null;
      }
    }
  };

  const loadBackingTrackFromFile = async (file: File) => {
    const ctx = initAudioContext();
    const loadingId = toast.loading(`Parsing ${file.name}...`);
    
    try {
      // 手机端更稳妥的做法：先转为 Blob URL
      const fileUrl = URL.createObjectURL(file);
      
      // 如果是视频文件，尝试从视频中提取音频
      if (file.type.startsWith('video/')) {
         // 这里如果还报错，说明需要通过 AudioContext 直接处理，
         // 但通常 URL.createObjectURL + fetch 后的 arrayBuffer 在手机上更稳
      }
  
      const response = await fetch(fileUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      
      setBackingTrackBuffer(audioBuffer);
      URL.revokeObjectURL(fileUrl); // 释放内存
      toast.success("Ready!", { id: loadingId });
    } catch (err) {
      console.error("手机端解码失败:", err);
      toast.error("手机暂不支持该格式，请尝试 MP3", { id: loadingId });
    }
  };

    const startRecording = async (type: 'audio' | 'video') => {
    // 1. 确保 AudioContext 处于运行状态（这是麦克风成功的关键）
    const ctx = initAudioContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    chunksRef.current = [];
    micChunksRef.current = [];
    setIsProcessing(false);
    setProcessingProgress(0);

    try {
      // 2. 最简单的流请求，减少报错概率
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: type === 'video'
      });

      // 3. 【核心修复】立即锁定流引用，防止被回收
      streamRef.current = stream;

      // 4. 绑定麦克风到引擎
      if (!micGainRef.current) {
        micGainRef.current = ctx.createGain();
        micGainRef.current.connect(destinationRef.current!);
      }
      
      micSourceRef.current = ctx.createMediaStreamSource(stream);
      micSourceRef.current.connect(micGainRef.current);

      // 5. 设置录制参数
      let finalStream = destinationRef.current!.stream;
      if (type === 'video') {
        const videoTrack = stream.getVideoTracks()[0];
        // 合并音轨和视轨
        finalStream = new MediaStream([videoTrack, ...destinationRef.current!.stream.getAudioTracks()]);
      }

      const micStream = new MediaStream(stream.getAudioTracks());
      
      // 检查支持的格式
      const mimeType = type === 'video' ? 'video/webm;codecs=vp8,opus' : 'audio/webm;codecs=opus';
      const options = MediaRecorder.isTypeSupported(mimeType) ? { mimeType } : {};

      mediaRecorderRef.current = new MediaRecorder(finalStream, options);
      micRecorderRef.current = new MediaRecorder(micStream);
      
      mediaRecorderRef.current.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      micRecorderRef.current.ondataavailable = (e) => { if (e.data.size > 0) micChunksRef.current.push(e.data); };

      // 6. 播放伴奏（如果有）
      if (backingTrackBuffer) {
        if (backingTrackSourceRef.current) {
          try { backingTrackSourceRef.current.stop(); } catch(e) {}
        }
        backingTrackSourceRef.current = ctx.createBufferSource();
        backingTrackSourceRef.current.buffer = backingTrackBuffer;
        backingTrackSourceRef.current.connect(backingTrackGainRef.current!);
        backingTrackSourceRef.current.start(0);
      }

      // 7. 正式启动录制
      mediaRecorderRef.current.start(1000);
      micRecorderRef.current.start(1000);
      
      setIsRecording(true);
      setRecordingTime(0);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => setRecordingTime(prev => prev + 1), 1000);

    } catch (err) {
      console.error("Critical error in StudioEngine:", err);
      // 如果失败，确保清理掉已经打开的流
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      throw err; // 将错误抛给 App.tsx 的 toast
    }
  };

  const stopRecording = (): Promise<{ mixed: Blob; vocal: Blob } | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || !micRecorderRef.current || !isRecording) {
        resolve(null);
        return;
      }

      setIsProcessing(true);
      setProcessingProgress(10);

      const recorder = mediaRecorderRef.current;
      const micRecorder = micRecorderRef.current;
      const mimeType = recorder.mimeType;

      recorder.onstop = async () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        if (backingTrackSourceRef.current) {
          try { backingTrackSourceRef.current.stop(); } catch (e) {}
          backingTrackSourceRef.current = null;
        }
 
        const mixedBlob = new Blob(chunksRef.current, { type: mimeType });
        const vocalBlob = new Blob(micChunksRef.current, { type: micRecorder.mimeType });
        
        setProcessingProgress(100);

        if (mixedBlob.size < 500) {
          toast.error("Recording failed: No data captured.");
          setIsProcessing(false);
          resolve(null);
          return;
        }
        
        // Cleanup
        if (backingTrackSourceRef.current) {
          try { backingTrackSourceRef.current.stop(); } catch (e) {}
          backingTrackSourceRef.current = null;
        }
        if (micSourceRef.current) {
          micSourceRef.current.disconnect();
          micSourceRef.current = null;
        }
        if (timerRef.current) clearInterval(timerRef.current);
        
        setIsRecording(false);
        setTimeout(() => {
          setIsProcessing(false);
          resolve({ mixed: mixedBlob, vocal: vocalBlob });
        }, 300);
      };

      recorder.stop();
      micRecorder.stop();
    });
  };

  // Sync gain nodes with state
  useEffect(() => {
    if (backingTrackGainRef.current) {
      backingTrackGainRef.current.gain.setTargetAtTime(backingTrackVolume, audioContextRef.current!.currentTime, 0.1);
    }
  }, [backingTrackVolume]);

  useEffect(() => {
    if (micGainRef.current) {
      micGainRef.current.gain.setTargetAtTime(micVolume, audioContextRef.current!.currentTime, 0.1);
    }
  }, [micVolume]);

  return {
    isReady,
    isRecording,
    isProcessing,
    processingProgress,
    recordingTime,
    backingTrackBuffer,
    backingTrackVolume,
    micVolume,
    setBackingTrackVolume,
    setMicVolume,
    loadBackingTrack,
    loadBackingTrackFromFile,
    startRecording,
    stopRecording
  };
};
