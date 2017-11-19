// @flow

import { takeEvery } from 'redux-saga/effects';

export default function sagaForActionType(saga: *, actionType: string) {
  return function*(): Generator<*, *, *> {
    yield takeEvery(actionType, saga);
  };
}
