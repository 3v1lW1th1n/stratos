import { inject, TestBed } from '@angular/core/testing';

import { CoreTestingModule } from '../../test-framework/core-test.modules';
import { createBasicStoreModule } from '../../test-framework/store-test-helper';
import { PaginationMonitorFactory } from '../shared/monitors/pagination-monitor.factory';
import { CoreModule } from './core.module';
import { EndpointsService } from './endpoints.service';
import { UtilsService } from './utils.service';

describe('EndpointsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EndpointsService,
        UtilsService,
        PaginationMonitorFactory
      ],
      imports: [
        CoreModule,
        CoreTestingModule,
        createBasicStoreModule(),
      ]
    });
  });

  it('should be created', inject([EndpointsService], (service: EndpointsService) => {
    expect(service).toBeTruthy();
  }));
});
