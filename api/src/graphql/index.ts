import {ApolloServer, gql} from 'apollo-server-koa'

export function useApolloServer(app:any) {
    const typeDefs = gql`
    type Project {
        name: String
    }

    type Query {
        projects: [Project]
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