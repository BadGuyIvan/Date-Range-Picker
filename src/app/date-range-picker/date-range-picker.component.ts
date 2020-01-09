import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChildren,
  QueryList,
  ElementRef,
  Renderer2,
  OnDestroy,
  Output,
  EventEmitter
} from "@angular/core";
import * as moment from "moment";
import { chunk } from "../shared/chunk";
import {
  take,
  scan,
  repeat,
  switchMap,
  startWith,
  takeWhile,
  retry,
} from "rxjs/operators";
import { fromEvent, merge, Subscription, throwError, Observable } from "rxjs";

@Component({
  selector: "app-date-range-picker",
  templateUrl: "./date-range-picker.component.html",
  styleUrls: ["./date-range-picker.component.scss"],
})
export class DateRangePickerComponent
  implements OnInit, AfterViewInit, OnDestroy {
  constructor(private element: ElementRef, private renderer: Renderer2) { }

  @ViewChildren("weekday") days_of_the_month: QueryList<ElementRef>;

  @Output()
  selectedDays = new EventEmitter()

  dayClickSubscription: Subscription;
  viewChangesSubscription: Subscription;

  date = moment();
  currentMonthDates: any[];
  weekDays = moment.weekdays();

  previousMonth() {
    this.date = moment(this.date.subtract(1, "months"));
    this.createDatePicker();
  }
  nextMonth() {
    this.date = moment(this.date.add(1, "months"));
    this.createDatePicker();
  }

  createDatePicker() {
    this.currentMonthDates = new Array(moment(this.date).daysInMonth())
      .fill(null)
      .map((x, i) =>
        moment(this.date)
          .startOf("month")
          .add(i, "days")
          .toDate()
      );

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

    if (
      this.currentMonthDates[this.currentMonthDates.length - 1].getDay() < 6
    ) {
      //calculate days after the last day in the month.
      let days = new Array(
        6 -
        moment(this.date)
          .endOf("month")
          .weekday()
      ).fill(null);

      this.currentMonthDates.push(...days);
    }

    // this.currentMonthDates = chunck(range_42, 7);

    // this.currentMonthDates = chunck(this.currentMonthDates, 7)
  }

  onSelectedDate() {
    let clickEvent = this.days_of_the_month
      .filter((item: ElementRef) => {
        return item.nativeElement.className !== "offset";
      })
      .map(t => fromEvent(t.nativeElement, "click"));

    let mouseEnter = this.days_of_the_month
      .filter((item: ElementRef) => {
        return item.nativeElement.className !== "offset";
      })
      .map(t => fromEvent(t.nativeElement, "mouseenter"));

    this.dayClickSubscription = merge(...clickEvent)
      .pipe(
        take(2),
        scan(
          (item, val) => ({
            count: item.count + 1,
            element: val
          }),
          {
            count: 0,
            element: null
          }
        ),
        switchMap(event =>
          merge(...mouseEnter).pipe(
            //after the first click, we have to start from this "event", that's why we need to use 'startWith'
            startWith({
              element: [event.element.target], count: event.count
            }),
            takeWhile(() => event.count !== 2, true)
          ),
        ),
        scan((outerValue: { element: Array<Element>, count: number }, innerValue: any) => {
          if (outerValue.element.length === 0) {
            outerValue = innerValue
            outerValue.element.push(outerValue.element[0])
          } else {
            outerValue.element[1] = innerValue instanceof MouseEvent ? innerValue.target : innerValue.element[0];
            if (innerValue.count) {
              outerValue.count = innerValue.count
            }
          }
          if (new Date(outerValue.element[0].attributes["day"].value).getTime() > new Date(outerValue.element[1].attributes["day"].value).getTime()) {
            return throwError(Error)
          }
          return outerValue
        }, {
          element: [],
          count: 0
        }),
        retry(),
        repeat()
      )
      .subscribe(
        event => {
          //if an event is not undefined
          if (event) {
            //if an event is not an instance of the Observable
            if (!(event instanceof Observable)) {
              let [index_of_the_first_day, index_of_the_last_day] = event.element.map(
                searchItem => {
                  let index = this.days_of_the_month
                    .toArray()
                    .findIndex(item => item.nativeElement === searchItem);
                  return index;
                }
              );

              if (event.count !== 2)
                this.days_of_the_month.toArray().forEach((item) => {
                  this.renderer.removeClass(item.nativeElement, "selected");
                  this.renderer.removeClass(item.nativeElement, "start");
                  this.renderer.removeClass(item.nativeElement, "end");
                });

              if (event.count == 2) {
                this.selectedDays.emit([new Date(event.element[0].attributes["day"].value).getTime(), new Date(event.element[1].attributes["day"].value).getTime()])
              }

              //adding a class to the range of selected days
              this.days_of_the_month
                .toArray()
                .slice(index_of_the_first_day, index_of_the_last_day + 1)
                .forEach((item, index, array) => {
                  if (index === array.length - 1 && event.count == 2) {
                    this.renderer.removeClass(item.nativeElement, 'selected');
                  }
                  this.renderer.addClass(item.nativeElement, index == 0 ? 'start' : index === array.length - 1 && event.count == 2 ? 'end' : "selected");
                });
            } else {
              this.days_of_the_month.toArray().forEach(item => {
                this.renderer.removeClass(item.nativeElement, "selected");
                this.renderer.removeClass(item.nativeElement, "start");
                this.renderer.removeClass(item.nativeElement, "end");
              })
            }
          }
        },
        err => console.error(err)
      );
  }

  ngOnInit() {
    this.createDatePicker();
  }

  ngAfterViewInit(): void {
    this.viewChangesSubscription = this.days_of_the_month.changes.subscribe(
      () => {
        this.onSelectedDate();
      }
    );
    this.onSelectedDate();
  }

  ngOnDestroy(): void {
    this.dayClickSubscription.unsubscribe();
    this.viewChangesSubscription.unsubscribe();
  }
}
