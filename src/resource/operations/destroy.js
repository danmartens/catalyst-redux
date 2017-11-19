// @flow

import { put, call } from 'redux-saga/effects';

import createAsyncOperation from '../../createAsyncOperation';
import request from '../../utils/request';
import { removeResource, setResourceStatus } from '../../utils/resources';

import type {
  AsyncStatus,
  ResourceType,
  ResourceID,
  ResourceModuleState
} from '../../types';

export type Action = {
  status: AsyncStatus,
  payload: {
    resourceType: ResourceType,
    resourceID: ResourceID
  }
};

export default createAsyncOperation({
  actionType: 'DESTROY',
  actionCreator(resourceType: ResourceType, resourceID: ResourceID): Action {
    return {
      status: null,
      payload: {
        resourceType,
        resourceID
      }
    };
  },
  reducer(state: ResourceModuleState, action: Action): ResourceModuleState {
    const { resourceType, resourceID } = action.payload;

    switch (action.status) {
      case 'pending': {
        return setResourceStatus(
          state,
          resourceType,
          resourceID,
          'destroy.pending'
        );
      }

      case 'success': {
        return setResourceStatus(
          removeResource(state, resourceType, resourceID),
          resourceType,
          resourceID,
          'destroy.success'
        );
      }

      case 'error': {
        return setResourceStatus(
          state,
          resourceType,
          resourceID,
          'destroy.error'
        );
      }

      default:
        return state;
    }
  },
  *saga(action: Action & { type: string }) {
    if (action.status === null) {
      yield put({
        type: action.type,
        status: 'pending',
        payload: action.payload
      });

      try {
        yield call(destroyRequest, action);

        yield put({
          type: action.type,
          status: 'success',
          payload: action.payload
        });
      } catch (error) {
        yield put({
          type: action.type,
          status: 'error',
          payload: error
        });
      }
    }
  }
});

function destroyRequest(action: Action) {
  const { resourceType, resourceID } = action.payload;
  const url = `/api/${resourceType}/${resourceID}`;

  return request.delete(url).then(({ data }) => data);
}
