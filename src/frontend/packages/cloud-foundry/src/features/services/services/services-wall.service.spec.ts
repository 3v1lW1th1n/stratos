import { inject, TestBed } from '@angular/core/testing';

import { EntityServiceFactory } from '../../../../../core/src/core/entity-service-factory.service';
import { PaginationMonitorFactory } from '../../../../../core/src/shared/monitors/pagination-monitor.factory';
import { generateCfBaseTestModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ServicesWallService } from './services-wall.service';

describe('ServicesWallService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ServicesWallService,
        EntityServiceFactory,
        PaginationMonitorFactory],
      imports: generateCfBaseTestModules()
    });
  });

  it('should be created', inject([ServicesWallService], (service: ServicesWallService) => {
    expect(service).toBeTruthy();
  }));
});
