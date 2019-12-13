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
  name: string;
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
  owner: IUser,
  group: string,
  permission: Number,
  createdAt: Date,
  updatedAt: Date,
}

declare interface IProcess {
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