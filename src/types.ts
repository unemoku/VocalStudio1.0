export interface UserProfile {
  name: string;
  bio: string;
  avatarUrl: string;
  bannerUrl: string;
}

export interface Work {
  id: string;
  title: string;
  songCategory: string;
  fileUrl: string;
  vocalUrl?: string;
  backingUrl?: string;
  vocalVolume?: number;
  backingVolume?: number;
  mediaType: 'audio' | 'video';
  isFeatured: boolean;
  createdAt: number;
  duration?: number;
}

export interface RecordingState {
  isRecording: boolean;
  duration: number;
  stream: MediaStream | null;
}
