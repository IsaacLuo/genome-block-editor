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

interface IAnnotation {
  _id: any;
  featureType: string;
  species: string;
  chrId: number;
  chrName: string;
  start: number;
  end: number;
  strand: string;
  original: boolean;
  origin?: string|IAnnotation;
}

declare interface IProject {
  _id: any;
  name: string,
  version: string,
  parts: Array<IAnnotation>,
  owner: IUser,
  group: string,
  permission: Number,
  createdAt: Date,
  updatedAt: Date,
  history: [any],
}