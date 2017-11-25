# Catalyst Redux

State management utilities for Redux.

⚠️ Definitely a WIP ⚠️

## Operations

The simplest Operation is just an action type and a reducer:

```javascript
import { createOperation } from 'catalyst-redux';

const increment = createOperation({
  actionType: 'INCREMENT',
  reducer: state => state + 1
})
```

You can customize the action creator if you want:

```javascript
import { createOperation } from 'catalyst-redux';

const increment = Operation({
  actionType: 'INCREMENT',
  actionCreator: amount => ({ payload: { amount } }),
  reducer: (state, action) => state + action.payload.amount
});
```

## Asynchronous Operations

Sometimes an Operation needs to handle some asynchronous logic (e.g. making a
request to your API and then storing the response). This is almost as simple to
write as a synchronous operation:

```javascript
import { createAsyncOperation } from 'catalyst-redux';

const fetchArticles = createAsyncOperation({
  actionType: 'FETCH_ARTICLES',
  reducer: (state, action) => {
    switch (action.status) {
      case 'pending': {
        return {
          ...state,
          fetchStatus: 'pending'
        };
      }

      case 'success': {
        return {
          ...state,
          fetchStatus: 'success',
          articles: action.payload.data
        };
      }

      case 'error': {
        return {
          ...state,
          fetchStatus: 'error'
        };
      }
    }

    return state;
  },
  request: () => axios.get('/api/articles').then(({ data }) => data)
});
```

## Modules

Operations can be composed into a Module. A Module contains the reducer, saga,
action creators, and selectors for a specific "slice" of your application state.

Here's a counter Module with an initial state of `0`:

```javascript
import { createModule, createOperation } from 'catalyst-redux';

const Counter = createModule({
  initialState: 0,
  operations: {
    increment: createOperation({
      actionType: 'INCREMENT',
      reducer: state => state + 1
    }),
    decrement: createOperation({
      actionType: 'DECREMENT',
      reducer: state => state - 1
    })
  },
  selectors: {
    getState: (state) => state
  }
})('counter');
```

The created module has the following API:

```javascript
Counter.reducer(state, action)
Counter.saga()
Counter.actions.increment()
Counter.actions.decrement()
Counter.selectors.getState(state)
```

## Resource Modules

Resource modules consist of a predefined group of operations and selectors which
allow you to interact with a JSON API.

Resource modules require information about the types of resources you want to
interact with and how to construct requests for them:

```javascript
import { createResourceModule } from 'catalyst-redux';

const Blog = createResourceModule({
  resourceTypes: ['posts', 'comments']
})('resources');
```

This would provide you with the following API for interacting with posts and
comments:

```javascript
Blog.actions.findAll(resourceType);
Blog.actions.find(resourceType, resourceID, options);
Blog.actions.create(resourceType, attributes, options);
Blog.actions.update(resourceType, resourceID, attributes, options);
Blog.actions.destroy(resourceType, resourceID);

Blog.selectors.findAll(resourceType);
Blog.selectors.find(resourceType, resourceID);
Blog.selectors.resourceStatus(resourceType, resourceID);
```

In this case, the "resourceType" argument could be either `'posts'` or `'comments'`.

### Actions

#### `find(resourceType: string, resourceID: number | string, ?options: Object)`

Example:

```javascript
Blog.actions.find('posts', 1, {
  filter: {
    authorId: 7
  },
  include: ['comments']
});
```

#### `create(resourceType: string, attributes: Object, ?options: Object)`

Example:

```javascript
Blog.actions.create('comments',
  { content: 'First!' },
  {
    relationships: {
      post: { type: 'posts', id: '1' }
    }
  }
);
```

#### `update(resourceType: string, resourceID: number | string, attributes: Object, ?options: Object)`

Example:

```javascript
Blog.actions.update('comments', 6,
  { content: 'Something meaningful.' },
  {
    relationships: {
      post: { type: 'posts', id: '1' }
    }
  }
);
```
## connectResource HOC

```javascript
import { createResourceModule, connectResource } from 'catalyst-redux';

const Resources = createResourceModule({
  resourceTypes: ['comments']
})('resources');

class CommentForm extends React.PureComponent {
  state = { content: '' };

  handleChange = (event) => {
    this.setState({ content: event.currentTarget.value });
  }

  handleSubmit = (event) => {
    event.preventDefault();

    this.props.onCreate({
      content: this.state.content
    });
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <textarea value={this.state.content} onChange={this.handleChange} />

        <button>Add Comment</button>
      </form>
    );
  }
}

const ConnectedCommentForm = connectResource(Resources, 'comments')(CommentForm);
```
