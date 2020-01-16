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

interface IAnnotationPart {
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
  name: string;
  parts: IAnnotationPart[];
  len: number;
}

declare interface IProject {
  _id: any;
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

declare interface IStoreState {
  moveHistory: Array<{id:string, posFrom:number, posTo:number}>;
  currentProject: IProject;
  sourceFile?: ISourceFile;
  projectCorsor: number;
  componentVisible: IComponentVisibleState;
}

