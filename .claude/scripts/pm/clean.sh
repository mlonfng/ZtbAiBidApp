#!/bin/bash

# Clean up completed work and archive old epics

echo "🧹 Cleaning PM System..."
echo ""

# Check for dry-run mode
DRY_RUN=false
if [[ "$1" == "--dry-run" ]]; then
    DRY_RUN=true
    echo "📋 Dry Run Mode - No changes will be made"
    echo ""
fi

# Check if we have any epics to clean
EPIC_COUNT=$(find .claude/epics -maxdepth 1 -type d -name "*" ! -name ".*" ! -name "epics" | wc -l)

if [[ $EPIC_COUNT -eq 0 ]]; then
    echo "📁 No epics found to clean"
    echo ""
    echo "💡 Create your first epic with: /pm:prd-new <feature-name>"
    exit 0
fi

echo "📋 Cleanup Plan"
echo "======================="
echo ""

# Check for completed epics
COMPLETED_EPICS=()
for epic_dir in .claude/epics/*/; do
    if [[ -f "${epic_dir}epic.md" ]]; then
        if grep -q "status:.*completed" "${epic_dir}epic.md"; then
            epic_name=$(basename "$epic_dir")
            COMPLETED_EPICS+=("$epic_name")
        fi
    fi
done

# Check for stale progress files
STALE_FILES=0
if [[ -d ".claude/epics" ]]; then
    STALE_FILES=$(find .claude/epics -name "*.progress" -mtime +30 2>/dev/null | wc -l)
fi

# Check for empty directories
EMPTY_DIRS=()
if [[ -d ".claude/epics" ]]; then
    while IFS= read -r -d '' dir; do
        if [[ -z "$(ls -A "$dir" 2>/dev/null)" ]]; then
            EMPTY_DIRS+=("$dir")
        fi
    done < <(find .claude/epics -type d -empty -print0 2>/dev/null)
fi

# Show cleanup plan
echo "Completed Epics to Archive:"
if [[ ${#COMPLETED_EPICS[@]} -eq 0 ]]; then
    echo "  None found"
else
    for epic in "${COMPLETED_EPICS[@]}"; do
        echo "  $epic"
    done
fi
echo ""

echo "Stale Progress to Remove:"
echo "  $STALE_FILES progress files older than 30 days"
echo ""

echo "Empty Directories:"
if [[ ${#EMPTY_DIRS[@]} -eq 0 ]]; then
    echo "  None found"
else
    for dir in "${EMPTY_DIRS[@]}"; do
        echo "  $dir"
    done
fi
echo ""

if [[ "$DRY_RUN" == true ]]; then
    echo "📋 This is a dry run. No changes were made."
    exit 0
fi

# If no work to do, exit
if [[ ${#COMPLETED_EPICS[@]} -eq 0 && $STALE_FILES -eq 0 && ${#EMPTY_DIRS[@]} -eq 0 ]]; then
    echo "✅ System is already clean!"
    exit 0
fi

# Ask for confirmation
echo "Proceed with cleanup? (yes/no)"
read -r response

if [[ "$response" != "yes" ]]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo ""
echo "🔄 Executing cleanup..."
echo ""

# Archive completed epics
ARCHIVED_COUNT=0
if [[ ${#COMPLETED_EPICS[@]} -gt 0 ]]; then
    mkdir -p .claude/epics/.archived
    for epic in "${COMPLETED_EPICS[@]}"; do
        mv ".claude/epics/$epic" ".claude/epics/.archived/" 2>/dev/null
        if [[ $? -eq 0 ]]; then
            echo "✅ Archived: $epic"
            ((ARCHIVED_COUNT++))
        fi
    done
fi

# Remove stale progress files
REMOVED_FILES=0
if [[ $STALE_FILES -gt 0 ]]; then
    find .claude/epics -name "*.progress" -mtime +30 -delete 2>/dev/null
    REMOVED_FILES=$STALE_FILES
    echo "✅ Removed $REMOVED_FILES stale progress files"
fi

# Clean empty directories
CLEANED_DIRS=0
if [[ ${#EMPTY_DIRS[@]} -gt 0 ]]; then
    for dir in "${EMPTY_DIRS[@]}"; do
        rmdir "$dir" 2>/dev/null
        if [[ $? -eq 0 ]]; then
            ((CLEANED_DIRS++))
        fi
    done
    echo "✅ Cleaned $CLEANED_DIRS empty directories"
fi

# Create archive log
mkdir -p .claude/epics/.archived
ARCHIVE_LOG=".claude/epics/.archived/archive-log.md"
if [[ ! -f "$ARCHIVE_LOG" ]]; then
    echo "# Archive Log" > "$ARCHIVE_LOG"
    echo "" >> "$ARCHIVE_LOG"
fi

echo "" >> "$ARCHIVE_LOG"
echo "## $(date '+%Y-%m-%d %H:%M:%S')" >> "$ARCHIVE_LOG"
if [[ $ARCHIVED_COUNT -gt 0 ]]; then
    echo "- Archived: $ARCHIVED_COUNT completed epics" >> "$ARCHIVE_LOG"
fi
if [[ $REMOVED_FILES -gt 0 ]]; then
    echo "- Removed: $REMOVED_FILES stale progress files" >> "$ARCHIVE_LOG"
fi
if [[ $CLEANED_DIRS -gt 0 ]]; then
    echo "- Cleaned: $CLEANED_DIRS empty directories" >> "$ARCHIVE_LOG"
fi

# Final output
echo ""
echo "✅ Cleanup Complete"
echo "======================="
echo ""
echo "Archived:"
echo "  $ARCHIVED_COUNT completed epics"
echo ""
echo "Removed:"
echo "  $REMOVED_FILES stale files"
echo "  $CLEANED_DIRS empty directories"
echo ""
echo "System is clean and organized."