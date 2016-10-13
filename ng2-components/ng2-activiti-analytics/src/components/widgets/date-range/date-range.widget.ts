/*!
 * @license
 * Copyright 2016 Alfresco Software, Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { AbstractControl, FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { WidgetComponent } from './../widget.component';
import * as moment from 'moment';

declare let mdDateTimePicker: any;

function dateCheck(c: AbstractControl) {
    let startDate = moment(c.get('startDate').value);
    let endDate = moment(c.get('endDate').value);
    let result = startDate.isAfter(endDate);
    return result ? {'greaterThan': true} : null;
}

@Component({
    moduleId: module.id,
    selector: 'date-range-widget',
    templateUrl: './date-range.widget.html',
    styleUrls: ['./date-range.widget.css']
})
export class DateRangeWidget extends WidgetComponent {

    public static FORMAT_DATE_ACTIVITI: string =  'YYYY-MM-DD';

    @ViewChild('startElement')
    startElement: any;

    @ViewChild('endElement')
    endElement: any;

    @Input('group')
    public dateRange: FormGroup;

    @Input()
    field: any;

    @Output()
    dateRangeChanged: EventEmitter<any> = new EventEmitter<any>();

    debug: boolean = false;

    dialogStart: any = new mdDateTimePicker.default({
        type: 'date',
        future: moment().add(21, 'years')
    });

    dialogEnd: any = new mdDateTimePicker.default({
        type: 'date',
        future: moment().add(21, 'years')
    });

    constructor(public elementRef: ElementRef,
                private formBuilder: FormBuilder) {
        super();
    }

    ngOnInit() {
        this.initForm();
        this.initSartDateDialog();
        this.initEndDateDialog();
    }

    initForm() {
        let today = moment().format('YYYY-MM-DD');

        let startDateControl = new FormControl(today);
        startDateControl.setValidators(Validators.required);
        this.dateRange.addControl('startDate', startDateControl);

        let endDateControl = new FormControl(today);
        endDateControl.setValidators(Validators.required);
        this.dateRange.addControl('endDate', endDateControl);

        this.dateRange.setValidators(dateCheck);
        this.dateRange.valueChanges.subscribe(data => this.onGroupValueChanged(data));
    }

    initSartDateDialog() {
        this.dialogStart.trigger = this.startElement.nativeElement;

        let startDateButton = document.getElementById('startDateButton');
        startDateButton.addEventListener('click', () => {
            this.dialogStart.toggle();
        });
    }

    initEndDateDialog() {
        this.dialogEnd.trigger = this.endElement.nativeElement;

        let endDateButton = document.getElementById('endDateButton');
        endDateButton.addEventListener('click', () => {
            this.dialogEnd.toggle();
        });
    }

    onOkStart(inputEl: HTMLInputElement) {
        let date = this.dialogStart.time.format(DateRangeWidget.FORMAT_DATE_ACTIVITI);
        this.dateRange.patchValue({
            startDate: date
        });
        let materialElemen: any = inputEl.parentElement;
        if (materialElemen) {
            materialElemen.MaterialTextfield.change(date);
        }
    }

    onOkEnd(inputEl: HTMLInputElement) {
        let date = this.dialogEnd.time.format(DateRangeWidget.FORMAT_DATE_ACTIVITI);
        this.dateRange.patchValue({
            endDate: date
        });

        let materialElemen: any = inputEl.parentElement;
        if (materialElemen) {
            materialElemen.MaterialTextfield.change(date);
        }
    }

    onGroupValueChanged(data: any) {
        if (this.dateRange.valid) {
            let dateStart = this.convertMomentDate(this.dateRange.controls['startDate'].value);
            let endStart = this.convertMomentDate(this.dateRange.controls['endDate'].value);
            this.dateRangeChanged.emit({startDate: dateStart, endDate: endStart});
        }
    }

    public convertMomentDate(date: string) {
        return moment(date, DateRangeWidget.FORMAT_DATE_ACTIVITI, true).format(DateRangeWidget.FORMAT_DATE_ACTIVITI) + 'T00:00:00.000Z';
    }
}