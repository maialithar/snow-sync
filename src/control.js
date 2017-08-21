var vscode = require('vscode');
var status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
var status_active_instance = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);

function start(){
    status.hide();
    status.color = 'yellow';
    status.text = '$(check) SNOW Sync is active!';
    status.show();

    set_status_instance_message();
}

function set_status_message(message){
    status.hide();
    status.text = message;
    status.show();

    set_status_instance_message();
}

function set_status_instance_message(){
    let active_instance = require('./settings.js').get_active_instance();
    status_active_instance.hide();
    if (active_instance !== undefined) {
        status_active_instance.color = 'green';
        status_active_instance.text = '$(cloud-upload) Connected to instance: ' + active_instance;
    } else {
        status_active_instance.color = 'red';
        status_active_instance.text = '$(x) No active instance chosen!';
    }
    status_active_instance.command = 'snow_sync.settings.set_active_instance';
    status_active_instance.show();
}

exports.start = start;
exports.set_status_message = set_status_message;
exports.set_status_instance_message = set_status_instance_message;