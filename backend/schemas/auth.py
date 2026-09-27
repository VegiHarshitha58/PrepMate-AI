from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    name: str
    college: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str