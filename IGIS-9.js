/*
 * IGIS-9 die Suchresultate der Indigo-Standortsuche im GIS sehen (Ptyp)
 * IGIS-144 - vom Indigo GIS aus im Indigo GUI die Detailansicht zu einem Standort �ffnen (analog Indigo Detail-Knopf) (Ptyp)
 * IGIS-145 - für Standorte mit Mouseover die relevantesten Kennzahlen sehen (Ptyp)
 */

var map;

require(
		[ "esri/urlUtils", "esri/map", "esri/layers/FeatureLayer",
				"esri/tasks/query", "esri/tasks/QueryTask",
				"esri/geometry/Geometry", "esri/geometry/Circle",
				"esri/graphic", "esri/InfoTemplate", "esri/dijit/Popup",
				"esri/dijit/PopupTemplate", "esri/symbols/SimpleMarkerSymbol",
				"esri/symbols/SimpleLineSymbol",
				"esri/symbols/SimpleFillSymbol",
				"esri/renderers/SimpleRenderer", "esri/geometry/Extent",
				"esri/dijit/Search", "esri/dijit/BasemapGallery", "esri/units"

				, "esri/config"

				, "dijit/TooltipDialog", "esri/lang", "dojo/dom-style",
				"dijit/popup", "esri/Color", "esri/geometry/Point"

				, "esri/arcgis/utils"

				, "dojo/parser", "dojo/dom", "dojo/dom-construct", "dojo/on"

				, "dojo/dom-class"

				, "dijit/layout/BorderContainer", "dijit/layout/ContentPane",
				"dijit/TitlePane", "dojo/domReady!"

		],
		function(urlUtils, Map, FeatureLayer, Query, QueryTask, Geometry,
				Circle, Graphic, InfoTemplate, Popup, PopupTemplate,
				SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol,
				SimpleRenderer, Extent, Search, BasemapGallery, Units,
				esriConfig, TooltipDialog, esriLang, domStyle, dijitPopup,
				Color, Point, arcgisUtils, parser, dom, domConstruct, on,
				domClass

		) {
			'use strict';

			// create popup
			var fill = new SimpleFillSymbol("solid", null, new Color("#A4CE67"));
			var popup = new Popup({
				fillSymbol : fill,
				titleInBody : false,
				visibleWhenEmpty : false, // warum funktioniert das nicht? Ich
				// will eigentlich, dass ein leeres
				// Popup nicht gezeigt wird
				hideDelay : 0
			}, domConstruct.create("div"));

			var host = "http://sdshgweb01:9010"; // muss wahrscheinlich noch
			// irgendwie dynamisch
			// gesetzt werden, um
			// zwischen extern und
			// intern unterscheiden zu
			// k�nnen
			var infoDescription = "<b>STAT_CODE: </b>${STAT_CODE}<br>"
					+ "<b>STAT_ID: </b>{STAT_ID}<br>"
					+ "<b>STAT_NAME: </b>{STAT_NAME}<br>"
					+ "<b>IS_GSM: </b>{IS_GSM}<br>"
					+ "<b>IS_DCS: </b>{IS_DCS}<br>"
					+ "<b>IS_UMTS: </b>{IS_UMTS}<br>"
					+ "<b>IS_LTE: </b>{IS_LTE}<br>"
					+ "<b>IS_OUTD: </b>{IS_OUTD}<br>"
					+ "<b>IS_INHOUS: </b>{IS_INHOUS}<br>"
					+ "<b>IS_TUNNEL: </b>{IS_TUNNEL}<br>"
					+ "<a href= '"
					+ host
					+ "/Indigo/Station/Detail/{STAT_ID}' target='_blank'>Link auf Indigo Details</a><br>"
			var template = new PopupTemplate({
				title : "STAT_NAME: {STAT_NAME}",
				description : infoDescription,
			/*
			 * fieldInfos: [{ //define field infos so we can specify an alias
			 * fieldName: "STAT_ID", label: "STAT_ID" }, { fieldName: "IS_LTE",
			 * label: "IS_LTE" }]
			 */
			});

			// create map
			map = new Map("map", {
				basemap : "streets",
				slider : true,
				infoWindow : popup
			});

			// add basemap gallery, in this case we'll display maps from
			// ArcGIS.com including bing maps
			var basemapGallery = new BasemapGallery({
				showArcGISBasemaps : true,
				map : map
			}, "basemapGallery");
			basemapGallery.startup();

			basemapGallery.on("error", function(msg) {
				console.log("basemap gallery error:  ", msg);
			});
			// -- end basemap

			// add search field
			var search = new Search({
				map : map
			}, "search");
			search.startup();
			// -- end search field

			// create featureLayer
			var mapServiceUrl = "https://stgeo01/arcgis/rest/services/IGIS/IGIS_Sites_Userselection/MapServer/0";

			var featureLayer = new FeatureLayer(mapServiceUrl, {
				infoTemplate : template,
				outFields : [ "USER_ID", "ACTIVE_GUID", "STAT_ID", "STAT_CODE",
						"STAT_NAME", "XCOORD", "YCOORD", "IS_GSM", "IS_DCS",
						"IS_UMTS", "IS_LTE", "IS_OUTD", "IS_INHOUS",
						"IS_TUNNEL" ]
			});
			// -- end featureLayer

			// query data based on Map Service URL parameters
			var queryTask = new QueryTask(mapServiceUrl);
			var query = new Query();
			query.returnGeometry = true;
			query.outFields = [ "USER_ID", "ACTIVE_GUID", "STAT_ID",
					"STAT_CODE", "STAT_NAME", "XCOORD", "YCOORD" ];

			var url = urlUtils.urlToObject(document.location.href);

			query.where = "user_id = " + url.query['user_id']
					+ " AND active_guid = '" + url.query['active_guid'] + "'";

			// only load required features, selected by user_id and GUID
			featureLayer.setDefinitionExpression(query.where);

			queryTask.execute(query, showResults);

			// initialize session parameters
			var src_id = 1; // TODO: check this! Is it also provided by URL?
			sessionStorage.setItem('user_id', url.query['user_id']);
			sessionStorage.setItem('src_id', src_id);
			sessionStorage.setItem('active_guid', url.query['active_guid']);

			function showResults(featureSet) {
				// pan and zoom to objects (median of coordinates, to omit
				// points (Dachsen Th�rishausen))

				// selection symbol used to draw the selected points within the
				// buffer polygon
				var selectedSymbol = new SimpleMarkerSymbol(
						SimpleMarkerSymbol.STYLE_CIRCLE, 14,
						new SimpleLineSymbol(SimpleLineSymbol.STYLE_NULL,
								new Color([ 247, 34, 101, 0.9 ]), 1),
						new Color([ 255, 0, 0, 1 ]));
				featureLayer.setSelectionSymbol(selectedSymbol);

				var nonselectedSymbol = new SimpleMarkerSymbol(
						SimpleMarkerSymbol.STYLE_CIRCLE, 7,
						new SimpleLineSymbol(SimpleLineSymbol.STYLE_NULL,
								new Color([ 247, 34, 101, 0.9 ]), 1),
						new Color([ 255, 0, 0, 1 ]));
				featureLayer.setRenderer(new SimpleRenderer(nonselectedSymbol));

				// define extent
				var features = featureSet.features || [];
				var extent = esri.graphicsExtent(features);

				if (!extent && features.length == 1) {
					// esri.getExtent returns null for a single point, so we'll
					// build the extent by hand
					var point = features[0];
					extent = new esri.geometry.Extent(point.x - 1, point.y - 1,
							point.x + 1, point.y + 1, point.SpatialReference);
				}

				if (extent) {
					// assumes the esri map object is stored in the
					// globally-scoped variable 'map'
					map.setExtent(extent)
				}

				map.addLayer(featureLayer);
			}

			// when the map is clicked create a buffer around the click point of
			// the specified distance.
			// Selection Circle
			var circle;
			var circleSymb = new SimpleFillSymbol(SimpleFillSymbol.STYLE_NULL,
					new SimpleLineSymbol(
							SimpleLineSymbol.STYLE_SHORTDASHDOTDOT, new Color([
									105, 105, 105 ]), 2), new Color([ 255, 255,
							0, 0.25 ]));

			// select objects inside circle
			map.on("click", function(evt) {

				circle = new Circle({
					center : evt.mapPoint,
					geodesic : true,
					radius : 100, // Default Value: Meters
					radiusUnit : Units.METERS
				});
				map.graphics.clear();
				map.infoWindow.show();
				var graphic = new Graphic(circle, circleSymb);
				map.graphics.add(graphic);

				var query = new Query();
				query.geometry = circle.getExtent();
				// use a fast bounding box query. will only go to the server if
				// bounding box is outside of the visible map
				featureLayer.queryFeatures(query, selectInBuffer);
			});

			function post(userSelection) {
				$.ajax({
					type : 'post',
					url : 'IGIS-X.php', // TODO: agree on final name
					data : {
						"userSelection" : JSON.stringify(userSelection)
					}
				});
			}

			function sessionIncNumSelections() {
				if (sessionStorage.getItem('numSelections')) {
					sessionStorage
							.setItem('numSelections', Number(sessionStorage
									.getItem('numSelections')) + 1);
				} else {
					sessionStorage.setItem('numSelections', 1);
				}
				return sessionStorage.getItem('numSelections');
			}

			function humanReadableTimeStamp() {
				var now = new Date();
				var date = [ now.getDate(), now.getMonth() + 1,
						now.getFullYear() ];
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
				return date[2] + "-" + date[1] + "-" + date[0] + " " + time[2]
						+ ":" + time[1] + ":" + time[0];
			}

			function selectInBuffer(response) {
				var feature, features = response.features, inBuffer = [], i = 0;

				// manage user selection
				var userSelection = {};
				userSelection.user_id = sessionStorage.getItem('user_id');
				userSelection.src_id = sessionStorage.getItem('src_id');
				userSelection.active_guid = sessionStorage
						.getItem('active_guid');
				userSelection.objects = [];

				// filter out features that are not actually in buffer, since we
				// got all points in the buffer's bounding box
				for (i = 0; i < features.length; i++) {
					feature = features[i];
					if (circle.contains(feature.geometry)) {
						inBuffer
								.push(feature.attributes[featureLayer.objectIdField]);

						var attributes = feature.attributes;
						userSelection.objects.push(attributes.STAT_ID);
					}
				}

				// increase selection counter
				var numSelections = sessionIncNumSelections();

				if (numSelections > 1) {
					userSelection.actionType = 2;
					userSelection.timestamp = sessionStorage
							.getItem('timestamp');
				} else {
					// this is the first selection in the session
					userSelection.actionType = 1;
					// generate timestamp of this user session
					var timestamp = humanReadableTimeStamp();
					sessionStorage.setItem('timestamp', timestamp);
					userSelection.timestamp = timestamp;
				}

				// save last user selection
				sessionStorage.setItem('objects', userSelection.objects);

				var query = new Query();
				query.objectIds = inBuffer; // use a fast objectIds selection
				// query (should not need to go to
				// the server)
				featureLayer
						.selectFeatures(
								query,
								FeatureLayer.SELECTION_NEW,
								function(results) {
									console
											.log("Anzahl Objekte: "
													+ featureLayer
															.getSelectedFeatures().length); // access
									// to
									// selected
									// features
									// via
									// featureLayer
									// selection
									console
											.log(featureLayer
													.getSelectedFeatures()[0].attributes);
								});

				// post: insert selection into Indigo DB
				post(userSelection);
			}
		});