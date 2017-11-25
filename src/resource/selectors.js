// @flow

import type {
  ResourceID,
  ResourceType,
  ResourceClientID,
  ResourceStatus,
  ResourceModuleState
} from '../types';

import buildRecord from '../utils/buildRecord';

export function find(
  state: ResourceModuleState,
  resourceType: ResourceType,
  resourceID: ?ResourceID
) {
  if (resourceID == null) {
    return null;
  }

  return buildRecord(state, resourceType, resourceID);
}

export function findAll(
  state: ResourceModuleState,
  resourceType: ResourceType
): Array<*> {
  return Object.keys(state.resources[resourceType] || {}).map(resourceId =>
    find(state, resourceType, resourceId)
  );
}

export function resourceStatus(
  state: ResourceModuleState,
  resourceType: ResourceType,
  resourceID: ?ResourceID
): ?ResourceStatus {
  if (resourceID == null) {
    return undefined;
  }

  const statusesForType = state.resourceStatus[resourceType];

  if (statusesForType == null || typeof statusesForType === 'string') {
    return undefined;
  }

  return statusesForType[resourceID];
}

export function resourcesStatus(
  state: ResourceModuleState,
  resourceType: ResourceType
): ResourceStatus {
  const status = state.resourceStatus[resourceType];

  if (typeof status !== 'string') {
    return null;
  }

  return status;
}

export function resourceForClientID(
  state: ResourceModuleState,
  resourceType: ResourceType,
  resourceClientID: ?ResourceClientID
): ?Object {
  if (resourceClientID == null) {
    return null;
  }

  const newResourceIDMap = state.newResourceIDMap[resourceType] || {};
  const resourceID = newResourceIDMap[resourceClientID];

  return find(state, resourceType, resourceID);
}

export function newResourceStatus(
  state: ResourceModuleState,
  resourceType: ResourceType,
  resourceClientID: ?ResourceClientID
): ResourceStatus {
  if (resourceClientID == null) {
    return null;
  }

  const newStatusesForType = state.newResourceStatus[resourceType];

  if (newStatusesForType == null) {
    return null;
  }

  return newStatusesForType[resourceClientID];
}
