/* eslint-disable */
import type { NextPage } from "next";
import Head from "next/head";
import { Component, useState } from "react";
import { typeToProps } from "../types/domain";

let ws: WebSocket;

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

class World extends Component<WorldProps, WorldState> {
  ws: WebSocket | undefined = undefined;

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
    ws = new WebSocket("wss://village-peace-production.up.railway.app");
    ws.onopen = (_) => {
      // is this a workaround or proper react etiquette?
      setTimeout(() => {
        if (ws) {
          ws.send(
            JSON.stringify({
              type: "event",
              event: "connection",
              data: "some string or smth",
            })
          );
        }
      }, 100);
    };
    ws.onmessage = (message: any) => {
      let data = JSON.parse(message.data);
      if (data.type == "info") {
        this.setState({ items: data.data });
      }
    };
  }

  componentWillUnmount(): void {
    if (ws) {
      ws.close(1000);
    }
  }

  render() {
    return (
      <main className="container mx-auto flex flex-col items-center justify-center min-h-screen p-4">
        {this.state.items?.map(
          (item: any) =>
            ws && (
              <Thing
                thingType={item.type}
                left={item.loc.col}
                top={item.loc.row}
                key={`${item.type}:${item.loc.row}-${item.loc.col}`}
              />
            )
        )}
      </main>
    );
  }
}

interface PopupState { }
interface PopupProps {
  target: {
    type: string;
    top: number;
    left: number;
  };
  popup: { left: number; top: number };
  closeHandler: () => void;
}

class CreatePopup extends Component<PopupProps, PopupState> {
  constructor(props: PopupProps) {
    super(props);
    this.state = {};
  }

  createThing = (_: any) => {
    console.log(this.props)
    const eventType = this.props.target.type == "Grass" ? "create" : "delete";
    const notification = JSON.stringify({
      type: "event",
      event: eventType,
      data: JSON.stringify({
        type: this.props.target.type,
        col: this.props.target.left,
        row: this.props.target.top,
      }),
    });
    ws.send(notification);
    this.props.closeHandler();
  };

  render() {
    return (
      <div
        style={{ position: "absolute", top: 96, left: 96, zIndex: 100 }}
        className="p-2 bg-yellow-500"
      >
        <p>Create Thing</p>
        <ul>
          <li
            onClick={this.createThing}
            className="flex p-1 my-4 hover:bg-yellow-300"
          >
            <p className="flex-grow">House</p>
            <img className="mx-4" src="house.png"></img>
          </li>
          <li className="flex p-1 my-4 hover:bg-yellow-300">
            <p className="flex-grow">Barrack</p>
            <img className="mx-4" src="barrack.png"></img>
          </li>
          <li className="flex p-1 my-4 hover:bg-yellow-300">
            <p className="flex-grow">Tower</p>
            <img className="mx-4" src="tower.png"></img>
          </li>
          <li className="flex p-1 my-4 hover:bg-yellow-300">
            <p className="flex-grow">Soldier</p>
            <img className="mx-4" src="soldier.png"></img>
          </li>
          <li className="flex p-1 my-4 hover:bg-yellow-300">
            <p className="flex-grow">Champion</p>
            <img className="mx-4" src="champion.png"></img>
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
    return (
      <div>
        <img src={thingData.sprite} style={style} onClick={openPopup} />

        {showPopup && (
          <CreatePopup
            target={{
              type: props.thingType,
              left: props.left,
              top: props.top,
            }}
            popup={{ left: props.left, top: props.top }}
            closeHandler={closePopup}
          ></CreatePopup>
        )}
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
        <World></World>
      </div>
    </>
  );
};

export default Home;
/* eslint-disable */
