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

	myResultTemplate = new esri.InfoTemplate("Attributes", "${CITY_NAME}");
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

function post(userSelection) {
	$.ajax({
		type : 'post',
		url : 'IGIS-X.php',
		data : {
			"userSelection" : JSON.stringify(userSelection)
		}
	});
}

// find all points within argument extent
function findPointsInExtent(extent) {
	var results = [];
	var userSelection = {};

	results.push("5719"); // user_id
	results.push("indigo"); // active_guid

	userSelection.user_id = "5719";
	userSelection.active_guid = "indigo";
	userSelection.points = [];

	dojo.forEach(map.graphics.graphics, function(graphic) {
		if (extent.contains(graphic.geometry)) {
			graphic.setSymbol(highlightSymbol);
			results.push(graphic.getContent());
			userSelection.points.push(graphic.getContent());
		}
		// else if point was previously highlighted, reset its symbology
		else if (graphic.symbol == highlightSymbol) {
			graphic.setSymbol(defaultSymbol);
		}
	});

	// display number of points in extent
	dojo.byId("inextent").innerHTML = results.length;

	// display list of points in extent
	dojo.byId("results").innerHTML = "<table><tbody>" + results.join("")
			+ "</tbody></table>";

	dojo.byId("results2").innerHTML = JSON.stringify(results);

	post(userSelection);

}

dojo.addOnLoad(init);