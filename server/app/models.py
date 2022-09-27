import enum
import pydantic


class SmthType(str, enum.Enum):
    House = "House"
    Grass = "Grass"
    Champion = "Champion"
    Barrack = "Barrack"
    Tower = "Tower"
    Soldier = "Soldier"


class Loc(pydantic.BaseModel):
    row: int
    col: int


class WorldChunk(pydantic.BaseModel):
    top_left: Loc
    bottom_right: Loc


class Smth(pydantic.BaseModel):
    loc: Loc
    type: SmthType

    def to_jsonable(self):
        return {"loc": self.loc.__dict__, "type": self.type.value}
