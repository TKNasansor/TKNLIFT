import { AppState } from '../types';
import { AppAction } from '../actions';
import { buildingReducer } from './buildingReducer';
import { partReducer } from './partReducer';
import { notificationReducer } from './notificationReducer';
import { userReducer } from './userReducer';
import { settingsReducer } from './settingsReducer';

export const appReducer = (state: AppState, action: AppAction): AppState => {
  // Apply the appropriate reducer based on action type
  const buildingUpdate = buildingReducer(state, action as any);
  const partUpdate = partReducer(state, action as any);
  const notificationUpdate = notificationReducer(state, action as any);
  const userUpdate = userReducer(state, action as any);
  const settingsUpdate = settingsReducer(state, action as any);

  // Merge all updates with the current state
  return {
    ...state,
    ...buildingUpdate,
    ...partUpdate,
    ...notificationUpdate,
    ...userUpdate,
    ...settingsUpdate,
  };
};