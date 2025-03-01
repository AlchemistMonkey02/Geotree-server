const generateKML = (plantation) => {
    // Format tree species information with percentages
    const totalTrees = plantation.numberOfTrees;
    const treeSpeciesInfo = plantation.treeSpecies
        .map(species => {
            const percentage = ((species.quantity / totalTrees) * 100).toFixed(1);
            return `
            ${species.name}:
            - Quantity: ${species.quantity} trees
            - Percentage: ${percentage}%`;
        })
        .join('\n');

    const kmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
    <Document>
        <name>Block Plantation - ${plantation._id}</name>
        <description><![CDATA[
<h2>Plantation Details</h2>
<table style="width:100%; border-collapse: collapse;">
    <tr><td><b>Organization:</b></td><td>${plantation.organizationType}</td></tr>
    <tr><td><b>Total Trees:</b></td><td>${plantation.numberOfTrees}</td></tr>
    <tr><td><b>Area:</b></td><td>${plantation.plantationArea.value} ${plantation.plantationArea.unit}</td></tr>
    <tr><td><b>Date:</b></td><td>${new Date(plantation.plantationDate).toLocaleDateString()}</td></tr>
    ${plantation.status ? `<tr><td><b>Status:</b></td><td>${plantation.status}</td></tr>` : ''}
</table>

<h3>Tree Species Distribution</h3>
<table style="width:100%; border-collapse: collapse;">
    ${plantation.treeSpecies.map(species => {
        const percentage = ((species.quantity / totalTrees) * 100).toFixed(1);
        return `<tr>
            <td><b>${species.name}:</b></td>
            <td>${species.quantity} trees (${percentage}%)</td>
        </tr>`;
    }).join('')}
</table>
]]></description>

        <!-- Styles -->
        <Style id="boundaryStyle">
            <LineStyle>
                <color>ff00ff00</color>
                <width>3</width>
            </LineStyle>
            <PolyStyle>
                <color>4000ff00</color>
            </PolyStyle>
        </Style>

        <Style id="centerStyle">
            <IconStyle>
                <Icon>
                    <href>http://maps.google.com/mapfiles/kml/paddle/grn-circle.png</href>
                </Icon>
                <scale>1.2</scale>
            </IconStyle>
            <LabelStyle>
                <scale>1.0</scale>
            </LabelStyle>
        </Style>

        <!-- Different colored icons for different species -->
        ${plantation.treeSpecies.map((_, index) => `
        <Style id="treeStyle${index}">
            <IconStyle>
                <Icon>
                    <href>http://maps.google.com/mapfiles/kml/shapes/tree.png</href>
                </Icon>
                <color>${getColorForIndex(index)}</color>
                <scale>0.8</scale>
            </IconStyle>
            <LabelStyle>
                <scale>0.7</scale>
            </LabelStyle>
        </Style>`).join('')}`;

    const placemarkStart = `
        <Placemark>
            <name>Plantation Boundary</name>
            <description><![CDATA[
                <b>Total Area:</b> ${plantation.plantationArea.value} ${plantation.plantationArea.unit}<br>
                <b>Total Trees:</b> ${plantation.numberOfTrees}
            ]]></description>
            <styleUrl>#boundaryStyle</styleUrl>
            <Polygon>
                <outerBoundaryIs>
                    <LinearRing>
                        <coordinates>`;

    const coordinateString = plantation.boundaries.coordinates[0]
        .map(coord => `${coord[0]},${coord[1]},0`)
        .join(' ');

    const placemarkEnd = `
                        </coordinates>
                    </LinearRing>
                </outerBoundaryIs>
            </Polygon>
        </Placemark>`;

    const centerPoint = `
        <Placemark>
            <name>Plantation Center</name>
            <description><![CDATA[
                <h3>Central Location</h3>
                <p><b>Coordinates:</b> ${plantation.location.coordinates[1]}, ${plantation.location.coordinates[0]}</p>
                <h4>Tree Species Summary:</h4>
                ${plantation.treeSpecies.map(species => {
                    const percentage = ((species.quantity / totalTrees) * 100).toFixed(1);
                    return `<p>🌳 <b>${species.name}:</b> ${species.quantity} trees (${percentage}%)</p>`;
                }).join('')}
            ]]></description>
            <styleUrl>#centerStyle</styleUrl>
            <Point>
                <coordinates>${plantation.location.coordinates[0]},${plantation.location.coordinates[1]},0</coordinates>
            </Point>
        </Placemark>`;

    // Add individual placemarks for each tree species in a larger circle
    const treeSpeciesPlacemarks = plantation.treeSpecies.map((species, index) => {
        // Calculate position in a larger circle around the center point
        const angle = (2 * Math.PI * index) / plantation.treeSpecies.length;
        const radius = 0.0002; // Increased radius (about 20 meters)
        const lng = plantation.location.coordinates[0] + radius * Math.cos(angle);
        const lat = plantation.location.coordinates[1] + radius * Math.sin(angle);
        const percentage = ((species.quantity / totalTrees) * 100).toFixed(1);

        return `
        <Placemark>
            <name>${species.name}</name>
            <description><![CDATA[
                <h3>${species.name}</h3>
                <table style="width:100%">
                    <tr><td><b>Quantity:</b></td><td>${species.quantity} trees</td></tr>
                    <tr><td><b>Percentage:</b></td><td>${percentage}%</td></tr>
                </table>
            ]]></description>
            <styleUrl>#treeStyle${index}</styleUrl>
            <Point>
                <coordinates>${lng},${lat},0</coordinates>
            </Point>
        </Placemark>`;
    }).join('');

    const kmlFooter = `
    </Document>
</kml>`;

    return kmlHeader + placemarkStart + coordinateString + placemarkEnd + centerPoint + treeSpeciesPlacemarks + kmlFooter;
};

// Helper function to generate different colors for tree species
function getColorForIndex(index) {
    const colors = [
        'ff00ff00', // Green
        'ff0000ff', // Red
        'ffff0000', // Blue
        'ff00ffff', // Yellow
        'ffff00ff', // Magenta
        'ffffff00', // Cyan
        'ff007fff', // Orange
        'ff7f00ff', // Purple
        'ff00ff7f', // Lime
        'ff7fff00'  // Sky Blue
    ];
    return colors[index % colors.length];
}

module.exports = { generateKML }; 