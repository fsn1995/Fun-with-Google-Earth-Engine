/* DEM Terrain calculator
This script produces terrain products (slope, aspect, hillshade) from 
ALOS DSM data. The slopes will be further classified into several zones.
The classified zones will be exported as shapefile to google drive. 

reference:
https://developers.google.com/earth-engine/tutorial_api_03
https://developers.google.com/earth-engine/datasets/catalog/JAXA_ALOS_AW3D30_V2_2)
Shunan Feng fsn.1995@gmail.com
*/

var roi = /* color: #0b4a8b */ee.Geometry.Polygon(
    [[[13.390630861222851, 46.719563388231194],
      [13.083013673722851, 46.26575660245042],
      [13.654302736222851, 44.75691229325016],
      [17.389654298722853, 41.84750603559792],
      [20.993169923722853, 36.468163609462785],
      [25.29981054872285, 34.21002739986505],
      [26.829858429987993, 35.16219981454796],
      [31.36426367372285, 48.58427260157197],
      [16.854332181117915, 47.768168652372744]]]);
      

var dataset = ee.Image('JAXA/ALOS/AW3D30/V2_2');

var elevation = dataset.select('AVE_DSM').clip(roi);
var elevationVis = {
  min: -70,
  max: 3000,
  palette: ['0000ff', '00ffff', 'ffff00', 'ff0000', 'ffffff'],
};
Map.addLayer(elevation, elevationVis, 'Elevation');

// calculate the slope
var ALOSterrain = ee.Terrain.products(elevation);

var imMinMax = ALOSterrain.reduceRegion({
    reducer: ee.Reducer.minMax(),
    geometry: roi,
    scale: 3000,
    // bestEffort: Boolean,
    tileScale: 4
});
print(imMinMax);


Map.addLayer(ALOSterrain.select('slope'), {min: 0, max: 27}, 'slope');
Map.addLayer(ALOSterrain.select('aspect'), {min: 0, max: 360}, 'aspect');

var slope = ALOSterrain.select('slope');
var zones = slope.gte(2).add(slope.gte(7)).add(slope.gte(12)).add(slope.gte(25));
zones = zones.updateMask(zones.neq(0));
var vectors = zones.addBands(slope).reduceToVectors({
    geometry: roi,
    scale: 1000,
    geometryType: 'polygon',
    eightConnected: false,
    labelProperty: 'slope zones',
    reducer: ee.Reducer.mean()
});

Map.addLayer(zones, {min: 1, max: 4, palette: ['0000FF', '00FF00', 'FF0000', 'ffffff']}, 'slope zones');

Export.table.toDrive({
    collection: vectors,
    folder:'gee',
    fileFormat: 'SHP', // "CSV" (default), "GeoJSON", "KML", "KMZ", or "SHP", or "TFRecord".
    description: 'slopeZones'
});