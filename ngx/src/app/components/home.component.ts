
import { Component } from '@angular/core';
import { UserService } from '../services/user.service';
import { ISyncButtonConfig } from './sync-button.component';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html'
})
export class HomeComponent {

    public userName: string;
    public text: string;
    public button1Config: ISyncButtonConfig;
    private userService: UserService;


    constructor(userService: UserService) {
        this.userService = userService;
        this.userName = userService.getUserName();

        this.button1Config = {
            text: 'Click me',
            disabled: false,
            minWidth: '10em',
            classes: { default: 'btn btn-primary', onSuccess: 'btn btn-success', onBusy: null, onError: null },
            hideSyncIcon: true,
            handler: {
                onClick: (cfg) => this.handleButton(cfg)
            }
        };

    }


    public changeColor() {
        document.getElementById('input').style.backgroundColor = '#000000';
    }

    private async handleButton(cfg: ISyncButtonConfig) {
        console.log('handleButton ', cfg);
        cfg.hideSyncIcon = false;
        cfg.disabled = true;
        await this.delay(2000);
        cfg.hideSyncIcon = true;
        cfg.disabled = false;
    }

    private async delay(ms: number) {
        return new Promise<void>( (res) => {
            setTimeout( () => { res (); }, ms);
        });
    }


}
