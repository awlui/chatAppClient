import { iOptions, iCollectionItem, IDictionary } from './interfaces';
// import { Observable } from 'rxjs/Rx';
import * as io from 'socket.io-client';
export class DataManager {
    private connection: string;
    private authorized: boolean;
    private collections: Array<Object>;
    private isConnectionAlive: boolean;
    private connectCB?: Function;
    private Socket: SocketIOClient.Socket;
    public  defaultSocket: SocketIOClient.Socket;
    // private Socket: WebSocket;
    private authToken: string;
    private collSockets: IDictionary<SocketIOClient.Socket> = {};
    constructor(private options: iOptions) {
        this.collections = options.collections || [];
        this.connection = options.connection;
        this.connectCB = options.connectCB || (() => {});
        this.isConnectionAlive = false;
        this.init();
    }
    public logout = () => {
      this.authToken = null;
    }
    public login = (username: string, password: string) => {
      this.collSockets['auth'].emit('authentication', {username, password});
    }
    private auth = () => {
      const cs = this.collSockets;
      let _s = io(`${this.connection}/auth`);
      cs['auth'] = _s;

      _s.on('authenticated', (e: any) => {
      if (e) {
        this.authToken = e.token;
      }
      this.authorized = true;
      let c = this.collections;
      c.forEach((coll: iCollectionItem) => {
          let name = coll.name;
          let _s = io(`${this.connection}/${name}`);
          Object.keys(coll.subscribers).forEach((mthd: any) => {
              _s.on(mthd, coll.subscribers[mthd]);
          });

          cs[name] = _s;
      });
      this.collSockets['chatrooms'].emit('joinRooms', { token: this.authToken });
      });
      _s.on('unauthorized', () => {
        this.authorized = false;
        console.log('not authed');
      });
      // cs['auth'].emit('authentication', {username: 'John', password: 'secret'});
    }
    private roomInit = () => {
      this.collSockets['chatrooms'] = io(`${this.connection}/chatrooms`);
      this.collSockets['chatrooms'].on('message', (m: any) => console.log(m, 'a'));

    }
    private init = () => {
      this.roomInit();
      this.defaultSocket = io(`${this.connection}/`);
      this.defaultSocket.on('message', (m: any) => console.log(m, 'default socket message'))
        const cs = this.collSockets;
        let s = io(this.connection);
        this.Socket = s;
        this.auth();

        s.on('connect', this._connect);
        s.on('disconnect', this._disconnect);
        s.on('reconnect_attempt', this._reconnectAttempt);
        s.on('reconnect', this._reconnect);
        s.on('reconnect_error', this._reconnectError);
        s.on('reconnect_failed', this._reconnectFailed);

          return this;

    }
    pubData = (collection: string, endpoint: string, data:any, callback: Function) => {
      let payload = {
        data, token: this.authToken
      }
        if (this.isConnectionAlive && this.authorized) {
            this.collSockets[collection].emit(endpoint, payload);
        } else {
            saveToLocalStorage(collection, {endpoint, payload})
        }
        callback(this.isConnectionAlive);
    }
    _connect = () => {

        this.isConnectionAlive = true;
        this.connectCB();
    }
    _disconnect = () => {
        console.log('Disconnected')
    }
    _reconnectAttempt = () => {

    }
    _reconnect = () => {
      this.collSockets['auth'].emit('authentication', { token: this.authToken });
      console.log('reconnected')

    }
    _reconnectError = () => {

    }
    _reconnectFailed = () => {

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
