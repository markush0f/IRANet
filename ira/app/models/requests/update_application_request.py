from pydantic import BaseModel


class UpdateApplicationRequest(BaseModel):
    name: str

