import { Component, OnInit, AfterViewInit, ViewChildren, QueryList, ElementRef, Renderer2, OnDestroy } from '@angular/core';
import * as moment from "moment";
import { chunck } from '../shared/chunck';
import { take, scan, repeat } from 'rxjs/operators';
import { fromEvent, merge, Subscription } from 'rxjs';

@Component({
  selector: 'app-month-range-picker',
  templateUrl: './month-range-picker.component.html',
  styleUrls: ['./month-range-picker.component.scss'],
})
export class MonthRangePickerComponent implements OnInit, AfterViewInit, OnDestroy {

  constructor(private element: ElementRef, private renderer: Renderer2) { }

  @ViewChildren('weekday') days_of_the_month: QueryList<ElementRef>;

  dayClickSubscription: Subscription;
  viewChangesSubscription: Subscription;

  date = moment();
  currentMonthDates: any[]
  weekDays = moment.weekdays()

  previousMonth() {
    this.date = moment(this.date.subtract(1, 'months'))
    this.createDatePicker()
  }
  nextMonth() {
    this.date = moment(this.date.add(1, 'months'))
    this.createDatePicker()
  }

  createDatePicker() {
    this.currentMonthDates = new Array(moment(this.date).daysInMonth()).fill(null).map((x, i) => moment(this.date).startOf('month').add(i, 'days').toDate());

    // var range_42 = new Array(42).fill(null).map(
    //   (_, i) => {
    //     let firstDayInMonth = moment(this.date).startOf('month').day()
    //     if( firstDayInMonth > 0) {
    //       return moment(this.date).startOf('month').add((i-firstDayInMonth), 'days').toDate()
    //     }else {
    //       return moment(this.date).startOf('month').add(i, 'days').toDate()
    //     }
    //   });

    if (this.currentMonthDates[0].getDay() > 0) {

      //calculate days before the first day in the month.
      let days = new Array(this.currentMonthDates[0].getDay()).fill(null);

      //If the month doesn't start from Sunday, then it is necessary to add days to the start array.
      this.currentMonthDates.unshift(...days);

    }

    // if (this.currentMonthDates[this.currentMonthDates.length - 1].getDay() < 6) {
    //   //calculate days after the last day in the month.
    //   let days = new Array(6 - this.currentMonthDates[this.currentMonthDates.length - 1].getDay()).fill(null);

    //   this.currentMonthDates.push(...days);
    // }

    // this.currentMonthDates = chunck(range_42, 7);

    // this.currentMonthDates = chunck(this.currentMonthDates, 7)
  }

  onSelectedDate() {
    var Clicks = this.days_of_the_month.filter(((item: ElementRef) => {
      return item.nativeElement.className !== 'offset';
    })).map((t) => fromEvent(t.nativeElement, 'click'))

    this.dayClickSubscription = merge(...Clicks).pipe(
      take(2),
      scan((arr: Array<EventTarget>, prev: MouseEvent) => arr.concat(prev.target), []),
      repeat(),
    ).subscribe(
      (event: Array<EventTarget>) => {
        let [startDate, endDate] = event.map((element: Element) => Date.parse(element.attributes['day'].value))

        //if a user chooses first day bigger than end day need to swap these two days
        if (startDate > endDate) {
          event = [event[1], event[0]]
        }

        let [index_of_the_first_day, index_of_the_last_day] = event.map((searchItem) => {
          let index = this.days_of_the_month.toArray().findIndex(item => item.nativeElement === searchItem);
          return index
        })

        if (endDate) {
          //adding a class to the range of selected days
          this.days_of_the_month.toArray().slice(index_of_the_first_day, index_of_the_last_day + 1).forEach(item => {
            this.renderer.addClass(item.nativeElement, 'selected')
          });
        } else {
          //If the range of days has already been selected, you must remove the "selected" class
          this.days_of_the_month.toArray().forEach((item) => {
            if (/selected/.test(item.nativeElement.classList.value)) {
              this.renderer.removeClass(item.nativeElement, 'selected')
            }
          })
          this.renderer.addClass(event[0], 'selected');
        }
      },
    )
  }

  ngOnInit() {
    this.createDatePicker()
  }

  ngAfterViewInit(): void {
    this.viewChangesSubscription = this.days_of_the_month.changes.subscribe(() => {
      this.onSelectedDate();
    })
    this.onSelectedDate()
  }

  ngOnDestroy(): void {
    this.dayClickSubscription.unsubscribe();
    this.viewChangesSubscription.unsubscribe();
  }

}
