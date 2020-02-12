import { combineReducers } from "redux";

const DEFAULT_APP_STATE:IAppState = {
  currentUser: {
    _id: '',
    fullName: '',
    groups:[],
  }
};

const DEFAULT_GENOME_BROWSER_STATE:IGenomBrowserState ={
      zoomLevel: 64,
      windowWidth: 1024,
      viewWindowStart:0,
      viewWindowEnd: 1024*128,
      bufferedWindowStart:0,
      bufferedWindowEnd:0,
      toolTipPos: {x:0,y:0, text:''},
      loading: false,
      rulerStep: 1000,
    }

const DEFAULT_FILE_EXPLORER_STATE:IFileExplorerState = {
  fileLists: [{_id:'000000000000000000000000'}],
}

const DEFAULT_PROJECT_STATE:IProject = {
    _id: undefined,
    ctype: 'unknwon',
    name: 'undefined project',
    version: '0.1',
    parts: [],
    owner: undefined,
    group: 'all',
    permission: 0x666,
    createdAt: new Date(),
    updatedAt: new Date(),
    history: [],
  }

const DEFAULT_GENERAL_TASK_STATE:IGeneralTaskState = {
  message: '',
  progress: 0,
  taskStatus: 'init',
  showProgressBar: false,
  ws: undefined,
  clientId: '',
  processId: undefined,
  signalLog: [],
  outputLog: [],
  result: undefined,
}

const DEFAULT_COMPONENT_VISIBLE_STATE:IComponentVisibleState = {
  openFileDialogVisible: false,
  saveFileDialogVisible: false,
  saveFileDialogNewFile: true,
  exportGenbankDialogVisible: false,
  generatePromoterTerminatorDialogVisible: false,
}

const DEFAULT_STORE_STATE:IStoreState = {
  app: DEFAULT_APP_STATE,
  generalTask: DEFAULT_GENERAL_TASK_STATE,
  moveHistory: [],
  currentProject: DEFAULT_PROJECT_STATE,
  // chromosomeBlocks: [],
  sourceFile: undefined,
  projectCorsor: 0,
  componentVisible: DEFAULT_COMPONENT_VISIBLE_STATE,
  genomeBrowser: DEFAULT_GENOME_BROWSER_STATE,
  fileExplorer: DEFAULT_FILE_EXPLORER_STATE,
};

const rulerZoomList = [50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000];

export const appReducer = (state:IAppState, action:IAction):IAppState => {
  if (state === undefined) {
    state = DEFAULT_APP_STATE;
  }
  switch(action.type) {
    case 'SET_CURRENT_USER':
      return {...state, currentUser:action.data};
    case 'LOGOUT_DONE':
      return DEFAULT_APP_STATE;
  }
  return state;
}


export const componentVisibleReducer = (state:IComponentVisibleState, action:IAction):IComponentVisibleState => {
  if (state === undefined) {
    console.log('state is undefined')
    state = DEFAULT_COMPONENT_VISIBLE_STATE;
  }
  
  switch (action.type) {
    case 'SHOW_OPEN_FILE_DIALOG': {
      return {...state, openFileDialogVisible: true};
    }
    case 'HIDE_OPEN_FILE_DIALOG': {
      return {...state, openFileDialogVisible: false};
    }
    case 'SHOW_SAVE_FILE_DIALOG': {
      return {...state, saveFileDialogVisible: true, saveFileDialogNewFile: action.data.newFile};
    }
    case 'HIDE_SAVE_FILE_DIALOG': {
      return {...state, saveFileDialogVisible: false, saveFileDialogNewFile: true};
    }
    case 'SHOW_EXPORT_GENBANK_DIALOG': {
      return {...state, exportGenbankDialogVisible: true};
    }
    case 'HIDE_EXPORT_GENBANK_DIALOG': {
      return {...state, exportGenbankDialogVisible: false};
    }
    case 'SHOW_CREATE_PROMOTER_TERMINATOR_DIALOG': {
      return {...state, generatePromoterTerminatorDialogVisible: true};
    }
    case 'HIDE_CREATE_PROMOTER_TERMINATOR_DIALOG': {
      return {...state, generatePromoterTerminatorDialogVisible: false};
    }
    default:
      return state;
  }
}

export const projectReducer = (state:IProject, action:IAction):IProject => {
  if (state === undefined) {
    state = DEFAULT_PROJECT_STATE
  }
  switch (action.type) {
    case 'COPY_BLOCK_TO_BASKET': {
      const {data} = action.data;
      const {parts} = state;
      parts.push(data);
      return {...state, parts};
    }
    case 'SET_CURRENT_PROJECT': {
      return action.data;
    }
    default:
      return state;
  }
}

