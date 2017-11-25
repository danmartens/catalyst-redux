import axios from 'axios';
import { createResourceStore, nextState, Resources } from 'test-utils';

test('find operation', async () => {
  const store = createResourceStore();
  const getPost = () => Resources.selectors.find(store.getState(), 'posts', 1);

  axios.__setNextResponse(
    'GET',
    {
      data: {
        type: 'posts',
        id: '1',
        attributes: { title: 'Something New' }
      }
    },
    200
  );

  await nextState(store, Resources.actions.find('posts', 1));

  expect(getPost().isLoading).toEqual(true);
  expect(getPost().isLoaded).toEqual(false);
  expect(getPost().isPending).toEqual(true);
  expect(getPost().isError).toEqual(false);

  await nextState(store);

  expect(getPost().isLoading).toEqual(false);
  expect(getPost().isLoaded).toEqual(true);
  expect(getPost().isPending).toEqual(false);
  expect(getPost().isError).toEqual(false);

  expect(getPost().id).toEqual('1');
  expect(getPost().title).toEqual('Something New');
});

test('find operation failed', async () => {
  const store = createResourceStore();
  const getPost = () => Resources.selectors.find(store.getState(), 'posts', 1);

  axios.__setNextResponse('GET', {}, 401);

  expect(getPost()).toEqual(null);

  await nextState(store, Resources.actions.find('posts', 1));

  expect(getPost().isPending).toEqual(true);

  await nextState(store);

  expect(
    Resources.selectors.resourceStatus(store.getState(), 'posts', 1)
  ).toEqual('find.error');

  expect(Resources.selectors.findAll(store.getState(), 'posts')).toEqual([]);
});
