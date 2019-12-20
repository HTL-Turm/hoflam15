export interface ICommandRequest {
    command: string;
}

export interface ICommandResponse {
    status: 'OK' | 'FAILED';
}
