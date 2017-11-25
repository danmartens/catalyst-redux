import axios from 'axios';
import {
  createResourceStore,
  nextState,
  Resources,
  stateWithData
} from 'test-utils';

test('update operation', async () => {
  const store = createResourceStore(stateWithData);
  const getPost = () => Resources.selectors.find(store.getState(), 'posts', 1);

  axios.__setNextResponse(
    'PATCH',
    {
      data: {
        type: 'posts',
        id: '1',
        attributes: { title: 'First Post Edited' }
      }
    },
    200
  );

  await nextState(
    store,
    Resources.actions.update('posts', '1', {
      title: 'First Post Edited'
    })
  );

  expect(getPost().isUpdating).toEqual(true);
  expect(getPost().isPending).toEqual(true);

  await nextState(store);

  expect(getPost().isUpdating).toEqual(false);
  expect(getPost().isPending).toEqual(false);

  expect(getPost().id).toEqual('1');
  expect(getPost().title).toEqual('First Post Edited');
});

test('update operation failed', async () => {
  const store = createResourceStore(stateWithData);
  const getPost = () => Resources.selectors.find(store.getState(), 'posts', 1);

  axios.__setNextResponse('PATCH', {}, 422);

  await nextState(
    store,
    Resources.actions.update('posts', '1', {
      title: 'First Post Edited'
    })
  );

  expect(getPost().isUpdating).toEqual(true);
  expect(getPost().isPending).toEqual(true);

  await nextState(store);

  expect(getPost().isUpdating).toEqual(false);
  expect(getPost().isPending).toEqual(false);
  expect(getPost().isError).toEqual(true);
});
