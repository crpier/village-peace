/* eslint-disable */
import type { NextPage } from "next";
import Head from "next/head";
import { Component, useState } from "react";
import { env } from "../env/client.mjs";
import { typeToProps } from "../types/domain";

enum ClientEventType {
  Connect = "Connect",
  Create = "Create",
  Delete = "Delete",
  Request = "Request",
}

enum ServerEventType {
  Update = "Update",
}

class WSClient {
  private ws: WebSocket | undefined;

  constructor() {
    this.ws = undefined;
  }

  initialize(host: string) {
    this.ws = new WebSocket(host);
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
          meta: {
            top_left: { row: 0, col: 0 },
            bottom_right: { row: 6, col: 8 },
          },
        })
      );
    } else {
      console.log("Tried to use unitialized WebSocket!");
    }
  }

  send_creation_event(target: { type: string; top: number; left: number }) {
    if (this.ws) {
      const notification = JSON.stringify({
        event_type: "Create",
        meta: {
          top_left: { row: 0, col: 0 },
          bottom_right: { row: 6, col: 8 },
        },
        data: {
          type: target.type,
          loc: { col: target.left, row: target.top },
        },
      });
      this.ws.send(notification);
    }
  }

  send_deletion_event(target: { type: string; top: number; left: number }) {
    if (this.ws) {
      const notification = JSON.stringify({
        event_type: "Delete",
        meta: {
          top_left: { row: 0, col: 0 },
          bottom_right: { row: 6, col: 8 },
        },
        data: {
          type: target.type,
          loc: { col: target.left, row: target.top },
        },
      });
      this.ws.send(notification);
    }
  }
  registerCallback(
    serverEventType: ServerEventType,
    callback: (message: MessageEvent<any>) => void
  ) {
    if (this.ws) {
      // TODO: rather than use `addEventListener`, we should assign `.onmessage` and keep an internal list of callbacks
      // this way, we avoid duplicates
      this.ws.addEventListener("message", (message: MessageEvent<any>) => {
        let messageObj = JSON.parse(message.data);
        console.log(serverEventType);
        console.log(message);
        if (messageObj.event_type == serverEventType) {
          callback(messageObj.data);
        }
      });
    }
  }
}

// -----Components-----
interface WorldProps { }

interface WorldState {
  items: Array<any>;
  popup: {
    open: boolean;
    target: {
      type: string;
      top: number;
      left: number;
    };
    popup: {
      top: number;
      left: number;
    };
  };
}

const wsClient = new WSClient();
class World extends Component<WorldProps, WorldState> {
  constructor(props: any) {
    super(props);
    this.state = {
      items: [],
      popup: {
        open: false,
        target: { type: "", top: 0, left: 0 },
        popup: { left: 0, top: 0 },
      },
    };
  }

  componentDidMount() {
    wsClient.initialize(`${env.NEXT_PUBLIC_WS_HOST}`);

    wsClient.registerCallback(ServerEventType.Update, (data: any) => {
      // TODO: use types
      this.setState({ items: data });
    });
  }

  componentWillUnmount(): void {
    wsClient.closeConnection();
  }

  render() {
    return (
      <main className="container mx-auto flex flex-col items-center justify-center min-h-screen p-4">
        {this.state.items?.map((item: any) => (
          <Thing
            thingType={item.type}
            left={item.loc.col}
            top={item.loc.row}
            key={`${item.type}:${item.loc.row}-${item.loc.col}`}
          />
        ))}
      </main>
    );
  }
}

interface PopupState { }
interface PopupProps {
  target: {
    top: number;
    left: number;
    type: string;
  };
  popup: { left: number; top: number };
  closeHandler: () => void;
}

class EditPopup extends Component<PopupProps, PopupState> {
  constructor(props: PopupProps) {
    super(props);
    this.state = {};
  }

  deleteThing = (e: any) => {
    wsClient.send_deletion_event({ ...this.props.target });
    this.props.closeHandler();
  };

