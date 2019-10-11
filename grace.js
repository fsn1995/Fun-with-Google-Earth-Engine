/*
This script displays the long term average GRACE data
Shunan Feng: fsn.1995@gmail.com
Just for fun to have a look
*/

// study time range
var year_start = 2001;
var year_end = 2018;
var month_start = 1;
var month_end = 12;

var date_start = ee.Date.fromYMD(year_start, 1, 1);
var date_end = ee.Date.fromYMD(year_end, 12, 31);
var years = ee.List.sequence(year_start, year_end);// time range of years
var months = ee.List.sequence(month_start, month_end);// time range of months


var dataGRACE = ee.ImageCollection("NASA/GRACE/MASS_GRIDS/LAND")
             .filterDate(date_start, date_end);
dataGRACE = dataGRACE.map(function(image) {
    return image.addBands(
        image.expression('(a1 + b1 +c1) / 3.0', {
            a1: image.select('lwe_thickness_csr'),
            b1: image.select('lwe_thickness_gfz'),
            c1: image.select('lwe_thickness_jpl'),
        }).rename('cmlwe_mean')
    );
});

// print(dataGRACE);
var meanGRACE = dataGRACE.select('cmlwe_mean').mean();
print(meanGRACE);
Map.addLayer(meanGRACE, {min: -5, max: 5, 
    palette: ['red', 'green', 'blue']},'20 yr mean GRACE');