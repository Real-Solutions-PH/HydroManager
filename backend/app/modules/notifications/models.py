"""Table models for the notifications module.

Reserved module. Owned exclusively by group web-push (#63).

This file is a placeholder committed ahead of parallel session work. It exists
so that ``app/db/models.py`` can import it up front and no group has to edit the
aggregator — two concurrent groups adding tables would otherwise both write it.

Define ``table=True`` SQLModel classes here; they register on
``SQLModel.metadata`` automatically via the aggregator's module import.
"""
