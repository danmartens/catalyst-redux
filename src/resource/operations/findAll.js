// @flow

import { put, call } from 'redux-saga/effects';

import createAsyncOperation from '../../createAsyncOperation';

import request from '../../utils/request';
import { addResources, setResourcesStatus } from '../../utils/resources';

import type {
  JSONAPIDocument,
  ResourceType,
  ResourceModuleState,
  RelationshipName,
  Relationship
} from '../../types';

export type Action = {
  status: null,
  payload: {
    resourceType: ResourceType,
    attributes: { [key: string]: null | string | number | boolean },
    options: {
      include?: Array<string>
    }
  }
};

export type PendingAction = {
  status: 'pending',
  payload: $PropertyType<Action, 'payload'>
};

export type SuccessAction = {
  status: 'success',
  payload: JSONAPIDocument & {
    resourceType: ResourceType
  }
};

export type ErrorAction = {
  status: 'error',
  payload: {
    resourceType: ResourceType,
    error: Error
  }
};

export default function({ requestConfig }: { requestConfig: Object }) {
  return createAsyncOperation({
    actionType: 'FIND_ALL',
    actionCreator(
      resourceType: ResourceType,
      options: { include?: Array<string> } = {}
    ) {
      return {
        status: null,
        payload: {
          resourceType,
          options
        }
      };
    },
    reducer(
      state: ResourceModuleState,
      action: Action | PendingAction | SuccessAction
    ): ResourceModuleState {
      const { resourceType } = action.payload;

      switch (action.status) {
        case 'pending': {
          return setResourcesStatus(state, resourceType, 'find.pending');
        }

        case 'success': {
          return setResourcesStatus(
            addResources(state, action.payload),
            resourceType,
            'find.success'
          );
        }

        case 'error': {
          return setResourcesStatus(state, resourceType, 'find.error');
        }

        default:
          return state;
      }
    },

    *saga(action: Action & { type: string }) {
      if (action.status === null) {
        const { resourceType } = action.payload;

        yield put({
          type: action.type,
          status: 'pending',
          payload: action.payload
        });

        try {
          const data = yield call(findAllRequest, action, requestConfig);

          yield put({
            type: action.type,
            status: 'success',
            payload: {
              resourceType,
              ...data
            }
          });
        } catch (error) {
          yield put({
            type: action.type,
            status: 'error',
            payload: {
              resourceType,
              error
            }
          });
        }
      }
    }
  });
}

function findAllRequest(action: Action, requestConfig: Object) {
  const { resourceType } = action.payload;
  let url = `/api/${resourceType}`;

  if (action.payload.options.include != null) {
    url += `?include=${action.payload.options.include.join(',')}`;
  }

  return request.get(url, requestConfig).then(({ data }) => data);
}
