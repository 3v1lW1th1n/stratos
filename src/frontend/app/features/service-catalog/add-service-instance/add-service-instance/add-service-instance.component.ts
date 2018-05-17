import { TitleCasePipe } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { filter, map, take, tap, publishReplay, refCount, first } from 'rxjs/operators';

import { IApp, ISpace } from '../../../../core/cf-api.types';
import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import { CfOrgSpaceDataService } from '../../../../shared/data-services/cf-org-space-service.service';
import { GetApplication } from '../../../../store/actions/application.actions';
import { SetCreateServiceInstanceCFDetails } from '../../../../store/actions/create-service-instance.actions';
import { AppState } from '../../../../store/app-state';
import { applicationSchemaKey, entityFactory, spaceWithOrgKey, spaceSchemaKey } from '../../../../store/helpers/entity-factory';
import { APIResource } from '../../../../store/types/api.types';
import { servicesServiceFactoryProvider } from '../../service-catalog.helpers';
import { CreateServiceInstanceHelperService, Mode } from '../create-service-instance-helper.service';
import { getIdFromRoute } from '../../../cloud-foundry/cf.helpers';
import { createEntityRelationKey } from '../../../../store/helpers/entity-relations.types';

@Component({
  selector: 'app-add-service-instance',
  templateUrl: './add-service-instance.component.html',
  styleUrls: ['./add-service-instance.component.scss'],
  providers: [
    servicesServiceFactoryProvider,
    CreateServiceInstanceHelperService,
    TitleCasePipe
  ]
})
export class AddServiceInstanceComponent {
  displaySelectServiceStep: boolean;
  displaySelectCfStep: boolean;
  title$: Observable<string>;
  serviceInstancesUrl: string;
  servicesWallCreateInstance = false;
  stepperText = 'Select a Cloud Foundry instance, organization and space for the service instance.';
  bindAppStepperText = 'Bind App (Optional)';
  appId: string;
  constructor(
    private cSIHelperService: CreateServiceInstanceHelperService,
    private activatedRoute: ActivatedRoute,
    private store: Store<AppState>,
    private cfOrgSpaceService: CfOrgSpaceDataService,
    private entityServiceFactory: EntityServiceFactory
  ) {

    const serviceId = getIdFromRoute(activatedRoute, 'serviceId');
    const cfId = getIdFromRoute(activatedRoute, 'cfId');
    const id = getIdFromRoute(activatedRoute, 'id');
    if (!!serviceId && !!cfId) {
      cSIHelperService.initService(cfId, serviceId, Mode.MARKETPLACE);
    }


    this.displaySelectCfStep = this.setupSelectCFStep();
    this.displaySelectServiceStep = this.setupSelectServiceStep();

    if (cSIHelperService.isMarketplace()) {
      cSIHelperService.isInitialised().pipe(
        take(1),
        tap(o => {
          const serviceGuid = serviceId;
          this.serviceInstancesUrl = `/service-catalog/${cfId}/${serviceGuid}/instances`;
          this.title$ = this.cSIHelperService.getServiceName().pipe(
            map(label => `Create Instance: ${label}`)
          );
        })
      ).subscribe();
    } else if (!!cfId && !!id) {
      // App services mode
      this.appId = id;
      const entityService = this.entityServiceFactory.create<APIResource<IApp>>(
        applicationSchemaKey,
        entityFactory(applicationSchemaKey),
        id,
        new GetApplication(id, cfId, [createEntityRelationKey(applicationSchemaKey, spaceSchemaKey)]),
        true
      );
      entityService.waitForEntity$.pipe(
        filter(p => !!p),
        tap(app => {
          const spaceEntity = app.entity.entity.space as APIResource<ISpace>;
          this.store.dispatch(new SetCreateServiceInstanceCFDetails(
            cfId,
            spaceEntity.entity.organization_guid,
            app.entity.entity.space_guid
          ));
          this.title$ = Observable.of(`Create Or Bind Service Instance to '${app.entity.entity.name}'`);

        }),

        take(1),
      ).subscribe();
    } else {
      this.servicesWallCreateInstance = true;
      this.title$ = Observable.of(`Create Service Instance`);
    }
  }

  setupSelectCFStep = () => {
    // Show Select CF Step only when in the Services Wall mode
    const serviceId = getIdFromRoute(this.activatedRoute, 'serviceId');
    const cfId = getIdFromRoute(this.activatedRoute, 'cfId');
    const id = getIdFromRoute(this.activatedRoute, 'id');
    if (!serviceId && !cfId && !id) {
      return true;
    } else {
      return false;
    }
  }
  setupSelectServiceStep = () => {
    // Don't show this in marketplace Mode
    const serviceId = getIdFromRoute(this.activatedRoute, 'serviceId');
    const cfId = getIdFromRoute(this.activatedRoute, 'cfId');
    if (!!serviceId && !!cfId) {
      return false;
    } else {
      return true;
    }
  }

  onNext = () => {
    this.store.dispatch(new SetCreateServiceInstanceCFDetails(
      this.cfOrgSpaceService.cf.select.getValue(),
      this.cfOrgSpaceService.org.select.getValue(),
      this.cfOrgSpaceService.space.select.getValue()
    ));
    return Observable.of({ success: true });
  }

}