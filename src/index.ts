import { iOptions, iCollectionItem, IDictionary } from './interfaces';
// import { Observable } from 'rxjs/Rx';
import * as io from 'socket.io-client';
export class DataManager {
    private connection: string;
    private collections: Array<Object>;
    private isConnectionAlive: boolean;
    private connectCB?: Function;
    private _a: SocketIOClient.Socket;
    private Socket: WebSocket;
    private collSockets: IDictionary<SocketIOClient.Socket> = {};
    constructor(private options: iOptions) {
        this.collections = options.collections || [];
        this.connection = options.connection;
        this.connectCB = options.connectCB || (() => {});
        this.isConnectionAlive = false;
        this.init();
    }
    init = () => {
        const cs = this.collSockets;
        let s = io(this.connection);
        this._a = s;
        console.log(s);
        s.on('connect', this._connect);
        s.on('disconnect', this._disconnect);
        s.on('reconnect_attempt', this._reconnectAttempt);
        s.on('reconnect', this._reconnect);
        s.on('reconnect_error', this._reconnectError);
        s.on('reconnect_failed', this._reconnectFailed);

        let c = this.collections;
        c.forEach((coll: iCollectionItem) => {
            let name = coll.name;
            let _s = io(`${this.connection}/${name}`);

            Object.keys(coll.subscribers).forEach((mthd: any) => {
                _s.on(mthd, coll.subscribers[mthd]);
            });
            
            cs[name] = _s;
        });
        return this;
    }
    pubData = (collection: string, endpoint: string, data:any, callback: Function) => {
        if (this.isConnectionAlive) {
            this.collSockets[collection].emit(endpoint, data);
            console.log(data, 'data');
        } else {
            saveToLocalStorage(collection, {endpoint, data})
        }
        callback(this.isConnectionAlive);
    }
    _connect = () => {
        this.isConnectionAlive = true;
        console.log(this._a);
        this.connectCB();
    }
    _disconnect(){
        console.log('Disconnected')
    }
    _reconnectAttempt() {

    }
    _reconnect() {

    }
    _reconnectError() {

    }
    _reconnectFailed() {

    }
}

function saveToLocalStorage(collection: string, data: any) {
    let savedData = getFromLocalStorage(collection);
    let ls = savedData || [];
    ls.push(data);
    localStorage.setItem(collection, JSON.stringify(ls));
}

function clearCollection(collection: string) {
    localStorage.setItem(collection, null);
}

function getFromLocalStorage(collection: string) {
    return JSON.parse(localStorage.getItem(collection));
}

