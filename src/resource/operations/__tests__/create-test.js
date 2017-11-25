import axios from 'axios';
import { createResourceStore, nextState, Resources } from 'test-utils';

test('create operation', async () => {
  const store = createResourceStore();
  const action = Resources.actions.create('posts', { title: 'Hello World' });
  const getPost = () => Resources.selectors.find(store.getState(), 'posts', 1);

  axios.__setNextResponse(
    'POST',
    {
      data: {
        type: 'posts',
        id: '1',
        attributes: { title: 'Hello World' }
      }
    },
    201
  );

  await nextState(store, action);

  expect(
    Resources.selectors.newResourceStatus(
      store.getState(),
      'posts',
      action.payload.clientID
    )
  ).toEqual('create.pending');

  expect(getPost()).toEqual(null);

  await nextState(store);

  expect(
    Resources.selectors.newResourceStatus(
      store.getState(),
      'posts',
      action.payload.clientID
    )
  ).toEqual('create.success');

  expect(getPost().id).toEqual('1');
  expect(getPost().title).toEqual('Hello World');
  expect(getPost().isPending).toEqual(false);
  expect(getPost().isError).toEqual(false);
});

test('create operation failed', async () => {
  const store = createResourceStore();
  const action = Resources.actions.create('posts', { title: 'Hello World' });

  axios.__setNextResponse('POST', {}, 422);

  await nextState(store, action);

  expect(
    Resources.selectors.newResourceStatus(
      store.getState(),
      'posts',
      action.payload.clientID
    )
  ).toEqual('create.pending');

  await nextState(store);

  expect(
    Resources.selectors.newResourceStatus(
      store.getState(),
      'posts',
      action.payload.clientID
    )
  ).toEqual('create.error');

  expect(
    Resources.selectors.resourceForClientID(
      store.getState(),
      'posts',
      action.payload.clientID
    )
  ).toEqual(null);

  expect(Resources.selectors.findAll(store.getState(), 'posts')).toEqual([]);
});
