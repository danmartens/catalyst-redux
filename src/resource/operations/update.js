// @flow

import { put, call } from 'redux-saga/effects';
import { omit } from 'lodash';
import createAsyncOperation from '../../createAsyncOperation';

import request from '../../utils/request';
import {
  addResources,
  getResourceType,
  setResourceStatus
} from '../../utils/resources';

import type {
  JSONAPIDocument,
  ResourceType,
  ResourceID,
  ResourceModuleState,
  RelationshipName,
  Relationship
} from '../../types';

type Action = {
  status: null,
  payload: {
    resourceType: ResourceType,
    resourceID: ResourceID,
    attributes: { [key: string]: null | string | number | boolean },
    options?: {
      relationships?: {
        [RelationshipName]: { data: Relationship | Array<Relationship> }
      }
    }
  }
};

type PendingAction = {
  status: 'pending',
  payload: $PropertyType<Action, 'payload'>
};

type SuccessAction = {
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
    actionType: 'UPDATE',
    actionCreator(
      resourceType: ResourceType,
      resourceID: ResourceID,
      attributes: { [key: string]: null | string | number | boolean },
      options?: {
        relationships?: {
          [RelationshipName]: { data: Relationship | Array<Relationship> }
        }
      }
    ): Action {
      return {
        status: null,
        payload: {
          resourceType,
          resourceID,
          attributes,
          options
        }
      };
    },
    reducer(
      state: ResourceModuleState,
      action: Action | PendingAction | SuccessAction | ErrorAction
    ): ResourceModuleState {
      switch (action.status) {
        case 'pending': {
          const { resourceType, resourceID } = action.payload;

          return setResourceStatus(
            state,
            resourceType,
            resourceID,
            'update.pending'
          );
        }

        case 'success': {
          const resourceType = getResourceType(action.payload.data);
          const { resourceID, data } = action.payload;

          if (resourceType != null && !Array.isArray(data)) {
            return addResources(state, action.payload, 'update.success');
          }

          break;
        }

        case 'error': {
          const { resourceType, resourceID } = action.payload;

          return setResourceStatus(
            state,
            resourceType,
            resourceID,
            'update.error'
          );
        }
      }

      return state;
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
          const data = yield call(updateRequest, action, requestConfig);

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

function updateRequest(action: Action, requestConfig: Object) {
  const { resourceType, resourceID } = action.payload;
  const url = `/api/${resourceType}/${resourceID}`;

  return request
    .patch(
      url,
      {
        data: {
          type: resourceType,
          id: resourceID,
          attributes: omit(action.payload.attributes, ['id']),
          relationships:
            action.payload.options && action.payload.options.relationships
        }
      },
      requestConfig
    )
    .then(({ data }) => data);
}
