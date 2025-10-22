#!/usr/bin/env python3
"""
Migration script untuk memastikan semua existing subform fields memiliki field_type yang valid.
Script ini akan:
1. Scan semua subform fields di database
2. Identifikasi fields dengan field_type kosong atau invalid
3. Auto-assign field_type berdasarkan field_name patterns
4. Backup data sebelum migration
5. Apply fixes dengan rollback capability
"""

import json
import logging
import os
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import sessionmaker
from database import engine
from models import FormField
from validators import validate_subform_field_structure

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SubformMigration:
    """Handle subform field migration with backup and rollback capabilities"""
    
    def __init__(self):
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        self.backup_file = f"subform_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        self.migration_log = []
        
    def create_backup(self) -> bool:
        """Create backup of all subform fields before migration"""
        
        logger.info("📦 Creating backup of existing subform fields...")
        
        db = self.SessionLocal()
        try:
            subform_fields = db.query(FormField).filter(FormField.field_type == 'subform').all()
            
            backup_data = []
            for field in subform_fields:
                backup_data.append({
                    'id': field.id,
                    'form_id': field.form_id,
                    'field_name': field.field_name,
                    'field_type': field.field_type.value if hasattr(field.field_type, 'value') else str(field.field_type),
                    'field_options': field.field_options,
                    'created_at': field.created_at.isoformat() if field.created_at else None
                })
            
            # Save backup to file
            backup_path = os.path.join(os.path.dirname(__file__), self.backup_file)
            with open(backup_path, 'w', encoding='utf-8') as f:
                json.dump(backup_data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"✅ Backup created: {backup_path} ({len(backup_data)} fields)")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to create backup: {e}")
            return False
        finally:
            db.close()
    
    def analyze_subform_fields(self) -> Dict[str, Any]:
        """Analyze existing subform fields to identify issues"""
        
        logger.info("🔍 Analyzing existing subform fields...")
        
        db = self.SessionLocal()
        try:
            subform_fields = db.query(FormField).filter(FormField.field_type == 'subform').all()
            
            analysis = {
                'total_subforms': len(subform_fields),
                'fields_with_issues': [],
                'fields_without_subform_fields': [],
                'fields_with_empty_field_type': [],
                'fields_with_invalid_field_type': [],
                'summary': {}
            }
            
            valid_field_types = {
                'text', 'dropdown', 'search_dropdown', 'button', 'photo', 
                'signature', 'measurement', 'notes', 'date', 'datetime', 'time'
            }
            
            for field in subform_fields:
                field_info = {
                    'id': field.id,
                    'form_id': field.form_id,
                    'field_name': field.field_name,
                    'issues': []
                }
                
                if not field.field_options:
                    field_info['issues'].append('No field_options')
                    analysis['fields_without_subform_fields'].append(field_info)
                    continue
                
                subform_fields_data = field.field_options.get('subform_fields', [])
                
                if not subform_fields_data:
                    field_info['issues'].append('No subform_fields array')
                    analysis['fields_without_subform_fields'].append(field_info)
                    continue
                
                for i, subfield in enumerate(subform_fields_data):
                    if not isinstance(subfield, dict):
                        field_info['issues'].append(f'Subfield #{i+1} is not a dictionary')
                        continue
                    
                    subfield_name = subfield.get('field_name', f'Unnamed #{i+1}')
                    
                    # Check for missing field_type
                    if not subfield.get('field_type'):
                        field_info['issues'].append(f"Subfield '{subfield_name}' missing field_type")
                        analysis['fields_with_empty_field_type'].append({
                            **field_info,
                            'subfield_index': i,
                            'subfield_name': subfield_name
                        })
                    
                    # Check for invalid field_type
                    elif subfield.get('field_type') not in valid_field_types:
                        field_info['issues'].append(f"Subfield '{subfield_name}' has invalid field_type: '{subfield.get('field_type')}'")
                        analysis['fields_with_invalid_field_type'].append({
                            **field_info,
                            'subfield_index': i,
                            'subfield_name': subfield_name,
                            'invalid_field_type': subfield.get('field_type')
                        })
                
                if field_info['issues']:
                    analysis['fields_with_issues'].append(field_info)
            
            # Generate summary
            analysis['summary'] = {
                'total_subforms': analysis['total_subforms'],
                'subforms_with_issues': len(analysis['fields_with_issues']),
                'subforms_without_subform_fields': len(analysis['fields_without_subform_fields']),
                'subfields_with_empty_field_type': len(analysis['fields_with_empty_field_type']),
                'subfields_with_invalid_field_type': len(analysis['fields_with_invalid_field_type'])
            }
            
            # Log summary
            logger.info("📊 Analysis Summary:")
            logger.info(f"  Total subforms: {analysis['summary']['total_subforms']}")
            logger.info(f"  Subforms with issues: {analysis['summary']['subforms_with_issues']}")
            logger.info(f"  Subforms without subform_fields: {analysis['summary']['subforms_without_subform_fields']}")
            logger.info(f"  Subfields with empty field_type: {analysis['summary']['subfields_with_empty_field_type']}")
            logger.info(f"  Subfields with invalid field_type: {analysis['summary']['subfields_with_invalid_field_type']}")
            
            return analysis
            
        finally:
            db.close()
    
    def fix_subform_field(self, subfield: Dict[str, Any]) -> bool:
        """Fix a single subform field by auto-assigning field_type"""
        
        field_name = subfield.get('field_name', '')
        
        if not field_name:
            logger.warning("Cannot fix subfield without field_name")
            return False
        
        # Use the validate_subform_field_structure function from validators
        # This function will auto-assign field_type if missing
        original_field_type = subfield.get('field_type')
        
        try:
            # Create a copy to avoid modifying original during validation
            subfield_copy = dict(subfield)
            
            # Remove field_type to trigger auto-assignment
            if not original_field_type:
                subfield_copy.pop('field_type', None)
            
            # Validate and auto-assign
            validated_subfield = validate_subform_field_structure(subfield_copy, "Migration")
            
            # Update the original subfield with the validated data
            subfield.update(validated_subfield)
            
            new_field_type = subfield.get('field_type')
            logger.info(f"  ✅ Auto-assigned '{new_field_type}' to field '{field_name}' (was: '{original_field_type}')")
            return True
            
        except Exception as e:
            logger.error(f"  ❌ Failed to fix field '{field_name}': {e}")
            # Fallback to 'text' if validation fails
            subfield['field_type'] = 'text'
            logger.info(f"  ✅ Fallback assigned 'text' to field '{field_name}' (was: '{original_field_type}')")
            return True
    
    def migrate_subform_fields(self, dry_run: bool = True) -> bool:
        """Migrate subform fields to fix field_type issues"""
        
        mode = "DRY RUN" if dry_run else "LIVE MIGRATION"
        logger.info(f"🚀 Starting subform field migration ({mode})...")
        
        # Analyze first
        analysis = self.analyze_subform_fields()
        
        if analysis['summary']['subforms_with_issues'] == 0:
            logger.info("✅ No subform fields need migration!")
            return True
        
        db = self.SessionLocal()
        try:
            # Process fields with empty or invalid field_type
            fields_to_fix = analysis['fields_with_empty_field_type'] + analysis['fields_with_invalid_field_type']
            
            migration_count = 0
            
            for field_info in fields_to_fix:
                field = db.query(FormField).filter(FormField.id == field_info['id']).first()
                
                if not field:
                    logger.warning(f"Field ID {field_info['id']} not found")
                    continue
                
                logger.info(f"🔧 Fixing field '{field.field_name}' (ID: {field.id})")
                
                subform_fields_data = field.field_options.get('subform_fields', [])
                
                if field_info['subfield_index'] >= len(subform_fields_data):
                    logger.warning(f"Subfield index {field_info['subfield_index']} out of range")
                    continue
                
                subfield = subform_fields_data[field_info['subfield_index']]
                
                # Fix the subfield
                if self.fix_subform_field(subfield):
                    migration_count += 1
                    
                    # Log the change
                    self.migration_log.append({
                        'field_id': field.id,
                        'field_name': field.field_name,
                        'subfield_name': field_info['subfield_name'],
                        'old_field_type': field_info.get('invalid_field_type', ''),
                        'new_field_type': subfield['field_type'],
                        'timestamp': datetime.now().isoformat()
                    })
                    
                    if not dry_run:
                        # Update the field_options in database
                        field.field_options = dict(field.field_options)  # Ensure it's mutable
                        db.commit()
                        logger.info(f"  💾 Saved changes to database")
                    else:
                        logger.info(f"  🔍 Would save changes (dry run mode)")
            
            if not dry_run:
                logger.info(f"✅ Migration completed! Fixed {migration_count} subfields")
            else:
                logger.info(f"🔍 Dry run completed! Would fix {migration_count} subfields")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Migration failed: {e}")
            if not dry_run:
                db.rollback()
            return False
        finally:
            db.close()
    
    def save_migration_log(self):
        """Save migration log to file"""
        
        if not self.migration_log:
            return
        
        log_file = f"migration_log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        log_path = os.path.join(os.path.dirname(__file__), log_file)
        
        with open(log_path, 'w', encoding='utf-8') as f:
            json.dump(self.migration_log, f, indent=2, ensure_ascii=False)
        
        logger.info(f"📝 Migration log saved: {log_path}")

