import type { NextPage } from "next";
import Head from "next/head";
import { Component } from "react";

/* type Loc = { */
/*   row: number; */
/*   col: number; */
/* }; */

type thingStyle = {
  height: number;
  width: number;
  position: "absolute";
  zIndex: number;
  marginLeft?: number;
  marginTop?: number;
};

type thingData = {
  sprite: string;
  style: thingStyle;
};
const type_to_props = new Map<string, thingData>([
  [
    "Grass",
    {
      sprite: "grass.png",
      style: { height: 96, width: 96, position: "absolute", zIndex: 0 },
    },
  ],
  [
    "House",
    {
      sprite: "house.png",
      style: {
        height: 48,
        width: 48,
        position: "absolute",
        zIndex: 1,
        marginLeft: 10,
        marginTop: 20,
      },
    },
  ],
  [
    "Champion",
    {
      sprite: "champion.png",
      style: {
        height: 48,
        width: 48,
        position: "absolute",
        zIndex: 1,
        marginLeft: 10,
        marginTop: 20,
      },
    },
  ],
  [
    "Barrack",
    {
      sprite: "barrack.png",
      style: {
        height: 72,
        width: 72,
        position: "absolute",
        zIndex: 1,
        marginLeft: 12,
        marginTop: 12,
      },
    },
  ],
  [
    "Tower",
    {
      sprite: "tower.png",
      style: {
        height: 72,
        width: 72,
        marginLeft: 12,
        marginTop: 12,
        position: "absolute",
        zIndex: 1,
      },
    },
  ],
  [
    "Soldier",
    {
      sprite: "soldier.png",
      style: {
        height: 48,
        width: 48,
        position: "absolute",
        zIndex: 1,
        marginLeft: 10,
        marginTop: 20,
      },
    },
  ],
]);

// -----Components-----
interface WorldProps {}

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
    this.ws = new WebSocket("ws://localhost:8000");
    this.ws.onopen = (_) => {
      // is this a workaround or proper react etiquette?
      setTimeout(() => {
        if (this.ws) {
          this.ws.send(
            JSON.stringify({
              type: "event",
              event: "connection",
              data: "some string or smth",
            })
          );
        }
      }, 100);
    };
    this.ws.onmessage = (message: any) => {
      let data = JSON.parse(message.data);
      if (data.type == "info") {
        this.setState({ items: data.data });
      }
    };
  }

  componentWillUnmount(): void {
    if (this.ws) {
      this.ws.close(1000);
    }
  }

  openPopup = (_: MouseEvent) => {
    this.setState({
      popup: {
        open: true,
        target: { type: "House", top: 0, left: 0 },
        popup: { left: 0, top: 0 },
      },
    });
  };

  closePopup = () => {
    this.setState({
      popup: {
        open: false,
        target: { type: "", top: 0, left: 0 },
        popup: { left: 0, top: 0 },
      },
    });
  };

  render() {
    return (
      <main className="container mx-auto flex flex-col items-center justify-center min-h-screen p-4">
        {this.state.popup.open && this.ws && (
          <Popup
            target={this.state.popup.target}
            popup={this.state.popup.popup}
            ws={this.ws}
            closeHandler={this.closePopup}
          ></Popup>
        )}
        {this.state.items?.map(
          (item: any) =>
            this.ws && (
              <Thing
                thingType={item.type}
                left={item.loc.col}
                top={item.loc.row}
                key={`${item.type}:${item.loc.row}-${item.loc.col}`}
                ws={this.ws}
                openPopup={this.openPopup}
              />
            )
        )}
      </main>
    );
  }
}

interface PopupState {}
interface PopupProps {
  target: {
    type: string;
    top: number;
    left: number;
  };
  popup: { left: number; top: number };
  closeHandler: () => void;
  ws: WebSocket;
}

class Popup extends Component<PopupProps, PopupState> {
  constructor(props: PopupProps) {
    super(props);
    this.state = {};
  }

  createThing = (_: any) => {
    const eventType = this.props.target.type == "Grass" ? "delete" : "create";
    const notification = JSON.stringify({
      type: "event",
      event: eventType,
      data: JSON.stringify({
        type: this.props.target.type,
        col: this.props.target.left,
        row: this.props.target.top,
      }),
    });
    this.props.ws.send(notification);
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

function Thing(props: {
  left: number;
  top: number;
  thingType: string;
  ws: WebSocket;
  openPopup: (e: any) => any;
}) {
  let thingData = type_to_props.get(props.thingType);
  if (thingData) {
    let style = {
      ...thingData.style,
      left: 48 + props.left * 96,
      top: 48 + props.top * 96,
    };
    return (
      <img src={thingData.sprite} style={style} onClick={props.openPopup} />
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
