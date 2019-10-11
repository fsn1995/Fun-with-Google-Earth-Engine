/*
This script utizes the GHSL: Global Human Settlement Layers, Built-Up 
Grid 1975-1990-2000-2015 (P2016) data.
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
// Map.layers().add(roiLayer);//display roi
Map.centerObject(roi, 6);

var dataset = ee.Image("JRC/GHSL/P2016/BUILT_LDSMT_GLOBE_V1").clip(roi);
var urban = dataset.select('built'),
    urbanColor = [
        // '0c1d60', // water
        '000000', '448564', 
        '70daa4', '83ffbf', 'ffffff'
    ],
    urbanName = [
        // 'Water surface'
        'Land no built-up in any epoch',
        'Built-up from 2000 to 2014 epochs',
        'Built-up from 1990 to 2000 epochs',
        'Built-up from 1975 to 1990 epochs',
        'built-up up to 1975 epoch'
    ];
Map.addLayer(urban, {min: 2, max: 6, palette: urbanColor});
// script adapted from https://mygeoblog.com/2016/12/09/add-a-legend-to-to-your-gee-map/
// add legend, 
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
for (var i = 0; i < 5; i++) {
  legend.add(makeRow(urbanColor[i], urbanName[i]));
  }  
 
// add legend to map (alternatively you can also print the legend to the console)
Map.add(legend);


Export.image.toDrive({
    image: urban,
    folder: 'iraq',
    description: 'IraqUrban',
    scale: 120,
    region: roi
});