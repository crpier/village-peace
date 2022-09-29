/* eslint-disable */
import type { NextPage } from "next";
import Head from "next/head";
import { Component, createRef, FormEvent, RefObject, useState } from "react";
import { env } from "../env/client.mjs";
import { typeToProps, SmthType } from "../types/domain";
import { WSClient, ServerEventType } from "../services/ws";

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
  worldMeta: {
    width: number;
    height: number;
  };
  username: string;
}

// TODO: move this data into a service maybe?
let loggedUser = "";

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
      worldMeta: {
        width: 0,
        height: 0,
      },
      username: "",
    };
  }

  componentDidMount() {
    this.setState({
      worldMeta: {
        width: Math.floor((window.innerWidth - 144) / 96),
        height: Math.floor((window.innerHeight - 144) / 96),
      },
    });
    setTimeout(() => {
      wsClient.initialize(`${env.NEXT_PUBLIC_WS_HOST}`, this.state.worldMeta);
      wsClient.registerCallback(ServerEventType.Update, (data: any) => {
        this.setState({ items: data });
      });
    });
  }

  componentWillUnmount(): void {
    wsClient.closeConnection();
  }

  authenticate = (username: string) => {
    this.setState({ username: username });
    wsClient.login(username);
    loggedUser = username;
  };

  render() {
    return (
      <main className="container mx-auto flex flex-col items-center justify-center min-h-screen p-4">
        {/* TODO: have a type in models for this, maybe a validator too? */}
        {this.state.items?.map((item: any) => (
          <Smth
            smthOwner={item.user}
            smthType={item.type}
            left={item.loc.col}
            top={item.loc.row}
            key={`${item.type}:${item.loc.row}-${item.loc.col}`}
          />
        ))}
        {this.state.username === "" && (
          <Login setUsername={this.authenticate}></Login>
        )}
      </main>
    );
  }
}

interface PopupState {
  items: Array<{ type: string; price: number }>;
}
interface PopupProps {
  target: {
    top: number;
    left: number;
    type: SmthType;
    owner: string;
  };
  popup: { left: number; top: number };
  closeHandler: () => void;
}

class EditPopup extends Component<PopupProps, PopupState> {
  constructor(props: PopupProps) {
    super(props);
    this.state = { items: [] };
  }

  deleteThing = (_: any) => {
    wsClient.send_deletion_event({ ...this.props.target });
    this.props.closeHandler();
  };

  render() {
    return (
      <div
        style={{ position: "absolute", top: 96, left: 96, zIndex: 100 }}
        className="p-2 bg-yellow-500 w-40"
      >
        <div className="flex mb-3">
          <div className="w-full"></div>
          <button className="w-max hover: bg-yellow-300 hover:bg-yellow-200 px-3 rounded-md" onClick={this.props.closeHandler}>X</button>
        </div>
        <p>
          {this.props.target.type} owned by {this.props.target.owner}
        </p>
        <div className="h-1 bg-orange-800"></div>
        <ul>
          {loggedUser == this.props.target.owner && (
            <li
              onClick={this.deleteThing}
              className="flex p-1 my-4 hover:bg-yellow-300"
            >
              <p className="flex-grow">Sell</p>
              138 <img src="eddie.png" className="h-5 mt-1"></img>
            </li>
          )}
        </ul>
      </div>
    );
  }
}
class CreatePopup extends Component<PopupProps, PopupState> {
  constructor(props: PopupProps) {
    super(props);
    this.state = { items: [] };
  }

  createSmth = (e: any) => {
    wsClient.send_creation_event({
      type: e.target.id,
      top: this.props.target.top,
      left: this.props.target.left,
    });
    this.props.closeHandler();
  };

  requestCreationData = () => {
    const requestId = wsClient.send_data_request_event({
      top: this.props.target.top,
      left: this.props.target.left,
    });
    wsClient.registerCallback(ServerEventType.Response, (message: any) => {
      if (message.request_id === requestId) {
        this.setState({ items: message.data });
      }
    });
  };

  componentDidMount() {
    this.requestCreationData();
  }

  render() {
    return (
      <div
        style={{ position: "absolute", top: 96, left: 96, zIndex: 100 }}
        className="p-2 bg-yellow-500 w-60"
      >
        <div className="flex mb-3">
          <div className="w-full"></div>
          <button className="w-max hover: bg-yellow-300 hover:bg-yellow-200 px-3 rounded-md" onClick={this.props.closeHandler}>X</button>
        </div>
        <p>Create Smth</p>
        <div className="h-1 bg-orange-800"></div>
        <ul>
          {this.state.items.map((item) => (
            <li
              onClick={this.createSmth}
              className="flex p-1 my-4 hover:bg-yellow-300"
              key={item.type}
            >
              <p id={item.type} className="flex-grow flex">
                {item.type}{" "}
                <img
                  className="mx-4 h-6"
                  src={item.type.toLowerCase() + ".png"}
                ></img>
              </p>
              {item.price} <img src="eddie.png" className="h-5 mt-1"></img>
            </li>
          ))}
        </ul>
      </div>
    );
  }
}

function Smth(props: {
  left: number;
  top: number;
  smthType: SmthType;
  smthOwner: string;
}) {
  let [showPopup, setShowPopup] = useState(false);
  function openPopup() {
    setShowPopup(true);
  }

  function closePopup() {
    setShowPopup(false);
  }

  let thingData = typeToProps.get(props.smthType);
  if (thingData) {
    let style = {
      ...thingData.style,
      left: 48 + props.left * 96,
      top: 48 + props.top * 96,
    };
    let popup =
      props.smthType == SmthType.Grass ? (
        <CreatePopup
          target={{
            left: props.left,
            top: props.top,
            type: props.smthType,
            owner: props.smthOwner,
          }}
          popup={{ left: props.left, top: props.top }}
          closeHandler={closePopup}
        ></CreatePopup>
      ) : (
        <EditPopup
          target={{
            left: props.left,
            top: props.top,
            type: props.smthType,
            owner: props.smthOwner,
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

function Login(props: { setUsername: (username: string) => void }) {
  let input: RefObject<HTMLInputElement> = createRef();
  function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    props.setUsername(input.current?.value || "");
  }
  return (
    <div className="absolute bg-yellow-600 z-10 w-3/12 text-center">
      <form
        className="flex flex-col m-4 bg-yellow-500 items-center"
        onSubmit={handleSubmit}
      >
        <label className="m-5 font-bold">
          Username
          <input
            className="mx-4 bg-yellow-300"
            name="username"
            ref={input}
          ></input>
        </label>
        <button
          type="submit"
          className="font-bold my-5 px-10 py-2 bg-yellow-600 w-max"
        >
          Login
        </button>
      </form>
    </div>
  );
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
