import { Connector } from './../models';
import { PaginationArgType } from './ArgTypes';
import { PartDefinition } from '../models';
import {
  graphql,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
  isOutputType,
  GraphQLInputObjectType
} from 'graphql';

export const ConnectorType = new GraphQLObjectType({
  name: 'Connector',
  fields: {
    _id: { type: GraphQLID! },
    name: { type: GraphQLString },
    posBegin: { type: GraphQLInt },
    posEnd: { type: GraphQLInt },
    sequence: { type: GraphQLString },
    index: { type: GraphQLInt },
  }
})

export const connectors = {
  type: new GraphQLList(ConnectorType),
  args: {
  },
  resolve (root, params, options) {
    return Connector.find({}).sort('index').exec();
  }
}




