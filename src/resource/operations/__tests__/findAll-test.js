import axios from 'axios';
import { createResourceStore, nextState, Resources } from 'test-utils';

test('findAll operation', async () => {
  const store = createResourceStore();
  let state = store.getState();

  axios.__setNextResponse(
    'GET',
    {
      data: [
        {
          type: 'posts',
          id: '2',
          attributes: { title: 'Hello World' }
        }
      ]
    },
    200
  );

  await nextState(store, Resources.actions.findAll('posts'));

  state = store.getState();

  expect(Resources.selectors.resourcesStatus(state, 'posts')).toEqual(
    'find.pending'
  );

  await nextState(store);

  const posts = Resources.selectors.findAll(store.getState(), 'posts');

  expect(posts).toEqual([
    {
      id: '2',
      title: 'Hello World'
    }
  ]);
});

test('findAll operation failed', async () => {
  const store = createResourceStore();

  axios.__setNextResponse('GET', {}, 401);

  await nextState(store, Resources.actions.findAll('posts'));

  expect(
    Resources.selectors.resourcesStatus(store.getState(), 'posts')
  ).toEqual('find.pending');

  await nextState(store);

  expect(
    Resources.selectors.resourcesStatus(store.getState(), 'posts')
  ).toEqual('find.error');

  expect(Resources.selectors.findAll(store.getState(), 'posts')).toEqual([]);
});
