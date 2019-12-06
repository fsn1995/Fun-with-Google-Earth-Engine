/*
This is to investigate the area changes of surface water during
the Myanmar flood 2018. It shows the flooded area changes derived 
from Sentinel 1.
You can check the timeseries of area change plots in the console
and export the image as a video.

Reference: https://google.earthengine.app/view/split-panel

Shunan Feng 冯树楠: sfeng@icrc.org
*/

var roi = 
    /* color: #d63000 */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[96.69602272949214, 17.773819747736624],
          [96.69602272949214, 17.450517032412463],
          [97.01084969482417, 17.450517032412463],
          [97.01084969482417, 17.773819747736624]]], null, false);
          
Map.addLayer(roi);
Map.setCenter(96.7846, 17.6623, 12); // set map center

var imgVV = ee.ImageCollection('COPERNICUS/S1_GRD')
        .filterBounds(roi)
        .filterDate('2018-07-09', '2018-09-15')
        .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
        .filter(ee.Filter.eq('instrumentMode', 'IW'))
        .select('VV')
        .sort('system:time_start')
        .map(function(image) {
          var edge = image.lt(-30.0);
          var maskedImage = image.mask().and(edge.not());
          return image.updateMask(maskedImage);
        })
        ;
// add date
imgVV = imgVV.map(function (image) {
    return image.set('date', image.date()).clip(roi);
});


var desc = imgVV.filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'));
var asc = imgVV.filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'));

// traning
var training = asc.first().sample({
    region: roi,
    scale: 10,
    numPixels: 500
});
// var training = desc.first().sample({
//     region: roi,
//     scale: 10,
//     numPixels: 5000
// });

var clusterer = ee.Clusterer.wekaKMeans(2).train(training);

var addClass = function(image) {
    return image.addBands(image.cluster(clusterer)).clip(roi);
};

var classified = asc.map(addClass)
                    .map(function (image) {
                        var mask = image.select('cluster').eq(1);
                        return image.updateMask(mask);
                    });
// var classified = desc.map(addClass);
print(classified);

// Map.addLayer(asc.first(), {min: -25, max: 5, palette: ['aqua', 'black']});
Map.addLayer(asc.filterMetadata('system:time_start', 'equals', 1533123926000), 
  {min: -25, max: 5, palette: ['aqua', 'black']} ,'sentinel 1 2018-07-26');
Map.addLayer(classified.filterMetadata('system:time_start', 'equals', 1533123926000).select('cluster'), 
  {min: 0, max: 1, palette: ['white', 'black']}, 'water mask');

// Create a time series chart.
var classTimeSeries = ui.Chart.image.seriesByRegion(
    classified, roi, ee.Reducer.count(), 'cluster', 200, 'system:time_start', 'label')
        .setChartType('ScatterChart')
        .setOptions({
          title: 'Area changes of water during flood in Myanmar 2018',
          vAxis: {title: 'Area (pixels 100m2)'},
          lineWidth: 1,
          pointSize: 4,
          series: {
            0: {color: 'FF0000'} // water
            // 1: {color: '00FF00'} // land
}});

// Display chart
print(classTimeSeries);

// export video
var videoParams = {bands: ['VV'], min: -25, max: 5};
var addRGB = function(image) {
    var rgb = image.visualize(videoParams);
    return image.addBands(rgb);
  };

var videoRGB = classified.select('VV').map(addRGB);
print(videoRGB);
Export.video.toDrive({
  collection: videoRGB.select(['viz-red', 'viz-green', 'viz-blue']),
  description:'BDisland',
  dimensions: 720,
  framesPerSecond: 1,
  region: roi
});