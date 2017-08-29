import { GetAll } from './store/actions/application.actions';
import { AppState } from './store/app-state';
import { Store } from '@ngrx/store';
import { AfterContentInit, Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements AfterContentInit {
  constructor(private store: Store<AppState>) {}
  title = 'app';

  ngAfterContentInit() {
    this.store.dispatch(new GetAll);
  }

}
