import Dexie, { type Table } from 'dexie';

export interface VaultKeyRecord {
  id: 'backup-key';
  key: CryptoKey;
  saltHex: string;
  iterations: number;
  createdAt: string;
}

interface SnapshotRecord {
  id: 'pre-restore';
  json: string;
  createdAt: string;
}

class HadafCloudDatabase extends Dexie {
  keys!: Table<VaultKeyRecord, string>;
  snapshots!: Table<SnapshotRecord, string>;

  constructor() {
    super('HadafCloudDB');
    this.version(1).stores({ keys: 'id', snapshots: 'id' });
  }
}

// Separate database so the main KavoshLocalDB schema stays untouched.
export class CloudKeyVault {
  private readonly database = new HadafCloudDatabase();

  getKey(): Promise<VaultKeyRecord | undefined> {
    return this.database.keys.get('backup-key');
  }

  async saveKey(key: CryptoKey, saltHex: string, iterations: number): Promise<void> {
    await this.database.keys.put({
      id: 'backup-key',
      key,
      saltHex,
      iterations,
      createdAt: new Date().toISOString()
    });
  }

  clearKey(): Promise<void> {
    return this.database.keys.delete('backup-key');
  }

  async saveSnapshot(json: string): Promise<void> {
    await this.database.snapshots.put({
      id: 'pre-restore',
      json,
      createdAt: new Date().toISOString()
    });
  }

  async getSnapshot(): Promise<string | null> {
    const record = await this.database.snapshots.get('pre-restore');
    return record ? record.json : null;
  }

  clearSnapshot(): Promise<void> {
    return this.database.snapshots.delete('pre-restore');
  }
}
