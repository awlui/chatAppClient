export interface iOptions {
    connection: string,
    connectCB?: Function,
    collections: Array<SocketIOClient.Socket>
    socketObsFactoryMap: isocketObsFactoryMap
}

export interface iCollectionItem {
    name: string,
    subscribers: Array<Function>
}
export interface IDictionary<T> {
    [key: string]: T;
};

export interface wsEvent {
  name: string,
  wsmessage?: any
}

export interface appEvent {
  name: string,
  wsmessage?: any
}

export interface Observer<T> {
  closed?: boolean;
  next: (value: T) => void;
  error: (err: any) => void;
  complete: () => void;
}

export interface isocketObsFactoryMap {
  [key: string]: Function;
}