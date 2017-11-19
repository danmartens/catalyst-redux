// @flow

import { takeEvery, put, call } from 'redux-saga/effects';

import reducerForActionType from './utils/reducerForActionType';
import sagaForAsyncFunction from './utils/sagaForAsyncFunction';
import sagaForActionType from './utils/sagaForActionType';

type OperationType<ActionCreator, Reducer, Saga> = (
  moduleName: string
) => {
  actionCreator: $Supertype<ActionCreator>,
  reducer: $Supertype<Reducer>,
  saga: $Supertype<Saga>
};

export default function createAsyncOperation<
  ActionCreator: Function,
  Reducer: *,
  Saga: *
>({
  actionType,
  actionCreator = (payload = null) => ({ status: null, payload }),
  reducer,
  request,
  saga = sagaForAsyncFunction(request)
}: {
  actionType: string,
  actionCreator?: ActionCreator,
  reducer: Reducer,
  request?: *,
  saga?: Saga
}): OperationType<ActionCreator, Reducer, Saga> {
  return (moduleName: string) => {
    const type = `${moduleName}/${actionType}`;

    const newActionCreator = (...args: Array<*>) => ({
      type,
      ...actionCreator(...args)
    });

    return {
      actionCreator: newActionCreator,
      reducer: reducerForActionType(reducer, type),
      saga: sagaForActionType(saga, type)
    };
  };
}
