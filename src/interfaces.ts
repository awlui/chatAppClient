export interface iOptions {
    connection: string,
    connectCB?: Function,
    collections: Array<SocketIOClient.Socket>
}

export interface iCollectionItem {
    name: string,
    subscribers: Array<Function>
}
export interface IDictionary<T> {
    [key: string]: T;
};