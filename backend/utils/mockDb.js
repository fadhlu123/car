const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to generate IDs
const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

class MockModel {
  constructor(modelName) {
    this.modelName = modelName;
    this.filePath = path.join(DATA_DIR, `${modelName.toLowerCase()}s.json`);
    this._initializeFile();
  }

  _initializeFile() {
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([]));
    }
  }

  _readData() {
    const data = fs.readFileSync(this.filePath, 'utf-8');
    return JSON.parse(data || '[]');
  }

  _writeData(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  async find(query = {}) {
    const data = this._readData();
    // Simple mock filter
    return data.filter(item => {
      let match = true;
      for (const key in query) {
        if (query[key] && query[key].$regex) {
          const regex = new RegExp(query[key].$regex, query[key].$options);
          if (!regex.test(item[key])) match = false;
        } else if (query[key] && typeof query[key] === 'object' && query[key].$gte !== undefined) {
           if (item[key] < query[key].$gte) match = false;
        } else if (query[key] && typeof query[key] === 'object' && query[key].$lte !== undefined) {
           if (item[key] > query[key].$lte) match = false;
        } else if (item[key] !== query[key]) {
          match = false;
        }
      }
      return match;
    }).map(item => ({...item, _id: item._id.toString()}));
  }

  async findById(id) {
    const data = this._readData();
    const item = data.find(i => i._id.toString() === id.toString());
    return item ? {...item, _id: item._id.toString()} : null;
  }

  async findOne(query = {}) {
    const results = await this.find(query);
    return results.length > 0 ? results[0] : null;
  }

  async create(payload) {
    const data = this._readData();
    const newItem = { _id: generateId(), createdAt: new Date().toISOString(), ...payload };
    data.push(newItem);
    this._writeData(data);
    return newItem;
  }

  async findByIdAndUpdate(id, updateData, options = {}) {
    const data = this._readData();
    const index = data.findIndex(i => i._id.toString() === id.toString());
    if (index !== -1) {
      data[index] = { ...data[index], ...updateData };
      this._writeData(data);
      return data[index];
    }
    return null;
  }

  async findByIdAndDelete(id) {
    const data = this._readData();
    const index = data.findIndex(i => i._id.toString() === id.toString());
    if (index !== -1) {
      const deleted = data.splice(index, 1)[0];
      this._writeData(data);
      return deleted;
    }
    return null;
  }
}

module.exports = MockModel;
