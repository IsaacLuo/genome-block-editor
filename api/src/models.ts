/// <reference path="@types/index.d.ts" />
export {}
import mongoose, { Model, Document, Schema } from 'mongoose';

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
  pid: Schema.Types.ObjectId, // part id, it will const equal the original pid
  featureType: String,
  chrId: Number,
  chrName: String,
  start: Number,
  end: Number,
  strand: Number,
  // extendted attributes
  name: String,
  original: Boolean,
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
  cdses: [{
    type: Schema.Types.ObjectId,
    ref: 'AnnotationPart',
  }],
  subFeatures: [{
    type: Schema.Types.ObjectId,
    ref: 'AnnotationPart',
  }],
  attribute: Schema.Types.Mixed,
  createdAt: Date,
  updatedAt: Date,
  changelog: String,
})
AnnotationPartSchema.pre<IAnnotationPartModel>('save', function (next) {
  if(this.pid === undefined) {
    this.pid = mongoose.Types.ObjectId();
  }
  next();
})

AnnotationPartSchema.virtual('level').get(function(){return this.parent?1:0;});
AnnotationPartSchema.virtual('len').get(function(){return this.end-this.start});
AnnotationPartSchema.index({ start: 1, end: -1, level: 1 });

export interface IAnnotationPartModel extends IAnnotationPart, Document {
}
export const AnnotationPart = mongoose.model<IAnnotationPartModel>('AnnotationPart', AnnotationPartSchema, 'annotation_parts');

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
  
  // if built, all seqeucnce of all parts matches the project sequenceRef
  built: Boolean,
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

const PartUpdateLogSchema = new Schema({
  ctype: String,
  part: {
    type: Schema.Types.ObjectId,
    ref: 'AnnotationPart',
  },
  name: String,
  changelog: String,
  location: Number,
  oldPart: {
    type: Schema.Types.ObjectId,
    ref: 'AnnotationPart',
  },
},{ _id : false });

export const ProjectLogSchema = new Schema({
  conflictParts: [PartUpdateLogSchema],
  modifiedParts: [PartUpdateLogSchema],
  createdParts: [PartUpdateLogSchema],
  deletedParts: [PartUpdateLogSchema],
  shiftedParts: [PartUpdateLogSchema],
})

export interface IProjectLogModel extends IProjectLog, Document{}
export const ProjectLog:Model<IProjectLogModel> = mongoose.model('ProjectLog', ProjectLogSchema, 'project_logs');
