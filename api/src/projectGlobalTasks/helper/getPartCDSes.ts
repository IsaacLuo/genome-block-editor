import { IAnnotationPartModel, AnnotationPart, IProjectModel } from "../../models";

export default async function getCDSes(project:IProjectModel, part:IAnnotationPartModel):Promise<IAnnotationPartModel[]> {
  let cdses;
  if (part.cdses && part.cdses.length > 0) {
    cdses = await AnnotationPart.find({$and:[
      {_id:{$in: part.cdses}},
      {_id:{$in: project.parts}},
    ]})
    .sort(part.strand < 1 ? {end:-1} : {start:1})
    .exec();
  } else {
    let allSubFeatures = [];
    let subs;
    let parentIds = [part._id];
    while(parentIds.length > 0) {
      subs = await AnnotationPart.find({
        _id:{$in:project.parts},
        parent: {$in:parentIds},
      }).select('_id, parent').exec();
      parentIds = subs.map(v=>v._id);
      allSubFeatures = allSubFeatures.concat(parentIds);
    }

    cdses = await AnnotationPart.find({
      _id:{$in:allSubFeatures}, 
      featureType:'CDS',
    })
    .sort(part.strand < 1 ? {end:-1} : {start:1})
    .exec();

    part.cdses = cdses;
    await part.save();
  }
  return cdses;
}