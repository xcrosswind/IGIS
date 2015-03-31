/*
 * IGIS-143 - in der Indigo GUI-Detailansicht eines Standortes dessen Position auf einer Karte sehen (Ptyp)
 */

var map;
    
require([ 
  "esri/urlUtils"
  , "esri/map"
  , "esri/layers/FeatureLayer"
  , "esri/tasks/query"
  , "esri/tasks/QueryTask"
  , "esri/geometry/Circle"
  , "esri/graphic"
  , "esri/InfoTemplate"
  , "esri/symbols/SimpleMarkerSymbol"
  , "esri/symbols/SimpleLineSymbol"
  , "esri/symbols/SimpleFillSymbol"
  , "esri/renderers/SimpleRenderer"
  , "esri/Color"
  , "esri/geometry/Point"
  , "esri/tasks/FeatureSet"

  , "esri/arcgis/utils"

  , "dojo/dom"
  , "dojo/on"
  , "dojo/parser"
  , "dojo/domReady!"  
], function(urlUtils
  , Map
  , FeatureLayer
  , Query
  , QueryTask
  , Circle
  , Graphic
  , InfoTemplate
  , SimpleMarkerSymbol
  , SimpleLineSymbol
  , SimpleFillSymbol
  , SimpleRenderer
  , Color
  , Point
  , FeatureSet

  , arcgisUtils

  , dom
  , on
  , parser
) {
  'use strict';
  parser.parse();

  // create map 
  map = new Map("map", {
  basemap : "hybrid", // Alternativen: satellite, streets, terrain, topo (siehe https://developers.arcgis.com/javascript/jsapi/esri.basemaps-amd.html)
                                        // welche Basemap sinnvoll ist, muss noch nicht den Anwendern diskutiert werden
  slider : true,
  logo   : false  
  });
     
  var mapServiceUrl = "https://stgeo01/arcgis/rest/services/IGIS/IGIS_Sites/MapServer/0";

  //add the points in on demand mode. Note that an info template has been defined so when
  //selected features are clicked a popup window will appear displaying the content defined in the info template.
  var featureLayer = new FeatureLayer(
    mapServiceUrl,
    {  outFields : ["STAT_ID", "STAT_CODE", "STAT_NAME","OFFERER_ID", "LON", "LAT", "REGION_ID", 
      "GROUND_LEVEL", "CREA_DATE", "OFFERER_TYPE", "IS_GSM", "IS_DCS", "IS_UMTS", "IS_LTE", "IS_OUTD", "IS_INHOUS", "IS_TUNNEL" ]
  });
  
  //build query filter
  var queryTask = new QueryTask(mapServiceUrl);
  var query = new Query();
  query.returnGeometry = true;
  query.outFields = ["STAT_ID", "STAT_CODE", "LON", "LAT" ];
  
  // das Package esri/urlUtils muss als erstes aufgef�hrt werden. Warum ist unklar.
  // !!! Besser w�re, wenn nur die wirklich ben�tigten Punkte geladen w�rden, anstelle von alles laden und nur die ben�tigten darstellen...
  var url = urlUtils.urlToObject(document.location.href);
  
  // URL: ?stat_id=329734 oder ?stat_id=423013
  // Attribut: GROSSBUCHSTABEN; URL: kleinbuchstaben
  query.where = "STAT_ID = '" + url.query.stat_id + "'";   

  // Mit setDefinitionExpression wird erreicht, dass nur Objekte geladen werden, die auch wirklich ben�tigt werden. 
  // In diesem Fall nur Objekte, die in der URL explizit genannt werden.
  featureLayer.setDefinitionExpression(query.where);
  
  queryTask.execute(query, showResults); 

  function showResults(featureSet) {               // FeatureSet
    featureLayer.selectFeatures(query,
      FeatureLayer.SELECTION_NEW, function(featureSet) {
    });

    // pan and zoom to object
    // identifiziere die Koordinaten aus dem Objekt
    var pos_long = featureSet.features[0].attributes.LON, 
      pos_lat = featureSet.features[0].attributes.LAT;

    map.centerAndZoom(new Point(pos_long, pos_lat), 16);   // welche Zoomstufe sinnvoll ist, muss noch mit den Anwendern diskutiert werden

    // selection symbol used to draw the selected points within the buffer polygon
    var symbol = new SimpleMarkerSymbol(
      SimpleMarkerSymbol.STYLE_CIRCLE, 14,
        new SimpleLineSymbol(SimpleLineSymbol.STYLE_NULL,
          new Color([ 247, 34, 101, 0.9 ]), 1),
    new Color([ 255, 0, 0, 1 ]));
    featureLayer.setSelectionSymbol(symbol);
                
    //make unselected features invisible
    var nullSymbol = new SimpleMarkerSymbol().setSize(0);
    featureLayer.setRenderer(new SimpleRenderer(nullSymbol));  
             
    map.addLayer(featureLayer); 
  }          
});