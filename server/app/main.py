import asyncio
import json
import dataclasses
from typing import List
import random
from pprint import pprint

import websockets.server
import websockets.exceptions
import websockets


@dataclasses.dataclass
class Loc:
    row: int
    col: int


@dataclasses.dataclass
class Smth:
    loc: Loc
    type = None


def smth_to_dict(smth: Smth):
    return dict(type=smth.type, loc=dict(row=smth.loc.row, col=smth.loc.col))


class House(Smth):
    type = "House"


class Grass(Smth):
    type = "Grass"


class Champion(Smth):
    type = "Champion"


class Barrack(Smth):
    type = "Barrack"


class Tower(Smth):
    type = "Tower"


class Soldier(Smth):
    type = "Soldier"


class WorldMap:
    def __init__(self) -> None:
        self._stuff: List[Smth] = []

    def add_smth(self, smth: Smth):
        self._stuff.append(smth)

    def del_smth(self, type: str, loc: Loc):
        for item in self._stuff:
            if item.loc == loc and item.type == type:
                self._stuff.remove(item)

    def get_stuff_in_zone(self, top_left: Loc, bot_right: Loc):
        return [
            item
            for item in self._stuff
            if (
                item.loc.row >= top_left.row
                and item.loc.row <= bot_right.row
                and item.loc.col >= top_left.col
                and item.loc.col <= bot_right.col
            )
        ]


world1 = WorldMap()
world1.add_smth(House(Loc(0, 0)))
world1.add_smth(House(Loc(9, 9)))
world1.add_smth(House(Loc(3, 11)))
world1.add_smth(House(Loc(3, 6)))
world1.add_smth(House(Loc(5, 1)))
world1.add_smth(House(Loc(5, 13)))
world1.add_smth(House(Loc(5, 7)))
world1.add_smth(House(Loc(7, 17)))
world1.add_smth(House(Loc(7, 8)))
world1.add_smth(House(Loc(12, 2)))
world1.add_smth(House(Loc(12, 3)))
world1.add_smth(House(Loc(13, 13)))
world1.add_smth(House(Loc(13, 17)))
world1.add_smth(House(Loc(14, 18)))
world1.add_smth(House(Loc(15, 18)))
world1.add_smth(House(Loc(16, 4)))
world1.add_smth(House(Loc(17, 9)))
world1.add_smth(House(Loc(18, 11)))
world1.add_smth(House(Loc(20, 14)))
world1.add_smth(House(Loc(20, 5)))
world1.add_smth(House(Loc(20, 20)))

world1.add_smth(Champion(Loc(1, 1)))
world1.add_smth(Barrack(Loc(2, 2)))
world1.add_smth(Tower(Loc(3, 3)))
world1.add_smth(Soldier(Loc(4, 4)))


def add_grass_everywhere(world: WorldMap):
    for i in range(20):
        for j in range(20):
            world.add_smth(Grass(Loc(i, j)))


add_grass_everywhere(world1)


stuff = world1.get_stuff_in_zone(Loc(0, 0), Loc(3,3))
printable_stuff = [smth_to_dict(thing) for thing in stuff]


async def handler(websocket: websockets.server.WebSocketServerProtocol):
    while True:
        message = await websocket.recv()
        try:
            event = json.loads(message)
            if event["type"] == "event" and event["event"] == "connection":
                response = json.dumps(
                    dict(
                        type="info",
                        meta="stuff in zone for 0x0 20x20",
                        data=printable_stuff,
                    )
                )
                pprint(f"{response=}")
                await websocket.send(response)
            elif event["type"] == "event":
                data = json.loads(event["data"])
                if event["event"] == "delete":
                    print("\n\n\nDeleting")
                    del_loc = Loc(data["row"], data["col"])
                    del_type = data["type"]
                    world1.del_smth(del_type, del_loc)
                    response = json.dumps(
                        dict(
                            type="info",
                            meta="stuff in zone for 0x0 20x20",
                            data=[
                                smth_to_dict(thing)
                                for thing in world1.get_stuff_in_zone(
                                    Loc(0, 0), Loc(3,3)
                                )
                            ],
                        )
                    )
                    pprint(f"{response=}")
                    await websocket.send(response)
                elif event["event"] == "create":
                    print(f"\n\n\nCreating smth on {data['row']}:{data['col']}")
                    world1.add_smth(
                        random.choice(
                            [
                                House(Loc(data["row"], data["col"])),
                                Champion(Loc(data["row"], data["col"])),
                                Barrack(Loc(data["row"], data["col"])),
                                Tower(Loc(data["row"], data["col"])),
                                Soldier(Loc(data["row"], data["col"])),
                            ]
                        )
                    )
                    response = json.dumps(
                        dict(
                            type="info",
                            meta="stuff in zone for 0x0 20x20",
                            data=[
                                smth_to_dict(thing)
                                for thing in world1.get_stuff_in_zone(
                                    Loc(0, 0), Loc(3,3)
                                )
                            ],
                        )
                    )
                    pprint(f"{response=}")
                    await websocket.send(response)
        except json.JSONDecodeError:
            response = json.dumps(
                dict(type="error", message="unJSONable data sent!", data=message)
            )

            pprint(f"{response=}")
            await websocket.send(response)
        except websockets.exceptions.ConnectionClosedOK as e:
            print("Why is this an error?")
            print(e)
        except websockets.exceptions.ConnectionClosedError as e:
            print("Why is this an error?")
            print(e)


async def main():
    async with websockets.server.serve(handler, "", 8000):
        print("Starting websocket server")
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
