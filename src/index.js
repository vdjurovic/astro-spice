import './style/spice.css'

import * as SpiceHtml5 from './spice/main.js';
import { library, dom } from "@fortawesome/fontawesome-svg-core";
import { faLink } from "@fortawesome/free-solid-svg-icons/faLink";
import { faUnlink } from "@fortawesome/free-solid-svg-icons/faUnlink";
import { faExpandArrowsAlt } from "@fortawesome/free-solid-svg-icons/faExpandArrowsAlt";
import { faCompressArrowsAlt } from "@fortawesome/free-solid-svg-icons/faCompressArrowsAlt";


library.add(faLink);
library.add(faUnlink);
library.add(faExpandArrowsAlt)
library.add(faCompressArrowsAlt)
dom.watch();

var host = null, port = null;
var sc;

function spice_set_cookie(name, value, days) {
    var date, expires;
    date = new Date();
    date.setTime(date.getTime() + (days*24*60*60*1000));
    expires = "; expires=" + date.toGMTString();
    document.cookie = name + "=" + value + expires + "; path=/";
};

function spice_query_var(name, defvalue) {
    var match = RegExp('[?&]' + name + '=([^&]*)')
                      .exec(window.location.search);
    return match ?
        decodeURIComponent(match[1].replace(/\+/g, ' '))
        : defvalue;
}

function spice_error(e)
{
    disconnect();
    if (e !== undefined && e.message === "Permission denied.") {
      var pass = prompt("Password");
      connect(pass);
    }
}

function connect(password)
{
    var host, port, scheme = "ws://", uri;
    console.log('connecting');

    // By default, use the host and port of server that served this file
    host = spice_query_var('host', window.location.hostname);

    // Note that using the web server port only makes sense
    //  if your web server has a reverse proxy to relay the WebSocket
    //  traffic to the correct destination port.
    var default_port = window.location.port;
    if (!default_port) {
        if (window.location.protocol == 'http:') {
            default_port = 80;
        }
        else if (window.location.protocol == 'https:') {
            default_port = 443;
        }
    }
    port = spice_query_var('port', default_port);
    var secure = spice_query_var('secure', false)
    if (window.location.protocol == 'https:' || secure) {
        scheme = "wss://";
    }

    // If a token variable is passed in, set the parameter in a cookie.
    // This is used by nova-spiceproxy.
    var token = spice_query_var('token', null);
    if (token) {
        spice_set_cookie('token', token, 1)
    }

    if (password === undefined) {
        password = spice_query_var('password', '');
    }
    var path = spice_query_var('path', null);

    if ((!host) || (!port)) {
        console.log("must specify host and port in URL");
        return;
    }

    if (sc) {
        sc.stop();
    }

    uri = scheme + host + ":" + port + '?host=' + host + '&token=' + token;

    if (path) {
      uri += path[0] == '/' ? path : ('/' + path);
    }
    console.log('uri: ' + uri);

    try
    {
        // show loader
        var loader = document.getElementById('loader-container');
        loader.style.display = 'flex';
        sc = new SpiceHtml5.SpiceMainConn({uri: uri, screen_id: "spice-screen", dump_id: "debug-div",
                    message_id: null, password: password, onerror: spice_error, onagent: agent_connected, onsuccess: success });
        var node = document.getElementById('connect-toggle').childNodes[0];
        node.classList.remove('fa-link');
        node.classList.add('fa-unlink');
        node.title = "Disconnect";
        // show SPICE screen
        var screen = document.getElementById('spice-screen');
        screen.style.display = 'block';
        var splash = document.getElementById('splash');
        splash.style.display = 'none';
    }
    catch (e)
    {
        alert(e.toString());
        disconnect();
    }

}

function disconnect()
{
    console.log(">> disconnect");
    if (sc) {
        sc.stop();
    }
    if (window.File && window.FileReader && window.FileList && window.Blob)
    {
        var spice_xfer_area = document.getElementById('spice-xfer-area');
        if (spice_xfer_area != null) {
          document.getElementById('spice-area').removeChild(spice_xfer_area);
        }
        document.getElementById('spice-area').removeEventListener('dragover', SpiceHtml5.handle_file_dragover, false);
        document.getElementById('spice-area').removeEventListener('drop', SpiceHtml5.handle_file_drop, false);
    }
    sc = null;
    var node = document.getElementById('connect-toggle').childNodes[0];
    node.classList.remove('fa-unlink');
    node.classList.add('fa-link');
    node.title = "Connect";
    console.log("<< disconnect");
    // show SPICE screen
    var screen = document.getElementById('spice-screen');
    screen.style.display = 'none';
    var splash = document.getElementById('splash');
    splash.style.display = 'flex';
    // hide spinner
    var loader = document.getElementById('loader-container');
    loader.style.display = 'none';
}

function agent_connected(sc)
{
    window.addEventListener('resize', SpiceHtml5.handle_resize);
    window.spice_connection = this;

    SpiceHtml5.resize_helper(this);

    if (window.File && window.FileReader && window.FileList && window.Blob)
    {
        var spice_xfer_area = document.createElement("div");
        spice_xfer_area.setAttribute('id', 'spice-xfer-area');
        document.getElementById('spice-area').appendChild(spice_xfer_area);
        document.getElementById('spice-area').addEventListener('dragover', SpiceHtml5.handle_file_dragover, false);
        document.getElementById('spice-area').addEventListener('drop', SpiceHtml5.handle_file_drop, false);
    }
    else
    {
        console.log("File API is not supported");
    }
    console.log("agent connected");
    var loader = document.getElementById('loader-container');
    loader.style.display = 'none';
}

function success() {
    console.log("On success");
    var loader = document.getElementById('loader-container');
    loader.style.display = 'none';
}


/* SPICE port event listeners
window.addEventListener('spice-port-data', function(event) {
    // Here we convert data to text, but really we can obtain binary data also
    var msg_text = arraybuffer_to_str(new Uint8Array(event.detail.data));
    DEBUG > 0 && console.log('SPICE port', event.detail.channel.portName, 'message text:', msg_text);
});

window.addEventListener('spice-port-event', function(event) {
    DEBUG > 0 && console.log('SPICE port', event.detail.channel.portName, 'event data:', event.detail.spiceEvent);
});
*/

function show_debug_Logs() {
    var content = document.getElementById('message-div')
    if (content.style.display === 'block') {
        content.style.display = 'none';
    } else {
        content.style.display = 'block';
    }
}

function toggleFullscreen() {
    var node = document.getElementById('fullscreen-toggle').childNodes[0];
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        node.classList.remove('fa-expand-arrows-alt');
        node.classList.add('fa-compress-arrows-alt');
        node.title = "Exit Fullscreen";
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen(); 
        node.classList.remove('fa-compress-arrows-alt');
        node.classList.add('fa-expand-arrows-alt');
        node.title = "Fullscreen";
      }
    }
}

function toggleConnection() {
    if(sc) {
        disconnect();
    } else {
        connect(undefined)
    }
}



//document.getElementById('sendCtrlAltDel').addEventListener('click', function(){ SpiceHtml5.sendCtrlAltDel(sc); });
//document.getElementById('debugLogs').addEventListener('click', function() { show_debug_Logs(); });
document.getElementById('connect-toggle').addEventListener('click', function() { toggleConnection(); } );
document.getElementById('fullscreen-toggle').addEventListener('click', function() { toggleFullscreen(); } );

connect(undefined);
