const { MiddlewareFunction, NextFunction } = require('middy');

const closeDb = () => {
  return {
    after: async (handler, next) => {
      const { client } = handler.context;
      if (client && client.query && typeof client.query === 'function') {
        console.log(JSON.stringify("closing db connection"));
        await client.end();
        delete handler.context.client;
      }
      next();
    },
  };
};

module.exports = { closeDb };
