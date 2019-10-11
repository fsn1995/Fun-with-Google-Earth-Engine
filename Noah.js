/*
This script computes, displays and exports the mean annual temperature,
mean annual precipitation. Climate data is NOAH Global Land Assimulation 
System data. 
Note: It would take a long time to compute so it might be good to export 
through task. In my own exprience it would take 15 hours to finish 30 yr 
of data processing.

Shunan Feng: fsn.1995@gmail.com
*/

//-------------------------------------------------------------------//
//                            preparation                            //
//-------------------------------------------------------------------//

// study time range
var year_start = 1984; 
var year_end = 2018;
var month_start = 1;
var month_end = 12;

var date_start = ee.Date.fromYMD(year_start, 1, 1);
var date_end = ee.Date.fromYMD(year_end, 12, 31);
var years = ee.List.sequence(year_start, year_end);// time range of years
var months = ee.List.sequence(month_start, month_end);// time range of months

// load noah data
var gldas1 = ee.ImageCollection("NASA/GLDAS/V20/NOAH/G025/T3H")
               .filterDate(date_start, '1999-12-31');
var gldas2 = ee.ImageCollection("NASA/GLDAS/V021/NOAH/G025/T3H")
               .filterDate(date_start, date_end);
var gldas = gldas1.merge(gldas2);

var gldasTemp = gldas.select('Tair_f_inst');
var gldasPrec = gldas.select('Rainf_f_tavg');
// print(gldasTemp);

//-------------------------------------------------------------------//
//                     mean annual temerature                        //
//-------------------------------------------------------------------//
// MAT is the average of the annual temperature. The unit is converted
// from K to celcius degree
var tempAnnual = ee.ImageCollection.fromImages(
    years.map(function (y) {
        var meanT = gldasTemp.filter(ee.Filter.calendarRange(y, y, 'year'))
                             .mean()
                             .rename('MAT');
    return meanT.set('year', y)
                .set('system:time_start', ee.Date.fromYMD(y, 1, 1));
    }).flatten()
);
var MAT = tempAnnual.mean().subtract(273.15);
print(MAT, 'mean annual temperature');
Map.addLayer(MAT, {min: -10, max: 30, palette: ['blue', 'green', 'red']}, 'mean annual temperature');

// export
Export.image.toAsset({
    image: MAT,
    description: 'MAT20yrNoah',
    assetId: 'MAT20yrNoah',
    scale: 10000,
    // region: roi
  });
Export.image.toDrive({
  image: MAT,
  folder: 'gee',
  description: 'MAT20yrNoah',
  scale: 10000,
//   region: roi
});

//-------------------------------------------------------------------//
//                     mean annual precpitation                      //
//-------------------------------------------------------------------//
// The unit of precipitation (Rainf_f_tavg) is kg/m^2/s. The temporal 
// resolution is every 3 hours (8 image per day)
var multPrec = function(image) {
  var precUnit = image.multiply(3 * 60 * 60);
  return image.addBands(precUnit);
};

gldasPrec = gldasPrec.map(multPrec);

var precAnnual = ee.ImageCollection.fromImages(
  years.map(function (y) {
    var meanP = gldasPrec.select('Rainf_f_tavg_1')
                         .filter(ee.Filter.calendarRange(y, y, 'year'))
                         .sum()
                         .rename('MAP');
  return meanP.set('year', y)
              .set('system:time_start', ee.Date.fromYMD(y, 1, 1));
  }).flatten()
);

var MAPr = precAnnual.mean();
Map.addLayer(MAPr, {min: 0, max: 2000, palette: ['red', 'green', 'blue']}, 'mean annual precipitation');
print(MAPr, 'mean annual precipitation');

// export
Export.image.toAsset({
  image: MAPr,
  description: 'MAP20yrNoah',
  assetId: 'MAP20yrNoah',
  scale: 10000,
  // region: roi
});
Export.image.toDrive({
image: MAPr,
folder: 'gee',
description: 'MAP20yrNoah',
scale: 10000,
//   region: roi
});