import axios from 'axios';
import { createStore, applyMiddleware, combineReducers } from 'redux';
import createSagaMiddleware from 'redux-saga';
import createResourceModule from '../createResourceModule';

const Resources = createResourceModule({
  resourceTypes: ['posts', 'comments']
})('resources');
const initialState = Resources.reducer();
const findAllType = Resources.actions.findAll('posts').type;

const payload = {
  resourceType: 'posts',
  data: [
    {
      type: 'posts',
      id: '1',
      attributes: {
        title: 'First Post'
      },
      relationships: {
        comments: {
          data: [{ type: 'comments', id: '1' }, { type: 'comments', id: '2' }]
        }
      }
    }
  ],
  included: [
    {
      type: 'comments',
      id: '1',
      attributes: {
        content: 'First Comment'
      },
      relationships: {
        post: {
          data: { type: 'posts', id: '1' }
        }
      }
    },
    {
      type: 'comments',
      id: '2',
      attributes: {
        content: 'Second Comment'
      },
      relationships: {
        post: {
          data: { type: 'posts', id: '1' }
        }
      }
    }
  ]
};

const action = {
  type: findAllType,
  status: 'success',
  payload
};

const stateWithData = Resources.reducer(initialState, action);

function createResourceStore(initialResourcesState = initialState) {
  const sagaMiddleware = createSagaMiddleware();
  const store = createStore(
    combineReducers({ [Resources.name]: Resources.reducer }),
    { [Resources.name]: initialResourcesState },
    applyMiddleware(sagaMiddleware)
  );

  sagaMiddleware.run(Resources.saga);

  return store;
}

function nextState(store, action) {
  return new Promise(resolve => {
    const unsubscribe = store.subscribe(() => {
      unsubscribe();
      resolve();
    });

    if (action != null) {
      store.dispatch(action);
    }
  });
}

test('builds an initial state', () => {
  expect(initialState).toEqual({
    resources: { posts: {}, comments: {} },
    resourceStatus: { posts: {}, comments: {} },
    resourceRelationships: { posts: {}, comments: {} },
    newResources: { posts: {}, comments: {} },
    newResourceStatus: { posts: {}, comments: {} },
    newResourceIDMap: { posts: {}, comments: {} }
  });
});

test('adds resources to the state', () => {
  const store = createResourceStore(stateWithData);
  const posts = Resources.selectors.findAll(store.getState(), 'posts');

  expect(posts).toEqual([
    {
      id: '1',
      title: 'First Post'
    }
  ]);
});

test('find returns the same object across multiple calls with the same state', () => {
  const store = createResourceStore(stateWithData);
  const firstPost = Resources.selectors.find(store.getState(), 'posts', '1');

  expect(firstPost.id).toEqual('1');
  expect(firstPost.title).toEqual('First Post');

  expect(firstPost).toBe(
    Resources.selectors.find(store.getState(), 'posts', '1')
  );
});

test('find returns a new object if the state changes', () => {
  const store = createResourceStore(stateWithData);
  const firstPost = Resources.selectors.find(store.getState(), 'posts', '1');

  store.dispatch({
    type: findAllType,
    status: 'success',
    payload
  });

  expect(firstPost).not.toBe(
    Resources.selectors.find(store.getState(), 'posts', '1')
  );
});

test('find returns an object with relationships', () => {
  const store = createResourceStore(stateWithData);

  const firstPost = Resources.selectors.find(store.getState(), 'posts', '1');

  const firstComment = Resources.selectors.find(
    store.getState(),
    'comments',
    '1'
  );

  const secondComment = Resources.selectors.find(
    store.getState(),
    'comments',
    '2'
  );

  expect(firstComment.id).toEqual('1');
  expect(firstComment.content).toEqual('First Comment');

  expect(secondComment.id).toEqual('2');
  expect(secondComment.content).toEqual('Second Comment');

  expect(firstPost.comments[0]).toBe(firstComment);
  expect(firstPost.comments[1]).toBe(secondComment);

  expect(firstComment.post).toBe(firstPost);
  expect(secondComment.post).toBe(firstPost);
});

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

test('create operation', async () => {
  const store = createResourceStore();
  const action = Resources.actions.create('posts', { title: 'Hello World' });

  axios.__setNextResponse(
    'POST',
    {
      data: {
        type: 'posts',
        id: '2',
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

  await nextState(store);

  expect(
    Resources.selectors.newResourceStatus(
      store.getState(),
      'posts',
      action.payload.clientID
    )
  ).toEqual('create.success');

  expect(
    Resources.selectors.resourceForClientID(
      store.getState(),
      'posts',
      action.payload.clientID
    )
  ).toEqual({
    id: '2',
    title: 'Hello World'
  });

  expect(Resources.selectors.findAll(store.getState(), 'posts')).toEqual([
    {
      id: '2',
      title: 'Hello World'
    }
  ]);
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
