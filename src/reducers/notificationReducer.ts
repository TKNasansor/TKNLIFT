import { AppState, NotificationData } from '../types';
import { NotificationAction, NOTIFICATION_ACTIONS } from '../actions/notificationActions';

export const notificationReducer = (state: AppState, action: NotificationAction): Partial<AppState> => {
  switch (action.type) {
    case NOTIFICATION_ACTIONS.ADD_NOTIFICATION: {
      return {
        notifications: [action.payload, ...state.notifications],
        unreadNotifications: state.unreadNotifications + 1,
      };
    }

    case NOTIFICATION_ACTIONS.CLEAR_NOTIFICATIONS: {
      return {
        notifications: [],
        unreadNotifications: 0,
      };
    }

    case NOTIFICATION_ACTIONS.MARK_NOTIFICATION_READ: {
      const updatedSystemNotifications = state.systemNotifications.map(notification =>
        notification.id === action.payload
          ? { ...notification, isRead: true }
          : notification
      );

      return {
        systemNotifications: updatedSystemNotifications,
      };
    }

    case NOTIFICATION_ACTIONS.ADD_SYSTEM_NOTIFICATION: {
      const newNotification: NotificationData = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        isRead: false,
      };

      return {
        systemNotifications: [newNotification, ...state.systemNotifications],
      };
    }

    case NOTIFICATION_ACTIONS.REMOVE_SYSTEM_NOTIFICATION: {
      const updatedSystemNotifications = state.systemNotifications.filter(
        notification => notification.id !== action.payload
      );

      return {
        systemNotifications: updatedSystemNotifications,
      };
    }

    default:
      return {};
  }
};