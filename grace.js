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
var visPara = {min: -5, max: 5, palette: ['red', 'green', 'blue']}
Map.addLayer(meanGRACE, visPara,'20 yr mean GRACE');

// set position of panel
var legend = ui.Panel({
style: {
position: 'bottom-left',
padding: '8px 15px'
}
});
 
// Create legend title
var legendTitle = ui.Label({
value: 'cm w.e.',
style: {
fontWeight: 'bold',
fontSize: '18px',
margin: '0 0 4px 0',
padding: '0'
}
});
 
// Add the title to the panel
legend.add(legendTitle);
 
// create the legend image
var lon = ee.Image.pixelLonLat().select('latitude');
var gradient = lon.multiply((visPara.max-visPara.min)/100.0).add(visPara.min);
var legendImage = gradient.visualize(visPara);
 
// create text on top of legend
var panel = ui.Panel({
widgets: [
ui.Label(visPara['max'])
],
});
 
legend.add(panel);
 
// create thumbnail from the image
var thumbnail = ui.Thumbnail({
image: legendImage,
params: {bbox:'0,0,10,100', dimensions:'10x200'},
style: {padding: '1px', position: 'bottom-center'}
});
 
// add the thumbnail to the legend
legend.add(thumbnail);
 
// create text on top of legend
var panel = ui.Panel({
widgets: [
ui.Label(visPara['min'])
],
});
 
legend.add(panel);
 
Map.add(legend);