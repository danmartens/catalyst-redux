// @flow

import dotProp from 'dot-prop-immutable';

import type {
  ResourceModuleState,
  ResourceClientID,
  ResourceID,
  ResourceType,
  ResourceStatus,
  RelationshipName,
  JSONAPIDocument,
  JSONAPIResource,
  JSONAPIRelationships,
  JSONAPIRelationshipData,
  NewJSONAPIResource
} from '../types';

export function addResource(
  state: ResourceModuleState,
  resource: JSONAPIResource
): ResourceModuleState {
  if (state.resources[resource.type] == null) {
    return state;
  }

  const resources = {
    ...state.resources,
    [resource.type]: {
      ...state.resources[resource.type],
      [resource.id.toString()]: { id: resource.id, ...resource.attributes }
    }
  };

  const resourceRelationships = {
    ...state.resourceRelationships,
    [resource.type]: {
      ...state.resourceRelationships[resource.type],
      [resource.id.toString()]: mapRelationships(
        resource.relationships,
        state.resourceRelationships[resource.type][resource.id.toString()]
      )
    }
  };

  return {
    ...state,
    resources,
    resourceRelationships
  };
}

function mapRelationships(
  relationships: ?JSONAPIRelationships,
  existingRelationships: ?{ [RelationshipName]: JSONAPIRelationshipData }
) {
  if (relationships == null) {
    return {};
  }

  if (existingRelationships == null) {
    existingRelationships = {};
  }

  const map = existingRelationships;

  for (const relationshipName in relationships) {
    if (relationships.hasOwnProperty(relationshipName)) {
      if (relationships[relationshipName].data != null) {
        map[relationshipName] = relationships[relationshipName].data;
      }
    }
  }

  return map;
}

export function addNewResource(
  state: ResourceModuleState,
  resourceClientID: ResourceClientID,
  resource: NewJSONAPIResource
): ResourceModuleState {
  if (state.newResources[resource.type] == null) {
    return state;
  }

  const newResources = {
    ...state.newResources,
    [resource.type]: {
      ...state.newResources[resource.type],
      [resourceClientID.toString()]: {
        ...resource.attributes
      }
    }
  };

  return {
    ...state,
    newResources
  };
}

export function addResources(
  state: ResourceModuleState,
  resources: JSONAPIDocument
): ResourceModuleState {
  if (resources.data instanceof Array) {
    resources.data.forEach(resource => {
      state = addResource(state, resource);
    });
  } else {
    state = addResource(state, resources.data);
  }

  if (resources.included instanceof Array) {
    resources.included.forEach(resource => {
      state = addResource(state, resource);
    });
  }

  return state;
}

export function removeResource(
  state: ResourceModuleState,
  resourceType: ResourceType,
  resourceID: ResourceID
): ResourceModuleState {
  return dotProp.delete(state, `resources.${resourceType}.${resourceID}`);
}

export function setResourceStatus(
  state: ResourceModuleState,
  resourceType: ResourceType,
  resourceID: ResourceID,
  resourceStatus: ResourceStatus
): ResourceModuleState {
  let resourceStatusForType = state.resourceStatus[resourceType];

  if (typeof resourceStatusForType === 'string') {
    resourceStatusForType = {};
  }

  return {
    ...state,
    resourceStatus: {
      ...state.resourceStatus,
      [resourceType]: {
        ...resourceStatusForType,
        [resourceID]: resourceStatus
      }
    }
  };
}

export function setResourcesStatus(
  state: ResourceModuleState,
  resourceType: ResourceType,
  resourceStatus: ResourceStatus
): ResourceModuleState {
  return {
    ...state,
    resourceStatus: {
      ...state.resourceStatus,
      [resourceType]: resourceStatus
    }
  };
}

export function setNewResourceStatus(
  state: ResourceModuleState,
  resourceType: ResourceType,
  resourceClientID: ResourceClientID,
  resourceStatus: ResourceStatus
): ResourceModuleState {
  return {
    ...state,
    newResourceStatus: {
      ...state.newResourceStatus,
      [resourceType]: {
        ...(state.newResourceStatus[resourceType] || {}),
        [resourceClientID]: resourceStatus
      }
    }
  };
}

export function setNewResourceIDMap(
  state: ResourceModuleState,
  resourceType: ResourceType,
  resourceClientID: ResourceClientID,
  resourceID: ResourceID
): ResourceModuleState {
  return {
    ...state,
    newResourceIDMap: {
      ...state.newResourceIDMap,
      [resourceType]: {
        ...(state.newResourceIDMap[resourceType] || {}),
        [resourceClientID]: resourceID
      }
    }
  };
}

export function getResourceType(
  data: JSONAPIResource | Array<JSONAPIResource>
): ResourceType | null {
  if (Array.isArray(data)) {
    if (data[0] != null) {
      return data[0].type;
    }

    return null;
  }

  return data.type;
}
