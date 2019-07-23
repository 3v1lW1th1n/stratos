import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import {
  errorFetchingFavoritesSelector,
  fetchingFavoritesSelector,
} from '../../../../../store/src/selectors/favorite-groups.selectors';
import { IFavoriteEntity, IGroupedFavorites, UserFavoriteManager } from '../../../core/user-favorite-manager';


interface IFavoritesInfo {
  fetching: boolean;
  error: boolean;
}

@Component({
  selector: 'app-favorites-global-list',
  templateUrl: './favorites-global-list.component.html',
  styleUrls: ['./favorites-global-list.component.scss']
})
export class FavoritesGlobalListComponent implements OnInit {
  public favInfo$: Observable<IFavoritesInfo>;
  public favoriteGroups$: Observable<IGroupedFavorites[]>;
  constructor(
    private store: Store<CFAppState>,
    private userFavoriteManager: UserFavoriteManager
  ) { }

  @Input() showFilters: boolean;

  ngOnInit() {
    this.favoriteGroups$ = this.userFavoriteManager.hydrateAllFavorites().pipe(
      map(favs => this.sortFavoriteGroups(favs))
    );

    this.favInfo$ = combineLatest(
      this.store.select(fetchingFavoritesSelector),
      this.store.select(errorFetchingFavoritesSelector)
    ).pipe(
      map(([fetching, error]) => ({
        fetching,
        error
      }))
    );
  }

  private sortFavoriteGroups(entityGroups: IGroupedFavorites[]) {
    if (!entityGroups) {
      return entityGroups;
    }
    return entityGroups.map(group => {
      if (group.entities) {
        group.entities = group.entities.sort(this.sortFavoriteGroup);
      }
      return group;
    });
  }

  private sortFavoriteGroup(entityA: IFavoriteEntity, entityB: IFavoriteEntity) {
    if (entityA.favorite.entityType < entityB.favorite.entityType) {
      return -1;
    }
    if (entityA.favorite.entityType > entityB.favorite.entityType) {
      return 1;
    }
    return 0;
  }

  public trackByEndpointId(index: number, group: IGroupedFavorites) {
    return group.endpoint.favorite.guid;
  }
}
