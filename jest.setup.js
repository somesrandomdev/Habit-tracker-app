// Global jest mocks for native modules that have no JS implementation in the test environment.
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  requestPermissionsAsync: jest.fn(async () => ({ granted: true, status: 'granted' })),
  getPermissionsAsync: jest.fn(async () => ({ granted: true, status: 'granted' })),
  scheduleNotificationAsync: jest.fn(async () => 'id'),
  cancelScheduledNotificationAsync: jest.fn(async () => undefined),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => undefined),
  getAllScheduledNotificationsAsync: jest.fn(async () => []),
  setNotificationChannelAsync: jest.fn(async () => undefined),
  SchedulableTriggerInputTypes: {
    DATE: 'date',
    DAILY: 'daily',
    WEEKLY: 'weekly',
  },
}));

// The app imports expo-notifications submodules directly (to avoid the Expo Go
// Android import-time push crash), so mock each deep path too.
jest.mock('expo-notifications/build/NotificationsHandler', () => ({
  setNotificationHandler: jest.fn(),
}));
jest.mock('expo-notifications/build/NotificationPermissions', () => ({
  getPermissionsAsync: jest.fn(async () => ({ granted: true, status: 'granted' })),
  requestPermissionsAsync: jest.fn(async () => ({ granted: true, status: 'granted' })),
}));
jest.mock('expo-notifications/build/scheduleNotificationAsync', () => ({
  scheduleNotificationAsync: jest.fn(async () => 'id'),
}));
jest.mock('expo-notifications/build/cancelAllScheduledNotificationsAsync', () => ({
  cancelAllScheduledNotificationsAsync: jest.fn(async () => undefined),
}));
jest.mock('expo-notifications/build/setNotificationChannelAsync', () => ({
  setNotificationChannelAsync: jest.fn(async () => undefined),
}));
jest.mock('expo-notifications/build/NotificationChannelManager.types', () => ({
  AndroidImportance: { DEFAULT: 3, HIGH: 4 },
}));
jest.mock('expo-notifications/build/Notifications.types', () => ({
  SchedulableTriggerInputTypes: {
    DATE: 'date',
    DAILY: 'daily',
    WEEKLY: 'weekly',
  },
}));

jest.mock('expo-file-system', () => ({
  cacheDirectory: '/cache/',
  documentDirectory: '/docs/',
  writeAsStringAsync: jest.fn(async () => undefined),
  readAsStringAsync: jest.fn(async () => ''),
  deleteAsync: jest.fn(async () => undefined),
  EncodingType: { UTF8: 'utf8' },
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async () => undefined),
}));

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    execSync: jest.fn(),
    runSync: jest.fn(() => ({ lastInsertRowId: 1, changes: 1 })),
    getFirstSync: jest.fn(() => undefined),
    getAllSync: jest.fn(() => []),
    withTransactionSync: jest.fn((fn) => fn()),
    withExclusiveTransactionAsync: jest.fn(async (fn) => fn()),
  })),
}));
