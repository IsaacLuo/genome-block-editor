import { IProjectModel } from './models';
export async function saveProject(project:IProjectModel) {
  // if (project.constructor.name === 'model') {
  //   // object is mongoose object
  //   project = project.toObject();
  // }
  if (global.redisClient) {
    return new Promise((resolve, reject)=>{
      global.redisClient.set(
        `GBE::PROJ::${project._id}`,
        JSON.stringify(project),
        (err, val)=> {
          if(err) {
            reject(err);
          } else {
            resolve(val);
          }
        }
      )
    });
  }
}

export async function saveProjectStr(id:string, project:string) {
  if (global.redisClient) {
    return new Promise((resolve, reject)=>{
      global.redisClient.set(
        `GBE::PROJ::${id}`,
        project,
        (err, val)=> {
          if(err) {
            reject(err);
          } else {
            resolve(val);
          }
        }
      )
    });
  }
}

export async function loadProjectStr(id:string) {
  if (global.redisClient) {
    return new Promise((resolve, reject)=>{
      global.redisClient.get( `GBE::PROJ::${id}`, (err, val)=> {
        if(err) {
          reject(err);
        } else {
          resolve(val);
        }
      })
    });
  }
}

export async function deleteProject(id:string) {
  if (global.redisClient) {
    return new Promise((resolve, reject)=>{
      global.redisClient.del( `GBE::PROJ::${id}`, (err, val)=> {
        if(err) {
          reject(err);
        } else {
          resolve(val);
        }
      })
    });
  }
}