def main():
    """Main migration function"""
    
    migration = SubformMigration()
    
    logger.info("🚀 Starting subform field constraint migration...")
    
    # Create backup
    if not migration.create_backup():
        logger.error("❌ Failed to create backup. Aborting migration.")
        return False
    
    # Analyze current state
    logger.info("\n" + "="*50)
    analysis = migration.analyze_subform_fields()
    
    if analysis['summary']['subforms_with_issues'] == 0:
        logger.info("✅ No migration needed! All subform fields are already compliant.")
        return True
    
    # Run dry run first
    logger.info("\n" + "="*50)
    logger.info("🔍 Running dry run migration...")
    if not migration.migrate_subform_fields(dry_run=True):
        logger.error("❌ Dry run failed. Aborting migration.")
        return False
    
    # Ask for confirmation (in real scenario)
    logger.info("\n" + "="*50)
    logger.info("⚠️  Ready to run live migration. This will modify database data.")
    
    # For automation, we'll proceed automatically
    # In interactive mode, you would ask for user confirmation here
    
    # Run live migration
    logger.info("🚀 Running live migration...")
    if not migration.migrate_subform_fields(dry_run=False):
        logger.error("❌ Live migration failed.")
        return False
    
    # Save migration log
    migration.save_migration_log()
    
    # Verify migration
    logger.info("\n" + "="*50)
    logger.info("🔍 Verifying migration results...")
    final_analysis = migration.analyze_subform_fields()
    
    if final_analysis['summary']['subforms_with_issues'] == 0:
        logger.info("🎉 Migration successful! All subform fields are now compliant.")
        return True
    else:
        logger.error(f"❌ Migration incomplete. {final_analysis['summary']['subforms_with_issues']} fields still have issues.")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)