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

export const revertProject = async (_id:string|mongoose.Types.ObjectId) => {
  const project = await Project.findById(_id).exec();
  if(project.history && project.history[0]) {
    const historyProject = await Project.findById(project.history[0]).exec();
    if (historyProject.ctype === 'history') {
      historyProject.ctype = project.ctype;
      historyProject.save();
      saveProject(historyProject);
      saveProjectIdStr(historyProject.projectId.toString(), historyProject._id.toString());
    }
  }
  project.ctype = 'deletedProject';
  project.updatedAt=new Date();
  await project.save();
  // save to redis
  deleteProject(_id.toString());
}

