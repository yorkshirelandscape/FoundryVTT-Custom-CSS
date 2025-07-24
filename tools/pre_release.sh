#!/bin/bash

DEV=FALSE

# Pre-Release Checklist
VERSION_TAG=FALSE
MANIFEST=FALSE
CHANGELOG=FALSE
README=FALSE
SET_TAG=FALSE

# Determine current tag
TAG=$(git describe --tags --abbrev=0)

# Generate the next release tag possibilities based on the current tag
RLS_PATCH=$(echo $TAG | awk -F. -v OFS=. '{$NF++;print}')
RLS_MINOR=$(echo $TAG | awk -F. -v OFS=. '{$(NF-1)++;$NF=0;print}')
RLS_MAJOR=$(echo $TAG | awk -F. -v OFS=. '{$1++;$2=0;$3=0;print}')

# search CHANGELOG.md and module.json for each RLS version
if grep -q "## \[$RLS_PATCH\]" CHANGELOG.md || grep -q "\"version\": \"$RLS_PATCH\"" module.json; then
    RLS_TYPE=1
elif grep -q "## \[$RLS_MINOR\]" CHANGELOG.md || grep -q "\"version\": \"$RLS_MINOR\"" module.json; then
    RLS_TYPE=2
elif grep -q "## \[$RLS_MAJOR\]" CHANGELOG.md || grep -q "\"version\": \"$RLS_MAJOR\"" module.json; then
    RLS_TYPE=3
else
    RLS_TYPE=0
fi

# If no release type is found, prompt the user to select one
if [ $RLS_TYPE -eq 0 ]; then
    echo "No release type found. Please select one:"
    echo "0) Keep current version ($TAG)"
    echo "1) Patch Release ($RLS_PATCH)"
    echo "2) Minor Release ($RLS_MINOR)"
    echo "3) Major Release ($RLS_MAJOR)"
    read -p "Enter your choice (0/1/2/3): " RLS_TYPE
fi

# Set the release tag based on the selected type
case $RLS_TYPE in
    0)
        RELEASE_TAG=$TAG
        VERSION_TAG=TRUE
        ;;
    1)
        RELEASE_TAG=$RLS_PATCH
        VERSION_TAG=TRUE
        ;;
    2)
        RELEASE_TAG=$RLS_MINOR
        VERSION_TAG=TRUE
        ;;
    3)
        RELEASE_TAG=$RLS_MAJOR
        VERSION_TAG=TRUE
        ;;
    *)
        echo "Invalid choice. Exiting."
        VERSION_TAG=FALSE
        exit 1
        ;;
esac    

# Set the version in module.json if it hasn't been set yet
if ! grep -q "\"version\": \"$RELEASE_TAG\"" module.json; then
    echo "Setting version in module.json to $RELEASE_TAG"
    sed -i "s/\"version\": \".*\"/\"version\": \"$RELEASE_TAG\"/" module.json
    MANIFEST=FALSE
else
    echo "Version in module.json is already set to $RELEASE_TAG"
    MANIFEST=TRUE
fi

LATEST_CHANGELOG=""
# Add the CHANGELOG entry header if it doesn't exist
if ! grep -q "## \[$RELEASE_TAG\]" CHANGELOG.md; then
    echo "Adding CHANGELOG entry for $RELEASE_TAG"
    echo -e "\n\n## [$RELEASE_TAG](https://github.com/yorkshirelandscape/FoundryVTT-Custom-CSS/tree/$RELEASE_TAG)<sup>[&Delta;](https://github.com/yorkshirelandscape/FoundryVTT-Custom-CSS/compare/$(git describe --tags --abbrev=0)...$RELEASE_TAG)</sup> &mdash;&mdash; *$(date +%Y-%m-%d)*\n- <Changes>" >> CHANGELOG.md
    CHANGELOG=FALSE
else
    echo "CHANGELOG entry for $RELEASE_TAG already exists"
    CHANGELOG=TRUE
    # Grab the complete entry for the current release tag (H2 header and all content until the next H2 header)
    LATEST_CHANGELOG=$(sed -n "/## \[$RELEASE_TAG\]/,/^## /p" CHANGELOG.md | sed '1d')
fi

if $CHANGELOG; then
    if grep -q "## \[$RELEASE_TAG\]" README.md; then
      echo "Changelog entry for $RELEASE_TAG already exists in README.md"
      README=TRUE
    else
      echo "Adding CHANGELOG entry for $RELEASE_TAG in README.md"  
      echo "Removing last CHANGELOG entry in README.md"
      # Store everything below the ## Changelog header as REMAINING_CHANGELOG
      REMAINING_CHANGELOG=$(sed -n '/## Changelog/,$p' README.md | sed '1d')
      # Remove the final H2 header and everything below it
      REMAINING_CHANGELOG=$(echo "$REMAINING_CHANGELOG" | sed '/^## /,$d')
      # Append LATEST and REMAINING to the ## Changelog section at the end of README.md
      echo -e "\n\n$LATEST_CHANGELOG\n$REMAINING_CHANGELOG" > README.md
      echo "Changelog updated in README.md"
      README=FALSE
    fi
else
    echo "CHANGELOG entry not ready for addition to README.md"
    README=FALSE
fi

if $VERSION_TAG && $MANIFEST && $CHANGELOG && $README; then
    echo "Pre-release checks passed successfully."
    echo "Ready to create release tag: $RELEASE_TAG"
    if [ "$DEV" = "TRUE" ]; then
      echo "DEVELOPMENT MODE: No changes will be committed or tags created."
      echo "Current tag: $TAG"
      echo "Release tag: $RELEASE_TAG"
      echo "Manifest updated: $MANIFEST"
      echo "Changelog entry added: $CHANGELOG"
      echo "README.md updated with changelog: $README"
      echo "Set tag: $SET_TAG"    
    else
      echo "Ready to release version $RELEASE_TAG?"
      read -p "Press Enter to continue or Ctrl+C to cancel: "
      echo "Committing changes and creating release tag..."
      git add .
      git commit -m "Prepare for release $RELEASE_TAG"
      git push
      echo "Creating release tag: $RELEASE_TAG"
      git tag "$RELEASE_TAG"
      git push --tags
      echo "Release tag $RELEASE_TAG created and pushed successfully."
    fi
else
    echo "Pre-release checks failed. Please review the following:"
    if ! $VERSION_TAG; then echo "- Version tag not set or already exists."; fi
    if ! $MANIFEST; then echo "- Manifest version not updated."; fi
    if ! $CHANGELOG; then echo "- Changelog entry not added."; fi
    if ! $README; then echo "- README.md not updated with changelog."; fi
    exit 1
fi
    
