import { Smth, SmthType } from "../types/domain";

export enum ClientEventType {
  Connect = "Connect",
  Create = "Create",
  Delete = "Delete",
  Request = "Request",
}

export enum ServerEventType {
  Update = "Update",
}

type EventMeta = {
  chunk: {
    top_left: {
      row: number;
      col: number;
    };
    bottom_right: {
      row: number;
      col: number;
    };
  };
  username: string;
};
class ClientEvent {
  event_type: ClientEventType;
  data: Smth;
  meta: EventMeta;
  constructor(eventType: ClientEventType, data: Smth, meta: EventMeta) {
    this.event_type = eventType;
    this.meta = meta;
    this.data = data;
  }
}

export class WSClient {
  private ws: WebSocket | undefined;
  private meta: EventMeta;

  constructor() {
    this.ws = undefined;
    this.meta = {
      chunk: {
        top_left: {
          row: 0,
          col: 0,
        },
        bottom_right: {
          row: 0,
          col: 0,
        },
      },
      username: "",
    };
  }

  initialize(
    host: string,
    worldMeta: { width: number; height: number; username: string }
  ) {
    this.ws = new WebSocket(host);
    this.meta = {
      chunk: {
        top_left: {
          row: 0,
          col: 0,
        },
        bottom_right: {
          row: worldMeta.height,
          col: worldMeta.width,
        },
      },
      username: worldMeta.username,
    };
    this.ws.onopen = (_) => {
      // is this a workaround or proper react etiquette?
      setTimeout(() => {
        this.send_connection_notification();
        // TODO: try smaller values here
      }, 100);
    };
  }

  closeConnection() {
    if (this.ws) {
      this.ws.close(1000);
    }
  }

  send_connection_notification() {
    if (this.ws) {
      this.ws.send(
        JSON.stringify({
          event_type: ClientEventType.Connect,
          meta: this.meta,
          data: {
            username: "sentry",
            password: "none",
          },
        })
      );
    } else {
      console.log("Tried to use unitialized WebSocket!");
    }
  }

  send_creation_event(target: { type: SmthType; top: number; left: number }) {
    if (this.ws) {
      let smth = {
        loc: { row: target.top, col: target.left },
        type: target.type,
        user: "sentry",
      };
      let ev = new ClientEvent(ClientEventType.Create, smth, this.meta);
      const notification = JSON.stringify(ev);
      this.ws.send(notification);
    }
  }

  send_deletion_event(target: { type: SmthType; top: number; left: number }) {
    if (this.ws) {
      let smth = {
        loc: { row: target.top, col: target.left },
        type: target.type,
        user: "sentry",
      };
      let ev = new ClientEvent(ClientEventType.Delete, smth, this.meta);
      const notification = JSON.stringify(ev);
      this.ws.send(notification);
    }
  }

  send_data_request_event(target: { type: Smth }) {}

  registerCallback(
    serverEventType: ServerEventType,
    callback: (message: MessageEvent<any>) => void
  ) {
    if (this.ws) {
      // TODO: rather than use `addEventListener`, we should assign `.onmessage` and keep an internal list of callbacks
      // this way, we avoid duplicates
      this.ws.addEventListener("message", (message: MessageEvent<any>) => {
        let messageObj = JSON.parse(message.data);
        if (messageObj.event_type == serverEventType) {
          callback(messageObj.data);
        }
      });
    }
  }
}
