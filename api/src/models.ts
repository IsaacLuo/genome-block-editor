/// <reference path="@types/index.d.ts" />
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
  strand: Number,
  sequence: String,
  name: String,
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
    ref: 'AnnotationPart',
  }],
  len: Number,
  owner: {
    type:Schema.Types.ObjectId,
    ref: 'User'
  },
  group: String,
  permission: Number,
  history: [Schema.Types.ObjectId],
  ctype: String,
}, {
  timestamps: true
});

export interface IProjectModel extends IProject, Document{}
export const Project:Model<IProjectModel> = mongoose.model('Project', ProjectSchema, 'projects');

export const ProjectFolderSchema = new Schema({
  name: String,
  subFolders: [{
    type: Schema.Types.ObjectId,
    ref: 'ProjectFolder',
  }],
  projects: [{
    type: Schema.Types.ObjectId,
    ref: 'Project',
  }]
})

export interface IProjectFolderModel extends IProjectFolder, Document{}
export const ProjectFolder:Model<IProjectFolderModel> = mongoose.model('ProjectFolder', ProjectFolderSchema, 'project_folders');