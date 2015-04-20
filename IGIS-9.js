  /*
 * IGIS-9 die Suchresultate der Indigo-Standortsuche im GIS sehen (Ptyp)
 * IGIS-144 - vom Indigo GIS aus im Indigo GUI die Detailansicht zu einem Standort Oeffnen (analog Indigo Detail-Knopf) (Ptyp)
 * IGIS-145 - fuer Standorte mit Mouseover die relevantesten Kennzahlen sehen (Ptyp)
 */


var map,
    dialog,
    host;

require(
		[ "esri/urlUtils"
  , "esri/map"
  , "esri/layers/FeatureLayer"
  , "esri/tasks/query"
  , "esri/tasks/QueryTask"
  , "esri/geometry/Geometry"
  , "esri/geometry/Circle"
  , "esri/graphic"  
  , "esri/dijit/Popup"
  , "esri/dijit/BasemapToggle"
  , "esri/symbols/SimpleMarkerSymbol"
  , "esri/symbols/SimpleLineSymbol"
  , "esri/symbols/SimpleFillSymbol"
  , "esri/renderers/SimpleRenderer"
  , "esri/geometry/Extent"
  , "esri/dijit/Search"
  , "esri/units"
  , "esri/config"
  , "dijit/TooltipDialog"
  , "esri/lang"
  , "dojo/dom-style"
  , "dijit/popup"
  , "esri/Color"
  , "esri/geometry/Point"
  , "esri/arcgis/utils"
  , "dojo/parser"
  , "dojo/dom"
  , "dojo/dom-construct"
  , "dojo/on"
  , "dojo/dom-class"
  , "dijit/layout/BorderContainer"
  , "dijit/layout/ContentPane"
  , "dijit/TitlePane"
  , "dojo/domReady!"
		],
		function(urlUtils
  , Map
  , FeatureLayer
  , Query
  , QueryTask
  , Geometry
  , Circle
  , Graphic     
  , Popup
  , BasemapToggle 
  , SimpleMarkerSymbol
  , SimpleLineSymbol
  , SimpleFillSymbol
  , SimpleRenderer
  , Extent
  , Search
  , Units
  , esriConfig
  , TooltipDialog
  , esriLang
  , domStyle
  , dijitPopup
  , Color
  , Point
  , arcgisUtils
  , parser
  , dom
  , domConstruct
  , on
  , domClass

		) {
		  'use strict';

  // create popup
  var fill = new SimpleFillSymbol("solid", null, new Color("#A4CE67"));
  var popup = new Popup({
    fillSymbol : fill,
    titleInBody : false
  }, domConstruct.create("div")); 

  // create map
  map = new Map("map", {
    basemap : "streets",
    slider : true
  }); 
			
  host = "http://sdshgweb01:9010";
      
  var toggle = new BasemapToggle({
    map : map,
    basemap : "hybrid"
  }, "BasemapToggle");
  toggle.startup();

  // add search field
  var search = new Search({
    map : map
  }, "search");
  search.startup();
  // -- end search field


	
  // create featureLayer
  var mapServiceUrl = "https://stgeo01/arcgis/rest/services/IGIS/IGIS_Sites_Userselection/MapServer/0";

  var featureLayer = new FeatureLayer(mapServiceUrl, {
    outFields : ["USER_ID", "ACTIVE_GUID", "STAT_ID", "STAT_CODE", "STAT_NAME", "XCOORD", "YCOORD", "IS_GSM", "IS_DCS", "IS_UMTS", "IS_LTE", "IS_OUTD", "IS_INHOUS", "IS_TUNNEL"]
  });
  // -- end featureLayer

  // query data based on Map Service URL parameters
  var queryTask = new QueryTask(mapServiceUrl);
  var query = new Query();
  query.returnGeometry = true;
  query.outFields = ["USER_ID", "ACTIVE_GUID", "STAT_ID", "STAT_CODE", "STAT_NAME", "XCOORD", "YCOORD"];

  var url = urlUtils.urlToObject(document.location.href);

  query.where = "user_id = " + url.query['user_id'] + " AND active_guid = '" + url.query['active_guid'] + "'";

  // only load required features, selected by user_id and GUID
  featureLayer.setDefinitionExpression(query.where);

  queryTask.execute(query, showResults);

        
  map.infoWindow.resize(245, 125);

  dialog = new TooltipDialog({
    id : "tooltipDialog",
    style : "position: absolute; width: 250px; font: normal normal normal 10pt Helvetica;z-index:100"
  });
  dialog.startup();

  //close the dialog when the mouse leaves the highlight graphic
  map.on("load", function() {
    map.graphics.enableMouseEvents();
  });

  //listen for when the onMouseOver event fires on the countiesGraphicsLayer
  //when fired, create a new graphic with the geometry from the event.graphic and add it to the maps graphics layer
  featureLayer.on("mouse-over", function(evt) {
    var infoDescription = "<b>STAT_CODE: </b>${STAT_CODE}<br>" + "<b>STAT_ID: </b>${STAT_ID}<br>" + "<b>STAT_NAME: </b>${STAT_NAME}<br>" + "<b>IS_GSM: </b>${IS_GSM}<br>" + "<b>IS_DCS: </b>${IS_DCS}<br>" + "<b>IS_UMTS: </b>${IS_UMTS}<br>" + "<b>IS_LTE: </b>${IS_LTE}<br>" + "<b>IS_OUTD: </b>${IS_OUTD}<br>" + "<b>IS_INHOUS: </b>${IS_INHOUS}<br>" + "<b>IS_TUNNEL: </b>${IS_TUNNEL}<br>" + "<a href= '" + host + "/Indigo/Station/Detail/${STAT_ID}' target='_blank'>Link auf Indigo Details</a><br>";

    var content = esriLang.substitute(evt.graphic.attributes, infoDescription);

    dialog.setContent(content);

    domStyle.set(dialog.domNode, "opacity", 0.85);
    dijitPopup.open({
      popup : dialog,
      x : evt.pageX,
      y : evt.pageY
    });
  });

  
  function showResults(featureSet) {

    // selection symbol used to draw the selected points within the buffer polygon
    var selectedSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 14, new SimpleLineSymbol(SimpleLineSymbol.STYLE_NULL, new Color([247, 34, 101, 0.9]), 1), new Color([255, 0, 0, 1]));
    featureLayer.setSelectionSymbol(selectedSymbol);

    var nonselectedSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 7, new SimpleLineSymbol(SimpleLineSymbol.STYLE_NULL, new Color([247, 34, 101, 0.9]), 1), new Color([255, 0, 0, 1]));
    featureLayer.setRenderer(new SimpleRenderer(nonselectedSymbol));

    // define extent
    var features = featureSet.features || [];
    var extent = esri.graphicsExtent(features);

    if (features.length == 1) {
      // esri.getExtent returns null for a single point, so we'll build the extent by hand

      var point = features[0];
      extent = new Extent(point.geometry.x - 500, point.geometry.y - 500, point.geometry.x + 500, point.geometry.y + 500, point.geometry.spatialReference);
    }

    if (extent) {
      // assumes the esri map object is stored in the globally-scoped variable 'map'
      map.setExtent(extent) // vergroessere den Extent ein wenig
    }

    map.addLayer(featureLayer);
  }


  // when the map is clicked create a buffer around the click point of
  // the specified distance.
  // Selection Circle
  var circle;
  var circleSymb = new SimpleFillSymbol(SimpleFillSymbol.STYLE_NULL, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SHORTDASHDOTDOT, new Color([105, 105, 105]), 2), new Color([255, 255, 0, 0.25]));

  // select objects inside circle
  map.on("click", function(evt) {

    // close popup, falls eines offen ist
    // darf erst beim Mausklick passieren, damit in gešffneten Popups gearbeitet werden kann
    map.graphics.clear();
    dijitPopup.close(dialog);

    circle = new Circle({
      center : evt.mapPoint,
      geodesic : true,
      radius : 500, // Default Value: Meters
      radiusUnit : Units.METERS
    });
    map.graphics.clear();
    var graphic = new Graphic(circle, circleSymb);
    map.graphics.add(graphic);

    var query = new Query();
    query.geometry = circle.getExtent();
    // use a fast bounding box query. will only go to the server if
    // bounding box is outside of the visible map
    featureLayer.queryFeatures(query, selectInBuffer);
  }); 


  function selectInBuffer(response) {
    var feature,
        features = response.features,
        inBuffer = [],
        i = 0;

    var selectedStatIds = [];

    // filter out features that are not actually in buffer, since we
    // got all points in the buffer's bounding box
    for ( i = 0; i < features.length; i++) {
      feature = features[i];
      if (circle.contains(feature.geometry)) {
        inBuffer.push(feature.attributes[featureLayer.objectIdField]);

        var attributes = feature.attributes;
        selectedStatIds.push(feature.attributes.STAT_ID);
      }
    }

    var query = new Query();
    query.objectIds = inBuffer;
    // use a fast objectIds selection query (should not need to go to the server)
    featureLayer.selectFeatures(query, FeatureLayer.SELECTION_NEW, function(results) {
      console.log("Anzahl Objekte: " + featureLayer.getSelectedFeatures().length);
      // access to selected features via featureLayer selection
      //  console.log(selectedStatIds);

      // JavaScript-Funktion, die von Indigo bereitgestellt wird:
      // der Parameter ist ein Array mit Stat_ID's (Matthias Fluehmann)
      if (featureLayer.getSelectedFeatures().length) {
        indigo.gis.showGisSelex(selectedStatIds);
      }
    });
  }

});

    
    
