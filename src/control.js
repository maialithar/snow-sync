var vscode = require('vscode');
var status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);

function start(){
    status.hide();
    status.color = 'yellow';
    status.text = '$(check) SNOW Sync is active!';
    status.show();
}

function set_status_message(message){
    status.hide();
    status.text = message;
    status.show();
}

exports.start = start;
exports.set_status_message = set_status_message;