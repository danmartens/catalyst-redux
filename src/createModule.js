// @flow

import { all } from 'redux-saga/effects';

type ExtractActionCreator = <V>((...Array<*>) => { actionCreator: V }) => V;

export default function createModule<
  Name: string,
  Selectors: { [key: string]: * },
  State,
  OperationsMap: *
>({
  operations,
  selectors,
  initialState
}: {
  operations: OperationsMap,
  selectors: Selectors,
  initialState: State
}): (
  moduleName: Name
) => {
  name: Name,
  actions: $ObjMap<OperationsMap, ExtractActionCreator>,
  selectors: Selectors,
  reducer: *,
  saga: *
} {
  return (moduleName: Name) => {
    const mappedOperations = {};
    const actions = {};

    for (const actionName in operations) {
      if (operations.hasOwnProperty(actionName)) {
        const operation = operations[actionName](moduleName, selectors);

        mappedOperations[actionName] = operation;
        actions[actionName] = operation.actionCreator;
      }
    }

    const operationsReducer = composeOperationReducers(mappedOperations);

    const defaultSaga = function*() {
      yield all(
        Object.keys(mappedOperations).map(actionName => {
          const saga = mappedOperations[actionName].saga || function*() {};
          return saga();
        })
      );
    };

    const defaultReducer = (state: *, action: *) => {
      if (state === undefined) {
        return initialState;
      } else {
        return operationsReducer(state, action);
      }
    };

    return {
      name: moduleName,
      reducer: defaultReducer,
      saga: defaultSaga,
      selectors,
      actions
    };
  };
}

function composeOperationReducers(operations: {
  [key: string]: { reducer: * }
}) {
  return (state, action) =>
    Object.keys(operations).reduce((prevState, actionName) => {
      return operations[actionName].reducer(prevState, action);
    }, state);
}
