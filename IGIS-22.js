/*
 * IGIS-22 Antennenstandorte mittels Freitextsuche und Radius selektieren (Ptyp)
 * 
 */

var map;

require([ 
  "esri/urlUtils"
  , "esri/map"
  , "esri/layers/FeatureLayer"
  , "esri/tasks/query"
  , "esri/tasks/QueryTask"
  , "esri/layers/TableDataSource"
  , "esri/layers/LayerDataSource"
  , "esri/geometry/Geometry"
  , "esri/geometry/Circle"
  , "esri/graphic"
  , "esri/InfoTemplate"
  , "esri/symbols/SimpleMarkerSymbol"
  , "esri/symbols/SimpleLineSymbol"
  , "esri/symbols/SimpleFillSymbol"
  , "esri/renderers/SimpleRenderer"
  , "esri/config"
  , "esri/Color"
  , "esri/geometry/Point"
  , "dojo/dom"
  , "dojo/on"
  , "dojo/domReady!"
  , "esri/arcgis/utils"
  , "esri/dijit/Legend" 
], function(urlUtils
  , Map
  , FeatureLayer
  , Query
  , QueryTask
  , TableDataSource
  , LayerDataSource
  , Geometry
  , Circle
  , Graphic
  , InfoTemplate
  , SimpleMarkerSymbol
  , SimpleLineSymbol
  , SimpleFillSymbol
  , SimpleRenderer
  , esriConfig
  , Color
  , Point
  , dom
  , on
  , arcgisUtils
  , Legend
) {
'use strict';

// create map
map = new Map("mapDiv", {
  basemap : "streets",
  slider : true
});

                
var mapServiceUrl = "https://stgeo01/arcgis/rest/services/IGIS/IGIS_Sites_Userselection/MapServer/0";

//add the points in on demand mode. Note that an info template has been defined so when
//selected features are clicked a popup window will appear displaying the content defined in the info template.
var featureLayer = new FeatureLayer(
  mapServiceUrl,
  {
    infoTemplate : new InfoTemplate("Block: ${BLOCK}", "${*}"),
    outFields : [ "USER_ID", "ACTIVE_GUID", "STAT_ID", "STAT_CODE",
        "STAT_NAME", "LON", "LAT", "IS_GSM", "IS_DCS", "IS_UMTS", "IS_LTE", "IS_OUTD", "IS_INHOUS", "IS_TUNNEL" ]
  });
  
  
  
  
var dataSource = new TableDataSource();
dataSource.workspaceId = "D148SHG_APP_ARCGIS";
dataSource.dataSourceName = "sTgpdb01.BTO_SHOGUN.X_SELEXDATA";
var layerSource = new LayerDataSource();
layerSource.dataSource = dataSource;

var featureLayer2 = new FeatureLayer("https://stgeo01/arcgis/rest/services/IGIS/IGIS_Sites_Userselection/dynamicLayer", {
  
 // "http://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/dynamicLayer", {
          mode: FeatureLayer.MODE_ONDEMAND,
          outFields: ["SELEX_ID", "OBJ_ID"],
     //     infoTemplate: infoTemplate,
          source: layerSource
        });



console.log(layerSource.toJson());


var queryTask = new QueryTask(mapServiceUrl);
//build query filter
var query = new Query();
query.returnGeometry = true;
query.outFields = [ "USER_ID", "ACTIVE_GUID", "STAT_ID", "STAT_CODE", "STAT_NAME", "LON", "LAT" ];
        
// Die URL liefert die user_id und die active_guid. Damit können die beiden Parameter aus der URL ausgelesen werden.
// das Package esri/urlUtils muss als erstes aufgeführt werden. Warum ist unklar.
var url = urlUtils.urlToObject(document.location.href);

query.where = "user_id = " + url.query['user_id'] + " AND active_guid = '" + url.query['active_guid'] + "'"; // hier SQL WHERE Clause definieren
//query.where = "USER_ID = " + url.query.user_id + " AND ACTIVCE_GUID = '" + url.query.active_guid + "'";  // diese Version funktioniert nicht. Warum?
                          
// Mit setDefinitionExpression wird erreicht, dass nur Objekte geladen werden, die auch wirklich benötigt werden. 
// In diesem Fall nur Objekte, die in der URL explizit genannt werden.
featureLayer.setDefinitionExpression(query.where);        

queryTask.execute(query, showResults);

  function showResults(featureSet) {
    featureLayer.selectFeatures(query,
    FeatureLayer.SELECTION_NEW, function(featureSet) {
    });
    
    // pan and zoom to objects (median of coordinates, to omit points (Dachsen Thörishausen))
    function median(values) {
      values.sort( function(a,b) {return a - b;} );
   
      var half = Math.floor(values.length/2);
   
      if(values.length % 2)
        return values[half];
      else
        return (values[half-1] + values[half]) / 2.0;
    }
                      
    var longs = [],
      lats = [], 
      i = 0;
                      
    for (i = 0; i < featureSet.features.length; i++) {
      longs.push(featureSet.features[i].attributes.LON);
      lats.push(featureSet.features[i].attributes.LAT);  
    }
    // hier müsste man noch leere Koordinaten abfangen
                              
    map.centerAndZoom(new Point(median(longs), median(lats)), 15);
                               
 
   
    map.addLayer(featureLayer);
  }
});