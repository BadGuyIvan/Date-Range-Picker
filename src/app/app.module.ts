import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { MonthRangePickerComponent } from './month-range-picker/month-range-picker.component';

@NgModule({
  declarations: [
    AppComponent,
    MonthRangePickerComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
