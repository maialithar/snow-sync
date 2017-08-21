const settings_ROOT_DIR = 'root project directory';
const settings_INSTANCE = 'instance';
const settings_USERNAME = 'username';
const settings_PASSWORD = 'password';
const settings_FRIENDLY = 'friendly name';

var vscode = require('vscode');
var nconf = require('nconf');
var path = require('path');
var mkdirp = require('mkdirp');
var fs = require('fs');
var settings_path = require('os').homedir() + path.sep + '.snow_sync';
var settings_file = 'settings.conf';
var settings_conf = nconf.stores.settings;
var active_instance = undefined;

function load_settings(cb = null){
    fs.stat(settings_path, (err) => {
        if (err)
            mkdirp(settings_path, (err2) => {
                if (err2)
                    vscode.window.showErrorMessage('Cannot create settings directory, please check permissions to your home dir!');
            });
        nconf.file('settings', settings_path + path.sep + settings_file);
        settings_conf = nconf.stores.settings;
        if (cb) cb();
    });
}

function show_settings(){
    if (active_instance === undefined){
        vscode.window.showErrorMessage('No active instance chosen, can\'t save settings!');
        return;
    }
    load_settings(() => {
        vscode.window.showQuickPick([settings_INSTANCE, settings_USERNAME, settings_PASSWORD, settings_ROOT_DIR, settings_FRIENDLY])
            .then(chosen_val => save_new_setting(chosen_val));
    });  
}

function save_new_setting(setting, val = null){
    if (setting === undefined){
        vscode.window.showInformationMessage('No changes saved.');
        return;
    }
    if (!val)
        vscode.window.showInputBox({
            prompt: 'Enter new value for "' + setting + '" configuration item.',
            value: val || settings_conf.get(active_instance + ':' + setting)
        }).then((new_value) => {
            save_new_val(new_value);
        });
    else 
        save_new_val(val);

    function save_new_val(val) {
        if (val === undefined || val == ''){
            vscode.window.showInformationMessage('No new value for "' + setting + '" configuration item provided, nothing saved.');
            return;
        }

        if (setting == settings_INSTANCE){
            val = val.split('.')[0];
            if (val.startsWith('http'))
                val = val.substring(val.indexOf('://') + 3);
        }
        settings_conf.set(active_instance + ':' + setting, val);
        settings_conf.save();

        // create instance directory
        if (settings_conf.get(active_instance + ':' + settings_ROOT_DIR) && settings_conf.get(active_instance + ':' + settings_INSTANCE) && (setting == settings_INSTANCE || setting == settings_ROOT_DIR)){
            fs.stat(settings_conf.get(active_instance + ':' + settings_ROOT_DIR) + path.sep + settings_conf.get(active_instance + ':' + settings_INSTANCE), (err) => {
                if (err)
                    mkdirp(settings_conf.get(active_instance + ':' + settings_ROOT_DIR) + path.sep + settings_conf.get(active_instance + ':' + settings_INSTANCE), (err2) => {
                        if (err2)
                            vscode.window.showErrorMessage('Cannot create project directory, please check permissions to your root project dir!');
                    });
            });
        }
    }
}

function get(what){
    if (active_instance === undefined){
        vscode.window.showErrorMessage('No active instance chosen, can\'t get settings!');
        return;
    }
    load_settings();
    if (settings_conf === undefined){
        nconf.file('settings', settings_path + path.sep + settings_file);
        settings_conf = nconf.stores.settings;
    }
    return settings_conf.get(active_instance + ':' + what);
}

function set_active_instance(){
    load_settings(() => {
        let available_instances = Object.keys(settings_conf.get());
        available_instances.push('Add new instance');
        vscode.window.showQuickPick(available_instances)
            .then((chosen_instance) => {
                if (chosen_instance === 'Add new instance')
                    add_new_instance();
                else if (chosen_instance != undefined || chosen_instance != ''){
                    active_instance = chosen_instance;
                    vscode.window.showInformationMessage('Selected ' + chosen_instance + ' as active instance.');
                    require('./control.js').set_status_instance_message();
                }
            });
    });
}

function add_new_instance(){
    vscode.window.showInputBox({prompt: 'Enter friendly name for new instance'})
        .then((new_name) => {
            if (new_name === undefined || new_name == '')
                return;
            active_instance = new_name;
            save_new_setting(settings_FRIENDLY, new_name);
            vscode.window.showInformationMessage('New instance added: ' + new_name);
        });
}

function remove_instance(){
    load_settings(() => {
        let available_instances = Object.keys(settings_conf.get());
        vscode.window.showQuickPick(available_instances)
            .then((chosen_instance) => {
                if (chosen_instance != undefined || chosen_instance != ''){
                    vscode.window.showWarningMessage('When you remove an instance, whole directory structure (incl. scripts) will be removed from its root folder - proceed?', ...['Go on', 'Forfeit'])
                        .then((option) => {
                            if (option == 'Forfeit'){
                                return;
                            }
                            if (option == 'Go on') {
                                if (active_instance == chosen_instance){
                                    active_instance = undefined;
                                    vscode.window.showInformationMessage('Removed active instance, it is now set to `undefined`.');
                                }
                                (require('rimraf'))(settings_conf.get(chosen_instance + ':' + settings_ROOT_DIR) + path.sep + settings_conf.get(chosen_instance + ':' + settings_INSTANCE), function(){
                                    vscode.window.showInformationMessage('Directory structure and all scripts from instance "' + chosen_instance + '" removed.');
                                });
                                settings_conf.store[chosen_instance] = null;
                                delete settings_conf.store[chosen_instance];
                                settings_conf.save();
                            }
                        });
                }
            });
    });
}

function get_active_instance(){
    return active_instance;
}

exports.show_settings = show_settings;
exports.get = get;
exports.set_active_instance = set_active_instance;
exports.remove_instance = remove_instance;
exports.get_active_instance = get_active_instance;