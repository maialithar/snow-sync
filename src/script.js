var settings = require('./settings.js');
var connection = require('./connection.js');
var control = require('./control.js');
var vscode = require('vscode');
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var nconf = require('nconf');
var global_conf_file = 'globals.conf';
var script_config = '';

const instance = settings.get('instance');
const script_dir = settings.get('root project directory');

function show_script_type_picker(){
    vscode.window.showQuickPick(connection.get_script_types()).then(script_type => show_script_picker(script_type));
}

function show_script_picker(type, fields = 'name,sys_id') {
    if (type === undefined){
        vscode.window.showInformationMessage('No script type chosen.');
        return;
    }
    var promise_all_scripts = '';

    control.set_status_message('$(radio-tower) Loading all scripts from ' + type + ' table...');
    if (type == 'Business Rule' || type == 'Client Script'){
        vscode.window.showInputBox({
            prompt: 'Enter name of the table for which you would like to see chosen scripts.'
        }).then((table_name) => {
            promise_all_scripts = connection.get_all_scripts(type, table_name, fields);
        });
    } else {
        promise_all_scripts = connection.get_all_scripts(type, undefined, fields);
    }

    promise_all_scripts
        .then((res_json) => {
            var script_names = res_json.result.map((single_script) => { return single_script.name;});
            var script_names_sysids = {};

            res_json.result.forEach((single_script) => {
                script_names_sysids[single_script.name] = single_script.sys_id;
            }, this);

            control.set_status_message('$(thumbsup) ' + script_names.length + ' scripts loaded.');
            vscode.window.showQuickPick(script_names)
                .then(chosen_script => load_script(type, chosen_script, script_names_sysids[chosen_script]));
        })
        .catch((rejected_reason) => {
            control.set_status_message('$(alert) Failed to load all scripts!');
            vscode.window.showErrorMessage('Couldn\'t get all scripts: ' + rejected_reason);  
        });
}

function load_script(type, name, sys_id){
    if (name === undefined){
        vscode.window.showInformationMessage('No script chosen.');
        return;
    }
    
    var editor = vscode.window.activeTextEditor;
    var script_directory = script_dir + path.sep + instance + path.sep + type;
    var file_name = script_directory + path.sep + name.replace(/\s/g, '_').toLowerCase() + '.snow_sync.js';

    if (!editor) return;

    control.set_status_message('$(radio-tower) Loading ' + type + ': ' + name + '...');
    mkdirp.sync(script_directory);
    nconf.file('script', script_directory + path.sep + global_conf_file);
    script_config = nconf.stores.script;
    if (script_config.get().length === undefined){
        script_config.set('table', connection.get_script_table(type));
        script_config.set('script_field', 'script');
        script_config.set('fields_to_load_for_conf', (vscode.workspace.getConfiguration('snow_sync').get(type.toLowerCase().replace(/\s/g, '_') + '_fields')) || 'name');
        script_config.save();
    }

    connection.get_one_script(type, name, sys_id)
        .then((res_json) => {
            control.set_status_message('$(thumbsup) Script loaded.');
            if (res_json.result.length > 0){
                fs.writeFile(file_name, res_json.result[0].script, 'utf8', (err) => {
                    if (err) {
                        vscode.window.showErrorMessage('I can\'t write a script file!');
                        return;
                    }
                    vscode.workspace.openTextDocument(file_name).then((doc) => {
                        vscode.window.showTextDocument(doc);
                        vscode.workspace.onWillSaveTextDocument((event) => {
                            if (vscode.window.activeTextEditor.document.fileName.endsWith('.snow_sync.js')){
                                connection.put_script(type, sys_id, vscode.window.activeTextEditor.document.getText())
                                    .then(() => {
                                        vscode.window.showInformationMessage('Script succesfully updated on server.');
                                        control.set_status_message('$(thumbsup) Script updated on instance.');
                                    })
                                    .catch((rejected_reason) => {
                                        vscode.window.showErrorMessage('Problem with request: ' + rejected_reason);
                                        control.set_status_message('$(alert) Failed to update script on instance!');
                                    });
                            }
                        });
                    });
                });
                var fields_to_load = script_config.get('fields_to_load_for_conf');
                connection.get_script_config(type, name, sys_id, fields_to_load)
                    .then((res_json) => {
                        console.log(res_json);
                    })
                    .catch((rejected_reason) => {
                        console.log(rejected_reason);
                    });
            } else {

            }
        })
        .catch((rejected_reason) => {
            vscode.window.showErrorMessage('Couldn\'t get single script: ' + rejected_reason);  
            control.set_status_message('$(alert) Failed to load script!');
        });
}

exports.show_script_type_picker = show_script_type_picker;