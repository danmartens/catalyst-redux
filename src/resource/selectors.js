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
  state: { resources: ResourceModuleState },
  resourceType: ResourceType,
  resourceID: ?ResourceID
) {
  if (resourceID == null) {
    return null;
  }

  return buildRecord(state.resources, resourceType, resourceID);
}

export function findAll(
  state: { resources: ResourceModuleState },
  resourceType: ResourceType
): Array<*> {
  return Object.keys(
    state.resources.resources[resourceType] || {}
  ).map(resourceId => find(state, resourceType, resourceId));
}

export function resourceStatus(
  state: { resources: ResourceModuleState },
  resourceType: ResourceType,
  resourceID: ?ResourceID
): ResourceStatus {
  if (resourceID == null) {
    return null;
  }

  const statusesForType = state.resources.resourceStatus[resourceType];

  if (statusesForType == null || typeof statusesForType === 'string') {
    return null;
  }

  return statusesForType[resourceID];
}

export function resourcesStatus(
  state: { resources: ResourceModuleState },
  resourceType: ResourceType
): ResourceStatus {
  const status = state.resources.resourceStatus[resourceType];

  if (typeof status !== 'string') {
    return null;
  }

  return status;
}

export function resourceForClientID(
  state: { resources: ResourceModuleState },
  resourceType: ResourceType,
  resourceClientID: ?ResourceClientID
): ?Object {
  if (resourceClientID == null) {
    return null;
  }

  const newResourceIDMap = state.resources.newResourceIDMap[resourceType] || {};
  const resourceID = newResourceIDMap[resourceClientID];

  return find(state, resourceType, resourceID);
}

export function newResourceStatus(
  state: { resources: ResourceModuleState },
  resourceType: ResourceType,
  resourceClientID: ?ResourceClientID
): ResourceStatus {
  if (resourceClientID == null) {
    return null;
  }

  const newStatusesForType = state.resources.newResourceStatus[resourceType];

  if (newStatusesForType == null) {
    return null;
  }

  return newStatusesForType[resourceClientID];
}
