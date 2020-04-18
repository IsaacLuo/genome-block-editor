import mongoose from "mongoose";
import conf from './conf.json';

export const connectMongoDB = async () => {

  let mongoURL;
  if (process.env.NODE_ENV === 'test') {
    mongoURL = "mongodb://localhost:27017/genome_editor_test";
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