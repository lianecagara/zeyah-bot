#!/usr/bin/env bash

set -e

echo "===================================="
echo "      Zeyah Adaptive Updater"
echo "===================================="

REPO_URL="https://github.com/lianecagara/zeyah-bot.git"
REMOTE="origin"
BRANCH="master"

# Ensure git repo
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "Initializing repository..."

    git init
    git remote add origin "$REPO_URL"
fi

# Fix remote URL if needed
if [ "$(git remote get-url origin 2>/dev/null)" != "$REPO_URL" ]; then
    git remote set-url origin "$REPO_URL"
fi

echo "Fetching upstream..."
git fetch origin

TARGET_REF="$REMOTE/$BRANCH"

LOCAL_HEAD=$(git rev-parse HEAD)
REMOTE_HEAD=$(git rev-parse "$TARGET_REF")

# Already synced
if [ "$LOCAL_HEAD" = "$REMOTE_HEAD" ]; then
    echo "✔ Already up-to-date."
    exit 0
fi

# Check relationship using common ancestor
echo "Checking repository history relation..."

BASE=$(git merge-base HEAD "$TARGET_REF" || true)

if [ -n "$BASE" ]; then
    echo "Histories are related."

    echo "Trying fast-forward merge..."

    if git merge --ff-only "$TARGET_REF"; then
        echo "✔ Fast-forward update done."
        exit 0
    fi

    echo "Fast-forward failed. Trying normal merge..."

    if git merge "$TARGET_REF"; then
        echo "✔ Merge completed."
        exit 0
    fi
else
    echo "Histories are unrelated."

    echo "Allowing merge with unrelated histories..."

    if git merge "$TARGET_REF" --allow-unrelated-histories; then
        echo "✔ Unrelated history merge successful."
        exit 0
    else
        echo "❌ Merge failed due to conflicts."
        exit 1
    fi
fi

echo "✅ Update process finished."