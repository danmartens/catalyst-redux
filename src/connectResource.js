// @flow

import * as React from 'react';
import { connect } from 'react-redux';

import type {
  ResourceID,
  ResourceClientID,
  ResourceStatus,
  ResourceModuleState
} from './types';

type ResourceProps = {
  resourceID?: ResourceID
};

type ResourceState = { resourceClientID: ?ResourceClientID };

type ConnectedComponentProps = {
  onResourceCreate: (resourceClientID: ResourceClientID) => void
} & ResourceProps &
  ResourceState;

type WrappedComponentConnectProps = {
  resource: ?Object,
  resourceStatus: ResourceStatus,
  onCreate: (attributes: Object, options?: Object) => ResourceClientID,
  onUpdate: (attributes: Object, options?: Object) => void
};

export type ResourceProvidedProps<
  WrappedComponentProps
> = ConnectedComponentProps &
  WrappedComponentConnectProps &
  WrappedComponentProps;

/*
 * Creates a HOC which accepts a component to be used for creating a new
 * resource of type `resourceType`. Manages all of the logic for persisting the
 * new resource and passes the creation status and (if successful) the created
 * resource to the wrapped component.
 */
export default function connectResource(
  resourcesModule: Object,
  resourceType: string
) {
  return function<Props: {}>(
    WrappedComponent: React.ComponentType<ResourceProps & Props>
  ): React.ComponentType<Props> {
    const mapStateToProps = (
      state: { resources: ResourceModuleState },
      props: ConnectedComponentProps
    ) => {
      const { resourceClientID, resourceID } = props;
      let resource = null;

      // TODO: This could be simplified by exchanging the clientID for the
      // corresponding resourceID instead of the resource.
      if (resourceID != null) {
        resource = resourcesModule.selectors.find(
          state,
          resourceType,
          resourceID
        );
      } else if (resourceClientID != null) {
        resource = resourcesModule.selectors.resourceForClientID(
          state,
          resourceType,
          resourceClientID
        );
      }

      let resourceStatus = null;

      // TODO: This could be simplified by exchanging the clientID for the
      // corresponding resourceID instead of the resource.
      if (resourceID != null) {
        resourceStatus = resourcesModule.selectors.resourceStatus(
          state,
          resourceType,
          resourceID
        );
      } else if (resourceClientID != null) {
        resourceStatus = resourcesModule.selectors.newResourceStatus(
          state,
          resourceType,
          resourceClientID
        );
      }

      return {
        resource,
        resourceStatus
      };
    };

    const mapDispatchToProps = (
      dispatch: Object => void,
      props: ConnectedComponentProps
    ) => {
      return {
        onCreate(attributes: Object, options?: Object = {}) {
          const action = resourcesModule.actions.create(
            resourceType,
            attributes,
            options
          );

          dispatch(action);

          props.onResourceCreate(action.payload.clientID);
        },
        onUpdate(attributes: Object, options?: Object = {}) {
          if (props.resourceID != null) {
            dispatch(
              resourcesModule.actions.update(
                resourceType,
                props.resourceID,
                attributes,
                options
              )
            );
          } else {
            // TODO: Handle unexpected state
          }
        },
        onDestroy() {
          if (props.resourceID != null) {
            dispatch(
              resourcesModule.actions.destroy(resourceType, props.resourceID)
            );
          } else {
            // TODO: Handle unexpected state
          }
        }
      };
    };

    const Connected: React.ComponentType<ConnectedComponentProps> = connect(
      mapStateToProps,
      mapDispatchToProps
    )(WrappedComponent);

    class Resource extends React.PureComponent<Props, ResourceState> {
      state = { resourceClientID: null };

      handleResourceCreate = (resourceClientID: ResourceClientID) => {
        this.setState({ resourceClientID });
      };

      render() {
        return (
          <Connected
            onResourceCreate={this.handleResourceCreate}
            {...this.props}
            {...this.state}
          />
        );
      }
    }

    Resource.displayName = `Resource(${getDisplayName(WrappedComponent)})`;

    return Resource;
  };
}

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}
