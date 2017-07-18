# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2017-07-18
### Added
- New configuration options for `vscode`: `snow_sync.client_script_fields` and `snow_sync.fix_script_fields`
- When putting updates on servicenow instance, required configuration (table and sys_id) is read from config files - you can work on files without downloading them again. You still have to activate the plugin first though.
- README now has a demo gif

## [0.1.1] - 2017-07-14
### Added
- Another config file for every script type will be created/loaded upon script download. It will contain some basic information that you will be also able to upload soon in the future. That file will open in a new editor panel on the right side of the script.

### Fixed
- Finally fixed a problem with script not getting loaded. It should load every time

## [0.1.0] - 2017-07-13
- Initial release

### Added
- 3 commands for `Visual Studio Code`
  - `SNOW Sync: Start working`
  - `SNOW Sync: Show settings`
  - `SNOW Sync: Get script`
- `onWillSaveTextDocument` event that takes care of updating script from your disk to your instance
- For business rules and client scripts, you may give additional parameter - table name. If given, scripts for only that table will be loaded
- Status bar message shows script count