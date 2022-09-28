from abc import abstractmethod
import json
import typing
import websockets.server
import websockets
import enum

import pydantic

from app import models


class StateService:
    def __init__(self) -> None:
        self._stuff: typing.List[models.Smth] = []
        self._users: typing.Dict[models.username, models.User] = {}
        # Add grass all over the place
        for i in range(20):
            for j in range(20):
                grass = models.Smth(
                    loc=models.Loc(row=i, col=j),
                    type=models.SmthType.Grass,
                    user=models.sentry_user.username,
                )
                self.add_smth(grass)

    def get_world_chunk(self, chunk: models.WorldChunk) -> typing.List[models.Smth]:
        return [
            item
            for item in self._stuff
            if (
                item.loc.row >= chunk.top_left.row
                and item.loc.row <= chunk.bottom_right.row
                and item.loc.col >= chunk.top_left.col
                and item.loc.col <= chunk.bottom_right.col
            )
        ]

    def add_user(self, user: models.User):
        if self._users.get(user.username, None):
            raise ValueError(f"User with {user.username=} alread exists")
        self._users[user.username] = user

    def update_user(self, username: models.username, update: dict):
        # TODO: remove this after implementing registration
        self._users[username] = models.User(
            **self._users.get(
                username, models.User(username=username, password="None")
            ).__dict__
            | update
        )

    def get_user(self, username: models.username):
        # TODO: remove this after implementing registration
        return self._users.get(
            username, models.User(username=username, password="None")
        )

    def add_smth(self, smth: models.Smth):
        self._stuff.append(smth)

    def remove_smth(self, smth: models.Smth):
        for item in self._stuff:
            if item.loc == smth.loc and item.type == smth.type:
                self._stuff.remove(item)

    # def populate_world_for_development(self):
    #     self.add_smth(
    #         models.Smth(loc=models.Loc(row=0, col=0), type=models.SmthType.House)
    #     )
    #     self.add_smth(
    #         models.Smth(loc=models.Loc(row=1, col=1), type=models.SmthType.Barrack)
    #     )
    #     self.add_smth(
    #         models.Smth(loc=models.Loc(row=2, col=2), type=models.SmthType.Tower)
    #     )
    #     self.add_smth(
    #         models.Smth(loc=models.Loc(row=3, col=3), type=models.SmthType.Soldier)
    #     )
    #     self.add_smth(
    #         models.Smth(loc=models.Loc(row=4, col=4), type=models.SmthType.Champion)
    #     )


class ClientEventType(str, enum.Enum):
    Connect = "Connect"
    Create = "Create"
    Delete = "Delete"
    Request = "Request"


class ServerEventType(str, enum.Enum):
    Update = "Update"


class ClientEventMeta(pydantic.BaseModel):
    chunk: models.WorldChunk
    username: models.username


class ClientEvent(pydantic.BaseModel):
    event_type: ClientEventType
    data: typing.Optional[models.Smth] = None
    meta: ClientEventMeta

    @abstractmethod
    async def handle(
        self,
        ws_sender: typing.Callable[
            ["ServerEvent"], typing.Coroutine[typing.Any, typing.Any, None]
        ],
        persistence_service: StateService,
    ):
        pass


class ServerEvent(pydantic.BaseModel):
    event_type: ServerEventType
    data: typing.List[models.Smth]


class ConnectionService:
    def __init__(self, persistence_service: StateService) -> None:
        self._persistence_service = persistence_service

    async def send_server_event(self, event: ServerEvent):
        serialized_map = {"data": [smth.to_jsonable() for smth in event.data]}
        data = json.dumps(event.__dict__ | serialized_map)
        await self.ws.send(data)

    async def __call__(self, websocket: websockets.server.WebSocketServerProtocol):
        self.ws = websocket
        while True:
            message = await websocket.recv()
            message_dict = json.loads(message)
            # We don't use a generator here because we actually want to check
            # if only a single element matches the data
            event_class = [
                ev
                for ev in ClientEvent.__subclasses__()
                if ev.__fields__["event_type"].default.value
                == message_dict["event_type"]
            ]
            assert len(event_class) == 1
            try:
                event = event_class[0](**message_dict)
            except pydantic.error_wrappers.ValidationError:
                print(f"Validation failed for {message_dict}")
                message_dict["data"]["type"] = "Soldier"
                event = event_class[0](**message_dict)
            await event.handle(
                ws_sender=self.send_server_event,
                persistence_service=self._persistence_service,
            )


class ConnectEvent(ClientEvent):
    event_type = ClientEventType.Connect
    meta: ClientEventMeta
    data: models.User

    async def handle(
        self,
        ws_sender: typing.Callable[
            ["ServerEvent"], typing.Coroutine[typing.Any, typing.Any, None]
        ],
        persistence_service: StateService,
    ):
        world_to_send = persistence_service.get_world_chunk(self.meta.chunk)
        await ws_sender(
            # TODO: create proper event class
            ServerEvent(event_type=ServerEventType.Update, data=world_to_send)
        )


class CreateEvent(ClientEvent):
    event_type = ClientEventType.Create
    data: models.Smth
    meta: ClientEventMeta

    async def handle(
        self,
        ws_sender: typing.Callable[
            ["ServerEvent"], typing.Coroutine[typing.Any, typing.Any, None]
        ],
        persistence_service: StateService,
    ):
        user = persistence_service.get_user(self.meta.username)
        new_penalty = models.calculate_scale_penalty_on_creation(
            smthType=self.data.type, old_penalty=user.scale_penalty
        )
        persistence_service.add_smth(self.data)
        persistence_service.update_user(
            username=user.username, update={"scale_penalty": new_penalty}
        )

        world_to_send = persistence_service.get_world_chunk(self.meta.chunk)
        await ws_sender(
            ServerEvent(event_type=ServerEventType.Update, data=world_to_send)
        )


class DeleteEvent(ClientEvent):
    event_type = ClientEventType.Delete
    data: models.Smth
    meta: ClientEventMeta

    async def handle(
        self,
        ws_sender: typing.Callable[
            ["ServerEvent"], typing.Coroutine[typing.Any, typing.Any, None]
        ],
        persistence_service: StateService,
    ):
        user = persistence_service.get_user(self.meta.username)
        new_penalty = models.calculate_scale_penalty_on_delete(
            smthType=self.data.type, old_penalty=user.scale_penalty
        )
        persistence_service.remove_smth(self.data)
        persistence_service.update_user(
            username=user.username, update={"scale_penalty": new_penalty}
        )

        world_to_send = persistence_service.get_world_chunk(self.meta.chunk)
        await ws_sender(
            ServerEvent(event_type=ServerEventType.Update, data=world_to_send)
        )
