# audit-gtm-containers
Google Tag Manager → Google Sheets Exporter (Apps Script)

Read-only Apps Script that authenticates via OAuth2, walks through all GTM accounts & containers you can access, and writes each container’s first workspace to the active spreadsheet:

- Full guide for use: https://mikehiggins.me.uk/posts/gtm-audit-google-sheet

- Tags → Tags_<container-publicId> sheet (name, type, firing & blocking trigger IDs)
- Variables → Variables_<container-publicId> sheet (name, type)
- Great for quick audits or creating a lightweight backup of your GTM configuration.

## How it works

- Uses the OAuth2 for Apps Script library to request tagmanager.readonly scope.
- Calls GTM v2 API endpoints to list accounts, containers, workspaces, tags and variables.
- Generates/clears the target sheets and appends the data.
- exportAllContainers() runs the whole dump in one click.

## Setup

- Create an OAuth Client in Google Cloud Console, enable the Tag Manager API, and paste your CLIENT_ID / CLIENT_SECRET.
- Add the OAuth2 library (1B9V7YX9sp7VhSo5iH6uflP7OE4oB2cIr) to the project.
- un showSidebar() once, authorize, then run exportAllContainers().

## Note 

Only the first workspace per container is exported; extend listWorkspaceId() if you need others.
