import { NgModule } from '@angular/core';

import { registerCFEntities } from './cf-entity-generator';
import { CloudFoundryComponentsModule } from './shared/components/components.module';
import { CloudFoundryReducersModule } from './store/reducers.module';

registerCFEntities();

@NgModule({
  imports: [
    // TODO: NJ split out anything lazy loaded into seperate module
    CloudFoundryComponentsModule,

    CloudFoundryReducersModule,

    // TODO: RC causes no cf store entities
    // EffectsModule.forRoot([
    //   PermissionsEffects,
    //   PermissionEffects
    // ])
  ],
})
export class CloudFoundryPackageModule { }
