var vscode = require('vscode');
var nconf = require('nconf');
var path = require('path');

function activate(context) {
    var settings_comm = vscode.commands.registerCommand('snow_sync.settings.show_settings', () => require('./settings.js').show_settings());
    var connection_comm = vscode.commands.registerCommand('snow_sync.script.get_script', () => require('./script.js').show_script_type_picker());
    var start_comm = vscode.commands.registerCommand('snow_sync.control.start', () => require('./control.js').start());

    context.subscriptions.push(settings_comm);
    context.subscriptions.push(connection_comm);
    context.subscriptions.push(start_comm);

    vscode.workspace.onWillSaveTextDocument((event) => {
        if (vscode.window.activeTextEditor.document.fileName.endsWith('.snow_sync.js')){
            var active_script_conf = '';
            var global_script_conf = '';
            var current_path = vscode.window.activeTextEditor.document.fileName;

            nconf.file('active_script', current_path.replace('.snow_sync.js', '.snow_sync.json'));
            active_script_conf = nconf.stores.active_script;
            nconf.file('script', current_path.substring(0, current_path.lastIndexOf(path.sep) + 1) + 'globals.conf');
            global_script_conf = nconf.stores.script;
            require('./connection.js').put_script(global_script_conf.get('table'), active_script_conf.get('sys_id'), vscode.window.activeTextEditor.document.getText())
                .then(() => {
                    vscode.window.showInformationMessage('Script succesfully updated on server.');
                    require('./control.js').set_status_message('$(thumbsup) Script updated on instance.');
                })
                .catch((rejected_reason) => {
                    vscode.window.showErrorMessage('Problem with request: ' + rejected_reason);
                    require('./control.js').set_status_message('$(alert) Failed to update script on instance!');
                });
        }
        if (vscode.window.activeTextEditor.document.fileName.endsWith('.snow_sync.json')){

        }
    });
    
    require('./control.js').start();
}

function deactivate() {}

exports.activate = activate;
exports.deactivate = deactivate;