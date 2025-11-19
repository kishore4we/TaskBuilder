import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { TaskProvider, useTaskContext } from './src/context/TaskContext';
import AppNavigator from './src/navigation/AppNavigator';
import { notificationService } from './src/services/notificationService';
import { NotificationData } from './src/types';

// Loading screen component
const LoadingScreen: React.FC = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#007AFF" />
    <Text style={styles.loadingText}>Loading TaskBuilder...</Text>
  </View>
);

// Main app content with notification handling
const AppContent: React.FC = () => {
  const { isLoading, refreshTasks } = useTaskContext();

  useEffect(() => {
    // Handle notification responses (when user taps on notification)
    const responseSubscription = notificationService.addNotificationResponseListener(
      (response) => {
        const data = response.notification.request.content.data as NotificationData;

        if (data?.taskId) {
          // Navigate to task detail
          // Note: Navigation would be handled here with navigation ref
          console.log('Navigate to task:', data.taskId);
        }
      }
    );

    // Handle incoming notifications while app is open
    const notificationSubscription = notificationService.addNotificationReceivedListener(
      (notification) => {
        const data = notification.request.content.data as NotificationData;
        console.log('Notification received:', data);

        // Refresh tasks if it's a task-related notification
        if (data?.type === 'task_reminder' || data?.type === 'task_overdue') {
          refreshTasks();
        }
      }
    );

    return () => {
      responseSubscription.remove();
      notificationSubscription.remove();
    };
  }, [refreshTasks]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return <AppNavigator />;
};

// Root App component
const App: React.FC = () => {
  return (
    <GestureHandlerRootView style={styles.container}>
      <TaskProvider>
        <StatusBar style="auto" />
        <AppContent />
      </TaskProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
});

export default App;
