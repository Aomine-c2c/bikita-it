from django.core.management.base import BaseCommand
from core.backup_service import run_safe_migration, check_database_integrity, create_backup


class Command(BaseCommand):
    help = "Safely apply Django migrations with an automated pre-migration backup and integrity rollback safeguard."

    def add_arguments(self, parser):
        parser.add_argument(
            "--backup-only",
            action="store_true",
            help="Create an on-demand database snapshot without migrating.",
        )
        parser.add_argument(
            "--integrity-check",
            action="store_true",
            help="Run database PRAGMA integrity check and foreign key verification only.",
        )

    def handle(self, *args, **options):
        if options["integrity_check"]:
            self.stdout.write("Running database integrity diagnostic...")
            res = check_database_integrity()
            if res["is_healthy"]:
                self.stdout.write(self.style.SUCCESS(f"Database is healthy. {res['total_tables']} tables verified with 0 errors."))
            else:
                self.stdout.write(self.style.ERROR(f"Integrity errors detected: {res['errors']}"))
            return

        if options["backup_only"]:
            self.stdout.write("Creating on-demand database snapshot...")
            snapshot = create_backup(trigger_reason="cli_manual")
            self.stdout.write(self.style.SUCCESS(
                f"Snapshot created: {snapshot['filename']} ({snapshot['size_formatted']}, SHA-256: {snapshot['checksum_sha256'][:12]}...)"
            ))
            return

        self.stdout.write(self.style.WARNING("Starting safe database migration safeguard..."))
        result = run_safe_migration()
        if result["success"]:
            self.stdout.write(self.style.SUCCESS(
                f"SUCCESS: {result['message']}\nPre-migration snapshot preserved at: {result['snapshot']}"
            ))
        else:
            self.stdout.write(self.style.ERROR(
                f"MIGRATION FAILED: {result['error']}\nAUTOMATIC ROLLBACK PERFORMED to: {result['rolled_back_to']}"
            ))
