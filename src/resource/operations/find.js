// @flow

import { map, reduce, snakeCase } from 'lodash';
import { put, call } from 'redux-saga/effects';

import createAsyncOperation from '../../createAsyncOperation';

import request from '../../utils/request';
import { addResources, setResourceStatus } from '../../utils/resources';
import buildFindQuery from '../../utils/buildFindQuery';

import type {
  JSONAPIDocument,
  ResourceType,
  ResourceID,
  ResourceModuleState,
  RelationshipName,
  Relationship
} from '../../types';

type Options = {
  include?: Array<string>,
  filter?: { [string]: string | number | boolean | null }
};

export type Action = {
  status: null,
  payload: {
    resourceType: ResourceType,
    resourceID: ResourceID,
    options: Options
  }
};

export type PendingAction = {
  status: 'pending',
  payload: $PropertyType<Action, 'payload'>
};

export type SuccessAction = {
  status: 'success',
  payload: JSONAPIDocument & {
    resourceType: ResourceType,
    resourceID: ResourceID
  }
};

export type ErrorAction = {
  status: 'error',
  payload: {
    resourceType: ResourceType,
    resourceID: ResourceID,
    error: Error
  }
};

export default function({ requestConfig }: { requestConfig: Object }) {
  return createAsyncOperation({
    actionType: 'FIND',
    actionCreator(
      resourceType: ResourceType,
      resourceID: ResourceID,
      options: Options = {}
    ) {
      return {
        status: null,
        payload: {
          resourceType,
          resourceID,
          options
        }
      };
    },
    reducer(
      state: ResourceModuleState,
      action: Action | PendingAction | SuccessAction
    ): ResourceModuleState {
      const { resourceType, resourceID } = action.payload;

      switch (action.status) {
        case 'pending': {
          return setResourceStatus(
            state,
            resourceType,
            resourceID,
            'find.pending'
          );
        }

        case 'success': {
          return setResourceStatus(
            addResources(state, action.payload),
            resourceType,
            resourceID,
            'find.success'
          );
        }

        case 'error': {
          return setResourceStatus(
            state,
            resourceType,
            resourceID,
            'find.error'
          );
        }

        default:
          return state;
      }
    },

    *saga(action: Action & { type: string }) {
      if (action.status === null) {
        const { resourceType, resourceID } = action.payload;

        yield put({
          type: action.type,
          status: 'pending',
          payload: action.payload
        });

        try {
          const data = yield call(findRequest, action, requestConfig);

          yield put({
            type: action.type,
            status: 'success',
            payload: {
              resourceType,
              resourceID,
              ...data
            }
          });
        } catch (error) {
          yield put({
            type: action.type,
            status: 'error',
            payload: {
              resourceType,
              resourceID,
              error
            }
          });
        }
      }
    }
  });
}

function findRequest(action: Action, requestConfig: Object) {
  const { resourceType, resourceID } = action.payload;
  const url = `/api/${resourceType}/${resourceID}${buildFindQuery(
    action.payload.options
  )}`;

  return request.get(url, requestConfig).then(({ data }) => data);
}
