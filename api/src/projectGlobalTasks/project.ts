import mongoose from 'mongoose';
import {Project} from '../models';
import { 
    saveProject, 
    deleteProject, 
    loadProjectStr, 
    saveProjectStr, 
    loadProjectIdStr, 
    saveProjectIdStr,
} from '../redisCache';

export const forkProject = async (user:IUserEssential, _id:string|mongoose.Types.ObjectId, name?:string)=>{
  const projectObj = await Project.findById(_id).exec();
  const project = await projectObj.toObject();
  if (name) {
    project.name = name;
  } else {
    const now = new Date();
    project.name += `[${now.toLocaleDateString()} ${now.toLocaleTimeString()}]`
  }
  // after fork, the projectId should be different.
  project.projectId = new mongoose.Types.ObjectId();
  project.ctype = 'project';
  project.owner = user._id;
  project.group = user.groups;
  project.permission = 0x600;
  project.history = [project._id, ...project.history];
  project._id = new mongoose.Types.ObjectId();
  const result = await Project.create(project);
  // save to redis
  saveProject(result);
  saveProjectIdStr(result.projectId.toString(), result._id.toString());

  return {_id:result._id, projectId:result.projectId};
}

export const hideProject = async (_id:string|mongoose.Types.ObjectId) => {
  await Project.update({_id}, {ctype:'deletedProject', updatedAt: new Date()});
  // save to redis
  deleteProject(_id.toString());
}