import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { UserService } from './services/user.service';
import { ServerService } from './services/server.service';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './navbar/navbar.component';
import { HomeComponent } from './components/home.component';
import { AboutComponent } from './components/about.component';
import { ValidatorDirective } from './directives/validator.directive';
import { SyncButtonComponent } from './components/sync-button.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    ValidatorDirective, SyncButtonComponent,
    HomeComponent, AboutComponent
  ],
  imports: [
    NgbModule,
    BrowserModule, HttpClientModule,
    AppRoutingModule,
    FontAwesomeModule
  ],
  providers: [ UserService, ServerService ],
  bootstrap: [AppComponent]
})
export class AppModule { }
