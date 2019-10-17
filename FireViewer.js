// a quick assessment of the major fire events using MODIS product
// Shunan Feng: sfeng@icrc.org
var worldmap = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017'); //

var country = ['Syria'];//CHANGE the NAME of country here!

var countryshape = worldmap.filter(ee.Filter.inList('country_na', country));// country 
var roi = countryshape.geometry();// country 

var dataset = ee.ImageCollection('FIRMS')
                .filterDate('2019-10-14', '2019-10-17') //change the date here
                .filterBounds(roi);
var fires = dataset.select('T21').max().clip(roi);

var firesVis = {
  min: 325.0,
  max: 400.0,
  palette: ['red', 'orange', 'yellow'],
};
Map.centerObject(roi, 6);
Map.addLayer(fires, firesVis, 'Fires');

// convert the fires to vector and export
var zones = fires.gt(0);
zones = zones.updateMask(fires);
// Map.addLayer(zones, {}, 'fire extent');
var fireZones = zones.reduceToVectors({
    geometry: roi,
    crs: fires.projection(),
    scale: 1000,
    geometryType: 'polygon'
});

// var display = ee.Image(0).updateMask(0).paint(fireZones, '000000', 3);
// Map.addLayer(display, {palette: '000000'}, 'vectors');
Export.table.toDrive({
    collection: fireZones,
    folder:'gee',
    fileFormat: 'KML',
    description: 'fireExtent'
});