/*
This script computes, displays and exports the mean annual temperature,
mean annual precipitation. Climate data is NOAH Global Land Assimulation 
System data. 
Thanks to the awesome geetools by @author: Rodrigo E. Principe 
https://github.com/fitoprincipe/geetools-code-editor/wiki
we could batch export the imageCollection of monthly climate data. 
(by default, the batch process of monthly data is commented as it takes 
a lot of computing resources)

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

// import batch module
var batch = require('users/fitoprincipe/geetools:batch');

//-------------------------------------------------------------------//
//                     mean annual temerature                        //
//-------------------------------------------------------------------//
// MAT is the average of the annual temperature. The unit is converted
// from K to celcius degree
var multTemp = function(image) {
    var tempUnit = image.subtract(273.15);
    return image.addBands(tempUnit);
  };
gldasTemp = gldasTemp.map(multTemp);

var tempAnnual = ee.ImageCollection.fromImages(
    years.map(function (y) {
        var meanT = gldasTemp.select('Tair_f_inst_1')
                             .filter(ee.Filter.calendarRange(y, y, 'year'))
                             .mean()
                             .rename('MAT');
    return meanT.set('year', y)
                .set('system:time_start', ee.Date.fromYMD(y, 1, 1));
    }).flatten()
);
var MAT = tempAnnual.mean();
// print(MAT, 'mean annual temperature');
// Map.addLayer(MAT, {min: -10, max: 30, palette: ['blue', 'green', 'red']}, 'mean annual temperature');

// mean monthly temperature
var tempMonthly = ee.ImageCollection.fromImages(
  years.map(function (y) {
    return months.map(function (m) {
      var meanT =  gldasTemp.select('Tair_f_inst_1')
                            .filter(ee.Filter.calendarRange(y, y, 'year'))
                            .filter(ee.Filter.calendarRange(m, m, 'month'))
                            .mean()
                            .rename('MMT');
      return meanT.set('year', y)
                  .set('month', m)
                  .set('system:time_start', ee.Date.fromYMD(y, m, 1));                      
    });
  }).flatten()
);

// export
Export.image.toAsset({
    image: MAT,
    description: 'MAT30yrNoah',
    assetId: 'MAT30yrNoah',
    scale: 10000,
    // region: roi
  });
Export.image.toDrive({
  image: MAT,
  folder: 'gee',
  description: 'MAT30yrNoah',
  scale: 10000,
//   region: roi
});

// // batch export
// batch.Download.ImageCollection.toAsset(tempMonthly.select('MMT'), 'noah', 
//                 {name: 'MMT30yr',
//                 //  scale: 10000, 
//                  region: tempMonthly.first().geometry()
//                 });

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

// mean monthly precipitation
var precMonthly = ee.ImageCollection.fromImages(
  years.map(function (y) {
    return months.map(function (m) {
      var meanP =  gldasPrec.select('Rainf_f_tavg_1')
                            .filter(ee.Filter.calendarRange(y, y, 'year'))
                            .filter(ee.Filter.calendarRange(m, m, 'month'))
                            .sum()
                            .rename('MMP');
      return meanP.set('year', y)
                  .set('month', m)
                  .set('system:time_start', ee.Date.fromYMD(y, m, 1));                      
    });
  }).flatten()
);


// export
Export.image.toAsset({
  image: MAPr,
  description: 'MAP30yrNoah',
  assetId: 'MAP30yrNoah',
  scale: 10000,
  // region: roi
});

Export.image.toDrive({
image: MAPr,
folder: 'gee',
description: 'MAP30yrNoah',
scale: 10000,
//   region: roi
});

// // batch export
// batch.Download.ImageCollection.toAsset(precMonthly.select('MMP'), 'noah', 
//                 {name: 'MMP30yr',
//                 //  scale: 10000, 
//                  region: precMonthly.first().geometry()
//                 });
