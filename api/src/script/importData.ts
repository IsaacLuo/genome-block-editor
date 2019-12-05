/// <reference path="../@types/index.d.ts" />

import conf from '../../conf' 
import files from './files.json'
import gff from './BY4741.json'
import mongoose from 'mongoose';
import {Project, AnnotationPart, SourceChromosome} from '../models';

declare interface IAction {
  type: string;
  data: any;
}

declare interface IGLobalConfig {
  maxTubeDeleteLimit: number,
  host: string,
  port: number,
  publicURL?: string,
}

declare interface IUserEssential {
  _id: any,
  email: string,
  name: string, // user's full name
  groups: string[], // array of group name, 'guest', 'users', 'visitors', or 'administrators'
}

declare interface ITokenContent extends IUserEssential{
  iat:number,
  exp:number,
}

declare interface IUser extends IUserEssential {
  lastLogin?: Date,
  lastIP?: string,
}

declare interface ICustomState {
  user?: ITokenContent,
  data?: any,
}

interface IAnnotationPart {
  _id: any;
  featureType: string;
  species: string;
  chrId: number;
  chrName: string;
  start: number;
  end: number;
  strand: string;
  original: boolean;
  origin?: string|IAnnotationPart;
}

declare interface IProject {
  _id: any;
  name: string,
  version: string,
  parts: Array<IAnnotationPart>,
  owner: IUser,
  group: string,
  permission: Number,
  createdAt: Date,
  updatedAt: Date,
  history: [any],
}

declare interface ISourceChomosome {
  _id: any;
  name: string,
  version: string,
  parts: Array<IAnnotationPart>,
  len: number,
  owner: IUser,
  group: string,
  permission: Number,
  createdAt: Date,
  updatedAt: Date,
}

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

  await AnnotationPart.deleteMany({}).exec();
  await Project.deleteMany({}).exec();
  await SourceChromosome.deleteMany({}).exec();

  console.log('start import');

  const allPromises:any[] = [];

  const now = new Date();
  for (const chrName in files) {
    const chrFile = files[chrName];
    const len = gff.fasta[chrName].length;
    if (chrFile.attribute && chrFile.attribute.Alias) {
      chrFile.name = chrFile.attribute.Alias;
    }
    const parts = await AnnotationPart.create(chrFile);
    await SourceChromosome.create({
      name: chrName,
      parts,
      len,
      group: 'all',
      permission: 0x666,
      createdAt: now,
      updatedAt: now,
    })
  }
  console.log('finish')
}

main().then(()=>process.exit());