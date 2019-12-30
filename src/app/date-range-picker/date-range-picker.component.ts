import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChildren,
  QueryList,
  ElementRef,
  Renderer2,
  OnDestroy
} from "@angular/core";
import * as moment from "moment";
import { chunk } from "../shared/chunk";
import {
  take,
  scan,
  repeat,
  switchMap,
  startWith,
  takeWhile
} from "rxjs/operators";
import { fromEvent, merge, Subscription } from "rxjs";

@Component({
  selector: "app-date-range-picker",
  templateUrl: "./date-range-picker.component.html",
  styleUrls: ["./date-range-picker.component.scss"]
})
export class DateRangePickerComponent
  implements OnInit, AfterViewInit, OnDestroy {
  constructor(private element: ElementRef, private renderer: Renderer2) {}

  @ViewChildren("weekday") days_of_the_month: QueryList<ElementRef>;

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
            targer: val
          }),
          {
            count: 0,
            targer: null
          }
        ),
        switchMap(event =>
          merge(...mouseEnter).pipe(
            //after the first click, we have to start from this event, that's why we need to use 'startWith'
            startWith(event.targer),
            takeWhile(() => event.count !== 2)
          )
        ),
        scan((arr: Array<EventTarget>, prev: MouseEvent) => {
          if (arr.length !== 2) {
            arr = arr.concat(prev.target);
          } else {
            arr[1] = prev.target;
          }
          return arr;
        }, []),
        repeat()
      )
      .subscribe(
        event => {
          let [startDate, endDate] = event.map(
            (element: Element) => new Date(element.attributes["day"].value)
          );

          //if a user chooses first day bigger than end day need to swap these two days
          if (startDate && endDate && startDate.getTime() > endDate.getTime()) {
            event = [event[1], event[0]];
          }

          let [index_of_the_first_day, index_of_the_last_day] = event.map(
            searchItem => {
              let index = this.days_of_the_month
                .toArray()
                .findIndex(item => item.nativeElement === searchItem);
              return index;
            }
          );

          this.days_of_the_month.toArray().forEach(item => {
            if (/selected/.test(item.nativeElement.classList.value)) {
              this.renderer.removeClass(item.nativeElement, "selected");
            }
          });
          //adding a class to the range of selected days
          this.days_of_the_month
            .toArray()
            .slice(index_of_the_first_day, index_of_the_last_day + 1)
            .forEach(item => {
              this.renderer.addClass(item.nativeElement, "selected");
            });
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
