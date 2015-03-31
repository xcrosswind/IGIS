/*
 * IGIS-9 die Suchresultate der Indigo-Standortsuche im GIS sehen (Ptyp)
 * IGIS-144 - vom Indigo GIS aus im Indigo GUI die Detailansicht zu einem Standort öffnen (analog Indigo Detail-Knopf) (Ptyp)
 */

var map;

require([ 
  "esri/urlUtils"
  , "esri/map"
  , "esri/layers/FeatureLayer"
  , "esri/tasks/query"
  , "esri/tasks/QueryTask"
  , "esri/geometry/Geometry"
  , "esri/geometry/Circle"
  , "esri/graphic"
  , "esri/InfoTemplate"
  , "esri/symbols/SimpleMarkerSymbol"
  , "esri/symbols/SimpleLineSymbol"
  , "esri/symbols/SimpleFillSymbol"
  , "esri/renderers/SimpleRenderer"
  , "esri/dijit/Search"
  , "esri/dijit/BasemapGallery"
  
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
  , "dojo/on"
  
  , "dijit/layout/BorderContainer"
  , "dijit/layout/ContentPane"
  , "dijit/TitlePane"
  , "dojo/domReady!"

  
], function(urlUtils
  , Map
  , FeatureLayer
  , Query
  , QueryTask
  , Geometry
  , Circle
  , Graphic
  , InfoTemplate
  , SimpleMarkerSymbol
  , SimpleLineSymbol
  , SimpleFillSymbol
  , SimpleRenderer
  , Search  
  , BasemapGallery
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
  , on

) {
  'use strict';
  
  // create map
  map = new Map("map", {
    basemap : "streets",
    slider : true
  });
  
  // add basemap gallery, in this case we'll display maps from ArcGIS.com including bing maps
  var basemapGallery = new BasemapGallery({
    showArcGISBasemaps: true,
    map: map
  }, "basemapGallery");
  basemapGallery.startup();

  basemapGallery.on("error", function(msg) {
    console.log("basemap gallery error:  ", msg);
  });
  // -- end basemap
           
  // add search field
  var search = new Search({
    map: map
    }, "search");
  search.startup();
  // -- end search field
                             
  // create featureLayer
  var mapServiceUrl = "https://stgeo01/arcgis/rest/services/IGIS/IGIS_Sites_Userselection/MapServer/0";
  var featureLayer = new FeatureLayer(
    mapServiceUrl,
    { infoTemplate : new InfoTemplate("Block: ${BLOCK}", "${*}"),
      outFields : [ "USER_ID", "ACTIVE_GUID", "STAT_ID", "STAT_CODE",
          "STAT_NAME", "LON", "LAT", "IS_GSM", "IS_DCS", "IS_UMTS", "IS_LTE", "IS_OUTD", "IS_INHOUS", "IS_TUNNEL" ]
  });
  // -- end featureLayer
  
  // query data based on Map Service URL parameters
  var queryTask = new QueryTask(mapServiceUrl);
  var query = new Query();
  query.returnGeometry = true;
  query.outFields = [ "USER_ID", "ACTIVE_GUID", "STAT_ID", "STAT_CODE", "STAT_NAME", "LON", "LAT" ];

  var url = urlUtils.urlToObject(document.location.href);
  
  query.where = "user_id = " + url.query['user_id'] + " AND active_guid = '" + url.query['active_guid'] + "'";
  //query.where = "USER_ID = " + url.query.user_id + " AND ACTIVCE_GUID = '" + url.query.active_guid + "'";  // diese Version funktioniert nicht. Warum?
                            
  // only load required features, selected by user_id and GUID
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
                               
    // selection symbol used to draw the selected points within the buffer polygon
    var selectedSymbol = new SimpleMarkerSymbol(
      SimpleMarkerSymbol.STYLE_CIRCLE, 14,
      new SimpleLineSymbol(SimpleLineSymbol.STYLE_NULL,
        new Color([ 247, 34, 101, 0.9 ]), 1),
          new Color([ 255, 0, 0, 1 ]));
    featureLayer.setSelectionSymbol(selectedSymbol);
        
    var notselectedSymbol = new SimpleMarkerSymbol(
      SimpleMarkerSymbol.STYLE_CIRCLE, 7,
      new SimpleLineSymbol(SimpleLineSymbol.STYLE_NULL,
        new Color([ 247, 34, 101, 0.9 ]), 1),
          new Color([ 255, 0, 0, 1 ]));
    featureLayer.setRenderer(new SimpleRenderer(notselectedSymbol));
    
    map.addLayer(featureLayer);
  }
  
  
  // --- Mouseover Window
  map.infoWindow.resize(245,125); 
  
  var dialog = new TooltipDialog({
    id: "tooltipDialog",
    style: "position: absolute; width: 250px; font: normal normal normal 10pt Helvetica;z-index:100"
  });
  dialog.startup();
  
  //close the dialog when the mouse leaves the highlight graphic
  map.on("load", function(){
    map.graphics.enableMouseEvents();
    map.graphics.on("mouse-out", closeDialog);             
  });


                     
  //listen for when the onMouseOver event fires on the countiesGraphicsLayer
  //when fired, create a new graphic with the geometry from the event.graphic and add it to the maps graphics layer
  
  // -- DIESE VARIANTE FUNKTIONIERT MIT MOUSEOVER
  // leider ist damit der Link nicht erreichbar, hier wäre eine andere Lösung zu suchen
  featureLayer.on("mouse-over", showTooltip);
  
  function showTooltip(evt) {
    var host = "http://sdshgweb01:9010"; // muss wahrscheinlich noch irgendwie dynamisch gesetzt werden, um zwischen extern und intern unterscheiden zu können    
    var t = "<b>STAT_CODE: </b>${STAT_CODE}<br>"
      + "<b>STAT_NAME: </b>${STAT_NAME}<br>"
      + "<b>IS_GSM: </b>${IS_GSM}<br>"
      + "<b>IS_DCS: </b>${IS_DCS}<br>"
      + "<b>IS_UMTS: </b>${IS_UMTS}<br>"
      + "<b>IS_LTE: </b>${IS_LTE}<br>"
      + "<b>IS_OUTD: </b>${IS_OUTD}<br>"
      + "<b>IS_INHOUS: </b>${IS_INHOUS}<br>"
      + "<b>IS_TUNNEL: </b>${IS_TUNNEL}<br>"
      + "<a href= '" + host + "/Indigo/Station/Detail/${STAT_ID}' target='_blank'>Link auf Indigo Details</a><br>";
    
  // set mouseover window
  var content = esriLang.substitute(evt.graphic.attributes,t);         
  dialog.setContent(content);
  
  domStyle.set(dialog.domNode, "opacity", 0.75);
  dijitPopup.open({
    popup: dialog, 
    x: evt.pageX,
    y: evt.pageY
    });
  }
  
  featureLayer.on("mouse-out", closeDialog); 
  
  function closeDialog() {
    map.graphics.clear();
    dijitPopup.close(dialog);
  }
  // -- MOUSEOVER
  
  
  
  
  
  
  
  var unselectSymbol = new SimpleMarkerSymbol().setSize(0);
  featureLayer.setRenderer(new SimpleRenderer(unselectSymbol));
  // Fenster verschwindet beim Mouseout noch nicht
  // -- END Mouseover Window  

  //when the map is clicked create a buffer around the click point of the specified distance.        
  // Selection Circle
  var circle;
  var circleSymb = new SimpleFillSymbol(
    SimpleFillSymbol.STYLE_NULL,
    new SimpleLineSymbol(
    SimpleLineSymbol.STYLE_SHORTDASHDOTDOT,
    new Color([105, 105, 105]), 2
    ), new Color([255, 255, 0, 0.25])
  );

  // select objects inside circle
  map.on("click", function(evt){
    circle = new Circle({
      center: evt.mapPoint,
      geodesic: true,
      radius: 100 // Default Value: Meters
    });
    map.graphics.clear();
    map.infoWindow.hide();
    var graphic = new Graphic(circle, circleSymb);
    map.graphics.add(graphic);
  
    var query = new Query();
    query.geometry = circle.getExtent();
    //use a fast bounding box query. will only go to the server if bounding box is outside of the visible map 
    featureLayer.queryFeatures(query, selectInBuffer);
  });
     
  function selectInBuffer(response){
    var feature,
      features = response.features,
      inBuffer = [],
      i = 0;
 
    //filter out features that are not actually in buffer, since we got all points in the buffer's bounding box
    for (i = 0; i < features.length; i++) {
      feature = features[i];
      if(circle.contains(feature.geometry)){
        inBuffer.push(feature.attributes[featureLayer.objectIdField]);
      }
    }
    query.objectIds = inBuffer;
    //use a fast objectIds selection query (should not need to go to the server)
    featureLayer.selectFeatures(query, FeatureLayer.SELECTION_NEW, function(results){
    });
  //  console.log(featureLayer.getSelectedFeatures()); // access to selected features via featureLayer selection
  }
});