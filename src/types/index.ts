// Task priority levels
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

// Task status
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';

// Sync status for offline/online functionality
export type SyncStatus = 'synced' | 'pending_sync' | 'conflict';

// Main Task interface
export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string; // ISO date string
  reminderTime?: string; // ISO date string for notification
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  syncStatus: SyncStatus;
  notificationId?: string;
  tags: string[];
  subtasks: Subtask[];
}

// Subtask for todo list within a task
export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
}

// Motivational quote
export interface Quote {
  id: string;
  text: string;
  author: string;
  category: 'motivation' | 'encouragement' | 'productivity' | 'success';
}

// Notification types
export type NotificationType =
  | 'task_reminder'
  | 'task_overdue'
  | 'motivation'
  | 'encouragement'
  | 'daily_summary';

// Notification data
export interface NotificationData {
  type: NotificationType;
  taskId?: string;
  quoteId?: string;
  title: string;
  body: string;
}

// App settings
export interface AppSettings {
  notificationsEnabled: boolean;
  motivationalQuotesEnabled: boolean;
  dailySummaryTime: string; // HH:mm format
  theme: 'light' | 'dark' | 'system';
  syncEnabled: boolean;
}

// Sync data payload
export interface SyncPayload {
  tasks: Task[];
  lastSyncTime: string;
  deviceId: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Statistics for dashboard
export interface TaskStatistics {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
  streakDays: number;
}

// Filter options for task list
export interface TaskFilter {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  searchQuery?: string;
}

// Sort options
export type SortField = 'dueDate' | 'priority' | 'createdAt' | 'title';
export type SortOrder = 'asc' | 'desc';

export interface SortOptions {
  field: SortField;
  order: SortOrder;
}
