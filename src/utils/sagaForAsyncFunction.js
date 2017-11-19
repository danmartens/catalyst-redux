// @flow

import { put, call } from 'redux-saga/effects';

export default function sagaForAsyncFunction(asyncFunction: *) {
  return function*(action: {
    type: string,
    status: null | string,
    payload: Object
  }): Generator<*, *, *> {
    if (action.status === null) {
      yield put({
        type: action.type,
        status: 'pending',
        payload: action.payload
      });

      try {
        const result = yield call(asyncFunction, action);

        yield put({
          type: action.type,
          status: 'success',
          payload: result
        });
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error(error);
        }

        yield put({
          type: action.type,
          status: 'error',
          payload: error
        });
      }
    }
  };
}
