
// ask auth server for user information, the cookie with jwt will be sent to auth server
export const GET_CURRENT_USER = 'GET_CURENT_USER';

// set user information on UI
export const SET_CURRENT_USER = 'SET_CURRENT_USER';

// clear user informatin on UI
export const LOG_OUT_DONE = 'LOG_OUT_DONE';

// set source file information
export const SET_SOURCE_FILE = 'SET_SOURCE_FILE';

export const LOAD_SOURCE_FILE = 'LOAD_SOURCE_FILE';

export const HIDE_ALL_DIALOG = 'HIDE_ALL_DIALOG';


export const ADD_NEW_BLOCK = 'ADD_NEW_BLOCK';

export const LOAD_SOURCE_FILE_BY_PROJECT_ID = 'LOAD_SOURCE_FILE_BY_PROJECT_ID';

// goto the project folder, and fetch all new files in it, it should be called ervery forking or saving project.
export const GOTO_AND_FETCH_PROJECT_FILES = 'GOTO_AND_FETCH_PROJECT_FILES';