  render() {
    return (
      <div
        style={{ position: "absolute", top: 96, left: 96, zIndex: 100 }}
        className="p-2 bg-yellow-500 w-40"
      >
        <p>{this.props.target.type}</p>
        <div className="h-1 bg-orange-800"></div>
        <ul>
          <li
            onClick={this.deleteThing}
            className="flex p-1 my-4 hover:bg-yellow-300"
          >
            <p className="flex-grow">Sell</p>
            138 <img src="eddie.png" className="h-5 mt-1"></img>
          </li>
        </ul>
      </div>
    );
  }
}
class CreatePopup extends Component<PopupProps, PopupState> {
  constructor(props: PopupProps) {
    super(props);
    this.state = {};
  }

  createThing = (e: any) => {
    wsClient.send_creation_event({
      type: e.target.id,
      top: this.props.target.top,
      left: this.props.target.left,
    });
    this.props.closeHandler();
  };

  render() {
    return (
      <div
        style={{ position: "absolute", top: 96, left: 96, zIndex: 100 }}
        className="p-2 bg-yellow-500 w-60"
      >
        <p>Create Thing</p>
        <div className="h-1 bg-orange-800"></div>
        <ul>
          <li
            onClick={this.createThing}
            className="flex p-1 my-4 hover:bg-yellow-300"
          >
            <p id="House" className="flex-grow flex">
              House <img className="mx-4 h-6" src="house.png"></img>
            </p>
            138 <img src="eddie.png" className="h-5 mt-1"></img>
          </li>
          <li
            onClick={this.createThing}
            className="flex p-1 my-4 hover:bg-yellow-300"
          >
            <p id="Barrack" className="flex-grow flex">
              Barrack - <img className="mx-4 h-6" src="barrack.png"></img>
            </p>
            489 <img src="eddie.png" className="h-5 mt-1"></img>
          </li>
          <li
            onClick={this.createThing}
            className="flex p-1 my-4 hover:bg-yellow-300"
          >
            <p id="Tower" className="flex-grow flex">
              Tower - <img className="mx-4 h-6" src="tower.png"></img>
            </p>
            321 <img src="eddie.png" className="h-5 mt-1"></img>
          </li>
          <li
            onClick={this.createThing}
            className="flex p-1 my-4 hover:bg-yellow-300"
          >
            <p id="Soldier" className="flex-grow flex">
              Soldier - <img className="mx-4 h-6" src="soldier.png"></img>
            </p>
            20 <img src="eddie.png" className="h-5 mt-1"></img>
          </li>
          <li
            onClick={this.createThing}
            className="flex p-1 my-4 hover:bg-yellow-300"
          >
            <p id="Champion" className="flex-grow flex">
              Champion - <img className="mx-4 h-6" src="champion.png"></img>
            </p>
            814 <img src="eddie.png" className="h-5 mt-1"></img>
          </li>
        </ul>
      </div>
    );
  }
}

function Thing(props: { left: number; top: number; thingType: string }) {
  let [showPopup, setShowPopup] = useState(false);
  function openPopup() {
    setShowPopup(true);
  }

  function closePopup() {
    setShowPopup(false);
  }

  let thingData = typeToProps.get(props.thingType);
  if (thingData) {
    let style = {
      ...thingData.style,
      left: 48 + props.left * 96,
      top: 48 + props.top * 96,
    };
    let popup =
      props.thingType == "Grass" ? (
        <CreatePopup
          target={{
            left: props.left,
            top: props.top,
            type: props.thingType,
          }}
          popup={{ left: props.left, top: props.top }}
          closeHandler={closePopup}
        ></CreatePopup>
      ) : (
        <EditPopup
          target={{
            left: props.left,
            top: props.top,
            type: props.thingType,
          }}
          popup={{ left: props.left, top: props.top }}
          closeHandler={closePopup}
        ></EditPopup>
      );
    return (
      <div>
        <img src={thingData.sprite} style={style} onClick={openPopup} />

        {showPopup && popup}
      </div>
    );
  } else {
    return <div></div>;
  }
}

const Home: NextPage = (_) => {
  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="bg-black">
        <World />
      </div>
    </>
  );
};

export default Home;
/* eslint-disable */
