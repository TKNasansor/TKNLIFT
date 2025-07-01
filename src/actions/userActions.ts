import { User } from '../types';

// User Action Types
export const USER_ACTIONS = {
  SET_USER: 'SET_USER',
  ADD_USER: 'ADD_USER',
  DELETE_USER: 'DELETE_USER',
  UPDATE_USER: 'UPDATE_USER',
} as const;

export type UserActionType = typeof USER_ACTIONS[keyof typeof USER_ACTIONS];

// User Actions
export interface SetUserAction {
  type: typeof USER_ACTIONS.SET_USER;
  payload: string; // user name
}

export interface AddUserAction {
  type: typeof USER_ACTIONS.ADD_USER;
  payload: Omit<User, 'id'>;
}

export interface DeleteUserAction {
  type: typeof USER_ACTIONS.DELETE_USER;
  payload: string; // user ID
}

export interface UpdateUserAction {
  type: typeof USER_ACTIONS.UPDATE_USER;
  payload: User;
}

export type UserAction = 
  | SetUserAction
  | AddUserAction
  | DeleteUserAction
  | UpdateUserAction;