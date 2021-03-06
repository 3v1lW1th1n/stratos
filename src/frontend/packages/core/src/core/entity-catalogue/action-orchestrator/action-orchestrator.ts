import { HttpHeaders, HttpParams, HttpRequest } from '@angular/common/http';
import { Action } from '@ngrx/store';

import { EntitySchema } from '../../../../../store/src/helpers/entity-schema';
import { PaginatedAction } from '../../../../../store/src/types/pagination.types';
import { EntityRequestAction, StartAction } from '../../../../../store/src/types/request.types';
import { Omit } from '../../utils.service';
import { EntityActionDispatcherManager } from '../action-dispatcher/action-dispatcher';

export interface ActionBuilderAction extends EntityRequestAction {
  actionBuilderActionType: string;
}

// A function that returns a ICFAction
export type OrchestratedActionBuilder<
  T extends any[] = any[],
  Y extends Action = Action
  > = (...args: T) => Y;


export type KnownEntityActionBuilder<
  T extends Record<any, any> = Record<any, any>
  > = (guid: string, endpointGuid: string, extraArgs?: T) => EntityRequestAction;
// createTrackingId should be unique to the thing that's being created.
// It is used to track the status of the entity creation.
type CreateActionBuilder<
  T extends Record<any, any> = Record<any, any>
  > = (createTrackingId: string, endpointGuid: string, extraArgs?: T) => EntityRequestAction;
// paginationKey could be optional, we could give it a default value.
export type GetMultipleActionBuilder<T extends Record<any, any> = Record<any, any>> = (
  endpointGuid: string,
  paginationKey: string,
  extraArgs?: T
) => PaginatedAction;

export interface EntityRequestInfo {
  requestConfig?: BaseEntityRequestConfig;
  schemaKey?: string;
  externalRequest?: boolean;
}

// This is used to create a basic single entity pipeline action.
export class EntityRequestActionConfig<T extends OrchestratedActionBuilder> {
  public requestConfig: BaseEntityRequestConfig;
  public schemaKey: string;
  public externalRequest: boolean;
  constructor(
    public getUrl: (...args: Parameters<T>) => string,
    {
      requestConfig = {},
      schemaKey = null,
      externalRequest = false
    }: EntityRequestInfo
  ) {
    this.requestConfig = requestConfig;
    this.schemaKey = schemaKey;
    this.externalRequest = externalRequest;
  }
}

// This is used to create a basic pagination entity pipeline action.
export class PaginationRequestActionConfig<T extends OrchestratedActionBuilder> {
  public requestConfig: BaseEntityRequestConfig;
  public schemaKey: string;
  public externalRequest: boolean;
  constructor(
    public paginationKey: string,
    public getUrl: (...args: Parameters<T>) => string,
    {
      requestConfig = {},
      schemaKey = null,
      externalRequest = false
    }: EntityRequestInfo
  ) {
    this.requestConfig = requestConfig;
    this.schemaKey = schemaKey;
    this.externalRequest = externalRequest;
  }
}

export interface BaseEntityRequestConfig {
  httpMethod?: BaseEntityRequestMethods;
  requestInit?: {
    headers?: HttpHeaders;
    reportProgress?: boolean;
    params?: HttpParams;
    responseType?: 'arraybuffer' | 'blob' | 'json' | 'text';
    withCredentials?: boolean;
  };
  requestBody?: any;
}

export type BasePaginationRequestConfig = Omit<BaseEntityRequestConfig, 'httpMethod'>;

export type BaseEntityRequestMethods = 'DELETE' | 'GET' | 'HEAD' | 'JSONP' | 'OPTIONS' | 'POST' | 'PUT' | 'PATCH';

export class BasePipelineRequestAction<M extends Array<any> = any[]> extends StartAction {
  constructor(
    public entityType: string,
    public endpointType: string,
    // entity should not be optional but for legacy reason it is.
    // #3845
    public entity?: EntitySchema | EntitySchema[],
    public endpointGuid?: string,
    // If the action was generated by action builder config then metadata is extra values that were used to generate this action.
    // e.g. the standard get action dispatcher take the params (guid, endpointGuid)
    // If that get dispatcher is passed (guid, endpointGuid, personsName, personAge) then metadata would contain [personsName, personAge]
    public metadata?: M,
    // Non jetstream request?
    // If this is set to true then we will not prepend the jetstream url parts and
    // will not add the endpoint guids to the headers.
    public externalRequest?: boolean
  ) {
    super();
  }
}

