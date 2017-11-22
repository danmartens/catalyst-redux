// @flow

// import dotProp from 'dot-prop-immutable';

export type AsyncStatus = null | 'pending' | 'success' | 'error';

export type ResourceID = string | number;
export type ResourceClientID = string;
export type ResourceType = string;
export type RelationshipName = string;
export type Relationship = { type: ResourceType, id: ResourceID };

export type ResourceStatus =
  | null
  | 'find.pending'
  | 'find.success'
  | 'find.error'
  | 'create.pending'
  | 'create.success'
  | 'create.error'
  | 'update.pending'
  | 'update.success'
  | 'update.error'
  | 'destroy.pending'
  | 'destroy.success'
  | 'destroy.error';

export type JSONAPIRelationshipData = Relationship | Array<Relationship>;

export type JSONAPIRelationships = {
  [RelationshipName]: {
    data: JSONAPIRelationshipData
  }
};

export type NewJSONAPIResource = {|
  type: ResourceType,
  attributes: Object,
  relationships?: JSONAPIRelationships
|};

export type JSONAPIResource = NewJSONAPIResource & {|
  id: ResourceID
|};

export type ResourceModuleState = {
  resources: { [ResourceType]: { [ResourceID]: Object } },
  newResources: { [ResourceType]: { [ResourceClientID]: Object } },
  resourceRelationships: {
    [ResourceType]: {
      [ResourceID]: {
        [RelationshipName]: Relationship | Array<Relationship>
      }
    }
  },
  resourceStatus: {
    [ResourceType]: ResourceStatus | { [ResourceID]: ResourceStatus }
  },
  newResourceStatus: {
    [ResourceType]: { [ResourceClientID]: ResourceStatus }
  },
  newResourceIDMap: { [ResourceType]: { [ResourceClientID]: ResourceID } }
};

export type JSONAPIDocument = {|
  data: JSONAPIResource | Array<JSONAPIResource>,
  included?: Array<JSONAPIResource>
|};
