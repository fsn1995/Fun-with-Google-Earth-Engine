/* 
This is a function to normalize image pixels in an imageCollection
Reference: https://gis.stackexchange.com/questions/313394/normalization-in-google-earth-engine
Shunan Feng: fsn.1995@gmail.com
*/
var normalization = function(image) {
    var imMinMax = image.reduceRegion({
        reducer: ee.Reducer.minMax(),
        geometry: image.geometry(),
        // scale: 1000,
        maxPixels: 10e9,
        bestEffort: true,
        tileScale: 16
    });
    var imNorm = ee.ImageCollection.fromImages(
        image.bandNames().map(function(name){
            name = ee.String(name);
            var band = image.select(name);
            return band.unitScale(ee.Number(imMinMax.get(name.cat('_min'))), ee.Number(imMinMax.get(name.cat('_max'))));
        })
    );
    return imNorm.toBands().rename(image.bandNames());
};
var imNormalize = function(imcollection){
  return imcollection.map(normalization);
};
exports.imNormalize = imNormalize;