// This action will be created by the entity catalogue from single request entity builder configs.
export class BaseEntityRequestAction extends BasePipelineRequestAction implements EntityRequestAction {
  public options: HttpRequest<any>;
  public updatingKey = null;
  constructor(
    entity: EntitySchema | EntitySchema[],
    public guid: string,
    endpointGuid: string,
    entityType: string,
    endpointType: string,
    url: string,
    requestConfig: BaseEntityRequestConfig,
    metadata: any[] = [],
    externalRequest: boolean = false
  ) {
    super(entityType, endpointType, entity, endpointGuid, metadata, externalRequest);
    this.options = new HttpRequest(requestConfig.httpMethod || 'GET', url, requestConfig.requestBody, requestConfig.requestInit);
  }
}

// This action will be created by the entity catalogue from multi request entity builder configs.
export class BasePaginationRequestAction extends BasePipelineRequestAction implements EntityRequestAction {
  public options: HttpRequest<any>;
  constructor(
    entity: EntitySchema | EntitySchema[],
    // If pagination key is null then we expect it to come from the action builder.
    public paginationKey: string | null,
    endpointGuid: string,
    entityType: string,
    endpointType: string,
    url: string,
    requestConfig: BasePaginationRequestConfig,
    metadata: any[] = [],
    jetstreamRequest: boolean = true

  ) {
    super(entityType, endpointType, entity, endpointGuid, metadata, !jetstreamRequest);
    this.options = new HttpRequest('GET', url, requestConfig.requestBody, requestConfig.requestInit);
  }
}


// A list of functions that can be used get interface with the entity
export interface OrchestratedActionBuilders {
  get?: KnownEntityActionBuilder;
  remove?: KnownEntityActionBuilder;
  update?: KnownEntityActionBuilder;
  create?: CreateActionBuilder;
  getMultiple?: GetMultipleActionBuilder;
  [actionType: string]: OrchestratedActionBuilder;
}

export interface OrchestratedActionBuilderConfig {
  get?: KnownEntityActionBuilder | EntityRequestActionConfig<KnownEntityActionBuilder>;
  remove?: KnownEntityActionBuilder | EntityRequestActionConfig<KnownEntityActionBuilder>;
  update?: KnownEntityActionBuilder | EntityRequestActionConfig<KnownEntityActionBuilder>;
  create?: CreateActionBuilder | EntityRequestActionConfig<CreateActionBuilder>;
  getMultiple?: GetMultipleActionBuilder | PaginationRequestActionConfig<GetMultipleActionBuilder>;
  [actionType: string]: OrchestratedActionBuilder |
  EntityRequestActionConfig<KnownEntityActionBuilder> |
  PaginationRequestActionConfig<GetMultipleActionBuilder>;
}

export class OrchestratedActionBuildersClass implements OrchestratedActionBuilders {
  [actionType: string]: OrchestratedActionBuilder<any[], EntityRequestAction>;
}
export class ActionOrchestrator<T extends OrchestratedActionBuilders = OrchestratedActionBuilders> {

  public getEntityActionDispatcher(actionDispatcher?: (action: Action) => void) {
    return new EntityActionDispatcherManager<T>(actionDispatcher, this);
  }
  public getActionBuilder<Y extends keyof T>(actionType: Y) {
    const actionBuilderForType = this.actionBuilders[actionType];
    if (!actionBuilderForType) {
      return null;
    }
    return (...args: Parameters<T[Y]>): ReturnType<T[Y]> => {
      const action = actionBuilderForType(...args) as ActionBuilderAction;
      if (action) {
        action.actionBuilderActionType = actionType as string;
      }
      return action as ReturnType<T[Y]>;
    };
  }

  public hasActionBuilder(actionType: keyof T) {
    return !!this.actionBuilders[actionType];
  }

  constructor(public entityKey: string, private actionBuilders: T = {} as T) { }
}
