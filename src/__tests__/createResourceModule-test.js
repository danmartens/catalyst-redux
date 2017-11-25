import axios from 'axios';
import {
  createResourceStore,
  nextState,
  Resources,
  initialState,
  stateWithData
} from 'test-utils';

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
