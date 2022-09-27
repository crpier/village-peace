export enum SmthType {
  House = "House",
  Grass = "Grass",
  Champion = "Champion",
  Barrack = "Barrack",
  Tower = "Tower",
  Soldier = "Soldier",
}

export type Loc = {
  row: number;
  col: number;
};

export type Smth = {
  loc: Loc;
  type: SmthType;
};

export type thingStyle = {
  height: number;
  width: number;
  position: "absolute";
  zIndex: number;
  marginLeft?: number;
  marginTop?: number;
};

export type thingData = {
  sprite: string;
  style: thingStyle;
};

export const typeToProps = new Map<string, thingData>([
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
