declare interface IAction {
  type: string;
  data: any;
}

declare interface IBlock {
  _id: string;
  name:string;
  featureType:string;
  start:number;
  end:number;
  strand:number;
  seq:string;
}

declare interface IFeature extends IBlock{
  row: number;
}

declare interface IAnnotationPart {
  _id: any;
  featureType: string;
  species: string;
  chrId: number;
  chrName: string;
  start: number;
  end: number;
  len: number;
  strand: number;
  name: string;
  original: boolean;
  origin?: string|IAnnotationPart;
}

declare interface ISourceFile {
  _id: string;
  ctype: string;
  name: string;
  parts: IAnnotationPart[];
  len: number;
  owner?: IUser,
  group: string,
  permission: Number,
  createdAt: Date,
  updatedAt: Date,
}

declare interface IProject {
  _id: any;
  ctype: string;
  name?: string,
  version?: string,
  parts: IAnnotationPart[],
  owner?: IUser,
  group: string,
  permission: Number,
  createdAt: Date,
  updatedAt: Date,
  history: any[],
}

declare interface IComponentVisibleState {
  openFileDialogVisible: boolean;
  saveFileDialogVisible: boolean;
  saveFileDialogNewFile: boolean;
  exportGenbankDialogVisible: boolean;
}

declare interface IGenomBrowserState {
  zoomLevel: number;
  windowWidth: number;    //genomebower window in piexel
  viewWindowStart: number; //viewing bps
  viewWindowEnd: number;
  bufferedWindowStart: number;
  bufferedWindowEnd: number;
  toolTipPos: {x:number, y:number, text:any};
  loading: boolean;
  rulerStep: number;
}

declare interface IFileListState {
  _id: any;
}

declare interface IFileExplorerState {
  fileLists: IFileListState[];
}

declare interface IUserInfo {
  _id: string;
  fullName: string;
  groups: string[];
}

declare interface IAppState {
  currentUser: IUserInfo;
}

declare interface IStoreState {
  app: IAppState;
  moveHistory: Array<{id:string, posFrom:number, posTo:number}>;
  currentProject: IProject;
  sourceFile?: ISourceFile;
  projectCorsor: number;
  componentVisible: IComponentVisibleState;
  genomeBrowser: IGenomBrowserState;
  fileExplorer: IFileExplorerState;
}

declare module 'react-use-dimensions'