import { PartDefinition, PlateDefinition } from './../models';
import { Project } from '../models';
import parts from './parts.json'
import connectors from './connectors.json'
import conf from '../../conf' 

import mongoose from 'mongoose';
import {Connector} from '../models';

async function main() {
  try {
    const mongooseState = mongoose.connection.readyState;
    switch (mongooseState) {
      case 3:
      case 0:
      await mongoose.connect(
        conf.secret.mongoDB.url,
        {
          useNewUrlParser: true,
          user: conf.secret.mongoDB.username,
          pass: conf.secret.mongoDB.password, 
        }
      );
      break;
    }
  } catch(error) {
    
  }

  console.log('start import');

  const allPromises:any[] = [];

  const connectorIds = (await Connector.find({}).select('_id').exec()).map(
    v=>({
      _id:v._id,
      ctype: 'connector',
      part:null,
      connector: v._id,
    })
    );
  const partIds = (await PartDefinition.find({}).select('_id').exec()).map(
  v=>({
      _id:v._id,
      ctype: 'part',
      part:v._id,
      connector: null,
    })
    );

  const now = new Date();
  await PlateDefinition.create({
    content: [...connectorIds, ...partIds],
    createdAt: now,
    updatedAt: now,
    permission: 0x666,
    plateType: "384",
    name: 'default',
    barcode: '0000000',
    group:'',
  });

  await Promise.all(allPromises);

  console.log('finish')
}

main().then(()=>process.exit());