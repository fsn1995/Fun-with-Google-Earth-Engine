/*
This script displays The Köppen-Geiger climate map with a spatial 
resolution of 5 arc minutes for the period of 1986-2010.
The legend will be displayed in the console.

reference:
Kottek, M., J. Grieser, C. Beck, B. Rudolf, and F. Rubel, 2006: 
World Map of the Köppen-Geiger climate classification updated. 
Meteorol. Z., 15, 259-263. DOI: 10.1127/0941-2948/2006/0130
http://koeppen-geiger.vu-wien.ac.at/

Shunan Feng: fsn.1995@gmail.com
*/

var image = ee.Image("users/fsn1995/Global_19862010_KG_5m");
var koppenColor = [
  "960000", "FF0000", "FF6E6E", "FFCCCC", "CC8D14", "CCAA54", 
  "FFCC00", "FFFF64", "007800", "005000", "003200", "96FF00", 
  "00D700", "00AA00", "BEBE00", "8C8C00", "5A5A00", "550055", 
  "820082", "C800C8", "FF6EFF", "646464", "8C8C8C", "BEBEBE", 
  "E6E6E6", "6E28B4", "B464FA", "C89BFA", "C8C8FF", "6496FF", 
  "64FFFF", "F5FFFF"
  ],
    koppenName = [
     'Af', 'Am', 'As', 'Aw', 'BSh', 'BSk', 'BWh', 'BWk', 'Cfa',
     'Cfb','Cfc', 'Csa', 'Csb', 'Csc', 'Cwa','Cwb', 'Cwc', 'Dfa',
     'Dfb', 'Dfc','Dfd', 'Dsa', 'Dsb', 'Dsc', 'Dsd','Dwa', 'Dwb',
     'Dwc', 'Dwd', 'EF','ET'
  ];
  
var koppen = image.updateMask(image.lte(30));
Map.addLayer(koppen, {min: 0, max: 30, palette: koppenColor});

// add legend, 
// set position of panel
var legend = ui.Panel({
    style: {
      position: 'bottom-left',
      padding: '8px 15px'
    }
  });
   
// Create legend title
var legendTitle = ui.Label({
  value: 'Legend',
  style: {
    fontWeight: 'bold',
    fontSize: '18px',
    margin: '0 0 4px 0',
    padding: '0'
    }
});
  
// Add the title to the panel
legend.add(legendTitle);
  
// Creates and styles 1 row of the legend.
var makeRow = function(color, name) {
  
      // Create the label that is actually the colored box.
      var colorBox = ui.Label({
        style: {
          backgroundColor: '#' + color,
          // Use padding to give the box height and width.
          padding: '8px',
          margin: '0 0 4px 0'
        }
      });
  
      // Create the label filled with the description text.
      var description = ui.Label({
        value: name,
        style: {margin: '0 0 4px 6px'}
      });
  
      // return the panel
      return ui.Panel({
        widgets: [colorBox, description],
        layout: ui.Panel.Layout.Flow('horizontal')
      });
};
  
  
// Add color and and names
for (var i = 0; i < 31; i++) {
  legend.add(makeRow(koppenColor[i], koppenName[i]));
  }  
  
// add legend to map (alternatively you can also print the legend to the console)
// Map.add(legend);
print(legend);
  