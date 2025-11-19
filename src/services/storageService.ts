import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task, AppSettings, TaskStatistics } from '../types';

// Storage keys
const STORAGE_KEYS = {
  TASKS: '@taskbuilder_tasks',
  SETTINGS: '@taskbuilder_settings',
  LAST_SYNC: '@taskbuilder_last_sync',
  DEVICE_ID: '@taskbuilder_device_id',
  STATISTICS: '@taskbuilder_statistics',
  PENDING_SYNC: '@taskbuilder_pending_sync',
};

// Default app settings
const DEFAULT_SETTINGS: AppSettings = {
  notificationsEnabled: true,
  motivationalQuotesEnabled: true,
  dailySummaryTime: '09:00',
  theme: 'system',
  syncEnabled: true,
};

class StorageService {
  // Tasks operations
  async getAllTasks(): Promise<Task[]> {
    try {
      const tasksJson = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
      return tasksJson ? JSON.parse(tasksJson) : [];
    } catch (error) {
      console.error('Error getting tasks:', error);
      return [];
    }
  }

  async saveTasks(tasks: Task[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (error) {
      console.error('Error saving tasks:', error);
      throw error;
    }
  }

  async getTask(taskId: string): Promise<Task | null> {
    const tasks = await this.getAllTasks();
    return tasks.find(task => task.id === taskId) || null;
  }

  async addTask(task: Task): Promise<void> {
    const tasks = await this.getAllTasks();
    tasks.push(task);
    await this.saveTasks(tasks);
    await this.addToPendingSync(task.id, 'create');
  }

  async updateTask(updatedTask: Task): Promise<void> {
    const tasks = await this.getAllTasks();
    const index = tasks.findIndex(task => task.id === updatedTask.id);
    if (index !== -1) {
      tasks[index] = { ...updatedTask, updatedAt: new Date().toISOString() };
      await this.saveTasks(tasks);
      await this.addToPendingSync(updatedTask.id, 'update');
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    const tasks = await this.getAllTasks();
    const filteredTasks = tasks.filter(task => task.id !== taskId);
    await this.saveTasks(filteredTasks);
    await this.addToPendingSync(taskId, 'delete');
  }

  // Settings operations
  async getSettings(): Promise<AppSettings> {
    try {
      const settingsJson = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      return settingsJson ? JSON.parse(settingsJson) : DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Error getting settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  // Sync operations
  async getLastSyncTime(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    } catch (error) {
      console.error('Error getting last sync time:', error);
      return null;
    }
  }

  async setLastSyncTime(time: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, time);
    } catch (error) {
      console.error('Error setting last sync time:', error);
      throw error;
    }
  }

  // Device ID for sync identification
  async getDeviceId(): Promise<string> {
    try {
      let deviceId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
      if (!deviceId) {
        deviceId = this.generateDeviceId();
        await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
      }
      return deviceId;
    } catch (error) {
      console.error('Error getting device ID:', error);
      return this.generateDeviceId();
    }
  }

  private generateDeviceId(): string {
    return 'device_' + Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }

  // Pending sync queue
  async addToPendingSync(taskId: string, action: 'create' | 'update' | 'delete'): Promise<void> {
    try {
      const pendingJson = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_SYNC);
      const pending = pendingJson ? JSON.parse(pendingJson) : [];

      // Remove any existing entry for this task
      const filtered = pending.filter((item: any) => item.taskId !== taskId);
      filtered.push({ taskId, action, timestamp: new Date().toISOString() });

      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error adding to pending sync:', error);
    }
  }

  async getPendingSync(): Promise<Array<{ taskId: string; action: string; timestamp: string }>> {
    try {
      const pendingJson = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_SYNC);
      return pendingJson ? JSON.parse(pendingJson) : [];
    } catch (error) {
      console.error('Error getting pending sync:', error);
      return [];
    }
  }

  async clearPendingSync(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify([]));
    } catch (error) {
      console.error('Error clearing pending sync:', error);
    }
  }

  // Statistics
  async getStatistics(): Promise<TaskStatistics> {
    const tasks = await this.getAllTasks();
    const now = new Date();

    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const pendingTasks = tasks.filter(task =>
      task.status === 'pending' || task.status === 'in_progress'
    ).length;
    const overdueTasks = tasks.filter(task => {
      if (task.status === 'completed') return false;
      return new Date(task.dueDate) < now;
    }).length;

    const completionRate = tasks.length > 0
      ? Math.round((completedTasks / tasks.length) * 100)
      : 0;

    // Calculate streak (consecutive days with completed tasks)
    const streakDays = this.calculateStreak(tasks);

    return {
      totalTasks: tasks.length,
      completedTasks,
      pendingTasks,
      overdueTasks,
      completionRate,
      streakDays,
    };
  }

  private calculateStreak(tasks: Task[]): number {
    const completedTasks = tasks
      .filter(task => task.completedAt)
      .map(task => new Date(task.completedAt!).toDateString())
      .filter((date, index, self) => self.indexOf(date) === index)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (completedTasks.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const dateStr of completedTasks) {
      const taskDate = new Date(dateStr);
      taskDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor(
        (currentDate.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === streak) {
        streak++;
      } else if (diffDays > streak) {
        break;
      }
    }

    return streak;
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }
}

export const storageService = new StorageService();
export default storageService;
