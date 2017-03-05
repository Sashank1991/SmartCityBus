import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import { AgmCoreModule } from 'angular2-google-maps/core';
import { mapCSS } from './directives/app.directive';
import { DirectionsMapDirective } from './directives/direction.directive';

@NgModule({
  declarations: [
    AppComponent,
    mapCSS,
    DirectionsMapDirective
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyA7KQ7lpnkZxVsS9C9Fuf95GFk3spAe8Zw'
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
