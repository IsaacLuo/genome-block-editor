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
import createError from 'http-errors';

// add current information in to history
export const pushHistory = (obj:IProject|IAnnotationPart) => {
  obj.history = [{
    _id: obj._id,
    updatedAt: obj.updatedAt,
    changelog: obj.changelog,
  }, ...obj.history];
}

export const forkProject = async (user:IUserEssential, _id:string|mongoose.Types.ObjectId, name?:string)=>{
  const projectObj = await Project.findById(_id).exec();
  const project = await projectObj.toObject();

  const oldName = project.name;
  const oldId = project._id;

  if (name) {
    project.name = name;
  } else {
    const now = new Date();
    project.name += `[${now.toLocaleDateString()} ${now.toLocaleTimeString()}]`
  }
  pushHistory(project);
  // after fork, the projectId should be different.
  project.projectId = new mongoose.Types.ObjectId();
  project.ctype = 'project';
  project.owner = user._id;
  project.group = user.groups;
  project.permission = 0x600;
  project._id = new mongoose.Types.ObjectId();
  project.changelog = `forked from project ${oldName} (${oldId}).`
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
    // if the history is a "history", revert it to project, otherwise keep it same.
    if (historyProject.ctype === 'history') {
      historyProject.ctype = project.ctype;
      historyProject.save();
      saveProject(historyProject);
      saveProjectIdStr(historyProject.projectId.toString(), historyProject._id.toString());
    } else {
      throw createError(403, 'cannot revert because it is the first version since forking');
    }
    project.ctype = 'deletedProject';
    project.updatedAt=new Date();
    await project.save();
    // save to redis
    deleteProject(_id.toString());
    return historyProject;
  } else {
    throw createError(404, 'cannot find project history');
  }
}

