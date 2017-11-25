import axios from 'axios';
import { createResourceStore, nextState, Resources } from 'test-utils';

test('findAll operation', async () => {
  const store = createResourceStore();
  const getPosts = () => Resources.selectors.findAll(store.getState(), 'posts');

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

  expect(
    Resources.selectors.resourcesStatus(store.getState(), 'posts')
  ).toEqual('find.pending');

  await nextState(store);

  const posts = Resources.selectors.findAll(store.getState(), 'posts');

  expect(getPosts()[0].id).toEqual('2');
  expect(getPosts()[0].title).toEqual('Hello World');
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