export const genomeBrowserReducer = (state:IGenomBrowserState, action:IAction):IGenomBrowserState => {
  if (state === undefined) {
      state = DEFAULT_GENOME_BROWSER_STATE;
  }

  const calcRulerStep = (zoomLevel:number) => {
    let rulerStopIndex = 0;
      let rulerStep = rulerZoomList[rulerStopIndex];
      while(rulerStep/zoomLevel < 100 && rulerStopIndex < rulerZoomList.length) {
        rulerStopIndex++;
        rulerStep = rulerZoomList[rulerStopIndex];
      }
    return rulerStep;
  }

  switch (action.type) {
    case 'SET_ZOOM_LEVEL': {
      const zoomLevel = action.data;
      const viewWindowEnd = state.viewWindowStart + Math.floor(state.windowWidth*zoomLevel);
      const rulerStep = calcRulerStep(zoomLevel);
      return {...state, zoomLevel, viewWindowEnd, rulerStep};
    }
    case 'SET_GENOME_BROWSER_LOADING': {
      const {windowWidth} = state;
      const zoomLevel = 64;
      return {...state, 
        loading: action.data, 
        zoomLevel,
        viewWindowStart:0,
        viewWindowEnd: Math.floor(windowWidth*zoomLevel),
        rulerStep: calcRulerStep(zoomLevel),
      }
    }
    case 'SET_GENOME_BROWSER_WINDOW_WIDTH': {
      if (action.data !== state.windowWidth) {
        const zoomLevel = state.zoomLevel;
        const windowWidth = action.data;
        const viewWindowEnd = state.viewWindowStart + Math.floor(windowWidth*zoomLevel);
        const rulerStep = calcRulerStep(zoomLevel);
        return {...state, windowWidth, viewWindowEnd, rulerStep}
      }
      return state;
    }
    case 'GENOME_BROWSER_SCROLL_LEFT': {
      const {windowWidth, rulerStep} = state;
      let {viewWindowStart, viewWindowEnd} = state;
      const {step} = action.data;
      const multi = step || 1;
      let scrollWidth = Math.min(viewWindowStart, rulerStep*multi);
      viewWindowStart-=scrollWidth;
      viewWindowEnd-=scrollWidth;
      return {...state, windowWidth, viewWindowStart, viewWindowEnd}
    }
    case 'GENOME_BROWSER_SCROLL_RIGHT': {
      const {windowWidth, rulerStep} = state;
      let {viewWindowStart, viewWindowEnd} = state;
      const {step, max} = action.data;
      const multi = step || 1;
      let scrollWidth = rulerStep*multi;
      if(viewWindowEnd + scrollWidth > max) {
        scrollWidth = max - viewWindowEnd;
      }
      viewWindowStart+=scrollWidth;
      viewWindowEnd+=scrollWidth;
      return {...state, windowWidth, viewWindowStart, viewWindowEnd}
    }
    case 'GENOME_BROWSER_SET_CURSOR_POS': {
      const {windowWidth} = state;
      let {viewWindowStart, viewWindowEnd} = state;
      const pos = action.data;
      const viewWindowWidth = viewWindowEnd - viewWindowStart
      viewWindowStart = pos - Math.floor(viewWindowWidth/2);
      if (viewWindowStart < 0) {
        viewWindowStart = 0;
      }
      viewWindowEnd = viewWindowStart + viewWindowWidth;
      return {...state, viewWindowStart, viewWindowEnd};
    }
    case 'SET_RULER_STEP' : {
      return {...state, rulerStep: action.data};
    }
    case 'SET_TOOL_TIPS' : {
      return {...state, toolTipPos:action.data};
    }
    default:
      return state;
  }
}


export const fileExplorerReducer = (state:IFileExplorerState = DEFAULT_FILE_EXPLORER_STATE, action:IAction):IFileExplorerState => {
  switch (action.type) {
    case 'SET_FILE_LIST_LEVEL':
      const {_id, level} = action.data;
      const fileLists = state.fileLists.slice(0,level+1);
      fileLists.push({_id,});
      return {...state,fileLists};
  }
  return state;
}

function reCombineReducers(reducers: any) {
  let fn = combineReducers<IStoreState>(reducers);
  return (state:IStoreState|undefined, action:IAction):IStoreState => {
    if (!state) {
      console.log('set default totla')
      state = DEFAULT_STORE_STATE;
    }
    // console.debug('action', action.type, action.data);
    switch (action.type) {
      case 'MOVE_BLOCK_TO_BLOCK': {
        const {id,posFrom,posTo, data} = action.data;
        const project = {...state.currentProject};
        const parts = project.parts
        if (posFrom>=0) {
          if (state.currentProject.parts[posFrom].name === id) {
            parts.splice(posFrom, 1);
          }
        }
        if (posTo>=0) {
          parts.splice(posTo, 0, data);
        }
        return {
          ...state,
          moveHistory: [...state.moveHistory, action.data],
          currentProject: project,
        }
      }

      case 'SET_SOURCE_FILE': {
        return {
          ...state,
          sourceFile: action.data,
        }
      }
      case 'ADD_NEW_BLOCK': {
        const data = action.data;
        const project = {...state.currentProject};
          project.parts.push(data);
        return {
          ...state,
          currentProject:project,
        }
      }
      case 'EXPORT_GENBANK': {
        return state;
      }
      default:
        return {...state, ...fn(state, action)};
    }
  }
}

export const generalTaskReducer = (state:IGeneralTaskState, action:IAction) => {
  if (state === undefined) {
    state = DEFAULT_GENERAL_TASK_STATE;
  }
  console.log(action);
  switch (action.type) {
    case 'PROGRESS':{
      const {message, progress} = action.data;
      return {...state, message, progress};
    }
    case 'SERVER_RESULT': {
      return {...state, progress:100,};
    }
    // case 'SET_PROCESS_SIGNAL': {
      
    // }
    case 'SET_PROCESS_LOG': {
      return {...state, outputLog: [...state.outputLog, action.data]}
    }
  }
  return state;
}

export const reducer = reCombineReducers({
  app: appReducer,
  generalTask: generalTaskReducer,
  componentVisible: componentVisibleReducer,
  currentProject: projectReducer,
  genomeBrowser: genomeBrowserReducer,
  fileExplorer: fileExplorerReducer,
})
