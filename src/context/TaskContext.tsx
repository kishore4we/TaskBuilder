import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Task, TaskStatus, TaskPriority, Subtask, TaskStatistics, AppSettings } from '../types';
import storageService from '../services/storageService';
import notificationService from '../services/notificationService';
import syncService from '../services/syncService';
import quotesService from '../services/quotesService';

interface TaskContextType {
  tasks: Task[];
  statistics: TaskStatistics;
  settings: AppSettings;
  isOnline: boolean;
  isLoading: boolean;

  // Task operations
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'subtasks'>) => Promise<Task>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;

  // Subtask operations
  addSubtask: (taskId: string, title: string) => Promise<void>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  deleteSubtask: (taskId: string, subtaskId: string) => Promise<void>;

  // Settings
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;

  // Sync
  syncData: () => Promise<void>;

  // Refresh
  refreshTasks: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
};

interface TaskProviderProps {
  children: ReactNode;
}

export const TaskProvider: React.FC<TaskProviderProps> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statistics, setStatistics] = useState<TaskStatistics>({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    completionRate: 0,
    streakDays: 0,
  });
  const [settings, setSettings] = useState<AppSettings>({
    notificationsEnabled: true,
    motivationalQuotesEnabled: true,
    dailySummaryTime: '09:00',
    theme: 'system',
    syncEnabled: true,
  });
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize data on mount
  useEffect(() => {
    initializeApp();
  }, []);

  // Listen for network changes
  useEffect(() => {
    const unsubscribe = syncService.addNetworkListener((online) => {
      setIsOnline(online);
    });
    return unsubscribe;
  }, []);

  const initializeApp = async () => {
    setIsLoading(true);
    try {
      // Initialize notifications
      await notificationService.initialize();

      // Load data from storage
      const [loadedTasks, loadedSettings, loadedStats] = await Promise.all([
        storageService.getAllTasks(),
        storageService.getSettings(),
        storageService.getStatistics(),
      ]);

      setTasks(loadedTasks);
      setSettings(loadedSettings);
      setStatistics(loadedStats);

      // Check network status
      const online = await syncService.checkNetworkStatus();
      setIsOnline(online);

      // Schedule daily summary if enabled
      if (loadedSettings.notificationsEnabled) {
        await notificationService.scheduleDailySummary();
      }
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTasks = async () => {
    const [loadedTasks, loadedStats] = await Promise.all([
      storageService.getAllTasks(),
      storageService.getStatistics(),
    ]);
    setTasks(loadedTasks);
    setStatistics(loadedStats);
  };

  const addTask = async (
    taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'subtasks'>
  ): Promise<Task> => {
    const now = new Date().toISOString();
    const newTask: Task = {
      ...taskData,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending_sync',
      subtasks: [],
    };

    await storageService.addTask(newTask);

    // Schedule notification if reminder is set
    if (newTask.reminderTime) {
      const notificationId = await notificationService.scheduleTaskReminder(newTask);
      if (notificationId) {
        newTask.notificationId = notificationId;
        await storageService.updateTask(newTask);
      }
    }

    // Schedule overdue notification
    await notificationService.scheduleOverdueNotification(newTask);

    await refreshTasks();

    return newTask;
  };

  const updateTask = async (updatedTask: Task) => {
    await storageService.updateTask(updatedTask);

    // Reschedule notifications if needed
    if (updatedTask.reminderTime) {
      const notificationId = await notificationService.scheduleTaskReminder(updatedTask);
      if (notificationId) {
        updatedTask.notificationId = notificationId;
        await storageService.updateTask(updatedTask);
      }
    }

    await refreshTasks();
  };

  const deleteTask = async (taskId: string) => {
    // Cancel notifications
    await notificationService.cancelTaskNotifications(taskId);

    await storageService.deleteTask(taskId);
    await refreshTasks();
  };

  const completeTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const completedTask: Task = {
      ...task,
      status: 'completed',
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending_sync',
    };

    await storageService.updateTask(completedTask);

    // Cancel task notifications
    await notificationService.cancelTaskNotifications(taskId);

    // Send encouragement notification
    if (settings.notificationsEnabled) {
      await notificationService.sendEncouragementNotification(task.title);
    }

    // Check for milestones
    const newStats = await storageService.getStatistics();
    const milestone = quotesService.getCompletionMilestone(newStats.completedTasks);
    if (milestone && settings.motivationalQuotesEnabled) {
      const quote = quotesService.getRandomEncouragementQuote();
      await notificationService.sendMotivationalNotification(milestone, 'TaskBuilder');
    }

    await refreshTasks();
  };

  const addSubtask = async (taskId: string, title: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newSubtask: Subtask = {
      id: uuidv4(),
      title,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const updatedTask: Task = {
      ...task,
      subtasks: [...task.subtasks, newSubtask],
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending_sync',
    };

    await storageService.updateTask(updatedTask);
    await refreshTasks();
  };

  const toggleSubtask = async (taskId: string, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedSubtasks = task.subtasks.map(subtask => {
      if (subtask.id === subtaskId) {
        return {
          ...subtask,
          completed: !subtask.completed,
          completedAt: !subtask.completed ? new Date().toISOString() : undefined,
        };
      }
      return subtask;
    });

    const updatedTask: Task = {
      ...task,
      subtasks: updatedSubtasks,
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending_sync',
    };

    await storageService.updateTask(updatedTask);
    await refreshTasks();
  };

  const deleteSubtask = async (taskId: string, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedTask: Task = {
      ...task,
      subtasks: task.subtasks.filter(s => s.id !== subtaskId),
      updatedAt: new Date().toISOString(),
      syncStatus: 'pending_sync',
    };

    await storageService.updateTask(updatedTask);
    await refreshTasks();
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    await storageService.saveSettings(updatedSettings);
    setSettings(updatedSettings);

    // Update daily summary schedule
    if (newSettings.notificationsEnabled !== undefined || newSettings.dailySummaryTime) {
      if (updatedSettings.notificationsEnabled) {
        await notificationService.scheduleDailySummary();
      } else {
        await notificationService.cancelDailySummary();
      }
    }
  };

  const syncData = async () => {
    if (!isOnline) return;

    const result = await syncService.syncData();
    if (result.success) {
      await refreshTasks();
    }
  };

  const value: TaskContextType = {
    tasks,
    statistics,
    settings,
    isOnline,
    isLoading,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    updateSettings,
    syncData,
    refreshTasks,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

export default TaskContext;
