export const reducer = (state:IStoreState|undefined, action:IAction):IStoreState => {
  if (!state) {
    state = defaultStoreState;
  }
  console.log('action', action.type, action.data);
  switch(action.type) {
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
    // case 'COPY_BLOCK_TO_BLOCK': {
    //   const {posTo,data} = action.data;
    //   const project = [...state.currentProject];
    //   if (posTo>=0) {
    //     project.splice(posTo, 0, data);
    //   }
    //   return {
    //     ...state,
    //     currentProject: project,
    //   }
    // }
    case 'COPY_BLOCK_TO_BASKET': {
      const {data} = action.data;
      const project = {...state.currentProject};
      project.parts.push(data);
      return {...state, currentProject:project};
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
  }
  return state;
}

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
};