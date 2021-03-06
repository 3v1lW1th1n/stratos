import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { CfCellHelper } from '../../../../../../core/src/features/cloud-foundry/cf-cell.helpers';
import { ListConfig } from '../../../../../../core/src/shared/components/list/list.component.types';
import { PaginationMonitorFactory } from '../../../../../../core/src/shared/monitors/pagination-monitor.factory';
import { AppState } from '../../../../../../store/src/app-state';
import {
  CfCellsListConfigService,
} from '../../../../shared/components/list/list-types/cf-cells/cf-cells-list-config.service';
import { getActiveRouteCfCellProvider } from '../../cf.helpers';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';

@Component({
  selector: 'app-cloud-foundry-cells',
  templateUrl: './cloud-foundry-cells.component.html',
  styleUrls: ['./cloud-foundry-cells.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: CfCellsListConfigService
    },
    getActiveRouteCfCellProvider,
  ]
})
export class CloudFoundryCellsComponent {
  hasCellMetrics$: Observable<boolean>;

  constructor(
    cfEndpointService: CloudFoundryEndpointService,
    store: Store<AppState>,
    paginationMonitorFactory: PaginationMonitorFactory
  ) {
    const cellHelper = new CfCellHelper(store, paginationMonitorFactory);
    this.hasCellMetrics$ = cellHelper.hasCellMetrics(cfEndpointService.cfGuid);
  }
}
