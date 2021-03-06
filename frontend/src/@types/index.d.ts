declare interface IAction {
  type: string;
  data: any;
  payload?: any;
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
  pid: any;
  parent: any;
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
  changelog: string;
  createdAt: Date;
  updatedAt: Date;
  sequenceHash: string;
  level: number;
}

declare interface IHistory {
  _id: string;
  updatedAt: Date;
  changelog: string;
}

declare interface IAnnotationPartWithDetail extends IAnnotationPart{
  history:IHistory[];
}

declare interface ISourceFile {
  _id: string;
  ctype: string;
  name: string;
  parts: IAnnotationPart[];
  history: IHistory[];
  len: number;
  owner?: IUser,
  group: string,
  permission: Number,
  createdAt: Date,
  updatedAt: Date,
  changelog: string,
  projectId?: string;
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
  history:IHistory[];
}

declare interface IComponentVisibleState {
  openFileDialogVisible: boolean;
  saveFileDialogVisible: boolean;
  saveFileDialogNewFile: boolean;
  exportGenbankDialogVisible: boolean;
  generatePromoterTerminatorDialogVisible: boolean;
  removeCreatedFeaturesDialogVisible: boolean;
  forkProjectDialogVisible: boolean;
  historyBrowserVisible: boolean;
  replaceCodonDialogVisible: boolean;
  partDetailDialogVisible: boolean;
  insertFeatureDialogVisible: boolean;
  removeIntronDialogVisible: boolean;
  sequenceEditorDialogVisible: boolean;
  subFeatureVisible: boolean;

  projectLogPanelVisible: boolean;

  activeSummaryTabKey: string;
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
  selectionStart: number;
  selectionEnd: number;
  selectionEnabled: boolean;
  cursorLocation: number;
}

declare interface IFileListState {
  _id: any;
}

declare interface IFolderTitle {
  _id: any;
  name: string;
}

declare interface IProjectTitle {
  _id: any;
  name: string;
}

declare interface IFolder extends IFolderTitle {
  subFolders: IFolderTitle[];
  projects: IProjectTitle[];
}

declare interface IFolderContentDict {
  [key:string]: IFolderContent
}

declare interface IFileExplorerState {
  fileLists: IFileListState[];
  folderContent: IFolderContentDict;
}

declare interface IUserInfo {
  _id: string;
  fullName: string;
  groups: string[];
}

declare interface IAppState {
  currentUser: IUserInfo;
}

interface IGeneralTaskState {
  message: string,
  progress: 0,
  taskStatus: TaskStatus,
  showProgressBar: boolean,
  ws?: WebSocket,
  clientId: string,

  processId?: string;
  signalLog: IServerLog[];
  outputLog: IServerLog[];
  result: any;
}

interface IHistoryIndex {
  _id:string;
  name: string;
  updatedAt: Date;
  changelog: string;
}

interface IHistoryState {
  historyFile?: ISourceFile;
  availableHistory: IHistoryIndex[];
  loading: boolean;
  historyDiffParts: {diffSetHistory:Set<string>, diffSetSource:Set<string>};
  focusedPartId?: string;
  locationStartOffset?: number;
  locationEndOffset?: number;
}

interface IPartDetailDialogState {
  basePartId?: string;
  part?: IAnnotationPartWithDetail,  
  historyPart?: IAnnotationPartWithDetail,
}

interface ISequenceEditorDialogState{
  sequence: string,
  parts: IAnnotationPart[],
  start: number,
  end: number,
}

interface IProjectLogState {
  log: any,
}

declare interface IStoreState {
  app: IAppState;
  generalTask: IGeneralTaskState;
  moveHistory: Array<{id:string, posFrom:number, posTo:number}>;
  currentProject: IProject;
  sourceFile?: ISourceFile;
  projectCorsor: number;
  componentVisible: IComponentVisibleState;
  genomeBrowser: IGenomBrowserState;
  fileExplorer: IFileExplorerState;
  history: IHistoryState;
  partDetailDialog: IPartDetailDialogState;
  sequenceEditorDialog: ISequenceEditorDialogState;
  projectLog: IProjectLogState;
}

declare interface IRange {
  start: number;
  end: number;
}




declare module 'react-use-dimensions'