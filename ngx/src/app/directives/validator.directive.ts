import { Directive, Input, HostListener, ViewChild, ElementRef } from '@angular/core';
import { NG_VALIDATORS, Validator, FormControl } from '@angular/forms';


@Directive({
    selector: '[app-validator][ngModel]',
    providers: [
        { provide: NG_VALIDATORS, useExisting: ValidatorDirective, multi: true }
    ]
})
export class ValidatorDirective implements Validator {
    @Input() element: ValidatorElement<any>;
    @Input() name: string;

    constructor () { }

    validate (c: FormControl) {
        this.element.onChange(this.name);
        if (this.element.isValid(this.name)) {
        return null;
        } else {
        return { name: { valid: false } };
        }
    }

    @HostListener ('keypress', ['$event']) keypress = (event) => {
        this.element.onEvent('keypress', event, this.name);
    }

    @HostListener ('paste', ['$event']) paste = (event) => {
        this.element.onEvent('paste', event, this.name);
    }

    @HostListener ('blur', ['$event']) blur = (event) => {
        this.element.onEvent('blur', event, this.name);
    }

    // @HostListener ('focusout', ['$event']) focusout = (event) => {
    //     this.element.onEvent('focusout', event, this.name);
    // }
}

export interface IValidatorElementOptions{
    onChange?: ((e: ValidatorElement<any>, name: string) => void);
    onEvent?: ((e: ValidatorElement<any>, name: string, typ: string, event: any) => void);
    isValid?: ((e: ValidatorElement<any>, name: string) => boolean);
}


export class ValidatorElement<T> {
    public value: T;
    public options?: IValidatorElementOptions;

    constructor (value: T, options?: IValidatorElementOptions) {
        this.value = value;
        this.options = options || {};
    }

    isValid (name?: string): boolean {
        if (typeof this.options.isValid === 'function') {
            return this.options.isValid(this, name);
        } else {
            return true;
        }
    }

    onChange (name?: string): void {
        if (typeof this.options.onChange === 'function') {
            setTimeout( () => this.options.onChange(this, name), 0);
        }
    }

    onEvent (eventTyp: string, event: any, name?: string): void {
        // console.log('Event ' + eventTyp);
        // console.log(event);
        if (typeof this.options.onEvent === 'function') {
            this.options.onEvent(this, name, eventTyp, event);
            // use event.preventDefault() to suppress event
        }
    }

}
