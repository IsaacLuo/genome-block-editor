import { ConnectorType } from './Connector';
import { PaginationArgType } from './ArgTypes';
import { PartDefinition, PlateDefinition } from '../models';
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
import { PartType, PartDefinitionType } from './PartDefinition';

let UserType = new GraphQLObjectType({
  name: 'UserType',
  fields: {
    _id: {
      type: GraphQLID,
    },
    name: {
      type: GraphQLID,
    },
  }
})

let PlateContentType = new GraphQLObjectType({
  name: 'PlateContentType',
  fields: {
    _id: {type: GraphQLID},
    ctype: { type: GraphQLString },
    part: { type: PartDefinitionType },
    connector: {type: ConnectorType},
  }
})

export const PlateDefinitionType = new GraphQLObjectType({
  name: 'plate',
  fields: {
    _id: {type: GraphQLID},
    owner: { type: UserType },
    group: { type: GraphQLString }, 
    permission: { type: GraphQLInt },
    plateType: { type: GraphQLString },
    name: { type: GraphQLString },
    barcode: { type: GraphQLString },
    description: {type: GraphQLString},
    content: { type: new GraphQLList(PlateContentType) },
  }
})

export const plateDefinitions = {
  type: new GraphQLList(PlateDefinitionType),
  args: {
    pagination: { 
      type: PaginationArgType, 
        defaultValue: { offset: 0, first: 10 } 
      },
  },
  resolve (root, params, options) {
    return PlateDefinition
      .find({})
      .skip(params.pagination.offset)
      .limit(params.pagination.first)
      .populate({path:'content.connector', options:{retainNullValues:true}})
      .populate({path:'content.part', options:{retainNullValues:true}})
      .exec();
  }
}

export const plateDefinitionList = {
  type: new GraphQLList(PlateDefinitionType),
  args: {
  },
  resolve (root, params, options) {
    return PlateDefinition
      .find({})
      .exec();
  }
}


export const plateDefinition = {
  type: PlateDefinitionType,
  args: {
    id: {
      name: 'id',
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  resolve (root, params, options) {
    return PlateDefinition
      .findOne({_id:params.id})
      .populate({path:'content.connector', options:{retainNullValues:true}})
      .populate({path:'content.part', options:{retainNullValues:true}})
      .exec();
  }
}

export const plateDefinitionCount = {
  type: GraphQLInt,
  resolve (root, params, options) {
    return PlateDefinition.countDocuments().exec();
  }
}




