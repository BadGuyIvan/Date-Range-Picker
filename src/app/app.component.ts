import { Component } from '@angular/core';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'angular-month-range-picker';
  fistDay: Date;
  lastDay: Date;
  selectedDays([firstDay, lastDay]){
    this.fistDay = new Date(firstDay)
    this.lastDay = new Date(lastDay)
  }
}
