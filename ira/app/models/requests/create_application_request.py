from pydantic import BaseModel


class CreateApplicationRequest(BaseModel):
    cwd: str 
    name: str 