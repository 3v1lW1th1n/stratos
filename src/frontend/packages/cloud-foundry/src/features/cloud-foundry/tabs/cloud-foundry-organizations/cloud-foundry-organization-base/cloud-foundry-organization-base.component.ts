import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, first, map } from 'rxjs/operators';

import { organizationEntityType } from '../../../../../../../cloud-foundry/src/cf-entity-types';
import { IOrgFavMetadata } from '../../../../../../../cloud-foundry/src/cf-metadata-types';
import {
  getActionsFromExtensions,
  getTabsFromExtensions,
  StratosActionMetadata,
  StratosActionType,
  StratosTabType,
} from '../../../../../../../core/src/core/extension/extension-service';
import { getFavoriteFromCfEntity } from '../../../../../../../core/src/core/user-favorite-helpers';
import { environment } from '../../../../../../../core/src/environments/environment.prod';
import { IPageSideNavTab } from '../../../../../../../core/src/features/dashboard/page-side-nav/page-side-nav.component';
import {
  FavoritesConfigMapper,
} from '../../../../../../../core/src/shared/components/favorites-meta-card/favorite-config-mapper';
import { IHeaderBreadcrumb } from '../../../../../../../core/src/shared/components/page-header/page-header.types';
import { EntitySchema } from '../../../../../../../store/src/helpers/entity-schema';
import { UserFavorite } from '../../../../../../../store/src/types/user-favorites.types';
import { cfEntityFactory } from '../../../../../cf-entity-factory';
import { CfUserService } from '../../../../../shared/data-services/cf-user.service';
import { getActiveRouteCfOrgSpaceProvider } from '../../../cf.helpers';
import { CloudFoundryEndpointService } from '../../../services/cloud-foundry-endpoint.service';
import { CloudFoundryOrganizationService } from '../../../services/cloud-foundry-organization.service';

@Component({
  selector: 'app-cloud-foundry-organization-base',
  templateUrl: './cloud-foundry-organization-base.component.html',
  styleUrls: ['./cloud-foundry-organization-base.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider,
    CfUserService,
    CloudFoundryEndpointService,
    CloudFoundryOrganizationService
  ]
})
export class CloudFoundryOrganizationBaseComponent {

  tabLinks: IPageSideNavTab[] = [
    {
      link: 'summary',
      label: 'Summary',
      icon: 'description'
    },
    {
      link: 'spaces',
      label: 'Spaces',
      icon: 'language'
    },
    {
      link: 'users',
      label: 'Users',
      icon: 'people'
    },
    {
      link: 'quota',
      label: 'Quota',
      icon: 'data_usage'
    },
    {
      link: 'space-quota-definitions',
      label: 'Space Quotas',
      icon: 'data_usage'
    }
  ];
  public breadcrumbs$: Observable<IHeaderBreadcrumb[]>;

  public name$: Observable<string>;

  // Used to hide tab that is not yet implemented when in production
  public isDevEnvironment = !environment.production;

  public schema: EntitySchema;

  public extensionActions: StratosActionMetadata[] = getActionsFromExtensions(StratosActionType.CloudFoundryOrg);

  public favorite$: Observable<UserFavorite<IOrgFavMetadata>>;

  constructor(
    public cfEndpointService: CloudFoundryEndpointService,
    public cfOrgService: CloudFoundryOrganizationService,
    favoritesConfigMapper: FavoritesConfigMapper
  ) {
    this.schema = cfEntityFactory(organizationEntityType);
    this.favorite$ = cfOrgService.org$.pipe(
      first(),
      map(org => getFavoriteFromCfEntity<IOrgFavMetadata>(org.entity, organizationEntityType, favoritesConfigMapper))
    );
    this.name$ = cfOrgService.org$.pipe(
      map(org => org.entity.entity.name),
      filter(name => !!name),
      first()
    );
    this.breadcrumbs$ = this.getBreadcrumbs();

    // Add any tabs from extensions
    this.tabLinks = this.tabLinks.concat(getTabsFromExtensions(StratosTabType.CloudFoundryOrg));
  }

  private getBreadcrumbs() {
    return this.cfEndpointService.endpoint$.pipe(
      map(endpoint => ([
        {
          breadcrumbs: [
            {
              value: endpoint.entity.name,
              routerLink: `/cloud-foundry/${endpoint.entity.guid}/organizations`
            }
          ]
        }
      ])),
      first()
    );
  }
}
