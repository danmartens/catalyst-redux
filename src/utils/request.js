// @flow

import axios from 'axios';
import { kebabCase, camelCase } from 'lodash';

export default axios.create({
  headers: {
    'Content-Type': 'application/vnd.api+json',
    Accept: 'application/vnd.api+json'
  },
  transformRequest: [
    (data, headers: Object): string => {
      return JSON.stringify(deepTransformKeys(kebabCase, data));
    }
  ],
  transformResponse: [
    function(data) {
      return deepTransformKeys(camelCase, JSON.parse(data));
    }
  ]
});

function deepTransformKeys<O: mixed>(
  transformKey: string => string,
  object: O
): O {
  if (Array.isArray(object)) {
    return object.map(o => deepTransformKeys(transformKey, o));
  } else if (object != null && typeof object === 'object') {
    const transformedObject = {};

    for (const [key, value] of Object.entries(object)) {
      transformedObject[transformKey(key)] = deepTransformKeys(
        transformKey,
        value
      );
    }

    // $FlowFixMe
    return transformedObject;
  } else {
    return object;
  }
}
