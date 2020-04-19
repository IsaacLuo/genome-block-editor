import mongoose from "mongoose";
import conf from './conf.json';

import { MongoMemoryServer } from 'mongodb-memory-server';

interface IMemoryMongo {
  mongod?: any,
  uri?: string,
  port?: string,
  dbPath?: string,
  dbName?: string,
}

let memoryMongo:IMemoryMongo = {
}

export const startMongoMemoryServer = async () => {
  memoryMongo.uri = await memoryMongo.mongod.getUri();
  memoryMongo.port = await memoryMongo.mongod.getPort();
  memoryMongo.dbPath = await memoryMongo.mongod.getDbPath();
  memoryMongo.dbName = await memoryMongo.mongod.getDbName();
}

if (process.env.NODE_ENV === 'test') {
  memoryMongo.mongod = new MongoMemoryServer();
  startMongoMemoryServer();
}

export const getMemoeryServerInfo = ()=>memoryMongo;

export const connectMemoryMongoDB = async ()=> {
  try {
    if (memoryMongo.mongod) {
      await startMongoMemoryServer();
    }
    const mongooseState = mongoose.connection.readyState;
    console.log('memory mongo uri ', memoryMongo.uri);
    switch (mongooseState) {
      case 3:
      case 0:
      await mongoose.connect(
        memoryMongo.uri,
        {
          useNewUrlParser: true,
          // user: conf.secret.mongoDB.username,
          // pass: conf.secret.mongoDB.password, 
        }
      );
      break;
    }
  } catch(error) {
    throw(new Error('db connection error'));
  }
}

export const stopMongoMemoryServer = async () => {
  if (memoryMongo.mongod) {
    await memoryMongo.mongod.stop();
    memoryMongo = {};
  }
}


export const connectMongoDB = async () => {
  let mongoURL;
  console.log('process.env.NODE_ENV= ', process.env.NODE_ENV);
  if (process.env.NODE_ENV === 'test') {
    if (memoryMongo.mongod) {
      await startMongoMemoryServer();
    }
    // mongoURL = "mongodb://localhost:27017/genome_editor_test";
    mongoURL = memoryMongo.uri;
    console.log(`using memory mongo ${mongoURL}`);
  } else {
    mongoURL = conf.secret.mongoDB.url;
  }

  try {
    const mongooseState = mongoose.connection.readyState;
    switch (mongooseState) {
      case 3:
      case 0:
      await mongoose.connect(
        mongoURL,
        {
          useNewUrlParser: true,
          // user: conf.secret.mongoDB.username,
          // pass: conf.secret.mongoDB.password, 
        }
      );
      break;
    }
  } catch(error) {
    throw(new Error('db connection error'));
  }
}

export default connectMongoDB;