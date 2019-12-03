export const reducer = (state:IStoreState|undefined, action:IAction):IStoreState => {
  if (!state) {
    state = defaultStoreState;
  }
  console.log('action', action.type, action.data);
  switch(action.type) {
    case 'MOVE_BLOCK_TO_BLOCK': {
      const {id,posFrom,posTo, data} = action.data;
      const project = [...state.currentProject];
      if (posFrom>=0) {
        if (state.currentProject[posFrom].name === id) {
          project.splice(posFrom, 1);
        }
      }
      if (posTo>=0) {
        project.splice(posTo, 0, data);
      }
      return {
        ...state,
        moveHistory: [...state.moveHistory, action.data],
        currentProject: project,
      }
    }
    case 'COPY_BLOCK_TO_BLOCK': {
      const {posTo,data} = action.data;
      const project = [...state.currentProject];
      if (posTo>=0) {
        project.splice(posTo, 0, data);
      }
      return {
        ...state,
        currentProject: project,
      }
    }
    case 'COPY_BLOCK_TO_BASKET': {
      const {data} = action.data;
      const project = [...state.currentProject];
      project.push(data);
      return {...state, currentProject:project};
    }
    case 'SET_CHROMOSOME_BLOCKS': {
      return {
        ...state, 
        chromosomeBlocks: action.data,
      };
    }
    case 'SET_SOURCE_FILE': {
      return {
        ...state,
        sourceFile: action.data,
        chromosomeBlocks: action.data.parts,
      }
    }
  }
  return state;
}

export const defaultStoreState = {
  moveHistory: [],
  currentProject: [],
  chromosomeBlocks: [],
  sourceFile: undefined,
};