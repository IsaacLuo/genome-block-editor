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
  user?: ITokenContent;
  data?: any;
  cacheFileName?: string;
}

declare interface ISequenceRef {
  fileName: string,
  start: number,
  end: number,
  strand: number,
}

declare interface IAnnotationPart {
  _id: any;
  pid: any;
  parent: any;
  featureType: string;
  chrId: number;
  chrName: string;
  start: number;
  end: number;
  len: number;
  strand: number;
  name: string;
  original: boolean;
  history: any[];
  sequenceHash?: string;
  sequenceRef: ISequenceRef;
  createdAt: Date;
  updatedAt: Date;
  changelog: string;
  built: boolean;
  attribute: any;
  level?: number;
  cdses?: any[];
}

declare interface IProject {
  _id: any;
  projectId: any,
  ctype: string;
  name: string,
  version: string,
  parts: Array<IAnnotationPart>|any,
  owner: IUser,
  group: string[],
  permission: Number,
  createdAt: Date,
  updatedAt: Date,
  changelog: string,
  history: any[],
  len: number,
  sequenceRef?: ISequenceRef,
  built: boolean,
}

declare interface ISourceChomosome {
  _id: any;
  name: string,
  version: string,
  parts: Array<IAnnotationPart>,
  owner: IUser,
  group: string,
  permission: Number,
  createdAt: Date,
  updatedAt: Date,
}

declare interface IExeProcess {
  // processId: string;
  // subProcessInst?: ChildProcessWithoutNullStreams;
  program: string;
  params: string[];
  options?: {
    cwd?: string,
    env?: any,
  }
  // taskName: string;
  // state: 'ready'| 'running' | 'done' | 'error';
  // webSockets: Set<ws>;
  // result: any;
  // createdAt?: Date;
  // startedAt?: Date;
  // doneAt?: Date;
}

declare interface IProjectFolder {
  _id: any;
  name: String;
  subFolders: any[];
  projects: IProject[];
}

declare interface IPartUpdateLog {
  ctype: string,
  part?: any,
  name?: string,
  changelog?: string,
  location?: number,
  oldPart?: any,
}

declare interface IProjectLog {
  _id: any;
  conflictParts: IPartUpdateLog[],
  modifiedParts: IPartUpdateLog[],
  createdParts: IPartUpdateLog[],
  deletedParts: IPartUpdateLog[],
  shiftedParts: IPartUpdateLog[],
}

declare interface IGFFJSONRecord {
  _id?: string;
  featureType: string,
  chrName: string;
  chrId: number,
  start: number,
  end: number,
  strand: number,
  attribute?: any,
  name?: string,
  chrFileName?: string,
  original?: boolean,
  [key:string]: any;
  createdAt?: Date,
  updatedAt?: Date,
}

declare type GFFJsonMimeType = 'application/gffjson'|'application/gffjson-multi-chr'|'application/gffjson-head'|'application/gffjson-head-multi-chr';

declare interface IGFFJSON {
  mimetype: GFFJsonMimeType;
  version: string;
  history: {
    createdAt: Date,
    changelog: string,
  }[];
  seqInfo: {
    [key:string]: any;
  },
  records: IGFFJSONRecord[],
  sequence: {
    [key:string]: string;
  }
  defaultChr?: string;
  createdAt?: Date,
  updatedAt?: Date,
  __changelog?: string,
}

declare interface IRange {
  start: number,
  end: number,
}

declare interface IProcess {
  processId: string;
  subProcessInst?: any;
  program: string;
  params: any;
  comments: any;
  dataIn: any;
  taskName: string;
  state: 'ready'| 'running' | 'done' | 'error' | 'aborted';
  result: any;
  createdAt?: Date;
  startedAt?: Date;
  doneAt?: Date;
}

declare interface IProcessDict {
  [key: string]: IProcess;
}


declare global {
  namespace NodeJS {
    interface Global {
      taskDict: TaskDict;
    }
  }
}