import {ApolloServer, gql} from 'apollo-server-koa'
import { SourceChromosome, Project, AnnotationPart } from '../models';

export function useApolloServer(app:any) {
  const typeDefs = gql`
  type Part {
    _id: ID
    len: Int
    featureType: String
    start: Int
    end: Int
    strand: String
    name: String
    original: Boolean
    origin: OriginPart
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
    strand: String
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
    strand: String
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
    parts(from:Int, to:Int): [OriginPart]
  }

  type MutationResult {
    code: String!
    success: Boolean!
    message: String!
  }

  type Query {
    projects: [Project]
    project(_id: ID): Project
    sourceFiles: [SourceFile]
    sourceFile(_id: ID): SourceFile
  }

  type Mutation {
    saveTestObject(_id:Int): MutationResult
    saveProject(project: ProjectInput): MutationResult
  }
  `;

  const resolvers = {
    Query: {
      projects: async () => {
        return await Project
          .find({})
          .select('_id name owner group permission createdAt updatedAt')
          .exec();
        
      },

      project: async (parent:any, args:any, context: any) => {
        const {_id} = args;
        return await Project.findById(_id).populate('parts').exec();
      },

      sourceFiles: async () => {
        return await SourceChromosome.find({}).select('_id name len').exec();
      },

      sourceFile: async (parent:any, args:any, context: any) => {
        const {_id} = args;
        const result = await SourceChromosome.findById(_id).populate('parts').exec();
        return result;
      }
    },
    Mutation: {
      saveTestObject: (parent:any, args:any, context: any) => {
        const {_id} = args;
        console.log(_id);
        return {code:200, success:true, message:'OK'}
      },
      saveProject: async (parent:any, args:any, context: any) => {
        const projectForm = args.project;
        console.log(projectForm);
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
      }
    }
  }

  const apolloServer = new ApolloServer({typeDefs, resolvers});
  apolloServer.applyMiddleware({app, path:'/graphql'});
}