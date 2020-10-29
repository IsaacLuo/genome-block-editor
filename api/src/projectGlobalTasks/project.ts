import mongoose from 'mongoose';
import {Project, AnnotationPart} from '../models';
import { 
    deleteProject, 
} from '../redisCache';
import createError from 'http-errors';

/**
 * add current information in to history
 * @param obj: current project
 */ 
export const pushHistory = (obj:IProject|IAnnotationPart) => {
  obj.history = [{
    _id: obj._id,
    updatedAt: obj.updatedAt,
    changelog: obj.changelog,
  }, ...obj.history];
}

/**
 * fork a project, which creates a following project node but not change the mark of current project(keep it as history or project)
 * @param user current user (for setting owner)
 * @param _id project id
 * @param name new project name
 */
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

  return {_id:result._id, projectId:result.projectId};
}

/**
 * when execute a "delete project" operation, it actually hide the project
 * @param _id project id
 */
export const hideProject = async (_id:string|mongoose.Types.ObjectId) => {
  await Project.update({_id}, {ctype:'deletedProject', updatedAt: new Date()});
  // save to redis
  deleteProject(_id.toString());
}

/**
 * mark current project as "deleted" and revert its history version.
 * @param _id project id
 */
export const revertProject = async (_id:string|mongoose.Types.ObjectId) => {
  const project = await Project.findById(_id).exec();
  if(project.history && project.history[0]) {
    const historyProject = await Project.findById(project.history[0]).exec();
    // if the history is a "history", revert it to project, otherwise keep it same.
    if (historyProject.ctype === 'history') {
      historyProject.ctype = project.ctype;
      historyProject.save();
      // saveProject(historyProject);
      // saveProjectIdStr(historyProject.projectId.toString(), historyProject._id.toString());
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

/**
 * sometimes the project doesn't have a sequenceRef, or not all parts referencing the project
 * sequence. In this case, the project sequence needs to be updated before exporting
 * @param _id project id
 */
export const buildWholeProject = async (_id:string|mongoose.Types.ObjectId) => {
  const project = await Project.findById(_id).exec();
  if(!project) {
    throw createError(404, 'cannot find project');
  }

  const fileName = project.sequenceRef.fileName;
  // now verify if all parts has the same fileName
  const partIds = project.parts;
  const replaceDict:any = {};
  const parts = await AnnotationPart.find({_id:{$in:partIds}, 'sequenceRef.fileName':fileName}).sort({start:1, end:-1, level:1}).exec();
  if (parts === []) {
    return _id;
  }
  for (const part of parts) {
    const newPart:IAnnotationPart = part.toObject();
    delete newPart._id;
    newPart.sequenceRef = {
      fileName,
      start: part.start,
      end: part.end,
      strand: part.strand,
    };
    newPart.history = [
      {_id: part._id, updatedAt: part.updatedAt, changelog: part.changelog}, 
      ...part.history];
    const {_id:newPartId} = await AnnotationPart.create(newPart);
    replaceDict[_id.toString()] = newPartId;
  }
  project.parts = partIds.map(id=>replaceDict[id.toString()] || id);
  await project.save();
}
