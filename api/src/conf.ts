import conf from './conf.json'

if (process.env.NODE_ENV === 'test') {
  conf.secret.mongoDB.url = 'mongodb://localhost:27017/genome_editor_test';
  conf.rootStorageFolder = 'public/test'
}

export default conf;


