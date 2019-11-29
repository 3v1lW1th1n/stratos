import { Component } from '@angular/core';
import { ITileConfig, ITileData } from '../../../shared/components/tile/tile-selector.types';
import { Store } from '@ngrx/store';
import { GeneralEntityAppState } from '../../../../../store/src/app-state';
import { RouterNav } from '../../../../../store/src/actions/router.actions';
import { BASE_REDIRECT_QUERY } from '../../../shared/components/stepper/stepper.types';

@Component({
  selector: 'app-setup-welcome',
  templateUrl: './setup-welcome.component.html',
  styleUrls: ['./setup-welcome.component.scss']
})
export class SetupWelcomeComponent {

  public tileSelectorConfig = [
    new ITileConfig<ITileData>(
      'Local Admin',
      { matIcon: 'person' },
      { type: 'local' },
      false,
      'Use a built-in single Admin User account'
    ),
    new ITileConfig<ITileData>(
      'Cloud Foundry UAA',
      {
        location: '/core/assets/endpoint-icons/cloudfoundry.png',
      },
      { type: 'uaa' },
      false,
      'Use a Cloud Foundry UAA for user authentication'
    )

  ];

  constructor(public store: Store<GeneralEntityAppState>) {}

   public selectionChange(tile: ITileConfig<ITileData>) {
    if (tile) {
      this.store.dispatch(new RouterNav({
        path: `setup/${tile.data.type}`,
        query: {
          [BASE_REDIRECT_QUERY]: 'setup'
        }
      }));
    }
  }


}
