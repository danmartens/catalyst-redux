// @flow

import createModule from './createModule';

import type { ResourceModuleState } from './types';

import findAll from './resource/operations/findAll';
import create from './resource/operations/create';
import update from './resource/operations/update';
import destroy from './resource/operations/destroy';

import * as selectors from './resource/selectors';

export default function createResourceModule(resourceTypes: Array<string>) {
  const resourceTypesMap = {};

  resourceTypes.forEach((resourceType: string) => {
    resourceTypesMap[resourceType] = {};
  });

  const initialState: ResourceModuleState = {
    resources: { ...resourceTypesMap },
    newResources: { ...resourceTypesMap },
    resourceRelationships: { ...resourceTypesMap },
    resourceStatus: { ...resourceTypesMap },
    newResourceStatus: { ...resourceTypesMap },
    newResourceIDMap: { ...resourceTypesMap }
  };

  return createModule({
    initialState,
    operations: {
      findAll,
      create,
      update,
      destroy
    },
    selectors
  });
}
