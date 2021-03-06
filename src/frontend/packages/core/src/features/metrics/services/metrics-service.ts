import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, publishReplay, refCount } from 'rxjs/operators';

import { APIResource, EntityInfo } from '../../../../../store/src/types/api.types';
import { endpointListKey, EndpointModel } from '../../../../../store/src/types/endpoint.types';
import { PaginationMonitor } from '../../../shared/monitors/pagination-monitor';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { getFullEndpointApiUrl } from '../../endpoints/endpoint-helpers';
import { endpointEntitySchema } from '../../../base-entity-schemas';

export interface MetricsEndpointProvider {
  provider: EndpointModel;
  endpoints: EndpointModel[];
}

@Injectable()
export class MetricsService {
  metricsEndpoints$: Observable<MetricsEndpointProvider[]>;
  endpointsMonitor: PaginationMonitor<EndpointModel>;
  waitForAppEntity$: Observable<EntityInfo<APIResource>>;
  haveNoMetricsEndpoints$: Observable<boolean>;
  haveNoConnectedMetricsEndpoints$: Observable<boolean>;

  constructor(
    private paginationMonitorFactory: PaginationMonitorFactory
  ) {
    this.endpointsMonitor = this.paginationMonitorFactory.create(
      endpointListKey,
      endpointEntitySchema
    );

    this.setupObservables();
  }

  private setupObservables() {
    this.metricsEndpoints$ = this.endpointsMonitor.currentPage$.pipe(
      map((endpoints: any) => {
        const result: MetricsEndpointProvider[] = [];
        const metrics = endpoints.filter(e => e.cnsi_type === 'metrics');
        metrics.forEach(ep => {
          const provider: MetricsEndpointProvider = {
            provider: ep,
            endpoints: [],
          };
          endpoints.forEach(e => {
            if (e.metadata && e.metadata.metrics && e.metadata.metrics === ep.guid) {
              provider.endpoints.push(e);
              e.url = getFullEndpointApiUrl(e);
            }
          });
          result.push(provider);
        });
        return result;
      }),
      publishReplay(1),
      refCount(),
    );

    this.haveNoMetricsEndpoints$ = this.endpointsMonitor.currentPage$.pipe(
      map((endpoints: any) => {
        const metrics = endpoints.filter(e => e.cnsi_type === 'metrics');
        return metrics.length === 0;
      }),
      publishReplay(1),
      refCount(),
    );

    this.haveNoConnectedMetricsEndpoints$ = this.endpointsMonitor.currentPage$.pipe(
      map((endpoints: any) => {
        const metrics = endpoints.filter(e => e.cnsi_type === 'metrics');
        const connected = metrics.filter(e => !!e.user);
        return connected.length === 0;
      }),
      publishReplay(1),
      refCount(),
    );
  }
}
