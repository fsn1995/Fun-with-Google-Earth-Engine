/*
This experiment applies unsupervised classification to high resolution
aerial photo (Planet Lab) of Beirut.
Shunan Feng: fsn.1995@gmail.com
*/

var roi = 
    /* color: #d63000 */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[35.48829932537319, 33.911504110472386],
          [35.48829932537319, 33.86219806834452],
          [35.572070077326316, 33.86219806834452],
          [35.572070077326316, 33.911504110472386]]], null, false);
          
var dataset = ee.ImageCollection('SKYSAT/GEN-A/PUBLIC/ORTHO/RGB')
                .filterBounds(roi);
var rgb = dataset.select(['R', 'G', 'B']);

var rgbVis = {
  min: 11.0,
  max: 190.0,
};
// Map.setCenter(-70.892, 41.6555, 15);
Map.addLayer(rgb, rgbVis, 'RGB');

var image = ee.Image('SKYSAT/GEN-A/PUBLIC/ORTHO/RGB/s02_20150501T075912Z').clip(roi);
// traning
var training = image.sample({
    region: roi,
    scale: 1,
    numPixels: 10000
});

// //-----------------------------------------------------------------//
// //                         Classification                          //
// //-----------------------------------------------------------------//

// change the number of classes here, 5 means 5 classes
var clusterer = ee.Clusterer.wekaKMeans(7).train(training);

// // Cluster the input using the trained clusterer.
var classified = image.cluster(clusterer);
Map.addLayer(classified.randomVisualizer(), {}, 'clusters');