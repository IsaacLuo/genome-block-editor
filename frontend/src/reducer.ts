import { combineReducers } from "redux";
import conf from "./conf.json";

const DEFAULT_APP_STATE:IAppState = {
  currentUser: conf.localMode ? {
    _id: '000000000000000000000000',
    fullName: 'user',
    groups: ['users']
  }
  :{
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
  selectionStart: 0,
  selectionEnd: 0,
  selectionEnabled: false,
  cursorLocation: 0,
}

const DEFAULT_FILE_EXPLORER_STATE:IFileExplorerState = {
  fileLists: [{_id:'000000000000000000000000'}],
  folderContent:{}
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
  removeCreatedFeaturesDialogVisible: false,
  forkProjectDialogVisible: false,
  historyBrowserVisible: false,
  replaceCodonDialogVisible: false,
  partDetailDialogVisible: false,
  insertFeatureDialogVisible: false,
  removeIntronDialogVisible: false,
  sequenceEditorDialogVisible: false,
  subFeatureVisible: true,
}

const DEFAULT_HISTORY_STATE:IHistoryState = {
  historyFile: undefined,
  availableHistory: [],
  loading: false,
  historyDiffParts: {
    diffSetHistory: new Set(),
    diffSetSource: new Set(),
  },
  focusedPartId: undefined,
}

const DEFAULT_PART_DETAIL_DIALOG_STATE:IPartDetailDialogState = {
  basePartId: undefined,
  part: undefined,
}

const DEFAULT_SEQUENCE_EDITOR_DIALOG_STATE = {
  sequence: '',
  parts: [],
  start: 0,
  end: 0,
}

const DEFAULT_PROJECT_LOG_STATE = {
  log: {}
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
  history: DEFAULT_HISTORY_STATE,
  partDetailDialog: DEFAULT_PART_DETAIL_DIALOG_STATE,
  sequenceEditorDialog: DEFAULT_SEQUENCE_EDITOR_DIALOG_STATE,
  projectLog: DEFAULT_PROJECT_LOG_STATE,
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
    // console.log('state is undefined')
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
    case 'SHOW_REMOVE_CREATED_FEATURES_DIALOG': {
      return {...state, removeCreatedFeaturesDialogVisible: true};
    }
    case 'HIDE_REMOVE_CREATED_FEATURES_DIALOG': {
      return {...state, removeCreatedFeaturesDialogVisible: false};
    }
    case 'SHOW_FORK_PROJECT_DIALOG': {
      return {...state, forkProjectDialogVisible: true};
    }
    case 'HIDE_FORK_PROJECT_DIALOG': {
      return {...state, forkProjectDialogVisible: false};
    }
    case 'SHOW_REPLACE_CODON_DIALOG': {
      return {...state, replaceCodonDialogVisible: true};
    }
    case 'HIDE_REPLACE_CODON_DIALOG': {
      return {...state, replaceCodonDialogVisible: false};
    }
    case 'SHOW_PART_DETAIL_DIALOG': {
      return {...state, partDetailDialogVisible: true};
    }
    case 'HIDE_PART_DETAIL_DIALOG': {
      return {...state, partDetailDialogVisible: false};
    }
    case 'SHOW_INSERT_FEATURE_DIALOG': {
      return {...state, insertFeatureDialogVisible: true};
    }
    case 'HIDE_INSERT_FEATURE_DIALOG': {
      return {...state, insertFeatureDialogVisible: false};
    }
    case 'SHOW_REMOVE_INTRON_DIALOG': {
      return {...state, removeIntronDialogVisible: true};
    }
    case 'HIDE_REMOVE_INTRON_DIALOG': {
      return {...state, removeIntronDialogVisible: false};
    }
    case 'HIDE_ALL_DIALOG':
      return {...state, 
        openFileDialogVisible: false,
        saveFileDialogVisible: false,
        exportGenbankDialogVisible: false,
        generatePromoterTerminatorDialogVisible: false,
        removeCreatedFeaturesDialogVisible: false,
        forkProjectDialogVisible: false,
        historyBrowserVisible: false,
        replaceCodonDialogVisible: false,
        partDetailDialogVisible: false,
        insertFeatureDialogVisible: false,
        removeIntronDialogVisible: false,
        sequenceEditorDialogVisible: false,
      };
    case 'SHOW_HIDE_HISTORY_VERSIONS':
      return {...state, historyBrowserVisible: !state.historyBrowserVisible}

    case 'SHOW_SEQUENCE_EDITOR_DIALOG': {
      return {...state, sequenceEditorDialogVisible: true};
    }
    case 'HIDE_SEQUENCE_EDITOR_DIALOG': {
      return {...state, sequenceEditorDialogVisible: false};
    }
    case 'SHOW_SUB_FEATURES': {
      return {...state, subFeatureVisible: action.data};
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
      if (viewWindowStart + scrollWidth < 0) {
        // unable to scroll left
        return state;
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
    case 'SET_GB_SELECTION_START': {
      if (typeof(action.data) === 'number') {
        const selectionStart = action.data;
        const selectionEnd = state.selectionEnd;
        const selectionEnabled = selectionStart < selectionEnd;
        return {...state, selectionStart, selectionEnabled}
      }
    }
    case 'SET_GB_SELECTION_END': {
      if (typeof(action.data) === 'number') {
        const selectionEnd = action.data;
        const selectionStart = state.selectionStart;
        const selectionEnabled = selectionStart < selectionEnd;
        return {...state, selectionEnd, selectionEnabled}
      }
    }

    case 'CLEAR_GB_SELECTION': {
      return {...state, selectionEnabled: false}
    }
    case 'GB_SELECT_ANNOTATION_PART': {
      return {
        ...state, 
        selectionStart: action.data.start, 
        selectionEnd: action.data.end,
        selectionEnabled: true,
      }
    }
    default:
      return state;
  }
}


export const fileExplorerReducer = (state:IFileExplorerState = DEFAULT_FILE_EXPLORER_STATE, action:IAction):IFileExplorerState => {
  switch (action.type) {
    case 'SET_FILE_LIST_LEVEL': {
      const {_id, level} = action.data;
      const fileLists = state.fileLists.slice(0,level+1);
      fileLists.push({_id,});
      return {...state, fileLists};
    }

    case 'SET_FOLDER_CONTENT': {
      const {_id} = action.data;
      return {...state, folderContent: {...state.folderContent, [_id]:action.data}}
    }
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

      case 'CLEAR_SOURCE_FILE': {
        return {
          ...state,
          sourceFile: undefined,
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
  // console.log(action);
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

    case 'SHOW_CREATE_PROMOTER_TERMINATOR_DIALOG':
    case 'SHOW_REMOVE_CREATED_FEATURES_DIALOG':
      return DEFAULT_GENERAL_TASK_STATE;
  }
  return state;
}

export const historyReducer = (state:IHistoryState, action:IAction) => {
  if (state === undefined) {
    state = DEFAULT_HISTORY_STATE;
  }
  switch(action.type) {
    case 'SET_HISTORY_SOURCE_FILE':
      return {...state, historyFile:action.data};
    case 'SET_AVAILABLE_HISTORY':
      return {...state, availableHistory: action.data};
    case 'SET_HISTORY_GENOME_BROWSER_LOADING':
      return {...state, loading: action.data};
    case 'SET_HISTORY_DIFF':
      console.log(action);
      return {...state, historyDiffParts: action.data}
    case 'SHOW_HIDE_HISTORY_VERSIONS':
      return DEFAULT_HISTORY_STATE;
    case 'SET_GB_SELECTION_START':
    case 'SET_GB_SELECTION_START':
      return {...state, locationStartOffset: 0, locationEndOffset: 0, focusedPartId: null}
    case 'GB_SELECT_ANNOTATION_PART': {
      const {start, end, pid} = action.data;
      let locationStartOffset = 0;
      let locationEndOffset = 0;
      if (state.historyFile) {
        const part = state.historyFile.parts.find(v=>v.pid === pid)
        if (part) {
          locationStartOffset = part.start - start;
          locationEndOffset = part.end - end;
        }
      }
      return {
        ...state,
        focusedPartId: action.data.pid,
        locationStartOffset,
        locationEndOffset,
      }
    }
  }
  return state;
}

export const partDetailDialogReducer = (state:IPartDetailDialogState, action:IAction) => {
  if (state === undefined) {
    state = DEFAULT_PART_DETAIL_DIALOG_STATE;
  }
  switch(action.type) {
    case 'SHOW_PART_DETAIL_DIALOG':
      return {
        ...state,
        basePartId: action.data,
      }
    case 'HIDE_PART_DETAIL_DIALOG':
      return {
        ...state,
        basePartId: undefined,
        part: undefined,
        historyPart: undefined,
      }
    case 'SET_PART_DETAIL':
      return {
        ...state,
        part: action.data,
      }
    case 'SET_HISTORY_PART_DETAIL':
      return {
        ...state,
        historyPart: action.data,
      }
    case 'PART_DETAIL_GOTO_LATEEST_VERSION':
      return {
        ...state,
        historyPart: undefined,
      }
  }
  return state;
}


export const sequenceEditorDialogReducer = (state:ISequenceEditorDialogState, action:IAction) => {
  if (state === undefined) {
    state = DEFAULT_SEQUENCE_EDITOR_DIALOG_STATE;
  }
  switch(action.type) {
    case 'SET_SEQUENCE_SEGMENT':
      const {sequence, parts, start, end} = action.data;
      return {
        ...state,
        sequence, parts, start, end,
      }
  }
  return state;
}



export const projectLogReducer = (state:IProjectLogState, action:IAction) => {
  if (state === undefined) {
    state = DEFAULT_PROJECT_LOG_STATE;
  }
  switch(action.type) {
    case 'SET_PROJECT_OPERATION_LOG':
      return {...state, log:action.data}
    case 'LOAD_SOURCE_FILE':
      case 'LOAD_SOURCE_FILE_BY_PROJECT_ID':
      case 'FORK_PROJECT':
      return DEFAULT_PROJECT_LOG_STATE;
  }
  return state;
}

export const reducer = reCombineReducers({
  app: appReducer,
  generalTask: generalTaskReducer,
  componentVisible: componentVisibleReducer,
  currentProject: projectReducer,
  projectLog: projectLogReducer,
  genomeBrowser: genomeBrowserReducer,
  fileExplorer: fileExplorerReducer,
  history:historyReducer,
  partDetailDialog: partDetailDialogReducer,
  sequenceEditorDialog: sequenceEditorDialogReducer,
})
