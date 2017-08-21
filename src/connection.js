const script_table = {
    'Business Rule': 'sys_script',
    'Client Script': 'sys_script_client',
    'Script Include': 'sys_script_include',
    'Fix Script': 'sys_script_fix',
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
    'timeout': 5000,
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
    url = instance + '.service-now.com';
    options.hostname = url;
    options.auth = username + ':' + password;
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
            reject('Problem with request: ' + e.message);
        });

        req.end();
    });
}

function get_file(type, name, sys_id, fields) {
    return new Promise((resolve, reject) => {
        var res_string = '';
        var res_json = {};
        options.path = '/api/now/table/' + script_table[type] + '?sysparm_query=sys_id%3D' + sys_id + '&sysparm_fields=' + fields;
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
            reject('Problem with request: ' + e.message);
        });

        req.end();
    });
}

function patch(table, sys_id, data, is_script){
    return new Promise((resolve, reject) => {
        if (table === undefined || sys_id === undefined){
            reject('There is a problem with either table name or sys_id!');
        }
        if (is_script){
            data = {
                'script': data
            }
        }
        options.path = '/api/now/table/' + table + '/' + sys_id;
        options.method = 'PATCH';

        load_settings();
        var req = https.request(options);

        req.on('error', (e) => {
            reject('Problem with request: ' + e.message);
        });
        req.write(is_script ? JSON.stringify(data) : data);
        req.end();
        resolve();
    });
}

function get_script_types(){
    return Object.keys(script_table);
}

function get_script_table(type){
    return script_table[type];
}

function get(path){
    options.path = path;
    options.method = 'GET';

    load_settings();

    return new Promise((resolve, reject) => {
        var res_string = '';
        var req = https.request(options, (res) => {
            if (res.statusCode == '200' || res.statusCode == '302'){
                res.setEncoding('utf8');
                res.on('data', (chunk) => {
                    res_string += chunk;
                });
                res.on('end', () => {
                    resolve(res_string);
                });
            } else {
                reject('Problem with request: ' + res.statusCode + ': ' + res.statusMessage);
            }
        });

        req.on('error', (e) => {
            reject('Problem with request: ' + e.message);
        });

        req.end();
    });
}

function test_connection(){
    return new Promise((resolve, reject) => {
        options.method = 'GET';
        load_settings();
        if (instance !== undefined && instance != ''){
            var req = https.request(options, (res) => {
                if (res.statusCode == '200' || res.statusCode == '302'){
                    let res_data = '';
                    res.setEncoding('utf8');
                    res.on('data', (chunk) => {
                        res_data += chunk;
                    });
                    res.on('end', () => {
                        if (res_data.includes('Hibernating instance')){
                            reject('Looks like your instance is sleeping...');
                        } else {
                            resolve();
                        }
                    });
                } else {
                    reject('Problem with request: ' + res.statusCode + ' - ' + res.statusMessage);
                }
            });

            req.on('error', (e) => {
                reject('Problem with request: ' + e.message);
            });

            req.end();
        } else {
            reject('No settings loaded!');
        }
    });
}

exports.get_all_scripts = get_all_scripts;
exports.get_script_types = get_script_types;
exports.get_file = get_file;
exports.get_script_table = get_script_table;
exports.get = get;
exports.patch = patch;
exports.test_connection = test_connection;