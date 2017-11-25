import { createStore, applyMiddleware, combineReducers } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { createResourceModule } from 'src';

export const Resources = createResourceModule({
  resourceTypes: ['posts', 'comments']
})('resources');

export const initialState = Resources.reducer();
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

export const stateWithData = Resources.reducer(initialState, action);

export function createResourceStore(initialResourcesState = initialState) {
  const sagaMiddleware = createSagaMiddleware();
  const store = createStore(
    combineReducers({ [Resources.name]: Resources.reducer }),
    { [Resources.name]: initialResourcesState },
    applyMiddleware(sagaMiddleware)
  );

  sagaMiddleware.run(Resources.saga);

  return store;
}

export function nextState(store, action) {
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
