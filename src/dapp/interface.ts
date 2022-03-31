export interface IDappMessageEvent extends MessageEvent {
    data: {
        type: string;
        data: any;
        error: string;
    };
}
