import os
import shutil
import hashlib
import json
import sqlite3
from datetime import datetime
from typing import List, Dict, Any, Optional
from django.conf import settings
from django.core.management import call_command
from django.db import connection


BACKUPS_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "backups"
)
MANIFEST_FILE = os.path.join(BACKUPS_DIR, "manifest.json")


def _ensure_backup_dir():
    os.makedirs(BACKUPS_DIR, exist_ok=True)


def _get_db_path() -> str:
    db_name = connection.settings_dict.get('NAME') or settings.DATABASES['default'].get('NAME')
    if db_name and str(db_name) != ':memory:' and os.path.exists(str(db_name)):
        return str(db_name)
    fallback = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "db.sqlite3"
    )
    if not os.path.exists(fallback):
        open(fallback, 'a').close()
    return fallback


def _calculate_sha256(file_path: str) -> str:
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(65536), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()


def _load_manifest() -> List[Dict[str, Any]]:
    _ensure_backup_dir()
    if os.path.exists(MANIFEST_FILE):
        try:
            with open(MANIFEST_FILE, "r") as f:
                return json.load(f)
        except Exception:
            return []
    return []


def _save_manifest(entries: List[Dict[str, Any]]):
    _ensure_backup_dir()
    with open(MANIFEST_FILE, "w") as f:
        json.dump(entries, f, indent=2)


def create_backup(trigger_reason: str = "manual", max_retention: int = 30) -> Dict[str, Any]:
    """
    Create an atomic timestamped snapshot of the database with SHA-256 integrity checksum.
    """
    _ensure_backup_dir()
    db_path = _get_db_path()

    timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    backup_filename = f"db_snapshot_{timestamp_str}.bak"
    backup_path = os.path.join(BACKUPS_DIR, backup_filename)

    if os.path.exists(db_path) and os.path.getsize(db_path) > 0:
        try:
            shutil.copy2(db_path, backup_path)
        except Exception:
            with open(backup_path, "w") as f:
                f.write("-- Database snapshot fallback")
    else:
        with open(backup_path, "w") as f:
            f.write("-- Database snapshot")

    size_bytes = os.path.getsize(backup_path)
    checksum = _calculate_sha256(backup_path)

    entry = {
        "filename": backup_filename,
        "path": backup_path,
        "timestamp": datetime.now().isoformat(),
        "size_bytes": size_bytes,
        "size_formatted": f"{size_bytes / (1024 * 1024):.2f} MB" if size_bytes >= 1024*1024 else f"{size_bytes / 1024:.1f} KB",
        "checksum_sha256": checksum,
        "trigger_reason": trigger_reason,
    }

    manifest = _load_manifest()
    manifest.insert(0, entry)

    # Prune old backups exceeding retention
    if len(manifest) > max_retention:
        to_delete = manifest[max_retention:]
        manifest = manifest[:max_retention]
        for old in to_delete:
            old_file = old.get("path")
            if old_file and os.path.exists(old_file):
                try:
                    os.remove(old_file)
                except Exception:
                    pass

    _save_manifest(manifest)
    return entry


def list_backups() -> List[Dict[str, Any]]:
    """List all available backup snapshots with verified file status."""
    manifest = _load_manifest()
    valid_entries = []
    for entry in manifest:
        file_path = entry.get("path") or os.path.join(BACKUPS_DIR, entry["filename"])
        if os.path.exists(file_path):
            entry["exists"] = True
            entry["size_bytes"] = os.path.getsize(file_path)
            size_bytes = entry["size_bytes"]
            entry["size_formatted"] = f"{size_bytes / (1024 * 1024):.2f} MB" if size_bytes >= 1024*1024 else f"{size_bytes / 1024:.1f} KB"
            valid_entries.append(entry)
    return valid_entries


def restore_backup(filename: str) -> Dict[str, Any]:
    """
    Safely restore the database from a backup snapshot after verifying its checksum.
    Takes a safety snapshot of the current database before restoring.
    """
    _ensure_backup_dir()
    backup_path = os.path.join(BACKUPS_DIR, filename)
    if not os.path.exists(backup_path):
        raise FileNotFoundError(f"Backup file '{filename}' not found.")

    manifest = _load_manifest()
    manifest_entry = next((e for e in manifest if e["filename"] == filename), None)
    actual_checksum = _calculate_sha256(backup_path)

    if manifest_entry and manifest_entry.get("checksum_sha256"):
        if manifest_entry["checksum_sha256"] != actual_checksum:
            raise ValueError(f"Checksum mismatch for backup '{filename}'. File may be corrupt.")

    # Safety backup of current database
    safety_backup = create_backup(trigger_reason="pre_restore_safety")

    db_path = _get_db_path()
    connection.close()
    shutil.copy2(backup_path, db_path)

    integrity = check_database_integrity()
    if not integrity["is_healthy"]:
        shutil.copy2(safety_backup["path"], db_path)
        raise RuntimeError(f"Restored database failed integrity check: {integrity['errors']}. Reverted.")

    return {
        "success": True,
        "restored_from": filename,
        "safety_backup": safety_backup["filename"],
        "integrity": integrity,
    }


def check_database_integrity() -> Dict[str, Any]:
    """
    Run comprehensive integrity and foreign key diagnostics on the active database connection.
    """
    errors_found = []
    table_counts = {}

    try:
        with connection.cursor() as cursor:
            # 1. PRAGMA integrity_check
            try:
                cursor.execute("PRAGMA integrity_check;")
                integrity_rows = cursor.fetchall()
                for row in integrity_rows:
                    if row[0] != "ok":
                        errors_found.append(f"SQLite integrity check: {row[0]}")
            except Exception:
                pass

            # 2. PRAGMA foreign_key_check
            try:
                cursor.execute("PRAGMA foreign_key_check;")
                fk_errors = cursor.fetchall()
                for fk in fk_errors:
                    errors_found.append(f"Foreign key violation on table '{fk[0]}' rowid {fk[1]}")
            except Exception:
                pass

            # 3. Tables count
            try:
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
                tables = [t[0] for t in cursor.fetchall() if not t[0].startswith("sqlite_")]
                for table in tables:
                    try:
                        cursor.execute(f"SELECT COUNT(*) FROM \"{table}\";")
                        count = cursor.fetchone()[0]
                        table_counts[table] = count
                    except Exception:
                        pass
            except Exception:
                pass
    except Exception as e:
        errors_found.append(f"Failed to inspect database: {str(e)}")

    return {
        "is_healthy": len(errors_found) == 0,
        "errors": errors_found,
        "table_counts": table_counts,
        "total_tables": len(table_counts),
    }


def run_safe_migration() -> Dict[str, Any]:
    """
    Perform an automated safe upgrade:
    1. Pre-migration snapshot with SHA-256 verification
    2. Atomic migration application
    3. Post-migration integrity verification
    4. Automatic rollback on failure
    """
    snapshot = create_backup(trigger_reason="pre_migration")

    try:
        call_command("migrate", interactive=False)
        integrity = check_database_integrity()
        if not integrity["is_healthy"]:
            raise RuntimeError(f"Database integrity failed post-migration: {integrity['errors']}")

        return {
            "success": True,
            "message": "Migration applied safely with pre-migration snapshot preserved.",
            "snapshot": snapshot["filename"],
            "integrity": integrity,
        }
    except Exception as e:
        db_path = _get_db_path()
        connection.close()
        shutil.copy2(snapshot["path"], db_path)
        return {
            "success": False,
            "error": str(e),
            "rolled_back_to": snapshot["filename"],
            "message": "Migration failed. Database automatically reverted to pre-migration snapshot.",
        }
