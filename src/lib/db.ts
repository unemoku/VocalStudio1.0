import Dexie, { Table } from 'dexie';

export interface AudioBlob {
  id: string;
  blob: Blob;
  mimeType: string;
  createdAt: number;
}

export class VocalStudioDB extends Dexie {
  blobs!: Table<AudioBlob>;

  constructor() {
    super('VocalStudioDB');
    this.version(1).stores({
      blobs: 'id, createdAt'
    });
  }
}

export const db = new VocalStudioDB();

export const saveBlob = async (id: string, blob: Blob) => {
  await db.blobs.put({
    id,
    blob,
    mimeType: blob.type,
    createdAt: Date.now()
  });
};

export const getBlob = async (id: string) => {
  const record = await db.blobs.get(id);
  return record?.blob || null;
};

export const deleteBlob = async (id: string) => {
  await db.blobs.delete(id);
};
