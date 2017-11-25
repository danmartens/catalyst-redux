import axios from 'axios';
import {
  createResourceStore,
  nextState,
  Resources,
  stateWithData
} from 'test-utils';

test('destroy operation', async () => {
  const store = createResourceStore(stateWithData);
  const getPost = () => Resources.selectors.find(store.getState(), 'posts', 1);

  axios.__setNextResponse('DELETE', {}, 200);

  await nextState(store, Resources.actions.destroy('posts', '1'));

  expect(getPost().isPending).toEqual(true);
  expect(getPost().isDestroying).toEqual(true);

  await nextState(store);

  expect(getPost().isPending).toEqual(false);
  expect(getPost().isError).toEqual(false);
  expect(getPost().isDestroying).toEqual(false);
  expect(getPost().isDestroyed).toEqual(true);
});

test('destroy operation failed', async () => {
  const store = createResourceStore(stateWithData);
  const getPost = () => Resources.selectors.find(store.getState(), 'posts', 1);

  axios.__setNextResponse('DELETE', {}, 401);

  await nextState(store, Resources.actions.destroy('posts', '1'));

  expect(getPost().isPending).toEqual(true);
  expect(getPost().isDestroying).toEqual(true);

  await nextState(store);

  expect(getPost().isPending).toEqual(false);
  expect(getPost().isError).toEqual(true);
  expect(getPost().isDestroying).toEqual(false);
  expect(getPost().isDestroyed).toEqual(false);

  expect(getPost().id).toEqual('1');
  expect(getPost().title).toEqual('First Post');
});
