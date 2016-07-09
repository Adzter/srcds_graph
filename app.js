var mysql = require('mysql');
var Gamedig = require('gamedig');
var schedule = require('node-schedule');
var config = require('./config.json');

var j = schedule.scheduleJob('*/5 * * * *', function() {

	Gamedig.query(
	    {
	        type: config.type,
	        host: config.ip
	    },
	    function(state) {
	        if(state.error) console.log("Server is offline")
	        else {
	        	var connection = mysql.createConnection({
				  host     : config.mysql_host,
				  user     : config.mysql_user,
				  password : config.mysql_pass,
				  database : config.mysql_db
				});

	        	var name = connection.escape( state.name );
	        	var players = state.players.length;

	        	connection.connect();

				connection.query('INSERT INTO stats (server_name, server_player_count ) VALUES(' + name + ',' + players + ') ',
				function(err, rows, fields) {	if (err) throw err;		});

				connection.query('SELECT * FROM stats WHERE DATE(server_timestamp) = CURDATE()', function(err, rows, fields) {
					if (err) throw err;

					var plotData = {};

					var day;

					for(var i in rows){
						var entry = rows[i];

						var count = entry.server_player_count;
						var time = entry.server_timestamp;

						time = new Date( time );
						day = time.getFullYear() + "-" + time.getMonth() + "-" + time.getDate();

						// Convert to UNIX time
						var fullTime = time.getTime() / 1000;

						plotData[fullTime] = count;
					}

					var plot = require('plotter').plot;
					var save = config.save_location + day + '.png';

					plot({
						title: rows[0].server_name,
						xlabel: "Time",
						ylabel: "Player Count",
						nokey: true,
					    data:       { 'line' : plotData },
					    time: '%H:%M',
					    filename:   save
					});
				});

				connection.end();
	        }
	    }
	);
});
