# Import all models here for Alembic autogenerate feature
from app.models.user import User
from app.models.template import Template
from app.models.step import Step
from app.models.checklist import QCDoc, QCResult
from app.models.stage import Stage
from app.models.product_model import ProductModel

# Define relationships here to avoid circular imports
from sqlmodel import Relationship

# User relationships
User.created_templates = Relationship(back_populates="created_by_user", sa_relationship_kwargs={"foreign_keys": "[Template.created_by_id]"})
User.approved_templates = Relationship(back_populates="approved_by_user", sa_relationship_kwargs={"foreign_keys": "[Template.approved_by_id]"})
User.created_checklists = Relationship(back_populates="created_by_user", sa_relationship_kwargs={"foreign_keys": "[QCDoc.created_by_id]"})
User.signed_off_checklists = Relationship(back_populates="signed_off_by_user", sa_relationship_kwargs={"foreign_keys": "[QCDoc.signed_off_by_id]"})

# Template relationships
Template.created_by_user = Relationship(back_populates="created_templates", sa_relationship_kwargs={"foreign_keys": "[Template.created_by_id]"})
Template.approved_by_user = Relationship(back_populates="approved_templates", sa_relationship_kwargs={"foreign_keys": "[Template.approved_by_id]"})
Template.model = Relationship(back_populates="templates")
Template.stage = Relationship(back_populates="templates")
Template.steps = Relationship(back_populates="template")
Template.checklists = Relationship(back_populates="template")

# Step relationships
Step.template = Relationship(back_populates="steps")
Step.results = Relationship(back_populates="step")

# QCDoc relationships
QCDoc.template = Relationship(back_populates="checklists")
QCDoc.created_by_user = Relationship(back_populates="created_checklists", sa_relationship_kwargs={"foreign_keys": "[QCDoc.created_by_id]"})
QCDoc.signed_off_by_user = Relationship(back_populates="signed_off_checklists", sa_relationship_kwargs={"foreign_keys": "[QCDoc.signed_off_by_id]"})
QCDoc.results = Relationship(back_populates="qc_doc")

# QCResult relationships
QCResult.qc_doc = Relationship(back_populates="results")
QCResult.step = Relationship(back_populates="results")

# Stage relationships
Stage.templates = Relationship(back_populates="stage")

# ProductModel relationships
ProductModel.templates = Relationship(back_populates="model")
