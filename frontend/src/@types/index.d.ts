declare interface IAction {
  type: string;
  data: any;
}

declare interface IStoreState {
  moveHistory: Array<{id:string, posFrom:number, posTo:number}>;
  currentProject: string[];
}