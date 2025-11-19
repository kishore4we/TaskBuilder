# TaskBuilder

A cross-platform mobile app for task management with offline support, notifications, and motivational features.

## Features

- **Task Management**: Create, edit, and delete tasks with priorities, due dates, and reminders
- **Todo Lists**: Add subtasks to break down complex tasks
- **Offline Support**: Works completely offline with automatic sync when online
- **Push Notifications**: Get reminders for upcoming tasks and overdue alerts
- **Motivational Quotes**: Displays encouraging quotes when tasks are overdue or incomplete
- **Encouragement**: Celebrates task completions with positive feedback
- **Progress Tracking**: View statistics, completion rates, and streaks

## Tech Stack

- React Native with Expo
- TypeScript
- AsyncStorage for offline data persistence
- Expo Notifications for push notifications
- React Navigation for routing

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your mobile device (for testing)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd TaskBuilder
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Add app assets (icons):
   - Place the following images in the `assets/` folder:
     - `icon.png` (1024x1024) - App icon
     - `splash.png` (1284x2778) - Splash screen
     - `adaptive-icon.png` (1024x1024) - Android adaptive icon
     - `favicon.png` (48x48) - Web favicon
     - `notification-icon.png` (96x96) - Notification icon

4. Start the development server:
   ```bash
   npm start
   ```

5. Scan the QR code with Expo Go (Android) or Camera app (iOS)

### Building for Production

#### Android
```bash
npx expo build:android
```

#### iOS
```bash
npx expo build:ios
```

## Project Structure

```
TaskBuilder/
├── App.tsx                 # Main entry point
├── src/
│   ├── types/              # TypeScript type definitions
│   ├── services/           # Business logic services
│   │   ├── storageService.ts    # Offline storage
│   │   ├── syncService.ts       # Online sync
│   │   ├── notificationService.ts # Push notifications
│   │   └── quotesService.ts     # Motivational quotes
│   ├── context/            # React Context for state management
│   ├── screens/            # App screens
│   │   ├── TaskListScreen.tsx
│   │   ├── CreateTaskScreen.tsx
│   │   ├── TaskDetailScreen.tsx
│   │   └── SettingsScreen.tsx
│   └── navigation/         # Navigation configuration
├── assets/                 # Images and icons
└── app.json               # Expo configuration
```

## Features in Detail

### Offline Support
- All data is stored locally using AsyncStorage
- Changes are queued for sync when offline
- Automatic sync when connection is restored

### Notifications
- Task reminders at specified times
- Overdue task alerts
- Daily summary notifications
- Encouragement notifications on task completion

### Motivational Quotes
- Displays inspiring quotes for incomplete tasks
- Celebrates milestones (10, 25, 50, 100+ tasks completed)
- Streak tracking for consecutive productive days

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License
