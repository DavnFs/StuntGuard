from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db
from app.services.authentication import AuthenticatedUser, require_current_user


router = APIRouter(prefix="/children", tags=["children"])


@router.get("", response_model=list[schemas.ChildRead])
def get_children(
    search: Optional[str] = Query(default=None, max_length=120),
    posyandu_area: Optional[str] = Query(default=None, max_length=120),
    _current_user: AuthenticatedUser = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    return crud.list_children(db, search=search, posyandu_area=posyandu_area, user_id=_current_user.id)


@router.post("", response_model=schemas.ChildRead, status_code=status.HTTP_201_CREATED)
def create_child(
    payload: schemas.ChildCreate,
    _current_user: AuthenticatedUser = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    return crud.create_child(db, payload, user_id=_current_user.id)


@router.get("/{child_id}", response_model=schemas.ChildRead)
def get_child(
    child_id: int,
    _current_user: AuthenticatedUser = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    child = crud.get_child(db, child_id, user_id=_current_user.id)
    if child is None:
        raise HTTPException(status_code=404, detail="Child not found")
    return child


@router.put("/{child_id}", response_model=schemas.ChildRead)
def update_child(
    child_id: int,
    payload: schemas.ChildUpdate,
    _current_user: AuthenticatedUser = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    child = crud.get_child(db, child_id, user_id=_current_user.id)
    if child is None:
        raise HTTPException(status_code=404, detail="Child not found")
    return crud.update_child(db, child, payload)


@router.delete("/{child_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_child(
    child_id: int,
    _current_user: AuthenticatedUser = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    child = crud.get_child(db, child_id, user_id=_current_user.id)
    if child is None:
        raise HTTPException(status_code=404, detail="Child not found")
    crud.delete_child(db, child)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
