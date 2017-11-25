// @flow

import { uniqueId } from 'lodash';
import { put, call } from 'redux-saga/effects';

import createAsyncOperation from '../../createAsyncOperation';

import request from '../../utils/request';

import {
  addResources,
  setResourceStatus,
  addNewResource,
  setNewResourceStatus,
  setNewResourceIDMap,
  getResourceType
} from '../../utils/resources';

import type {
  JSONAPIDocument,
  ResourceType,
  ResourceID,
  ResourceClientID,
  ResourceModuleState,
  RelationshipName,
  Relationship
} from '../../types';

type Action = {
  status: null,
  payload: {
    resourceType: ResourceType,
    clientID: ResourceClientID,
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
    resourceID: ResourceID,
    clientID: ResourceClientID
  }
};

export type ErrorAction = {
  status: 'error',
  payload: {
    resourceType: ResourceType,
    clientID: ResourceClientID,
    error: Error
  }
};

export default function({ requestConfig }: { requestConfig: Object }) {
  return createAsyncOperation({
    actionType: 'CREATE',
    actionCreator(
      resourceType: ResourceType,
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
          clientID: uniqueId('c'),
          resourceType,
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
          const { clientID, resourceType, attributes } = action.payload;

          state = addNewResource(state, clientID, {
            type: resourceType,
            attributes
          });

          state = setNewResourceStatus(
            state,
            resourceType,
            clientID,
            'create.pending'
          );

          return state;
        }

        case 'success': {
          const resourceType = getResourceType(action.payload.data);
          const { resourceID, clientID, data } = action.payload;

          if (resourceType != null && !Array.isArray(data)) {
            state = addResources(state, action.payload);

            state = setResourceStatus(
              state,
              resourceType,
              resourceID,
              'create.success'
            );

            state = setNewResourceStatus(
              state,
              resourceType,
              clientID,
              'create.success'
            );

            state = setNewResourceIDMap(
              state,
              resourceType,
              clientID,
              resourceID
            );
          }

          return state;
        }

        case 'error': {
          const { clientID, resourceType } = action.payload;

          return setNewResourceStatus(
            state,
            resourceType,
            clientID,
            'create.error'
          );
        }
      }

      return state;
    },
    *saga(action: Action & { type: string }) {
      if (action.status === null) {
        const { clientID, resourceType } = action.payload;

        yield put({
          type: action.type,
          status: 'pending',
          payload: action.payload
        });

        try {
          const response = yield call(createRequest, action, requestConfig);

          yield put({
            type: action.type,
            status: 'success',
            payload: {
              resourceType,
              resourceID: response.data.id,
              clientID,
              ...response
            }
          });
        } catch (error) {
          yield put({
            type: action.type,
            status: 'error',
            payload: {
              resourceType,
              clientID,
              error
            }
          });
        }
      }
    }
  });
}

function createRequest(action: Action, requestConfig: Object) {
  const { resourceType } = action.payload;
  const url = `/api/${resourceType}`;

  return request
    .post(
      url,
      {
        data: {
          type: action.payload.resourceType,
          attributes: action.payload.attributes,
          relationships:
            action.payload.options && action.payload.options.relationships
        }
      },
      requestConfig
    )
    .then(({ data }) => data);
}
