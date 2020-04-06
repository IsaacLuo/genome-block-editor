import {ApolloServer, gql} from 'apollo-server-koa'
import { Project, AnnotationPart, ProjectFolder } from '../models';
import {runExe} from '../runExe'
import fs from 'fs';
const { promisify } = require('util');
const fs_exists = promisify(fs.exists);
const fs_writeFile = promisify(fs.writeFile);
const fs_readFile = promisify(fs.readFile);

export function useApolloServer(app:any) {
  const typeDefs = gql`
  type Part {
    _id: ID
    len: Int
    featureType: String
    start: Int
    end: Int
    strand: Int
    name: String
    original: Boolean
    origin: OriginPart
    history: [String]
    createdAt: String
    updatedAt: String
  }

  type OriginPart {
    _id: ID
    featureType: String
    species: String
    chrId: Int
    chrName: String
    start: Int
    end: Int
    len: Int
    strand: Int
    name: String
  }

  type Project {
    _id: ID
    name: String
    version: String
    createdAt: String
    updatedAt: String
    parts: [Part]
  }

  input PartInput {
    _id: ID
    featureType: String
    species: String
    len: Int
    strand: Int
    name: String
    origin: ID
  }

  input ProjectInput {
    _id: ID
    name: String
    parts: [PartInput!]
  }

  type SourceFile {
    _id: ID
    name: String
    len: Int
    parts: [OriginPart]
    ctype: String
    createdAt: String
    updatedAt: String
  }

  type MutationResult {
    code: String!
    success: Boolean!
    message: String!
  }

  type ProjectFolder {
    _id: ID
    name: String
    subFolders: [ProjectFolder]
    projects: [SourceFile]
  }

  input Range {
    from: Int
    to: Int
  }

  type Query {
    projects: [Project]
    project(_id: ID): Project
    sourceFiles: [SourceFile]
    sourceFile(_id: ID, range: Range): SourceFile
    projectGenbank(_id:ID): String
    folder(_id: ID): ProjectFolder
    projectFolder: ProjectFolder
    part(_id: ID): Part
  }

  type Mutation {
    saveTestObject(_id:Int): MutationResult
    saveProject(project: ProjectInput): MutationResult
  }
  `;

  const resolvers = {
    // SourceFile: {
    //   parts: async (parent:any, args:any, context: any, info:any) => {
    //     console.log(parent.parts)
    //     return [{_id:"xxx", name:"xxxname", start:0, end:1}]
    //   },
    // },
    Query: {
      projects: async () => {
        return await Project
          .find({})
          .select('_id name owner group permission createdAt updatedAt')
          .exec();
      },

      project: async (parent:any, args:any, context: any) => {
        const {_id} = args;
        return await Project.findById(_id).exec();
      },

      projectGenbank: async (parent:any, args:any, context: any) => {
        const {_id} = args;
        let project = await Project.findById(_id).populate('parts').exec();
        if (!project) {
          return {code:404, success:false, message:'no project found'}
        }
        let targetFileContent:string|undefined;
        await runExe(
          {
            program:'pipenv', 
            params:['run', 'python', 'exportGB.py'], 
            options:{cwd:'utility'}
          }, 
          project, 
          (outputObj:any)=>{
            targetFileContent = outputObj.content;
        });
        return targetFileContent;
      },

      sourceFiles: async () => {
        return await Project.find({ctype:'source'}).select('_id name len').sort({name:1}).exec();
        // return await Project.find({ctype:'source'}).select('_id name len').exec();
      },

      sourceFile: async (parent:any, args:any, context: any, info:any) => {
        const {_id} = args;
        // let from, to;
        // if (args.range) {
        //   from = args.range.from;
        //   to = args.range.to;
        // }
        // if (!from) {
        //   from = 0;
        // }
        // if (!to) {
        //   to = Number.MAX_SAFE_INTEGER;
        //   // to=128*1024*100;
        // }
        const start = Date.now();
        let result = await Project.findById(_id).exec();

        let cacheFileName = './public/sourceFileCaches/'+_id;
        if (result.ctype !== 'source') {
          cacheFileName+= result.updatedAt.getTime();
        }
        cacheFileName+='.'
        cacheFileName+=result.ctype
        console.log(cacheFileName)
        if(await fs_exists(cacheFileName)) {
          console.log('cache file exists')
          return JSON.parse(await fs_readFile(cacheFileName));
        } else {
          console.log('cache file not exists')
          result = await Project.findById(_id)
          .populate({
            path:'parts', 
            // match:{
            //   start:{$lte:to}, 
            //   end:{$gte:from},
            // }
          })
          .exec();
          const time = Date.now() - start;
          console.log('time = ', time);
          const resultStr = JSON.stringify(result);
          fs_writeFile(cacheFileName, resultStr);
          return result;
        }
      },

      folder: async (parent:any, args:any, context: any, info:any) => {
        const {_id} = args;
        let condition;
        if (!_id) {
          condition = {name:'/'}
        }else {
          condition = {_id}
        }
        const result = await ProjectFolder
          .find(condition)
          .populate('subFolders','name')
          .populate({
            path:'projects',
            select:'name',
          })
          .exec();
        console.log(result);
        // console.log((result as any)[0].projects[0]);
        if (result[0].name === 'Project Files') {
          const list = result[0];
          list.projects = await Project.find({
            ctype:{$in:['project', 'flatProject']}
          }).select('_id name updatedAt').exec();
          return list;
        } else {
          return result[0];
        }
      },

      projectFolder: async (parent:any, args:any, context: any, info:any) => {
        const result = await ProjectFolder
          .findOne({name:'Project Files'})
          .populate('subFolders','name')
          .populate({
            path:'projects',
            select:'name',
          })
          .exec();
        const list = result;
        list.projects = await Project.find({
          ctype:{$in:['project', 'flatProject']}
        }).select('_id name updatedAt').exec();
        return list;
      },

      part: async (parent:any, args:any, context: any, info:any) => {
        const {_id} = args;
        const part = await AnnotationPart.findById(_id).exec();
        const partObj = part.toObject();
        partObj.len = part.end - part.start;
        
        if (partObj.createdAt) partObj.createdAt = partObj.createdAt.toJSON();
        if (partObj.updatedAt) partObj.updatedAt = partObj.updatedAt.toJSON();

        console.log(partObj.updatedAt);
        return partObj;
      },


    },
    Mutation: {
      saveTestObject: (parent:any, args:any, context: any) => {
        const {_id} = args;
        console.log(_id);
        return {code:200, success:true, message:'OK'}
      },
      saveProject: async (parent:any, args:any, context: any) => {
        const projectForm = args.project;
        // console.log(projectForm);
        let project = projectForm._id ? await Project.findById(projectForm._id).exec() : new Project();
        project.parts = await Promise.all(
          projectForm.parts.map(async v=>{
          if (v._id) {
            return v._id;
          } else {
            const part = await AnnotationPart.create({
              ...v,
              original: false,
              chrId:-1,
              chrName:'',
              start:0,
              end:v.len,
            });
            return part._id;
          }
        }));
        project.name = projectForm.name
        await project.save();
        return {code:200, success:true, message:'OK'}
      },

      // exportProject: async (parent:any, args:any, context: any) => {
      //   const {projectId} = args;
      //   let project = await Project.findById(projectId).populate('parts').exec();
      //   if (!project) {
      //     return {code:404, success:false, message:'no project found'}
      //   }
      //   let targetFileId:string|undefined;
      //   await runExe(
      //     {
      //       program:'pipenv', 
      //       params:['run', 'python', 'exportGB.py'], 
      //       options:{cwd:'utility'}
      //     }, 
      //     project, 
      //     (outputObj:any)=>{
      //       targetFileId = outputObj.fileURL;
      //   });
      //   return {code:200, success:true, message:'OK', _id:targetFileId}
      // },

    }
  }

  const apolloServer = new ApolloServer({typeDefs, resolvers});
  apolloServer.applyMiddleware({app, path:'/graphql'});
}