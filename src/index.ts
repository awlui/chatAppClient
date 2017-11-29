import { iOptions, iCollectionItem, IDictionary, wsEvent, Observer, appEvent } from './interfaces';
import { Observable, Subject } from 'rxjs/Rx';
import * as io from 'socket.io-client';


export class DataManager {
    private connection: string;
    private authorized: boolean = false;
    private isConnectionAlive: boolean;
    private Socket: SocketIOClient.Socket;
    public  defaultSocket: SocketIOClient.Socket;
    private authToken: string;
    private collSockets: IDictionary<SocketIOClient.Socket> = {};



    private authObservable: Observable<wsEvent> = Observable.create(() => {});
    private hydrateChatUnsub: Function;


    private _masterHotObservable: Subject<wsEvent> = new Subject<wsEvent>();
    private _masterColdObservable: Observable<wsEvent> = Observable.create(() => {});

    public get masterObservable() {
      return this._masterHotObservable;
    }

    constructor(private options: iOptions) {
        this.connection = options.connection;
        this.isConnectionAlive = false;
        this.init();
    }

    private auth = () => {
      function _authenticated(this: any, observer: Observer<wsEvent>, e: any) {
        // if (e) {
        //   this.authToken = e.token;
        // }
        // this.authorized = true;
        const token = e.token;
        this.collSockets['chatrooms'].emit('joinRooms', { token });
        observer.next({
          name: 'authenticated',
          wsmessage: {
            token
          }
        });
        this._hydrateChatrooms();

      }

      function _unauthorized(this: any,observer: Observer<wsEvent>, e: Event) {
        observer.next({
          name: 'unauthorized'
        })
      }

      function _handleSignUp(observer: Observer<wsEvent>, data: any) {
        console.log(data, 'data');
      }

      const cs = this.collSockets;
      const authSocket = io(`${this.connection}/auth`);
      cs['auth'] = authSocket;
      let observable = Observable.create((observer: Observer<wsEvent>) => {
        authSocket.on('authenticated', _authenticated.bind(this, observer));
        authSocket.on('unauthorized', _unauthorized.bind(this, observer));
        authSocket.on('signup-response', _handleSignUp.bind(this, observer));
      });

      return observable;
    }
    private roomInit = () => {
      this.collSockets['chatrooms'] = io(`${this.connection}/chatrooms`);
      let observable = Observable.create((observer: Observer<wsEvent>) => {
        this.collSockets['chatrooms'].on('message', this._message.bind(this, observer));
      });
      return observable;

    }
    private init = (): void => {
      this.Socket = io(`${this.connection}/`);
      let observable = Observable.create((observer: Observer<wsEvent>) => {
        this.Socket.on('message', this._message.bind(this, observer));
        this.Socket.on('connect', this._connect.bind(this, observer));
        this.Socket.on('disconnect', this._disconnect.bind(this, observer));
        this.Socket.on('reconnect_attempt', this._reconnectAttempt.bind(this, observer));
        this.Socket.on('reconnect', this._reconnect.bind(this, observer));
        this.Socket.on('reconnect_error', this._reconnectError.bind(this, observer));
        this.Socket.on('reconnect_failed', this._reconnectFailed.bind(this, observer));
      });
      this._masterColdObservable = observable;

      observable.subscribe(this._masterHotObservable);
      this.roomInit().subscribe(this._masterHotObservable);
      this.auth().subscribe(this._masterHotObservable);
      // this.hydrateChatroomObservable.subscribe(this._masterHotObservable);
      // this.collSockets['auth'].emit('authentication', {username: 'mpan', password: 'password3'});

    }
    _message = (observer: Observer<wsEvent>, data: any) => {
      observer.next({
        name: 'message',
        wsmessage: data
      });
    }
    _connect = (observer: Observer<wsEvent>) => {
        this.isConnectionAlive = true;
        observer.next({
          name: 'connect'
        })
    }

    _disconnect = (observer: Observer<wsEvent>) => {
        observer.next({
          name: 'disconnect'
        })
    }

    _reconnectAttempt = (observer: Observer<wsEvent>) => {
      observer.next({
        name: 'reconnect attempt'
      })

    }

    _reconnect = (observer: Observer<wsEvent>) => {
      // this.collSockets['auth'].emit('authentication', { token: this.authToken });
      observer.next({
        name: 'reconnected'
      })
    }

    _reconnectError = (observer: Observer<wsEvent>) => {
      observer.next({
        name: 'reconnect error'
      })
    }

    _reconnectFailed = (observer: Observer<wsEvent>) => {
      observer.next({
        name: 'reconnect failed'
      })
    }


    private _hydrateChatrooms = () => {
      this.publish('chatrooms', 'hydrateChatrooms');
      let observable = Observable.create((observer: Observer<wsEvent>) => {
        this.collSockets['chatrooms'].once('hydrateChatrooms', (payload: any) => {
          observer.next({
            name: 'chatroom-hydration',
            wsmessage: payload
          });
        })
      });
      observable.subscribe(this._masterHotObservable);
    }
    public login = (username: string, password: string) => {
      this.collSockets['auth'].emit('authentication', {username, password});
    }
    public relogin = (token: string) => {
      this.collSockets['auth'].emit('authentication', {token})
    }
    public logout = () => {
      // this.authToken = null;
      // this.authorized = false;
      let observable = Observable.create((observer: Observer<appEvent>) => {
        observer.next({
          name: 'logout'
        })
      });
      observable.subscribe(this._masterHotObservable);
    }
    public publish = (socket: string, endpoint: string, data?:any, isPublic?: boolean): void => {
      // let payload = {
      //   ...data, token: this.authToken
      // }
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
