import {ApolloServer, gql} from 'apollo-server-koa'
import { SourceChromosome } from '../models';

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

    type SourceFile {
        _id: ID
        name: String
        len: Int
        parts(from:Int, to:Int): [OriginPart]
    }

    type Query {
        projects: [Project]
        sourceFiles: [SourceFile]
        sourceFile(_id: ID): SourceFile
      }
    `;

    const resolvers = {
        Query: {
            projects: () => [],

            sourceFiles: async () => {
                return await SourceChromosome.find({}).select('_id name len').exec();
            },

            sourceFile: async (parent:any, args:any, context: any) => {
                const {_id} = args;
                console.log(args, context);
                const result = await SourceChromosome.findById(_id).populate('parts').exec();
                console.log(result)
                return result;
            }
        },
    }

    const apolloServer = new ApolloServer({typeDefs, resolvers});
    apolloServer.applyMiddleware({app, path:'/graphql'});
}