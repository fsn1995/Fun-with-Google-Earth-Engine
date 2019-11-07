/*
This script uses MODIS 1km NDVI product and analyzes the long term trend of 
NDVI by Mann-Kendal's test.The tau value ranges from -1 to 1. Positive 
values (green) indicate an increase in the trend while negative values 
suggest the trend of decreasing of vegetation.

Note: unfortunately the p-value is disabled for the moment by Google, 
therefore, the result could only be used for an indication of the trend. 
                                             
Contact: Shunan Feng (冯树楠): fsn.1995@gmail.com                      
*/

//------------------------------------------------------------------------//
//                             Preparation                                //
//------------------------------------------------------------------------//

// study time range
var year_start = 2001; //  MODIS NDVI 2000-02-18T00:00:00 - Present
var year_end = 2018;
var month_start = 1;
var month_end = 12;

var date_start = ee.Date.fromYMD(year_start, 1, 1);
var date_end = ee.Date.fromYMD(year_end, 12, 31);

// The defalt setting will correlate 2 month time scale of SPEI(SPEI2m)
// with one month lag of three month sum of NDVI anomalies.

//------------------------------------------------------------------------//
//                               Datainput                                //
//------------------------------------------------------------------------//

// load MODIS NDVI 2000-02-18T00:00:00 - Present
var ndvi = ee.ImageCollection('MODIS/006/MOD13A2')
    .filterDate(date_start, date_end)
    .select('NDVI');

var ndviTrend = ndvi.reduce(ee.Reducer.kendallsCorrelation());

var corrParams = {min: -1, max: 1, palette: ['red', 'white', 'green']};
Map.addLayer(ndviTrend.select('NDVI_tau'), corrParams, 'Mann-Kendall test');