import * as React from 'react';
import { Provider } from 'react-redux';
import axios from 'axios';
import { shallow, mount, configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import {
  createResourceStore,
  nextState,
  Resources,
  stateWithData
} from 'test-utils';

import connectResource from '../connectResource';

configure({ adapter: new Adapter() });

class TestComponent extends React.Component {
  render() {
    return null;
  }
}

const ConnectedTestComponent = connectResource(Resources, 'posts')(
  TestComponent
);

test('connectResource for new resouce', async () => {
  const store = createResourceStore(stateWithData);
  const wrapper = mount(<ConnectedTestComponent store={store} />);

  const getTestComponentWrapper = () => wrapper.childAt(0).childAt(0);

  expect(getTestComponentWrapper().prop('resource')).toEqual(null);

  axios.__setNextResponse(
    'POST',
    {
      data: {
        type: 'posts',
        id: '2',
        attributes: { title: 'Newly Created Post!' }
      }
    },
    201
  );

  getTestComponentWrapper().prop('onCreate')({
    title: 'Newly Created Post'
  });

  await nextState(store);

  wrapper.update();

  expect(getTestComponentWrapper().prop('resource')).not.toEqual(null);
  expect(getTestComponentWrapper().prop('resource')).toBe(
    Resources.selectors.find(store.getState(), 'posts', 2)
  );
});

test('connectResource for existing resouce', async () => {
  const store = createResourceStore(stateWithData);
  const wrapper = mount(
    <ConnectedTestComponent store={store} resourceID={1} />
  );
  const getTestComponentWrapper = () => wrapper.childAt(0).childAt(0);

  expect(getTestComponentWrapper().prop('resource')).toBe(
    Resources.selectors.find(store.getState(), 'posts', 1)
  );

  axios.__setNextResponse(
    'PATCH',
    {
      data: {
        type: 'posts',
        id: '1',
        attributes: { title: 'Newly Updated Post!' }
      }
    },
    201
  );

  getTestComponentWrapper().prop('onUpdate')({
    title: 'Newly Updated Post!'
  });

  await nextState(store);

  wrapper.update();

  expect(getTestComponentWrapper().prop('resource')).toBe(
    Resources.selectors.find(store.getState(), 'posts', 1)
  );

  expect(getTestComponentWrapper().prop('resource').title).toBe(
    'Newly Updated Post!'
  );
});

test('connectResource for destroying a resouce', async () => {
  const store = createResourceStore(stateWithData);
  const wrapper = mount(
    <ConnectedTestComponent store={store} resourceID={1} />
  );
  const getTestComponentWrapper = () => wrapper.childAt(0).childAt(0);

  expect(getTestComponentWrapper().prop('resource')).toBe(
    Resources.selectors.find(store.getState(), 'posts', 1)
  );

  axios.__setNextResponse('DELETE', {}, 200);

  expect(getTestComponentWrapper().prop('resource').isDestroyed).toEqual(false);

  getTestComponentWrapper().prop('onDestroy')();

  await nextState(store);

  wrapper.update();

  expect(getTestComponentWrapper().prop('resource').isDestroyed).toEqual(true);
});
