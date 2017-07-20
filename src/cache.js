var vscode = require('vscode');
var fs = require('fs');
var settings = require('./settings.js');
var path = require('path');

function clear_cache(){
    require('./control.js').set_status_message('$(radio-tower) Clearing cache on instance...');
    require('./connection.js').get('/cache.do')
        .then((response) => {
            var file_name = settings.get('root project directory') + path.sep + settings.get('instance') + path.sep + 'cache.html';
            require('./control.js').set_status_message('$(fold) Saving response to file...');
            fs.writeFile(file_name, response, 'utf8', (err) =>{
                if (err) {
                    vscode.window.showErrorMessage('I can\'t write a statistics file!');
                    return;
                }

                require('./control.js').set_status_message('$(device-camera-video) Previewing response...');
                let uri = vscode.Uri.parse('file:///' + file_name);
                vscode.commands.executeCommand('vscode.previewHtml', uri);
            });
        })
        .catch((rejected_reason) => {
            console.log(rejected_reason);
        });
}

exports.clear_cache = clear_cache;