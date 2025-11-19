import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { Task, SyncPayload } from '../types';
import storageService from './storageService';

// Simulated API base URL - replace with actual backend when available
const API_BASE_URL = 'https://api.taskbuilder.app';

class SyncService {
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;
  private listeners: ((isOnline: boolean) => void)[] = [];

  constructor() {
    this.initializeNetworkListener();
  }

  // Initialize network state listener
  private initializeNetworkListener(): void {
    NetInfo.addEventListener((state: NetInfoState) => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;

      // Notify listeners of network state change
      this.listeners.forEach(listener => listener(this.isOnline));

      // Auto-sync when coming back online
      if (!wasOnline && this.isOnline) {
        this.syncData();
      }
    });
  }

  // Check current network status
  async checkNetworkStatus(): Promise<boolean> {
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected ?? false;
    return this.isOnline;
  }

  // Subscribe to network changes
  addNetworkListener(listener: (isOnline: boolean) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Get online status
  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  // Main sync function
  async syncData(): Promise<{ success: boolean; message: string }> {
    if (this.syncInProgress) {
      return { success: false, message: 'Sync already in progress' };
    }

    if (!this.isOnline) {
      return { success: false, message: 'No internet connection' };
    }

    this.syncInProgress = true;

    try {
      // Get pending changes
      const pendingSync = await storageService.getPendingSync();

      if (pendingSync.length === 0) {
        // No local changes, fetch from server
        await this.fetchFromServer();
        return { success: true, message: 'Synced from server' };
      }

      // Get local tasks
      const localTasks = await storageService.getAllTasks();
      const deviceId = await storageService.getDeviceId();

      // Prepare sync payload
      const payload: SyncPayload = {
        tasks: localTasks,
        lastSyncTime: await storageService.getLastSyncTime() || new Date(0).toISOString(),
        deviceId,
      };

      // Send to server (simulated)
      const result = await this.pushToServer(payload);

      if (result.success) {
        // Update local storage with server response
        if (result.tasks) {
          await storageService.saveTasks(result.tasks);
        }

        // Clear pending sync queue
        await storageService.clearPendingSync();

        // Update last sync time
        await storageService.setLastSyncTime(new Date().toISOString());

        return { success: true, message: 'Sync completed successfully' };
      } else {
        return { success: false, message: result.error || 'Sync failed' };
      }
    } catch (error) {
      console.error('Sync error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown sync error'
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  // Fetch data from server
  private async fetchFromServer(): Promise<void> {
    try {
      // Simulated API call - replace with actual fetch when backend is available
      // const response = await fetch(`${API_BASE_URL}/tasks`);
      // const serverTasks = await response.json();

      // For now, we'll just update the last sync time
      // In production, this would merge server data with local data
      await storageService.setLastSyncTime(new Date().toISOString());
    } catch (error) {
      console.error('Error fetching from server:', error);
      throw error;
    }
  }

  // Push data to server
  private async pushToServer(payload: SyncPayload): Promise<{
    success: boolean;
    tasks?: Task[];
    error?: string;
  }> {
    try {
      // Simulated API call - replace with actual fetch when backend is available
      /*
      const response = await fetch(`${API_BASE_URL}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
      */

      // Simulated successful response
      // In production, this would return merged tasks from the server
      return {
        success: true,
        tasks: payload.tasks.map(task => ({
          ...task,
          syncStatus: 'synced' as const,
        })),
      };
    } catch (error) {
      console.error('Error pushing to server:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Push failed',
      };
    }
  }

  // Resolve sync conflicts
  async resolveConflict(
    taskId: string,
    resolution: 'local' | 'server'
  ): Promise<void> {
    const localTasks = await storageService.getAllTasks();
    const taskIndex = localTasks.findIndex(t => t.id === taskId);

    if (taskIndex === -1) return;

    if (resolution === 'local') {
      // Mark local version as the winner
      localTasks[taskIndex].syncStatus = 'pending_sync';
      await storageService.saveTasks(localTasks);
      await this.syncData();
    } else {
      // Fetch server version (simulated)
      // In production, this would fetch the specific task from server
      localTasks[taskIndex].syncStatus = 'synced';
      await storageService.saveTasks(localTasks);
    }
  }

  // Force full sync
  async forceFullSync(): Promise<{ success: boolean; message: string }> {
    await storageService.clearPendingSync();
    return this.syncData();
  }

  // Get sync status
  async getSyncStatus(): Promise<{
    lastSync: string | null;
    pendingChanges: number;
    isOnline: boolean;
  }> {
    const lastSync = await storageService.getLastSyncTime();
    const pendingSync = await storageService.getPendingSync();

    return {
      lastSync,
      pendingChanges: pendingSync.length,
      isOnline: this.isOnline,
    };
  }
}

export const syncService = new SyncService();
export default syncService;
