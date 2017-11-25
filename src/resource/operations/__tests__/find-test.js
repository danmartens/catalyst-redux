import axios from 'axios';
import { createResourceStore, nextState, Resources } from 'test-utils';

test('find operation', async () => {
  const store = createResourceStore();
  let state = store.getState();

  axios.__setNextResponse(
    'GET',
    {
      data: {
        type: 'posts',
        id: '3',
        attributes: { title: 'Something New' }
      }
    },
    200
  );

  await nextState(store, Resources.actions.find('posts', 3));

  state = store.getState();

  expect(Resources.selectors.resourceStatus(state, 'posts', 3)).toEqual(
    'find.pending'
  );

  await nextState(store);

  expect(Resources.selectors.find(store.getState(), 'posts', 3)).toEqual({
    id: '3',
    title: 'Something New'
  });
});

test('find operation failed', async () => {
  const store = createResourceStore();

  axios.__setNextResponse('GET', {}, 401);

  await nextState(store, Resources.actions.find('posts', 4));

  expect(
    Resources.selectors.resourceStatus(store.getState(), 'posts', 4)
  ).toEqual('find.pending');

  await nextState(store);

  expect(
    Resources.selectors.resourceStatus(store.getState(), 'posts', 4)
  ).toEqual('find.error');

  expect(Resources.selectors.findAll(store.getState(), 'posts')).toEqual([]);
});
