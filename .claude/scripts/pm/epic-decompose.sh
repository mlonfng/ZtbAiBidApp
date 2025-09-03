#!/bin/bash

# Epic Decompose - Break epic into concrete, actionable tasks

# Validate input
if [[ $# -eq 0 ]]; then
    echo "❌ Feature name was not provided as parameter. Please run: /pm:epic-decompose <feature_name>"
    exit 1
fi

FEATURE_NAME="$1"
EPIC_DIR=".claude/epics/${FEATURE_NAME}"
EPIC_FILE="${EPIC_DIR}/epic.md"

# Verify epic exists
if [[ ! -f "$EPIC_FILE" ]]; then
    echo "❌ Epic not found: $FEATURE_NAME. First create it with: /pm:prd-parse $FEATURE_NAME"
    exit 1
fi

# Check for existing tasks
existing_tasks=$(find "$EPIC_DIR" -name "*.md" ! -name "epic.md" | wc -l)
if [[ $existing_tasks -gt 0 ]]; then
    echo "⚠️ Found $existing_tasks existing tasks. Delete and recreate all tasks? (yes/no)"
    read -r response
    if [[ "$response" != "yes" ]]; then
        echo "View existing tasks with: /pm:epic-show $FEATURE_NAME"
        exit 0
    fi
    # Remove existing tasks
    find "$EPIC_DIR" -name "*.md" ! -name "epic.md" -delete
fi

# Validate epic frontmatter
if ! grep -q "^---" "$EPIC_FILE" || ! grep -q "name:" "$EPIC_FILE" || ! grep -q "prd:" "$EPIC_FILE"; then
    echo "❌ Invalid epic frontmatter. Please check: $EPIC_FILE"
    echo "   Missing required frontmatter fields: name, status, prd"
    exit 1
fi

# Check epic status
if grep -q "status:.*completed" "$EPIC_FILE"; then
    echo "⚠️ Epic is marked as completed. Are you sure you want to decompose it again? (yes/no)"
    read -r response
    if [[ "$response" != "yes" ]]; then
        exit 0
    fi
fi

# Get current datetime
CURRENT_DATETIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "Decomposing epic: $FEATURE_NAME"
echo ""

# Create task files based on the epic's task breakdown
TASKS=(
    "Frontend Code Analysis and Cleanup|Analyze and refactor React components, clean up unused code, optimize state management|frontend/src/|M|16|true"
    "Backend Service Optimization|Optimize FastAPI endpoints, improve database queries, refactor service layer|backend/app/|M|20|true" 
    "Test File Removal and Consolidation|Identify and remove unused test files, consolidate redundant test cases|frontend/src/ backend/tests/|S|8|true"
    "Startup Configuration Optimization|Improve package.json scripts, optimize server startup, enhance build processes|package.json backend/|S|12|false"
    "Build and Deployment Improvement|Optimize Webpack configuration, improve CI/CD pipelines, reduce build times|frontend/ backend/|M|16|true"
    "Chinese Documentation Standardization|Ensure all documentation is in Chinese, maintain technical terminology|README* CLAUDE* COMMANDS* AGENTS*|L|24|true"
    "Performance Testing and Benchmarking|Conduct performance tests, establish benchmarks, measure optimization results|frontend/ backend/|S|8|false"
    "Final Validation and Quality Assurance|Comprehensive testing, quality checks, ensure no breaking changes|entire project|M|16|false"
)

# Create tasks sequentially
echo "Creating 8 tasks for epic: $FEATURE_NAME"
echo ""

for i in "${!TASKS[@]}"; do
    task_num=$(printf "%03d" $((i+1)))
    IFS='|' read -r title description location size hours parallel <<< "${TASKS[$i]}"
    
    TASK_FILE="${EPIC_DIR}/${task_num}.md"
    
    # Create task content
    TASK_CONTENT="---
name: $title
status: open
created: $CURRENT_DATETIME
updated: $CURRENT_DATETIME
github: [Will be updated when synced to GitHub]
depends_on: []
parallel: $parallel
conflicts_with: []
---

# Task: $title

## Description
$description

## Acceptance Criteria
- [ ] Code analysis completed and technical debt identified
- [ ] Refactoring implemented according to best practices
- [ ] Performance improvements measured and documented
- [ ] No breaking changes to existing functionality
- [ ] Chinese documentation completed and verified

## Technical Details
- **Location**: $location
- **Approach**: Incremental refactoring with backward compatibility
- **Key Files**: Various components and services throughout project
- **Considerations**: Maintain existing functionality while improving quality

## Dependencies
- [ ] Epic requirements and architecture decisions
- [ ] Existing codebase structure and patterns

## Effort Estimate
- **Size**: $size
- **Hours**: $hours
- **Parallel**: $parallel

## Definition of Done
- [ ] Code implemented and tested
- [ ] Performance benchmarks achieved
- [ ] Documentation updated in Chinese
- [ ] Code review completed
- [ ] No regression in existing functionality"
    
    # Save task to file
    echo "$TASK_CONTENT" > "$TASK_FILE"
    echo "✅ Created task ${task_num}.md - $title"
    
    # Small delay to avoid file creation conflicts
    sleep 0.1
done

# Update epic with task summary
TASK_SUMMARY=""
for i in "${!TASKS[@]}"; do
    task_num=$(printf "%03d" $((i+1)))
    IFS='|' read -r title description location size hours parallel <<< "${TASKS[$i]}"
    TASK_SUMMARY+="- [ ] ${task_num}.md - $title (parallel: $parallel)\n"
done

# Calculate totals
TOTAL_HOURS=0
for i in "${!TASKS[@]}"; do
    IFS='|' read -r title description location size hours parallel <<< "${TASKS[$i]}"
    TOTAL_HOURS=$((TOTAL_HOURS + hours))
done

PARALLEL_COUNT=0
for i in "${!TASKS[@]}"; do
    IFS='|' read -r title description location size hours parallel <<< "${TASKS[$i]}"
    if [[ "$parallel" == "true" ]]; then
        PARALLEL_COUNT=$((PARALLEL_COUNT + 1))
    fi
done

SEQUENTIAL_COUNT=$(( ${#TASKS[@]} - PARALLEL_COUNT ))

# Add task summary to epic
EPIC_CONTENT=$(cat "$EPIC_FILE")
TASK_SECTION="
## Tasks Created
${TASK_SUMMARY}
**Total tasks**: ${#TASKS[@]}\n
**Parallel tasks**: $PARALLEL_COUNT\n
**Sequential tasks**: $SEQUENTIAL_COUNT\n
**Estimated total effort**: $TOTAL_HOURS hours"

# Insert task section before the last section
if [[ "$EPIC_CONTENT" == *"## Dependencies"* ]]; then
    # Insert before Dependencies section
    UPDATED_EPIC=$(echo "$EPIC_CONTENT" | sed '/## Dependencies/i\
## Tasks Created
${TASK_SUMMARY}
**Total tasks**: ${#TASKS[@]}
**Parallel tasks**: $PARALLEL_COUNT
**Sequential tasks**: $SEQUENTIAL_COUNT
**Estimated total effort**: $TOTAL_HOURS hours')
else
    # Append at the end
    UPDATED_EPIC="$EPIC_CONTENT$TASK_SECTION"
fi

echo "$UPDATED_EPIC" > "$EPIC_FILE"

# Final output
echo ""
echo "✅ Created ${#TASKS[@]} tasks for epic: $FEATURE_NAME"
echo ""
echo "📋 Summary:"
echo "- Total tasks: ${#TASKS[@]}"
echo "- Parallel tasks: $PARALLEL_COUNT"
echo "- Sequential tasks: $SEQUENTIAL_COUNT"
echo "- Estimated total effort: $TOTAL_HOURS hours"
echo ""
echo "💡 Ready to sync to GitHub? Run: /pm:epic-sync $FEATURE_NAME"