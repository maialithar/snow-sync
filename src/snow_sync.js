var vscode = require('vscode');

function activate(context) {
    var settings_comm = vscode.commands.registerCommand('snow_sync.settings.show_settings', () => require('./settings.js').show_settings());
    var connection_comm = vscode.commands.registerCommand('snow_sync.script.get_script', () => require('./script.js').show_script_type_picker());
    var start_comm = vscode.commands.registerCommand('snow_sync.control.start', () => require('./control.js').start());

    context.subscriptions.push(settings_comm);
    context.subscriptions.push(connection_comm);
    context.subscriptions.push(start_comm);
}

function deactivate() {}

exports.activate = activate;
exports.deactivate = deactivate;