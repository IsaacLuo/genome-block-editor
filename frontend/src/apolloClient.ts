import ApolloClient from 'apollo-boost';
import { InMemoryCache } from 'apollo-cache-inmemory';
import conf from './conf.json';

const apolloClient = new ApolloClient({
  uri: `${conf.backendURL}/graphql`,
  cache: new InMemoryCache(),
});

export default function () {
  return apolloClient;
}