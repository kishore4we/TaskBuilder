import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { Task, NotificationData, NotificationType } from '../types';
import storageService from './storageService';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private expoPushToken: string | null = null;

  // Initialize notifications and get permissions
  async initialize(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push notification permissions');
      return false;
    }

    // Get Expo push token for remote notifications
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'taskbuilder-app',
      });
      this.expoPushToken = tokenData.data;
    } catch (error) {
      console.log('Error getting push token:', error);
    }

    // Configure Android channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4A90E2',
      });

      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Task Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4A90E2',
      });

      await Notifications.setNotificationChannelAsync('motivation', {
        name: 'Motivational Quotes',
        importance: Notifications.AndroidImportance.DEFAULT,
        lightColor: '#4A90E2',
      });
    }

    return true;
  }

  // Schedule a notification for a task
  async scheduleTaskReminder(task: Task): Promise<string | null> {
    if (!task.reminderTime) return null;

    const settings = await storageService.getSettings();
    if (!settings.notificationsEnabled) return null;

    const reminderDate = new Date(task.reminderTime);
    if (reminderDate <= new Date()) return null;

    try {
      // Cancel existing notification if any
      if (task.notificationId) {
        await this.cancelNotification(task.notificationId);
      }

      const notificationData: NotificationData = {
        type: 'task_reminder',
        taskId: task.id,
        title: 'Task Reminder',
        body: task.title,
      };

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationData.title,
          body: notificationData.body,
          data: notificationData,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderDate,
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  // Schedule overdue notification
  async scheduleOverdueNotification(task: Task): Promise<string | null> {
    const dueDate = new Date(task.dueDate);
    if (dueDate <= new Date()) return null;

    try {
      const notificationData: NotificationData = {
        type: 'task_overdue',
        taskId: task.id,
        title: 'Task Overdue!',
        body: `"${task.title}" is past its due date. Time to get it done!`,
      };

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationData.title,
          body: notificationData.body,
          data: notificationData,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: dueDate,
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling overdue notification:', error);
      return null;
    }
  }

  // Send immediate motivation notification
  async sendMotivationalNotification(quote: string, author: string): Promise<void> {
    const settings = await storageService.getSettings();
    if (!settings.motivationalQuotesEnabled) return;

    const notificationData: NotificationData = {
      type: 'motivation',
      title: 'Stay Motivated!',
      body: `"${quote}" - ${author}`,
    };

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationData.title,
          body: notificationData.body,
          data: notificationData,
          sound: false,
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending motivation notification:', error);
    }
  }

  // Send encouragement notification for completed task
  async sendEncouragementNotification(taskTitle: string): Promise<void> {
    const encouragements = [
      'Great job completing your task!',
      'You\'re on fire! Keep it up!',
      'Another one done! You\'re crushing it!',
      'Excellent work! You\'re making progress!',
      'Task completed! You\'re unstoppable!',
    ];

    const randomEncouragement =
      encouragements[Math.floor(Math.random() * encouragements.length)];

    const notificationData: NotificationData = {
      type: 'encouragement',
      title: 'Task Completed!',
      body: `${randomEncouragement} "${taskTitle}"`,
    };

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationData.title,
          body: notificationData.body,
          data: notificationData,
          sound: true,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error sending encouragement notification:', error);
    }
  }

  // Schedule daily summary notification
  async scheduleDailySummary(): Promise<void> {
    const settings = await storageService.getSettings();
    if (!settings.notificationsEnabled) return;

    const [hours, minutes] = settings.dailySummaryTime.split(':').map(Number);

    try {
      // Cancel existing daily summary
      await this.cancelDailySummary();

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Daily Task Summary',
          body: 'Check your tasks for today!',
          data: { type: 'daily_summary' as NotificationType },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hours,
          minute: minutes,
        },
      });
    } catch (error) {
      console.error('Error scheduling daily summary:', error);
    }
  }

  // Cancel a specific notification
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  }

  // Cancel daily summary
  async cancelDailySummary(): Promise<void> {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      const data = notification.content.data as NotificationData;
      if (data?.type === 'daily_summary') {
        await this.cancelNotification(notification.identifier);
      }
    }
  }

  // Cancel all notifications for a task
  async cancelTaskNotifications(taskId: string): Promise<void> {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      const data = notification.content.data as NotificationData;
      if (data?.taskId === taskId) {
        await this.cancelNotification(notification.identifier);
      }
    }
  }

  // Cancel all notifications
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  }

  // Get all scheduled notifications
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return Notifications.getAllScheduledNotificationsAsync();
  }

  // Add notification response listener
  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.EventSubscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  // Add notification received listener
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.EventSubscription {
    return Notifications.addNotificationReceivedListener(callback);
  }

  // Get push token
  getPushToken(): string | null {
    return this.expoPushToken;
  }

  // Set badge count
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
