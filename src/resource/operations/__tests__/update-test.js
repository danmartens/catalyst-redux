import axios from 'axios';
import {
  createResourceStore,
  nextState,
  Resources,
  stateWithData
} from 'test-utils';

test('update operation', async () => {
  const store = createResourceStore(stateWithData);
  let state = store.getState();

  expect(Resources.selectors.findAll(state, 'posts')).toEqual([
    {
      id: '1',
      title: 'First Post'
    }
  ]);

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

  state = store.getState();

  expect(Resources.selectors.resourceStatus(state, 'posts', '1')).toEqual(
    'update.pending'
  );

  await nextState(store);

  state = store.getState();

  expect(Resources.selectors.resourceStatus(state, 'posts', '1')).toEqual(
    'update.success'
  );

  expect(Resources.selectors.findAll(state, 'posts')).toEqual([
    {
      id: '1',
      title: 'First Post Edited'
    }
  ]);
});

test('update operation failed', async () => {
  const store = createResourceStore(stateWithData);
  let state = store.getState();

  expect(Resources.selectors.findAll(state, 'posts')).toEqual([
    {
      id: '1',
      title: 'First Post'
    }
  ]);

  axios.__setNextResponse('PATCH', {}, 422);

  await nextState(
    store,
    Resources.actions.update('posts', '1', {
      title: 'First Post Edited'
    })
  );

  state = store.getState();

  expect(Resources.selectors.resourceStatus(state, 'posts', '1')).toEqual(
    'update.pending'
  );

  await nextState(store);

  state = store.getState();

  expect(Resources.selectors.resourceStatus(state, 'posts', '1')).toEqual(
    'update.error'
  );

  expect(Resources.selectors.findAll(state, 'posts')).toEqual([
    {
      id: '1',
      title: 'First Post'
    }
  ]);
});
