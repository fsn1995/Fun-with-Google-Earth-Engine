/*
It creates a dateslider to check the annual water classification.
JRC Yearly Water Classification History, v1.1
Source: EC JRC/Google

RS and GIS associate at the ICRC
Shunan Feng: sfeng@icrc.org
*/

//-------------------------------------------------------------------//
//                           Preparation
//-------------------------------------------------------------------//

// var worldmap = ee.FeatureCollection('ft:1tdSwUL7MVpOauSgRzqVTOwdfy17KDbw-1d9omPw');//world vector
var worldmap = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017'); //

var country = ['Iraq'];//CHANGE the NAME of country here!

var countryshape = worldmap.filter(ee.Filter.inList('country_na', country));// country 
var roi = countryshape.geometry();// country 
// var roi = stateshape.geometry();// us state
var roiLayer = ui.Map.Layer(roi, {color: 'white'}, 'roi');
// var roiCentroid = roi.centroid();
Map.layers().add(roiLayer);//display roi
Map.centerObject(roi, 6);

// load annual data
var dataset = ee.ImageCollection("JRC/GSW1_1/YearlyHistory")
                .filterBounds(roi)
                .map(function(image){
                  return image.clip(roi);
                });
var visPalette = ['cccccc', 'ffffff', '99d9ea', '0000ff'],
    visName = ['No data', 'Not water', 'Seasonal Water', 'Permanent water'];
// Map.addLayer(dataset.first());
var date_start = ee.Image(dataset.first()).date().get('year').format();
var date_now = Date.now(),
    date_end = ee.Date(date_now).format();

var showClass = function(range) {
    range.start().get('year').evaluate(function(name) {
        var visParams = {bands: ['waterClass'], min: 0, max: 3, palette: visPalette};
        var layer = ui.Map.Layer(dataset, visParams, name + ' waterClass');
        Map.layers().set(0, layer);
    });
};
var now = Date.now();
var dateRange = ee.DateRange(date_start, date_end).evaluate(function(range) {
    var dateSlider = ui.DateSlider({
        start: range['dates'][0],
        end:range['dates'][1],
        value: null,
        period: 365,
        onChange: showClass
    });
    Map.add(dateSlider.setValue(now));
});

// add legend, 
// script adapted from https://mygeoblog.com/2016/12/09/add-a-legend-to-to-your-gee-map/
// set position of panel
var legend = ui.Panel({
    style: {
      position: 'bottom-left',
      padding: '8px 15px'
    }
  });
   
// Create legend title
var legendTitle = ui.Label({
  value: 'Legend',
  style: {
    fontWeight: 'bold',
    fontSize: '18px',
    margin: '0 0 4px 0',
    padding: '0'
    }
});
  
// Add the title to the panel
legend.add(legendTitle);
  
// Creates and styles 1 row of the legend.
var makeRow = function(color, name) {
  
      // Create the label that is actually the colored box.
      var colorBox = ui.Label({
        style: {
          backgroundColor: '#' + color,
          // Use padding to give the box height and width.
          padding: '8px',
          margin: '0 0 4px 0'
        }
      });
  
      // Create the label filled with the description text.
      var description = ui.Label({
        value: name,
        style: {margin: '0 0 4px 6px'}
      });
  
      // return the panel
      return ui.Panel({
        widgets: [colorBox, description],
        layout: ui.Panel.Layout.Flow('horizontal')
      });
};
  
  
// Add color and and names
for (var i = 0; i < 4; i++) {
  legend.add(makeRow(visPalette[i], visName[i]));
  }  
  
// add legend to map (alternatively you can also print the legend to the console)
Map.add(legend);

// convert the original data to rgb three bands and export as a video
var videoParams = {bands: ['waterClass'], min: 0, max: 3, palette: visPalette};
var addRGB = function(image) {
  var rgb = image.visualize(videoParams);
  return image.addBands(rgb);
};

var waterClassRGB = dataset.map(addRGB);
print(waterClassRGB);
Export.video.toDrive({
  collection: waterClassRGB.select(['vis-red', 'vis-green', 'vis-blue']),
  description:'waterAnnualVideo',
  dimensions: 720,
  framesPerSecond: 1,
  region: roi
});