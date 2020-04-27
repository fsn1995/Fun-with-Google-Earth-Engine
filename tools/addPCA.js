/* This is a function that applies Principal Compnent Analysis 
to imageCollection and returns 1st, 2nd and 3rd PCA components

Reference:
https://developers.google.com/earth-engine/edu
*/
var addPCA = function(image, bands) {
    var arrayImage = image.select(bands).toArray();
    var covar = arrayImage.reduceRegion({
        reducer: ee.Reducer.covariance(),
        tileScale: 1,
        scale: 10000,
        // maxPixels: 1e9,
        bestEffort: true,
        geometry: image.geometry()
    });
    var covarArray = ee.Array(covar.get('array'));
    var eigens = covarArray.eigen();
    var eigenVectors = eigens.slice(1,1);
    var principalComponents = ee.Image(eigenVectors)
                                .matrixMultiply(arrayImage.toArray(1));
    var pcImage = principalComponents.arrayProject([0])
                                     .arrayFlatten([['pc1', 'pc2', 'pc3']]);
    return image.addBands(pcImage);
};

var imPCA = function(imcollection, imbands){
    var bands = imbands;
    return imcollection.map(addPCA);
};
exports.imPCA = imPCA;