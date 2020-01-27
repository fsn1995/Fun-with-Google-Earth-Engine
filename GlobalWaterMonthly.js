/*
Monthly surface water slider with EC JRC/Google product.
This part of script displays the JRC Monthly Water History data and provides
a dateslider to explore the monthly dataset. 

Reference of data:
EC JRC/Google
https://developers.google.com/earth-engine/datasets/catalog/JRC_GSW1_1_MonthlyHistory
date slider instruction:
https://developers.google.com/earth-engine/ui_widgets#ui.dateslider
Shunan Feng: fsn.1995@gmail.com
*/
var worldmap = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017'); //

var country = ['Brazil'];//CHANGE the NAME of country here!

var countryshape = worldmap.filter(ee.Filter.inList('country_na', country));// country 
var roi = countryshape.geometry();// country 
// var roi = stateshape.geometry();// us state
var roiLayer = ui.Map.Layer(roi, {color: 'white'}, 'roi');
// var roiCentroid = roi.centroid();
Map.layers().add(roiLayer);//display roi
Map.centerObject(roi, 4);

// load JRC Monthly Water data
var dataset = ee.ImageCollection("JRC/GSW1_1/MonthlyHistory")
                .filterBounds(roi)
                .filterDate('1984-01-01', '2019-12-31')
                .map(function(image){
                    return image.clip(roi);
                });
// build the time slider
var visPalette = ['cccccc', 'ffffff', '0000ff'],
    visName = ['No data', 'Not water', 'Water'];

var date_start = ee.Image(dataset.first()).date().get('year').format();
var date_now = Date.now(),
    date_end = ee.Date('2018-12-31').format(); // end of dataset 

var showLayer = function(range){
  var water = dataset.filterDate(range.start(), range.end());
  range.start().get('year').evaluate(function(name) {
    var visPara = {min: 0, max: 2, palette: visPalette};
    var layer = ui.Map.Layer(water, visPara, name + ' JRC Monthly Water History');
    Map.layers().set(1, layer);
  });
};

var dateRange = ee.DateRange(date_start, date_end).evaluate(function(range) {
  var dateSlider = ui.DateSlider({
    start: range['dates'][0],
    end: range['dates'][1],
    value: null,
    period: 30, // monthly time slider
    onChange: showLayer
  });
  Map.add(dateSlider.setValue(date_now));
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
for (var i = 0; i < 3; i++) {
legend.add(makeRow(visPalette[i], visName[i]));
}  

// add legend to map (alternatively you can also print the legend to the console)
Map.add(legend);