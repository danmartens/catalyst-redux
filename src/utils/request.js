// @flow

import axios from 'axios';
import { kebabCase, camelCase } from 'lodash';

import deepTransformKeys from './deepTransformKeys';

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
