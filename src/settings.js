const settings_ROOT_DIR = 'root project directory';
const settings_INSTANCE = 'instance';
const settings_USERNAME = 'username';
const settings_PASSWORD = 'password';

var vscode = require('vscode');
var nconf = require('nconf');
var path = require('path');
var mkdirp = require('mkdirp');
var fs = require('fs');
var settings_path = require('os').homedir() + path.sep + '.snow_sync';
var settings_file = 'settings.conf';

function load_settings(cb = null){
    fs.stat(settings_path, (err) => {
        if (err)
            mkdirp(settings_path, (err2) => {
                if (err2)
                    vscode.window.showErrorMessage('Cannot create settings directory, please check permissions to your home dir!');
            });
        nconf.file(settings_path + path.sep + settings_file);
        if (cb) cb();
    });
}

function show_settings(){
    load_settings(() => {
        vscode.window.showQuickPick([settings_INSTANCE, settings_USERNAME, settings_PASSWORD, settings_ROOT_DIR])
            .then(chosen_val => save_new_setting(chosen_val));
    });  
}

function save_new_setting(setting){
    if (setting === undefined){
        vscode.window.showInformationMessage('No changes saved.');
        return;
    }
    vscode.window.showInputBox({
        prompt: 'Enter new value for "' + setting + '" configuration item.',
        value: nconf.get(setting)
    }).then((new_value) => {
        if (new_value === undefined || new_value == ''){
            vscode.window.showInformationMessage('No new value for "' + setting + '" configuration item provided, nothing saved.');
            return;
        }

        nconf.set(setting, new_value);
        nconf.save();

        if (nconf.get(settings_ROOT_DIR) && nconf.get(settings_INSTANCE) && setting == settings_INSTANCE){
            fs.stat(nconf.get(settings_ROOT_DIR) + path.sep + nconf.get(settings_INSTANCE), (err) => {
                if (err)
                    mkdirp(nconf.get(settings_ROOT_DIR) + path.sep + nconf.get(settings_INSTANCE), (err2) => {
                        if (err2)
                            vscode.window.showErrorMessage('Cannot create project directory, please check permissions to your root project dir!');
                    });
            });
        }
    });
}

function get(what){
    load_settings();
    if (nconf.get() === undefined) 
        nconf.file(settings_path + path.sep + settings_file);
    return nconf.get(what);
}

exports.show_settings = show_settings;
exports.get = get;