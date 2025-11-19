import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTaskContext } from '../context/TaskContext';
import { syncService } from '../services/syncService';
import { storageService } from '../services/storageService';

interface SettingsScreenProps {
  navigation: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const { settings, updateSettings, isOnline, syncData, statistics } = useTaskContext();

  const handleToggleNotifications = (value: boolean) => {
    updateSettings({ notificationsEnabled: value });
  };

  const handleToggleMotivation = (value: boolean) => {
    updateSettings({ motivationalQuotesEnabled: value });
  };

  const handleToggleSync = (value: boolean) => {
    updateSettings({ syncEnabled: value });
  };

  const handleSync = async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'Please connect to the internet to sync your data.');
      return;
    }

    const result = await syncData();
    Alert.alert('Sync', 'Data synced successfully!');
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all your tasks and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await storageService.clearAllData();
            Alert.alert('Done', 'All data has been cleared. Please restart the app.');
          },
        },
      ]
    );
  };

  const renderSettingItem = (
    icon: string,
    iconColor: string,
    title: string,
    subtitle?: string,
    rightComponent?: React.ReactNode,
    onPress?: () => void
  ) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconColor }]}>
        <Ionicons name={icon as any} size={20} color="#fff" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightComponent}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Statistics Card */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Your Progress</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{statistics.completedTasks}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#007AFF' }]}>
              {statistics.completionRate}%
            </Text>
            <Text style={styles.statLabel}>Rate</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#FF9500' }]}>
              {statistics.streakDays}
            </Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
        </View>
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
        {renderSettingItem(
          'notifications',
          '#FF3B30',
          'Push Notifications',
          'Get reminders for your tasks',
          <Switch
            value={settings.notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: '#E5E5EA', true: '#34C759' }}
          />
        )}
        {renderSettingItem(
          'bulb',
          '#FF9500',
          'Motivational Quotes',
          'Show inspiring quotes for incomplete tasks',
          <Switch
            value={settings.motivationalQuotesEnabled}
            onValueChange={handleToggleMotivation}
            trackColor={{ false: '#E5E5EA', true: '#34C759' }}
          />
        )}
      </View>

      {/* Sync Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SYNC</Text>
        {renderSettingItem(
          'cloud',
          '#007AFF',
          'Auto Sync',
          'Automatically sync when online',
          <Switch
            value={settings.syncEnabled}
            onValueChange={handleToggleSync}
            trackColor={{ false: '#E5E5EA', true: '#34C759' }}
          />
        )}
        {renderSettingItem(
          'sync',
          '#34C759',
          'Sync Now',
          isOnline ? 'Sync your data to the cloud' : 'You are currently offline',
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />,
          handleSync
        )}
      </View>

      {/* Status Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>STATUS</Text>
        {renderSettingItem(
          isOnline ? 'wifi' : 'cloud-offline',
          isOnline ? '#34C759' : '#FF9500',
          'Connection',
          isOnline ? 'Online - Changes will sync' : 'Offline - Changes saved locally'
        )}
      </View>

      {/* Data Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DATA</Text>
        {renderSettingItem(
          'trash',
          '#FF3B30',
          'Clear All Data',
          'Delete all tasks and reset app',
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />,
          handleClearData
        )}
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ABOUT</Text>
        {renderSettingItem(
          'information-circle',
          '#8E8E93',
          'Version',
          '1.0.0'
        )}
      </View>

      <Text style={styles.footer}>
        TaskBuilder - Stay productive and motivated!
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    paddingBottom: 32,
  },
  statsCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#34C759',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginLeft: 16,
    marginBottom: 8,
  },
  settingItem: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#000',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 16,
    paddingHorizontal: 16,
  },
});

export default SettingsScreen;
