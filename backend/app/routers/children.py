from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db


router = APIRouter(prefix="/children", tags=["children"])


@router.get("", response_model=list[schemas.ChildRead])
def get_children(
    search: Optional[str] = None,
    posyandu_area: Optional[str] = None,
    db: Session = Depends(get_db),
):
    return crud.list_children(db, search=search, posyandu_area=posyandu_area)


@router.post("", response_model=schemas.ChildRead, status_code=status.HTTP_201_CREATED)
def create_child(payload: schemas.ChildCreate, db: Session = Depends(get_db)):
    return crud.create_child(db, payload)


@router.get("/{child_id}", response_model=schemas.ChildRead)
def get_child(child_id: int, db: Session = Depends(get_db)):
    child = crud.get_child(db, child_id)
    if child is None:
        raise HTTPException(status_code=404, detail="Child not found")
    return child


@router.put("/{child_id}", response_model=schemas.ChildRead)
def update_child(child_id: int, payload: schemas.ChildUpdate, db: Session = Depends(get_db)):
    child = crud.get_child(db, child_id)
    if child is None:
        raise HTTPException(status_code=404, detail="Child not found")
    return crud.update_child(db, child, payload)


@router.delete("/{child_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_child(child_id: int, db: Session = Depends(get_db)):
    child = crud.get_child(db, child_id)
    if child is None:
        raise HTTPException(status_code=404, detail="Child not found")
    crud.delete_child(db, child)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
