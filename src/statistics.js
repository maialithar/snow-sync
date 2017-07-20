var vscode = require('vscode');
var fs = require('fs');
var settings = require('./settings.js');
var path = require('path');

function get_statistics(){
    require('./control.js').set_status_message('$(radio-tower) Getting statistics from instance...');
    require('./connection.js').get('/stats.do')
        .then((response) => {
            var file_name = settings.get('root project directory') + path.sep + settings.get('instance') + path.sep + 'statistics.html';
            require('./control.js').set_status_message('$(fold) Saving statistics to file...');
            fs.writeFile(file_name, response, 'utf8', (err) =>{
                if (err) {
                    vscode.window.showErrorMessage('I can\'t write a statistics file!');
                    return;
                }

                require('./control.js').set_status_message('$(device-camera-video) Previewing statistics...');
                let uri = vscode.Uri.parse('file:///' + file_name);
                vscode.commands.executeCommand('vscode.previewHtml', uri);
            });
        })
        .catch((rejected_reason) => {
            console.log(rejected_reason);
        });
}

exports.get_statistics = get_statistics;