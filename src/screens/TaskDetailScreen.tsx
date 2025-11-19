import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTaskContext } from '../context/TaskContext';
import { Task, TaskPriority } from '../types';
import { quotesService } from '../services/quotesService';

interface TaskDetailScreenProps {
  route: any;
  navigation: any;
}

const TaskDetailScreen: React.FC<TaskDetailScreenProps> = ({ route, navigation }) => {
  const { taskId } = route.params;
  const {
    tasks,
    completeTask,
    deleteTask,
    updateTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
  } = useTaskContext();

  const [task, setTask] = useState<Task | null>(null);
  const [newSubtask, setNewSubtask] = useState('');
  const [showMotivation, setShowMotivation] = useState(false);

  useEffect(() => {
    const foundTask = tasks.find(t => t.id === taskId);
    setTask(foundTask || null);

    // Show motivation if task is overdue
    if (foundTask && foundTask.status !== 'completed') {
      const isOverdue = new Date(foundTask.dueDate) < new Date();
      setShowMotivation(isOverdue);
    }
  }, [tasks, taskId]);

  if (!task) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Task not found</Text>
      </View>
    );
  }

  const handleComplete = async () => {
    await completeTask(task.id);
    const quote = quotesService.getRandomEncouragementQuote();
    Alert.alert('Congratulations!', quote.text, [
      { text: 'Thanks!', onPress: () => navigation.goBack() },
    ]);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTask(task.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return;
    await addSubtask(task.id, newSubtask.trim());
    setNewSubtask('');
  };

  const handleToggleSubtask = async (subtaskId: string) => {
    await toggleSubtask(task.id, subtaskId);
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    Alert.alert('Delete Subtask', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteSubtask(task.id, subtaskId),
      },
    ]);
  };

  const getPriorityColor = (priority: TaskPriority): string => {
    switch (priority) {
      case 'urgent': return '#FF3B30';
      case 'high': return '#FF9500';
      case 'medium': return '#FFCC00';
      case 'low': return '#34C759';
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isOverdue = task.status !== 'completed' && new Date(task.dueDate) < new Date();
  const completedSubtasks = task.subtasks.filter(s => s.completed).length;
  const progress = task.subtasks.length > 0
    ? (completedSubtasks / task.subtasks.length) * 100
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Motivational Quote for overdue tasks */}
      {showMotivation && (
        <View style={styles.motivationCard}>
          <Ionicons name="flash" size={24} color="#FF9500" />
          <View style={styles.motivationContent}>
            <Text style={styles.motivationText}>
              {quotesService.getIncompleteTaskMotivation().text}
            </Text>
            <TouchableOpacity onPress={() => setShowMotivation(false)}>
              <Text style={styles.dismissText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Task Header */}
      <View style={styles.header}>
        <Text style={[styles.title, task.status === 'completed' && styles.titleCompleted]}>
          {task.title}
        </Text>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
          <Text style={styles.priorityText}>{task.priority}</Text>
        </View>
      </View>

      {/* Status */}
      <View style={styles.statusRow}>
        <View style={[
          styles.statusBadge,
          task.status === 'completed' && styles.statusCompleted,
          isOverdue && styles.statusOverdue,
        ]}>
          <Ionicons
            name={task.status === 'completed' ? 'checkmark-circle' : isOverdue ? 'alert-circle' : 'time'}
            size={16}
            color="#fff"
          />
          <Text style={styles.statusText}>
            {task.status === 'completed' ? 'Completed' : isOverdue ? 'Overdue' : task.status.replace('_', ' ')}
          </Text>
        </View>
      </View>

      {/* Description */}
      {task.description ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{task.description}</Text>
        </View>
      ) : null}

      {/* Due Date */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Due Date</Text>
        <View style={styles.dateRow}>
          <Ionicons name="calendar" size={20} color={isOverdue ? '#FF3B30' : '#007AFF'} />
          <Text style={[styles.dateText, isOverdue && styles.dateOverdue]}>
            {formatDate(task.dueDate)}
          </Text>
        </View>
      </View>

      {/* Tags */}
      {task.tags.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tagsContainer}>
            {task.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Subtasks / Todo List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Subtasks {task.subtasks.length > 0 && `(${completedSubtasks}/${task.subtasks.length})`}
        </Text>

        {/* Progress Bar */}
        {task.subtasks.length > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>
        )}

        {/* Subtask List */}
        {task.subtasks.map((subtask) => (
          <View key={subtask.id} style={styles.subtaskItem}>
            <TouchableOpacity
              style={styles.subtaskCheckbox}
              onPress={() => handleToggleSubtask(subtask.id)}
            >
              <Ionicons
                name={subtask.completed ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={subtask.completed ? '#34C759' : '#C7C7CC'}
              />
            </TouchableOpacity>
            <Text style={[
              styles.subtaskText,
              subtask.completed && styles.subtaskTextCompleted,
            ]}>
              {subtask.title}
            </Text>
            <TouchableOpacity
              style={styles.subtaskDelete}
              onPress={() => handleDeleteSubtask(subtask.id)}
            >
              <Ionicons name="trash-outline" size={18} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        ))}

        {/* Add Subtask */}
        <View style={styles.addSubtaskRow}>
          <TextInput
            style={styles.addSubtaskInput}
            placeholder="Add a subtask..."
            value={newSubtask}
            onChangeText={setNewSubtask}
            onSubmitEditing={handleAddSubtask}
          />
          <TouchableOpacity style={styles.addSubtaskButton} onPress={handleAddSubtask}>
            <Ionicons name="add" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {task.status !== 'completed' && (
          <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
            <Text style={styles.completeButtonText}>Mark Complete</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash" size={24} color="#FF3B30" />
          <Text style={styles.deleteButtonText}>Delete Task</Text>
        </TouchableOpacity>
      </View>

      {/* Completed Info */}
      {task.completedAt && (
        <View style={styles.completedInfo}>
          <Ionicons name="checkmark-done" size={16} color="#34C759" />
          <Text style={styles.completedText}>
            Completed on {formatDate(task.completedAt)}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 48,
  },
  motivationCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  motivationContent: {
    flex: 1,
    marginLeft: 12,
  },
  motivationText: {
    fontSize: 14,
    color: '#8B6914',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  dismissText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginRight: 12,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusRow: {
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusCompleted: {
    backgroundColor: '#34C759',
  },
  statusOverdue: {
    backgroundColor: '#FF3B30',
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
    textTransform: 'capitalize',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 16,
    color: '#000',
    lineHeight: 24,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#000',
    marginLeft: 8,
  },
  dateOverdue: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#3C3C43',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
    width: 40,
    textAlign: 'right',
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  subtaskCheckbox: {
    marginRight: 12,
  },
  subtaskText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  subtaskTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
  subtaskDelete: {
    padding: 4,
  },
  addSubtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  addSubtaskInput: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 8,
  },
  addSubtaskButton: {
    padding: 8,
  },
  actions: {
    marginTop: 8,
  },
  completeButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  completedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
  },
  completedText: {
    fontSize: 12,
    color: '#34C759',
    marginLeft: 8,
  },
});

export default TaskDetailScreen;
