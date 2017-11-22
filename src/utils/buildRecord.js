// @flow

import type { ResourceModuleState, ResourceType, ResourceID } from '../types';

const recordsCache = new WeakMap();

export default function buildRecord(
  state: ResourceModuleState,
  resourceType: ResourceType,
  resourceID: ResourceID
) {
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

  const resources = state.resources[resourceType];

  if (resources == null) {
    return null;
  }

  const resource = resources[resourceID];

  if (resource == null) {
    return null;
  }

  const record = { ...resource };

  defineRelationships(state, resourceType, resourceID, record);

  Object.freeze(record);

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

function defineRelationships(state, resourceType, resourceID, record) {
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
