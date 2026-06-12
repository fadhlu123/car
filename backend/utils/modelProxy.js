const MockModel = require('./mockDb');

const createModelProxy = (modelName, mongooseModel) => {
  const mockDbInstance = new MockModel(modelName);
  
  return new Proxy({}, {
    get(target, prop) {
      if (global.USE_MOCK_DB) {
        if (typeof mockDbInstance[prop] === 'function') {
          return mockDbInstance[prop].bind(mockDbInstance);
        }
        return mockDbInstance[prop];
      } else {
        if (typeof mongooseModel[prop] === 'function') {
          return mongooseModel[prop].bind(mongooseModel);
        }
        return mongooseModel[prop];
      }
    }
  });
};

module.exports = createModelProxy;
