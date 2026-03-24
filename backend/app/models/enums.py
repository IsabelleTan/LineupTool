import enum


class PlayerRole(str, enum.Enum):
    PLAYER = "Player"
    STAFF = "Staff"


class PlayerStatus(str, enum.Enum):
    ACTIVE = "Active"
    INACTIVE = "Inactive"
    INJURED = "Injured"
    PREGNANT = "Pregnant"


class FieldingPosition(str, enum.Enum):
    P = "P"
    C = "C"
    FIRST = "1B"
    SECOND = "2B"
    THIRD = "3B"
    SS = "SS"
    LF = "LF"
    CF = "CF"
    RF = "RF"
    DH = "DH"
    EH = "EH"
    BENCH = "BENCH"
