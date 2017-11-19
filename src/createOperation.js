// @flow

import reducerForActionType from './utils/reducerForActionType';

type OperationType<ActionCreator, Reducer> = (
  moduleName: string
) => { actionCreator: $Supertype<ActionCreator>, reducer: $Supertype<Reducer> };

export default function createOperation<ActionCreator: *, Reducer: *>({
  actionType,
  actionCreator = payload => ({ payload }),
  reducer
}: {
  actionType: string,
  actionCreator?: ActionCreator,
  reducer: Reducer
}): OperationType<ActionCreator, Reducer> {
  return (moduleName: string) => {
    const type = `${moduleName}/${actionType}`;

    const newActionCreator = (...args: Array<*>) => ({
      type,
      ...actionCreator(...args)
    });

    return {
      actionCreator: newActionCreator,
      reducer: reducerForActionType(reducer, type)
    };
  };
}
