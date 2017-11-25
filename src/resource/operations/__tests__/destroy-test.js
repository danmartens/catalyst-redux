import axios from 'axios';
import {
  createResourceStore,
  nextState,
  Resources,
  stateWithData
} from 'test-utils';

test('destroy operation', async () => {
  const store = createResourceStore(stateWithData);
  let state = store.getState();

  expect(Resources.selectors.findAll(state, 'posts')).toEqual([
    {
      id: '1',
      title: 'First Post'
    }
  ]);

  axios.__setNextResponse('DELETE', {}, 200);

  await nextState(store, Resources.actions.destroy('posts', '1'));

  state = store.getState();

  expect(Resources.selectors.resourceStatus(state, 'posts', '1')).toEqual(
    'destroy.pending'
  );

  await nextState(store);

  state = store.getState();

  expect(Resources.selectors.resourceStatus(state, 'posts', '1')).toEqual(
    'destroy.success'
  );

  expect(Resources.selectors.findAll(state, 'posts')).toEqual([]);
});

test('destroy operation failed', async () => {
  const store = createResourceStore(stateWithData);

  expect(Resources.selectors.findAll(store.getState(), 'posts')).toEqual([
    {
      id: '1',
      title: 'First Post'
    }
  ]);

  axios.__setNextResponse('DELETE', {}, 401);

  await nextState(store, Resources.actions.destroy('posts', '1'));

  expect(
    Resources.selectors.resourceStatus(store.getState(), 'posts', '1')
  ).toEqual('destroy.pending');

  await nextState(store);

  // expect(
  //   Resources.selectors.resourceStatus(store.getState(), 'posts', '1')
  // ).toEqual('destroy.error');

  expect(Resources.selectors.findAll(store.getState(), 'posts')).toEqual([
    {
      id: '1',
      title: 'First Post'
    }
  ]);
});
