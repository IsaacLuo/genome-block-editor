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

export const AnnotationPartSchema = new Schema({
  featureType: String,
  species: String,
  chrId: Number,
  chrName: String,
  start: Number,
  end: Number,
  len: Number,
  strand: String,
  sequence: String,
  original: Boolean,
  origin: {
    type: Schema.Types.ObjectId,
    ref: 'AnnotationPart',
  },
  attribute: Schema.Types.Mixed,
});



export interface IAnnotationPartModel extends IAnnotationPart, Document {}
export const AnnotationPart:Model<IAnnotationPartModel> = mongoose.model('AnnotationPart', AnnotationPartSchema, 'annotation_parts');

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

export const SourceChromosomeSchema = new Schema({
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
});

export interface ISourceChomosomeModel extends ISourceChomosome, Document{}
export const SourceChromosome:Model<ISourceChomosomeModel> = mongoose.model('SourceChomosome', SourceChromosomeSchema, 'source_chromosomes');