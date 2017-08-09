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
        if (settings_conf.get(active_instance + ':' + settings_ROOT_DIR) && settings_conf.get(active_instance + ':' + settings_INSTANCE) && setting == settings_INSTANCE){
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
                if (chosen_instance != undefined || chosen_instance != '')
                    active_instance = chosen_instance;
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
            //show_settings();
        });
}

exports.show_settings = show_settings;
exports.get = get;
exports.set_active_instance = set_active_instance;