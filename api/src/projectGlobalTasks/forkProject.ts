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

export default async (user:IUserEssential, id:string, name?:string)=>{
  const project = await (await Project.findById(id).exec()).toObject();
  if (name) {
    project.name = name;
  } else {
    const now = new Date();
    project.name += `[${now.toLocaleDateString()} ${now.toLocaleTimeString()}]`
  }
  project.projectId = new mongoose.Types.ObjectId();
  project.ctype = 'project';
  project.owner = user._id;
  project.group = user.groups;
  project.permission = 0x600;
  project.history = [project._id, ...project.history];
  project._id = undefined;
  delete project._id;
  const result = await Project.create(project);
  // save to redis
  saveProject(result);
  saveProjectIdStr(result.projectId.toString(), result._id.toString());

  return {_id:result._id, projectId:result.projectId};
}