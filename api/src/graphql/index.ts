import {ApolloServer, gql} from 'apollo-server-koa'
import { SourceChromosome } from '../models';

export function useApolloServer(app:any) {
    const typeDefs = gql`
    type Part {
        len: Int
        featureType: String
        start: Int
        end: Int
        strand: String
        original: Boolean
        origin: OriginPart
    }

    type OriginPart {
        featureType: String
        species: String
        chrId: Int
        chrName: String
        start: Int
        end: Int
        len: Int
        strand: String
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
        parts: [OriginPart]
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
                return await SourceChromosome.find({}).select('_id name').exec();
            },

            sourceFile: async (parent:any, args:any, context: any) => {
                const {_id} = args;
                const result = await SourceChromosome.findById(_id).populate('parts').exec();
                return result;
            }
        },
    }

    const apolloServer = new ApolloServer({typeDefs, resolvers});
    apolloServer.applyMiddleware({app, path:'/graphql'});
}