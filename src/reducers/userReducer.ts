import { AppState, User } from '../types';
import { UserAction, USER_ACTIONS } from '../actions/userActions';

export const userReducer = (state: AppState, action: UserAction): Partial<AppState> => {
  switch (action.type) {
    case USER_ACTIONS.SET_USER: {
      const existingUser = state.users.find(user => user.name === action.payload);
      
      if (existingUser) {
        return {
          currentUser: existingUser,
        };
      } else {
        const newUser: User = {
          id: Date.now().toString(),
          name: action.payload,
        };

        return {
          currentUser: newUser,
          users: [...state.users, newUser],
        };
      }
    }

    case USER_ACTIONS.ADD_USER: {
      const newUser: User = {
        ...action.payload,
        id: Date.now().toString(),
      };

      return {
        users: [...state.users, newUser],
      };
    }

    case USER_ACTIONS.DELETE_USER: {
      const updatedUsers = state.users.filter(user => user.id !== action.payload);
      
      // If the deleted user was the current user, clear current user
      const newCurrentUser = state.currentUser?.id === action.payload 
        ? null 
        : state.currentUser;

      return {
        users: updatedUsers,
        currentUser: newCurrentUser,
      };
    }

    case USER_ACTIONS.UPDATE_USER: {
      const updatedUsers = state.users.map(user =>
        user.id === action.payload.id ? action.payload : user
      );

      // If the updated user is the current user, update current user too
      const newCurrentUser = state.currentUser?.id === action.payload.id 
        ? action.payload 
        : state.currentUser;

      return {
        users: updatedUsers,
        currentUser: newCurrentUser,
      };
    }

    default:
      return {};
  }
};