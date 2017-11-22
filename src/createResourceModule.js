// @flow

import createModule from './createModule';

import type { ResourceModuleState } from './types';

import findAll from './resource/operations/findAll';
import create from './resource/operations/create';
import update from './resource/operations/update';
import destroy from './resource/operations/destroy';

import * as selectors from './resource/selectors';

export default function createResourceModule({
  resourceTypes,
  requestConfig = {}
}: {
  resourceTypes: Array<string>,
  requestConfig: {}
}) {
  return (moduleName: string) => {
    const resourceTypesMap = {};

    resourceTypes.forEach((resourceType: string) => {
      resourceTypesMap[resourceType] = {};
    });

    const mappedSelectors = {};

    for (const name in selectors) {
      if (selectors.hasOwnProperty(name)) {
        mappedSelectors[name] = (state: Object, ...args: Array<*>) => {
          return selectors[name](state[moduleName], ...args);
        };
      }
    }

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
        findAll: findAll({ requestConfig }),
        create: create({ requestConfig }),
        update: update({ requestConfig }),
        destroy: destroy({ requestConfig })
      },
      selectors: mappedSelectors
    })(moduleName);
  };
}
