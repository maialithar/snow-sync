var vscode = require('vscode');
var nconf = require('nconf');
var path = require('path');

function activate(context) {
    var settings_comm = vscode.commands.registerCommand('snow_sync.settings.show_settings', () => require('./settings.js').show_settings());
    var set_active_instance_comm = vscode.commands.registerCommand('snow_sync.settings.set_active_instance', () => require('./settings.js').set_active_instance());
    var remove_instance_comm = vscode.commands.registerCommand('snow_sync.settings.remove_instance', () => require('./settings.js').remove_instance());
    var get_script_comm = vscode.commands.registerCommand('snow_sync.script.get_script', () => require('./script.js').show_script_type_picker());
    var new_script_comm = vscode.commands.registerCommand('snow_sync.script.new_script', () => require('./script.js').show_script_type_picker(true));
    var stats_comm = vscode.commands.registerCommand('snow_sync.statistics.get', () => require('./statistics.js').get_statistics());
    var cache_comm = vscode.commands.registerCommand('snow_sync.cache.clear', () => require('./cache.js').clear_cache());

    context.subscriptions.push(settings_comm);
    context.subscriptions.push(set_active_instance_comm);
    context.subscriptions.push(remove_instance_comm);
    context.subscriptions.push(get_script_comm);
    context.subscriptions.push(new_script_comm);
    context.subscriptions.push(stats_comm);
    context.subscriptions.push(cache_comm);

    vscode.workspace.onWillSaveTextDocument(() => {
        var active_script_conf = '';
        var global_script_conf = '';
        var current_path = vscode.window.activeTextEditor.document.fileName;

        nconf.file('active_script', current_path.substring(0, current_path.lastIndexOf('.') + 1) + 'json');
        active_script_conf = nconf.stores.active_script;
        nconf.file('script', current_path.substring(0, current_path.lastIndexOf(path.sep) + 1) + 'globals.conf');
        global_script_conf = nconf.stores.script;

        if (current_path.endsWith('.snow_sync.js')){
            require('./connection.js').patch(global_script_conf.get('table'), active_script_conf.get('sys_id'), vscode.window.activeTextEditor.document.getText(), true)
                .then(() => {
                    vscode.window.showInformationMessage('Script succesfully updated on server.');
                    require('./control.js').set_status_message('$(thumbsup) Script updated on instance.');
                })
                .catch((rejected_reason) => {
                    vscode.window.showErrorMessage('Problem with request: ' + rejected_reason);
                    require('./control.js').set_status_message('$(alert) Failed to update script on instance!');
                });
        }
        if (current_path.endsWith('.snow_sync.json')){
            require('./connection.js').patch(global_script_conf.get('table'), active_script_conf.get('sys_id'), vscode.window.activeTextEditor.document.getText())
                .then(() => {
                    vscode.window.showInformationMessage('Configuration succesfully updated on server.');
                    require('./control.js').set_status_message('$(thumbsup) Configuration updated on instance.');
                })
                .catch((rejected_reason) => {
                    vscode.window.showErrorMessage('Problem with request: ' + rejected_reason);
                    require('./control.js').set_status_message('$(alert) Failed to update configuration on instance!');
                });
        }
    });
    
    require('./control.js').start();
}

function deactivate() {}

exports.activate = activate;
exports.deactivate = deactivate;