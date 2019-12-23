/// <reference path="../@types/index.d.ts" />
import conf from '../../conf'
import mongoose from 'mongoose';
import {Project, AnnotationPart, IAnnotationPartModel} from '../models';

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
  strand: number;
  original: boolean;
  origin?: string|IAnnotationPart;
  sequence: string;
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

  console.log('start import');
  const allPromises:any[] = [];
  const now = new Date();
  // const projects = await Project.find({ctype:'source'}).exec();
  // for (const project of projects) {
  //   const partListP = project.parts
  //   .map(async (partId) => AnnotationPart.findOne({_id:partId}).select('_id start end').exec())
  //   const partList = (await Promise.all(partListP)) as IAnnotationPartModel[];
  //   partList.sort((a,b)=>a.start < b.start? -1: a.start > b.start? 1 : 0);
  //   const newPartList = [];
  //   const partListLen = partList.length;
  //   for (const i in partList) {
  //     if (i === '0' && partList[i].start > 0) {
  //       AnnotationPart.create({
  //         featureType: 'unknown',
  //         chrId: partList[i].chrId,
  //         chrName: partList[i].chrName,
  //         start: 0,
  //         end: partList[i].start,
  //         strand: 0,
  //         original: true,
  //         sequence: string,
  //       })
  //       newPartList.push({
          
  //       })
  //     }
  //   }
  //   project.parts = partList.map(v=>v._id)
  //   await project.save();
  }
  console.log('finish')
}

main().then(()=>process.exit());