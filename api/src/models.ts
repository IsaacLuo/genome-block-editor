import mongoose, { Model, Document } from 'mongoose'
import {Schema} from 'mongoose'

export const UserSchema = new Schema({
  email: String,
  name: String, // user's full name
  groups: [String], // array of group name, 'guest', 'users', 'visitors', or 'administrators'
  lastLogin: Date,
  lastIP: String,
});

export interface IUserModel extends IUser, Document{

}

export const User:Model<IUserModel> = mongoose.model('User', UserSchema, 'users');

export const AnnotationSchema = new Schema({
  featureType: String,
  species: String,
  chrId: Number,
  chrName: String,
  start: Number,
  end: Number,
  strand: String,
  sequence: String,
  original: Boolean,
  origin: {
    type: Schema.Types.ObjectId,
    ref: 'Annotation',
  },
});



export interface IAnnotationModel extends IAnnotation, Document {}
export const Connector:Model<IAnnotationModel> = mongoose.model('Annotation', AnnotationSchema, 'annotations');

export const ProjectSchema = new Schema({
  name: String,
  version: String,
  parts: [{
    type: Schema.Types.ObjectId,
    ref: 'AnnotationSchema',
  }],
  owner: {
    type:Schema.Types.ObjectId,
    ref: 'User'
  },
  group: String,
  permission: Number,
  createdAt: Date,
  updatedAt: Date,
  history: [Schema.Types.ObjectId],
});

export interface IProjectModel extends IProject, Document{}
export const Project:Model<IProjectModel> = mongoose.model('Project', ProjectSchema, 'projects');