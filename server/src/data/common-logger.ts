import Debug from "debug";
const debug: Debug.SimpleLogger = debug.createSimpleLogger('common-class');
// import * as debug from 'typescript'
// const debug: debug.ISimpleLogger = debug.createSimpleLogger('common-class');


export class CommonLogger {

    public static info (format: string, ...param: any) {
        Debug.info(format, ...param);
    }

    public static warn (format: string, ...param: any) {
        Debug.warn(format, ...param);
    }

}
