import { connectors } from './Connector';
import {
  GraphQLSchema,
  GraphQLObjectType,
} from 'graphql';

import { 
  partDefinition, 
  partDefinitions, 
  partDefinitionCount,
} from './PartDefinition';
import {
  plateDefinitions,
  plateDefinitionList,
  plateDefinitionCount,
  plateDefinition,
} from './PlateDefinition';


export default new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Queries',
    fields: {
      partDefinitions,
      partDefinition,
      partDefinitionCount,
      plateDefinitions,
      plateDefinitionList,
      plateDefinitionCount,
      plateDefinition,
      connectors,
    }
  })
})

