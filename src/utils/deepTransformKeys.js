// @flow

export default function deepTransformKeys<O: mixed>(
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
