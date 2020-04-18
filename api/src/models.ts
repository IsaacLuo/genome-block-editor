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

export const SequenceRefSchema = new Schema({
  fileName: String,
  start: Number,
  end: Number,
  strand: Number,
})

export const AnnotationPartSchema = new Schema({
  featureType: String,
  chrId: Number,
  chrName: String,
  start: Number,
  end: Number,
  len: Number,
  strand: Number,
  // extendted attributes
  name: String,
  original: Boolean,
  
  origin: {
    type: Schema.Types.ObjectId,
    ref: 'AnnotationPart',
  },
  history: [{
    _id:Schema.Types.ObjectId,
    updatedAt: Date,
    changelog: String,
  }],
  // md5 of the sequence
  // to identify if the sequence has changed
  // if the sequence keeps the same, 
  sequenceHash: String,
  // sequence reference points a part of sequence file, the start end, and strand may are the same as the main attributes, but it can also be not the same.
  // if the annoations is moved, and the sequenceRef will keep pointing the old position of the old sequence until the new sequence is generated.
  sequenceRef: SequenceRefSchema,
  
  // if built, all parts must share the same sequenceRef from project.
  built: Boolean,
  
  parent: {
    type: Schema.Types.ObjectId,
    ref: 'AnnotationPart',
  },
  attribute: Schema.Types.Mixed,
  createdAt: Date,
  updatedAt: Date,
  changelog: String,
});

export interface IAnnotationPartModel extends IAnnotationPart, Document {
}
export const AnnotationPart:Model<IAnnotationPartModel> = mongoose.model('AnnotationPart', AnnotationPartSchema, 'annotation_parts');

export const ProjectSchema = new Schema({
  name: String,
  projectId: Schema.Types.ObjectId,
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
  group: [String],
  permission: Number,
  history: [{
    _id:Schema.Types.ObjectId,
    updatedAt: Date,
    changelog: String,
  }],
  ctype: String,
  // md5 of the sequence
  // to identify if the sequence has changed
  // if the sequence keeps the same, 
  sequenceHash: String,
  // sequence reference points a part of sequence file, the start end, and strand may are the same as the main attributes, but it can also be not the same.
  // if the annoations is moved, and the sequenceRef will keep pointing the old position of the old sequence until the new sequence is generated.
  sequenceRef: SequenceRefSchema,
  createdAt: Date,
  updatedAt: Date,
  changelog: String,
}, {
  timestamps: true
})
.pre<IProjectModel>('save', function (next){
  if (this.isModified) {
    this.updatedAt = new Date();
  }
  next();
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