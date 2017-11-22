// @flow

import { map, reduce, snakeCase } from 'lodash';

export default function buildFindQuery({
  include,
  filter
}: {
  include?: Array<string>,
  filter?: { [string]: string | number | boolean | null }
}): string {
  let query = {};

  if (include != null) {
    query.include = include.join(',');
  }

  if (filter != null) {
    query = reduce(
      filter,
      (reduction, value, key) => {
        reduction[`filter[${snakeCase(key)}]`] = value.toString();
        return reduction;
      },
      query
    );
  }

  if (Object.keys(query).length > 0) {
    return `?${map(query, (value, key) => {
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    }).join('&')}`;
  } else {
    return '';
  }
}
