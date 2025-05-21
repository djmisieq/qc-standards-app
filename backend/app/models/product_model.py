from typing import Optional, List
from sqlmodel import Field, SQLModel, Relationship, Column, String


class ProductModelBase(SQLModel):
    name: str = Field(sa_column=Column(String(100), unique=True, index=True))
    description: Optional[str] = None


class ProductModel(ProductModelBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Relationships will be defined in SQLModel after all models are created


class ProductModelCreate(ProductModelBase):
    pass


class ProductModelUpdate(SQLModel):
    name: Optional[str] = None
    description: Optional[str] = None


class ProductModelRead(ProductModelBase):
    id: int
