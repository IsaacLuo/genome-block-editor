import { combineReducers } from "redux";

export const componentVisibleReducer = (state:IComponentVisibleState, action:IAction):IComponentVisibleState => {
  if (state === undefined) {
    console.log('state is undefined')
    state = {
      openFileDialogVisible: false,
      saveFileDialogVisible: false,
      saveFileDialogNewFile: true,
    }
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
    default:
      return state;
  }
}

export const projectReducer = (state:IProject, action:IAction):IProject => {
  if (state === undefined) {
    state = {
      _id: undefined,
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

function reCombineReducers(reducers: any) {
  let fn = combineReducers<IStoreState>(reducers);
  return (state:IStoreState|undefined, action:IAction):IStoreState => {
    if (!state) {
      console.log('set default totla')
      state = defaultStoreState;
    }
    console.debug('action', action.type, action.data);
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

export const reducer = reCombineReducers({
  componentVisible: componentVisibleReducer,
  currentProject: projectReducer,
})


export const defaultStoreState : IStoreState = {
  moveHistory: [],
  currentProject: {
    _id: undefined,
    name: 'undefined project',
    version: '0.1',
    parts: [],
    owner: undefined,
    group: 'all',
    permission: 0x666,
    createdAt: new Date(),
    updatedAt: new Date(),
    history: [],
  },
  // chromosomeBlocks: [],
  sourceFile: undefined,
  projectCorsor: 0,
  componentVisible: {
    openFileDialogVisible: false,
    saveFileDialogVisible: false,
    saveFileDialogNewFile: true,
  }
};