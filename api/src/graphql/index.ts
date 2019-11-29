import {ApolloServer, gql} from 'apollo-server-koa'

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
        name: String
        version: String
        createdAt: String
        updatedAt: String
        parts: [Part]
    }

    type SourceFile {
        name: String
        parts: [OriginPart]
    }

    type Query {
        projects: [Project]
        sourceFiles: [Project]
      }
    `;

    const resolvers = {
     Query: {
        projects: () => [],
        },
    }

    const apolloServer = new ApolloServer({typeDefs, resolvers});
    apolloServer.applyMiddleware({app, path:'/graphql'});
}