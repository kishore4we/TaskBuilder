import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTaskContext } from '../context/TaskContext';
import { Task, TaskStatus, TaskPriority } from '../types';
import { quotesService } from '../services/quotesService';

interface TaskListScreenProps {
  navigation: any;
}

const TaskListScreen: React.FC<TaskListScreenProps> = ({ navigation }) => {
  const { tasks, statistics, isOnline, isLoading, completeTask, deleteTask, refreshTasks } =
    useTaskContext();
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    if (filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === filterStatus);
    }

    // Sort by due date and priority
    return filtered.sort((a, b) => {
      // Completed tasks go to bottom
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;

      // Sort by due date
      const dateA = new Date(a.dueDate).getTime();
      const dateB = new Date(b.dueDate).getTime();
      return dateA - dateB;
    });
  }, [tasks, filterStatus]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshTasks();
    setRefreshing(false);
  };

  const handleCompleteTask = async (task: Task) => {
    if (task.status === 'completed') return;

    await completeTask(task.id);

    // Show encouragement
    const quote = quotesService.getRandomEncouragementQuote();
    Alert.alert('Great Job!', quote.text);
  };

  const handleDeleteTask = (task: Task) => {
    Alert.alert(
      'Delete Task',
      `Are you sure you want to delete "${task.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTask(task.id),
        },
      ]
    );
  };

  const getPriorityColor = (priority: TaskPriority): string => {
    switch (priority) {
      case 'urgent':
        return '#FF3B30';
      case 'high':
        return '#FF9500';
      case 'medium':
        return '#FFCC00';
      case 'low':
        return '#34C759';
      default:
        return '#8E8E93';
    }
  };

  const getStatusIcon = (status: TaskStatus): string => {
    switch (status) {
      case 'completed':
        return 'checkmark-circle';
      case 'in_progress':
        return 'time';
      case 'overdue':
        return 'alert-circle';
      default:
        return 'ellipse-outline';
    }
  };

  const isOverdue = (task: Task): boolean => {
    if (task.status === 'completed') return false;
    return new Date(task.dueDate) < new Date();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const renderTaskItem = ({ item: task }: { item: Task }) => {
    const overdue = isOverdue(task);
    const completed = task.status === 'completed';

    return (
      <TouchableOpacity
        style={[
          styles.taskItem,
          completed && styles.taskItemCompleted,
          overdue && styles.taskItemOverdue,
        ]}
        onPress={() => navigation.navigate('TaskDetail', { taskId: task.id })}
        onLongPress={() => handleDeleteTask(task)}
      >
        <TouchableOpacity
          style={styles.statusButton}
          onPress={() => handleCompleteTask(task)}
        >
          <Ionicons
            name={getStatusIcon(completed ? 'completed' : task.status)}
            size={24}
            color={completed ? '#34C759' : overdue ? '#FF3B30' : '#8E8E93'}
          />
        </TouchableOpacity>

        <View style={styles.taskContent}>
          <Text
            style={[styles.taskTitle, completed && styles.taskTitleCompleted]}
            numberOfLines={1}
          >
            {task.title}
          </Text>
          <View style={styles.taskMeta}>
            <View
              style={[
                styles.priorityBadge,
                { backgroundColor: getPriorityColor(task.priority) },
              ]}
            >
              <Text style={styles.priorityText}>{task.priority}</Text>
            </View>
            <Text style={[styles.dueDate, overdue && styles.dueDateOverdue]}>
              {formatDate(task.dueDate)}
            </Text>
            {task.subtasks.length > 0 && (
              <Text style={styles.subtaskCount}>
                {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
              </Text>
            )}
          </View>
        </View>

        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Statistics Card */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{statistics.totalTasks}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#34C759' }]}>
            {statistics.completedTasks}
          </Text>
          <Text style={styles.statLabel}>Done</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#FF9500' }]}>
            {statistics.pendingTasks}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#007AFF' }]}>
            {statistics.streakDays}
          </Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {(['all', 'pending', 'in_progress', 'completed'] as const).map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterTab,
              filterStatus === status && styles.filterTabActive,
            ]}
            onPress={() => setFilterStatus(status)}
          >
            <Text
              style={[
                styles.filterTabText,
                filterStatus === status && styles.filterTabTextActive,
              ]}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Motivational Quote for empty or overdue tasks */}
      {(filteredTasks.length === 0 || statistics.overdueTasks > 0) && (
        <View style={styles.quoteCard}>
          <Ionicons name="bulb" size={20} color="#FF9500" />
          <Text style={styles.quoteText}>
            {filteredTasks.length === 0
              ? 'No tasks yet. Tap + to create your first task!'
              : quotesService.getIncompleteTaskMotivation().text}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Online/Offline indicator */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={16} color="#fff" />
          <Text style={styles.offlineText}>Offline - Changes will sync when online</Text>
        </View>
      )}

      <FlatList
        data={filteredTasks}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="clipboard-outline" size={64} color="#C7C7CC" />
            <Text style={styles.emptyStateText}>No tasks found</Text>
          </View>
        }
      />

      {/* Add Task Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('CreateTask')}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  offlineBanner: {
    backgroundColor: '#FF9500',
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 100,
  },
  header: {
    padding: 16,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  filterTabActive: {
    backgroundColor: '#007AFF',
  },
  filterTabText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  quoteCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  quoteText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#8B6914',
    fontStyle: 'italic',
  },
  taskItem: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  taskItemCompleted: {
    opacity: 0.6,
  },
  taskItemOverdue: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  statusButton: {
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  priorityText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dueDate: {
    fontSize: 12,
    color: '#8E8E93',
    marginRight: 8,
  },
  dueDateOverdue: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  subtaskCount: {
    fontSize: 12,
    color: '#007AFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});

export default TaskListScreen;
