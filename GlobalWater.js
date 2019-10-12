//-------------------------------------------------------------------//
/* 
It would display the global surface water dynamics in your area of 
interest. 
Script adapted from https://developers.google.com/earth-engine/tutorial_global_surface_water_01
and https://mygeoblog.com/2016/12/09/add-a-legend-to-to-your-gee-map/
Updates are made (eg.g expand to the latest data (1984-2019), water 
transition color map etc.)

Source: EC JRC/Google
Shunan Feng: sfeng@icrc.org
*/
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


//////////////////////////////////////////////////////////////
// Asset List
//////////////////////////////////////////////////////////////

var gsw = ee.Image("JRC/GSW1_1/GlobalSurfaceWater").clip(roi);
var gswold = ee.Image('JRC/GSW1_0/GlobalSurfaceWater').clip(roi);
var occurrence = gsw.select('occurrence');
var change = gsw.select("change_abs");
var transition = gsw.select('transition');
//////////////////////////////////////////////////////////////
// Constants
//////////////////////////////////////////////////////////////

var VIS_OCCURRENCE = {
    min: 0,
    max: 100,
    palette: ['red', 'blue']
};
var VIS_CHANGE = {
    min: -50,
    max: 50,
    palette: ['red', 'black', 'limegreen']
};
var VIS_WATER_MASK = {
  palette: ['white', 'black']
};

//////////////////////////////////////////////////////////////
// Helper functions
//////////////////////////////////////////////////////////////

// Create a feature for a transition class that includes the area covered.
function createFeature(transition_class_stats) {
  transition_class_stats = ee.Dictionary(transition_class_stats);
  var class_number = transition_class_stats.get('transition_class_value');
  var result = {
      transition_class_number: class_number,
      transition_class_name: lookup_names.get(class_number),
      transition_class_palette: lookup_palette.get(class_number),
      area_m2: transition_class_stats.get('sum')
  };
  return ee.Feature(null, result);   // Creates a feature without a geometry.
}

// Create a JSON dictionary that defines piechart colors based on the
// transition class palette.
// https://developers.google.com/chart/interactive/docs/gallery/piechart
function createPieChartSliceDictionary(fc) {
  return ee.List(fc.aggregate_array("transition_class_palette"))
    .map(function(p) { return {'color': p}; }).getInfo();
}

//////////////////////////////////////////////////////////////
// Calculations
//////////////////////////////////////////////////////////////

// Create a dictionary for looking up names of transition classes.
var lookup_names = ee.Dictionary.fromLists(
    ee.List(gswold.get('transition_class_values')).map(ee.String),
    gswold.get('transition_class_names')
);
// Create a dictionary for looking up colors of transition classes.
var lookup_palette = ee.Dictionary.fromLists(
    ee.List(gswold.get('transition_class_values')).map(ee.String),
    gswold.get('transition_class_palette')
);

// Create a water mask layer, and set the image mask so that non-water areas
// are transparent.
var water_mask = occurrence.gt(90).mask(1);

// Generate a histogram object and print it to the console tab.
var histogram = ui.Chart.image.histogram({
  image: change,
  region: roi,
  scale: 300,
  minBucketWidth: 10
});
histogram.setOptions({
  title: 'Histogram of surface water change intensity.'
});
print(histogram);

// Summarize transition classes in a region of interest.
var area_image_with_transition_class = ee.Image.pixelArea().addBands(transition);
var reduction_results = area_image_with_transition_class.reduceRegion({
  reducer: ee.Reducer.sum().group({
    groupField: 1,
    groupName: 'transition_class_value',
  }),
  geometry: roi,
  scale: 30,
  bestEffort: true,
});
print('reduction_results', reduction_results);

var roi_stats = ee.List(reduction_results.get('groups'));

var transition_fc = ee.FeatureCollection(roi_stats.map(createFeature));
print('transition_fc', transition_fc);

// Add a summary chart.
var transition_summary_chart = ui.Chart.feature.byFeature({
    features: transition_fc,
    xProperty: 'transition_class_name',
    yProperties: ['area_m2', 'transition_class_number']
  })
  .setChartType('PieChart')
  .setOptions({
    title: 'Summary of transition class areas',
    slices: createPieChartSliceDictionary(transition_fc),
    sliceVisibilityThreshold: 0  // Don't group small slices.
  });
print(transition_summary_chart);

//////////////////////////////////////////////////////////////
// Map Layers
//////////////////////////////////////////////////////////////

Map.addLayer({
  eeObject: water_mask,
  visParams: VIS_WATER_MASK,
  name: '90% occurrence water mask',
  shown: false
});
Map.addLayer({
  eeObject: occurrence.updateMask(occurrence.divide(100)),
  name: "Water Occurrence (1984-2019)",
  visParams: VIS_OCCURRENCE,
  shown: false
});
Map.addLayer({
  eeObject: change,
  visParams: VIS_CHANGE,
  name: 'occurrence change intensity',
  shown: false
});
var watTranColor = [
        'ffffff', '0000ff', '22b14c', 'd1102d', '99d9ea',
        'b5e61d', 'e6a1aa', 'ff7f27', 'ffc90e', '7f7f7f',
        'c3c3c3'
    ],
    watTranName = [
        'No change', 'Permanent', 'New permanent',
        'Lost permanent', 'Seasonal', 'New seasonal',
        'Lost seasonal', 'Seasonal to permanent',
        'Permanent to seasonal', 'Ephemeral permanent',
        'Ephemeral seasonal'
    ];
    
Map.addLayer(transition, {min: 0, max: 10, palette: watTranColor}, 'water transîtion');

Export.image.toDrive({
    image: transition,
    folder: 'iraq',
    description: 'IraqWatTrans',
    scale: 120,
    region: roi
});


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
for (var i = 0; i < 11; i++) {
  legend.add(makeRow(watTranColor[i], watTranName[i]));
  }  
  
// add legend to map (alternatively you can also print the legend to the console)
Map.add(legend);