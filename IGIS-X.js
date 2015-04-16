dojo.require("esri.map");
dojo.require("esri.toolbars.draw");
dojo.require("esri.tasks.query");

// global variables
var map, defaultSymbol, highlightSymbol, resultTemplate, myResultTemplate;

function init() {
	// create map, set initial extent and disable default info window
	// behavior
	map = new esri.Map("map", {
		basemap : "streets",
		center : [ -120.275, 47.485 ],
		zoom : 6,
		slider : false,
		showInfoWindowOnClick : false
	});
	dojo.connect(map, "onLoad", initToolbar);

	// initialize symbology
	defaultSymbol = new esri.symbol.SimpleMarkerSymbol()
			.setColor(new dojo.Color([ 0, 0, 255 ]));
	highlightSymbol = new esri.symbol.SimpleMarkerSymbol()
			.setColor(new dojo.Color([ 255, 0, 0 ]));

	// initialize & execute query
	var queryTask = new esri.tasks.QueryTask(
			"http://sampleserver1.arcgisonline.com/ArcGIS/rest/services/Specialty/ESRI_StatesCitiesRivers_USA/MapServer/0");
	var query = new esri.tasks.Query();
	query.where = "STATE_NAME = 'Washington'";
	query.outSpatialReference = {
		wkid : 102100
	};
	query.returnGeometry = true;
	query.outFields = [ "FID", "CITY_NAME", "POP1990", "STATE_NAME" ];
	queryTask.execute(query, addPointsToMap);

	// info template for points returned
	resultTemplate = new esri.InfoTemplate("City",
			"<tr><td>${CITY_NAME}</tr></td>");

	myResultTemplate = new esri.InfoTemplate("Attributes", "${FID}");

	sessionInitParameters();
}

// initialize drawing toolbar
function initToolbar(map) {
	var tb = new esri.toolbars.Draw(map);

	// find points in Extent when user completes drawing extent
	dojo.connect(tb, "onDrawEnd", findPointsInExtent);

	// set drawing mode to extent
	tb.activate(esri.toolbars.Draw.EXTENT);
}

// add points to map and set their symbology + info template
function addPointsToMap(featureSet) {
	dojo.forEach(featureSet.features, function(feature) {
		map.graphics.add(feature.setSymbol(defaultSymbol).setInfoTemplate(
				myResultTemplate));
	});
}

function humanReadableTimeStamp() {
	var now = new Date();
	var date = [ now.getDate(), now.getMonth() + 1, now.getFullYear() ];
	var time = [ now.getSeconds(), now.getMinutes(), now.getHours() ];

	// Determine AM or PM suffix based on the hour
	var suffix = (time[2] < 12) ? "AM" : "PM";
	// Convert hour from military time
	time[0] = (time[2] < 12) ? time[0] : time[0] - 12;
	// If hour is 0, set it to 12
	time[0] = time[2] || 12;
	// If seconds and minutes are less than 10, add a zero
	for (var i = 0; i < 2; i++) {
		if (time[i] < 10) {
			time[i] = "0" + time[i];
		}
	}
	// If days and months are less than 10, add a zero
	for (var i = 0; i < 2; i++) {
		if (date[i] < 10) {
			date[i] = "0" + date[i];
		}
	}
	// goal: 2015-03-16 09:52:09
	// return the formatted string
	return date[2] + "-" + date[1] + "-" + date[0] + " " + time[2] + ":"
			+ time[1] + ":" + time[0];
}

function post(userSelection) {
	$.ajax({
		type : 'post',
		url : 'IGIS-X.php',
		data : {
			"userSelection" : JSON.stringify(userSelection)
		}
	});
}

function sessionInitParameters() {
	// sessionStorage.clear();
	// normally get this from the url
	var user_id = "5719", src_id = "1", active_guid = "indigo";

	sessionStorage.setItem('user_id', user_id);
	sessionStorage.setItem('src_id', src_id);
	sessionStorage.setItem('active_guid', active_guid);
}

function sessionIncNumSelections() {
	if (sessionStorage.getItem('numSelections')) {
		sessionStorage.setItem('numSelections', Number(sessionStorage
				.getItem('numSelections')) + 1);
	} else {
		sessionStorage.setItem('numSelections', 1);
	}
	return sessionStorage.getItem('numSelections');
}

// find all points within argument extent
function findPointsInExtent(extent) {
	var userSelection = {};

	userSelection.user_id = sessionStorage.getItem('user_id');
	userSelection.src_id = sessionStorage.getItem('src_id');
	userSelection.active_guid = sessionStorage.getItem('active_guid');
	userSelection.objects = [];

	dojo.forEach(map.graphics.graphics, function(graphic) {
		if (extent.contains(graphic.geometry)) {
			graphic.setSymbol(highlightSymbol);
			userSelection.objects.push(graphic.getContent());
		}
		// else if point was previously highlighted, reset its symbology
		else if (graphic.symbol == highlightSymbol) {
			graphic.setSymbol(defaultSymbol);
		}
	});

	// increase selection counter
	var numSelections = sessionIncNumSelections();

	if (numSelections > 1) {
		userSelection.actionType = 2;
		userSelection.timestamp = sessionStorage.getItem('timestamp');
	} else {
		// this is the first selection in the session
		userSelection.actionType = 1;
		// generate timestamp of this user session
		var timestamp = humanReadableTimeStamp();
		// var timestamp = new Date();
		sessionStorage.setItem('timestamp', timestamp);
		userSelection.timestamp = timestamp;
	}

	// save last user selection
	sessionStorage.setItem('objects', userSelection.objects);

	// display number of points in extent
	dojo.byId("inextent").innerHTML = userSelection.objects.length;
	dojo.byId("results").innerHTML = JSON.stringify(userSelection);
	// dojo.byId("results").innerHTML = JSON.stringify(sessionStorage);

	post(userSelection);
}

dojo.addOnLoad(init);