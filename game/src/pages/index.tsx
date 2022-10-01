/* eslint-disable */
import type { NextPage } from "next";
import Head from "next/head";
import { Component, createRef, FormEvent, RefObject, useState } from "react";
import { env } from "../env/client.mjs";
import { typeToProps, SmthType } from "../types/domain";
import { WSClient, ServerEventType, WorldMeta } from "../services/ws";

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
  worldMeta: WorldMeta;
  username: string;
  mapHeight: number;
  mapWidth: number;
}

enum Direction {
  Up = "Up",
  Down = "Down",
  Left = "Left",
  Right = "Right",
}

// TODO: move this data into a service maybe?
let loggedUser = "";
let worldMeta: WorldMeta;

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
      mapHeight: 0,
      mapWidth: 0,
    };
  }

  componentDidMount() {
    const width = Math.floor(window.innerWidth / 96) - 2;
    const height = Math.floor(window.innerHeight / 96) - 2;
    worldMeta = {
      top_left: {
        row: 0,
        col: 0,
      },
      bottom_right: {
        row: height,
        col: width,
      },
    };
    this.setState({
      worldMeta: {
        top_left: {
          row: 0,
          col: 0,
        },
        bottom_right: {
          row: height,
          col: width,
        },
      },
      mapWidth: width,
      mapHeight: height,
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

  scroll(direction: Direction) {
    let newMeta: WorldMeta = this.state.worldMeta;
    switch (direction) {
      case Direction.Up:
        newMeta.top_left.row--;
        newMeta.bottom_right.row--;
        break;
      case Direction.Down:
        newMeta.top_left.row++;
        newMeta.bottom_right.row++;
        break;
      case Direction.Left:
        newMeta.top_left.col--;
        newMeta.bottom_right.col--;
        break;
      case Direction.Right:
        newMeta.top_left.col++;
        newMeta.bottom_right.col++;
        break;
    }
    this.setState({
      worldMeta: newMeta,
    });
    wsClient.updateWorldMeta(newMeta);
    worldMeta = newMeta;
  }

  render() {
    return (
      <main className="flex flex-row items-center justify-center text-center min-h-screen p-4 w-screen">
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
          <LoginPopup setUsername={this.authenticate}></LoginPopup>
        )}
        <ScrollArrow
          direction={Direction.Up}
          scrollCallback={() => this.scroll(Direction.Up)}
          mapWidth={this.state.mapWidth}
          mapHeight={this.state.mapHeight}
        ></ScrollArrow>
        <ScrollArrow
          direction={Direction.Down}
          scrollCallback={() => this.scroll(Direction.Down)}
          mapWidth={this.state.mapWidth}
          mapHeight={this.state.mapHeight}
        ></ScrollArrow>
        <ScrollArrow
          direction={Direction.Left}
          scrollCallback={() => this.scroll(Direction.Left)}
          mapWidth={this.state.mapWidth}
          mapHeight={this.state.mapHeight}
        ></ScrollArrow>
        <ScrollArrow
          direction={Direction.Right}
          scrollCallback={() => this.scroll(Direction.Right)}
          mapWidth={this.state.mapWidth}
          mapHeight={this.state.mapHeight}
        ></ScrollArrow>
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
          <button
            className="w-max hover:bg-yellow-200 px-3 rounded-md"
            onClick={this.props.closeHandler}
          >
            X
          </button>
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
      type: e.target.closest("li[id]").id,
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
      <div>
        {this.state.items.length > 0 && (
          <div
            style={{ position: "absolute", top: 96, left: 96, zIndex: 100 }}
            className="p-2 bg-yellow-500 w-60"
          >
            <div className="flex mb-3">
              <div className="w-full"></div>
              <button
                className="w-max hover: bg-yellow-300 hover:bg-yellow-200 px-3 rounded-md"
                onClick={this.props.closeHandler}
              >
                X
              </button>
            </div>
            <p>Create Smth</p>
            <div className="h-1 bg-orange-800"></div>
            <ul>
              {this.state.items.map((item) => (
                <li
                  onClick={this.createSmth}
                  className="flex p-1 my-4 hover:bg-yellow-300"
                  key={item.type}
                  id={item.type}
                >
                  <p className="flex-grow flex">
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
        )}
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
      left: 48 + (props.left - worldMeta.top_left.col) * 96,
      top: 48 + (props.top - worldMeta.top_left.row) * 96,
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

function ScrollArrow(props: {
  direction: Direction;
  scrollCallback: () => void;
  mapHeight: number;
  mapWidth: number;
}) {
  const position: { [key in Direction]: { left: number; top: number } } = {
    Up: {
      left: 48 + (props.mapWidth / 2) * 96,
      top: 24,
    },
    Down: {
      left: 48 + (props.mapWidth / 2) * 96,
      top: 24 + (props.mapHeight + 1) * 96,
    },
    Left: {
      left: 24,
      top: ((props.mapHeight + 1) / 2) * 96,
    },
    Right: {
      left: 24 + (props.mapWidth + 1) * 96,
      top: ((props.mapHeight + 1) / 2) * 96,
    },
  };
  return (
    <button
      className={
        "absolute bg-yellow-500 hover:bg-yellow-300 border-yellow-300 border-b-8 border-r-8 " +
        props.direction.toLowerCase()
      }
      style={{
        left: position[props.direction].left,
        top: position[props.direction].top,
        width: 48,
        height: 48,
        zIndex: 0,
      }}
      onClick={props.scrollCallback}
    ></button>
  );
}
function LoginPopup(props: { setUsername: (username: string) => void }) {
  let input: RefObject<HTMLInputElement> = createRef();
  function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    props.setUsername(input.current?.value || "");
  }
  return (
    <div className="bg-yellow-600 z-10 w-4/12 text-center">
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
