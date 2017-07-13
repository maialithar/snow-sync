const script_table = {
    'Business Rule': 'sys_script',
    'Client Script': 'sys_script_client',
    'Script Include': 'sys_script_include',
    'Fix Script': 'sys_script_fix',
    'Validation Scipt': 'sys_script_validator',
    'Notification Email Scripts': 'sys_script_email',
    'UI Script': 'sys_ui_script'
}

var settings = require('./settings.js');
var https = require('https');
var username = settings.get('username');
var password = settings.get('password');
var instance = settings.get('instance');
var url = instance + '.service-now.com';
var options = {
    'auth': username + ':' + password,
    'protocol': 'https:',
    'hostname': url,
    'method': '',
    'path': '',
    'port': 443,
    'headers': {
        'Content-Type': 'application/json', 
        'Accept': 'application/json',
        'Connection': 'keep-alive'
    } 
};

function load_settings(){
    username = settings.get('username');
    password = settings.get('password');
    instance = settings.get('instance');
}

function get_all_scripts(type, table_name = undefined, fields = 'name,sys_id'){
    return new Promise((resolve, reject) => {
        
        var res_string = '';
        var res_json = {};

        options.path += '/api/now/table/' + script_table[type] + '?sysparm_fields=' + fields;
        options.method = 'GET';

        if (table_name && table_name !== undefined) {
            if (type == 'Business Rule')
                options.path += '&sysparm_query=collection%3D' + table_name;
            else
                options.path += '&sysparm_query=table%3D' + table_name;
        }

        load_settings();
        var req = https.request(options, (res) => {
            if (res.statusCode == '200'){
                res.setEncoding('utf8');
                res.on('data', (chunk) => {
                    res_string += chunk;
                });
                res.on('end', () => {
                    res_json = JSON.parse(res_string);
                    resolve(res_json);
                });
            }
        });

        req.on('error', (e) => {
            console.error(`Problem with request: ${e.message}`);
            reject(e.message);
        });

        req.end();
    });
}

function get_one_script(type, name, sys_id){
    return new Promise((resolve, reject) => {
        var res_string = '';
        var res_json = {};
        options.path = '/api/now/table/' + script_table[type] + '?sysparm_query=sys_id%3D' + sys_id + '&sysparm_fields=script';
        options.method = 'GET';

        load_settings();
        var req = https.request(options, (res) => {
            if (res.statusCode == '200'){
                res.setEncoding('utf8');
                res.on('data', (chunk) => {
                    res_string += chunk;
                });
                res.on('end', () => {
                    res_json = JSON.parse(res_string);
                    resolve(res_json);
                });
            }
        });

        req.on('error', (e) => {
            console.error(`Problem with request: ${e.message}`);
            reject(e.message);
        });

        req.end();
    });
};

function put_script(type, sys_id, script){
    return new Promise((resolve, reject) => {
        var put_me = {
            'script': script
        }
        options.path = '/api/now/table/' + script_table[type] + '/' + sys_id;
        options.method = 'PUT';

        load_settings();
        var req = https.request(options);

        req.on('error', (e) => {
            reject(e.message);
        });
        req.write(JSON.stringify(put_me));
        req.end();
        resolve();
    });
}

function get_script_types(){
    return Object.keys(script_table);
}

exports.get_all_scripts = get_all_scripts;
exports.get_one_script = get_one_script;
exports.put_script = put_script;
exports.get_script_types = get_script_types;