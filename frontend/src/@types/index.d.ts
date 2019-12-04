declare interface IAction {
  type: string;
  data: any;
}

declare interface IBlock {
  _id: string;
  name:string;
  feature:string;
  start:number;
  end:number;
  strand:string;
  seq:string;
}

declare interface IFeature extends IBlock{
  row: number;
}

declare interface ISourceFile {
  _id: string;
  name: string;
  parts: IBlock[];
  len: number;
}

declare interface IStoreState {
  moveHistory: Array<{id:string, posFrom:number, posTo:number}>;
  currentProject: IBlock[];
  chromosomeBlocks: IBlock[];
  sourceFile?: ISourceFile;
}