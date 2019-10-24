export const reducer = (state:IStoreState|undefined, action:IAction):IStoreState => {
  if (!state) {
    state = defaultStoreState;
  }
  console.log('action', action.type, action.data);
  switch(action.type) {
    case 'MOVE_BLOCK_TO_BLOCK': {
      const {id,posFrom,posTo} = action.data;
      const project = [...state.currentProject];
      if (posFrom>=0) {
        if (state.currentProject[posFrom] === id) {
          project.splice(posFrom, 1);
        }
      }
      if (posTo>=0) {
        project.splice(posTo, 0, id);
      }
      console.log(project);
      return {
        ...state,
        moveHistory: [...state.moveHistory, action.data],
        currentProject: project,
      }
    }
  }
  return state;
}

export const defaultStoreState = {
  moveHistory: [],
  currentProject: ['A', 'B', 'C','D','E','F'],
};