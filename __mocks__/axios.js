let nextResponse = {};

const mock = {
  __setNextResponse(verb, data, status = 200) {
    nextResponse.verb = verb.toUpperCase();
    nextResponse.status = status;
    nextResponse.data = data;
  },

  create() {
    return mock;
  },

  get() {
    if (nextResponse.verb === 'GET') {
      if (nextResponse.status < 400) {
        return Promise.resolve({
          status: nextResponse.status,
          data: nextResponse.data
        });
      } else {
        return Promise.reject({
          status: nextResponse.status,
          data: nextResponse.data
        });
      }
    } else {
      return Promise.reject({});
    }

    nextResponse = {};
  },

  post() {
    if (nextResponse.verb === 'POST') {
      if (nextResponse.status < 400) {
        return Promise.resolve({
          status: nextResponse.status,
          data: nextResponse.data
        });
      } else {
        return Promise.reject({
          status: nextResponse.status,
          data: nextResponse.data
        });
      }
    } else {
      return Promise.reject({});
    }

    nextResponse = {};
  },

  patch() {
    if (nextResponse.verb === 'PATCH') {
      if (nextResponse.status < 400) {
        return Promise.resolve({
          status: nextResponse.status,
          data: nextResponse.data
        });
      } else {
        return Promise.reject({
          status: nextResponse.status,
          data: nextResponse.data
        });
      }
    } else {
      return Promise.reject({});
    }

    nextResponse = {};
  },

  delete() {
    if (nextResponse.verb === 'DELETE') {
      if (nextResponse.status < 400) {
        return Promise.resolve({
          status: nextResponse.status,
          data: nextResponse.data
        });
      } else {
        return Promise.reject({
          status: nextResponse.status,
          data: nextResponse.data
        });
      }
    } else {
      return Promise.reject({});
    }

    nextResponse = {};
  }
};

module.exports = mock;
