// @flow

import createModule from './createModule';

import type { ResourceModuleState } from './types';

import findAll from './resource/operations/findAll';
import create from './resource/operations/create';
import update from './resource/operations/update';
import destroy from './resource/operations/destroy';

import * as selectors from './resource/selectors';

type MapSelector = <State: *, Arguments: *, Result: *>(
  (state: State, ...args: Arguments) => Result
) => (state: Object, ...args: Arguments) => Result;

export default function createResourceModule({
  resourceTypes,
  requestConfig = {}
}: {
  resourceTypes: Array<string>,
  requestConfig?: {}
}) {
  return (moduleName: string) => {
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
        findAll: findAll({ requestConfig }),
        create: create({ requestConfig }),
        update: update({ requestConfig }),
        destroy: destroy({ requestConfig })
      },
      selectors: mapSelectors(moduleName, selectors)
    })(moduleName);
  };
}

function mapSelectors<Selectors: *>(
  moduleName: string,
  selectors: Selectors
): $ObjMap<Selectors, MapSelector> {
  const mappedSelectors = {};

  for (const name in selectors) {
    if (selectors.hasOwnProperty(name)) {
      mappedSelectors[name] = (state, ...args) => {
        return selectors[name](state[moduleName], ...args);
      };
    }
  }

  return mappedSelectors;
}
