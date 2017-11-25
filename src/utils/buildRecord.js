// @flow

import type {
  ResourceModuleState,
  ResourceType,
  ResourceID,
  ResourceStatus
} from '../types';

import { resourceStatus } from '../resource/selectors';

const recordsCache = new WeakMap();

export default function buildRecord(
  state: ResourceModuleState,
  resourceType: ResourceType,
  resourceID: ResourceID
): null | Record {
  let existingRecords = recordsCache.get(state);

  if (existingRecords == null) {
    existingRecords = {};
  }

  if (existingRecords[resourceType] == null) {
    existingRecords[resourceType] = {};
  }

  if (existingRecords[resourceType][resourceID] != null) {
    return existingRecords[resourceType][resourceID];
  }

  // If the resource doesn't have a status in the state, return null.
  if (resourceStatus(state, resourceType, resourceID) === undefined) {
    return null;
  }

  const record = new Record(state, resourceType, resourceID);

  existingRecords = {
    ...existingRecords,
    [resourceType]: {
      ...existingRecords[resourceType],
      [resourceID]: record
    }
  };

  recordsCache.set(state, existingRecords);

  return record;
}

const pendingStatuses = Object.freeze([
  'find.pending',
  'create.pending',
  'update.pending',
  'destroy.pending'
]);

const errorStatuses = Object.freeze([
  'find.error',
  'create.error',
  'update.error',
  'destroy.error'
]);

class Record {
  __status: ?ResourceStatus;

  constructor(
    state: ResourceModuleState,
    resourceType: ResourceType,
    resourceID: ResourceID
  ) {
    this.__status = resourceStatus(state, resourceType, resourceID);

    if (
      state.resources[resourceType] != null &&
      state.resources[resourceType][resourceID] != null
    ) {
      Object.assign(this, state.resources[resourceType][resourceID]);
    }

    defineRelationships(this, state, resourceType, resourceID);

    Object.freeze(this);
  }

  get isPending() {
    return pendingStatuses.indexOf(this.__status) > -1;
  }

  get isError() {
    return errorStatuses.indexOf(this.__status) > -1;
  }

  get isLoading() {
    return this.__status === 'find.pending';
  }

  get isLoaded() {
    return this.__status !== 'find.pending' && !this.isDestroyed;
  }

  get isUpdating() {
    return this.__status === 'update.pending';
  }

  get isDestroying() {
    return this.__status === 'destroy.pending';
  }

  get isDestroyed() {
    return this.__status === 'destroy.success';
  }
}

function defineRelationships(record, state, resourceType, resourceID) {
  const resourceRelationships = state.resourceRelationships[resourceType];

  if (resourceRelationships != null) {
    const relationships = resourceRelationships[resourceID];

    if (relationships != null) {
      for (const [relationshipName, relationshipData] of Object.entries(
        relationships
      )) {
        Object.defineProperty(record, relationshipName, {
          get() {
            if (Array.isArray(relationshipData)) {
              return relationshipData.map((relationshipDatum: Object) =>
                buildRecord(state, relationshipDatum.type, relationshipDatum.id)
              );
            } else if (
              relationshipData != null &&
              typeof relationshipData === 'object' &&
              typeof relationshipData.type === 'string' &&
              (typeof relationshipData.id === 'string' ||
                typeof relationshipData.id === 'number')
            ) {
              return buildRecord(
                state,
                relationshipData.type,
                relationshipData.id
              );
            } else {
              return null;
            }
          }
        });
      }
    }
  }
}
