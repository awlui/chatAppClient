import { iOptions, iCollectionItem, IDictionary, wsEvent, Observer, appEvent, isocketObsFactoryMap } from './interfaces';
import { Observable, Subject } from 'rxjs/Rx';
import * as io from 'socket.io-client';


export class DataManager {
    private connection: string;
    private isConnectionAlive: boolean;
    private Socket: SocketIOClient.Socket;
    private collSockets: IDictionary<SocketIOClient.Socket> = {};


    private _masterHotObservable: Subject<wsEvent> = new Subject<wsEvent>();

    public get masterObservable() {
      return this._masterHotObservable;
    }


    constructor({connection, socketObsFactoryMap}: iOptions) {
        this.connection = connection;
        this.isConnectionAlive = false;
        this.init(socketObsFactoryMap);
    }

    private init = (socketObsFactoryMap: isocketObsFactoryMap): void => {
    const _message = (observer: Observer<wsEvent>, data: any) => {
      observer.next({
        name: 'message',
        wsmessage: data
      });
    }
    const _connect = (observer: Observer<wsEvent>) => {
        this.isConnectionAlive = true;
        observer.next({
          name: 'connect'
        })
    }

   const _disconnect = (observer: Observer<wsEvent>) => {
        observer.next({
          name: 'disconnect'
        })
    }

   const  _reconnectAttempt = (observer: Observer<wsEvent>) => {
      observer.next({
        name: 'reconnect attempt'
      })

    }

    const _reconnect = (observer: Observer<wsEvent>) => {
      observer.next({
        name: 'reconnected'
      })
    }

   const  _reconnectError = (observer: Observer<wsEvent>) => {
      observer.next({
        name: 'reconnect error'
      })
    }

    const _reconnectFailed = (observer: Observer<wsEvent>) => {
      observer.next({
        name: 'reconnect failed'
      })
    }
      this.Socket = io(`${this.connection}/`);
      let observable = Observable.create((observer: Observer<wsEvent>) => {
        this.Socket.on('message', _message.bind(this, observer));
        this.Socket.on('connect', _connect.bind(this, observer));
        this.Socket.on('disconnect', _disconnect.bind(this, observer));
        this.Socket.on('reconnect_attempt', _reconnectAttempt.bind(this, observer));
        this.Socket.on('reconnect', _reconnect.bind(this, observer));
        this.Socket.on('reconnect_error', _reconnectError.bind(this, observer));
        this.Socket.on('reconnect_failed', _reconnectFailed.bind(this, observer));
      });

      observable.subscribe(this._masterHotObservable);

      this.socketToObservable(socketObsFactoryMap);
    }

 private socketToObservable = (socketObsFactoryMap: isocketObsFactoryMap) => {
      Object.keys(socketObsFactoryMap).forEach((obsFactory: string) => {
        if (!this.collSockets[obsFactory]) {
          this.collSockets[obsFactory] = io(`${this.connection}/${obsFactory}`);
        }
        console.log(this.collSockets, 'here are the sockets');
        socketObsFactoryMap[obsFactory](this.collSockets[obsFactory]).subscribe(this._masterHotObservable);
      });
    }

    public login = (username: string, password: string) => {
      this.collSockets['auth'].emit('authentication', {username, password});
    }
    public relogin = (token: string) => {
      this.collSockets['auth'].emit('authentication', {token})
    }
    public usernameExist = (username: string) => {
      this.collSockets['auth'].emit('usernameExist', {username});
    }
    public logout = () => {

      let observable = Observable.create((observer: Observer<appEvent>) => {
        observer.next({
          name: 'logout'
        })
      });
      observable.subscribe(this._masterHotObservable);
    }
    public publish = (socket: string, endpoint: string, data?:any, isPublic?: boolean): void => {

        if (this.isConnectionAlive && ((data && data.token) || !!isPublic)) {
            this.collSockets[socket].emit(endpoint, data);
        } else if (!this.isConnectionAlive && data.token) {
            saveToLocalStorage(socket, endpoint, data)
        }
    }
    public signUp = ({username, password, email, firstName, lastName}: any) => {
      this.publish('auth', 'signup', {
        username,
        password,
        email,
        firstName,
        lastName
      }, true);
    }
    public createRoom = (): void => {

    }
    public joinRoom = (): void => {

    }
}

function saveToLocalStorage(socket: string, endpoint: string, data: any) {
    let savedData = getFromLocalStorage(endpoint);
    let ls = savedData || [];
    ls.push(data);
    localStorage.setItem(endpoint, JSON.stringify(ls));
}

function clearCollection(collection: string) {
    localStorage.setItem(collection, null);
}

function getFromLocalStorage(collection: string) {
    return JSON.parse(localStorage.getItem(collection));
}
