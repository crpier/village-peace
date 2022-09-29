import enum
import typing
import pydantic
import math


class SmthType(str, enum.Enum):
    House = "House"
    Grass = "Grass"
    Champion = "Champion"
    Barrack = "Barrack"
    Tower = "Tower"
    Soldier = "Soldier"


def calculate_scale_penalty_on_creation(smthType: SmthType, old_penalty: float):
    match smthType:
        case SmthType.House:
            new_penalty = old_penalty + 0.5
        case SmthType.Grass:
            new_penalty = old_penalty + 0.6
        case SmthType.Champion:
            new_penalty = old_penalty + 0.7
        case SmthType.Barrack:
            new_penalty = old_penalty + 0.8
        case SmthType.Tower:
            new_penalty = old_penalty + 0.9
        case SmthType.Soldier:
            new_penalty = old_penalty + 1
    return new_penalty


def calculate_scale_penalty_on_delete(smthType: SmthType, old_penalty: float):
    match smthType:
        case SmthType.House:
            new_penalty = old_penalty - 0.5
        case SmthType.Grass:
            new_penalty = old_penalty - 0.6
        case SmthType.Champion:
            new_penalty = old_penalty - 0.7
        case SmthType.Barrack:
            new_penalty = old_penalty - 0.8
        case SmthType.Tower:
            new_penalty = old_penalty - 0.9
        case SmthType.Soldier:
            new_penalty = old_penalty - 1
    return new_penalty


username = typing.NewType("username", str)


class User(pydantic.BaseModel):
    username: username
    password: str
    scale_penalty: float = 1


sentry_user = User(username=username("sentry"), password="none")


class Loc(pydantic.BaseModel):
    row: int
    col: int


class WorldChunk(pydantic.BaseModel):
    top_left: Loc
    bottom_right: Loc


class Smth(pydantic.BaseModel):
    loc: Loc
    type: SmthType
    user: username

    def to_jsonable(self):
        return {"loc": self.loc.__dict__, "type": self.type.value, "user": self.user}


class CreationData(pydantic.BaseModel):
    type: SmthType
    price: int


def calculate_available_smthgs(
    loc: Loc, user_penalty: float
) -> typing.List[CreationData]:
    return [
        CreationData(type=SmthType.House, price=math.ceil(20*user_penalty)),
        CreationData(type=SmthType.Champion, price=math.ceil(50*user_penalty)),
        CreationData(type=SmthType.Barrack, price=math.ceil(80*user_penalty)),
        CreationData(type=SmthType.Tower, price=math.ceil(120*user_penalty)),
        CreationData(type=SmthType.Soldier, price=math.ceil(5*user_penalty)),
    ]
