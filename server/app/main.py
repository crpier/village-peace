import asyncio
import json
import dataclasses
from typing import List
import random
from pprint import pprint
import os

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


def add_grass_everywhere(world: WorldMap):
    for i in range(20):
        for j in range(20):
            world.add_smth(Grass(Loc(i, j)))


def make_new_world():
    world = WorldMap()
    world.add_smth(House(Loc(0, 0)))
    world.add_smth(House(Loc(9, 9)))
    world.add_smth(House(Loc(3, 11)))
    world.add_smth(House(Loc(3, 6)))
    world.add_smth(House(Loc(5, 1)))
    world.add_smth(House(Loc(5, 13)))
    world.add_smth(House(Loc(5, 7)))
    world.add_smth(House(Loc(7, 17)))
    world.add_smth(House(Loc(7, 8)))
    world.add_smth(House(Loc(12, 2)))
    world.add_smth(House(Loc(12, 3)))
    world.add_smth(House(Loc(13, 13)))
    world.add_smth(House(Loc(13, 17)))
    world.add_smth(House(Loc(14, 18)))
    world.add_smth(House(Loc(15, 18)))
    world.add_smth(House(Loc(16, 4)))
    world.add_smth(House(Loc(17, 9)))
    world.add_smth(House(Loc(18, 11)))
    world.add_smth(House(Loc(20, 14)))
    world.add_smth(House(Loc(20, 5)))
    world.add_smth(House(Loc(20, 20)))

    world.add_smth(Champion(Loc(1, 1)))
    world.add_smth(Barrack(Loc(2, 2)))
    world.add_smth(Tower(Loc(3, 3)))
    world.add_smth(Soldier(Loc(4, 4)))
    add_grass_everywhere(world)
    return world


world1 = make_new_world()


async def handler(websocket: websockets.server.WebSocketServerProtocol):
    while True:
        message = await websocket.recv()
        try:
            event = json.loads(message)
            if event["type"] == "Connect":
                response = json.dumps(
                    dict(
                        type="Update",
                        meta="stuff in zone for 0x0 20x20",
                        data=[
                            smth_to_dict(thing)
                            for thing in world1.get_stuff_in_zone(Loc(0, 0), Loc(6, 10))
                        ],
                    )
                )
                # pprint(f"{response=}")
                await websocket.send(response)
            elif event["type"] == "event":
                data = json.loads(event["data"])
                if event["event"] == "delete":
                    print(f"\n\n\nDeleting")
                    pprint(data)
                    del_loc = Loc(data["row"], data["col"])
                    del_type = data["type"]
                    world1.del_smth(del_type, del_loc)
                    response = json.dumps(
                        dict(
                            type="Update",
                            meta="stuff in zone for 0x0 20x20",
                            data=[
                                smth_to_dict(thing)
                                for thing in world1.get_stuff_in_zone(
                                    Loc(0, 0), Loc(6, 10)
                                )
                            ],
                        )
                    )
                    # pprint(f"{response=}")
                    await websocket.send(response)
                elif event["event"] == "create":
                    print(f"\n\n\nCreating smth")
                    pprint(data)
                    match data["type"]:
                        case "House":
                            thing_to_add = House(Loc(data["row"], data["col"]))
                        case "Champion":
                            thing_to_add = Champion(Loc(data["row"], data["col"]))
                        case "Barrack":
                            thing_to_add = Barrack(Loc(data["row"], data["col"]))
                        case "Tower":
                            thing_to_add = Tower(Loc(data["row"], data["col"]))
                        case "Soldier":
                            thing_to_add = Soldier(Loc(data["row"], data["col"]))
                        case _:
                            thing_to_add = House(Loc(data["row"], data["col"]))
                    world1.add_smth(thing_to_add)
                    response = json.dumps(
                        dict(
                            type="Update",
                            meta="stuff in zone for 0x0 20x20",
                            data=[
                                smth_to_dict(thing)
                                for thing in world1.get_stuff_in_zone(
                                    Loc(0, 0), Loc(6, 10)
                                )
                            ],
                        )
                    )
                    # pprint(f"{response=}")
                    await websocket.send(response)
        except json.JSONDecodeError:
            response = json.dumps(
                dict(type="error", message="unJSONable data sent!", data=message)
            )

            # pprint(f"{response=}")
            await websocket.send(response)
        except websockets.exceptions.ConnectionClosedOK as e:
            print("Why is this an error?")
            print(e)
        except websockets.exceptions.ConnectionClosedError as e:
            print("Why is this an error?")
            print(e)


async def periodic_wipe():
    global world1
    while True:
        print("Wiping")
        world1 = make_new_world()
        await asyncio.sleep(1800)


async def main():
    port = int(os.getenv("PORT", 8000))
    print(f"Listening on port {port}")
    loop = asyncio.get_event_loop()
    task = loop.create_task(periodic_wipe())

    async with websockets.server.serve(handler, "", port):
        asyncio._register_task(task)
        print("Starting websocket server")
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
