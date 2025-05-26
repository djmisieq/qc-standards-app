"""Initial migration

Revision ID: 001
Revises: 
Create Date: 2025-05-26 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create Enum types
    op.execute("CREATE TYPE userrole AS ENUM ('admin', 'qc_engineer', 'production_leader', 'qc_operator', 'viewer')")
    op.execute("CREATE TYPE templatedoctype AS ENUM ('procedure', 'instruction', 'checklist', 'form')")
    op.execute("CREATE TYPE templatestatus AS ENUM ('draft', 'published', 'archived')")
    op.execute("CREATE TYPE templatetier AS ENUM ('tier1', 'tier2', 'tier3')")
    op.execute("CREATE TYPE qcdocstatus AS ENUM ('in_progress', 'completed', 'signed_off')")
    op.execute("CREATE TYPE judgmenttype AS ENUM ('ok', 'ng', 'hold', 'minor_defect', 'major_defect')")
    
    # Create tables
    op.create_table('productmodel',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sqlmodel.sql.sqltypes.AutoString(length=100), nullable=False),
        sa.Column('description', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('stage',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sqlmodel.sql.sqltypes.AutoString(length=100), nullable=False),
        sa.Column('description', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('user',
        sa.Column('username', sa.String(length=50), nullable=False),
        sa.Column('email', sa.String(length=100), nullable=False),
        sa.Column('full_name', sa.String(length=100), nullable=False),
        sa.Column('role', sa.Enum('admin', 'qc_engineer', 'production_leader', 'qc_operator', 'viewer', name='userrole'), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('is_superuser', sa.Boolean(), nullable=False),
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('hashed_password', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_email'), 'user', ['email'], unique=True)
    op.create_index(op.f('ix_user_username'), 'user', ['username'], unique=True)
    
    op.create_table('template',
        sa.Column('model_id', sa.Integer(), nullable=False),
        sa.Column('stage_id', sa.Integer(), nullable=False),
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sqlmodel.sql.sqltypes.AutoString(length=200), nullable=False),
        sa.Column('reference_number', sqlmodel.sql.sqltypes.AutoString(length=50), nullable=False),
        sa.Column('doc_type', sa.Enum('procedure', 'instruction', 'checklist', 'form', name='templatedoctype'), nullable=False),
        sa.Column('status', sa.Enum('draft', 'published', 'archived', name='templatestatus'), nullable=False),
        sa.Column('tier', sa.Enum('tier1', 'tier2', 'tier3', name='templatetier'), nullable=True),
        sa.Column('revision', sqlmodel.sql.sqltypes.AutoString(length=20), nullable=False),
        sa.Column('created_by_id', sa.Integer(), nullable=False),
        sa.Column('approved_by_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['approved_by_id'], ['user.id'], ),
        sa.ForeignKeyConstraint(['created_by_id'], ['user.id'], ),
        sa.ForeignKeyConstraint(['model_id'], ['productmodel.id'], ),
        sa.ForeignKeyConstraint(['stage_id'], ['stage.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('qcdoc',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('document_number', sqlmodel.sql.sqltypes.AutoString(length=50), nullable=False),
        sa.Column('template_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.Enum('in_progress', 'completed', 'signed_off', name='qcdocstatus'), nullable=False),
        sa.Column('created_by_id', sa.Integer(), nullable=False),
        sa.Column('signed_off_by_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('data', sa.JSON(), nullable=False),
        sa.ForeignKeyConstraint(['created_by_id'], ['user.id'], ),
        sa.ForeignKeyConstraint(['signed_off_by_id'], ['user.id'], ),
        sa.ForeignKeyConstraint(['template_id'], ['template.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('step',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('template_id', sa.Integer(), nullable=False),
        sa.Column('step_number', sa.Integer(), nullable=False),
        sa.Column('title', sqlmodel.sql.sqltypes.AutoString(length=200), nullable=False),
        sa.Column('description', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('check_method', sqlmodel.sql.sqltypes.AutoString(length=100), nullable=False),
        sa.Column('tools_required', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('acceptance_criteria', sa.JSON(), nullable=False),
        sa.Column('reference_images', sa.JSON(), nullable=False),
        sa.Column('requires_photo', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['template_id'], ['template.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table('qcresult',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('qc_doc_id', sa.Integer(), nullable=False),
        sa.Column('step_id', sa.Integer(), nullable=False),
        sa.Column('judgment', sa.Enum('ok', 'ng', 'hold', 'minor_defect', 'major_defect', name='judgmenttype'), nullable=False),
        sa.Column('notes', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('photos', sa.JSON(), nullable=False),
        sa.Column('data', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['qc_doc_id'], ['qcdoc.id'], ),
        sa.ForeignKeyConstraint(['step_id'], ['step.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    # Drop tables
    op.drop_table('qcresult')
    op.drop_table('step')
    op.drop_table('qcdoc')
    op.drop_table('template')
    op.drop_index(op.f('ix_user_username'), table_name='user')
    op.drop_index(op.f('ix_user_email'), table_name='user')
    op.drop_table('user')
    op.drop_table('stage')
    op.drop_table('productmodel')
    
    # Drop Enum types
    op.execute("DROP TYPE IF EXISTS judgmenttype")
    op.execute("DROP TYPE IF EXISTS qcdocstatus")
    op.execute("DROP TYPE IF EXISTS templatetier")
    op.execute("DROP TYPE IF EXISTS templatestatus")
    op.execute("DROP TYPE IF EXISTS templatedoctype")
    op.execute("DROP TYPE IF EXISTS userrole")
